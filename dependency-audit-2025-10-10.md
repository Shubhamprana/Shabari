# Dependency Audit Report (2025-10-10)

Scope: All detected package managers in this repository (npm/yarn/pnpm via package.json files, and Android Gradle).
This report includes security vulnerabilities (IDs, severity, fixed versions when available) and update availability.
Major version updates are listed but deferred due to potential breaking changes.

## JavaScript/Node — shabari

Location: .

Vulnerabilities:
- form-data: CRITICAL — 1106507 (form-data uses unsafe random function in form-data for choosing boundary) — https://github.com/advisories/GHSA-fjxv-7rqg-78g4 — fix available: >=4.0.4 — affected: >=4.0.0 <4.0.4
- form-data: CRITICAL — 1106508 (form-data uses unsafe random function in form-data for choosing boundary) — https://github.com/advisories/GHSA-fjxv-7rqg-78g4 — fix available: >=3.0.4 — affected: >=3.0.0 <3.0.4
- axios: HIGH — 1108263 (Axios is vulnerable to DoS attack through lack of data size check) — https://github.com/advisories/GHSA-4hjh-wcwx-xvwj — fix available: >=1.12.0 — affected: >=1.0.0 <1.12.0
- compression: LOW — on-headers — affected: 1.0.3 - 1.8.0
- on-headers: LOW — 1106812 (on-headers is vulnerable to http response header manipulation) — https://github.com/advisories/GHSA-76c9-3jph-rj3q — fix available: >=1.1.0 — affected: <1.1.0
- patch-package: LOW — tmp — affected: <=8.0.0 || >=8.1.0-canary
- tmp: LOW — 1106849 (tmp allows arbitrary temporary file / directory write via symbolic link `dir` parameter) — https://github.com/advisories/GHSA-52f5-9888-hmc6 — affected: <=0.2.3

Available updates:
- @babel/core: 7.27.4 → 7.28.4 — safe to batch (subject to tests)
- @react-native-clipboard/clipboard: 1.16.2 → 1.16.3 — safe to batch (subject to tests)
- @react-navigation/bottom-tabs: 7.4.2 → 7.4.8 — safe to batch (subject to tests)
- @react-navigation/elements: 2.5.2 → 2.6.5 — safe to batch (subject to tests)
- @react-navigation/native: 7.1.14 → 7.1.18 — safe to batch (subject to tests)
- @react-navigation/stack: 7.4.2 → 7.4.9 — safe to batch (subject to tests)
- @supabase/supabase-js: 2.50.2 → 2.75.0 — safe to batch (subject to tests)
- @types/react: 18.3.23 → 18.3.26 (latest 19.2.2) — BREAKING CHANGES POSSIBLE — defer
- axios: 1.10.0 → 1.12.2 — safe to batch (subject to tests)
- patch-package: 8.0.0 → 8.0.1 — safe to batch (subject to tests)
- zustand: 5.0.5 → 5.0.8 — safe to batch (subject to tests)

Batchable patch/minor updates (10):
  - @babel/core: 7.27.4 → 7.28.4
  - @react-native-clipboard/clipboard: 1.16.2 → 1.16.3
  - @react-navigation/bottom-tabs: 7.4.2 → 7.4.8
  - @react-navigation/elements: 2.5.2 → 2.6.5
  - @react-navigation/native: 7.1.14 → 7.1.18
  - @react-navigation/stack: 7.4.2 → 7.4.9
  - @supabase/supabase-js: 2.50.2 → 2.75.0
  - axios: 1.10.0 → 1.12.2
  - patch-package: 8.0.0 → 8.0.1
  - zustand: 5.0.5 → 5.0.8

## JavaScript/Node — react-native-proxy-engine-example

Location: react-native-proxy-engine\example (no lockfile detected — audit accuracy may be limited)

Vulnerabilities:
- No known vulnerabilities reported by npm audit.

Available updates:
- react: undefined → 18.3.1 (latest 19.2.0) — safe to batch (subject to tests)
- react-native: undefined → 0.72.17 (latest 0.82.0) — safe to batch (subject to tests)

Batchable patch/minor updates (2):
  - react: undefined → 18.3.1
  - react-native: undefined → 0.72.17

## JavaScript/Node — shabari-protection-functions

Location: react-native-proxy-engine\functions (no lockfile detected — audit accuracy may be limited)

Vulnerabilities:
- No known vulnerabilities reported by npm audit.

Available updates:
- firebase-admin: undefined → 11.11.1 (latest 13.5.0) — safe to batch (subject to tests)
- firebase-functions: undefined → 4.9.0 (latest 6.5.0) — safe to batch (subject to tests)

Batchable patch/minor updates (2):
  - firebase-admin: undefined → 11.11.1
  - firebase-functions: undefined → 4.9.0

## JavaScript/Node — react-native-proxy-engine

Location: react-native-proxy-engine

Vulnerabilities:
- No known vulnerabilities reported by npm audit.

Available updates:
- @react-native/babel-preset: 0.81.1 → 0.81.4 (latest 0.82.0) — safe to batch (subject to tests)

Batchable patch/minor updates (1):
  - @react-native/babel-preset: 0.81.1 → 0.81.4

## JavaScript/Node — react-native-yara-engine

Location: react-native-yara-engine (no lockfile detected — audit accuracy may be limited)

Vulnerabilities:
- No known vulnerabilities reported by npm audit.

Available updates:
- All dependencies up-to-date (per npm outdated).

No patch/minor updates to batch.

## JavaScript/Node — shabarifixed

Location: ShabariFixed

Vulnerabilities:
- compression: LOW — on-headers — affected: 1.0.3 - 1.8.0
- on-headers: LOW — 1106812 (on-headers is vulnerable to http response header manipulation) — https://github.com/advisories/GHSA-76c9-3jph-rj3q — fix available: >=1.1.0 — affected: <1.1.0

Available updates:
- @babel/core: 7.27.4 → 7.28.4 — safe to batch (subject to tests)
- expo: 53.0.12 → 53.0.23 (latest 54.0.12) — BREAKING CHANGES POSSIBLE — defer

Batchable patch/minor updates (1):
  - @babel/core: 7.27.4 → 7.28.4

## JavaScript/Node — otp-insight-library

Location: src\lib\otp-insight-library (no lockfile detected — audit accuracy may be limited)

Vulnerabilities:
- No known vulnerabilities reported by npm audit.

Available updates:
- All dependencies up-to-date (per npm outdated).

No patch/minor updates to batch.

## Android (Gradle) — Dependencies Overview

Detected Gradle dependency coordinates (Android):
- android\app\build.gradle
  - [implementation] com.google.android.gms:play-services-auth:20.7.0
  - [implementation] com.google.android.gms:play-services-base:18.5.0
  - [implementation] com.squareup.okio:okio:3.5.0
  - [implementation] com.squareup.okhttp3:okhttp:4.11.0
  - [implementation] org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3
  - [implementation] org.jetbrains.kotlin:kotlin-stdlib:1.9.0
  - [implementation] com.facebook.react:react-android
  - [implementation] com.facebook.fresco:animated-gif:${reactAndroidLibs.versions.fresco.get(
  - [implementation] com.facebook.fresco:webpsupport:${reactAndroidLibs.versions.fresco.get(
  - [implementation] com.facebook.fresco:animated-webp:${reactAndroidLibs.versions.fresco.get(
  - [implementation] com.facebook.react:hermes-android

Automated vulnerability scanning for Gradle is not enabled in this repo.
To enable update reports: add the Gradle Versions Plugin and run `./gradlew dependencyUpdates`.
To enable security scanning: integrate OWASP Dependency-Check or use GitHub Dependabot/Snyk.
