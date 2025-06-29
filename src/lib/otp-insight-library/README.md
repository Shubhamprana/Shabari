# OTP Insight Library

## Table of Contents
1.  [Introduction](#1-introduction)
2.  [Installation](#2-installation)
3.  [Usage](#3-usage)
    *   [SMS Processing](#31-sms-processing)
    *   [Sender Verification](#32-sender-verification)
    *   [OTP Insight Analysis](#33-otp-insight-analysis)
    *   [Context & Frequency Rules](#34-context--frequency-rules)
    *   [Notifications (Conceptual)](#35-notifications-conceptual)
    *   [Local Storage (Conceptual)](#36-local-storage-conceptual)
    *   [ML Integration (Conceptual)](#37-ml-integration-conceptual)
4.  [Updating DLT Header List](#4-updating-dlt-header-list)
5.  [Privacy & Data Handling](#5-privacy--data-handling)
6.  [Unit Tests](#6-unit-tests)
7.  [License](#7-license)

## 1. Introduction

The OTP Insight Library is a modular JavaScript/TypeScript library designed to provide fraud message detection capabilities for React Native Expo applications. It focuses on analyzing SMS messages for potential fraud, with features including sender verification, OTP content analysis, context-based rules, and conceptual integration for machine learning models. The library is built with a privacy-first approach, ensuring all data processing and storage remain on the user's device.

This library is intended to be integrated into a larger React Native Expo application, where it can be used to provide real-time insights and warnings to users about suspicious messages. While automatic SMS retrieval is a complex native module integration for React Native Expo, this library provides the core logic that can be triggered by user consent or manual input.




## 2. Installation

To use this library in your React Native Expo project, you will need to install it as a dependency. Since this is a conceptual library, you would typically copy the `src` and `assets` folders into your project and then import the modules as needed.

**Prerequisites:**
- Node.js (LTS version recommended)
- npm or pnpm
- React Native Expo project initialized

**Steps:**

1.  **Copy the Library Files:**
    Copy the `src` directory and the `assets` directory from this library into your React Native Expo project (e.g., into a `lib/otp-insight` folder within your project).

    ```bash
    cp -r otp-insight-library/src your-expo-app/lib/otp-insight/src
    cp -r otp-insight-library/assets your-expo-app/lib/otp-insight/assets
    ```

2.  **Install Dependencies (if not already present):**
    Ensure you have the necessary Expo modules installed in your React Native Expo project. These are conceptual dependencies for the features outlined.

    ```bash
    cd your-expo-app
    pnpm add expo-notifications expo-sqlite @react-native-async-storage/async-storage
    # For SMS retrieval, you would typically use a native module like react-native-sms-retriever
    # pnpm add react-native-sms-retriever
    ```

3.  **Configure TypeScript (if using TypeScript):**
    If your Expo project is in TypeScript, ensure your `tsconfig.json` includes the `resolveJsonModule` option to allow importing JSON files directly.

    ```json
    // your-expo-app/tsconfig.json
    {
      "compilerOptions": {
        // ... other options
        "resolveJsonModule": true,
        "esModuleInterop": true,
        // ...
      }
    }
    ```

4.  **Import and Use:**
    You can now import and use the services provided by the library in your React Native Expo components or services.

    ```typescript
    // Example in your React Native Expo component
    import { processSmsForConsent } from ".//lib/otp-insight/src/smsProcessing";
    import { SenderVerificationService } from ".//lib/otp-insight/src/senderVerification";
    import { OTPInsightService } from ".//lib/otp-insight/src/otpInsightService";
    import { UserContextTracker, OtpFrequencyTracker } from ".//lib/otp-insight/src/contextRules";
    import { NotificationBuilder } from ".//lib/otp-insight/src/notificationBuilder";
    import { LocalStorageService } from ".//lib/otp-insight/src/localStorage";
    import { MLIntegrationService } from ".//lib/otp-insight/src/mlIntegration";

    // ... your component logic
    const processedSms = processSmsForConsent("Your OTP is 123456 from VM-HDFCBK");
    const senderService = new SenderVerificationService();
    const senderVerdict = senderService.verifySender("VM-HDFCBK", processedSms.messageText);
    // ... and so on
    ```




## 3. Usage

This section provides detailed instructions and examples on how to utilize each component of the OTP Insight Library within your React Native Expo application.

### 3.1. SMS Processing

The `smsProcessing.ts` module provides a function to process SMS messages. In a real React Native Expo application, you would integrate with platform-specific APIs (like Google SMS User Consent API via `react-native-sms-retriever` for Android) to obtain the SMS text. For the purpose of this library, the `processSmsForConsent` function simulates this step by accepting a raw message string, assuming user consent has already been obtained or the message is manually provided.

**Function:** `processSmsForConsent(rawMessage: string): ProcessedSMS`

-   `rawMessage`: The raw text content of the SMS message received from the device or provided by the user.
-   Returns: An object of type `ProcessedSMS` containing:
    -   `messageText`: The cleaned and trimmed message text.
    -   `timestamp`: The timestamp (in milliseconds since epoch) when the message was processed.

**Example Usage (within your React Native Expo app):**

```typescript
import { processSmsForConsent, ProcessedSMS } from ".//lib/otp-insight/src/smsProcessing";

// In a real scenario, this rawMessage would come from a native SMS listener
// or a text input field where the user pastes the message.
const rawSmsMessage = "Your OTP for transaction is 123456. Do not share.";

try {
  const processedSms: ProcessedSMS = processSmsForConsent(rawSmsMessage);
  console.log("Processed SMS:", processedSms.messageText);
  console.log("Timestamp:", new Date(processedSms.timestamp).toLocaleString());

  // You can then pass this processed SMS to other services for analysis
  // e.g., sender verification, OTP analysis, etc.

} catch (error) {
  console.error("Error processing SMS:", error.message);
}

// For integrating with react-native-sms-retriever (Android specific):
// You would typically have a hook or a component that listens for SMS.
/*
import React, { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import SmsRetriever from 'react-native-sms-retriever';

const SmsListenerComponent: React.FC = () => {
  const [otpMessage, setOtpMessage] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const startSmsListener = async () => {
        try {
          const registered = await SmsRetriever.startSmsRetriever();
          if (registered) {
            console.log('SMS Retriever started successfully');
            SmsRetriever.addSmsListener((event: any) => {
              if (event.message) {
                const processed = processSmsForConsent(event.message);
                setOtpMessage(processed.messageText);
                SmsRetriever.removeSmsListener(); // Stop listening after receiving one OTP
              } else if (event.error) {
                console.error('SMS Retriever error:', event.error);
              }
            });
          } else {
            console.warn('Failed to start SMS Retriever. Ensure app is signed with correct hash.');
          }
        } catch (err) {
          console.error('Error starting SMS Retriever:', err);
        }
      };

      startSmsListener();

      return () => {
        SmsRetriever.removeSmsListener(); // Clean up listener on unmount
      };
    }
  }, []);

  return (
    <View>
      {otpMessage ? (
        <Text>Received and processed OTP: {otpMessage}</Text>
      ) : (
        <Text>Waiting for OTP...</Text>
      )}
    </View>
  );
};

export default SmsListenerComponent;
*/

**Important Considerations for SMS User Consent:**

-   **Android Specific:** The Google SMS User Consent API and `react-native-sms-retriever` are primarily for Android. iOS has different mechanisms for OTP autofill (e.g., associated domains, SMS verification codes in keyboard suggestions) and does not allow programmatic reading of SMS messages for privacy reasons.
-   **App Hash:** For `react-native-sms-retriever` to work on Android, your app needs to be signed with a specific hash that matches the one generated by Google Play Services. This hash must be included in the SMS message sent by your backend for the API to automatically provide the message to your app without requiring `READ_SMS` permission.
-   **User Experience:** Always prioritize clear user consent. The `react-native-sms-retriever` library automatically triggers the OS consent prompt, which is a good privacy practice.




### 3.2. Sender Verification

The `senderVerification.ts` module provides the `SenderVerificationService` class, which helps in assessing the risk level of a message sender and any URLs present in the message. This service uses a local JSON file (`trusted_dlt_headers.json`) containing whitelisted DLT (Distributed Ledger Technology) headers, whitelisted domains for legitimate entities (like banks and e-commerce sites in India), and a list of common URL shorteners.

**Class:** `SenderVerificationService`

**Constructor:** `new SenderVerificationService()`

**Method:** `verifySender(senderId: string, messageText: string): SenderVerificationResult`

-   `senderId`: The sender ID of the message. This can be an alphanumeric DLT header (e.g., `VM-HDFCBK`), a 10-digit number, or other sender identifiers.
-   `messageText`: The full text content of the message.
-   Returns: An object of type `SenderVerificationResult` containing:
    -   `riskLevel`: A categorical value indicating the assessed risk.
        -   `SAFE`: The sender ID is a recognized DLT header and all URLs (if any) are from whitelisted domains.
        -   `SUSPICIOUS`: The sender ID is a 10-digit number, or an alphanumeric header not in the DLT whitelist, or contains a URL that is not whitelisted but also not a known URL shortener.
        -   `HIGH_RISK_FORGERY`: The sender ID is unrecognized (e.g., random alphanumeric) or the message contains a URL from a known URL shortener or an unwhitelisted domain.
    -   `details`: An object providing more granular reasons for the risk assessment:
        -   `missingHeader`: `true` if the sender ID is not a recognized DLT header.
        -   `badURL`: `true` if any URL in the message is from a non-whitelisted domain or a URL shortener.
        -   `isTenDigitNumber`: `true` if the sender ID is a 10-digit number.
        -   `unlistedAlphanumeric`: `true` if the sender ID is an alphanumeric string but not in the DLT whitelist.

**Example Usage:**

```typescript
import { SenderVerificationService, SenderVerificationResult } from ".//lib/otp-insight/src/senderVerification";

const senderService = new SenderVerificationService();

// Example 1: Legitimate SMS from a DLT-registered header with a whitelisted URL
const senderId1 = "VM-HDFCBK";
const messageText1 = "Dear customer, your account has been credited with INR 5000. Check details at https://www.hdfcbank.com/login";
const result1: SenderVerificationResult = senderService.verifySender(senderId1, messageText1);
console.log("Result 1:", result1); // Expected: { riskLevel: 'SAFE', details: { ... } }

// Example 2: Suspicious SMS from a 10-digit number
const senderId2 = "9876543210";
const messageText2 = "Your OTP is 123456. Do not share.";
const result2: SenderVerificationResult = senderService.verifySender(senderId2, messageText2);
console.log("Result 2:", result2); // Expected: { riskLevel: 'SUSPICIOUS', details: { isTenDigitNumber: true, ... } }

// Example 3: High-risk forgery with a URL shortener
const senderId3 = "AX-123XYZ"; // Unlisted alphanumeric
const messageText3 = "Your bank account will be blocked. Update KYC: http://bit.ly/scamlink";
const result3: SenderVerificationResult = senderService.verifySender(senderId3, messageText3);
console.log("Result 3:", result3); // Expected: { riskLevel: 'HIGH_RISK_FORGERY', details: { badURL: true, unlistedAlphanumeric: true, ... } }

// Example 4: Message with an unwhitelisted domain
const senderId4 = "DM-SBIBNK";
const messageText4 = "Important: Your account needs verification. Visit https://secure-update.co/login";
const result4: SenderVerificationResult = senderService.verifySender(senderId4, messageText4);
console.log("Result 4:", result4); // Expected: { riskLevel: 'HIGH_RISK_FORGERY', details: { badURL: true, ... } }
```

**How it Works:**

1.  **Sender ID Check:**
    *   It first checks if the `senderId` is a 10-digit number. If so, it's flagged as `SUSPICIOUS` because legitimate transactional SMS in India typically come from alphanumeric DLT headers, not personal numbers.
    *   If it's not a 10-digit number, it checks if the `senderId` (converted to uppercase) exists in the `dlt_headers` list loaded from `trusted_dlt_headers.json`. These headers are pre-registered with the Telecom Regulatory Authority of India (TRAI) to ensure authenticity.
    *   If the `senderId` is an alphanumeric string but not found in the `dlt_headers` list, it's marked as `SUSPICIOUS` (unlisted alphanumeric).
    *   If the `senderId` doesn't match any known pattern, it's considered a `HIGH_RISK_FORGERY`.

2.  **URL Analysis:**
    *   The service extracts all URLs from the `messageText` using a regular expression.
    *   For each extracted URL, it parses the hostname and checks if the domain is present in the `url_shorteners` list. If a URL shortener is detected, the `riskLevel` is immediately set to `HIGH_RISK_FORGERY` as these are frequently used in phishing attempts to mask the true destination.
    *   If the domain is not a URL shortener, it then checks if the domain is present in the `whitelisted_domains` list. If a domain is not whitelisted, the `riskLevel` is elevated to `HIGH_RISK_FORGERY`.
    *   Error handling is included for invalid URL formats, which also contributes to a `SUSPICIOUS` or `HIGH_RISK_FORGERY` rating.

**Importance of DLT Headers:**

In India, the Telecom Regulatory Authority of India (TRAI) implemented the Distributed Ledger Technology (DLT) regulation to curb unsolicited commercial communication (UCC), including spam and fraudulent messages. Under this regulation, all businesses and telemarketers sending bulk SMS must register their sender IDs (headers) and message templates with DLT platforms. This helps in verifying the authenticity of the sender. Messages from unregistered or suspicious sender IDs are a strong indicator of potential fraud.

**Limitations:**

-   **DLT Header List Maintenance:** The `trusted_dlt_headers.json` file needs to be regularly updated to include new legitimate DLT headers and whitelisted domains. This library does not include an automatic update mechanism.
-   **Evolving Tactics:** Fraudsters constantly find new ways to bypass detection, including using new URL shorteners or dynamic domains. Regular updates to the whitelists are crucial.
-   **Domain Impersonation:** While whitelisting helps, sophisticated attackers might use look-alike domains (typosquatting) that are not in the whitelist. Advanced techniques beyond simple domain matching might be required for such cases.




### 3.3. OTP Insight Analysis

The `otpInsightService.ts` module provides the `OTPInsightService` class, which is responsible for extracting key information from a message, such as the OTP code, transaction type (e.g., payment out, payment in, login), amount, and merchant. This service uses regular expressions to identify patterns commonly found in transactional and OTP messages.

**Class:** `OTPInsightService`

**Constructor:** `new OTPInsightService()`

**Method:** `analyzeOTP(messageText: string): OTPAnalysis`

-   `messageText`: The text content of the message to analyze.
-   Returns: An object of type `OTPAnalysis` containing:
    -   `otpCode`: The extracted 6-digit OTP code, or `null` if not found.
    -   `transactionType`: Categorizes the transaction as `PAYMENT_OUT`, `PAYMENT_IN`, `LOGIN`, or `null` if no clear type is identified.
    -   `amount?`: The extracted monetary amount (e.g., `20000`), if present.
    -   `merchant?`: The extracted merchant name (e.g., `amazon`), if identified from a predefined list of keywords.

**Example Usage:**

```typescript
import { OTPInsightService, OTPAnalysis } from ".//lib/otp-insight/src/otpInsightService";

const otpService = new OTPInsightService();

// Example 1: Payment Out OTP
const messageText1 = "Your OTP for transaction of Rs. 5000 at Amazon is 123456. Valid for 10 mins.";
const analysis1: OTPAnalysis = otpService.analyzeOTP(messageText1);
console.log("Analysis 1:", analysis1);
// Expected: { otpCode: "123456", transactionType: "PAYMENT_OUT", amount: "5000", merchant: "amazon" }

// Example 2: Login OTP
const messageText2 = "Use OTP 789012 to login to your account. Do not share.";
const analysis2: OTPAnalysis = otpService.analyzeOTP(messageText2);
console.log("Analysis 2:", analysis2);
// Expected: { otpCode: "789012", transactionType: "LOGIN", amount: undefined, merchant: undefined }

// Example 3: Payment In message
const messageText3 = "INR 1500 credited to your account by PhonePe. Ref: 12345.";
const analysis3: OTPAnalysis = otpService.analyzeOTP(messageText3);
console.log("Analysis 3:", analysis3);
// Expected: { otpCode: null, transactionType: "PAYMENT_IN", amount: "1500", merchant: "phonepe" }

// Example 4: Message without clear OTP or transaction type
const messageText4 = "Hello, your order has been shipped.";
const analysis4: OTPAnalysis = otpService.analyzeOTP(messageText4);
console.log("Analysis 4:", analysis4);
// Expected: { otpCode: null, transactionType: null, amount: undefined, merchant: undefined }
```

**How it Works:**

1.  **OTP Extraction:**
    *   A regular expression `(/(\b\d{6}\b)/)` is used to find a 6-digit number that appears as a whole word. This helps in accurately identifying OTPs while avoiding partial number matches.

2.  **Amount Extraction:**
    *   The `amountRegex` `(/(?:Rs\.?\s?|INR\s?)([\d,]+(?:\.\d{1,2})?)/i)` is designed to capture monetary values. It looks for prefixes like "Rs.", "Rs", or "INR" followed by a number that may include commas (e.g., `1,000`) and optional decimal places (e.g., `.50`). The commas are removed from the extracted amount for consistency.

3.  **Transaction Type Detection:**
    *   The message text is converted to lowercase for case-insensitive matching.
    *   Keywords are used to categorize the transaction:
        *   `PAYMENT_OUT`: Detected if the message contains keywords like "debit", "purchase", or "payment".
        *   `PAYMENT_IN`: Detected if the message contains keywords like "credit", "refund", or "received".
        *   `LOGIN`: Detected if the message contains keywords like "login", "verify", or "otp" (if no other transaction type is found).

4.  **Merchant Extraction:**
    *   A predefined list of common merchant keywords (e.g., "amazon", "flipkart", "swiggy") is used. The service iterates through this list and checks if any keyword is present in the lowercase message text. The first match is assigned as the merchant.

**Limitations:**

-   **Regex Robustness:** While regular expressions are powerful, they might not cover all variations of OTP or transactional messages. New message formats from banks or services may require updates to the regex patterns.
-   **Merchant List Completeness:** The current merchant list is a basic example. For production use, a much more comprehensive and regularly updated list of merchants would be required.
-   **Contextual Understanding:** The service relies on keyword matching, which can sometimes be ambiguous. For instance, "payment" could refer to an incoming or outgoing payment depending on the broader context of the sentence. Advanced NLP techniques would be needed for deeper contextual understanding.
-   **Language Dependency:** The current regex patterns and keywords are primarily tailored for English messages commonly used in India. Support for other languages would require additional patterns and keyword lists.




### 3.4. Context & Frequency Rules

The `contextRules.ts` module provides two classes, `UserContextTracker` and `OtpFrequencyTracker`, to implement context-based and frequency-based rules for identifying suspicious OTP behavior. These rules are crucial for detecting potential phishing attempts or SIM swap frauds where OTPs might be generated without explicit user action or in rapid succession.

#### 3.4.1. User Context Tracker

The `UserContextTracker` helps determine if an OTP arrival is suspicious based on the time elapsed since the last known user interaction with the device or application. A sudden OTP arrival without recent user activity could indicate a fraudulent attempt.

**Class:** `UserContextTracker`

**Constructor:** `new UserContextTracker()`

**Methods:**

-   `updateLastInteraction(): void`
    *   Updates the timestamp of the last user interaction. This method should be called by your React Native Expo application whenever there is a significant user interaction, such as: 
        *   The app coming to the foreground.
        *   User input (e.g., typing, tapping buttons).
        *   Successful login or transaction initiation.
    *   It's vital to integrate this method correctly into your application's lifecycle and user interaction events to maintain an accurate record of user activity.

-   `isContextSuspicious(otpArrivalTimestamp: number, thresholdMinutes: number = 2): boolean`
    *   Checks if the OTP arrival is suspicious based on the last user interaction.
    *   `otpArrivalTimestamp`: The timestamp (in milliseconds since epoch) when the OTP message was received.
    *   `thresholdMinutes`: The maximum acceptable time in minutes between the last user interaction and the OTP arrival. If the time elapsed is greater than this threshold, the context is considered suspicious. Defaults to 2 minutes.
    *   Returns: `true` if the OTP arrival is suspicious (i.e., no recent user interaction), `false` otherwise.

**Example Usage:**

```typescript
import { UserContextTracker } from ".//lib/otp-insight/src/contextRules";

const userContext = new UserContextTracker();

// Simulate user interaction (e.g., app foregrounds)
userContext.updateLastInteraction();
console.log("User last interaction updated.");

// Simulate an OTP arriving after some time
setTimeout(() => {
  const otpReceivedTime = Date.now();
  const isSuspicious = userContext.isContextSuspicious(otpReceivedTime, 1); // Check if suspicious after 1 minute
  console.log(`OTP arrived at ${new Date(otpReceivedTime).toLocaleString()}. Is context suspicious? ${isSuspicious}`);

  // Simulate another OTP arriving very quickly after the first (not suspicious by this rule)
  setTimeout(() => {
    const anotherOtpReceivedTime = Date.now();
    const isAnotherSuspicious = userContext.isContextSuspicious(anotherOtpReceivedTime, 1);
    console.log(`Another OTP arrived at ${new Date(anotherOtpReceivedTime).toLocaleString()}. Is context suspicious? ${isAnotherSuspicious}`);
  }, 500); // 0.5 seconds later

}, 65 * 1000); // Simulate OTP arriving after 65 seconds (more than 1 minute threshold)

// Output will show the first OTP as suspicious if no other interaction happened within 1 minute.
```

**Rationale:**

This rule is based on the assumption that a legitimate OTP is usually requested by the user as part of an active transaction or login process. If an OTP arrives when the user has not interacted with the device or the application for a significant period, it could indicate that a fraudster is attempting to use the user's credentials or initiate a transaction without their knowledge. This is particularly relevant for attacks like SIM swap, where the attacker gains control of the user's phone number and can receive OTPs.

#### 3.4.2. OTP Frequency Tracker

The `OtpFrequencyTracker` monitors the rate at which OTPs are received. A sudden surge in OTPs within a short timeframe, especially without corresponding user actions, can be a strong indicator of an automated attack or a brute-force attempt to gain access to accounts.

**Class:** `OtpFrequencyTracker`

**Constructor:** `new OtpFrequencyTracker()`

**Methods:**

-   `recordOtpEvent(): void`
    *   Records the current timestamp as an OTP event. This method should be called every time an OTP message is successfully processed by the `smsProcessing` module.

-   `isPossibleAttack(windowMinutes: number = 5, maxOtpsInWindow: number = 3): boolean`
    *   Checks if there's a possible attack based on the frequency of OTPs within a sliding time window.
    *   `windowMinutes`: The duration of the sliding window in minutes. Only OTP events within this window are considered for frequency analysis. Defaults to 5 minutes.
    *   `maxOtpsInWindow`: The maximum number of OTPs allowed within the `windowMinutes` without triggering a 



### 3.5. Notifications (Conceptual)

The `notificationBuilder.ts` module provides a conceptual `NotificationBuilder` class. In a real React Native Expo application, this class would leverage the `expo-notifications` library to display high-priority alerts and informative notifications to the user. Since this library is platform-agnostic, the methods here primarily log to the console, demonstrating the intended functionality.

**Class:** `NotificationBuilder`

**Constructor:** `new NotificationBuilder()`

**Methods:**

-   `sendWarningNotification(messageText: string): void`
    *   **Purpose:** To alert the user about a message from a potentially forged or suspicious sender.
    *   **Trigger:** Typically called when `SenderVerificationService` returns a `HIGH_RISK_FORGERY` risk level.
    *   **Conceptual Behavior:** Logs a warning message to the console. In a real app, this would trigger a high-priority push notification with a distinct sound and vibration.

-   `sendPaymentAlert(amount: string, messageText: string): void`
    *   **Purpose:** To provide a clear, high-priority alert when an OTP is identified as authorizing a payment, especially for significant amounts.
    *   **Trigger:** Called when `OTPInsightService` identifies a `PAYMENT_OUT` transaction type with an associated amount.
    *   **Conceptual Behavior:** Logs a payment alert message. In a real app, this would be a prominent notification, potentially requiring user interaction to dismiss or confirm.

-   `sendSuspiciousNotification(messageText: string, reason: string): void`
    *   **Purpose:** To inform the user about any other suspicious activity detected by the system, such as unusual OTP frequency or context.
    *   **Trigger:** Called when `UserContextTracker` or `OtpFrequencyTracker` identifies suspicious patterns.
    *   **Conceptual Behavior:** Logs a suspicious activity message. In a real app, this would be a high-priority notification prompting the user to review the message.

-   `sendStandardNotification(messageText: string): void`
    *   **Purpose:** To provide a subtle confirmation for legitimate OTPs or general messages that pass all fraud checks.
    *   **Trigger:** Called when a message is processed and deemed safe and standard.
    *   **Conceptual Behavior:** Logs a standard notification message. In a real app, this might be a low-priority notification or a silent update within the app.

-   `markNotificationSafe(notificationId: string): void`
    *   **Purpose:** A conceptual method to acknowledge that a user has reviewed a notification and deemed the associated message safe. This would typically interact with the app's local storage to prevent repeated alerts for the same message.
    *   **Conceptual Behavior:** Logs a message indicating the notification was marked safe.

**Example Usage (Conceptual within your React Native Expo app):**

```typescript
import { NotificationBuilder } from ".//lib/otp-insight/src/notificationBuilder";
import { SenderVerificationService } from ".//lib/otp-insight/src/senderVerification";
import { OTPInsightService } from ".//lib/otp-insight/src/otpInsightService";
import { UserContextTracker, OtpFrequencyTracker } from ".//lib/otp-insight/src/contextRules";

const notificationBuilder = new NotificationBuilder();
const senderService = new SenderVerificationService();
const otpService = new OTPInsightService();
const userContextTracker = new UserContextTracker();
const otpFrequencyTracker = new OtpFrequencyTracker();

// Assume a message has been processed:
const messageText = "Your OTP for transaction of Rs. 15000 at XYZ Bank is 987654. Valid for 5 mins. Visit http://tinyurl.com/scam";
const senderId = "VM-XYZBNK"; // Assume this is a forged sender ID

// 1. Verify Sender
const senderVerdict = senderService.verifySender(senderId, messageText);
if (senderVerdict.riskLevel === "HIGH_RISK_FORGERY") {
  notificationBuilder.sendWarningNotification(messageText);
}

// 2. Analyze OTP content
const otpAnalysis = otpService.analyzeOTP(messageText);
if (otpAnalysis.transactionType === "PAYMENT_OUT" && otpAnalysis.amount) {
  notificationBuilder.sendPaymentAlert(otpAnalysis.amount, messageText);
}

// 3. Check Context and Frequency (assuming these are integrated with app lifecycle)
// For demonstration, let's simulate a suspicious context and frequency
userContextTracker.updateLastInteraction(); // Simulate recent interaction
setTimeout(() => {
  const otpArrivalTimestamp = Date.now();
  if (userContextTracker.isContextSuspicious(otpArrivalTimestamp, 0.01)) { // Very small threshold for quick demo
    notificationBuilder.sendSuspiciousNotification(messageText, "OTP arrived without recent user interaction.");
  }
  otpFrequencyTracker.recordOtpEvent();
  otpFrequencyTracker.recordOtpEvent();
  otpFrequencyTracker.recordOtpEvent();
  otpFrequencyTracker.recordOtpEvent(); // Simulate 4 OTPs in a short time
  if (otpFrequencyTracker.isPossibleAttack(1, 3)) { // 4 OTPs in 1 minute, max 3 allowed
    notificationBuilder.sendSuspiciousNotification(messageText, "High frequency of OTPs detected.");
  }
}, 100); // Simulate a short delay

// If all checks pass, send a standard notification (conceptual)
// if (senderVerdict.riskLevel === "SAFE" && !otpAnalysis.transactionType) {
//   notificationBuilder.sendStandardNotification(messageText);
// }
```

**Integration with `expo-notifications`:**

To make these notifications functional in your React Native Expo app, you would need to:

1.  **Install `expo-notifications`:**
    ```bash
    pnpm add expo-notifications
    ```

2.  **Request Permissions:**
    In your app, you'll need to request notification permissions from the user. This is typically done when the app starts or when the user enables notification-related features.

    ```typescript
    import * as Notifications from 'expo-notifications';

    async function registerForPushNotificationsAsync() {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      // You can get the Expo push token here if needed for server-side notifications
      // const token = (await Notifications.getExpoPushTokenAsync()).data;
      // console.log(token);
    }

    useEffect(() => {
      registerForPushNotificationsAsync();
    }, []);
    ```

3.  **Implement Notification Scheduling:**
    Replace the `console.log` statements in `NotificationBuilder` with calls to `Notifications.scheduleNotificationAsync()`.

    ```typescript
    // Inside NotificationBuilder methods:
    // import * as Notifications from 'expo-notifications';

    // ...
    // In sendWarningNotification:
    // await Notifications.scheduleNotificationAsync({
    //   content: {
    //     title: options.title,
    //     body: options.body,
    //     data: options.data,
    //     sound: options.sound,
    //   },
    //   trigger: null, // Send immediately
    // });
    ```

4.  **Handle Notification Responses:**
    Your app will also need to handle how it responds when a user interacts with a notification (e.g., tapping on it). This involves setting up notification listeners.

    ```typescript
    // In your App.tsx or a dedicated notification handler:
    useEffect(() => {
      const subscription = Notifications.addNotificationResponseReceivedListener(response => {
        const { data } = response.notification.request.content;
        console.log('Notification response received:', data);
        // Handle different notification types based on `data.type`
        if (data.type === 'sender_forgery') {
          // Navigate to a screen showing the suspicious message
        }
      });
      return () => Notifications.removeNotificationSubscription(subscription);
    }, []);
    ```

**Privacy Considerations for Notifications:**

-   **Sensitive Information:** Be cautious about displaying sensitive information (like the full OTP or bank details) directly in notifications, especially on the lock screen. Consider summarizing or redacting such details.
-   **User Control:** Provide users with granular control over notification settings (e.g., enable/disable specific types of alerts, customize sounds) within your app's settings.




### 3.6. Local Storage & Privacy (Conceptual)

The `localStorage.ts` module provides a conceptual `LocalStorageService` class. In a real React Native Expo application, this class would utilize `AsyncStorage` for simple key-value storage and `expo-sqlite` for more structured, persistent data storage (like historical OTP events or user context). This module emphasizes a privacy-first approach, ensuring all data remains on the user's device.

**Class:** `LocalStorageService`

**Constructor:** `new LocalStorageService()`

**Methods:**

-   `setItem(key: string, value: any): Promise<void>`
    *   **Purpose:** To store data in a key-value format. Ideal for small pieces of data like user preferences or configuration settings.
    *   **Conceptual Behavior:** Stores data in an in-memory `Map`. In a real app, this would use `AsyncStorage`.

-   `getItem<T>(key: string): Promise<T | null>`
    *   **Purpose:** To retrieve data stored by its key.
    *   **Conceptual Behavior:** Retrieves data from the in-memory `Map`. In a real app, this would use `AsyncStorage`.

-   `removeItem(key: string): Promise<void>`
    *   **Purpose:** To remove a stored item.
    *   **Conceptual Behavior:** Removes data from the in-memory `Map`. In a real app, this would use `AsyncStorage`.

-   `initializePersistentStorage(): Promise<void>`
    *   **Purpose:** To set up the necessary tables or structures for persistent storage (e.g., SQLite database).
    *   **Conceptual Behavior:** Logs a message indicating conceptual initialization. In a real app, this would involve `expo-sqlite` to create tables for `otp_events` and `user_context`.

-   `saveOtpEvent(timestamp: number): Promise<void>`
    *   **Purpose:** To persistently record each OTP event for frequency analysis.
    *   **Conceptual Behavior:** Logs a message indicating conceptual saving. In a real app, this would insert a new record into an `otp_events` table in SQLite.

-   `getOtpEvents(startTime: number): Promise<{ timestamp: number }[]>`
    *   **Purpose:** To retrieve historical OTP events within a specified time range for frequency analysis.
    *   **Conceptual Behavior:** Logs a message indicating conceptual retrieval and returns an empty array. In a real app, this would query the `otp_events` table in SQLite.

-   `deleteOldOtpEvents(cutoffTime: number): Promise<void>`
    *   **Purpose:** To manage storage by removing old OTP events that are no longer needed for frequency analysis.
    *   **Conceptual Behavior:** Logs a message indicating conceptual deletion. In a real app, this would delete records from the `otp_events` table older than the `cutoffTime`.

-   `saveUserContext(key: string, value: any): Promise<void>`
    *   **Purpose:** To persistently store user context data.
    *   **Conceptual Behavior:** Logs a message indicating conceptual saving. In a real app, this would store user context in a `user_context` table in SQLite.

-   `getUserContext<T>(key: string): Promise<T | null>`
    *   **Purpose:** To retrieve stored user context data.
    *   **Conceptual Behavior:** Logs a message indicating conceptual retrieval and returns `null`. In a real app, this would retrieve user context from the `user_context` table in SQLite.

-   `logPrivacyStatement(): void`
    *   **Purpose:** To explicitly state the privacy policy of the module.
    *   **Behavior:** Logs a privacy statement to the console, emphasizing on-device data processing and storage.

**Example Usage (Conceptual within your React Native Expo app):**

```typescript
import { LocalStorageService } from ".//lib/otp-insight/src/localStorage";

const localStorageService = new LocalStorageService();

async function demonstrateLocalStorage() {
  // Initialize persistent storage (e.g., SQLite tables)
  await localStorageService.initializePersistentStorage();

  // Store a simple setting
  await localStorageService.setItem("userPreference", "dark_mode");
  const preference = await localStorageService.getItem("userPreference");
  console.log("Retrieved user preference:", preference);

  // Simulate saving an OTP event
  await localStorageService.saveOtpEvent(Date.now());
  await localStorageService.saveOtpEvent(Date.now() - (1000 * 60 * 5)); // 5 minutes ago

  // Retrieve recent OTP events (conceptual)
  const recentEvents = await localStorageService.getOtpEvents(Date.now() - (1000 * 60 * 10)); // Last 10 minutes
  console.log("Recent OTP events (conceptual):", recentEvents);

  // Save and retrieve user context (conceptual)
  await localStorageService.saveUserContext("lastLoginTime", Date.now());
  const lastLogin = await localStorageService.getUserContext("lastLoginTime");
  console.log("Last login time (conceptual):", lastLogin);

  // Log the privacy statement
  localStorageService.logPrivacyStatement();
}

demonstrateLocalStorage();
```

**Integration with `AsyncStorage` and `expo-sqlite`:**

To make these conceptual methods functional in your React Native Expo app, you would need to:

1.  **Install Dependencies:**
    ```bash
    pnpm add @react-native-async-storage/async-storage expo-sqlite
    ```

2.  **Replace Conceptual Implementations:**
    *   For `setItem`, `getItem`, `removeItem`, replace the in-memory `Map` operations with `AsyncStorage` calls.
    *   For `initializePersistentStorage`, `saveOtpEvent`, `getOtpEvents`, `deleteOldOtpEvents`, `saveUserContext`, and `getUserContext`, implement the actual SQLite logic using `expo-sqlite`.

    **Example `AsyncStorage` Integration:**
    ```typescript
    // Inside LocalStorageService
    import AsyncStorage from '@react-native-async-storage/async-storage';

    public async setItem(key: string, value: any): Promise<void> {
      try {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        await AsyncStorage.setItem(key, stringValue);
        console.log(`Stored ${key}: ${stringValue}`);
      } catch (error) {
        console.error(`Error storing item with key ${key}:`, error);
        throw error;
      }
    }

    public async getItem<T>(key: string): Promise<T | null> {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value === null) {
          return null;
        }
        try {
          return JSON.parse(value) as T;
        } catch (e) {
          return value as T; // Return as string if not valid JSON
        }
      } catch (error) {
        console.error(`Error retrieving item with key ${key}:`, error);
        throw error;
      }
    }
    // ... similar for removeItem
    ```

    **Example `expo-sqlite` Integration (within `initializePersistentStorage` and other methods):**
    ```typescript
    // Inside LocalStorageService
    import * as SQLite from 'expo-sqlite';

    const database = SQLite.openDatabase('otp_insight.db');

    public async initializePersistentStorage(): Promise<void> {
      return new Promise((resolve, reject) => {
        database.transaction(
          tx => {
            tx.executeSql(
              'CREATE TABLE IF NOT EXISTS otp_events (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp INTEGER);',
              [],
              () => console.log('otp_events table created or already exists.'),
              (_, error) => {
                console.error('Error creating otp_events table:', error);
                return false;
              }
            );
            tx.executeSql(
              'CREATE TABLE IF NOT EXISTS user_context (key TEXT PRIMARY KEY, value TEXT);',
              [],
              () => console.log('user_context table created or already exists.'),
              (_, error) => {
                console.error('Error creating user_context table:', error);
                return false;
              }
            );
          },
          (error) => {
            console.error('Transaction error during database initialization:', error);
            reject(error);
          },
          () => {
            console.log('Database initialization transaction complete.');
            resolve();
          }
        );
      });
    }
    // ... similar for saveOtpEvent, getOtpEvents, etc.
    ```

**Privacy-First Design:**

This module is designed with privacy as a core principle:

-   **On-Device Processing:** All message analysis, sender verification, and rule-based checks are performed locally on the user's device. No message content leaves the device.
-   **Local Storage:** All historical data (like OTP events and user context) is stored exclusively on the device using `AsyncStorage` or `expo-sqlite`. There are no network requests to external servers or cloud storage for data persistence.
-   **No Personal Identifiable Information (PII) Transmission:** The module does not transmit any PII (e.g., phone numbers, message content) to any external service.
-   **User Control:** While the library provides the logic, the React Native Expo application integrating it should provide clear user interfaces for consent, data management (e.g., clearing historical data), and notification preferences.

This privacy-first approach ensures that users retain full control over their sensitive message data, which is crucial for building trust in security-sensitive applications.




### 3.7. ML Integration (Conceptual)

The `mlIntegration.ts` module provides a conceptual framework for integrating a machine learning model into the OTP Insight Library. This framework is designed to allow for offline, on-device fraud detection using a pre-trained or lightweight model. The actual ML model training and deployment would typically occur outside this library, with the trained model then bundled with your React Native Expo application.

**Class:** `MLIntegrationService`

**Constructor:** `new MLIntegrationService()`

**Methods:**

-   `trainLocalModel(corpus: SMSExample[]): Promise<void>`
    *   **Purpose:** Simulates the process of training or loading a local ML model. In a real application, this would involve loading a pre-trained model (e.g., in ONNX or TFLite format) that has been optimized for on-device inference. For a truly adaptive model, it might involve lightweight online learning or fine-tuning with user-provided feedback.
    *   `corpus`: An array of `SMSExample` objects, where each object contains `messageText` and a `label` (e.g., `'fraud'` or `'legitimate'`). This represents the dataset used for training or evaluating the model.
    *   **Conceptual Behavior:** Logs a message indicating conceptual training/loading and simulates an asynchronous operation. In a real app, this would involve a library like `tensorflow.js-react-native` or `react-native-pytorch-core` to load and prepare the model.

-   `predictWithModel(messageText: string): Promise<ModelVerdict>`
    *   **Purpose:** To predict whether a given message is fraudulent using the integrated ML model. This function is designed to run inference entirely offline, on the user's device.
    *   `messageText`: The text content of the message to be analyzed for fraud.
    *   Returns: A `Promise` that resolves to a `ModelVerdict` object containing:
        -   `isFraud`: A boolean indicating `true` if the message is predicted as fraudulent, `false` otherwise.
        -   `confidence`: A number representing the model's confidence in its prediction (e.g., between 0 and 1).
        -   `details?`: An optional string providing more information about the prediction (e.g., which keywords triggered the fraud detection).
    *   **Conceptual Behavior:** Logs a message indicating conceptual prediction and returns a mock `ModelVerdict` based on simple keyword matching. In a real app, this would involve preprocessing the `messageText` (e.g., tokenization, vectorization) and then feeding it into the loaded ML model for inference.

**Example Usage (Conceptual within your React Native Expo app):**

```typescript
import { MLIntegrationService, SMSExample, ModelVerdict } from ".//lib/otp-insight/src/mlIntegration";

const mlService = new MLIntegrationService();

async function demonstrateMLIntegration() {
  // 1. Simulate loading/training a model
  const trainingData: SMSExample[] = [
    { messageText: "Your OTP is 123456. Do not share.", label: "legitimate" },
    { messageText: "Congratulations! You won a lottery. Click here: http://bit.ly/scam", label: "fraud" },
    { messageText: "Your bank account will be blocked. Update KYC: https://fakebank.com", label: "fraud" },
    { messageText: "Your order has been placed successfully.", label: "legitimate" },
  ];
  await mlService.trainLocalModel(trainingData);

  // 2. Simulate predicting on new messages
  const message1 = "Your OTP for login is 789012.";
  const verdict1: ModelVerdict = await mlService.predictWithModel(message1);
  console.log(`Message 1: "${message1}" -> Is Fraud: ${verdict1.isFraud}, Confidence: ${verdict1.confidence}`);

  const message2 = "Dear customer, your account is suspended. Click: http://tinyurl.com/malicious";
  const verdict2: ModelVerdict = await mlService.predictWithModel(message2);
  console.log(`Message 2: "${message2}" -> Is Fraud: ${verdict2.isFraud}, Confidence: ${verdict2.confidence}`);

  const message3 = "Your account has been credited with Rs. 5000.";
  const verdict3: ModelVerdict = await mlService.predictWithModel(message3);
  console.log(`Message 3: "${message3}" -> Is Fraud: ${verdict3.isFraud}, Confidence: ${verdict3.confidence}`);
}

demonstrateMLIntegration();
```

**Integrating a Real ML Model in React Native Expo:**

Integrating a real machine learning model into a React Native Expo application for on-device inference typically involves the following steps:

1.  **Model Selection and Training:**
    *   **Choose a suitable model:** For text classification (fraud detection), common choices include Logistic Regression, Naive Bayes, Support Vector Machines (SVMs), or simpler neural networks. For production, consider models that are lightweight and perform well on mobile devices.
    *   **Train the model:** Train your model using a large, diverse, and representative dataset of fraudulent and legitimate messages. The dataset you previously requested (over 100,000 messages, with a focus on money-related scams and correct Hindi encoding) is ideal for this purpose. Ensure the dataset is balanced to prevent bias.
    *   **Export the model:** Export the trained model into a format compatible with mobile inference frameworks (e.g., ONNX, TensorFlow Lite (TFLite), PyTorch Mobile).

2.  **Preprocessing Pipeline:**
    *   **Text Vectorization:** Before feeding text into an ML model, it needs to be converted into numerical representations. Common techniques include:
        *   **Bag-of-Words (BoW):** Counts the occurrences of words in a document.
        *   **TF-IDF (Term Frequency-Inverse Document Frequency):** Weights words based on their importance in a document relative to a corpus.
        *   **Word Embeddings (Word2Vec, GloVe, FastText):** Represents words as dense vectors, capturing semantic relationships. These are often pre-trained on large text corpora.
    *   **Tokenizer:** A tokenizer is used to break down the message text into individual words or sub-word units. The same tokenizer used during model training must be used during inference.
    *   **Normalization:** Steps like lowercasing, removing punctuation, and handling stop words are crucial for consistent input.

3.  **On-Device Inference Framework:**
    *   **TensorFlow.js for React Native:** If your model is in TensorFlow.js format, you can use `@tensorflow/tfjs-react-native`. This allows you to run TensorFlow.js models directly within your React Native app.
    *   **React Native PyTorch Mobile:** If your model is in PyTorch Mobile format, `react-native-pytorch-core` can be used. This provides bindings to run PyTorch models on iOS and Android.
    *   **ONNX Runtime Mobile:** For models exported to ONNX format, you might need to explore community-driven solutions or build custom native modules to integrate ONNX Runtime.

4.  **Bundling the Model:**
    *   The trained model file (e.g., `.tflite`, `.onnx`, or TensorFlow.js model directory) and any associated vocabulary or tokenizer files need to be bundled with your React Native Expo application. This ensures the model is available offline.

5.  **Integration into `MLIntegrationService`:**
    *   The `trainLocalModel` method would be responsible for loading the bundled model and any necessary preprocessing assets (like the vectorizer or tokenizer). This might happen once when the app starts or when the ML feature is first accessed.
    *   The `predictWithModel` method would then take the input `messageText`, apply the same preprocessing steps used during training, and then pass the processed input to the loaded ML model for inference. The model's output (e.g., a probability score) would then be converted into the `ModelVerdict` format.

**Example Conceptual Flow for `predictWithModel`:**

```typescript
// Inside MLIntegrationService.ts
import * as tf from '@tensorflow/tfjs-react-native'; // Conceptual import
// import * as mobilenet from '@tensorflow-models/mobilenet'; // Example for image, but concept applies to text

// Assume a pre-trained model and vectorizer are loaded
let loadedModel: tf.LayersModel | null = null;
let loadedVectorizer: any = null; // Conceptual vectorizer

public async trainLocalModel(corpus: SMSExample[]): Promise<void> {
  // In a real app, this would load your bundled model and vectorizer
  console.log("[MLIntegrationService] Loading pre-trained model and vectorizer...");
  // Example: loadedModel = await tf.loadLayersModel("file://path/to/your/model.json");
  // Example: loadedVectorizer = await loadVectorizer("file://path/to/your/vectorizer.json");
  loadedModel = {} as tf.LayersModel; // Mock
  loadedVectorizer = {}; // Mock
  console.log("[MLIntegrationService] Model and vectorizer loaded.");
}

public async predictWithModel(messageText: string): Promise<ModelVerdict> {
  if (!loadedModel || !loadedVectorizer) {
    throw new Error("ML model or vectorizer not loaded. Call trainLocalModel first.");
  }

  // 1. Preprocess the messageText
  // const processedInput = preprocessText(messageText, loadedVectorizer); // Conceptual preprocessing
  const processedInput = [1, 0, 1, 0, ...]; // Mock numerical input

  // 2. Run inference
  // const prediction = loadedModel.predict(tf.tensor2d([processedInput])); // Conceptual prediction
  const predictionOutput = Math.random(); // Mock prediction output (e.g., probability of fraud)

  // 3. Interpret the output
  const isFraud = predictionOutput > 0.5; // Threshold
  const confidence = predictionOutput; // Use probability as confidence

  return {
    isFraud,
    confidence,
    details: "Prediction from actual ML model."
  };
}
```

**Challenges and Considerations:**

-   **Model Size:** Mobile devices have limited storage and memory. Models need to be compact and efficient.
-   **Inference Speed:** Predictions should be fast enough not to impact user experience, especially for real-time analysis.
-   **Model Updates:** Strategies for updating the ML model (e.g., over-the-air updates, app store updates) need to be considered.
-   **Data Drift:** Fraud patterns evolve. The model will need periodic retraining and updates to maintain accuracy.
-   **Explainability:** For critical applications like fraud detection, understanding *why* a model made a certain prediction can be important for debugging and user trust. This often requires additional techniques (e.g., LIME, SHAP).

This conceptual framework provides the necessary interfaces for your React Native Expo app to integrate a powerful, on-device machine learning component for fraud detection.




### 3.8. Manual Text Input & Analysis Integration

While automatic SMS detection is ideal for a seamless user experience, the library also supports manual text input for analysis. This is particularly useful for messages received through other messaging applications like WhatsApp, where direct programmatic access to message content is restricted due to platform privacy policies. Users can simply copy a suspicious message and paste it into a designated input field within your React Native Expo application for analysis.

**Integration Steps:**

1.  **Create a User Interface:** Design a simple text input field in your React Native Expo app where users can paste messages.

    ```typescript
    import React, { useState } from 'react';
    import { View, TextInput, Button, Text, StyleSheet } from 'react-native';
    import { processSmsForConsent } from ".//lib/otp-insight/src/smsProcessing";
    import { SenderVerificationService } from ".//lib/otp-insight/src/senderVerification";
    import { OTPInsightService } from ".//lib/otp-insight/src/otpInsightService";
    import { MLIntegrationService } from ".//lib/otp-insight/src/mlIntegration";

    const ManualMessageAnalyzer: React.FC = () => {
      const [messageInput, setMessageInput] = useState("");
      const [analysisResult, setAnalysisResult] = useState<string | null>(null);

      const handleAnalyzeMessage = async () => {
        if (!messageInput.trim()) {
          setAnalysisResult("Please enter a message to analyze.");
          return;
        }

        try {
          // 1. Process the message (simulating consent for manual input)
          const processedSms = processSmsForConsent(messageInput);

          // 2. Perform Sender Verification (conceptual sender ID for non-SMS)
          // For non-SMS, sender ID might be inferred or not available. For this example, we'll use a placeholder.
          const senderId = "UNKNOWN_APP"; // Or extract from message if possible
          const senderService = new SenderVerificationService();
          const senderVerdict = senderService.verifySender(senderId, processedSms.messageText);

          // 3. Perform OTP Insight Analysis
          const otpService = new OTPInsightService();
          const otpAnalysis = otpService.analyzeOTP(processedSms.messageText);

          // 4. Perform ML Prediction
          const mlService = new MLIntegrationService();
          // In a real app, ensure the model is loaded/trained before prediction
          // await mlService.trainLocalModel([]); // Call this once at app startup
          const mlVerdict = await mlService.predictWithModel(processedSms.messageText);

          let resultText = `Analysis for: "${processedSms.messageText}"\n\n`;
          resultText += `Sender Risk: ${senderVerdict.riskLevel} (Details: ${JSON.stringify(senderVerdict.details)})\n`;
          resultText += `OTP Analysis: OTP=${otpAnalysis.otpCode}, Type=${otpAnalysis.transactionType}, Amount=${otpAnalysis.amount || 'N/A'}, Merchant=${otpAnalysis.merchant || 'N/A'}\n`;
          resultText += `ML Verdict: Is Fraud=${mlVerdict.isFraud}, Confidence=${mlVerdict.confidence.toFixed(2)} (Details: ${mlVerdict.details})\n`;

          setAnalysisResult(resultText);

        } catch (error: any) {
          setAnalysisResult(`Error during analysis: ${error.message}`);
        }
      };

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Analyze Message Manually</Text>
          <TextInput
            style={styles.input}
            placeholder="Paste message here..."
            multiline
            numberOfLines={4}
            value={messageInput}
            onChangeText={setMessageInput}
          />
          <Button title="Analyze Message" onPress={handleAnalyzeMessage} />
          {analysisResult && <Text style={styles.result}>{analysisResult}</Text>}
        </View>
      );
    };

    const styles = StyleSheet.create({
      container: {
        padding: 20,
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#ccc',
      },
      title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
      },
      input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        marginBottom: 10,
        borderRadius: 5,
        textAlignVertical: 'top',
      },
      result: {
        marginTop: 15,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        fontFamily: 'monospace',
      },
    });

    export default ManualMessageAnalyzer;
    ```

2.  **Integrate Analysis Logic:** The `handleAnalyzeMessage` function in the example above demonstrates how to use the `smsProcessing`, `SenderVerificationService`, `OTPInsightService`, and `MLIntegrationService` modules with manual input. The `processSmsForConsent` function is used here to ensure the message is in the expected format for subsequent analysis, even though it's manually provided.

**Considerations for Manual Input:**

-   **Sender ID:** For messages from apps like WhatsApp, a formal sender ID (like DLT headers for SMS) is typically not available. You might need to infer the sender (e.g., from the contact name if available to your app) or use a generic placeholder like `"UNKNOWN_APP"` for sender verification. The `SenderVerificationService` will then primarily focus on URL analysis and message content.
-   **User Experience:** Make the copy-paste process as intuitive as possible. Provide clear instructions and visual cues.
-   **Privacy:** Reiterate to users that manually pasted messages are processed locally on their device and not sent to any external servers.

This manual input mechanism provides a robust way to extend the fraud detection capabilities to messages from any source, empowering users to actively check suspicious content.




### 3.9. Screenshot Analysis (OCR) & Integration

To enable fraud detection for messages received via other applications where direct text access is not possible (e.g., WhatsApp, Telegram, or even images of SMS messages), the module can be conceptually extended to include screenshot analysis using Optical Character Recognition (OCR). This allows users to submit a screenshot of a suspicious message, from which the text can be extracted and then fed into the existing fraud detection pipeline.

**Conceptual Approach:**

Integrating OCR for screenshot analysis in a React Native Expo application typically involves the following steps:

1.  **Image Selection/Capture:**
    *   **User selects an image:** Use `expo-image-picker` to allow users to select an existing screenshot from their device's gallery.
    *   **User captures a new screenshot:** While `expo-image-picker` can also access the camera, directly capturing a screenshot of the current screen is platform-dependent and usually handled by the operating system (e.g., power + volume down on Android, power + home on iOS). Your app would then need to prompt the user to select the captured image from their gallery.

2.  **OCR Processing:**
    *   Once an image is obtained, an OCR library is used to extract text from it. For React Native, options include:
        *   `react-native-tesseract-ocr`: A popular choice that wraps the Tesseract OCR engine.
        *   Cloud-based OCR APIs: While this library emphasizes offline processing, for highly accurate OCR, cloud services like Google Cloud Vision API or AWS Textract could be considered. However, this would contradict the privacy-first, offline principle and incur costs.
        *   Lightweight on-device ML models: Some ML frameworks (like TensorFlow Lite) can support on-device text recognition models, offering an offline solution.

3.  **Text Analysis:**
    *   The extracted text from the OCR process is then passed to the `smsProcessing.ts` module (specifically, the `processSmsForConsent` function) and subsequently to the `SenderVerificationService`, `OTPInsightService`, and `MLIntegrationService` for comprehensive fraud analysis.

**Example Usage (Conceptual within your React Native Expo app):**

```typescript
import React, { useState } from 'react';
import { View, Button, Image, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
// import TesseractOcr, { RNTesseractOcrModule } from 'react-native-tesseract-ocr'; // Conceptual import

import { processSmsForConsent } from ".//lib/otp-insight/src/smsProcessing";
import { SenderVerificationService } from ".//lib/otp-insight/src/senderVerification";
import { OTPInsightService } ".//lib/otp-insight/src/otpInsightService";
import { MLIntegrationService } from ".//lib/otp-insight/src/mlIntegration";

const ScreenshotAnalyzer: React.FC = () => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const pickImage = async () => {
    // Request media library permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16], // Common aspect ratio for phone screenshots
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setExtractedText(null);
      setAnalysisResult(null);
    }
  };

  const performOcrAndAnalyze = async () => {
    if (!imageUri) {
      setAnalysisResult("Please select an image first.");
      return;
    }

    setLoading(true);
    setAnalysisResult(null);
    setExtractedText(null);

    try {
      // Conceptual OCR execution
      // In a real app, you would call your OCR library here.
      // Example with react-native-tesseract-ocr:
      // const text = await TesseractOcr.recognize(imageUri, 'eng', { 
      //   // Optional: configure OCR options like language, recognition mode
      // });
      
      // Mock OCR result for demonstration
      const mockOcrText = "Your OTP is 123456. Your account will be debited by Rs. 5000. Click this link: http://tinyurl.com/scam-offer";
      setExtractedText(mockOcrText);

      // Now, pass the extracted text to the existing analysis pipeline
      const processedSms = processSmsForConsent(mockOcrText);

      const senderService = new SenderVerificationService();
      const senderVerdict = senderService.verifySender("UNKNOWN_OCR_SOURCE", processedSms.messageText); // Use a placeholder sender ID

      const otpService = new OTPInsightService();
      const otpAnalysis = otpService.analyzeOTP(processedSms.messageText);

      const mlService = new MLIntegrationService();
      const mlVerdict = await mlService.predictWithModel(processedSms.messageText);

      let resultText = `Extracted Text:\n"${mockOcrText}"\n\n`;
      resultText += `Sender Risk: ${senderVerdict.riskLevel} (Details: ${JSON.stringify(senderVerdict.details)})\n`;
      resultText += `OTP Analysis: OTP=${otpAnalysis.otpCode}, Type=${otpAnalysis.transactionType}, Amount=${otpAnalysis.amount || 'N/A'}, Merchant=${otpAnalysis.merchant || 'N/A'}\n`;
      resultText += `ML Verdict: Is Fraud=${mlVerdict.isFraud}, Confidence=${mlVerdict.confidence.toFixed(2)} (Details: ${mlVerdict.details})\n`;

      setAnalysisResult(resultText);

    } catch (error: any) {
      setAnalysisResult(`Error during OCR or analysis: ${error.message}`);
      console.error("OCR/Analysis Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analyze Screenshot</Text>
      <Button title="Pick a screenshot from gallery" onPress={pickImage} />
      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
      <Button 
        title={loading ? "Analyzing..." : "Perform OCR & Analyze"} 
        onPress={performOcrAndAnalyze} 
        disabled={!imageUri || loading} 
      />
      {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.spinner} />}
      {extractedText && <Text style={styles.extractedText}>Extracted Text: {extractedText}</Text>}
      {analysisResult && <Text style={styles.result}>{analysisResult}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'contain',
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  extractedText: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#e0ffe0',
    borderRadius: 5,
    fontFamily: 'monospace',
  },
  result: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    fontFamily: 'monospace',
  },
  spinner: {
    marginTop: 20,
  }
});

export default ScreenshotAnalyzer;
```

**Key Considerations for OCR Integration:**

-   **Accuracy:** OCR accuracy can vary significantly based on image quality, font, background, and language. Test thoroughly with diverse screenshots.
-   **Performance:** On-device OCR can be computationally intensive and may impact app performance, especially on older devices. Consider optimizing image size before OCR or using lightweight OCR models.
-   **Permissions:** You will need to request appropriate permissions (e.g., `READ_EXTERNAL_STORAGE`, `CAMERA`) from the user to access their gallery or camera.
-   **Privacy:** Emphasize that OCR processing happens entirely on the device and that screenshots are not uploaded to any external servers.
-   **Language Support:** Ensure your chosen OCR solution supports the languages present in the messages (e.g., English, Hindi).
-   **Error Handling:** Implement robust error handling for cases where OCR fails to extract text or extracts garbled text.

By providing both manual text input and conceptual screenshot analysis, this library offers flexible ways for users to get fraud detection insights for messages from various sources, while maintaining a strong focus on privacy and on-device processing.




## 4. Updating DLT Header List

The `trusted_dlt_headers.json` file located in the `assets` directory is crucial for the `SenderVerificationService`. It contains lists of legitimate DLT headers, whitelisted domains, and common URL shorteners. To maintain the effectiveness of the fraud detection, this file needs to be regularly updated as new legitimate senders emerge and fraudsters adopt new tactics.

**File Structure:**

```json
{
  "dlt_headers": [
    "VM-HDFCBK",
    "VK-ICICIB",
    "DM-SBIBNK",
    // ... add more DLT headers
  ],
  "whitelisted_domains": [
    "amazon.in",
    "flipkart.com",
    "sbi.co.in",
    // ... add more legitimate domains
  ],
  "url_shorteners": [
    "bit.ly",
    "tinyurl.com",
    "goo.gl",
    // ... add more URL shorteners
  ]
}
```

**How to Update:**

1.  **Identify New Legitimate Headers/Domains:** Monitor official communications from banks, e-commerce platforms, and other legitimate entities in India. Look for their official SMS sender IDs (DLT headers) and the domains they use in their messages.
2.  **Identify New Fraudulent Patterns:** Stay informed about new phishing and scam techniques. This might involve researching cybersecurity reports, news articles, or community forums where new scam patterns are discussed. Pay particular attention to new URL shorteners or domains used in fraudulent messages.
3.  **Edit `trusted_dlt_headers.json`:** Manually edit the `trusted_dlt_headers.json` file:
    *   Add new legitimate DLT headers to the `dlt_headers` array.
    *   Add new legitimate domains to the `whitelisted_domains` array.
    *   Add new URL shorteners or known malicious domains to the `url_shorteners` array.
4.  **Redeploy/Update Application:** After updating the JSON file, you will need to rebuild and redeploy your React Native Expo application to ensure the changes are reflected in the user's app.

**Best Practices for Maintenance:**

-   **Regular Review:** Establish a routine for reviewing and updating this file (e.g., monthly or quarterly).
-   **Community Sourcing:** Consider if there are reliable community-driven lists of DLT headers or malicious domains that you can integrate or cross-reference.
-   **Automated Updates (Advanced):** For a production system, you might consider implementing a secure mechanism to update this file dynamically (e.g., fetching from a secure API endpoint) without requiring a full app update. However, this adds complexity and requires careful security considerations to prevent malicious updates.

Maintaining an up-to-date list of trusted and untrusted patterns is crucial for the long-term effectiveness of the fraud detection system.




## 5. Privacy & Data Handling

One of the core tenets of the OTP Insight Library is its commitment to user privacy. The design philosophy ensures that sensitive user data, particularly message content, remains entirely on the user's device. This section elaborates on the privacy-first approach and how data is handled within the module.

### 5.1. On-Device Processing

All analytical processes, including sender verification, OTP content analysis, context-based rule application, and conceptual machine learning inference, are performed locally on the user's device. This means:

-   **No Message Content Uploaded:** The raw text of SMS messages or any manually provided message content is never transmitted to external servers, cloud services, or any third-party APIs for analysis. The processing pipeline is designed to operate in an entirely offline environment.
-   **Enhanced Security:** By keeping data on the device, the risk of data breaches during transit or at rest on remote servers is eliminated. Users retain full control over their sensitive information.

### 5.2. Local Data Storage

Any data that needs to be persisted for the module's functionality (e.g., historical OTP events for frequency analysis, user interaction timestamps for context analysis) is stored exclusively on the user's device. The conceptual `LocalStorageService` in this library is designed to interface with native mobile storage solutions:

-   **AsyncStorage:** For simple key-value pairs, `AsyncStorage` (part of React Native) is the recommended solution. It provides an asynchronous, unencrypted, persistent key-value storage system for React Native applications.
-   **SQLite (via `expo-sqlite`):** For more structured and queryable data, `expo-sqlite` allows the creation and management of local SQLite databases. This is ideal for storing a history of OTP events or more complex user context data that might require relational queries.

**Key Privacy Aspects of Local Storage:**

-   **No Cloud Sync:** Data stored by this module is not automatically synchronized with any cloud service. If a user wishes to back up or transfer this data, it would need to be handled explicitly by the integrating application, with clear user consent.
-   **Data Isolation:** The data stored by this module is typically sandboxed within the application's private storage directory, meaning other applications on the device cannot directly access it.
-   **User Control over Data:** The integrating React Native Expo application should provide users with mechanisms to:
    *   **View Stored Data:** Allow users to see what data the module is storing (e.g., a log of analyzed messages or suspicious events).
    *   **Clear Data:** Provide an option for users to delete all locally stored data related to the OTP Insight module.
    *   **Opt-out:** Offer a clear way for users to disable the module's functionality, which should also cease data collection and processing.

### 5.3. Minimal Data Collection

The module is designed to collect only the minimum necessary data required for its fraud detection capabilities. This primarily includes:

-   **Message Content (for analysis):** Temporarily processed to extract features like OTPs, amounts, and keywords. The raw message is not persistently stored unless explicitly configured by the integrating application for logging purposes (with user consent).
-   **Timestamps:** Used for context and frequency analysis (e.g., when an OTP arrived, when the user last interacted).
-   **Sender IDs:** Used for verification against DLT headers.
-   **Derived Risk Scores:** The output of the analysis (e.g., `riskLevel`, `isFraud`, `confidence`).

No personally identifiable information (PII) beyond what is strictly necessary for fraud detection is collected or processed. The module does not attempt to identify the user, their contacts, or their broader communication patterns.

### 5.4. Transparency and Consent

For any application integrating this library, it is paramount to maintain transparency with the user regarding data handling practices. This includes:

-   **Clear Privacy Policy:** A comprehensive and easy-to-understand privacy policy should be provided, detailing what data is processed, how it's used, and where it's stored.
-   **Explicit Consent:** For features that involve accessing sensitive data (like SMS messages), explicit user consent must be obtained before enabling the functionality. For Android, the Google SMS User Consent API (which `react-native-sms-retriever` utilizes) handles this by prompting the user.
-   **Just-in-Time Explanations:** When a feature requires specific permissions or data access, provide a clear explanation to the user at that moment about why the access is needed and how their data will be used.

By adhering to these privacy principles, the OTP Insight Library aims to build trust with users, ensuring they feel secure and in control of their data while benefiting from enhanced fraud protection.




## 6. Unit Tests

Robust unit tests are essential for ensuring the reliability and correctness of the OTP Insight Library, especially given its role in fraud detection. This section outlines a conceptual approach to unit testing each component of the library. In a real development environment, you would use a testing framework like Jest along with a test runner.

**Prerequisites for Testing (Conceptual):**

-   **Jest:** A delightful JavaScript Testing Framework with a focus on simplicity.
    ```bash
    cd otp-insight-library
    npm install --save-dev jest ts-jest @types/jest
    ```
-   **`tsconfig.json` for tests:** You might need to configure `tsconfig.json` to include test files and set up `ts-jest`.

    ```json
    // tsconfig.json (add or modify)
    {
      "compilerOptions": {
        // ... existing options
      },
      "include": ["src/**/*", "__tests__/**/*"], // Include test files
      "exclude": ["node_modules"]
    }
    ```

    ```json
    // jest.config.js (create this file)
    module.exports = {
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/src/', '<rootDir>/__tests__/'],
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    };
    ```

### 6.1. `smsProcessing.ts` Tests

Tests for `smsProcessing.ts` should focus on ensuring that messages are correctly processed and that edge cases (e.g., empty messages) are handled gracefully.

**Conceptual Test File: `__tests__/smsProcessing.test.ts`**

```typescript
import { processSmsForConsent } from "../src/smsProcessing";

describe("smsProcessing", () => {
  it("should correctly process a valid SMS message", () => {
    const rawMessage = "Your OTP is 123456. Do not share.";
    const processed = processSmsForConsent(rawMessage);
    expect(processed.messageText).toBe("Your OTP is 123456. Do not share.");
    expect(typeof processed.timestamp).toBe("number");
    expect(processed.timestamp).toBeLessThanOrEqual(Date.now());
  });

  it("should trim whitespace from the message", () => {
    const rawMessage = "  Your OTP is 123456.   ";
    const processed = processSmsForConsent(rawMessage);
    expect(processed.messageText).toBe("Your OTP is 123456.");
  });

  it("should throw an error for an empty message", () => {
    expect(() => processSmsForConsent("")).toThrow("Message text cannot be empty.");
  });

  it("should throw an error for a message with only whitespace", () => {
    expect(() => processSmsForConsent("   ")).toThrow("Message text cannot be empty.");
  });
});
```

### 6.2. `senderVerification.ts` Tests

Tests for `senderVerification.ts` should cover various scenarios for sender IDs and URLs, including legitimate DLT headers, 10-digit numbers, unlisted alphanumeric senders, whitelisted domains, URL shorteners, and malicious URLs.

**Conceptual Test File: `__tests__/senderVerification.test.ts`**

```typescript
import { SenderVerificationService } from "../src/senderVerification";

describe("SenderVerificationService", () => {
  let service: SenderVerificationService;

  beforeEach(() => {
    service = new SenderVerificationService();
  });

  it("should return SAFE for a legitimate DLT header and whitelisted URL", () => {
    const result = service.verifySender("VM-HDFCBK", "Your OTP is 123456. Visit https://www.hdfcbank.com/login");
    expect(result.riskLevel).toBe("SAFE");
    expect(result.details.missingHeader).toBe(false);
    expect(result.details.badURL).toBe(false);
  });

  it("should return SUSPICIOUS for a 10-digit sender ID", () => {
    const result = service.verifySender("9876543210", "Your OTP is 123456.");
    expect(result.riskLevel).toBe("SUSPICIOUS");
    expect(result.details.isTenDigitNumber).toBe(true);
  });

  it("should return SUSPICIOUS for an unlisted alphanumeric sender ID", () => {
    const result = service.verifySender("UNLISTED", "Your OTP is 123456.");
    expect(result.riskLevel).toBe("SUSPICIOUS");
    expect(result.details.unlistedAlphanumeric).toBe(true);
  });

  it("should return HIGH_RISK_FORGERY for a message with a URL shortener", () => {
    const result = service.verifySender("VM-HDFCBK", "Click this link: http://bit.ly/scam");
    expect(result.riskLevel).toBe("HIGH_RISK_FORGERY");
    expect(result.details.badURL).toBe(true);
  });

  it("should return HIGH_RISK_FORGERY for a message with an unwhitelisted domain", () => {
    const result = service.verifySender("DM-SBIBNK", "Update your details: https://malicious.xyz/login");
    expect(result.riskLevel).toBe("HIGH_RISK_FORGERY");
    expect(result.details.badURL).toBe(true);
  });

  it("should prioritize HIGH_RISK_FORGERY if multiple issues exist", () => {
    const result = service.verifySender("9876543210", "Click this link: http://tinyurl.com/fraud");
    expect(result.riskLevel).toBe("HIGH_RISK_FORGERY");
    expect(result.details.isTenDigitNumber).toBe(true);
    expect(result.details.badURL).toBe(true);
  });

  it("should handle messages with no URLs", () => {
    const result = service.verifySender("VM-HDFCBK", "Your account has been credited.");
    expect(result.riskLevel).toBe("SAFE");
    expect(result.details.badURL).toBe(false);
  });
});
```

### 6.3. `otpInsightService.ts` Tests

Tests for `otpInsightService.ts` should verify the correct extraction of OTPs, transaction types, amounts, and merchants from various message formats.

**Conceptual Test File: `__tests__/otpInsightService.test.ts`**

```typescript
import { OTPInsightService } from "../src/otpInsightService";

describe("OTPInsightService", () => {
  let service: OTPInsightService;

  beforeEach(() => {
    service = new OTPInsightService();
  });

  it("should extract a 6-digit OTP", () => {
    const result = service.analyzeOTP("Your OTP is 123456 for login.");
    expect(result.otpCode).toBe("123456");
  });

  it("should extract amount and identify PAYMENT_OUT", () => {
    const result = service.analyzeOTP("Rs. 5000 debited from your account. OTP: 987654");
    expect(result.amount).toBe("5000");
    expect(result.transactionType).toBe("PAYMENT_OUT");
  });

  it("should extract amount and identify PAYMENT_IN", () => {
    const result = service.analyzeOTP("INR 1500 credited to your wallet. Ref: 123. OTP: 112233");
    expect(result.amount).toBe("1500");
    expect(result.transactionType).toBe("PAYMENT_IN");
  });

  it("should identify LOGIN transaction type", () => {
    const result = service.analyzeOTP("Use OTP 456789 to login.");
    expect(result.transactionType).toBe("LOGIN");
  });

  it("should extract merchant name (Amazon)", () => {
    const result = service.analyzeOTP("Your OTP for Amazon purchase is 789012.");
    expect(result.merchant).toBe("amazon");
  });

  it("should return null for OTP and transaction type if not found", () => {
    const result = service.analyzeOTP("Hello, your order has been shipped.");
    expect(result.otpCode).toBeNull();
    expect(result.transactionType).toBeNull();
    expect(result.amount).toBeUndefined();
    expect(result.merchant).toBeUndefined();
  });

  it("should handle different amount formats (with comma)", () => {
    const result = service.analyzeOTP("Amount Rs. 10,000.50 debited.");
    expect(result.amount).toBe("10000.50");
  });
});
```

### 6.4. `contextRules.ts` Tests

Tests for `contextRules.ts` should validate the logic for tracking user interaction and OTP frequency, ensuring that suspicious patterns are correctly identified.

**Conceptual Test File: `__tests__/contextRules.test.ts`**

```typescript
import { UserContextTracker, OtpFrequencyTracker } from "../src/contextRules";

describe("UserContextTracker", () => {
  let tracker: UserContextTracker;

  beforeEach(() => {
    tracker = new UserContextTracker();
    // Reset internal state for each test
    (tracker as any).userContext = { lastInteractionTimestamp: null };
  });

  it("should not be suspicious if no interaction recorded", () => {
    const otpArrival = Date.now();
    expect(tracker.isContextSuspicious(otpArrival)).toBe(false);
  });

  it("should not be suspicious if OTP arrives shortly after interaction", () => {
    tracker.updateLastInteraction();
    const otpArrival = Date.now() + 10000; // 10 seconds later
    expect(tracker.isContextSuspicious(otpArrival, 1)).toBe(false); // 1 minute threshold
  });

  it("should be suspicious if OTP arrives long after interaction", () => {
    tracker.updateLastInteraction();
    const otpArrival = Date.now() + (60 * 1000 * 5); // 5 minutes later
    expect(tracker.isContextSuspicious(otpArrival, 1)).toBe(true); // 1 minute threshold
  });
});

describe("OtpFrequencyTracker", () => {
  let tracker: OtpFrequencyTracker;

  beforeEach(() => {
    tracker = new OtpFrequencyTracker();
    // Reset internal state for each test
    (tracker as any).otpEvents = [];
  });

  it("should not detect attack with few OTPs", () => {
    tracker.recordOtpEvent();
    expect(tracker.isPossibleAttack(1, 3)).toBe(false); // 1 OTP in 1 min, max 3 allowed
  });

  it("should detect attack with high frequency of OTPs", () => {
    tracker.recordOtpEvent();
    tracker.recordOtpEvent();
    tracker.recordOtpEvent();
    tracker.recordOtpEvent(); // 4 OTPs
    expect(tracker.isPossibleAttack(1, 3)).toBe(true); // 4 OTPs in 1 min, max 3 allowed
  });

  it("should only consider OTPs within the window", () => {
    // Record an old OTP
    (tracker as any).otpEvents.push({ timestamp: Date.now() - (60 * 1000 * 10) }); // 10 mins ago
    tracker.recordOtpEvent();
    tracker.recordOtpEvent();
    tracker.recordOtpEvent();
    expect(tracker.isPossibleAttack(1, 2)).toBe(true); // 3 recent OTPs in 1 min, max 2 allowed
  });
});
```

### 6.5. `notificationBuilder.ts` Tests

Tests for `notificationBuilder.ts` should verify that the correct console logs (and conceptually, notification payloads) are generated for different types of alerts.

**Conceptual Test File: `__tests__/notificationBuilder.test.ts`**

```typescript
import { NotificationBuilder } from "../src/notificationBuilder";

describe("NotificationBuilder", () => {
  let builder: NotificationBuilder;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    builder = new NotificationBuilder();
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {}); // Mock console.log
  });

  afterEach(() => {
    consoleSpy.mockRestore(); // Restore original console.log
  });

  it("should send a warning notification", () => {
    builder.sendWarningNotification("Test message");
    expect(consoleSpy).toHaveBeenCalledWith(
      "Sending Warning Notification:",
      expect.objectContaining({
        title: "⚠️ SENDER WARNING!",
        priority: "high",
        data: expect.objectContaining({ type: "sender_forgery" }),
      })
    );
  });

  it("should send a payment alert notification", () => {
    builder.sendPaymentAlert("1000", "Payment message");
    expect(consoleSpy).toHaveBeenCalledWith(
      "Sending Payment Alert Notification:",
      expect.objectContaining({
        title: "🚨 PAYMENT ALERT!",
        body: "This OTP will authorize a PAYMENT of ₹1000.",
        priority: "high",
        data: expect.objectContaining({ type: "payment_alert", amount: "1000" }),
      })
    );
  });

  it("should send a suspicious notification", () => {
    builder.sendSuspiciousNotification("Suspicious message", "Unusual activity");
    expect(consoleSpy).toHaveBeenCalledWith(
      "Sending Suspicious Notification:",
      expect.objectContaining({
        title: "⚠️ Suspicious OTP detected.",
        body: "Reason: Unusual activity.",
        priority: "high",
        data: expect.objectContaining({ type: "suspicious_otp", reason: "Unusual activity" }),
      })
    );
  });

  it("should send a standard notification", () => {
    builder.sendStandardNotification("Standard message");
    expect(consoleSpy).toHaveBeenCalledWith(
      "Sending Standard Notification:",
      expect.objectContaining({
        title: "🔒 OTP Insight: Standard Code",
        priority: "default",
        data: expect.objectContaining({ type: "standard_otp" }),
      })
    );
  });

  it("should log when marking notification safe", () => {
    builder.markNotificationSafe("notification-123");
    expect(consoleSpy).toHaveBeenCalledWith("Notification notification-123 marked as safe (conceptual).");
  });
});
```

### 6.6. `localStorage.ts` Tests

Tests for `localStorage.ts` should verify the conceptual storage and retrieval operations. Since the actual storage is mocked, these tests ensure the methods are called correctly and handle basic data types.

**Conceptual Test File: `__tests__/localStorage.test.ts`**

```typescript
import { LocalStorageService } from "../src/localStorage";

describe("LocalStorageService", () => {
  let service: LocalStorageService;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new LocalStorageService();
    // Reset internal state for each test
    (service as any).storage = new Map();
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {}); // Mock error to prevent noise
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it("should set and get a string item", async () => {
    await service.setItem("testKey", "testValue");
    const value = await service.getItem<string>("testKey");
    expect(value).toBe("testValue");
    expect(consoleSpy).toHaveBeenCalledWith("[LocalStorageService] Stored testKey:", "testValue");
    expect(consoleSpy).toHaveBeenCalledWith("[LocalStorageService] Retrieved testKey:", "testValue");
  });

  it("should set and get an object item", async () => {
    const obj = { name: "test", id: 123 };
    await service.setItem("testObject", obj);
    const value = await service.getItem<{ name: string; id: number }>("testObject");
    expect(value).toEqual(obj);
  });

  it("should return null for a non-existent item", async () => {
    const value = await service.getItem("nonExistentKey");
    expect(value).toBeNull();
  });

  it("should remove an item", async () => {
    await service.setItem("keyToRemove", "value");
    await service.removeItem("keyToRemove");
    const value = await service.getItem("keyToRemove");
    expect(value).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith("[LocalStorageService] Removed item with key: keyToRemove");
  });

  it("should log privacy statement", () => {
    service.logPrivacyStatement();
    expect(consoleSpy).toHaveBeenCalledWith("Privacy Notice: All data processed and stored by this module remains on your device. No network requests are made, and no data is sent to external servers or cloud storage.");
  });

  // Conceptual method tests
  it("should log initialization of persistent storage", async () => {
    await service.initializePersistentStorage();
    expect(consoleSpy).toHaveBeenCalledWith("[LocalStorageService] Conceptual: Initializing persistent storage (e.g., SQLite tables).");
  });

  it("should log saving OTP event", async () => {
    const timestamp = Date.now();
    await service.saveOtpEvent(timestamp);
    expect(consoleSpy).toHaveBeenCalledWith(`[LocalStorageService] Conceptual: Saving OTP event to persistent storage: ${timestamp}`);
  });

  it("should log retrieving OTP events and return empty array", async () => {
    const events = await service.getOtpEvents(Date.now() - 3600000); // 1 hour ago
    expect(events).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[LocalStorageService] Conceptual: Retrieving OTP events from persistent storage since"));
  });
});
```

### 6.7. `mlIntegration.ts` Tests

Tests for `mlIntegration.ts` should verify the conceptual training/loading and prediction functionalities, ensuring the mock behavior is as expected.

**Conceptual Test File: `__tests__/mlIntegration.test.ts`**

```typescript
import { MLIntegrationService, SMSExample } from "../src/mlIntegration";

describe("MLIntegrationService", () => {
  let service: MLIntegrationService;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new MLIntegrationService();
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should simulate training/loading a local model", async () => {
    const corpus: SMSExample[] = [
      { messageText: "test", label: "legitimate" }
    ];
    await service.trainLocalModel(corpus);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Conceptual: Training local model"));
    expect(consoleSpy).toHaveBeenCalledWith("Conceptual: Local model training/loading complete.");
  });

  it("should simulate predicting a fraudulent message", async () => {
    const message = "Your OTP is 123456. Your account will be blocked. Click here: http://scam.com";
    const verdict = await service.predictWithModel(message);
    expect(verdict.isFraud).toBe(true);
    expect(verdict.confidence).toBeGreaterThan(0.5);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Conceptual: Predicting for message:"));
  });

  it("should simulate predicting a legitimate message", async () => {
    const message = "Your OTP for login is 789012.";
    const verdict = await service.predictWithModel(message);
    expect(verdict.isFraud).toBe(false);
    expect(verdict.confidence).toBeLessThanOrEqual(0.85); // Based on mock logic
  });

  it("should throw error if predict is called before trainLocalModel", async () => {
    // Temporarily override the mock in trainLocalModel to not set loadedModel
    const originalTrainLocalModel = service.trainLocalModel;
    service.trainLocalModel = async (corpus: SMSExample[]) => {
      console.log("Mock trainLocalModel called, but not setting model.");
      await new Promise(resolve => setTimeout(resolve, 100));
    };

    await service.trainLocalModel([]); // Call it without actually loading
    await expect(service.predictWithModel("some message")).rejects.toThrow("ML model or vectorizer not loaded. Call trainLocalModel first.");

    service.trainLocalModel = originalTrainLocalModel; // Restore original
  });
});
```

By implementing these unit tests, you can ensure that each part of the OTP Insight Library functions as expected, providing a solid foundation for your React Native Expo application.




## 7. License

This OTP Insight Library is provided under the MIT License.

MIT License

Copyright (c) 2025 Manus AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.




### 3.7. ML Integration (Updated)

The `mlIntegration.ts` module now provides a fully integrated machine learning model for on-device fraud detection. The previously trained Logistic Regression model and its associated TF-IDF vectorizer have been converted to formats compatible with JavaScript environments, allowing for seamless, offline inference within your React Native Expo application.

**Key Components:**

-   **`fraud_detection_model.onnx`:** This is the trained Logistic Regression model, converted to the ONNX (Open Neural Network Exchange) format. ONNX is an open standard for representing machine learning models, enabling models to be transferred between different frameworks and deployed on various platforms.
-   **`vectorizer_data.json`:** This JSON file contains the vocabulary and IDF (Inverse Document Frequency) values from the original Python `TfidfVectorizer`. These are crucial for replicating the TF-IDF transformation in JavaScript, ensuring that the input to the ONNX model is consistent with what it was trained on.

**Class:** `MLIntegrationService`

**Constructor:** `new MLIntegrationService()`

**Methods:**

-   `loadModel(): Promise<void>`
    *   **Purpose:** Asynchronously loads the ONNX model into an `onnxruntime-web` inference session. This method should be called once, typically during your application's startup phase, to prepare the model for predictions.
    *   **Important Note for React Native Expo:** When bundling assets like `.onnx` files in a React Native Expo project, you might need to use `Expo.Asset.fromModule(require('../assets/fraud_detection_model.onnx')).uri` or similar mechanisms to get the correct local URI for the asset, as direct `require` might not resolve to a file path accessible by `onnxruntime-web` in a native environment. Ensure the ONNX file is correctly included in your app's asset bundle.

-   `predictWithModel(messageText: string): Promise<ModelVerdict>`
    *   **Purpose:** Predicts whether a given message is fraudulent using the loaded ONNX model. This function performs the necessary TF-IDF transformation on the input text and then runs inference entirely offline, on the user's device.
    *   `messageText`: The text content of the message to be analyzed for fraud.
    *   Returns: A `Promise` that resolves to a `ModelVerdict` object containing:
        -   `isFraud`: A boolean indicating `true` if the message is predicted as fraudulent, `false` otherwise (based on a 0.5 probability threshold).
        -   `confidence`: A number representing the model's confidence in its prediction (the probability of the message being fraudulent, between 0 and 1).
        -   `details?`: An optional string providing more information about the prediction (e.g., the exact fraud probability).

**Example Usage (within your React Native Expo app):**

```typescript
import { MLIntegrationService, ModelVerdict } from ".//lib/otp-insight/src/mlIntegration";

const mlService = new MLIntegrationService();

async function initializeAndPredict() {
  try {
    // 1. Load the ML model (call this once, e.g., on app start)
    console.log("Loading ML model...");
    await mlService.loadModel();
    console.log("ML model loaded successfully.");

    // 2. Predict on new messages
    const message1 = "Your OTP for login is 789012.";
    const verdict1: ModelVerdict = await mlService.predictWithModel(message1);
    console.log(`Message: "${message1}"\nIs Fraud: ${verdict1.isFraud}, Confidence: ${verdict1.confidence.toFixed(4)}`);

    const message2 = "Dear customer, your account is suspended. Click: http://tinyurl.com/malicious";
    const verdict2: ModelVerdict = await mlService.predictWithModel(message2);
    console.log(`\nMessage: "${message2}"\nIs Fraud: ${verdict2.isFraud}, Confidence: ${verdict2.confidence.toFixed(4)}`);

    const message3 = "Your account has been credited with Rs. 5000.";
    const verdict3: ModelVerdict = await mlService.predictWithModel(message3);
    console.log(`\nMessage: "${message3}"\nIs Fraud: ${verdict3.isFraud}, Confidence: ${verdict3.confidence.toFixed(4)}`);

    const message4 = "Congratulations! You won a lottery. Claim your prize here: http://bit.ly/freemoney";
    const verdict4: ModelVerdict = await mlService.predictWithModel(message4);
    console.log(`\nMessage: "${message4}"\nIs Fraud: ${verdict4.isFraud}, Confidence: ${verdict4.confidence.toFixed(4)}`);

  } catch (error) {
    console.error("Error during ML integration:", error);
  }
}

initializeAndPredict();
```

**How it Works:**

1.  **TF-IDF Transformation in JavaScript:** The `transformTextToTfidf` method within `MLIntegrationService` re-implements the TF-IDF vectorization logic that was used during the model's training in Python. It uses the `vocabulary` and `idf` values loaded from `vectorizer_data.json` to convert raw message text into a numerical feature vector. This ensures that the input format for the ONNX model is exactly what it expects.
2.  **ONNX Runtime Web:** The `onnxruntime-web` library is used to load and run the `fraud_detection_model.onnx` file. This library provides a JavaScript API for executing ONNX models directly in the browser or Node.js environments, and it can be used in React Native via a WebView or by bundling the native ONNX Runtime libraries (though `onnxruntime-web` is often sufficient for simpler models).
3.  **Inference and Prediction:** Once the text is transformed into TF-IDF features, these features are fed into the loaded ONNX model. The model outputs probabilities for each class (fraudulent or legitimate). The `predictWithModel` method then interprets these probabilities to determine if the message is fraudulent and provides a confidence score.

**Integration Considerations for React Native Expo:**

-   **Asset Management:** Ensure that `fraud_detection_model.onnx` and `vectorizer_data.json` are correctly placed in your React Native Expo project's `assets` folder and are bundled with your application. You might need to adjust the `require()` path in `mlIntegration.ts` based on your project's asset loading mechanism.
-   **`onnxruntime-web` in React Native:** While `onnxruntime-web` works well in web environments, its performance and compatibility in a pure React Native (non-web) context might vary. For optimal performance in a native mobile app, you might eventually consider using native ONNX Runtime bindings if `onnxruntime-web` proves insufficient. However, for many text classification tasks, `onnxruntime-web` is a good starting point.
-   **Model Updates:** If you retrain your ML model in Python, you will need to re-run the conversion script (`convert_model.py`) and update the `.onnx` and `.json` files in your React Native Expo project's assets.

This integrated ML solution provides a powerful, on-device fraud detection capability, making your application more robust and privacy-preserving.


