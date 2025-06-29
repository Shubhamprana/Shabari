
### **Prompt for Cursor AI: Implementing Shabari's Tiered & Private File Protection**

**Hello Cursor AI.** This is the definitive specification for implementing Shabari's multi-layered file and application defense system.

Your implementation must strictly adhere to our **privacy-first architecture**:
* **Our Backend (Supabase):** Only stores user authentication credentials and their subscription status (`free` or `premium`).
* **User's Device:** No user files, lists of installed apps, or activity logs are ever to be sent to our backend. All security analysis logic and sensitive data reside and are processed on the user's device itself.

You must implement the following workflows, clearly separating the functionality available to **Free** and **Premium** users.

---

### **Part 1: The Free User Experience (The Manual Safety Net)**

This is the baseline protection available to every Shabari user.

**Feature: Manual File Scanning via "Share to Shabari"**

* **Objective:** To provide all users with a powerful, on-demand tool to check any file they are suspicious about, empowering them to take control of their own safety.
* **Implementation Steps:**
    1.  **Configure Share Intent:** In the native project files (`AndroidManifest.xml` and `Info.plist`), register the Shabari app as a share target for all file types (MIME type `*/*`).
    2.  **Handle Incoming File:** Use a library like `react-native-receive-sharing-intent` to listen for when the app is opened via a share action. When triggered, the app will receive the file's content URI.
    3.  **Implement the Workflow:**
        a.  Upon receiving the file's URI, copy the file to the app's internal, sandboxed "quarantine" folder using `react-native-fs` to ensure you have proper access to it.
        b.  Immediately navigate the user to the `ScanResultScreen` and display a "Scanning file..." loading state.
        c.  Call the core `FileScannerService.scanFile(quarantinedFilePath)` function to get the verdict.
        d.  Update the `ScanResultScreen` with the final "Safe" or "Dangerous" UI based on the returned result.
        e.  The `ScanResultScreen` should provide the appropriate actions (e.g., Delete, or Save/Open if safe) as previously specified.

---

### **Part 2: The Premium User Experience (The Automatic Guardian)**

The following features are the core of the Shabari Premium subscription.

**Activation Logic:** The app must contain logic that checks the `subscriptionStore`. If `isPremium` is `true`, these background services should be activated. If `false` (or the subscription expires), these services must be stopped and disabled.


We will build two distinct, premium, Android-only services:
1.  **The `WatchdogFileService`:** For proactive background scanning of new files.
2.  **The `PrivacyGuardService`:** For detecting the installation of potentially malicious applications.

Please implement them as follows.

---

### **Feature 1: `WatchdogFileService` (Proactive Background Scanning)**

**Objective:** To automatically detect and scan any new file saved to the user's public storage (like images or documents from WhatsApp) and to warn the user of a threat *before* they have a chance to open it. This feature must be designed to win the "race against the clock."

**Platform:** Android-only.

**Implementation Details:**

1.  **Create a Native Foreground Service (in Java/Kotlin):**
    * This service must be persistent and start on device boot. It needs to run continuously in the background.
    * It must display a permanent, low-priority notification to the user, such as: *"Shabari is actively protecting your device."* This is a requirement from Android to keep the service alive.

2.  **Implement File Observers:**
    * Inside this native service, instantiate `FileObserver` objects to monitor the key public directories where files are commonly auto-downloaded.
    * The primary target directories are:
        * `Environment.DIRECTORY_DOWNLOADS`
        * `Environment.DIRECTORY_PICTURES`
        * The WhatsApp media directories (e.g., `/storage/emulated/0/WhatsApp/Media/WhatsApp Images/` and `/WhatsApp Documents/`).
    * Configure the observers to listen specifically for the `FileObserver.CREATE` event, which fires the moment a new file is finished being written to the directory.

3.  **Bridge to JavaScript via Headless JS:**
    * When a `FileObserver` detects a `CREATE` event, the native service's job is to immediately trigger a **Headless JS task**. This allows our scanning logic (written in JavaScript) to run in the background without the main app being open.
    * The native code must pass the full, absolute `filePath` of the newly created file as a parameter to this Headless JS task.

4.  **Implement the Headless JS Task (`index.js`):**
    * Register a new Headless JS task named, for example, `fileScannerTask`.
    * This task will receive the `filePath` as data.
    * Inside the task, it will `import` and call our existing `FileScannerService.scanFile(filePath)`. The core scanning logic is reused here.
    * The task must `await` the result of the scan.

5.  **Implement Notification Logic:**
    * `IF` the result from `scanFile` is `{ isSafe: false, details: '...' }`, the Headless JS task must then call another native function to trigger a high-priority system notification.
    * **Notification Content:**
        * **Title:** `🚨 THREAT DETECTED! 🚨`
        * **Body:** `A file named '[filename]' from [source_app, e.g., WhatsApp] is malicious. DO NOT OPEN IT. Tap to manage.`
    * The notification's "tap" action must be configured to open the Shabari app and navigate directly to the `ScanResultScreen`, passing the file details so the user can see the "DANGER" UI and delete the file.
    * `IF` the scan result is "safe," the task must do nothing and terminate silently to avoid disturbing the user.

---


* **Privacy Implementation Note:** The communication with the VirusTotal API must be anonymous. The file hash or its content is sent directly to VirusTotal for analysis and is never associated with the user's Shabari account on our Supabase backend.

### **Feature 2: `PrivacyGuardService` (Post-Infection Detection)**

**Objective:** To act as the final safety net. This service protects against advanced exploits (like a "virus in an image") by detecting the *consequence* of the attack—the unauthorized installation of a malicious application.

**Platform:** Android-only.

**Implementation Details:**

1.  **Create a Native Broadcast Receiver (in Java/Kotlin):**
    * Implement a `BroadcastReceiver` in the native Android code.
    * This receiver must be registered in the `AndroidManifest.xml` to listen for the system-wide broadcast `android.intent.action.PACKAGE_ADDED`. This intent is fired by the OS every time any new app is successfully installed.

2.  **Implement Permission Analysis Logic:**
    * When the `BroadcastReceiver` is triggered, it will receive the `packageName` of the newly installed app.
    * The native code will then use Android's `PackageManager` to get the complete `PackageInfo` for that `packageName`, specifically requesting the `PackageManager.GET_PERMISSIONS` flag.
    * This will return a `String[]` array containing all permissions the new app has declared in its manifest.

3.  **Bridge to JavaScript for Decision Making:**
    * The native receiver will pass this entire `String[]` array of permissions up to the JavaScript layer. This can be done by invoking a Headless JS task, similar to the Watchdog service.

4.  **Implement the JS Logic (`PermissionMonitorService.ts`):**
    * The JS service receives the list of permissions.
    * It must contain a predefined constant array of high-risk permissions:
      `const HIGH_RISK_PERMISSIONS = ['android.permission.BIND_ACCESSIBILITY_SERVICE', 'android.permission.READ_SMS', 'android.permission.BIND_DEVICE_ADMIN', 'android.permission.SYSTEM_ALERT_WINDOW'];`
    * The service will iterate through the permissions from the new app. `IF` it finds a match with any entry in the `HIGH_RISK_PERMISSIONS` array, it will immediately trigger a critical alert notification.

5.  **Implement the Critical Alert Notification:**
    * This notification must have the highest priority.
    * **Title:** `🔒 CRITICAL SECURITY ALERT 🔒`
    * **Body:** `The new app '[appName]' is requesting dangerous permissions that could grant it full device control. This is highly suspicious. Tap to review immediately.`
    * **Tap Action:** The notification's primary action must take the user directly to that specific app's detail page in the Android Settings (`Settings.ACTION_APPLICATION_DETAILS_SETTINGS`), making it as easy as possible for the user to uninstall it.
* **Privacy Implementation Note:** The analysis of installed packages and their permissions must happen **entirely on the user's device**. The list of a user's installed apps must never be transmitted from the device or stored on our backend.









