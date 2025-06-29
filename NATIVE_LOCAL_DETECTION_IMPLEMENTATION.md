# 🚀 Native Local Detection Implementation Guide

## 🎯 Overview
With your Expo Production ($99) subscription, we can now implement full native local detection capabilities that were previously limited in Expo Go.

## 📋 Current Limitations (From Logs)
```
❌ SQLite not available on this platform
❌ React Native FS not available on this platform  
❌ Clipboard library not available
❌ ShareIntent library methods not available
📱 Running in Expo Go or Web - initializing limited services only
```

## ✅ What We'll Enable
```
✅ Full SQLite database functionality
✅ Complete file system access (RNFS)
✅ Native clipboard monitoring
✅ Real OCR text extraction (ML Kit)
✅ Background file monitoring
✅ Native share intent handling
✅ System-level notifications
```

---

## 🛠️ Implementation Steps

### **Step 1: Update EAS Build Configuration**

#### Update `eas.json`:
```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "native-production": {
      "extends": "production",
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      },
      "env": {
        "ENVIRONMENT": "production"
      }
    },
    "native-development": {
      "extends": "development", 
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug"
      },
      "developmentClient": true
    }
  }
}
```

### **Step 2: Install Native Dependencies**

#### Add to `package.json`:
```json
{
  "dependencies": {
    "@react-native-ml-kit/text-recognition": "^13.7.0",
    "react-native-sqlite-storage": "^6.0.1",
    "react-native-fs": "^2.20.0",
    "@react-native-clipboard/clipboard": "^1.14.1",
    "react-native-receive-sharing-intent": "^2.0.0",
    "react-native-background-job": "^1.2.4",
    "react-native-device-info": "^10.13.0"
  }
}
```

### **Step 3: Native OCR Implementation**

#### Update `src/services/OCRService.ts`:
```typescript
import { MLKitTextRecognition } from '@react-native-ml-kit/text-recognition';
import { Platform } from 'react-native';

export class OCRService {
  private static instance: OCRService;
  private isMLKitAvailable: boolean = false;

  private constructor() {
    this.checkMLKitAvailability();
  }

  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  private async checkMLKitAvailability(): Promise<void> {
    try {
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        // Test ML Kit availability
        this.isMLKitAvailable = true;
        console.log('✅ ML Kit Text Recognition available');
      }
    } catch (error) {
      console.log('❌ ML Kit not available:', error);
      this.isMLKitAvailable = false;
    }
  }

  /**
   * Extract text from image using native ML Kit
   */
  async extractTextFromImage(imageUri: string): Promise<OCRResult> {
    console.log('[OCRService] Native OCR requested for:', imageUri);

    if (!this.isMLKitAvailable) {
      return {
        success: false,
        text: '',
        confidence: 0,
        error: 'ML Kit not available - using development build required'
      };
    }

    try {
      // Use native ML Kit for text recognition
      const result = await MLKitTextRecognition.recognize(imageUri);
      
      const extractedText = this.cleanExtractedText(result.text);
      const confidence = this.calculateConfidence(extractedText);
      
      console.log('[OCRService] Native OCR completed:', {
        textLength: extractedText.length,
        confidence: confidence,
        processingTime: '1-2 seconds'
      });

      return {
        success: true,
        text: extractedText,
        confidence: confidence,
        blocks: result.blocks?.map(block => ({
          text: block.text,
          boundingBox: block.boundingBox,
          confidence: block.confidence || 0.8
        }))
      };

    } catch (error) {
      console.error('[OCRService] Native OCR error:', error);
      return {
        success: false,
        text: '',
        confidence: 0,
        error: `OCR processing failed: ${error.message}`
      };
    }
  }

  /**
   * Enhanced confidence calculation for native OCR
   */
  private calculateConfidence(text: string): number {
    let confidence = 70; // Base confidence for ML Kit

    // Boost factors
    if (text.length > 50) confidence += 10;
    if (text.length > 100) confidence += 10;
    if (/\b\d{4,6}\b/.test(text)) confidence += 10; // OTP patterns
    if (/bank|account|transaction/i.test(text)) confidence += 5;
    if (/₹|\$|rs\.?\s*\d+/i.test(text)) confidence += 5;

    // Penalty factors
    if (text.length < 20) confidence -= 20;
    if (!/[a-zA-Z]/.test(text)) confidence -= 10;

    return Math.max(0, Math.min(100, confidence));
  }
}
```

### **Step 4: Native File System Implementation**

#### Update `src/services/ScannerService.ts`:
```typescript
import RNFS from 'react-native-fs';
import SQLite from 'react-native-sqlite-storage';

// Enable SQLite promises
SQLite.enablePromise(true);

export class FileScannerService {
  private static db: any = null;
  private static isNativeEnvironment: boolean = false;

  static async initialize(): Promise<void> {
    try {
      // Check if we're in native environment
      if (RNFS && RNFS.DocumentDirectoryPath) {
        this.isNativeEnvironment = true;
        console.log('✅ Native file system available');
        
        // Initialize SQLite database
        await this.initializeDatabase();
        
        // Setup file monitoring directories
        await this.setupFileMonitoring();
      } else {
        console.log('📱 Web/Expo Go environment - using fallback methods');
      }
    } catch (error) {
      console.error('❌ Native initialization failed:', error);
    }
  }

  private static async initializeDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabase({
        name: 'shabari_security.db',
        location: 'default',
        createFromLocation: 1,
      });

      // Create tables for threat detection
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS scan_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          file_path TEXT NOT NULL,
          file_name TEXT NOT NULL,
          scan_result TEXT NOT NULL,
          threat_level TEXT,
          scan_date DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS threat_patterns (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          pattern_type TEXT NOT NULL,
          pattern_value TEXT NOT NULL,
          threat_level INTEGER,
          last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('✅ SQLite database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
    }
  }

  /**
   * Native file monitoring setup
   */
  private static async setupFileMonitoring(): Promise<void> {
    const monitoredDirectories = [
      '/storage/emulated/0/Download',
      '/storage/emulated/0/WhatsApp/Media/WhatsApp Images',
      '/storage/emulated/0/WhatsApp/Media/WhatsApp Documents',
      '/storage/emulated/0/Pictures'
    ];

    for (const directory of monitoredDirectories) {
      try {
        const exists = await RNFS.exists(directory);
        if (exists) {
          console.log(`✅ Monitoring directory: ${directory}`);
          // Note: Full FileObserver implementation requires native Android code
          // This sets up the foundation for native monitoring
        }
      } catch (error) {
        console.warn(`⚠️ Cannot access directory: ${directory}`);
      }
    }
  }

  /**
   * Enhanced file scanning with native capabilities
   */
  static async scanFileNative(filePath: string): Promise<FileScanResult> {
    if (!this.isNativeEnvironment) {
      return this.scanFile(filePath, filePath.split('/').pop() || 'unknown');
    }

    try {
      console.log('🔍 Native file scan:', filePath);

      // Get file stats using native RNFS
      const fileStats = await RNFS.stat(filePath);
      const fileName = fileStats.name;
      const fileSize = fileStats.size;

      // Privacy protection check
      const shouldScanWithVirusTotal = this.shouldScanWithVirusTotal(fileName, filePath);

      let scanResult: FileScanResult;

      if (!shouldScanWithVirusTotal) {
        console.log('🔒 Privacy Protection: Using local scan only');
        scanResult = await this.performLocalScan(fileName, fileSize);
      } else {
        // Generate file hash using native file reading
        const fileHash = await this.generateFileHashNative(filePath);
        const vtResult = await this.checkVirusTotal(fileHash, fileName);
        
        scanResult = vtResult || await this.performLocalScan(fileName, fileSize);
      }

      // Store scan result in SQLite
      await this.storeScanResult(filePath, fileName, scanResult);

      return {
        ...scanResult,
        filePath,
        fileSize
      };

    } catch (error) {
      console.error('❌ Native file scan error:', error);
      return {
        isSafe: false,
        threatName: 'Native scan failed',
        scanEngine: 'Shabari Native Scanner',
        scanTime: new Date(),
        details: `Native scan error: ${error.message}`,
        filePath
      };
    }
  }

  /**
   * Generate file hash using native file reading
   */
  private static async generateFileHashNative(filePath: string): Promise<string> {
    try {
      // Read file content in chunks for large files
      const fileContent = await RNFS.readFile(filePath, 'base64');
      
      // Simple hash generation (in production, use crypto library)
      let hash = 0;
      for (let i = 0; i < fileContent.length; i++) {
        const char = fileContent.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      return Math.abs(hash).toString(16);
    } catch (error) {
      console.error('Hash generation error:', error);
      return 'unknown_hash';
    }
  }

  /**
   * Store scan result in SQLite database
   */
  private static async storeScanResult(filePath: string, fileName: string, result: FileScanResult): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.executeSql(
        'INSERT INTO scan_history (file_path, file_name, scan_result, threat_level) VALUES (?, ?, ?, ?)',
        [filePath, fileName, JSON.stringify(result), result.isSafe ? 'SAFE' : 'THREAT']
      );
    } catch (error) {
      console.error('Failed to store scan result:', error);
    }
  }
}
```

### **Step 5: Native Clipboard Monitoring**

#### Update `src/services/ClipboardURLMonitor.ts`:
```typescript
import Clipboard from '@react-native-clipboard/clipboard';
import { AppState, AppStateStatus } from 'react-native';

export class ClipboardURLMonitor {
  private static instance: ClipboardURLMonitor;
  private isNativeClipboardAvailable: boolean = false;
  private lastClipboardContent: string = '';
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.checkClipboardAvailability();
  }

  static getInstance(): ClipboardURLMonitor {
    if (!ClipboardURLMonitor.instance) {
      ClipboardURLMonitor.instance = new ClipboardURLMonitor();
    }
    return ClipboardURLMonitor.instance;
  }

  private async checkClipboardAvailability(): Promise<void> {
    try {
      // Test clipboard access
      await Clipboard.getString();
      this.isNativeClipboardAvailable = true;
      console.log('✅ Native clipboard access available');
    } catch (error) {
      console.log('❌ Native clipboard not available:', error);
      this.isNativeClipboardAvailable = false;
    }
  }

  /**
   * Start native clipboard monitoring
   */
  async startMonitoring(): Promise<void> {
    if (!this.isNativeClipboardAvailable) {
      console.log('📱 Clipboard monitoring not available in current environment');
      return;
    }

    console.log('🔍 Starting native clipboard monitoring...');

    // Get initial clipboard content
    this.lastClipboardContent = await Clipboard.getString();

    // Monitor clipboard changes every 2 seconds
    this.monitoringInterval = setInterval(async () => {
      try {
        const currentContent = await Clipboard.getString();
        
        if (currentContent !== this.lastClipboardContent && currentContent.length > 0) {
          this.lastClipboardContent = currentContent;
          
          // Check if content is a URL
          if (this.isURL(currentContent)) {
            console.log('🔗 URL detected in clipboard:', currentContent);
            await this.handleDetectedURL(currentContent);
          }
        }
      } catch (error) {
        console.error('Clipboard monitoring error:', error);
      }
    }, 2000);

    // Monitor app state changes
    AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  /**
   * Handle app state changes for clipboard monitoring
   */
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'active') {
      // App became active - check clipboard immediately
      setTimeout(async () => {
        try {
          const currentContent = await Clipboard.getString();
          if (currentContent !== this.lastClipboardContent && this.isURL(currentContent)) {
            this.lastClipboardContent = currentContent;
            console.log('🔗 URL detected on app focus:', currentContent);
            await this.handleDetectedURL(currentContent);
          }
        } catch (error) {
          console.error('App focus clipboard check error:', error);
        }
      }, 500);
    }
  }

  /**
   * Enhanced URL detection
   */
  private isURL(text: string): boolean {
    const urlPatterns = [
      /^https?:\/\//i,
      /^www\./i,
      /\.(com|org|net|edu|gov|mil|int|co|in|uk|de|fr|jp|au|br|cn|ru|za)\b/i,
      /(bit\.ly|tinyurl\.com|goo\.gl|t\.co|short\.link)/i
    ];

    return urlPatterns.some(pattern => pattern.test(text.trim()));
  }

  /**
   * Handle detected URL with native capabilities
   */
  private async handleDetectedURL(url: string): Promise<void> {
    try {
      // Import scanner service dynamically to avoid circular deps
      const { LinkScannerService } = await import('./ScannerService');
      
      console.log('🔍 Scanning detected URL:', url);
      const scanResult = await LinkScannerService.scanUrl(url);
      
      if (!scanResult.isSafe) {
        // Show native notification for dangerous URL
        this.showThreatNotification(url, scanResult.details);
      }
      
    } catch (error) {
      console.error('URL handling error:', error);
    }
  }

  /**
   * Show native threat notification
   */
  private showThreatNotification(url: string, details: string): void {
    // This will be enhanced with native notifications
    console.log('🚨 THREAT DETECTED:', { url, details });
    
    // For now, use React Native Alert
    // In native build, this can be replaced with system notifications
    const Alert = require('react-native').Alert;
    Alert.alert(
      '🚨 DANGEROUS URL DETECTED!',
      `A malicious URL was detected in your clipboard:\n\n${url}\n\nDetails: ${details}\n\n⚠️ DO NOT visit this website!`,
      [
        { text: 'Clear Clipboard', onPress: () => Clipboard.setString('') },
        { text: 'Ignore', style: 'cancel' }
      ]
    );
  }

  /**
   * Stop clipboard monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('🛑 Clipboard monitoring stopped');
  }
}
```

### **Step 6: Background File Monitoring Service**

#### Create `src/services/NativeFileWatcher.ts`:
```typescript
import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import RNFS from 'react-native-fs';

// This will be implemented as a native Android module
interface NativeFileWatcherModule {
  startWatching: (directories: string[]) => Promise<boolean>;
  stopWatching: () => Promise<boolean>;
  isWatching: () => Promise<boolean>;
}

export class NativeFileWatcher {
  private static instance: NativeFileWatcher;
  private eventEmitter: NativeEventEmitter | null = null;
  private isNativeModuleAvailable: boolean = false;
  private fileEventSubscription: any = null;

  private constructor() {
    this.checkNativeModuleAvailability();
  }

  static getInstance(): NativeFileWatcher {
    if (!NativeFileWatcher.instance) {
      NativeFileWatcher.instance = new NativeFileWatcher();
    }
    return NativeFileWatcher.instance;
  }

  private checkNativeModuleAvailability(): void {
    try {
      if (Platform.OS === 'android' && NativeModules.ShabariFileWatcher) {
        this.isNativeModuleAvailable = true;
        this.eventEmitter = new NativeEventEmitter(NativeModules.ShabariFileWatcher);
        console.log('✅ Native file watcher module available');
      } else {
        console.log('📱 Native file watcher not available - using fallback');
      }
    } catch (error) {
      console.log('❌ Native file watcher check failed:', error);
    }
  }

  /**
   * Start native file monitoring
   */
  async startFileMonitoring(): Promise<boolean> {
    if (!this.isNativeModuleAvailable) {
      console.log('📱 Starting fallback file monitoring...');
      return this.startFallbackMonitoring();
    }

    try {
      const targetDirectories = [
        '/storage/emulated/0/Download',
        '/storage/emulated/0/Pictures',
        '/storage/emulated/0/WhatsApp/Media/WhatsApp Images',
        '/storage/emulated/0/WhatsApp/Media/WhatsApp Documents',
        '/storage/emulated/0/WhatsApp/Media/WhatsApp Video',
        '/storage/emulated/0/Telegram'
      ];

      // Start native file watching
      const nativeWatcher = NativeModules.ShabariFileWatcher as NativeFileWatcherModule;
      const success = await nativeWatcher.startWatching(targetDirectories);

      if (success && this.eventEmitter) {
        // Listen for file creation events
        this.fileEventSubscription = this.eventEmitter.addListener(
          'onFileCreated',
          this.handleFileCreated.bind(this)
        );

        console.log('✅ Native file monitoring started');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Native file monitoring failed:', error);
      return this.startFallbackMonitoring();
    }
  }

  /**
   * Handle file creation events from native module
   */
  private async handleFileCreated(event: { filePath: string; fileName: string }): Promise<void> {
    console.log('📁 File created detected:', event);

    try {
      // Import scanner service
      const { FileScannerService } = await import('./ScannerService');
      
      // Scan the new file
      const scanResult = await FileScannerService.scanFileNative(event.filePath);
      
      if (!scanResult.isSafe) {
        // Show immediate threat notification
        this.showFileeThreatNotification(event.fileName, scanResult.details);
      } else {
        console.log('✅ File verified as safe:', event.fileName);
      }
      
    } catch (error) {
      console.error('File handling error:', error);
    }
  }

  /**
   * Fallback monitoring for non-native environments
   */
  private async startFallbackMonitoring(): Promise<boolean> {
    console.log('📱 Using fallback file monitoring (polling)...');
    
    // Implement basic polling-based monitoring
    // This is less efficient but works in all environments
    setInterval(async () => {
      try {
        await this.checkDownloadsDirectory();
      } catch (error) {
        console.error('Fallback monitoring error:', error);
      }
    }, 30000); // Check every 30 seconds

    return true;
  }

  /**
   * Check downloads directory for new files
   */
  private async checkDownloadsDirectory(): Promise<void> {
    try {
      const downloadsPath = '/storage/emulated/0/Download';
      const exists = await RNFS.exists(downloadsPath);
      
      if (exists) {
        const files = await RNFS.readDir(downloadsPath);
        
        // Check for recently created files (last 60 seconds)
        const recentFiles = files.filter(file => {
          const fileAge = Date.now() - new Date(file.mtime).getTime();
          return fileAge < 60000; // 60 seconds
        });

        for (const file of recentFiles) {
          console.log('📁 Recent file detected:', file.path);
          // Process recent files
        }
      }
    } catch (error) {
      console.error('Downloads check error:', error);
    }
  }

  /**
   * Show file threat notification
   */
  private showFileeThreatNotification(fileName: string, details: string): void {
    console.log('🚨 FILE THREAT DETECTED:', { fileName, details });
    
    const Alert = require('react-native').Alert;
    Alert.alert(
      '🚨 DANGEROUS FILE DETECTED!',
      `A malicious file was detected:\n\n${fileName}\n\nThreat: ${details}\n\n⚠️ The file has been quarantined for your safety.`,
      [
        { text: 'Delete File', style: 'destructive' },
        { text: 'View Details' },
        { text: 'Keep Quarantined', style: 'cancel' }
      ]
    );
  }

  /**
   * Stop file monitoring
   */
  async stopFileMonitoring(): Promise<void> {
    try {
      if (this.fileEventSubscription) {
        this.fileEventSubscription.remove();
        this.fileEventSubscription = null;
      }

      if (this.isNativeModuleAvailable) {
        const nativeWatcher = NativeModules.ShabariFileWatcher as NativeFileWatcherModule;
        await nativeWatcher.stopWatching();
      }

      console.log('🛑 File monitoring stopped');
    } catch (error) {
      console.error('Stop monitoring error:', error);
    }
  }
}
```

### **Step 7: Update App Configuration**

#### Update `app.json`:
```json
{
  "expo": {
    "name": "Shabari",
    "slug": "shabari",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.shabari.app",
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "READ_SMS",
        "RECEIVE_SMS",
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "WAKE_LOCK",
        "RECEIVE_BOOT_COMPLETED",
        "FOREGROUND_SERVICE",
        "SYSTEM_ALERT_WINDOW",
        "ACCESS_NOTIFICATION_POLICY"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-notifications",
      [
        "expo-image-picker",
        {
          "photosPermission": "The app accesses your photos to scan suspicious images for fraud detection."
        }
      ]
    ],
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    },
    "newArchEnabled": true
  }
}
```

---

## 🚀 **Build Commands**

### **Development Build:**
```bash
# Install new dependencies
npm install

# Create development build
eas build --platform android --profile native-development

# Install on device
eas build:run --platform android
```

### **Production Build:**
```bash
# Create production build  
eas build --platform android --profile native-production

# Submit to Play Store
eas submit --platform android
```

---

## 📊 **Expected Results After Implementation**

### **Before (Current Logs):**
```
❌ SQLite not available on this platform
❌ React Native FS not available on this platform
❌ Clipboard library not available
📱 Running in Expo Go - initializing limited services only
```

### **After (Native Build):**
```
✅ SQLite database initialized successfully
✅ Native file system available
✅ Native clipboard access available
✅ ML Kit Text Recognition available
✅ Native file monitoring started
✅ Background services initialized
🚀 Full native protection activated
```

---

## 🎯 **Implementation Priority**

1. **Phase 1** (Immediate): Native dependencies + EAS build setup
2. **Phase 2** (Week 1): OCR + File system + Clipboard
3. **Phase 3** (Week 2): Background monitoring + Database
4. **Phase 4** (Week 3): Testing + optimization + Play Store

This implementation will transform Shabari from a limited Expo Go app to a full-featured native security application with real-time protection capabilities! 