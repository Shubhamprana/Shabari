# 🚀 Shabari App - Google Play Store AAB Submission Guide

## 📋 Overview
This guide will help you build and submit the Shabari Android App Bundle (AAB) to the Google Play Store.

---

## 🔧 Pre-Build Checklist

### ✅ **Build Configuration Verified**
- [x] EAS CLI installed and updated
- [x] Logged into EAS account (shubham485)
- [x] Project configured for AAB builds
- [x] Signing certificates available
- [x] Production environment variables set

### ✅ **App Configuration**
- **Package Name**: `com.shabari.app`
- **Version**: `1.0.0`
- **Version Code**: `61`
- **Target SDK**: `34`
- **Min SDK**: `24`

---

## 🏗️ Building the AAB File

### Method 1: Direct EAS Command
```bash
eas build --platform android --profile playstore
```

### Method 2: Using NPM Script
```bash
npm run build:aab
```

### Method 3: Using Custom Script
```bash
node build-aab-playstore.js
```

---

## 📊 Build Profiles Available

### 1. **playstore** (Recommended for Play Store)
```json
{
  "android": {
    "buildType": "app-bundle",
    "image": "latest",
    "node": "20.18.0",
    "cache": {
      "disabled": true
    },
    "env": {
      "NODE_ENV": "production",
      "EXPO_PUBLIC_ENVIRONMENT": "production",
      "GRADLE_OPTS": "-Xmx4g -XX:MaxMetaspaceSize=512m",
      "JAVA_OPTS": "-Xmx4g"
    }
  }
}
```

### 2. **playstore-aab** (Alternative Profile)
```json
{
  "android": {
    "buildType": "app-bundle",
    "image": "latest", 
    "node": "20.18.0",
    "env": {
      "NODE_ENV": "production",
      "EXPO_PUBLIC_ENVIRONMENT": "production"
    }
  }
}
```

---

## ⏱️ Build Process Timeline

### Expected Build Duration: **15-25 minutes**

1. **Initialization** (2-3 minutes)
   - Environment setup
   - Dependency installation
   - Project configuration

2. **Compilation** (10-15 minutes)
   - React Native bundle creation
   - Android native compilation
   - YARA engine integration
   - Asset optimization

3. **Packaging** (3-5 minutes)
   - AAB file generation
   - Signing with production certificate
   - Upload to EAS servers

---

## 📱 Monitoring Build Progress

### EAS Dashboard
Visit: https://expo.dev/accounts/shubham485/projects/shabari/builds

### Command Line Status
```bash
eas build:list --platform android --status in-progress
```

### Build Logs
```bash
eas build:view [BUILD_ID]
```

---

## 📦 Post-Build Steps

### 1. **Download AAB File**
- Access EAS dashboard
- Navigate to completed build
- Download the `.aab` file

### 2. **Verify AAB Contents**
```bash
# Install bundletool if not already installed
# Extract and verify AAB contents
bundletool build-apks --bundle=shabari.aab --output=shabari.apks
```

### 3. **Test AAB File**
```bash
# Install on test device
bundletool install-apks --apks=shabari.apks
```

---

## 🏪 Google Play Store Submission

### Step 1: Play Console Setup
1. Log into [Google Play Console](https://play.google.com/console)
2. Create new app or select existing "Shabari" app
3. Complete app information if not done

### Step 2: Upload AAB
1. Go to **Release** → **Production**
2. Click **Create new release**
3. Upload the downloaded `.aab` file
4. Add release notes

### Step 3: App Information
Ensure these sections are completed:
- **App content** (content rating, target audience)
- **Store listing** (screenshots, descriptions)
- **Data safety** (privacy policy, permissions)
- **App access** (pricing and distribution)

### Step 4: Review and Publish
1. Review all sections for completeness
2. Submit for review
3. Monitor review status

---

## 🔐 Signing Certificate Information

### Production Certificate
- **File**: `@shubham485__shabari.jks`
- **Alias**: Production signing key
- **Managed by**: EAS (Expo Application Services)

### Certificate Fingerprints
```bash
# Get SHA1 fingerprint for Google services
keytool -list -v -keystore @shubham485__shabari.jks
```

---

## 📋 App Permissions & Features

### Required Permissions
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_SMS" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### Features Declared
- Camera (QR scanning, document capture)
- SMS Reading (fraud detection)
- Internet Access (threat database updates)
- Network State (connectivity checks)

---

## 🚨 Troubleshooting Common Issues

### Build Failures

#### 1. **Memory Issues**
```bash
# Increase heap size in eas.json
"GRADLE_OPTS": "-Xmx6g -XX:MaxMetaspaceSize=1g"
```

#### 2. **Dependency Conflicts**
```bash
# Clear cache and rebuild
eas build --platform android --profile playstore --clear-cache
```

#### 3. **YARA Engine Issues**
```bash
# Verify YARA plugin configuration
node check-yara-android-integration.js
```

### Play Store Rejections

#### 1. **SMS Permission**
- Ensure SMS usage is clearly described
- Provide privacy policy link
- Justify SMS permission in app description

#### 2. **Camera Permission**
- Document QR scanning use case
- Explain fraud detection features
- Provide clear user consent flow

#### 3. **Target API Level**
- Ensure targetSdkVersion is current (34)
- Update if Google Play requirements change

---

## 📊 Build Status Commands

### Check Current Builds
```bash
eas build:list --platform android --limit 5
```

### Monitor Specific Build
```bash
eas build:view [BUILD_ID] --logs
```

### Cancel Running Build
```bash
eas build:cancel [BUILD_ID]
```

---

## 🎯 Success Criteria

### ✅ Build Success Indicators
- [ ] Build completes without errors
- [ ] AAB file size < 100MB
- [ ] All permissions properly declared
- [ ] Signing certificate applied
- [ ] Production environment variables set

### ✅ Play Store Readiness
- [ ] AAB uploaded successfully
- [ ] App content ratings completed
- [ ] Store listing information filled
- [ ] Screenshots and media uploaded
- [ ] Privacy policy accessible
- [ ] App pricing configured

---

## 📞 Support & Resources

### EAS Documentation
- [EAS Build Guide](https://docs.expo.dev/build/introduction/)
- [Android App Bundle](https://docs.expo.dev/build-reference/app-bundle/)

### Play Store Resources  
- [Play Console Help](https://support.google.com/googleplay/android-developer/)
- [App Review Guidelines](https://support.google.com/googleplay/android-developer/answer/9859348)

### Project-Specific
- **EAS Project**: https://expo.dev/accounts/shubham485/projects/shabari
- **Build Profiles**: Check `eas.json` for all available profiles
- **App Config**: Review `app.config.js` for app settings

---

## 🏁 Final Checklist

Before submitting to Play Store:

- [ ] AAB build completed successfully
- [ ] App tested on multiple Android devices
- [ ] All features working in production build
- [ ] Privacy policy updated and accessible
- [ ] Store listing optimized with keywords
- [ ] Screenshots showcase key features
- [ ] App description highlights cybersecurity benefits
- [ ] MSME hackathon details included in description
- [ ] Contact information and support details provided

**🎉 Your Shabari app is ready for the Google Play Store!**

