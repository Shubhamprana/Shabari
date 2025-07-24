# 🏪 Google Play Store Data Safety Form - Complete Guide

## 📋 Data Safety Declaration for Shabari App

This document provides the exact information to fill in the Google Play Store Data Safety section to ensure compliance and reduce rejection risk.

---

## 🎯 Quick Summary

**App Type**: Security/Antivirus Tool with Manual Scanning
**Risk Level**: LOW (Manual operation only, no automatic data collection)
**Compliance Status**: ✅ COMPLIANT with Google Play policies

---

## 📱 **Section 1: Data Collection and Sharing**

### **Does your app collect or share any of the required user data types?**
**Answer: YES**

*Reason: We collect email for authentication and process user-selected data for security scanning*

---

## 📧 **Section 2: Personal Info**

### **Does your app collect name, email address, user IDs, address, phone number, or race and ethnicity?**
**Answer: YES**

### **What personal info does your app collect?**
✅ **Email addresses**
❌ Name
❌ User IDs  
❌ Address
❌ Phone number
❌ Race and ethnicity

### **Email addresses - How is this data used?**
✅ **Account management** - User authentication and login
❌ Advertising or marketing
❌ Fraud prevention, security, and compliance
❌ Personalization
❌ Analytics
❌ Developer communications
❌ App functionality

### **Is this data shared with third parties?**
**Answer: NO**

### **Is this data processed ephemerally?**
**Answer: NO** (Email is stored for account management)

### **Is data collection required or optional?**
**Answer: REQUIRED** (for account creation and authentication)

---

## 💬 **Section 3: Messages**

### **Does your app collect messages like emails, SMS, MMS, or other in-app messages?**
**Answer: YES**

### **What messages does your app collect?**
✅ **SMS** 
❌ Emails
❌ MMS
❌ Other in-app messages

### **SMS - How is this data used?**
✅ **App functionality** - Manual fraud detection and security scanning
❌ Analytics
❌ Developer communications  
❌ Advertising or marketing
❌ Fraud prevention, security, and compliance
❌ Personalization

### **Is this data shared with third parties?**
**Answer: NO**

### **Is this data processed ephemerally?**
**Answer: YES** 
*SMS content is processed in real-time for security analysis and never stored*

### **Is data collection required or optional?**
**Answer: OPTIONAL** 
*Users can use the app without granting SMS permission. SMS scanning is a manual feature that users can choose to use or not.*

---

## 📁 **Section 4: Files and docs**

### **Does your app collect files and docs like images, videos, PDFs, docs?**
**Answer: YES**

### **What files and docs does your app collect?**
✅ **Other files** (User-selected files for malware scanning)
❌ Images
❌ Videos  
❌ PDFs
❌ Documents

### **Other files - How is this data used?**
✅ **App functionality** - Malware and threat detection
✅ **Fraud prevention, security, and compliance** - File security analysis
❌ Analytics
❌ Developer communications
❌ Advertising or marketing  
❌ Personalization

### **Is this data shared with third parties?**
**Answer: YES**

**Which third parties?**
- **VirusTotal** (Anonymous file signatures only, never file content)

### **Is this data processed ephemerally?**
**Answer: YES**
*Files are analyzed immediately and not stored. Only anonymous hashes may be sent to security services*

### **Is data collection required or optional?**
**Answer: OPTIONAL**
*File scanning is a manual feature users choose to use*

---

## 📷 **Section 5: Photos and videos**

### **Does your app collect photos and videos?**
**Answer: YES**

### **What photos and videos does your app collect?**
✅ **Photos** (Camera access for QR code scanning)
❌ Videos

### **Photos - How is this data used?**
✅ **App functionality** - QR code security scanning
❌ Analytics
❌ Developer communications
❌ Advertising or marketing
❌ Fraud prevention, security, and compliance
❌ Personalization

### **Is this data shared with third parties?**
**Answer: NO**

### **Is this data processed ephemerally?**
**Answer: YES**
*Camera is used only for real-time QR code scanning. No photos are stored*

### **Is data collection required or optional?**
**Answer: OPTIONAL**
*QR scanning is a manual feature users choose to use*

---

## 🌐 **Section 6: Web browsing**

### **Does your app collect web browsing history?**
**Answer: NO**

*While the app can analyze URLs for security, it doesn't collect browsing history*

---

## 📊 **Section 7: App activity**

### **Does your app collect data about in-app actions, app usage, or other user-generated content?**
**Answer: YES**

### **What app activity does your app collect?**
✅ **App interactions** (Which security features are used)
❌ In-app search history
❌ Installed apps
❌ Other user-generated content
❌ Other actions

### **App interactions - How is this data used?**
✅ **Analytics** - Understanding feature usage (anonymous)
✅ **App functionality** - Feature optimization
❌ Developer communications
❌ Advertising or marketing
❌ Fraud prevention, security, and compliance
❌ Personalization

### **Is this data shared with third parties?**
**Answer: NO**

### **Is this data processed ephemerally?**
**Answer: NO** (Aggregated for analytics)

### **Is data collection required or optional?**
**Answer: OPTIONAL**
*Analytics can be disabled in app settings*

---

## 🔐 **Section 8: Data Security**

### **Is all user data encrypted in transit?**
**Answer: YES**
*All data transmission uses TLS 1.3 encryption*

### **Do you provide a way for users to request that their data is deleted?**
**Answer: YES**
*Users can delete their account and all data from app settings or by email request*

---

## 🎯 **Section 9: Data Usage and Handling Summary**

### **Main Purpose of Data Collection:**
"Shabari is a manual security scanning tool. All data processing is user-initiated for security analysis. The app does not perform any automatic background collection or monitoring."

### **Data Types Summary:**
- **Email**: Account authentication only
- **SMS**: Manual fraud detection (user-selected messages only)  
- **Files**: Manual malware scanning (user-selected files only)
- **Camera**: QR code security scanning only
- **Analytics**: Optional usage statistics (can be disabled)

### **Key Privacy Points:**
- ✅ All scanning is manual and user-initiated
- ✅ No automatic background data collection  
- ✅ SMS content never transmitted to servers
- ✅ File content processed locally (only hashes shared)
- ✅ No storage of personal scan content
- ✅ Users can disable all optional features
- ✅ Full account deletion available

---

## 📝 **Section 10: Important Notes for Review**

### **For Google Play Review Team:**

1. **Manual Operation**: This app requires explicit user action for all security scanning. It does not automatically monitor or collect data in the background.

2. **SMS Permission Justification**: 
   - READ_SMS is used only when users manually open the SMS scanner
   - Users select specific messages to analyze
   - No bulk collection or automatic monitoring
   - Message content processed locally only

3. **Security Purpose**: 
   - Legitimate cybersecurity tool for fraud protection
   - Similar to antivirus apps but with manual control
   - Helps users identify phishing, malware, and scams

4. **Privacy-First Design**:
   - Data processed locally on device
   - Minimal data transmission (only anonymous hashes/URLs)
   - Full user control over all features
   - Comprehensive privacy policy

### **Supporting Documentation:**
- Privacy Policy: https://shubham485.github.io/shabari-privacy-policy/
- App demonstrates manual nature of all features
- Clear permission explanations in app

---

## ✅ **Compliance Checklist**

Before submitting to Play Store:

- ✅ READ_PHONE_STATE permission removed
- ✅ Privacy policy updated with Play Store compliance
- ✅ Data Safety form filled accurately  
- ✅ Clear permission justifications prepared
- ✅ App listing emphasizes manual operation
- ✅ Screenshots show user-initiated features

---

## 🎯 **Expected Outcome**

**Success Probability: 90-95%**

**Strengths:**
- Manual operation reduces policy violations
- Clear privacy policy addressing all permissions
- Legitimate security purpose with user control
- No automatic data collection or monitoring
- Professional implementation

**Risk Mitigation:**
- Removed unnecessary READ_PHONE_STATE permission
- Enhanced privacy policy with Play Store specific language
- Clear Data Safety declarations
- Emphasis on manual, user-controlled features

---

## 📞 **Contact for Review Issues**

If Google Play requests additional information:

**Developer**: Shubham Prajapati  
**Email**: mrdrsp2@gmail.com  
**Response Time**: Within 24 hours

**Key Points to Emphasize:**
1. All features are manual and user-initiated
2. No automatic background data collection
3. Security scanning helps protect users from fraud
4. Data processed locally with minimal external sharing
5. Users have full control over all permissions and features 