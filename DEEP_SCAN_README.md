# Deep Scan Feature - Implementation Documentation

## Overview

The Enhanced Deep Scan feature provides comprehensive device security scanning with advanced threat detection, permission analysis, and real-time progress tracking for the Shabari cybersecurity mobile application.

## 📁 File Structure

```
src/
├── services/
│   ├── EnhancedDeepScanService.ts            ✅ Main enhanced deep scan service
│   ├── DeepScanPermissionAnalyzer.ts         ✅ Comprehensive permission analyzer (NEW - CRITICAL)
│   ├── DeepScanApkAnalyzer.ts                ✅ APK permission and metadata analyzer (NEW)
│   ├── DeepScanSocialMediaAnalyzer.ts        ✅ Social media file analyzer (NEW)
│   ├── DeepScanFolderScanner.ts              ✅ Folder-wide scanning service (NEW)
│   └── DeepScanService.ts                    📝 Original service (kept for backward compatibility)
│
├── stores/
│   └── deepScanStore.ts                      ✅ Zustand store for deep scan state
│
└── types/
    └── deepScan.types.ts                     ✅ TypeScript type definitions
```

## 🔧 Core Services

### 1. EnhancedDeepScanService.ts

**Main orchestration service** that coordinates all scanning operations.

**Key Features:**
- Multi-stage scanning (files, apps, permissions, folders)
- Real-time progress tracking
- Scan history management
- Quick, Full, and Custom scan modes
- Integration with all analyzer services

**Key Methods:**
```typescript
performDeepScan(config, onProgress) // Main scan method
cancelScan()                         // Cancel ongoing scan
pauseScan()                          // Pause scan
resumeScan()                         // Resume paused scan
getScanHistory()                     // Get scan history
getDefaultConfig()                   // Get default configuration
```

### 2. DeepScanPermissionAnalyzer.ts ⭐ CRITICAL

**Comprehensive permission analyzer** that detects malicious permission patterns.

**Key Features:**
- Analyzes permissions from apps, APKs, and files
- Detects 12+ malicious permission patterns (spyware, trojans, ransomware, etc.)
- Calculates risk scores (0-100)
- Identifies risky permission combinations
- Provides actionable recommendations

**Permission Categories:**
- **CRITICAL** (50 points each): BIND_ACCESSIBILITY_SERVICE, BIND_DEVICE_ADMIN, SYSTEM_ALERT_WINDOW, etc.
- **HIGH RISK** (30 points each): READ_SMS, SEND_SMS, READ_CALL_LOG, CAMERA, RECORD_AUDIO, etc.
- **MEDIUM RISK** (15 points each): READ_EXTERNAL_STORAGE, INTERNET, WAKE_LOCK, etc.

**Malicious Patterns Detected:**
- SMS Spyware
- Banking Trojan
- Location Tracker
- Keylogger
- Ransomware
- Adware
- Crypto Miner
- And more...

**Key Methods:**
```typescript
analyzePermissions(permissions)              // Analyze permission array
detectMaliciousPatterns(permissions)         // Detect malicious patterns
checkMaliciousPermissions(permissions)       // Check if malicious
analyzePermissionCombinations(permissions)   // Analyze combinations
getPermissionRiskScore(permission)           // Get individual permission risk
```

### 3. DeepScanApkAnalyzer.ts ⭐ NEW

**APK file analyzer** that extracts and analyzes APK permissions and metadata.

**Key Features:**
- Extracts permissions from APK files
- Analyzes APK metadata (package name, version, SDK versions)
- Detects suspicious APK characteristics
- Calculates APK risk scores
- Scans APK files in all folders

**Suspicious Indicators:**
- Suspicious package name patterns (`.test.`, `.crack.`, `.mod.`, etc.)
- Outdated SDK versions (security risk)
- Excessive broadcast receivers/services
- Suspicious version names

**Key Methods:**
```typescript
analyzeApk(apkPath)                  // Comprehensive APK analysis
extractPermissions(apkPath)          // Extract permissions
extractManifest(apkPath)             // Extract AndroidManifest.xml
scanApkFiles(folderPath)             // Scan folder for APKs
scanAllApkFiles()                    // Scan all common APK locations
assessApkRisk(apkPath)               // Assess APK risk
detectMaliciousApk(apkPath)          // Check if APK is malicious
```

### 4. DeepScanSocialMediaAnalyzer.ts ⭐ NEW

**Social media file analyzer** that scans files from WhatsApp, Telegram, Instagram, Facebook, and Twitter.

**Key Features:**
- Scans social media folders for risky files
- Detects APK files downloaded via social media
- Identifies suspicious filenames and patterns
- Analyzes file types and sizes
- Provides risk assessments

**Folders Scanned:**
- WhatsApp: Images, Videos, Audio, Documents, GIFs
- Telegram: Images, Videos, Audio, Documents
- Instagram: Media folders
- Facebook: Media folders
- Twitter: Media folders

**Risky File Types:**
- `.apk`, `.exe`, `.bat`, `.cmd`, `.scr`, `.vbs`, `.js`, `.jar`, `.dex`, `.so`
- Compressed files: `.zip`, `.rar`, `.7z`, `.tar`, `.gz`

**Key Methods:**
```typescript
analyzeSocialMediaFile(filePath, source)  // Analyze single file
scanSocialMediaFolder(source, folderPath) // Scan folder
scanSocialMediaSource(source)             // Scan all folders for source
scanAllSocialMedia()                      // Scan all social media
getRiskyWhatsAppFiles()                   // Get risky WhatsApp files
getRiskyTelegramFiles()                   // Get risky Telegram files
getAllSocialMediaApks()                   // Get all APKs from social media
```

### 5. DeepScanFolderScanner.ts ⭐ NEW

**Comprehensive folder scanner** that scans all device folders.

**Key Features:**
- Scans 20+ predefined folders
- Recursive directory scanning
- Coordinates with permission analyzer and APK analyzer
- Real-time progress callbacks
- Identifies critical threats

**Folders Scanned:**
- Downloads
- Documents
- DCIM (Camera)
- WhatsApp folders
- Telegram folders
- Instagram folders
- Facebook folders
- Twitter folders
- APK folders
- Android Data

**Key Methods:**
```typescript
scanFolder(folderPath, config, onProgress)  // Scan single folder
scanAllFolders(config, onProgress)          // Scan all predefined folders
cancelScan()                                // Cancel ongoing scan
getDefaultConfig()                          // Get default config
```

## 📊 Type Definitions

### deepScan.types.ts

Comprehensive TypeScript type definitions including:

**Enums:**
- `ScanStage`, `ThreatType`, `ThreatSeverity`, `RiskLevel`, `ScanType`, `ScanPriority`
- `ThreatActionType`, `SocialMediaSource`, `PermissionCategory`, `MaliciousPatternType`

**Core Interfaces:**
- `DeepScanProgress`, `DeepScanThreat`, `DeepScanConfig`, `DeepScanResult`
- `ScannedFile`, `ScannedApp`, `RiskyApp`, `DeviceInfo`, `ScanStatistics`

**Permission Interfaces:**
- `RiskyPermission`, `PermissionRiskAssessment`, `MaliciousPattern`
- `MaliciousPermissionResult`, `CombinationRisk`

**APK Interfaces:**
- `ApkAnalysis`, `ApkMetadata`, `ApkManifest`, `ApkFile`, `ApkRiskAssessment`

**Social Media Interfaces:**
- `SocialMediaFileInfo`, `SocialMediaFileAnalysis`

**Folder Scan Interfaces:**
- `FolderScanConfig`, `RiskyFile`, `SuspiciousFile`, `FolderScanResult`
- `AllFoldersScanResult`, `CriticalThreat`

## 🗄️ State Management

### deepScanStore.ts

Zustand store for reactive state management.

**State:**
- `isScanning`: Whether a scan is in progress
- `isPaused`: Whether scan is paused
- `currentProgress`: Current scan progress
- `currentResult`: Latest scan result
- `scanHistory`: Array of past scan results (max 10)
- `config`: Current scan configuration

**Actions:**
- `startScan(config)`: Start new scan
- `updateProgress(progress)`: Update scan progress
- `completeScan(result)`: Complete scan with results
- `cancelScan()`: Cancel ongoing scan
- `pauseScan()`: Pause scan
- `resumeScan()`: Resume scan
- `setConfig(config)`: Update configuration
- `addToHistory(result)`: Add result to history
- `clearHistory()`: Clear scan history

**Selectors:**
- `selectIsScanning`, `selectCurrentProgress`, `selectCurrentResult`
- `selectScanHistory`, `selectConfig`, `selectLastScan`
- `selectTotalThreats`, `selectScanStatistics`, `selectThreatSeverityCounts`

**Custom Hooks:**
- `useScanStatus()`: Get scan status
- `useScanResults()`: Get scan results
- `useScanActions()`: Get scan actions
- `useScanConfig()`: Get configuration
- `useScanStatistics()`: Get statistics

## 🚀 Usage Examples

### Basic Scan

```typescript
import EnhancedDeepScanService from './services/EnhancedDeepScanService';

const service = EnhancedDeepScanService.getInstance();

// Perform full scan
const result = await service.performDeepScan(
  service.getFullScanConfig(),
  (progress) => {
    console.log(`Progress: ${progress.percentage}%`);
    console.log(`Message: ${progress.message}`);
    console.log(`Threats found: ${progress.threatsFound}`);
  }
);

console.log(`Scan complete! Found ${result.threatsDetected.length} threats`);
```

### Quick Scan

```typescript
// Perform quick scan (faster, scans only critical areas)
const result = await service.performDeepScan(
  service.getQuickScanConfig(),
  (progress) => {
    console.log(`Scanning: ${progress.currentDirectory}`);
  }
);
```

### Custom Scan

```typescript
// Custom scan configuration
const customConfig = {
  ...service.getDefaultConfig(),
  scanDownloads: true,
  scanWhatsApp: true,
  scanTelegram: true,
  scanApkFiles: true,
  scanSocialMediaFolders: true,
  enablePermissionAnalysis: true,
  detectMaliciousPermissions: true
};

const result = await service.performDeepScan(customConfig);
```

### Permission Analysis

```typescript
import DeepScanPermissionAnalyzer from './services/DeepScanPermissionAnalyzer';

const analyzer = DeepScanPermissionAnalyzer.getInstance();

// Analyze app permissions
const permissions = [
  'android.permission.READ_SMS',
  'android.permission.SEND_SMS',
  'android.permission.INTERNET'
];

const assessment = await analyzer.analyzePermissions(permissions);

console.log(`Risk Score: ${assessment.riskScore}/100`);
console.log(`Risk Level: ${assessment.riskLevel}`);
console.log(`Malicious Patterns: ${assessment.maliciousPatterns.length}`);
console.log(`Recommendations:`, assessment.recommendations);
```

### APK Analysis

```typescript
import DeepScanApkAnalyzer from './services/DeepScanApkAnalyzer';

const apkAnalyzer = DeepScanApkAnalyzer.getInstance();

// Analyze APK file
const apkPath = '/storage/emulated/0/Download/suspicious_app.apk';
const analysis = await apkAnalyzer.analyzeApk(apkPath);

console.log(`Package: ${analysis.packageName}`);
console.log(`Permissions: ${analysis.permissions.length}`);
console.log(`Risk Score: ${analysis.riskAssessment.riskScore}`);
console.log(`Is Suspicious: ${analysis.isSuspicious}`);
```

### Social Media Scan

```typescript
import DeepScanSocialMediaAnalyzer from './services/DeepScanSocialMediaAnalyzer';

const socialAnalyzer = DeepScanSocialMediaAnalyzer.getInstance();

// Scan all social media
const result = await socialAnalyzer.scanAllSocialMedia();

console.log(`Total risky files: ${result.totalRiskyFiles}`);
console.log(`Critical threats: ${result.criticalThreats.length}`);

// Get risky WhatsApp files
const riskyWhatsApp = await socialAnalyzer.getRiskyWhatsAppFiles();
console.log(`Risky WhatsApp files: ${riskyWhatsApp.length}`);
```

### Folder Scan

```typescript
import DeepScanFolderScanner from './services/DeepScanFolderScanner';

const folderScanner = DeepScanFolderScanner.getInstance();

// Scan all folders
const result = await folderScanner.scanAllFolders(
  folderScanner.getDefaultConfig(),
  (progress) => {
    console.log(`Scanning: ${progress.currentFolder}`);
    console.log(`Files scanned: ${progress.filesScanned}/${progress.totalFiles}`);
  }
);

console.log(`Total risky files: ${result.totalRiskyFiles}`);
console.log(`Total APK files: ${result.totalApkFiles}`);
console.log(`Critical threats: ${result.criticalThreats.length}`);
```

### Using Zustand Store

```typescript
import { useDeepScanStore, useScanStatus, useScanActions } from './stores/deepScanStore';

function DeepScanComponent() {
  const { isScanning, progress } = useScanStatus();
  const { startScan, cancelScan } = useScanActions();
  const config = useDeepScanStore(state => state.config);

  const handleStartScan = () => {
    startScan(config);
  };

  const handleCancelScan = () => {
    cancelScan();
  };

  return (
    <View>
      {isScanning ? (
        <View>
          <Text>Scanning: {progress?.percentage}%</Text>
          <Text>{progress?.message}</Text>
          <Button title="Cancel" onPress={handleCancelScan} />
        </View>
      ) : (
        <Button title="Start Scan" onPress={handleStartScan} />
      )}
    </View>
  );
}
```

## 🔐 Security Features

### Malicious Pattern Detection

The system detects 12+ malicious permission patterns:

1. **SMS Spyware**: READ_SMS + SEND_SMS + RECEIVE_SMS
2. **Banking Trojan**: SYSTEM_ALERT_WINDOW + BIND_ACCESSIBILITY_SERVICE + READ_SMS
3. **Location Tracker**: ACCESS_FINE_LOCATION + ACCESS_COARSE_LOCATION + INTERNET
4. **Keylogger**: BIND_ACCESSIBILITY_SERVICE + INTERNET
5. **Ransomware**: WRITE_EXTERNAL_STORAGE + MANAGE_EXTERNAL_STORAGE + INTERNET
6. **Advanced Ransomware**: BIND_DEVICE_ADMIN + WRITE_EXTERNAL_STORAGE + SYSTEM_ALERT_WINDOW
7. **Adware**: SYSTEM_ALERT_WINDOW + INTERNET + RECEIVE_BOOT_COMPLETED
8. **Crypto Miner**: WAKE_LOCK + INTERNET + RECEIVE_BOOT_COMPLETED
9. **Call Fraud**: CALL_PHONE + READ_PHONE_STATE + INTERNET
10. **Contact Harvester**: READ_CONTACTS + INTERNET + READ_PHONE_STATE
11. **Surveillance Spyware**: CAMERA + RECORD_AUDIO + ACCESS_FINE_LOCATION + INTERNET
12. **Data Exfiltration**: READ_EXTERNAL_STORAGE + READ_SMS + READ_CONTACTS + INTERNET

### Risk Scoring

**Permission Risk Scores:**
- CRITICAL permissions: 50 points each
- HIGH RISK permissions: 30 points each
- MEDIUM RISK permissions: 15 points each
- LOW RISK permissions: 5 points each

**Pattern Bonuses:**
- CRITICAL patterns: +30 points
- HIGH patterns: +20 points
- MEDIUM patterns: +10 points
- LOW patterns: +5 points

**Risk Levels:**
- 80-100: CRITICAL
- 60-79: HIGH
- 30-59: MEDIUM
- 10-29: LOW
- 0-9: SAFE

## 📝 Integration Notes

### Existing Services

The Enhanced Deep Scan integrates with:

1. **YaraSecurityService**: Primary malware scanning engine
2. **AppPermissionAnalyzer**: App permission analysis (can be replaced by DeepScanPermissionAnalyzer)
3. **QuarantineService**: Quarantine detected threats
4. **ExpoNotificationService**: Notify when scan completes
5. **PermissionManager**: Handle storage permissions

### Native Android Integration

For production use, you'll need to integrate with:

1. **PackageManager**: Extract app permissions from installed apps
2. **aapt2**: Extract APK manifest and permissions
3. **FileSystem**: Access device storage

### Performance Optimization

- Batch processing for large scans
- Efficient file scanning with skip lists
- Minimal resource usage
- Background processing support
- Scan cancellation and pause/resume

## 🎯 Next Steps

### UI Components (To Be Implemented)

1. **DeepScanProgressCard.tsx**: Real-time progress display
2. **DeepScanThreatCard.tsx**: Individual threat display
3. **DeepScanStatisticsCard.tsx**: Scan statistics
4. **DeepScanConfigPanel.tsx**: Configuration panel
5. **DeepScanResultSummary.tsx**: Results summary
6. **DeepScanActionButtons.tsx**: Threat action buttons

### Enhanced Screen (To Be Implemented)

**EnhancedDeepScanScreen.tsx**: Main screen with:
- Pre-scan view with configuration
- Scanning view with real-time progress
- Results view with threat list
- Threat details view

### Testing

- Unit tests for all services
- Integration tests
- Performance tests
- Security tests

## 📚 Documentation

- All services are fully documented with JSDoc comments
- TypeScript types provide IntelliSense support
- Comprehensive error handling
- Detailed logging for debugging

## 🤝 Contributing

When contributing to this feature:

1. Follow existing code style and patterns
2. Add JSDoc comments for all public methods
3. Update type definitions as needed
4. Test thoroughly before committing
5. Update this README with any changes

## 📄 License

Part of the Shabari cybersecurity mobile application.

---

**Author**: Shabari Security Team  
**Version**: 2.0.0  
**Last Updated**: November 2025
