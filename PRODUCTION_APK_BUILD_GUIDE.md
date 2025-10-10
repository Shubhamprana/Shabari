# 🚀 **Shabari Production APK Build Guide**

## 📱 **Version 1.1.0 - Production Ready**

This guide will help you build a production-ready APK of Shabari with all the new call protection features for testing distribution.

---

## 🔧 **Prerequisites**

### **Required Software:**
- ✅ **Node.js 20.x** or higher
- ✅ **NPM** or **Yarn**
- ✅ **EAS CLI** (`npm install -g @expo/eas-cli`)
- ✅ **Expo CLI** (optional but recommended)

### **Required Accounts:**
- ✅ **Expo/EAS Account** (free tier is sufficient)
- ✅ **Google Play Console** (if planning Play Store submission)

### **Project Files:**
- ✅ **Production Keystore** (`@shubham485__shabari.jks`) - already present
- ✅ **EAS Configuration** (`eas.json`) - already configured
- ✅ **App Configuration** (`app.config.js`) - updated to v1.1.0

---

## 🎯 **Quick Start (Recommended)**

### **Step 1: Pre-Build Check**
```bash
node pre-build-check.js
```
This will verify all requirements are met.

### **Step 2: Build Production APK**
```bash
node build-production-apk-final.js
```
This automated script will handle everything!

---

## 📋 **Manual Build Process**

If you prefer manual control, follow these steps:

### **1. Environment Setup**
```bash
# Ensure you're logged into EAS
eas login

# Verify your account
eas whoami

# Install dependencies
npm install
```

### **2. Version Update** ✅ *Already Done*
- Version bumped to `1.1.0` in both `package.json` and `app.config.js`
- Includes all new call protection features

### **3. Production Environment**
```bash
# Create .env file for production
echo "NODE_ENV=production
EXPO_PUBLIC_ENVIRONMENT=production
ENABLE_NATIVE_FEATURES=true
EXPO_PUBLIC_CALL_PROTECTION_ENABLED=true" > .env
```

### **4. Build APK**
```bash
# Production build with signing
eas build --platform android --profile production-fixed

# Alternative: Preview build (faster)
eas build --platform android --profile preview
```

### **5. Monitor Build**
- Build takes **10-15 minutes**
- Monitor progress at: https://expo.dev/accounts/shubham485/projects/shabari/builds
- You'll receive an email when complete

---

## 🏗️ **Build Profiles Available**

### **Production-Fixed** (Recommended for testing)
```json
"production-fixed": {
  "android": {
    "buildType": "apk",
    "gradleCommand": ":app:assembleRelease",
    "image": "latest",
    "node": "20.19.4",
    "env": {
      "NODE_ENV": "production",
      "EXPO_PUBLIC_ENVIRONMENT": "production"
    }
  }
}
```

### **Preview** (Faster alternative)
```json
"preview": {
  "android": {
    "buildType": "apk",
    "image": "latest",
    "node": "20.18.0"
  }
}
```

---

## 📱 **Features Included in v1.1.0**

### **🛡️ Core Security Suite**
- **Document Scanner** with AI-powered threat detection
- **Link Detection** with real-time URL protection  
- **QR Scanner** with live fraud detection
- **SMS Shield** with smart message analysis

### **📞 Call Protection** ⭐ *NEW*
- **Auto-initialization** on app startup
- **Real-time spam/fraud call blocking**
- **Truecaller-like functionality**
- **VPN permission guidance** with user-friendly setup
- **Auto-start preference** management
- **Manual phone number reporting**
- **Call history** with reputation display

### **🔧 Technical Features**
- **YARA Engine** for advanced malware detection
- **ML Kit** text recognition
- **Supabase** authentication & database
- **Premium subscription** system
- **Native modules** fully integrated

---

## 📥 **APK Download & Distribution**

### **Download APK:**
1. Go to [EAS Build Dashboard](https://expo.dev/accounts/shubham485/projects/shabari/builds)
2. Find your latest build
3. Click **Download** to get the APK file
4. Share APK file with testers

### **Installation Instructions for Testers:**
```
1. Download APK file to Android device
2. Go to Settings > Security > Unknown Sources
3. Enable "Install unknown apps" for your browser/file manager
4. Tap the APK file to install
5. Grant all requested permissions for full functionality
6. Test call protection by enabling VPN permission
```

---

## 🧪 **Testing Checklist**

### **Basic Functionality:**
- [ ] App launches successfully
- [ ] Authentication works (Supabase)
- [ ] Navigation between screens
- [ ] All core features accessible

### **Call Protection Features:**
- [ ] VPN permission guide shows on first use
- [ ] Call protection can be enabled/disabled
- [ ] Auto-start preference works
- [ ] Manual phone number reporting
- [ ] Call history displays correctly
- [ ] Status shown on dashboard

### **Security Features:**
- [ ] Document scanning works
- [ ] URL checking functional
- [ ] QR code scanning active
- [ ] SMS analysis working (with permission)

### **Performance:**
- [ ] App loads quickly
- [ ] No crashes during normal use
- [ ] Memory usage reasonable
- [ ] Battery drain acceptable

---

## 🐛 **Troubleshooting**

### **Build Fails:**
```bash
# Clear cache and retry
eas build --platform android --profile production-fixed --clear-cache

# Try alternative profile
eas build --platform android --profile preview
```

### **EAS Login Issues:**
```bash
# Re-login to EAS
eas logout
eas login
```

### **Dependency Issues:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### **Build Timeout:**
- Try again during off-peak hours
- Use `--clear-cache` flag
- Consider upgrading to EAS paid plan for faster builds

---

## 📊 **Build Output**

After successful build, you'll have:

### **APK File:**
- **Size:** ~50-80 MB (includes all native features)
- **Signed:** With production keystore
- **Compatible:** Android 7.0+ (API 24+)
- **Architecture:** Universal APK (all architectures)

### **Features:**
- ✅ All security features enabled
- ✅ Call protection ready
- ✅ Production environment
- ✅ Optimized performance
- ✅ Proper signing for distribution

---

## 🚀 **Next Steps After Build**

### **1. Internal Testing**
- Install on multiple Android devices
- Test all features thoroughly
- Verify call protection works
- Check performance and battery usage

### **2. Beta Testing**
- Share APK with trusted beta testers
- Gather feedback on user experience
- Test edge cases and unusual scenarios
- Document any issues found

### **3. Feedback Collection**
- Create feedback form for testers
- Monitor crash reports
- Track feature usage
- Plan improvements for next version

### **4. Production Preparation**
- Address any critical issues
- Optimize based on feedback
- Prepare Play Store listing
- Create release notes

---

## 📞 **Support**

If you encounter issues during the build process:

1. **Check build logs** in EAS dashboard
2. **Review troubleshooting** section above
3. **Verify all prerequisites** are met
4. **Try alternative build profile** if needed

---

## 🎉 **Success!**

Once your APK is built and tested successfully, you'll have a production-ready Shabari app with:

- **Complete call protection** like Truecaller
- **Advanced security features** for comprehensive protection
- **Professional user experience** with guided setup
- **Ready for distribution** to testers and eventual Play Store submission

**Happy testing!** 🛡️📱
