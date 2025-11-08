# 🐕 Watchdog Feature - Manus AI Prompt

## Project Context
**App Name**: Shabari (शबरी) - Cybersecurity Mobile App  
**Platform**: React Native (Expo) - Android  
**Language**: TypeScript  
**Architecture**: Service-based with Native Modules  

---

## Feature Overview: Watchdog (Background File Monitoring)

### Purpose
Create a comprehensive **background file monitoring system** that automatically detects new files on the device, scans them for threats in real-time, and protects users from malware without manual intervention.

### Key Requirements
1. **Background Monitoring**: Continuously monitor device directories for new files
2. **Real-time Scanning**: Automatically scan newly detected files
3. **Threat Detection**: Use YARA engine and heuristic analysis
4. **Notifications**: Alert users immediately when threats are detected
5. **Quarantine Integration**: Auto-quarantine malicious files
6. **Premium Feature**: Only available for premium users
7. **Android Compliance**: Must comply with Play Store scoped storage policies

---

## 📁 Complete File Structure

```
src/
├── services/
│   ├── WatchdogService.ts                    # Main watchdog orchestration service
│   ├── WatchdogFileMonitor.ts                # File monitoring logic (React Native)
│   ├── WatchdogScanEngine.ts                 # File scanning engine integration
│   ├── WatchdogNotificationService.ts        # Notification handling
│   └── WatchdogConfig.ts                     # Configuration and settings
│
├── native/
│   └── android/
│       ├── WatchdogModule.kt                  # Native module bridge
│       ├── WatchdogFileObserver.kt            # Native file observer
│       ├── WatchdogForegroundService.kt      # Foreground service for background monitoring
│       └── WatchdogServiceManager.kt          # Service lifecycle management
│
├── components/
│   ├── WatchdogStatusCard.tsx                # UI component showing watchdog status
│   ├── WatchdogSettingsPanel.tsx             # Settings panel for watchdog
│   └── WatchdogThreatAlert.tsx               # Threat notification component
│
├── screens/
│   └── WatchdogSettingsScreen.tsx            # Full settings screen for watchdog
│
├── stores/
│   └── watchdogStore.ts                      # Zustand store for watchdog state
│
├── types/
│   └── watchdog.types.ts                     # TypeScript type definitions
│
└── utils/
    └── watchdogPermissions.ts                # Permission handling utilities
```

---

## 🔧 Technical Specifications

### 1. Core Service: `WatchdogService.ts`

**Location**: `src/services/WatchdogService.ts`

**Responsibilities**:
- Main orchestration of watchdog functionality
- Manage watchdog lifecycle (start/stop/pause/resume)
- Coordinate between file monitor, scanner, and notification services
- Handle premium subscription checks
- Manage scan queue and priorities
- Provide status updates and callbacks

**Key Methods**:
```typescript
class WatchdogService {
  // Lifecycle
  async start(): Promise<void>
  async stop(): Promise<void>
  async pause(): Promise<void>
  async resume(): Promise<void>
  
  // Status
  getStatus(): WatchdogStatus
  isActive(): boolean
  
  // Configuration
  updateConfig(config: Partial<WatchdogConfig>): void
  getConfig(): WatchdogConfig
  
  // Events
  onFileDetected(callback: (file: DetectedFile) => void): void
  onThreatDetected(callback: (threat: ThreatInfo) => void): void
  onStatusChange(callback: (status: WatchdogStatus) => void): void
  
  // Statistics
  getStatistics(): WatchdogStatistics
}
```

**Interfaces**:
```typescript
interface WatchdogStatus {
  isActive: boolean;
  isPaused: boolean;
  isPremium: boolean;
  lastScanTime: Date | null;
  filesMonitored: number;
  threatsDetected: number;
  scanQueueLength: number;
  errorCount: number;
}

interface DetectedFile {
  id: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  detectedAt: Date;
  directory: string;
  fileType: string;
}

interface WatchdogStatistics {
  totalFilesDetected: number;
  totalFilesScanned: number;
  totalThreatsDetected: number;
  uptime: number; // milliseconds
  averageScanTime: number; // milliseconds
  lastThreatDetected: Date | null;
}
```

---

### 2. File Monitor: `WatchdogFileMonitor.ts`

**Location**: `src/services/WatchdogFileMonitor.ts`

**Responsibilities**:
- Monitor target directories for new files
- Use React Native FileSystem APIs
- Integrate with native file observer when available
- Handle permission requests
- Filter files by type, size, and patterns
- Maintain watch list of directories

**Key Methods**:
```typescript
class WatchdogFileMonitor {
  // Setup
  async initialize(): Promise<void>
  async addWatchDirectory(path: string): Promise<void>
  async removeWatchDirectory(path: string): Promise<void>
  getWatchedDirectories(): string[]
  
  // Monitoring
  async startMonitoring(): Promise<void>
  async stopMonitoring(): Promise<void>
  isMonitoring(): boolean
  
  // Events
  onNewFile(callback: (file: DetectedFile) => void): void
  
  // Permissions
  async requestPermissions(): Promise<boolean>
  hasPermissions(): boolean
}
```

**Configuration**:
```typescript
interface MonitorConfig {
  scanInterval: number; // milliseconds (default: 30000 = 30s)
  watchDirectories: string[];
  fileExtensions: string[]; // e.g., ['.apk', '.pdf', '.exe']
  maxFileSize: number; // bytes (default: 100MB)
  skipHiddenFiles: boolean;
  skipSystemFiles: boolean;
  enableRecursiveScan: boolean;
}
```

**Target Directories** (Android-compliant):
```typescript
const DEFAULT_WATCH_DIRECTORIES = [
  // User-accessible directories (scoped storage compliant)
  FileSystem.documentDirectory + '/Download',      // User downloads
  FileSystem.cacheDirectory + '/downloads',       // Cache downloads
  // Note: Cannot access /storage/emulated/0/ directly due to scoped storage
];
```

---

### 3. Scan Engine: `WatchdogScanEngine.ts`

**Location**: `src/services/WatchdogScanEngine.ts`

**Responsibilities**:
- Integrate with existing YaraSecurityService
- Perform quick threat analysis
- Queue files for scanning
- Handle scan priorities (critical files first)
- Provide scan results

**Key Methods**:
```typescript
class WatchdogScanEngine {
  // Scanning
  async scanFile(filePath: string): Promise<ScanResult>
  async scanFileAsync(filePath: string): Promise<string> // returns scan ID
  getScanResult(scanId: string): ScanResult | null
  
  // Queue Management
  getQueueLength(): number
  clearQueue(): void
  prioritizeFile(filePath: string): void
  
  // Integration
  setYaraService(yaraService: YaraSecurityService): void
  setQuarantineService(quarantineService: QuarantineService): void
}

interface ScanResult {
  scanId: string;
  filePath: string;
  isSafe: boolean;
  threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  threatType: string[];
  detectedRules: string[];
  scanTime: number; // milliseconds
  scanEngine: 'yara' | 'heuristic' | 'both';
  details: string;
}
```

---

### 4. Notification Service: `WatchdogNotificationService.ts`

**Location**: `src/services/WatchdogNotificationService.ts`

**Responsibilities**:
- Send notifications when threats are detected
- Handle notification permissions
- Create actionable notifications
- Manage notification queue

**Key Methods**:
```typescript
class WatchdogNotificationService {
  async notifyThreatDetected(threat: ThreatInfo): Promise<void>
  async notifyScanComplete(stats: ScanStatistics): Promise<void>
  async notifyError(error: string): Promise<void>
  
  // Permissions
  async requestNotificationPermission(): Promise<boolean>
  hasNotificationPermission(): boolean
  
  // Settings
  setNotificationEnabled(enabled: boolean): void
  setNotificationSound(enabled: boolean): void
  setNotificationVibration(enabled: boolean): void
}

interface ThreatInfo {
  filePath: string;
  fileName: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  threatType: string[];
  detectedAt: Date;
  actions: ThreatAction[];
}

interface ThreatAction {
  id: string;
  label: string;
  action: 'quarantine' | 'delete' | 'ignore' | 'view_details';
}
```

---

### 5. Configuration: `WatchdogConfig.ts`

**Location**: `src/services/WatchdogConfig.ts`

**Responsibilities**:
- Manage watchdog configuration
- Persist settings to AsyncStorage
- Provide default configurations
- Validate configuration values

**Key Methods**:
```typescript
class WatchdogConfig {
  // Load/Save
  async load(): Promise<WatchdogConfig>
  async save(config: WatchdogConfig): Promise<void>
  resetToDefaults(): WatchdogConfig
  
  // Getters
  getScanInterval(): number
  getMaxFileSize(): number
  getWatchedDirectories(): string[]
  isAutoQuarantineEnabled(): boolean
  isNotificationEnabled(): boolean
}

interface WatchdogConfig {
  enabled: boolean;
  scanInterval: number; // milliseconds
  maxFileSize: number; // bytes
  watchedDirectories: string[];
  fileExtensions: string[];
  autoQuarantine: boolean;
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
    priority: 'low' | 'normal' | 'high';
  };
  scanSettings: {
    useYaraEngine: boolean;
    useHeuristicScan: boolean;
    scanPriority: 'speed' | 'balanced' | 'thorough';
  };
}
```

---

### 6. Native Module: `WatchdogModule.kt`

**Location**: `android/app/src/main/java/com/shabari/app/WatchdogModule.kt`

**Responsibilities**:
- Bridge between React Native and Android native code
- Expose file monitoring capabilities
- Handle foreground service lifecycle
- Send events to JavaScript

**Key Methods**:
```kotlin
class WatchdogModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  
  @ReactMethod
  fun startFileMonitoring(watchedPaths: ReadableArray, promise: Promise)
  
  @ReactMethod
  fun stopFileMonitoring(promise: Promise)
  
  @ReactMethod
  fun isMonitoringActive(promise: Promise)
  
  @ReactMethod
  fun addWatchPath(path: String, promise: Promise)
  
  @ReactMethod
  fun removeWatchPath(path: String, promise: Promise)
  
  @ReactMethod
  fun getDetectedFiles(promise: Promise)
  
  // Events
  fun sendFileDetectedEvent(filePath: String, fileName: String, fileSize: Long)
}
```

---

### 7. File Observer: `WatchdogFileObserver.kt`

**Location**: `android/app/src/main/java/com/shabari/app/WatchdogFileObserver.kt`

**Responsibilities**:
- Monitor file system changes using Android FileObserver
- Detect file creation, modification, deletion
- Filter files based on configuration
- Notify native module of changes

**Key Implementation**:
```kotlin
class WatchdogFileObserver(
    path: String,
    private val onFileDetected: (String, String, Long) -> Unit
) : FileObserver(path, FileObserver.CREATE or FileObserver.MODIFY) {
    
    override fun onEvent(event: Int, path: String?) {
        when (event) {
            FileObserver.CREATE -> {
                // New file detected
                val file = File(path)
                if (file.exists() && file.isFile) {
                    onFileDetected(file.absolutePath, file.name, file.length())
                }
            }
            FileObserver.MODIFY -> {
                // File modified (might be new file being written)
            }
        }
    }
}
```

---

### 8. Foreground Service: `WatchdogForegroundService.kt`

**Location**: `android/app/src/main/java/com/shabari/app/WatchdogForegroundService.kt`

**Responsibilities**:
- Run file monitoring in background
- Show persistent notification
- Handle service lifecycle
- Maintain file observer instances

**Key Implementation**:
```kotlin
class WatchdogForegroundService : Service() {
    private var fileObservers: MutableList<WatchdogFileObserver> = mutableListOf()
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, createNotification())
        startFileMonitoring()
        return START_STICKY
    }
    
    private fun startFileMonitoring() {
        // Initialize file observers for watched directories
    }
    
    private fun createNotification(): Notification {
        // Create foreground service notification
    }
}
```

---

### 9. Zustand Store: `watchdogStore.ts`

**Location**: `src/stores/watchdogStore.ts`

**Responsibilities**:
- Manage global watchdog state
- Provide reactive state updates
- Persist critical state

**Interface**:
```typescript
interface WatchdogStore {
  // State
  isActive: boolean;
  isPaused: boolean;
  status: WatchdogStatus;
  statistics: WatchdogStatistics;
  config: WatchdogConfig;
  recentThreats: ThreatInfo[];
  
  // Actions
  setActive: (active: boolean) => void;
  setPaused: (paused: boolean) => void;
  updateStatus: (status: Partial<WatchdogStatus>) => void;
  updateStatistics: (stats: Partial<WatchdogStatistics>) => void;
  addThreat: (threat: ThreatInfo) => void;
  updateConfig: (config: Partial<WatchdogConfig>) => void;
  reset: () => void;
}
```

---

### 10. Type Definitions: `watchdog.types.ts`

**Location**: `src/types/watchdog.types.ts`

**Contents**: All TypeScript interfaces, types, and enums related to watchdog feature.

---

### 11. UI Components

#### `WatchdogStatusCard.tsx`
- Display current watchdog status
- Show active/inactive state
- Display statistics (files scanned, threats detected)
- Quick toggle button

#### `WatchdogSettingsPanel.tsx`
- Configuration options
- Directory selection
- Scan interval settings
- Notification preferences

#### `WatchdogThreatAlert.tsx`
- Display threat information
- Action buttons (quarantine, delete, ignore)
- Threat severity indicator

---

### 12. Settings Screen: `WatchdogSettingsScreen.tsx`

**Location**: `src/screens/WatchdogSettingsScreen.tsx`

**Features**:
- Full watchdog configuration UI
- Enable/disable watchdog
- Directory management
- Scan settings
- Notification settings
- Statistics display
- Recent threats list

---

## 🔗 Integration Points

### Existing Services to Integrate With:

1. **YaraSecurityService** (`src/services/YaraSecurityService.ts`)
   - Use for file scanning
   - Already exists in codebase

2. **QuarantineService** (`src/services/QuarantineService.ts`)
   - Auto-quarantine malicious files
   - Already exists in codebase

3. **ExpoNotificationService** (`src/services/ExpoNotificationService.ts`)
   - Send notifications
   - Already exists in codebase

4. **PermissionManager** (`src/services/PermissionManager.tsx`)
   - Handle permissions
   - Already exists in codebase

5. **subscriptionStore** (`src/stores/subscriptionStore.ts`)
   - Check premium status
   - Already exists in codebase

---

## 📱 Android Manifest Requirements

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- Foreground Service Permission -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />

<!-- File Access Permissions -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
    android:maxSdkVersion="32" />

<!-- Notification Permission (Android 13+) -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Service Declaration -->
<service
    android:name=".WatchdogForegroundService"
    android:enabled="true"
    android:exported="false"
    android:foregroundServiceType="dataSync" />
```

---

## 🎯 Implementation Checklist

### Phase 1: Core Services
- [ ] Create `WatchdogService.ts` with lifecycle management
- [ ] Create `WatchdogFileMonitor.ts` with directory monitoring
- [ ] Create `WatchdogScanEngine.ts` with scanning integration
- [ ] Create `WatchdogNotificationService.ts` with notifications
- [ ] Create `WatchdogConfig.ts` with configuration management

### Phase 2: Native Modules
- [ ] Create `WatchdogModule.kt` native bridge
- [ ] Create `WatchdogFileObserver.kt` for file monitoring
- [ ] Create `WatchdogForegroundService.kt` for background service
- [ ] Update AndroidManifest.xml with permissions and service

### Phase 3: State Management
- [ ] Create `watchdogStore.ts` Zustand store
- [ ] Create `watchdog.types.ts` type definitions
- [ ] Integrate with existing stores

### Phase 4: UI Components
- [ ] Create `WatchdogStatusCard.tsx`
- [ ] Create `WatchdogSettingsPanel.tsx`
- [ ] Create `WatchdogThreatAlert.tsx`
- [ ] Create `WatchdogSettingsScreen.tsx`

### Phase 5: Integration
- [ ] Integrate with YaraSecurityService
- [ ] Integrate with QuarantineService
- [ ] Integrate with ExpoNotificationService
- [ ] Integrate with PermissionManager
- [ ] Integrate with subscriptionStore
- [ ] Add to App.tsx initialization
- [ ] Add to DashboardScreen navigation

### Phase 6: Testing & Polish
- [ ] Test file detection
- [ ] Test scanning integration
- [ ] Test notifications
- [ ] Test premium checks
- [ ] Test error handling
- [ ] Test permissions flow
- [ ] Optimize performance

---

## 📝 Code Style Guidelines

1. **TypeScript**: Use strict TypeScript with proper types
2. **Error Handling**: Use try-catch with proper error logging
3. **Logging**: Use console.log with emoji prefixes (🐕 for watchdog)
4. **Sentry**: Add Sentry breadcrumbs for important events
5. **Async/Await**: Prefer async/await over Promises
6. **Comments**: Add JSDoc comments for public methods
7. **Naming**: Use clear, descriptive names
8. **React Native**: Follow React Native best practices

---

## 🔒 Security & Privacy Considerations

1. **Scoped Storage**: Only access user-accessible directories
2. **Permissions**: Request permissions explicitly and explain why
3. **Data Privacy**: Don't log sensitive file contents
4. **Battery Optimization**: Minimize background processing
5. **Rate Limiting**: Limit scan frequency to prevent battery drain
6. **Error Handling**: Don't expose sensitive information in errors

---

## 🚀 Expected Behavior

### When Watchdog is Active:
1. Monitor configured directories every 30 seconds (configurable)
2. Detect new files immediately (via native FileObserver)
3. Queue files for scanning
4. Scan files using YARA engine and heuristic analysis
5. If threat detected:
   - Send high-priority notification
   - Auto-quarantine (if enabled)
   - Update statistics
   - Log to Sentry
6. Update UI with real-time status

### When Watchdog is Inactive:
- No file monitoring
- No background processing
- Service stopped
- No battery drain

---

## 📊 Performance Requirements

- **Scan Speed**: Scan files within 5-10 seconds of detection
- **Battery Usage**: Minimal impact (< 2% battery per hour)
- **Memory Usage**: < 50MB additional memory
- **CPU Usage**: < 5% CPU when idle, < 20% when scanning
- **Disk Usage**: Minimal (only scan queue storage)

---

## 🎨 UI/UX Requirements

1. **Status Indicator**: Clear visual indicator of watchdog status
2. **Statistics**: Show files scanned, threats detected, uptime
3. **Settings**: Easy-to-use configuration panel
4. **Notifications**: Clear, actionable threat notifications
5. **Feedback**: Loading states, progress indicators
6. **Error Messages**: User-friendly error messages

---

## ✅ Success Criteria

1. ✅ Watchdog can detect new files in monitored directories
2. ✅ Files are automatically scanned for threats
3. ✅ Threats trigger immediate notifications
4. ✅ Malicious files can be auto-quarantined
5. ✅ Premium subscription check works correctly
6. ✅ Works in background without user interaction
7. ✅ Complies with Android scoped storage policies
8. ✅ Minimal battery and performance impact
9. ✅ Proper error handling and recovery
10. ✅ Clean, maintainable code structure

---

## 📦 Deliverables

When generating code with Manus AI, provide:

1. **All TypeScript/React Native files** listed in file structure
2. **All Kotlin native files** for Android
3. **Updated AndroidManifest.xml** entries
4. **Integration code** for App.tsx and DashboardScreen.tsx
5. **Type definitions** in watchdog.types.ts
6. **Documentation** as code comments
7. **Example usage** in comments

---

## 🎯 Final Notes

- **Follow existing codebase patterns** - Match the style of existing services
- **Use existing dependencies** - Don't add new packages unless necessary
- **Test thoroughly** - Ensure all edge cases are handled
- **Document everything** - Code comments and JSDoc
- **Keep it simple** - Focus on core functionality first
- **Make it maintainable** - Clean, readable, well-structured code

---

**Ready to generate code!** This prompt provides complete structure and specifications for implementing the Watchdog feature. Use this with Manus AI to generate all necessary files in a zip archive.

