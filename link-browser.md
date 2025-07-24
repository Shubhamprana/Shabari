

### **Prompt for Cursor AI: Implementing Shabari's Link & Browser Protection**

**Hello Cursor AI.** Your task is to implement the complete link verification and secure Browse logic for the Shabari application using React Native and Expo.

**Core Principles:**
1.  **Privacy First:** No user Browse history or scanned links will ever be sent to our Supabase backend. All checks are either on-device or through anonymous, stateless API calls to third parties like VirusTotal.
2.  **Tiered Logic:** The user experience is fundamentally different for Free vs. Premium users. All Premium features must be wrapped in a check against our `subscriptionStore` (e.g., `if (subscriptionStore.isPremium)`).

Please implement the following components and workflows.


### **Part 1: Implement Shared Core Components (The Foundation)**

These components will be used by both Free and Premium workflows.

1.  **Create the `LinkScannerService.ts`:**
    * **Purpose:** A single, reusable service to determine if a URL is safe.
    * **Function Signature:** `export async function scanUrl(url: string): Promise<{ isSafe: boolean; details: string; }>`
    * **Logic:**
        a.  Extract the `hostname` (the domain, e.g., `example.com`) from the full `url`.
        b.  First, perform a query on the **local SQLite database** (`blocklist.db`). `SELECT domain FROM blocklist WHERE domain = ?`.
        c.  `IF` a match is found, immediately `return { isSafe: false, details: 'This site is on the known threat list.' }`. This is the instant, offline check.
        d.  `IF` no local match is found, proceed to the cloud check. Use `axios` to make an anonymous POST request to the VirusTotal `/urls` API endpoint with the URL.
        e.  `AWAIT` the analysis result. Parse the response to check the `malicious` count in the stats.
        f.  `IF` the count is greater than 0, `return { isSafe: false, details: 'Identified as a threat by global security engines.' }`.
        g.  `ELSE`, `return { isSafe: true, details: 'Scanned and found to be safe.' }`.
    * **Error Handling:** Wrap the API call in a `try...catch` block. If the call fails (e.g., no internet), default to a "safe" verdict to avoid blocking legitimate sites during network issues. `return { isSafe: true, details: 'Scan service could not be reached.' }`.

2.  **Setup the Local Blocklist Database:**
    * Use `react-native-sqlite-storage`.
    * Bundle a starting `blocklist.db` file in the app's assets.
    * On the app's first launch, write logic to copy this database file from the assets to a writable location on the user's device so it can be queried and updated later.

---

### **Part 2: Implement the Free User Experience (Manual Protection)**

**Feature: "Share to Shabari" for Link Scanning**

* **Objective:** Allow free users to manually check any link from any app.
* **Implementation Steps:**
    1.  **Configure Share Intent:** In the native project files (`AndroidManifest.xml` for Android, `Info.plist` for iOS), configure the app to be a share target for text content (specifically URLs).
    2.  **Handle Incoming Intent:** Use a library like `react-native-receive-sharing-intent` to listen for when the app is opened via a share action.
    3.  **Create the Workflow:**
        a.  When the app receives a shared URL, immediately call our `LinkScannerService.scanUrl(sharedUrl)`.
        b.  While the scan is running, navigate the user to the `ScanResultScreen` and show a loading indicator.
        c.  When the promise from `scanUrl` resolves, update the `ScanResultScreen` with the final verdict (the "SAFE" green UI or "DANGER" red UI).
    4.  **Add Action to "Safe" Result:** On the `ScanResultScreen`, if `isSafe` is true, ensure there is a button with the text `[ Open in Browser ]`. The `onPress` for this button should use React Native's `Linking.openURL()` function to open the verified link in the user's default browser (e.g., Chrome).

---

### **Part 3: Implement the Premium User Experience (Automatic Protection)**

All logic here must be conditional on `isPremium === true`.

#### **A. The Shabari Secure Browser**

* **Objective:** Provide a sandboxed browser where link navigation is pre-screened.
* **Implementation Steps:**
    1.  On the `SecureBrowserScreen.tsx`, implement the `react-native-webview` component.
    2.  Use the `onShouldStartLoadWithRequest` prop (or equivalent). This function is called every time the WebView tries to navigate to a new URL.
    3.  **Implement the interception logic inside this function:**
        a.  `const newUrl = request.url;`
        b.  `const result = await LinkScannerService.scanUrl(newUrl);`
        c.  `IF (result.isSafe === false)`:
            i.   `RETURN false;` // This command tells the WebView to **cancel** the navigation.
            ii.  Then, programmatically navigate the user to the `ScanResultScreen` with the dangerous verdict.
        d.  `ELSE`:
            i.   `RETURN true;` // This command tells the WebView it is **safe to proceed** with loading the page.

#### **B. `GlobalGuard` Real-time Protection**

* **Objective:** To automatically check links clicked in *any* app using the on-device VPN filter.
* **Implementation Steps (in the JavaScript layer):**
    1.  **Create a `GlobalGuardController.ts` service.** This service will be the interface between our React Native code and the native VPN module.
    2.  **Implement Control Functions:** Create `activateGuard()` and `deactivateGuard()` functions. These will call the corresponding methods (`startVpn`, `stopVpn`) on the native module we build. The UI in the Settings screen will call these functions.
    3.  **Implement the Event Listener:**
        a.  The controller must listen for the `onDnsRequest` event emitted from the native module.
        b.  The listener will receive an object like `{ domain: string, requestId: string }`.
        c.  When this event is received, the listener function will immediately call `LinkScannerService.scanUrl(domain)`.
        d.  `AWAIT` the result from the scanner.
        e.  Call the native module's resolver method, passing back the result: `NativeModules.GlobalGuard.resolveDnsRequest(requestId, result.isSafe)`.
    4.  **Implement Notifications:** If `result.isSafe` is `false`, the controller should also trigger a local system notification to the user: *"Shabari blocked a dangerous site: [domain]"*.