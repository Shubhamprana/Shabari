# 🔍 OTP Insight Library - How to Access and Test

## 📍 **Where to Find the Features**

### 1. **Main Dashboard Access**
After logging into your Shabari app, you'll see the new **"Message Analysis"** button on the main dashboard:

```
Dashboard Screen → "Message Analysis" Button (Purple color)
Location: Main action grid alongside other security features
```

### 2. **Navigation Path**
```
Login → Dashboard → Message Analysis → Fraud Detection Interface
```

## 🎯 **How to Test the Features**

### **Step 1: Access Message Analysis**
1. Open your Shabari app
2. Log in to reach the Dashboard
3. Look for the **purple "Message Analysis"** button
4. Tap it to open the fraud detection interface

### **Step 2: Test Manual Message Analysis**
You can test with these sample messages:

#### ✅ **Safe Message (Test 1)**
```
Your OTP for login is 123456. Valid for 10 minutes. Do not share with anyone.
```
**Expected Result:** SAFE - Legitimate login OTP

#### ⚠️ **Suspicious Message (Test 2)**
```
Your OTP is 987654. Your account will be debited Rs. 50000. Click here: https://suspicious-bank.com
```
**Expected Result:** SUSPICIOUS/HIGH_RISK - Unverified domain

#### 🚨 **Fraud Message (Test 3)**
```
URGENT! Your bank account will be blocked. Complete KYC now: http://bit.ly/fake-bank
```
**Expected Result:** CRITICAL - URL shortener + fraud keywords

## 🔍 **Features to Test**

### **1. Manual Text Input**
- **Paste Button**: Copy any message to clipboard, then tap "Paste" 
- **Direct Typing**: Type or paste messages manually
- **Real-time Analysis**: Get instant fraud detection results

### **2. Analysis Results**
Each analysis shows:
- **Risk Level**: SAFE, SUSPICIOUS, HIGH_RISK, or CRITICAL
- **Sender Verification**: DLT header validation
- **OTP Detection**: Extracts OTP codes automatically
- **Transaction Analysis**: Detects amounts and transaction types
- **URL Safety**: Checks for malicious links

### **3. Premium vs Free Features**
- **Free Users**: Basic sender verification + OTP analysis
- **Premium Users**: Full AI analysis + Enhanced accuracy
- **Premium Indicator**: Shows "AI Confidence" percentage

## 🎮 **Testing Scenarios**

### **Scenario 1: Banking OTP**
```
Message: "Dear customer, your OTP for Rs. 1500 transaction at Amazon is 445566. Valid for 5 mins. -HDFC"
Sender: VM-HDFCBK

Expected Analysis:
✅ Sender: SAFE (Verified DLT header)
📱 OTP: 445566
💰 Amount: ₹1500
🏪 Merchant: amazon
📊 Risk: SAFE
```

### **Scenario 2: Phishing Attempt**
```
Message: "Your account is suspended. Verify now: http://tinyurl.com/urgent-verify"
Sender: +919876543210

Expected Analysis:
🚨 Sender: HIGH_RISK (Phone number sender)
🔗 URL: DANGEROUS (URL shortener)
📊 Risk: CRITICAL
🚫 Action: "BLOCK IMMEDIATELY"
```

### **Scenario 3: Payment Alert**
```
Message: "Alert! Rs. 25000 will be debited from your account. OTP: 778899. Stop transaction? Call 123456"
Sender: UNKNOWN

Expected Analysis:
⚠️ Sender: SUSPICIOUS (Unlisted)
💸 Transaction: PAYMENT_OUT
💰 Amount: ₹25000 (Large payment flag)
📊 Risk: HIGH_RISK
⚠️ Action: "VERIFY CAREFULLY"
```

## 📱 **User Interface Elements**

### **Analysis Screen Features:**
1. **Input Section**
   - Large text input area
   - Paste from clipboard button
   - Screenshot analysis button (coming soon)

2. **Results Display**
   - Color-coded risk indicators
   - Detailed analysis breakdown
   - Clear action recommendations

3. **Premium Prompts**
   - Upgrade suggestions for free users
   - Enhanced AI analysis previews

## 🔧 **Technical Implementation**

### **File Locations:**
```
📁 Integration Service: src/services/OtpInsightService.ts
📁 UI Screen: src/screens/MessageAnalysisScreen.tsx
📁 Core Library: src/lib/otp-insight-library/
📁 Navigation: src/navigation/AppNavigator.tsx
📁 Dashboard: src/screens/DashboardScreen.tsx
```

### **Key Components Integrated:**
- ✅ ML-powered fraud detection (ONNX model)
- ✅ Indian DLT header verification
- ✅ URL safety analysis
- ✅ OTP pattern recognition
- ✅ Transaction amount extraction
- ✅ Context and frequency rules
- ✅ Real-time notifications
- ✅ Premium/Free tier differentiation

## 🚀 **Next Steps for Enhanced Testing**

### **Future Features Ready:**
1. **Automatic SMS Detection** - Real-time SMS analysis
2. **Screenshot OCR** - Analyze message screenshots
3. **WhatsApp Integration** - Share messages for analysis
4. **Statistics Dashboard** - Track fraud detection history

### **Advanced Testing:**
1. Test with various Indian bank OTP formats
2. Try different URL shorteners and malicious domains
3. Test with Hindi/regional language messages
4. Simulate high-frequency OTP patterns

## 🔒 **Privacy Assurance**

The OTP Insight Library follows strict privacy principles:
- ✅ All analysis happens on your device
- ✅ No message content sent to servers
- ✅ No personal data collected
- ✅ Local storage only
- ✅ User has full control over data

## 📞 **Testing Support**

If you encounter any issues during testing:
1. Check the console logs for detailed information
2. Verify all dependencies are installed correctly
3. Ensure the ML model loads properly (check premium status)
4. Test with different message formats

---

**🎉 Your Shabari app now includes world-class fraud detection capabilities!**

The OTP Insight Library integration provides comprehensive protection against SMS and message fraud, making your app a complete security solution for Indian users. 