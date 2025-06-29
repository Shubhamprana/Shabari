# Shabari: The AI-Powered Mobile Guardian - Bolt.new Hackathon Submission

**Team Name:** Prajapati Tech
**Project Link:** [GitHub Repo Link Here]
**Video Demo Link:** [YouTube/Loom Link Here - *Highly Recommended to Create This*]

> **Elevator Pitch:** Shabari is a next-generation, AI-powered mobile security suite designed for the unique challenges faced by users in India and other emerging markets. It moves beyond traditional antivirus, offering real-time, context-aware protection against modern financial scams like UPI fraud, SMS phishing, and malicious QR codes, all while prioritizing user privacy and providing a culturally resonant user experience.

---

## 1. The Problem: A Digital Pandemic in India

India's rapid digitization has been revolutionary, but it has also unleashed a new pandemic: digital fraud. Cybercriminals are relentlessly targeting millions of users who may be new to digital finance, exploiting their trust through increasingly sophisticated scams.

The primary attack vectors are not viruses, but social engineering attacks that traditional security apps miss:
*   **UPI Payment Fraud:** Scammers use malicious QR codes to trick users into authorizing payments to fraudulent accounts. The speed of UPI makes these transactions irreversible.
*   **SMS Phishing ("Smishing"):** Fake messages about KYC updates, lottery winnings, or electricity bill disconnections trick users into clicking malicious links or sharing sensitive data.
*   **Malicious URL Propagation:** Dangerous links are spread rapidly through WhatsApp, Telegram, and other social apps, leading to credential theft and malware installation.
*   **File-Based Malware:** Fake government apps, modded APKs, and fraudulent documents are shared directly, bypassing app store protections.

Existing antivirus solutions are often generic, heavy on resources, and fail to understand the local context of these scams, leaving millions of users vulnerable.

---

## 2. Our Solution: The Shabari App

Shabari is a "digital guardian" built to provide intelligent, proactive, and privacy-first security. Our solution is built on three core principles:

1.  **Context-Aware AI:** We don't just scan for viruses; we analyze the *context* of a message, URL, or QR code to understand its *intent*.
2.  **User-Controlled Privacy:** Security should not come at the cost of privacy. Key features like the SMS scanner are manually triggered, ensuring users' personal data is never scanned without their explicit consent.
3.  **Seamless User Experience:** Protection should be effortless. Shabari integrates directly into the user's daily workflow, intercepting threats from WhatsApp, SMS, and file downloads with zero friction.

### Key Features Implemented:

*   **Live QR Fraud Scanner:** Uses a dual-analysis engine. It instantly identifies UPI payment QR codes for fast, *local* analysis to prevent payment fraud, while analyzing general-purpose QRs with a deeper, cloud-based scan.
*   **Manual SMS Fraud Scanner:** A privacy-first tool that lets users manually select and scan suspicious SMS messages for phishing links, scam patterns, and OTP fraud. No background monitoring of personal messages.
*   **Automatic URL Protection:** Intercepts links shared from any app (e.g., WhatsApp) and scans them with VirusTotal's powerful API before the user can open them.
*   **Secure File Quarantine:** Any file shared to Shabari or downloaded in the background is automatically placed in a secure quarantine, scanned with the **Yara pattern matching engine**, and checked against a threat database.
*   **Photo & Screenshot Analysis:** Uses OCR and AI to detect fraud in images, such as fake payment confirmation screenshots or forged documents.

---

## 3. The "30-Second WOW" Demo Walkthrough

Shabari's power is best demonstrated live. Here is the typical user's "first run" experience that showcases its multi-layered protection in under 30 seconds.

**Step 1: The QR Code Test (15 seconds)**
1.  User opens the **Live QR Scanner**. A beautiful, animated scanning interface appears.
2.  They first scan a legitimate UPI payment QR code.
3.  **Result:** The UI instantly shows a green "✅ **PAYMENT SAFE**" overlay, with the subtext "**Local Analysis**." This demonstrates instant, privacy-preserving protection for financial transactions.
4.  Next, they scan a QR code containing a malicious link (`http://test-phishing-site.com`).
5.  **Result:** The UI immediately turns red with a pulsating "�� **FRAUD DETECTED**" overlay. The subtext reads "**Malicious Content Detected • Cloud Analysis**." This showcases our deeper scanning capabilities for non-financial QRs.

**Step 2: The SMS Scam Test (10 seconds)**
1.  The user navigates to the **SMS Scanner**. They see a list of their *actual* SMS messages (no mock data).
2.  They tap "Analyze" on a common scam message (e.g., "Your electricity will be disconnected...").
3.  **Result:** A detailed analysis card appears, flagging it as "**HIGH RISK**" and identifying the "Urgency Tactic" and "Suspicious Link" as fraud indicators. This highlights our contextual AI and commitment to user control.

**Step 3: The WhatsApp Link Test (5 seconds)**
1.  The user receives a malicious link from a friend in WhatsApp.
2.  They click the link. Instead of a browser opening, the Android "Open with" dialog appears.
3.  They select "Shabari."
4.  **Result:** Shabari immediately displays a full-screen alert: "🛡️ **DANGEROUS WEBSITE BLOCKED**," detailing the threat found by VirusTotal. This shows how our protection is seamlessly integrated into their existing apps.

---

## 4. Technical Architecture & Core Technologies

We chose a modern, scalable, and cross-platform tech stack to build Shabari, allowing for rapid development and robust performance.

| Technology/Library | Purpose in Shabari | Why It Was Chosen |
| :--- | :--- | :--- |
| **React Native & Expo** | Core App Framework | Enables cross-platform development (Android, iOS, Web) from a single codebase. Expo's managed workflow and tools drastically accelerated our build and deployment process. |
| **Zustand** | State Management | A lightweight, simple, and unopinionated state management solution. Perfect for managing global state like subscription status and user authentication without the boilerplate of Redux. |
| **Supabase** | Backend & Authentication | An all-in-one BaaS that provides a PostgreSQL database, user authentication, and storage. It allowed us to build a secure backend with user accounts and account deletion features in hours, not weeks. |
| **VirusTotal API** | URL & File Threat Intel | The gold standard for threat intelligence. We use it to get real-time analysis on URLs and file hashes from over 70 antivirus scanners, providing world-class detection capabilities. |
| **Yara Engine** | File Pattern Matching | A powerful tool used by malware researchers. We integrated it directly into the app's native layer to perform fast, offline pattern matching on files to detect known malware families—a highly advanced feature for a mobile app. |
| **On-Device AI/ML Kit** | OCR & Text Analysis | For the Photo Fraud feature, we use on-device ML for Optical Character Recognition (OCR) to extract text from images. This text is then fed into our local text analysis models to find fraud patterns without uploading user photos. |
| **RevenueCat SDK** | **(Sponsor Tool)** Subscription Mgmt. | Manages our Free vs. Premium tiers. It abstracts away the massive complexity of Google Play Billing, providing a trusted UI and powerful analytics for conversion and churn. |
| **Sentry** | **(Sponsor Tool)** Error & Perf. Monitoring | Essential for a security app. Sentry automatically reports crashes and performance bottlenecks, allowing us to maintain the high level of stability and trust our users expect. |

---

## 5. Deep Dive: The QR Scanner Implementation Workflow

Our Live QR Scanner is a prime example of our engineering philosophy. It's not just a scanner; it's an intelligent, multi-stage analysis engine.

1.  **Camera & Scanning:** We use `react-native-camera` to access the camera feed and `expo-barcode-scanner` for high-performance QR code detection.
2.  **Immediate Feedback:** On successful scan detection, a haptic feedback pulse is triggered, giving the user instant physical confirmation.
3.  **Smart Classification (The "Magic" Step):** As soon as data is extracted, the `classifyQRType()` function runs. It uses regex and pattern matching to determine if the QR code is a **UPI Payment** (`upi://...`) or **General Purpose** (URL, Text, etc.). This decision dictates the entire subsequent workflow.
4.  **Conditional Analysis Path:**
    *   **If `PAYMENT`:** The analysis is routed to our `immediatePaymentProtection()` function. This function runs **entirely offline**. It validates the UPI structure, checks for suspicious merchant names, and analyzes the transaction notes for scam keywords. This guarantees speed and privacy for financial data.
    *   **If `GENERAL`:** The analysis is routed to `detailedVirusTotalAnalysis()`. The data (e.g., a URL) is sent to the VirusTotal API for a comprehensive cloud-based scan. This provides maximum security for web links and other data types.
5.  **Dynamic UI Rendering:** The UI reacts in real-time to the analysis stages:
    *   A "Classifying..." indicator appears.
    *   The "Payment QR" or "General QR" badge animates into view.
    *   Finally, the animated red (fraud) or green (safe) result overlay is displayed, creating a rich, informative, and reassuring user experience.

This sophisticated workflow allows Shabari to provide the **right type of security at the right time**, prioritizing speed and privacy for payments while leveraging the full power of the cloud for all other threats.

---

## 6. How We Leveraged the Bolt.new Sponsors

We strategically integrated sponsor tools to build a production-ready application, not just a hackathon prototype.

| Sponsor | Tool Used | How it Supercharged Shabari |
| :--- | :--- | :--- |
| **RevenueCat** | Purchases SDK & Dashboard | **CRITICAL for our business model.** Allowed us to implement a robust Free vs. Premium subscription system in under a day. We can now A/B test pricing and view conversion analytics, turning a project into a potential business. |
| **Expo** | Production Plan & EAS Build | **ESSENTIAL for deployment.** The free Production Plan credit gave us the priority build queue and unlimited EAS builds needed to create our production APK for testing and submission to the Google Play Store. |
| **Sentry** | Error & Performance Monitoring | **CRUCIAL for user trust.** As a security app, we cannot afford to crash. Sentry is our safety net, providing instant alerts on any issues so we can fix them before they impact our users. |
| **Entri** | Free Custom Domain | **IMPORTANT for professionalism.** We will use our free domain to host our official Privacy Policy, a requirement for the Play Store. A custom domain (`shabari-app.com`) builds significantly more trust than a generic GitHub Pages link. |

*We evaluated all sponsor perks and chose the ones that provided the most direct value to our core mission. For example, while the **Nodely** credit for Web3 APIs was generous, we made a strategic decision to focus on solving Web2 security problems first.*

---

## 7. Future Roadmap & Vision

This hackathon is just the beginning. Shabari is built on a scalable architecture that allows for immense future growth.

*   **Short-Term (Next 3 Months):**
    *   **Publish to Google Play Store:** Complete our store listing and launch to the public.
    *   **Localization (with Lingo):** Use the Lingo credits to translate Shabari into Hindi, Tamil, and Bengali to vastly expand our user base.
    *   **Community Threat Reporting:** Allow users to report new scams directly from the app to improve our AI models.
*   **Long-Term (12+ Months):**
    *   **Proactive Background Monitoring:** Introduce a premium, opt-in feature that uses Android's Accessibility Services to monitor for threats in real-time without needing manual intervention.
    *   **Enterprise Version:** Develop a version of Shabari for businesses to protect their employees' mobile devices.
    *   **AI Model Evolution:** Continuously train our models on new fraud data to stay ahead of cybercriminals.

---

## 8. Why Shabari Deserves to Win

Shabari is more than just a collection of features; it's a mission-driven project with the potential for massive social and commercial impact. We believe we should win because:

1.  **We Solved a Real, Painful Problem:** We didn't build a trivial app. We tackled a complex and harmful issue affecting millions of people with a solution that is both technically advanced and deeply empathetic to the user.
2.  **We Demonstrated Technical Excellence:** From integrating a native Yara engine to architecting a conditional analysis QR scanner, we've shown a high level of engineering skill and thoughtfulness.
3.  **We Built a Complete, Polished Product:** Shabari is not a wireframe; it's a beautiful, functional, and production-ready application that is ready to be shipped.
4.  **We Strategically Used Sponsor Tools:** We embraced the spirit of the hackathon by integrating multiple sponsor technologies not as a gimmick, but as core components of our architecture and business strategy.

Thank you for your time and consideration. We are proud of what we have built and excited about Shabari's potential to make the digital world a safer place. 