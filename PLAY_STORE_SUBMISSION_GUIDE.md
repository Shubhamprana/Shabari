# 🏪 Shabari - Google Play Store Submission Guide

## 📋 **Pre-Submission Checklist**

### ✅ **Technical Requirements**
- [x] **Android App Bundle (.aab)** - Required for new apps
- [x] **Target SDK 34** - Latest Android API level
- [x] **Privacy Policy URL** - `https://shubham485.github.io/shabari-privacy-policy/`
- [x] **App Signing** - EAS Build handles production signing
- [x] **64-bit Architecture** - All native libraries support arm64-v8a

### ✅ **App Store Listing Requirements**
- [ ] **App Title**: "Shabari - Cybersecurity Guardian"
- [ ] **Short Description**: Under 80 characters
- [ ] **Full Description**: Under 4000 characters
- [ ] **High-res Icon**: 512x512 PNG
- [ ] **Feature Graphic**: 1024x500 PNG
- [ ] **Screenshots**: At least 2, up to 8 screenshots
- [ ] **Content Rating**: Complete IARC questionnaire

### ✅ **Privacy & Policy Requirements**
- [x] **Privacy Policy**: Hosted and accessible
- [x] **Permissions Declaration**: All permissions documented
- [x] **Data Safety**: Complete data collection disclosure
- [ ] **Target Audience**: Appropriate age rating

---

## 🚀 **Step-by-Step Submission Process**

### **Step 1: Build Production AAB**

```bash
# Build Android App Bundle for Play Store
node build-playstore-aab.js

# Alternative: Use EAS directly
eas build --platform android --profile playstore
```

**Expected Output**: `.aab` file ready for upload

### **Step 2: Test AAB Locally**

```bash
# Install bundletool (Google's testing tool)
npm install -g bundletool

# Generate APKs from AAB for testing
bundletool build-apks --bundle=app.aab --output=app.apks

# Install on connected device
bundletool install-apks --apks=app.apks
```

### **Step 3: Google Play Console Setup**

1. **Create Developer Account** ($25 one-time fee)
2. **Create New App** in Play Console
3. **Set App Details**:
   - App name: "Shabari"
   - Default language: English
   - App or game: App
   - Free or paid: Free

### **Step 4: Upload AAB**

1. Go to **Production** → **Releases**
2. Click **Create new release**
3. Upload your `.aab` file
4. Add release notes
5. Review and confirm

### **Step 5: Complete Store Listing**

#### **Main Store Listing**
```
App Name: Shabari - Cybersecurity Guardian
Short Description: AI-powered mobile security app protecting against SMS fraud, QR scams, and malicious files.

Full Description:
🛡️ Shabari - Your Digital Guardian

Shabari is a comprehensive cybersecurity app that protects you from modern digital threats using AI-powered analysis and real-time scanning.

🔍 KEY FEATURES:
• SMS Fraud Detection - Analyze messages for phishing and OTP scams
• QR Code Security Scanner - Detect malicious QR codes before scanning
• File Protection System - Scan downloads for malware using YARA engine
• URL Protection - Block phishing and malicious websites
• Photo Fraud Detection - OCR analysis of suspicious screenshots
• Share Intent Security - Automatic scanning of shared content

🛡️ ADVANCED PROTECTION:
• Real-time threat detection
• Local privacy-first analysis
• AI-powered fraud recognition
• Automatic quarantine system
• Smart notification alerts

🎯 WHO IS IT FOR:
Perfect for users who want comprehensive mobile security without compromising privacy. All analysis happens locally on your device.

✨ PREMIUM FEATURES:
• Automatic background protection
• Advanced AI threat detection
• Priority security updates
• Enhanced malware scanning

🔒 PRIVACY FIRST:
Shabari analyzes content locally. No personal data is sent to external servers.

📱 REQUIREMENTS:
• Android 7.0 or higher
• Camera access for QR scanning
• SMS access for fraud detection (optional)
• Storage access for file protection

Download Shabari today and secure your digital life! 🛡️
```

#### **Screenshots Required**
1. **Dashboard Screen** - Main security status
2. **SMS Scanner** - Fraud detection in action
3. **QR Scanner** - Security scanning interface
4. **File Scanner** - Malware detection results
5. **Settings Screen** - Privacy controls

### **Step 6: Content Rating**

Complete the **IARC Content Rating** questionnaire:
- **Violence**: None
- **Sexual Content**: None
- **Profanity**: None
- **Controlled Substances**: None
- **Gambling**: None
- **Data Collection**: Yes (for security analysis)

**Expected Rating**: Teen (13+) due to security features

### **Step 7: Data Safety Declaration**

**Data Collected**:
- Email address (for account creation)
- App usage analytics (anonymous)
- Error reports (no personal data)

**Data NOT Collected**:
- SMS content (analyzed locally only)
- File contents (scanned locally only)
- Location data
- Personal files
- Contacts

---

## ⚠️ **Potential Play Store Issues & Solutions**

### **🚨 HIGH RISK: SMS Permissions**

**Issue**: Apps with SMS permissions face strict scrutiny
**Solution**: 
- Clearly document use case in store listing
- Emphasize local analysis (no data transmission)
- Consider making SMS scanning optional
- Provide detailed privacy policy

### **🚨 MEDIUM RISK: Security App Restrictions**

**Issue**: Google restricts antivirus/security apps
**Solution**:
- Position as "fraud detection" rather than "antivirus"
- Focus on user education and awareness
- Avoid claiming comprehensive device protection
- Emphasize manual scanning over automatic

### **🚨 MEDIUM RISK: File System Access**

**Issue**: Deep file scanning may be flagged
**Solution**:
- Limit to user-selected files only
- Don't scan system directories
- Use scoped storage properly
- Document file access in privacy policy

### **⚠️ LOW RISK: Camera Permissions**

**Issue**: QR scanner needs camera access
**Solution**: Standard QR scanner apps are accepted

---

## 📊 **Content Guidelines Compliance**

### ✅ **Allowed Features**
- Manual file scanning
- URL safety checking
- QR code analysis
- SMS fraud education
- Privacy protection tools

### ❌ **Avoid These Claims**
- "Complete device protection"
- "Removes all malware"
- "Antivirus replacement"
- "System-level security"
- "Background monitoring"

---

## 🕐 **Timeline Expectations**

### **Review Process**
- **Initial Review**: 1-3 days
- **Policy Review** (if flagged): 7-14 days
- **Appeal Process** (if rejected): 7-14 days

### **Common Delays**
- SMS permission justification
- Security app policy review
- Privacy policy verification
- Content rating confirmation

---

## 📞 **Support & Resources**

### **Google Play Console**
- Dashboard: https://play.google.com/console
- Policy Guidelines: https://support.google.com/googleplay/android-developer/answer/9858738
- SMS Policy: https://support.google.com/googleplay/android-developer/answer/9047303

### **EAS Build Dashboard**
- Builds: https://expo.dev/accounts/shubham485/projects/shabari/builds
- Documentation: https://docs.expo.dev/build/introduction/

### **Privacy Policy**
- Live URL: https://shubham485.github.io/shabari-privacy-policy/
- Source: `PRIVACY_POLICY_WEB.md`

---

## 🎯 **Success Metrics**

### **Approval Indicators**
- AAB uploads successfully
- All store listing fields completed
- Content rating received
- Data safety form submitted
- Privacy policy accessible

### **Review Ready**
- App functions as described
- No crashes during basic testing
- Permissions match functionality
- Privacy policy covers all features

---

## 🔄 **If Rejected - Action Plan**

### **Common Rejection Reasons**
1. **SMS Permission Issue**
   - Remove SMS features temporarily
   - Resubmit without SMS permissions
   - Add SMS features in future update

2. **Security App Policy**
   - Reposition as "fraud awareness" tool
   - Remove "antivirus" terminology
   - Focus on educational aspects

3. **Privacy Policy Issues**
   - Update policy to be more specific
   - Ensure all permissions are documented
   - Make policy more accessible

### **Appeal Process**
1. Carefully read rejection email
2. Address specific policy violations
3. Update app if necessary
4. Submit appeal with detailed explanation
5. Consider policy consultation if needed

---

**🛡️ Remember**: Shabari is positioned as a "digital awareness and fraud detection" app, not a comprehensive security solution. This positioning helps with Play Store approval while maintaining core functionality. 