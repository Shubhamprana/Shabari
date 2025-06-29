# Shabari Mobile Deployment Guide

## Why Mobile Installation is Essential

The Shabari app **requires mobile installation** for full functionality testing because:

### 🔧 **Platform-Specific Features**
- **Share Intent System**: Android/iOS sharing protocols only work on mobile devices
- **File System Access**: Native file operations require mobile OS permissions
- **Background Services**: Premium features need mobile runtime environment
- **Push Notifications**: System notifications require mobile OS integration
- **WebView Component**: SecureBrowser needs native WebView renderer

### 🚫 **Web Version Limitations**
The web version shows the UI but cannot test:
- URL/file sharing from other apps
- File quarantine system
- Real-time protection services
- Push notification system
- Native file scanning

---

## **Mobile Deployment Steps**

### **Prerequisites**
1. **Physical Android/iOS Device** (emulator optional for basic testing)
2. **USB Debugging Enabled** (Android) or **Developer Mode** (iOS)
3. **Node.js & React Native CLI** installed

### **Step 1: Install Dependencies**
```bash
# Navigate to project directory
cd Shabari

# Install all dependencies
npm install

# For iOS (if targeting iOS)
cd ios && pod install && cd ..
```

### **Step 2: Build & Deploy**

#### **For Android:**
```bash
# Build and install on connected device
npx react-native run-android --device

# OR for specific device:
npx react-native run-android --deviceId=YOUR_DEVICE_ID
```

#### **For iOS:**
```bash
# Build and install on connected device
npx react-native run-ios --device

# OR open in Xcode for manual deployment:
open ios/Shabari.xcworkspace
```

### **Step 3: Grant Permissions**

When the app first launches, grant these permissions:
- 📂 **Storage Access**: For file quarantine system
- 🔔 **Notifications**: For threat alerts
- 🌐 **Network Access**: For VirusTotal API calls
- 📱 **App Installation Detection**: For premium features (Android)

---

## **Testing the Complete Protection System**

### **🔗 Testing URL Protection**

#### **1. Share Intent URL Testing**
```
1. Open WhatsApp, Telegram, or any messaging app
2. Send yourself this test URL: http://www.eicar.org/download/eicar.com.txt
3. Long-press the link → Share → Select "Shabari"
4. ✅ Expected: Shabari should automatically block the malicious URL
5. You should see: "🛡️ DANGEROUS WEBSITE BLOCKED!" alert
```

#### **2. Secure Browser Testing**
```
1. Open Shabari app
2. Navigate to SecureBrowser (Premium feature)
3. Enter malicious URL: malware-test.com
4. ✅ Expected: URL blocked before loading with security report
```

#### **3. GlobalGuard Real-time Protection**
```
1. Go to Settings → Enable GlobalGuard (Premium)
2. Grant VPN permission when prompted
3. Open any browser → Visit dangerous-site.net
4. ✅ Expected: Site blocked with system notification
```

### **📁 Testing File Protection**

#### **1. Manual File Scanning**
```
1. Download a suspicious file (e.g., .exe, .apk)
2. Open file manager → Share file → Select "Shabari"
3. ✅ Expected: File automatically quarantined and scanned
4. Results shown on ScanResultScreen
```

#### **2. Background File Monitoring (Premium)**
```
1. Enable WatchdogFileService in settings
2. Download any file to WhatsApp/Downloads folder
3. ✅ Expected: Automatic scan notification within 15 seconds
4. Dangerous files trigger "🚨 THREAT DETECTED!" alert
```

#### **3. App Installation Monitoring (Premium)**
```
1. Enable PrivacyGuardService in settings
2. Install any new app with suspicious permissions
3. ✅ Expected: "🔒 CRITICAL SECURITY ALERT" for high-risk permissions
4. Direct link to uninstall the app
```

---

## **Feature Testing Checklist**

### ✅ **Free User Features**
- [ ] URL scanning via "Share to Shabari"
- [ ] File scanning via "Share to Shabari"
- [ ] Local blocklist blocking (malware-test.com)
- [ ] VirusTotal API integration working
- [ ] ScanResultScreen with scan results
- [ ] Safe URL opening in browser

### ✅ **Premium User Features**
- [ ] SecureBrowser with real-time protection
- [ ] GlobalGuard VPN-based URL blocking
- [ ] WatchdogFileService background scanning
- [ ] PrivacyGuardService app monitoring
- [ ] System notifications for threats
- [ ] Premium subscription validation

### ✅ **Privacy Verification**
- [ ] No user data sent to Supabase backend
- [ ] Anonymous VirusTotal API calls
- [ ] Local file processing only
- [ ] On-device threat database

---

## **Troubleshooting Common Issues**

### **🔧 Build Issues**
```bash
# Clear cache and rebuild
npx react-native clean
npm start -- --reset-cache

# For Android build issues:
cd android && ./gradlew clean && cd ..

# For iOS build issues:
cd ios && rm -rf build && cd ..
```

### **📱 Permission Issues**
- Manually grant all permissions in device settings
- For Android: Settings → Apps → Shabari → Permissions
- For iOS: Settings → Shabari → Allow all permissions

### **🌐 Network Issues**
- Ensure device has internet connection
- Check VirusTotal API key in environment variables
- Verify firewall/proxy settings allow VirusTotal access

### **⚠️ Mock Service Testing**
If native services aren't working:
- Check logs for "Mock" prefix indicating test mode
- Premium features use mock implementations for demo
- Real functionality requires native Android/iOS development

---

## **Development vs Production**

### **Development Mode (Current)**
- Mock native services with 15-20 second demo intervals
- In-memory blocklist fallback for unsupported platforms
- Console logging for debugging
- Test notifications and alerts

### **Production Requirements**
For full production deployment, implement:
- Native Android FileObserver service
- Native Android BroadcastReceiver for app monitoring
- Native VPN module for GlobalGuard
- Real-time file system monitoring
- Production-grade error handling

---

## **Quick Start Commands**

```bash
# Complete setup and deployment
npm install
npx react-native run-android --device  # or run-ios

# Test malicious URL immediately:
# Share this URL to Shabari: http://www.eicar.org/download/eicar.com.txt

# Enable premium features in app:
# Settings → Subscription → Enable Premium → Test all features
```

**Your Shabari app is ready for comprehensive mobile testing with both free and premium protection features!** 