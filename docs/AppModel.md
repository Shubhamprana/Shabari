## Shabari App Model

This document summarizes how the app works today so it can be presented to anyone quickly. It includes a top-level architecture diagram, key flows, and a compact feature map.

### Architecture Overview

```mermaid
graph TB
  %% Top-level
  A["User"] --> B["React Navigation Screens"]
  subgraph UI["UI / Screens"]
    B --> B1["Dashboard"]
    B --> B2["Login / Onboarding"]
    B --> B3["Settings"]
    B --> B4["SMS Scanner"]
    B --> B5["Manual SMS Scanner"]
    B --> B6["Live QR Scanner"]
    B --> B7["Secure Browser"]
    B --> B8["Quarantine"]
    B --> B9["Scan Result"]
  end

  %% Startup
  A1["App Startup"] --> A2["StartupInitializer"]
  A2 --> A3["AutoInitializationService"]

  %% Services initialized
  A3 --> S1["ExpoNotificationService"]
  A3 --> S2["URLProtectionService"]
  A3 --> S3["NativeFileScanner / YaraSecurityService"]
  A3 --> S4["QRScannerService"]
  A3 --> S5["SMSReaderService"]

  %% Background monitors
  subgraph BG["Background Monitors"]
    M1["ClipboardURLMonitor"] --> S2
    M2["WatchdogFileService"] --> S3
    M3["ShareIntentService"] --> S3
  end

  %% SMS/OTP Insight pipeline
  S5 --> O1["OtpInsightService"]
  O1 --> O2["SenderVerification / OTP extraction / Context rules"]
  O1 --> O3["MLIntegrationService (premium)"]
  O1 --> S1

  %% URL protection manual
  B7 --> S2
  B4 --> S5
  B5 --> O1
  B6 --> S4

  %% File scanning & quarantine
  S3 --> Q1["Threat verdict"]
  Q1 -->|unsafe| N1["High-priority notification"]
  Q1 -->|unsafe| B8
  Q1 -->|safe| B9

  %% State management
  subgraph ST["State / Stores"]
    T1["authStore (session)"]
    T2["subscriptionStore (isPremium)"]
    T3["featurePermissionStore (toggles & permissions)"]
  end

  T1 <--> DB["Supabase (auth)"]
  T2 --> O3
  T2 --> BG
  T3 --> BG
  T3 --> A3

  %% Navigation control
  T1 -->|isAuthenticated| B1
  T1 -->|!isAuthenticated| B2

  %% Notifications
  S1 --> B1

  classDef ui fill:#e8f4ff,stroke:#6aa9ff,stroke-width:1px;
  classDef svc fill:#e6ffe8,stroke:#39b54a,stroke-width:1px;
  classDef store fill:#fff7e6,stroke:#ffa500,stroke-width:1px;
  classDef bg fill:#f3e8ff,stroke:#9b59b6,stroke-width:1px;

  class B,B1,B2,B3,B4,B5,B6,B7,B8,B9 ui
  class S1,S2,S3,S4,S5,O1,O2,O3 svc
  class T1,T2,T3 store
  class M1,M2,M3 bg
```

### Key Flows

- **Authentication & Subscription**: `authStore` manages session with Supabase; `subscriptionStore` syncs premium status. Navigation chooses `Onboarding/Login` or `Dashboard`.
- **Startup**: `StartupInitializer` runs, then `AutoInitializationService` prepares Notifications, URL Protection, File Scanner/YARA, QR Scanner, and SMS (smart/on-demand on Android).
- **SMS/OTP Analysis**: `SMSReaderService` captures messages → `OtpInsightService` runs sender checks, OTP extraction, context rules, optional ML (premium) → user notified via `ExpoNotificationService`.
- **URL Protection**: Manual scans from `SecureBrowser` and background `ClipboardURLMonitor` feed into `URLProtectionService` for checks.
- **File Scanning & Quarantine**: `WatchdogFileService` and `ShareIntentService` trigger scans via `NativeFileScanner`/`YaraSecurityService`. Unsafe files produce high-priority notifications and appear in `Quarantine`.
- **QR Scanning**: `LiveQRScannerScreen` uses `QRScannerService` for safe parsing and checks.
- **Feature Controls**: `featurePermissionStore` holds premium toggles, permission states, and optimization modes; integrates with auto-init and background monitors.

### Feature Map (Where to show in app)

- **Dashboard**: Status of services, quick actions, and recent scan stats.
- **Settings**: Feature toggles, permissions, and upgrade entry.
- **SMS Scanner / Manual SMS**: Demonstrate OTP Insight and consent-driven analysis.
- **Secure Browser**: Show URL protection and manual scans.
- **Quarantine**: Review unsafe files and actions taken.
- **Live QR Scanner**: Live detection and safe navigation.

### References (core files)

- Navigation: `src/navigation/AppNavigator.tsx`
- Startup: `src/components/StartupInitializer.tsx`, `src/services/AutoInitializationService.ts`
- Stores: `src/stores/authStore.ts`, `src/stores/subscriptionStore.ts`, `src/stores/featurePermissionStore.ts`
- Services: `src/services/*` (URLProtection, WatchdogFile, NativeFileScanner, YaraSecurityService, QRScannerService, SMSReaderService, ExpoNotificationService)
- OTP Insight: `src/services/OtpInsightService.ts`, `src/lib/otp-insight-library/src/*`
- Backend: `src/lib/supabase.ts`

---

Tip: You can present this diagram directly on GitHub (Mermaid is supported), then walk through the flows using the screen names above.

