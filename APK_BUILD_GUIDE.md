# 📱 Shabari App - APK Build Guide

## 🎯 Overview
This guide covers building APK files for your Shabari cybersecurity application for testing and distribution.

---

## 🔧 Available APK Build Profiles

### 1. **production** (Recommended for Release)
```json
{
  "android": {
    "buildType": "apk",
    "gradleCommand": ":app:assembleRelease",
    "image": "latest",
    "node": "20.18.0",
    "env": {
      "ANDROID_NDK_HOME": "/opt/android-sdk-linux/ndk/25.1.8937393",
      "NODE_ENV": "production",
      "EXPO_PUBLIC_ENVIRONMENT": "production"
    }
  }
}
```

### 2. **production-fixed** (Enhanced Memory)
```json
{
  "android": {
    "buildType": "apk",
    "gradleCommand": ":app:assembleRelease",
    "image": "latest",
    "node": "20.18.0",
    "cache": {
      "disabled": true
    },
    "env": {
      "NODE_ENV": "production",
      "EXPO_PUBLIC_ENVIRONMENT": "production",
      "GRADLE_OPTS": "-Xmx6g -XX:MaxMetaspaceSize=1g",
      "JAVA_OPTS": "-Xmx6g",
      "EAS_SKIP_AUTO_FINGERPRINT": "1"
    }
  }
}
```

### 3. **preview** (Testing)
```json
{
  "android": {
    "buildType": "apk",
    "image": "latest",
    "node": "20.18.0"
  }
}
```

### 4. **development** (Debug)
```json
{
  "android": {
    "buildType": "apk",
    "gradleCommand": ":app:assembleDebug",
    "image": "latest",
    "node": "20.18.0",
    "env": {
      "NODE_ENV": "development",
      "EXPO_SKIP_PREBUILD": "1"
    }
  }
}
```

---

## 🚀 Building APK Files

### Method 1: EAS CLI Commands

#### Production APK (Recommended)
```bash
eas build --platform android --profile production
```

#### Preview APK (Testing)
```bash
eas build --platform android --profile preview
```

#### Development APK (Debug)
```bash
eas build --platform android --profile development
```

#### Production APK with Enhanced Memory
```bash
eas build --platform android --profile production-fixed
```

### Method 2: NPM Scripts
```bash
# If you have custom scripts in package.json
npm run build:apk
```

### Method 3: Custom Build Scripts
```bash
# Using the custom script
node build-apk-production.js
```

---

## ⏱️ Build Timeline

### Expected APK Build Duration: **10-20 minutes**

1. **Initialization** (2-3 minutes)
   - Environment setup
   - Dependency resolution
   - NDK and SDK configuration

2. **Compilation** (6-12 minutes)
   - React Native bundle creation
   - Android native compilation
   - YARA engine integration
   - Native modules compilation

3. **Assembly** (2-5 minutes)
   - APK packaging
   - Signing with certificates
   - Optimization and compression

---

## 📊 Monitoring Build Progress

### Real-time Build Status
```bash
# Check current builds
eas build:list --platform android --limit 5

# Monitor specific build
eas build:view [BUILD_ID] --logs

# Check only in-progress builds
eas build:list --platform android --status in-progress
```

### EAS Dashboard
Visit: https://expo.dev/accounts/shubham485/projects/shabari/builds

---

## 📱 APK File Details

### App Information
- **Package Name**: `com.shabari.app`
- **Version**: `1.0.0`
- **Version Code**: `61`
- **Target SDK**: `34`
- **Min SDK**: `24`

### APK Specifications
- **Architecture**: Universal (arm64-v8a, armeabi-v7a, x86, x86_64)
- **Signed**: Yes (Production certificate)
- **Optimized**: Release build optimizations enabled
- **Size**: ~15-25 MB (estimated)

### Features Included
- Document Scanner with YARA engine
- QR Code Scanner with fraud detection
- Link Scanner with Google Safe Browsing
- SMS Shield (Premium)
- AI Guardian (Premium)
- Secure Browser (Premium)

---

## 🔐 Signing & Security

### Certificate Information
- **Keystore**: `@shubham485__shabari.jks`
- **Managed by**: EAS (Expo Application Services)
- **Type**: Production signing certificate

### Security Features
- **ProGuard**: Enabled for code obfuscation
- **Hermes**: Enabled for JavaScript optimization
- **NDK**: Version 25.1.8937393
- **SSL Pinning**: Configured for API communications

---

## 📦 Post-Build Actions

### 1. Download APK
```bash
# From EAS dashboard or CLI
eas build:download [BUILD_ID]
```

### 2. Verify APK
```bash
# Check APK contents
aapt dump badging shabari.apk

# Analyze APK size
bundletool build-apks --bundle=shabari.apk --output=analysis.apks
```

### 3. Install for Testing
```bash
# Install on connected device
adb install shabari.apk

# Install with package replacement
adb install -r shabari.apk
```

---

## 🧪 Testing Your APK

### Device Testing Checklist
- [ ] Install on multiple Android versions (API 24+)
- [ ] Test on different screen sizes
- [ ] Verify all permissions work correctly
- [ ] Test core features (scanning, detection)
- [ ] Check network connectivity features
- [ ] Verify premium features (if applicable)

### Testing Commands
```bash
# Check app info
adb shell dumpsys package com.shabari.app

# Monitor app logs
adb logcat | grep Shabari

# Check app permissions
adb shell dumpsys package com.shabari.app | grep permission
```

---

## 🚨 Troubleshooting

### Common Build Issues

#### 1. Memory Errors
```bash
# Use production-fixed profile with more memory
eas build --platform android --profile production-fixed
```

#### 2. Cache Issues
```bash
# Clear cache and rebuild
eas build --platform android --profile production --clear-cache
```

#### 3. YARA Engine Problems
```bash
# Check YARA integration
node check-yara-android-integration.js
```

#### 4. Dependency Conflicts
```bash
# Clean installation
rm -rf node_modules
npm install
eas build --platform android --profile production
```

### Build Failure Solutions

#### Gradle Build Errors
- Check Android SDK/NDK versions
- Verify build tools compatibility
- Review build logs for specific errors

#### JavaScript Bundle Errors
- Verify React Native configuration
- Check for syntax errors in code
- Ensure all dependencies are compatible

#### Native Module Issues
- Verify expo-modules autolinking
- Check native module compatibility
- Review Android manifest configuration

---

## 📋 Distribution Options

### 1. Direct Distribution
- Share APK file directly
- Install via file manager
- Use for internal testing

### 2. Firebase App Distribution
```bash
# Upload to Firebase for beta testing
firebase appdistribution:distribute shabari.apk --groups testers
```

### 3. Play Store Internal Testing
- Upload APK to Play Console
- Use for internal testing track
- Distribute to limited testers

### 4. GitHub Releases
- Create GitHub release
- Attach APK as release asset
- Provide version notes

---

## 📊 Build Comparison

| Profile | Build Type | Use Case | Build Time | Features |
|---------|------------|----------|------------|----------|
| production | Release APK | Final distribution | 15-20 min | All features, optimized |
| production-fixed | Release APK | High-memory builds | 10-15 min | All features, more memory |
| preview | Preview APK | Testing | 8-12 min | All features, debug info |
| development | Debug APK | Development | 6-10 min | Debug mode, fast builds |

---

## 🎯 Success Checklist

### Pre-Build
- [ ] EAS CLI installed and logged in
- [ ] Project configured correctly
- [ ] All dependencies installed
- [ ] Build profile selected

### Post-Build
- [ ] APK downloaded successfully
- [ ] App installs without errors
- [ ] All features working correctly
- [ ] Performance acceptable
- [ ] No critical bugs found

### Distribution Ready
- [ ] APK tested on multiple devices
- [ ] Version information correct
- [ ] Permissions working properly
- [ ] Ready for distribution/submission

---

## 🔗 Quick Commands Reference

```bash
# Build production APK
eas build --platform android --profile production

# Check build status
eas build:list --platform android --limit 3

# Download latest build
eas build:download

# Monitor build logs
eas build:view [BUILD_ID] --logs

# Cancel running build
eas build:cancel [BUILD_ID]
```

**🎉 Your Shabari APK is ready for testing and distribution!**
