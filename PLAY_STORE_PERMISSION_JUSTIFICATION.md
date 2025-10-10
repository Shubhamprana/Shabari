# Play Store Permission Justification
## Shabari - Cybersecurity & Fraud Protection App

### 🔒 **Security-Critical Permissions Explained**

This document explains why Shabari requires each permission for its cybersecurity features.

---

## **SMS Permissions**
### `READ_SMS`
**Why Required:**
- **Fraud Detection**: Scans incoming SMS for phishing attempts, malicious links, and scam patterns
- **Real-time Protection**: Analyzes SMS content using ML models to detect fraud
- **User Safety**: Blocks dangerous messages before users click malicious links

**Data Usage:**
- SMS content is processed locally on device
- Only threat signatures sent to server (never full message content)
- No SMS data stored permanently

---

## **Call Protection Permissions**
### `READ_CALL_LOG` & `READ_PHONE_STATE`
**Why Required:**
- **Spam Detection**: Identifies known scam/spam caller numbers
- **Fraud Prevention**: Cross-references calls against threat database
- **User Alerts**: Warns users about suspicious incoming calls

### `CALL_PHONE` & `ANSWER_PHONE_CALLS`
**Why Required:**
- **Auto-Block**: Automatically rejects known fraudulent calls
- **Emergency Override**: Allows app to manage call flow for security

**Data Usage:**
- Call metadata processed locally
- Only threat signatures shared with server
- No call recording without explicit user consent

---

## **Network Protection Permissions**
### `BIND_VPN_SERVICE`
**Why Required:**
- **Network-Level Threat Detection**: Inspects network traffic for malicious patterns
- **Malware Blocking**: Prevents connections to known malicious servers
- **Zero-Day Protection**: Analyzes traffic patterns in real-time

### `ACCESS_NETWORK_STATE` & `ACCESS_WIFI_STATE`
**Why Required:**
- **Connection Security**: Ensures protection works on all network types
- **Threat Context**: Different threat models for WiFi vs. cellular

**Data Usage:**
- Network packets analyzed locally
- Only threat indicators sent to server
- No personal browsing data collected

---

## **Audio Recording Permission**
### `RECORD_AUDIO`
**Why Required:**
- **Call Analysis**: User can opt-in to record suspicious calls for evidence
- **Fraud Documentation**: Helps users report scams to authorities
- **Voice Phishing Detection**: Analyzes call patterns (opt-in only)

**Data Usage:**
- Recording ONLY when user explicitly enables feature
- Recordings stored locally on device
- Never uploaded without user consent

---

## **Foreground Service Permissions**
### `FOREGROUND_SERVICE` & `FOREGROUND_SERVICE_DATA_SYNC`
**Why Required:**
- **Real-Time Protection**: Keeps security services running
- **Immediate Threat Response**: Blocks threats as they occur
- **Background Monitoring**: Monitors for threats even when app is in background

---

## **Privacy Guarantees**

✅ **No Data Selling**: We NEVER sell user data to third parties  
✅ **Local Processing**: Most analysis happens on-device  
✅ **Minimal Server Upload**: Only threat signatures sent (no personal data)  
✅ **User Control**: All advanced features require explicit opt-in  
✅ **Transparency**: Users can see exactly what data is shared  

---

## **Play Protect Note**

Google Play Protect may flag apps with these permissions as "risky" because they are powerful security permissions. However:

1. **Legitimate Security App**: Shabari is a genuine cybersecurity tool
2. **No Malicious Intent**: All permissions used solely for user protection
3. **User Control**: Advanced features require manual activation
4. **Open Source Components**: Core logic is verifiable
5. **No Auto-Start**: VPN and sensitive features require user opt-in

---

## **For Play Store Reviewers**

**App Category**: Tools → Security  
**Primary Function**: Fraud detection and cybersecurity protection  
**Target Audience**: Users concerned about phone scams, phishing, and malware  

**Permission Usage:**
- All permissions directly tied to core security features
- No permission used for advertising or tracking
- Users informed about each permission's purpose
- Granular control over feature activation

**Testing Instructions:**
1. Install app (no permissions auto-requested)
2. Navigate to Dashboard (basic features work)
3. Enable SMS Scanning → Requests SMS permission with explanation
4. Enable VPN Protection → Requests VPN permission with guide
5. All advanced features behind clear user controls

---

## **Support Contact**
For questions about permissions or data usage:
- Email: support@shabari.app
- Privacy Policy: https://shabari.app/privacy
- Data Safety Form: Submitted with Play Store listing

