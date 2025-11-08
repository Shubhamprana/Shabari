# 🔍 Deep Scan Feature - Manus AI Prompt

## Project Context
**App Name**: Shabari (शबरी) - Cybersecurity Mobile App  
**Platform**: React Native (Expo) - Android  
**Language**: TypeScript  
**Architecture**: Service-based with Native Modules  
**Existing**: DeepScanService.ts and DeepScanScreen.tsx already exist but need enhancement

---

## Feature Overview: Enhanced Deep Scan

### Purpose
Create an **enhanced comprehensive device security scanner** that performs thorough scans of the entire device, detects malware, suspicious apps, corrupted files, and provides detailed threat analysis with actionable results.

### Key Requirements
1. **Multi-Stage Scanning**: Scan files, apps, permissions, and system areas
2. **Progress Tracking**: Real-time progress updates with detailed status
3. **Threat Detection**: Advanced YARA engine + heuristic analysis
4. **Comprehensive Permission Analysis**: Analyze permissions for apps, APKs, files, and social media downloads
5. **Folder-Wide Scanning**: Scan all device folders (Downloads, WhatsApp, Telegram, Social Media, etc.)
6. **Risky Permission Detection**: Identify malicious and risky permission combinations
7. **Performance Optimization**: Efficient scanning with minimal resource usage
8. **User Experience**: Beautiful UI with animations and clear results
9. **Actionable Results**: Quarantine, delete, and ignore options

---

## 📁 Complete File Structure

```
src/
├── services/
│   ├── EnhancedDeepScanService.ts            # Main enhanced deep scan service (EXISTS - ENHANCE)
│   ├── DeepScanEngine.ts                     # Core scanning engine
│   ├── DeepScanFileScanner.ts                # File scanning logic
│   ├── DeepScanAppAnalyzer.ts                # App permission analyzer
│   ├── DeepScanPermissionAnalyzer.ts         # Comprehensive permission analyzer (NEW - CRITICAL)
│   ├── DeepScanApkAnalyzer.ts                # APK permission and metadata analyzer (NEW)
│   ├── DeepScanSocialMediaAnalyzer.ts        # Social media file analyzer (NEW)
│   ├── DeepScanFolderScanner.ts              # Folder-wide scanning service (NEW)
│   ├── DeepScanProgressManager.ts            # Progress tracking and reporting
│   ├── DeepScanThreatAnalyzer.ts             # Threat analysis and classification
│   ├── DeepScanConfig.ts                     # Configuration management
│   └── DeepScanCache.ts                      # Scan result caching
│
├── components/
│   ├── DeepScanProgressCard.tsx              # Real-time progress display
│   ├── DeepScanThreatCard.tsx                 # Individual threat display card
│   ├── DeepScanStatisticsCard.tsx            # Scan statistics display
│   ├── DeepScanConfigPanel.tsx                # Scan configuration options
│   ├── DeepScanResultSummary.tsx              # Scan result summary
│   └── DeepScanActionButtons.tsx              # Threat action buttons (quarantine/delete)
│
├── screens/
│   └── EnhancedDeepScanScreen.tsx             # Main deep scan screen (ENHANCE EXISTING)
│
├── stores/
│   └── deepScanStore.ts                      # Zustand store for deep scan state
│
├── types/
│   └── deepScan.types.ts                     # TypeScript type definitions
│
└── utils/
    ├── deepScanHelpers.ts                    # Utility functions
    └── deepScanPermissions.ts                # Permission handling
```

---

## 🔧 Technical Specifications

### 1. Enhanced Service: `EnhancedDeepScanService.ts`

**Location**: `src/services/EnhancedDeepScanService.ts` (EXISTS - ENHANCE)

**Current Status**: Basic implementation exists, needs enhancement

**Enhancements Needed**:
- Improved error handling and recovery
- Better progress tracking granularity
- Enhanced threat classification
- Improved performance optimization
- Better integration with other services
- Scan result caching
- Scan cancellation improvements
- Batch processing for large scans

**Key Methods** (Enhanced):
```typescript
class EnhancedDeepScanService {
  // Lifecycle
  async performDeepScan(
    config: Partial<DeepScanConfig> = {},
    onProgress?: (progress: DeepScanProgress) => void
  ): Promise<DeepScanResult>
  
  async cancelScan(): Promise<void>
  async pauseScan(): Promise<void>
  async resumeScan(): Promise<void>
  
  // Status
  getCurrentScanStatus(): ScanStatus | null
  isScanInProgress(): boolean
  
  // History
  async getScanHistory(): Promise<DeepScanResult[]>
  async getScanResult(scanId: string): Promise<DeepScanResult | null>
  async clearScanHistory(): Promise<void>
  
  // Configuration
  getDefaultConfig(): DeepScanConfig
  validateConfig(config: Partial<DeepScanConfig>): boolean
  
  // Statistics
  getScanStatistics(): ScanStatistics
  getThreatStatistics(): ThreatStatistics
}
```

**Enhanced Interfaces**:
```typescript
interface DeepScanProgress {
  stage: 'initializing' | 'permissions' | 'scanning_files' | 'analyzing_apps' | 
         'analyzing_threats' | 'quarantining' | 'complete' | 'error' | 'cancelled' | 'paused';
  currentDirectory: string;
  currentFile: string;
  currentApp: string;
  filesScanned: number;
  totalFiles: number;
  appsScanned: number;
  totalApps: number;
  threatsFound: number;
  percentage: number;
  elapsedTime: number; // milliseconds
  estimatedTimeRemaining: number; // milliseconds
  message: string;
  subStage?: string;
  currentThreat?: DeepScanThreat;
}

interface DeepScanResult {
  scanId: string;
  success: boolean;
  scanStartTime: Date;
  scanEndTime: Date;
  scanDuration: number; // milliseconds
  scanType: 'quick' | 'full' | 'custom';
  config: DeepScanConfig;
  
  // File Scanning Results
  totalFilesScanned: number;
  filesScanned: ScannedFile[];
  threatsDetected: DeepScanThreat[];
  safeFilesCount: number;
  skippedFilesCount: number;
  errorCount: number;
  
  // App Scanning Results
  totalAppsScanned: number;
  appsScanned: ScannedApp[];
  riskyApps: RiskyApp[];
  
  // Directories
  directoriesScanned: string[];
  directoriesWithThreats: string[];
  
  // Engine Info
  scanEngineVersion: string;
  isNativeYaraUsed: boolean;
  yaraRulesMatched: string[];
  
  // Device Info
  deviceInfo: {
    platform: string;
    storageScanned: number; // bytes
    totalStorage: number; // bytes
    freeStorage: number; // bytes
  };
  
  // Statistics
  statistics: {
    averageScanTimePerFile: number;
    fastestScanTime: number;
    slowestScanTime: number;
    threatsByType: Record<string, number>;
    threatsBySeverity: Record<string, number>;
  };
  
  // Errors
  errors: ScanError[];
}

interface DeepScanThreat {
  id: string;
  type: 'file' | 'app' | 'permission' | 'system';
  filePath?: string;
  appPackageName?: string;
  fileName: string;
  fileSize: number;
  threatType: 'malware' | 'suspicious_apk' | 'corrupted_file' | 'dangerous_file' | 
              'risky_permissions' | 'suspicious_behavior' | 'unknown';
  threatName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  details: string;
  description: string;
  recommendations: string[];
  scanEngine: string;
  detectedAt: Date;
  fileHash?: string;
  yaraRules?: string[];
  confidence: number; // 0-100
  falsePositiveRisk: number; // 0-100
  actions: ThreatAction[];
}

interface ScannedFile {
  path: string;
  name: string;
  size: number;
  type: string;
  scanTime: number;
  isSafe: boolean;
  threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  scanEngine: string;
}

interface ScannedApp {
  packageName: string;
  appName: string;
  version: string;
  permissions: string[];
  riskyPermissions: string[];
  riskScore: number; // 0-100
  isSafe: boolean;
  scanTime: number;
}

interface RiskyApp {
  packageName: string;
  appName: string;
  riskReasons: string[];
  riskScore: number;
  recommendedAction: 'warn' | 'uninstall' | 'review';
}
```

---

### 2. Core Engine: `DeepScanEngine.ts`

**Location**: `src/services/DeepScanEngine.ts` (NEW)

**Responsibilities**:
- Orchestrate scanning process
- Coordinate between file scanner, app analyzer, and threat analyzer
- Manage scan queue and priorities
- Handle scan stages and transitions
- Provide unified scanning interface

**Key Methods**:
```typescript
class DeepScanEngine {
  // Initialization
  async initialize(): Promise<void>
  
  // Scanning
  async scanDevice(config: DeepScanConfig, onProgress?: ProgressCallback): Promise<DeepScanResult>
  async cancelScan(): Promise<void>
  
  // Stage Management
  async executeStage(stage: ScanStage, config: DeepScanConfig): Promise<StageResult>
  
  // Integration
  setFileScanner(scanner: DeepScanFileScanner): void
  setAppAnalyzer(analyzer: DeepScanAppAnalyzer): void
  setThreatAnalyzer(analyzer: DeepScanThreatAnalyzer): void
  setProgressManager(manager: DeepScanProgressManager): void
}
```

---

### 3. File Scanner: `DeepScanFileScanner.ts`

**Location**: `src/services/DeepScanFileScanner.ts` (NEW)

**Responsibilities**:
- Scan files in target directories
- Recursive directory scanning
- File type detection and filtering
- Integration with YARA engine
- Heuristic file analysis
- Large file handling

**Key Methods**:
```typescript
class DeepScanFileScanner {
  // Scanning
  async scanDirectory(
    directory: string,
    config: ScanFileConfig,
    onProgress?: ProgressCallback
  ): Promise<FileScanResult[]>
  
  async scanFile(filePath: string, config: ScanFileConfig): Promise<FileScanResult>
  
  // Directory Operations
  async getDirectoriesToScan(config: DeepScanConfig): Promise<string[]>
  async countFilesInDirectory(directory: string): Promise<number>
  
  // File Analysis
  async analyzeFile(filePath: string): Promise<FileAnalysis>
  async checkFileHash(filePath: string): Promise<string>
  async detectFileType(filePath: string): Promise<string>
  
  // Integration
  setYaraService(yaraService: YaraSecurityService): void
}

interface FileScanResult {
  filePath: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileHash: string;
  isSafe: boolean;
  threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  threats: DetectedThreat[];
  scanTime: number;
  scanEngine: string;
  yaraRulesMatched: string[];
  heuristicFlags: string[];
}

interface ScanFileConfig {
  maxFileSize: number;
  allowedExtensions: string[];
  skipHiddenFiles: boolean;
  skipSystemFiles: boolean;
  enableYara: boolean;
  enableHeuristic: boolean;
  scanDepth: number; // -1 for unlimited
}
```

---

### 4. Permission Analyzer: `DeepScanPermissionAnalyzer.ts` ⭐ **NEW - CRITICAL**

**Location**: `src/services/DeepScanPermissionAnalyzer.ts` (NEW)

**Purpose**: Comprehensive permission analysis system that analyzes permissions for apps, APK files, installed applications, and files from social media downloads. Identifies risky and malicious permission combinations.

**Responsibilities**:
- Analyze permissions for installed apps
- Extract and analyze permissions from APK files
- Analyze file metadata and permissions
- Detect risky permission combinations
- Identify malicious permission patterns
- Calculate permission risk scores
- Provide detailed permission risk reports
- Analyze social media downloaded files
- Scan all device folders for files with risky permissions

**Key Methods**:
```typescript
class DeepScanPermissionAnalyzer {
  // Initialization
  async initialize(): Promise<void>
  
  // App Permission Analysis
  async analyzeAppPermissions(packageName: string): Promise<AppPermissionAnalysis>
  async analyzeAllApps(config: PermissionScanConfig): Promise<AppPermissionReport>
  async getRiskyApps(): Promise<RiskyApp[]>
  
  // APK Permission Analysis
  async analyzeApkFile(apkPath: string): Promise<ApkPermissionAnalysis>
  async extractApkPermissions(apkPath: string): Promise<string[]>
  async analyzeApkManifest(apkPath: string): Promise<ApkManifestInfo>
  
  // File Permission Analysis
  async analyzeFilePermissions(filePath: string): Promise<FilePermissionAnalysis>
  async checkFileMetadata(filePath: string): Promise<FileMetadata>
  async detectFileRisks(filePath: string): Promise<FileRiskAssessment>
  
  // Social Media File Analysis
  async analyzeSocialMediaFile(filePath: string, source: 'whatsapp' | 'telegram' | 'instagram' | 'facebook' | 'other'): Promise<SocialMediaFileAnalysis>
  async scanSocialMediaFolders(): Promise<SocialMediaScanResult>
  
  // Folder Scanning
  async scanFolder(folderPath: string, config: FolderScanConfig): Promise<FolderScanResult>
  async scanAllFolders(config: FolderScanConfig): Promise<AllFoldersScanResult>
  async getFoldersToScan(): Promise<string[]>
  
  // Permission Risk Assessment
  async assessPermissionRisk(permissions: string[]): Promise<PermissionRiskAssessment>
  async detectMaliciousPermissions(permissions: string[]): Promise<MaliciousPermissionResult>
  async checkPermissionCombinations(permissions: string[]): Promise<CombinationRisk>
  calculatePermissionRiskScore(permissions: string[]): number
  
  // Risk Classification
  classifyRiskLevel(riskScore: number, permissions: string[]): RiskLevel
  identifyRiskyPatterns(permissions: string[]): RiskyPattern[]
  generateRiskReport(analysis: PermissionAnalysis): RiskReport
  
  // Integration
  setAppAnalyzer(analyzer: AppPermissionAnalyzer): void
  setApkAnalyzer(analyzer: DeepScanApkAnalyzer): void
}
```

**Interfaces**:
```typescript
interface AppPermissionAnalysis {
  packageName: string;
  appName: string;
  version: string;
  permissions: string[];
  riskyPermissions: RiskyPermission[];
  criticalPermissions: string[];
  highRiskPermissions: string[];
  mediumRiskPermissions: string[];
  permissionCategories: PermissionCategory[];
  riskScore: number; // 0-100
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';
  riskReasons: string[];
  maliciousPatterns: MaliciousPattern[];
  recommendedAction: 'safe' | 'warn' | 'review' | 'uninstall' | 'block';
  analysisTimestamp: Date;
  detailedReport: PermissionDetailedReport;
}

interface ApkPermissionAnalysis {
  apkPath: string;
  apkName: string;
  packageName: string;
  appName: string;
  version: string;
  versionCode: number;
  permissions: string[];
  riskyPermissions: RiskyPermission[];
  requestedPermissions: string[];
  usedPermissions: string[];
  minSdkVersion: number;
  targetSdkVersion: number;
  riskScore: number;
  riskLevel: RiskLevel;
  isMalicious: boolean;
  maliciousIndicators: string[];
  manifestAnalysis: ApkManifestAnalysis;
  analysisTimestamp: Date;
}

interface ApkManifestAnalysis {
  hasInternetPermission: boolean;
  hasSmsPermission: boolean;
  hasPhonePermission: boolean;
  hasLocationPermission: boolean;
  hasCameraPermission: boolean;
  hasContactsPermission: boolean;
  hasStoragePermission: boolean;
  hasAccessibilityService: boolean;
  hasDeviceAdmin: boolean;
  hasSystemAlertWindow: boolean;
  hasOverlayPermission: boolean;
  hasInstallPackages: boolean;
  hasDeletePackages: boolean;
  suspiciousActivities: string[];
  suspiciousServices: string[];
  suspiciousReceivers: string[];
  exportedComponents: string[];
}

interface FilePermissionAnalysis {
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  permissions: string[]; // File system permissions
  metadata: FileMetadata;
  riskScore: number;
  riskLevel: RiskLevel;
  isRisky: boolean;
  riskReasons: string[];
  requiresAnalysis: boolean;
  analysisTimestamp: Date;
}

interface FileMetadata {
  mimeType: string;
  extension: string;
  creationDate: Date;
  modificationDate: Date;
  owner: string;
  group: string;
  isExecutable: boolean;
  isReadable: boolean;
  isWritable: boolean;
  fileHash: string;
  suspiciousAttributes: string[];
}

interface SocialMediaFileAnalysis {
  filePath: string;
  fileName: string;
  source: 'whatsapp' | 'telegram' | 'instagram' | 'facebook' | 'twitter' | 'other';
  sourcePath: string; // e.g., /WhatsApp/Media/WhatsApp Images/
  fileType: string;
  fileSize: number;
  downloadDate: Date;
  permissions: string[];
  riskScore: number;
  riskLevel: RiskLevel;
  isRisky: boolean;
  riskReasons: string[];
  recommendedAction: 'safe' | 'scan' | 'quarantine' | 'delete';
  analysisTimestamp: Date;
}

interface FolderScanResult {
  folderPath: string;
  folderName: string;
  totalFiles: number;
  filesScanned: number;
  riskyFiles: RiskyFile[];
  apkFiles: ApkFileInfo[];
  suspiciousFiles: SuspiciousFile[];
  socialMediaFiles: SocialMediaFileInfo[];
  scanDuration: number;
  scanTimestamp: Date;
}

interface AllFoldersScanResult {
  foldersScanned: FolderScanResult[];
  totalFiles: number;
  totalRiskyFiles: number;
  totalApkFiles: number;
  totalSuspiciousFiles: number;
  criticalThreats: CriticalThreat[];
  scanDuration: number;
  scanTimestamp: Date;
}

interface RiskyPermission {
  permission: string;
  riskLevel: RiskLevel;
  riskScore: number;
  category: PermissionCategory;
  description: string;
  whyRisky: string;
  examplesOfAbuse: string[];
}

interface PermissionRiskAssessment {
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  criticalCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  riskyPermissions: RiskyPermission[];
  maliciousPatterns: MaliciousPattern[];
  recommendations: string[];
  riskReasons: string[];
}

interface MaliciousPermissionResult {
  isMalicious: boolean;
  maliciousScore: number; // 0-100
  maliciousPatterns: MaliciousPattern[];
  suspiciousCombinations: string[];
  recommendedAction: string;
  confidence: number; // 0-100
}

interface MaliciousPattern {
  patternName: string;
  patternType: 'spyware' | 'trojan' | 'adware' | 'ransomware' | 'miner' | 'keylogger' | 'banking' | 'other';
  permissions: string[];
  description: string;
  severity: RiskLevel;
  examples: string[];
}

interface CombinationRisk {
  combination: string[];
  riskLevel: RiskLevel;
  riskScore: number;
  whyRisky: string;
  commonMalware: string[];
  recommendedAction: string;
}

interface PermissionScanConfig {
  scanAllApps: boolean;
  scanSystemApps: boolean;
  scanUserApps: boolean;
  scanApkFiles: boolean;
  scanSocialMediaFiles: boolean;
  scanDownloads: boolean;
  scanWhatsApp: boolean;
  scanTelegram: boolean;
  scanInstagram: boolean;
  scanFacebook: boolean;
  scanAllFolders: boolean;
  riskThreshold: number; // 0-100
  enableDeepAnalysis: boolean;
  checkPermissionCombinations: boolean;
  detectMaliciousPatterns: boolean;
}

interface FolderScanConfig {
  recursive: boolean;
  maxDepth: number;
  scanApkFiles: boolean;
  scanSocialMediaFiles: boolean;
  checkFilePermissions: boolean;
  analyzeMetadata: boolean;
  riskThreshold: number;
}
```

**Permission Risk Categories**:
```typescript
// CRITICAL PERMISSIONS (50 points each)
const CRITICAL_PERMISSIONS = [
  'android.permission.BIND_ACCESSIBILITY_SERVICE', // Can control entire device
  'android.permission.BIND_DEVICE_ADMIN', // Device administrator
  'android.permission.SYSTEM_ALERT_WINDOW', // Overlay other apps
  'android.permission.WRITE_SECURE_SETTINGS', // Modify system settings
  'android.permission.INSTALL_PACKAGES', // Install apps
  'android.permission.DELETE_PACKAGES', // Delete apps
  'android.permission.BIND_VPN_SERVICE', // VPN service (can intercept traffic)
  'android.permission.REQUEST_INSTALL_PACKAGES', // Request app installation
  'android.permission.MANAGE_EXTERNAL_STORAGE', // Full storage access (Android 11+)
];

// HIGH RISK PERMISSIONS (30 points each)
const HIGH_RISK_PERMISSIONS = [
  'android.permission.READ_SMS', // Read SMS messages
  'android.permission.SEND_SMS', // Send SMS (can incur charges)
  'android.permission.RECEIVE_SMS', // Receive SMS
  'android.permission.READ_CALL_LOG', // Access call history
  'android.permission.WRITE_CALL_LOG', // Modify call history
  'android.permission.CALL_PHONE', // Make phone calls
  'android.permission.READ_PHONE_STATE', // Access phone state
  'android.permission.READ_CONTACTS', // Access contacts
  'android.permission.WRITE_CONTACTS', // Modify contacts
  'android.permission.ACCESS_FINE_LOCATION', // Precise GPS location
  'android.permission.ACCESS_COARSE_LOCATION', // Approximate location
  'android.permission.RECORD_AUDIO', // Record audio
  'android.permission.CAMERA', // Access camera
  'android.permission.READ_PHONE_NUMBERS', // Read phone numbers
];

// MEDIUM RISK PERMISSIONS (15 points each)
const MEDIUM_RISK_PERMISSIONS = [
  'android.permission.READ_EXTERNAL_STORAGE', // Read files
  'android.permission.WRITE_EXTERNAL_STORAGE', // Write files
  'android.permission.READ_MEDIA_IMAGES', // Read images (Android 13+)
  'android.permission.READ_MEDIA_VIDEO', // Read videos (Android 13+)
  'android.permission.READ_MEDIA_AUDIO', // Read audio (Android 13+)
  'android.permission.ACCESS_NETWORK_STATE', // Check network state
  'android.permission.INTERNET', // Internet access
  'android.permission.WAKE_LOCK', // Keep device awake
  'android.permission.RECEIVE_BOOT_COMPLETED', // Auto-start on boot
  'android.permission.GET_ACCOUNTS', // Access accounts
  'android.permission.READ_CALENDAR', // Read calendar
  'android.permission.WRITE_CALENDAR', // Modify calendar
];

// MALICIOUS PERMISSION PATTERNS
const MALICIOUS_PATTERNS = [
  {
    name: 'SMS Spyware',
    type: 'spyware',
    permissions: ['READ_SMS', 'SEND_SMS', 'RECEIVE_SMS'],
    severity: 'CRITICAL',
    description: 'Can read and send SMS messages, often used by spyware'
  },
  {
    name: 'Banking Trojan',
    type: 'banking',
    permissions: ['SYSTEM_ALERT_WINDOW', 'BIND_ACCESSIBILITY_SERVICE', 'READ_SMS'],
    severity: 'CRITICAL',
    description: 'Can overlay banking apps and intercept SMS for 2FA codes'
  },
  {
    name: 'Location Tracker',
    type: 'spyware',
    permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'INTERNET'],
    severity: 'HIGH',
    description: 'Can track user location and send to remote server'
  },
  {
    name: 'Keylogger',
    type: 'keylogger',
    permissions: ['BIND_ACCESSIBILITY_SERVICE', 'INTERNET'],
    severity: 'CRITICAL',
    description: 'Can record all keyboard input and screen content'
  },
  {
    name: 'Ransomware',
    type: 'ransomware',
    permissions: ['WRITE_EXTERNAL_STORAGE', 'MANAGE_EXTERNAL_STORAGE', 'INTERNET'],
    severity: 'CRITICAL',
    description: 'Can encrypt files and demand payment'
  },
  {
    name: 'Adware',
    type: 'adware',
    permissions: ['SYSTEM_ALERT_WINDOW', 'INTERNET', 'RECEIVE_BOOT_COMPLETED'],
    severity: 'MEDIUM',
    description: 'Can display intrusive ads and auto-start'
  },
  {
    name: 'Crypto Miner',
    type: 'miner',
    permissions: ['WAKE_LOCK', 'INTERNET', 'RECEIVE_BOOT_COMPLETED'],
    severity: 'HIGH',
    description: 'Can mine cryptocurrency in background, draining battery'
  }
];
```

**Folders to Scan**:
```typescript
const FOLDERS_TO_SCAN = [
  // Downloads
  '/storage/emulated/0/Download',
  '/storage/emulated/0/Downloads',
  '/storage/emulated/0/DCIM',
  
  // WhatsApp
  '/storage/emulated/0/WhatsApp/Media/WhatsApp Images',
  '/storage/emulated/0/WhatsApp/Media/WhatsApp Video',
  '/storage/emulated/0/WhatsApp/Media/WhatsApp Audio',
  '/storage/emulated/0/WhatsApp/Media/WhatsApp Documents',
  '/storage/emulated/0/WhatsApp/Media/WhatsApp Animated Gifs',
  
  // Telegram
  '/storage/emulated/0/Telegram/Telegram Images',
  '/storage/emulated/0/Telegram/Telegram Video',
  '/storage/emulated/0/Telegram/Telegram Audio',
  '/storage/emulated/0/Telegram/Telegram Documents',
  
  // Instagram
  '/storage/emulated/0/Android/media/com.instagram.android/Instagram',
  '/storage/emulated/0/Pictures/Instagram',
  
  // Facebook
  '/storage/emulated/0/Android/media/com.facebook.katana/Facebook',
  '/storage/emulated/0/Pictures/Facebook',
  
  // Twitter
  '/storage/emulated/0/Android/media/com.twitter.android/Twitter',
  '/storage/emulated/0/Pictures/Twitter',
  
  // Documents
  '/storage/emulated/0/Documents',
  '/storage/emulated/0/MyFiles',
  
  // APK Files
  '/storage/emulated/0/APK',
  '/storage/emulated/0/Download/APK',
  
  // Cache (may contain suspicious files)
  '/storage/emulated/0/Android/data',
];
```

**Integration Points**:
- Integrate with `AppPermissionAnalyzer` for installed app analysis
- Integrate with `DeepScanApkAnalyzer` for APK file analysis
- Integrate with `DeepScanFileScanner` for file scanning
- Integrate with `YaraSecurityService` for malware detection
- Use native Android `PackageManager` for permission extraction
- Use `expo-file-system` for file metadata analysis

---

### 5. APK Analyzer: `DeepScanApkAnalyzer.ts` ⭐ **NEW**

**Location**: `src/services/DeepScanApkAnalyzer.ts` (NEW)

**Purpose**: Analyze APK files for permissions, metadata, and suspicious behavior. Extract and analyze AndroidManifest.xml from APK files.

**Responsibilities**:
- Extract APK permissions from AndroidManifest.xml
- Analyze APK metadata (package name, version, SDK versions)
- Detect suspicious APK characteristics
- Calculate APK risk scores
- Identify malicious APK patterns
- Scan APK files in all folders

**Key Methods**:
```typescript
class DeepScanApkAnalyzer {
  // APK Analysis
  async analyzeApk(apkPath: string): Promise<ApkAnalysis>
  async extractPermissions(apkPath: string): Promise<string[]>
  async extractManifest(apkPath: string): Promise<ApkManifest>
  async analyzeApkMetadata(apkPath: string): Promise<ApkMetadata>
  
  // APK Scanning
  async scanApkFiles(folderPath: string): Promise<ApkFile[]>
  async scanAllApkFiles(): Promise<ApkFile[]>
  
  // Risk Assessment
  async assessApkRisk(apkPath: string): Promise<ApkRiskAssessment>
  async detectMaliciousApk(apkPath: string): Promise<boolean>
  calculateApkRiskScore(apk: ApkAnalysis): number
  
  // Integration
  setPermissionAnalyzer(analyzer: DeepScanPermissionAnalyzer): void
}
```

---

### 6. Social Media Analyzer: `DeepScanSocialMediaAnalyzer.ts` ⭐ **NEW**

**Location**: `src/services/DeepScanSocialMediaAnalyzer.ts` (NEW)

**Purpose**: Analyze files downloaded from social media apps (WhatsApp, Telegram, Instagram, Facebook, etc.) for suspicious content and permissions.

**Responsibilities**:
- Identify social media source of files
- Analyze files from social media folders
- Detect suspicious file patterns
- Check file metadata and permissions
- Calculate risk scores for social media files

**Key Methods**:
```typescript
class DeepScanSocialMediaAnalyzer {
  // File Analysis
  async analyzeSocialMediaFile(filePath: string): Promise<SocialMediaFileAnalysis>
  async identifySource(filePath: string): Promise<'whatsapp' | 'telegram' | 'instagram' | 'facebook' | 'twitter' | 'other'>
  
  // Folder Scanning
  async scanWhatsAppFiles(): Promise<SocialMediaFile[]>
  async scanTelegramFiles(): Promise<SocialMediaFile[]>
  async scanInstagramFiles(): Promise<SocialMediaFile[]>
  async scanFacebookFiles(): Promise<SocialMediaFile[]>
  async scanAllSocialMediaFiles(): Promise<AllSocialMediaFilesResult>
  
  // Risk Assessment
  async assessSocialMediaFileRisk(file: SocialMediaFile): Promise<RiskAssessment>
}
```

---

### 7. Folder Scanner: `DeepScanFolderScanner.ts` ⭐ **NEW**

**Location**: `src/services/DeepScanFolderScanner.ts` (NEW)

**Purpose**: Scan all specified folders on the device for files, APKs, and analyze their permissions and risks.

**Responsibilities**:
- Scan all configured folders
- Recursively scan subdirectories
- Identify file types
- Extract file permissions and metadata
- Coordinate with permission analyzer
- Generate folder scan reports

**Key Methods**:
```typescript
class DeepScanFolderScanner {
  // Folder Scanning
  async scanFolder(folderPath: string, config: FolderScanConfig): Promise<FolderScanResult>
  async scanAllFolders(config: FolderScanConfig): Promise<AllFoldersScanResult>
  async getFoldersToScan(): Promise<string[]>
  
  // File Discovery
  async discoverFiles(folderPath: string): Promise<FileInfo[]>
  async discoverApkFiles(folderPath: string): Promise<ApkFileInfo[]>
  async discoverSocialMediaFiles(folderPath: string): Promise<SocialMediaFileInfo[]>
  
  // Integration
  setPermissionAnalyzer(analyzer: DeepScanPermissionAnalyzer): void
  setFileScanner(scanner: DeepScanFileScanner): void
}
```

---

### 8. App Analyzer: `DeepScanAppAnalyzer.ts`

**Location**: `src/services/DeepScanAppAnalyzer.ts` (NEW)

**Responsibilities**:
- Scan installed applications
- Analyze app permissions
- Detect risky permission combinations
- Identify suspicious apps
- Calculate risk scores

**Key Methods**:
```typescript
class DeepScanAppAnalyzer {
  // Scanning
  async scanInstalledApps(
    config: ScanAppConfig,
    onProgress?: ProgressCallback
  ): Promise<AppScanResult[]>
  
  async analyzeApp(packageName: string): Promise<AppAnalysis>
  
  // Permission Analysis
  async analyzePermissions(permissions: string[]): Promise<PermissionAnalysis>
  async getRiskyPermissions(): Promise<string[]>
  async checkPermissionCombinations(permissions: string[]): Promise<RiskAssessment>
  
  // Risk Assessment
  calculateRiskScore(app: AppInfo): number
  identifyRiskReasons(app: AppInfo): string[]
  
  // Integration
  setPermissionAnalyzer(analyzer: AppPermissionAnalyzer): void
}

interface AppScanResult {
  packageName: string;
  appName: string;
  version: string;
  installedDate: Date;
  permissions: string[];
  riskyPermissions: string[];
  riskScore: number;
  riskReasons: string[];
  isSafe: boolean;
  recommendedAction: 'safe' | 'warn' | 'review' | 'uninstall';
  scanTime: number;
}

interface ScanAppConfig {
  scanAllApps: boolean;
  scanSystemApps: boolean;
  scanUserApps: boolean;
  riskThreshold: number; // 0-100
  checkPermissions: boolean;
  checkBehaviors: boolean;
}
```

---

### 5. Threat Analyzer: `DeepScanThreatAnalyzer.ts`

**Location**: `src/services/DeepScanThreatAnalyzer.ts` (NEW)

**Responsibilities**:
- Analyze and classify threats
- Calculate threat severity
- Provide threat descriptions and recommendations
- Detect false positives
- Generate threat reports

**Key Methods**:
```typescript
class DeepScanThreatAnalyzer {
  // Analysis
  async analyzeThreat(threat: RawThreat): Promise<DeepScanThreat>
  async classifyThreat(threat: RawThreat): Promise<ThreatClassification>
  
  // Severity
  calculateSeverity(threat: RawThreat): ThreatSeverity
  calculateConfidence(threat: RawThreat): number
  assessFalsePositiveRisk(threat: RawThreat): number
  
  // Recommendations
  generateRecommendations(threat: DeepScanThreat): string[]
  generateActions(threat: DeepScanThreat): ThreatAction[]
  
  // Reporting
  generateThreatReport(threats: DeepScanThreat[]): ThreatReport
  generateSummary(threats: DeepScanThreat[]): ThreatSummary
}

interface ThreatClassification {
  threatType: string;
  category: string;
  severity: ThreatSeverity;
  confidence: number;
  falsePositiveRisk: number;
  description: string;
}

interface ThreatReport {
  totalThreats: number;
  threatsByType: Record<string, number>;
  threatsBySeverity: Record<string, number>;
  criticalThreats: DeepScanThreat[];
  recommendations: string[];
  scanDate: Date;
}
```

---

### 6. Progress Manager: `DeepScanProgressManager.ts`

**Location**: `src/services/DeepScanProgressManager.ts` (NEW)

**Responsibilities**:
- Track scan progress
- Calculate time estimates
- Provide progress updates
- Handle progress callbacks
- Manage scan stages

**Key Methods**:
```typescript
class DeepScanProgressManager {
  // Progress Tracking
  startScan(scanId: string, config: DeepScanConfig): void
  updateProgress(progress: Partial<DeepScanProgress>): void
  getCurrentProgress(): DeepScanProgress | null
  completeScan(): void
  cancelScan(): void
  
  // Time Estimation
  calculateTimeRemaining(): number
  estimateTotalTime(): number
  updateTimeEstimates(): void
  
  // Callbacks
  setProgressCallback(callback: ProgressCallback): void
  notifyProgress(progress: DeepScanProgress): void
  
  // Statistics
  getStageStatistics(): StageStatistics
  getPerformanceMetrics(): PerformanceMetrics
}
```

---

### 7. Configuration: `DeepScanConfig.ts`

**Location**: `src/services/DeepScanConfig.ts` (NEW)

**Responsibilities**:
- Manage scan configuration
- Provide preset configurations (quick/full/custom)
- Validate configuration
- Persist settings

**Key Methods**:
```typescript
class DeepScanConfig {
  // Presets
  static getQuickScanConfig(): DeepScanConfig
  static getFullScanConfig(): DeepScanConfig
  static getCustomConfig(): DeepScanConfig
  
  // Validation
  static validate(config: Partial<DeepScanConfig>): ValidationResult
  static sanitize(config: Partial<DeepScanConfig>): DeepScanConfig
  
  // Persistence
  async load(): Promise<DeepScanConfig>
  async save(config: DeepScanConfig): Promise<void>
}

interface DeepScanConfig {
  scanType: 'quick' | 'full' | 'custom';
  
  // File Scanning
  scanDownloads: boolean;
  scanDocuments: boolean;
  scanImages: boolean;
  scanWhatsApp: boolean;
  scanTelegram: boolean;
  scanApkFiles: boolean;
  scanCache: boolean;
  scanSystemDirs: boolean;
  
  // App Scanning
  scanAppPermissions: boolean;
  scanAllApps: boolean;
  scanSystemApps: boolean;
  scanUserApps: boolean;
  
  // Permission Analysis
  enablePermissionAnalysis: boolean;
  analyzeApkPermissions: boolean;
  analyzeFilePermissions: boolean;
  analyzeSocialMediaPermissions: boolean;
  detectMaliciousPermissions: boolean;
  checkPermissionCombinations: boolean;
  
  // Folder Scanning
  scanAllFolders: boolean;
  scanSocialMediaFolders: boolean;
  scanWhatsApp: boolean;
  scanTelegram: boolean;
  scanInstagram: boolean;
  scanFacebook: boolean;
  scanTwitter: boolean;
  
  // Settings
  maxFileSize: number; // bytes
  enableYaraEngine: boolean;
  enableHeuristicScan: boolean;
  enableAutoQuarantine: boolean;
  skipSystemFiles: boolean;
  skipHiddenFiles: boolean;
  recursiveScan: boolean;
  maxScanDepth: number;
  
  // Performance
  scanPriority: 'speed' | 'balanced' | 'thorough';
  maxConcurrentScans: number;
  batchSize: number;
  
  // Filters
  fileExtensions: string[];
  skipExtensions: string[];
  minFileSize: number;
  maxFileSize: number;
}
```

---

### 8. Cache: `DeepScanCache.ts`

**Location**: `src/services/DeepScanCache.ts` (NEW)

**Responsibilities**:
- Cache scan results
- Store scan history
- Provide quick access to previous scans
- Manage cache size

**Key Methods**:
```typescript
class DeepScanCache {
  // Cache Management
  async cacheScanResult(result: DeepScanResult): Promise<void>
  async getCachedResult(scanId: string): Promise<DeepScanResult | null>
  async getScanHistory(limit?: number): Promise<DeepScanResult[]>
  async clearCache(): Promise<void>
  
  // File Hashing
  async cacheFileHash(filePath: string, hash: string): Promise<void>
  async getFileHash(filePath: string): Promise<string | null>
  async isFileCached(filePath: string): Promise<boolean>
}
```

---

### 9. Zustand Store: `deepScanStore.ts`

**Location**: `src/stores/deepScanStore.ts` (NEW)

**Responsibilities**:
- Manage deep scan state
- Provide reactive updates
- Persist scan history

**Interface**:
```typescript
interface DeepScanStore {
  // State
  isScanning: boolean;
  isPaused: boolean;
  currentProgress: DeepScanProgress | null;
  currentResult: DeepScanResult | null;
  scanHistory: DeepScanResult[];
  config: DeepScanConfig;
  
  // Actions
  startScan: (config: DeepScanConfig) => void;
  updateProgress: (progress: DeepScanProgress) => void;
  completeScan: (result: DeepScanResult) => void;
  cancelScan: () => void;
  pauseScan: () => void;
  resumeScan: () => void;
  setConfig: (config: DeepScanConfig) => void;
  addToHistory: (result: DeepScanResult) => void;
  clearHistory: () => void;
}
```

---

### 10. UI Components

#### `DeepScanProgressCard.tsx`
- Real-time progress display
- Stage indicator
- File/app counter
- Time remaining
- Percentage complete
- Animated progress bar

#### `DeepScanThreatCard.tsx`
- Threat information display
- Severity indicator
- Expandable details
- Action buttons
- Threat type icon

#### `DeepScanStatisticsCard.tsx`
- Scan statistics
- Files scanned
- Threats found
- Scan duration
- Performance metrics

#### `DeepScanConfigPanel.tsx`
- Scan type selection (Quick/Full/Custom)
- Directory checkboxes
- File type filters
- Advanced options
- Save configuration

#### `DeepScanResultSummary.tsx`
- Overall scan summary
- Threat overview
- Statistics
- Recommendations
- Action buttons

#### `DeepScanActionButtons.tsx`
- Quarantine button
- Delete button
- Ignore button
- View details button
- Batch actions

---

### 11. Enhanced Screen: `EnhancedDeepScanScreen.tsx`

**Location**: `src/screens/EnhancedDeepScanScreen.tsx` (ENHANCE EXISTING)

**Enhancements Needed**:
- Better progress visualization
- Improved threat display
- Better error handling
- Enhanced animations
- Better navigation
- Improved accessibility
- Better loading states

**Features**:
1. **Pre-Scan View**:
   - Scan type selection
   - Configuration panel
   - Start scan button
   - Recent scan history

2. **Scanning View**:
   - Animated progress indicator
   - Real-time progress card
   - Current file/app being scanned
   - Time estimates
   - Pause/Cancel buttons

3. **Results View**:
   - Result summary
   - Threat list with cards
   - Statistics
   - Action buttons
   - Export/share options

4. **Threat Details View**:
   - Detailed threat information
   - Recommendations
   - Action buttons
   - Related threats

---

## 🔗 Integration Points

### Existing Services to Integrate With:

1. **YaraSecurityService** (`src/services/YaraSecurityService.ts`)
   - Primary scanning engine
   - Already exists

2. **AppPermissionAnalyzer** (`src/services/AppPermissionAnalyzer.ts`)
   - App permission analysis
   - Already exists
   - Will be integrated with DeepScanPermissionAnalyzer

3. **DeepScanPermissionAnalyzer** (`src/services/DeepScanPermissionAnalyzer.ts`)
   - Comprehensive permission analysis (NEW)
   - Analyzes apps, APKs, files, and social media downloads
   - Detects malicious permission patterns

4. **DeepScanApkAnalyzer** (`src/services/DeepScanApkAnalyzer.ts`)
   - APK file analysis (NEW)
   - Extracts permissions from APK files
   - Analyzes AndroidManifest.xml

5. **DeepScanSocialMediaAnalyzer** (`src/services/DeepScanSocialMediaAnalyzer.ts`)
   - Social media file analysis (NEW)
   - Scans WhatsApp, Telegram, Instagram, Facebook files

6. **DeepScanFolderScanner** (`src/services/DeepScanFolderScanner.ts`)
   - Folder-wide scanning (NEW)
   - Scans all device folders
   - Coordinates with permission analyzer

7. **QuarantineService** (`src/services/QuarantineService.ts`)
   - Quarantine threats
   - Already exists

8. **ExpoNotificationService** (`src/services/ExpoNotificationService.ts`)
   - Notify when scan completes
   - Already exists

9. **PermissionManager** (`src/services/PermissionManager.tsx`)
   - Handle storage permissions
   - Already exists

10. **Native Android PackageManager**
    - Extract app permissions from installed apps
    - Access app manifest information
    - Required for permission analysis

---

## 📱 Android Requirements

### Permissions (Already in app.config.js):
- `READ_EXTERNAL_STORAGE`
- `WRITE_EXTERNAL_STORAGE` (for Android < 13)

### Additional Considerations:
- Handle scoped storage limitations
- Request MANAGE_EXTERNAL_STORAGE if needed (for Android 11+)
- Handle permission denials gracefully

---

## 🎯 Implementation Checklist

### Phase 1: Core Services Enhancement
- [ ] Enhance `EnhancedDeepScanService.ts` with new features
- [ ] Create `DeepScanEngine.ts` orchestration layer
- [ ] Create `DeepScanFileScanner.ts` for file scanning
- [ ] Create `DeepScanAppAnalyzer.ts` for app analysis
- [ ] Create `DeepScanPermissionAnalyzer.ts` ⭐ **NEW - CRITICAL** for comprehensive permission analysis
- [ ] Create `DeepScanApkAnalyzer.ts` ⭐ **NEW** for APK permission analysis
- [ ] Create `DeepScanSocialMediaAnalyzer.ts` ⭐ **NEW** for social media file analysis
- [ ] Create `DeepScanFolderScanner.ts` ⭐ **NEW** for folder-wide scanning
- [ ] Create `DeepScanThreatAnalyzer.ts` for threat analysis
- [ ] Create `DeepScanProgressManager.ts` for progress tracking
- [ ] Create `DeepScanConfig.ts` for configuration
- [ ] Create `DeepScanCache.ts` for caching

### Phase 2: State Management
- [ ] Create `deepScanStore.ts` Zustand store
- [ ] Create `deepScan.types.ts` type definitions
- [ ] Integrate with existing stores

### Phase 3: UI Components
- [ ] Create `DeepScanProgressCard.tsx`
- [ ] Create `DeepScanThreatCard.tsx`
- [ ] Create `DeepScanStatisticsCard.tsx`
- [ ] Create `DeepScanConfigPanel.tsx`
- [ ] Create `DeepScanResultSummary.tsx`
- [ ] Create `DeepScanActionButtons.tsx`
- [ ] Enhance `EnhancedDeepScanScreen.tsx`

### Phase 4: Integration
- [ ] Integrate with YaraSecurityService
- [ ] Integrate with AppPermissionAnalyzer
- [ ] Integrate DeepScanPermissionAnalyzer with AppPermissionAnalyzer ⭐
- [ ] Integrate DeepScanPermissionAnalyzer with DeepScanApkAnalyzer ⭐
- [ ] Integrate DeepScanPermissionAnalyzer with DeepScanSocialMediaAnalyzer ⭐
- [ ] Integrate DeepScanFolderScanner with DeepScanPermissionAnalyzer ⭐
- [ ] Integrate with QuarantineService
- [ ] Integrate with ExpoNotificationService
- [ ] Integrate with PermissionManager
- [ ] Integrate with Native Android PackageManager for permission extraction ⭐
- [ ] Update navigation
- [ ] Update DashboardScreen

### Phase 5: Testing & Optimization
- [ ] Test quick scan
- [ ] Test full scan
- [ ] Test custom scan
- [ ] Test progress tracking
- [ ] Test threat detection
- [ ] Test app permission analysis
- [ ] Test APK permission extraction ⭐
- [ ] Test file permission analysis ⭐
- [ ] Test social media file analysis ⭐
- [ ] Test folder-wide scanning ⭐
- [ ] Test malicious permission detection ⭐
- [ ] Test permission combination analysis ⭐
- [ ] Test error handling
- [ ] Test performance
- [ ] Optimize scanning speed
- [ ] Optimize memory usage

---

## 📝 Code Style Guidelines

1. **TypeScript**: Use strict TypeScript with proper types
2. **Error Handling**: Comprehensive try-catch with Sentry logging
3. **Logging**: Use console.log with emoji prefixes (🔍 for deep scan)
4. **Sentry**: Add breadcrumbs for all major operations
5. **Async/Await**: Prefer async/await
6. **Comments**: JSDoc for all public methods
7. **Performance**: Optimize for large scans
8. **React Native**: Follow best practices

---

## 🚀 Expected Behavior

### Quick Scan (2-5 minutes):
1. Initialize services
2. Request permissions
3. Scan Downloads directory
4. Scan Documents directory
5. Scan WhatsApp media
6. Scan APK files
7. **Analyze APK permissions** ⭐ (NEW)
8. **Analyze file permissions** ⭐ (NEW)
9. **Scan social media folders** ⭐ (NEW)
10. Analyze app permissions (if enabled)
11. **Detect malicious permission patterns** ⭐ (NEW)
12. Analyze threats
13. Generate results
14. Display results

### Full Scan (5-15 minutes):
1. Initialize services
2. Request permissions
3. **Scan all folders** (Downloads, WhatsApp, Telegram, Instagram, Facebook, etc.) ⭐ (NEW)
4. **Scan all APK files** and analyze their permissions ⭐ (NEW)
5. **Scan all social media files** and analyze permissions ⭐ (NEW)
6. Scan all user apps
7. **Analyze all app permissions** with malicious pattern detection ⭐ (NEW)
8. **Analyze permission combinations** for risky patterns ⭐ (NEW)
9. **Analyze file permissions** and metadata ⭐ (NEW)
10. **Detect malicious permission patterns** (spyware, trojan, keylogger, etc.) ⭐ (NEW)
11. Deep threat analysis
12. Generate comprehensive report with permission analysis
13. Display detailed results with permission risk scores

### User Experience:
- Clear progress indicators
- Real-time updates
- Smooth animations
- Responsive UI
- Clear error messages
- Actionable results

---

## 📊 Performance Requirements

- **Quick Scan**: Complete in 2-5 minutes
- **Full Scan**: Complete in 5-15 minutes
- **Progress Updates**: Update every 100-500ms
- **Memory Usage**: < 200MB during scan
- **Battery Usage**: Reasonable (< 5% per scan)
- **UI Responsiveness**: 60 FPS during scanning

---

## 🎨 UI/UX Requirements

1. **Progress Visualization**: 
   - Circular progress indicator
   - Linear progress bar
   - Stage indicators
   - File/app counters

2. **Threat Display**:
   - Color-coded severity
   - Expandable cards
   - Clear icons
   - Action buttons

3. **Results**:
   - Summary statistics
   - Threat breakdown
   - Recommendations
   - Export options

4. **Animations**:
   - Smooth transitions
   - Loading animations
   - Progress animations
   - Success/error animations

---

## ✅ Success Criteria

1. ✅ Quick scan completes in 2-5 minutes
2. ✅ Full scan completes in 5-15 minutes
3. ✅ Progress updates are real-time and accurate
4. ✅ Threat detection is accurate
5. ✅ App permission analysis works
6. ✅ APK permission extraction works ⭐
7. ✅ File permission analysis works ⭐
8. ✅ Social media file analysis works ⭐
9. ✅ Folder-wide scanning works ⭐
10. ✅ Malicious permission detection works ⭐
11. ✅ Permission combination analysis works ⭐
12. ✅ UI is responsive and smooth
13. ✅ Error handling is comprehensive
14. ✅ Results are actionable
15. ✅ Performance is optimized
16. ✅ Code is maintainable
17. ✅ All folders are scanned (Downloads, WhatsApp, Telegram, Social Media) ⭐
18. ✅ Permission risk scores are accurate ⭐
19. ✅ Malicious patterns are correctly identified ⭐
20. ✅ APK files are analyzed for permissions ⭐
21. ✅ Social media downloaded files are analyzed ⭐

---

## 📦 Deliverables

When generating code with Manus AI, provide:

1. **All TypeScript/React Native files** listed in file structure
2. **Enhanced existing files** with improvements
3. **Type definitions** in deepScan.types.ts
4. **Integration code** for navigation and services
5. **UI components** with animations
6. **Documentation** as code comments
7. **Example usage** in comments

---

## 🎯 Final Notes

- **Enhance existing code** - Don't rewrite, enhance what exists
- **Follow existing patterns** - Match codebase style
- **Use existing services** - Integrate with existing services
- **Optimize performance** - Focus on speed and efficiency
- **Test thoroughly** - Ensure all features work
- **Document everything** - Code comments and JSDoc
- **Make it beautiful** - Focus on UI/UX excellence

---

---

## 🔐 Permission Analyzer Feature Summary ⭐

### **NEW CRITICAL FEATURES ADDED:**

1. **Comprehensive Permission Analyzer** (`DeepScanPermissionAnalyzer.ts`)
   - Analyzes permissions for installed apps, APK files, and regular files
   - Detects risky and malicious permission combinations
   - Calculates risk scores (0-100) for all analyzed items
   - Identifies malicious patterns (spyware, trojan, keylogger, banking malware, etc.)

2. **APK Permission Analysis** (`DeepScanApkAnalyzer.ts`)
   - Extracts permissions from APK files before installation
   - Analyzes AndroidManifest.xml
   - Detects suspicious APK characteristics
   - Calculates APK risk scores

3. **Social Media File Analyzer** (`DeepScanSocialMediaAnalyzer.ts`)
   - Analyzes files downloaded from WhatsApp, Telegram, Instagram, Facebook, Twitter
   - Identifies file source automatically
   - Checks file metadata and permissions
   - Calculates risk scores for social media files

4. **Folder-Wide Scanner** (`DeepScanFolderScanner.ts`)
   - Scans ALL device folders (Downloads, WhatsApp, Telegram, Instagram, Facebook, etc.)
   - Recursively scans subdirectories
   - Coordinates with permission analyzer
   - Generates comprehensive folder scan reports

### **Permission Risk Categories:**

- **CRITICAL** (50 points each): Device admin, Accessibility service, System overlay, Install packages, VPN service
- **HIGH RISK** (30 points each): SMS, Phone, Contacts, Location, Camera, Audio recording
- **MEDIUM RISK** (15 points each): Storage access, Internet, Wake lock, Boot completed

### **Malicious Patterns Detected:**

1. **SMS Spyware**: READ_SMS + SEND_SMS + RECEIVE_SMS
2. **Banking Trojan**: SYSTEM_ALERT_WINDOW + BIND_ACCESSIBILITY_SERVICE + READ_SMS
3. **Location Tracker**: ACCESS_FINE_LOCATION + INTERNET
4. **Keylogger**: BIND_ACCESSIBILITY_SERVICE + INTERNET
5. **Ransomware**: WRITE_EXTERNAL_STORAGE + MANAGE_EXTERNAL_STORAGE + INTERNET
6. **Adware**: SYSTEM_ALERT_WINDOW + INTERNET + RECEIVE_BOOT_COMPLETED
7. **Crypto Miner**: WAKE_LOCK + INTERNET + RECEIVE_BOOT_COMPLETED

### **Folders Scanned:**

- Downloads folder
- WhatsApp media folders (Images, Video, Audio, Documents)
- Telegram folders (Images, Video, Audio, Documents)
- Instagram folders
- Facebook folders
- Twitter folders
- Documents folder
- APK storage folders
- Android data cache

### **Integration:**

- Uses existing `AppPermissionAnalyzer` for installed apps
- Integrates with `YaraSecurityService` for malware detection
- Uses native Android `PackageManager` for permission extraction
- Uses `expo-file-system` for file metadata analysis

---

**Ready to generate code!** This prompt provides complete structure and specifications for implementing the Enhanced Deep Scan feature **WITH COMPREHENSIVE PERMISSION ANALYSIS**. Use this with Manus AI to generate all necessary files in a zip archive.

**⭐ NEW FEATURES HIGHLIGHTED:** All permission analyzer features are marked with ⭐ throughout this document for easy identification.

