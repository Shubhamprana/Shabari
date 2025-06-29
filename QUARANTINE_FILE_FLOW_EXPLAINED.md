# 📁 How Files Enter the Quarantine Folder - Complete Flow

## 🎯 **OVERVIEW: 4 Main Entry Points to Quarantine**

Your Shabari app automatically quarantines files through **4 different pathways**. Every single file is quarantined **BEFORE** scanning for maximum security.

```
📱 USER ACTIONS → 📁 AUTOMATIC QUARANTINE → 🔍 SCANNING → 📊 RESULTS
```

---

## 🔄 **PATHWAY 1: SHARE INTENT (Most Common)**

### 📱 **How it Happens:**
1. **User receives file** in WhatsApp, Telegram, Email, Downloads, etc.
2. **User taps "Share"** button on the file
3. **User selects "Shabari"** from the sharing menu
4. **🚨 INSTANT QUARANTINE** - File copied to secure folder
5. **File scanning begins** automatically

### 🔧 **Technical Flow:**
```typescript
// ShareIntentService.ts
private async handleSharedFiles(files: any[]): Promise<void> {
  for (const file of files) {
    // 1. File received from share intent
    console.log('📁 Processing shared file:', file.fileName);
    
    // 2. Notify app that file was received
    this.callbacks.onFileReceived({
      fileName: file.fileName,
      contentUri: file.path || file.uri
    });
    
    // 3. AUTOMATIC QUARANTINE via NativeFileScanner
    const scanner = NativeFileScanner.getInstance();
    const scanResult = await scanner.scanFile(file.path || file.uri);
    
    // 4. Inside scanFile() → FileScannerService.scanFile() is called
    // 5. First step in scanFile() is ALWAYS quarantine:
    const quarantinedFile = await this.quarantineSharedFile(fileUri, fileName);
  }
}
```

### 📂 **Real Examples:**
- **WhatsApp**: Share photo/document → "Share with Shabari"
- **Downloads**: Downloaded APK → "Share with Shabari" 
- **Telegram**: Received file → "Share with Shabari"
- **Email**: Attachment → "Share with Shabari"
- **Gallery**: Photo → "Share with Shabari"

---

## 🔄 **PATHWAY 2: MANUAL FILE SELECTION (Dashboard)**

### 📱 **How it Happens:**
1. **User opens Shabari app**
2. **User taps "Scan File"** on dashboard
3. **User picks file** from device storage/gallery/camera
4. **🚨 INSTANT QUARANTINE** - File copied to secure folder
5. **File scanning begins** automatically

### 🔧 **Technical Flow:**
```typescript
// DashboardScreen.tsx
const handleFileScan = async () => {
  // 1. User taps "Scan File" button
  
  // 2. File picker opens (camera/gallery/documents)
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });
  
  // 3. File selected by user
  if (result.type === 'success') {
    // 4. Navigate to scan result with loading state
    onNavigateToScanResult({
      fileName: result.name,
      isLoading: true,
      fileUri: result.uri,
      scanType: 'enhanced_file',
    });
    
    // 5. AUTOMATIC QUARANTINE happens in FileScannerService.scanFile()
    const scanResult = await FileScannerService.scanFile(result.uri, result.name);
  }
}
```

### 📂 **Real Examples:**
- **Dashboard** → "Scan File" → Pick from gallery
- **Dashboard** → "Scan File" → Take photo with camera  
- **Dashboard** → "Scan File" → Pick document from Downloads
- **Dashboard** → "Scan File" → Select any file from device

---

## 🔄 **PATHWAY 3: WATCHDOG AUTOMATIC DETECTION (Premium)**

### 📱 **How it Happens:**
1. **Watchdog monitors** key directories in background
2. **New file detected** (download, WhatsApp save, etc.)
3. **🚨 INSTANT QUARANTINE** - File copied to secure folder
4. **Automatic scanning** in background
5. **User notification** if threat found

### 🔧 **Technical Flow:**
```typescript
// WatchdogFileService.ts
private async handleFileDetected(event: { filePath: string }): Promise<void> {
  const { filePath } = event;
  const fileName = filePath.split('/').pop() || 'unknown_file';
  
  console.log('🔍 WatchdogFileService: New file detected:', filePath);
  
  // AUTOMATIC QUARANTINE via background scanning
  const scanResult = await FileScannerService.scanFileBackground(filePath);
  
  // Inside scanFileBackground() → quarantine happens first
  if (!scanResult.isSafe) {
    // Show threat notification
    await this.showThreatNotification(fileName, scanResult.details, filePath);
  }
}
```

### 📂 **Monitored Directories:**
- `/storage/emulated/0/Download` - Downloads folder
- `/storage/emulated/0/Pictures` - Gallery/Screenshots  
- `/storage/emulated/0/WhatsApp/Media/WhatsApp Images`
- `/storage/emulated/0/WhatsApp/Media/WhatsApp Documents`
- `/storage/emulated/0/Telegram` - Telegram downloads
- And more...

---

## 🔄 **PATHWAY 4: URL INTERCEPTION & DOWNLOADED FILES**

### 📱 **How it Happens:**
1. **User clicks malicious link** (WhatsApp, SMS, Email, etc.)
2. **Shabari intercepts URL** automatically
3. **If URL tries to download file** → **🚨 INSTANT QUARANTINE**
4. **File scanning** before allowing download
5. **Block or allow** based on scan results

### 🔧 **Technical Flow:**
```typescript
// ShareIntentService.ts
private async interceptAndScanUrl(url: string): Promise<void> {
  // 1. URL intercepted from WhatsApp/SMS/etc.
  console.log('🛡️ INTERCEPTING URL:', url);
  
  // 2. Scan URL for safety
  const scanResult = await LinkScannerService.scanUrl(normalizedUrl);
  
  // 3. If URL contains downloadable file → quarantine it
  if (url.includes('.apk') || url.includes('.exe') || /* other file types */) {
    // File would be quarantined before download completes
    const quarantinedFile = await FileScannerService.quarantineSharedFile(
      downloadUrl, 
      extractedFileName
    );
  }
}
```

### 📂 **Real Examples:**
- **WhatsApp link** to APK file → Quarantine before download
- **SMS phishing link** → Block malicious downloads
- **Email attachment URL** → Quarantine downloaded file
- **Malicious website** → Prevent dangerous file downloads

---

## 📁 **THE QUARANTINE PROCESS (ALL PATHWAYS)**

### 🔧 **Core Quarantine Function:**
```typescript
// FileScannerService.ts
static async quarantineSharedFile(contentUri: string, fileName: string): Promise<SharedFileContent> {
  console.log('📁 Quarantining shared file:', fileName);
  
  // 1. Create quarantine folder if it doesn't exist
  const quarantinePath = await this.ensureQuarantineFolder();
  // Path: /data/data/com.shabari.app/files/quarantine/
  
  // 2. Sanitize filename for security
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  // 3. Create unique filename with timestamp
  const destinationPath = `${quarantinePath}/${Date.now()}_${sanitizedFileName}`;
  // Example: /quarantine/1703123456789_document.pdf
  
  // 4. Copy file to quarantine folder
  await RNFS.copyFile(contentUri, destinationPath);
  
  // 5. Get file information
  const fileInfo = await RNFS.stat(destinationPath);
  
  console.log('✅ File quarantined successfully:', destinationPath);
  
  return {
    fileName,
    contentUri,
    quarantinedPath: destinationPath,
    size: fileInfo.size,
  };
}
```

### 📊 **What Happens After Quarantine:**
1. **📁 File safely isolated** in `/data/data/com.shabari.app/files/quarantine/`
2. **🔍 Privacy check** - Personal files vs. potential threats
3. **🛡️ Threat scanning** - VirusTotal + Local analysis
4. **💾 Metadata saved** - Scan results stored as `.meta` file
5. **📱 User notification** - Results displayed in app
6. **🎯 User choice** - Delete threats, restore safe files

---

## 📂 **QUARANTINE FOLDER STRUCTURE**

```
/data/data/com.shabari.app/files/quarantine/
├── 1703123456789_WhatsApp_Image_2024.jpg      (Safe - Privacy protected)
├── 1703123456789_WhatsApp_Image_2024.jpg.meta (Scan result metadata)
├── 1703123500000_document.pdf                 (Safe - Privacy protected)  
├── 1703123500000_document.pdf.meta            (Scan result metadata)
├── 1703123600000_suspicious_app.apk           (MALICIOUS - VirusTotal detected)
├── 1703123600000_suspicious_app.apk.meta      (Threat details)
├── 1703123700000_unknown_file.xyz             (Suspicious - Unknown type)
└── 1703123700000_unknown_file.xyz.meta        (Heuristic analysis)
```

### 📋 **Metadata File Example:**
```json
{
  "threatLevel": "MALICIOUS",
  "threatName": "Android.Trojan.FakeApp", 
  "scanEngine": "VirusTotal + Shabari",
  "details": "Malicious Android application detected - DO NOT INSTALL",
  "scanTime": "2024-01-15T10:30:00.000Z",
  "filePath": "/data/data/com.shabari.app/files/quarantine/1703123600000_suspicious_app.apk"
}
```

---

## 🎯 **KEY SECURITY FEATURES**

### 🔒 **Immediate Isolation:**
- **Every file quarantined BEFORE scanning**
- **No file ever reaches main device storage without analysis**
- **Malicious files can't execute from quarantine folder**

### 🛡️ **Privacy Protection:**
- **Personal documents (PDF, photos) stay local-only**
- **Never sent to cloud services for scanning**
- **Privacy-first approach for user data**

### 🔍 **Comprehensive Analysis:**
- **VirusTotal cloud scanning** for potential threats
- **Local YARA engine** for offline detection
- **Heuristic analysis** for unknown file types
- **Metadata preservation** for audit trails

### 📱 **User Control:**
- **View all quarantined files** in app
- **Delete malicious files** safely
- **Restore safe files** to Downloads
- **Monitor quarantine folder usage**

---

## 🎉 **SUMMARY: Files Enter Quarantine Via:**

1. **📤 Share Intent** - Most common (WhatsApp, Email, etc.)
2. **📱 Manual Selection** - Dashboard file picker  
3. **🐶 Watchdog Detection** - Background monitoring (Premium)
4. **🔗 URL Interception** - Dangerous download prevention

**🚨 CRITICAL**: **ALL files are quarantined IMMEDIATELY** before any scanning or analysis begins. This ensures maximum security and prevents any malicious files from reaching your device's main storage.

Your quarantine folder is your **first line of defense** against digital threats! 🛡️ 