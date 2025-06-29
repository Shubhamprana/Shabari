# React Native YARA Engine - Installation & Integration Guide

## Overview

The React Native YARA Engine is a native Android module that provides malware detection capabilities using the YARA (Yet Another Recursive Acronym) engine. This module integrates seamlessly with React Native applications to provide real-time file and memory scanning.

## Prerequisites

- React Native 0.60.0 or higher
- Android API level 21 (Android 5.0) or higher
- NDK version 21 or higher
- YARA library compiled for Android (arm64-v8a, armeabi-v7a)

## Installation

### Step 1: Add the Module to Your Project

```bash
# Copy the module to your project
cp -r react-native-yara-engine /path/to/your/react-native-project/node_modules/

# Or install via npm (if published)
npm install react-native-yara-engine
```

### Step 2: Android Configuration

#### 2.1 Update `android/settings.gradle`

```gradle
include ':react-native-yara-engine'
project(':react-native-yara-engine').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-yara-engine/android')
```

#### 2.2 Update `android/app/build.gradle`

```gradle
dependencies {
    implementation project(':react-native-yara-engine')
    // ... other dependencies
}
```

#### 2.3 Update `MainApplication.java`

```java
import com.shabari.yara.YaraPackage;

public class MainApplication extends Application implements ReactApplication {
    // ...
    
    @Override
    protected List<ReactPackage> getPackages() {
        @SuppressWarnings("UnnecessaryLocalVariable")
        List<ReactPackage> packages = new PackageList(this).getPackages();
        packages.add(new YaraPackage());
        return packages;
    }
    
    // ...
}
```

### Step 3: YARA Library Setup

#### 3.1 Download YARA Libraries

You need to obtain precompiled YARA libraries for Android. Place them in:

```
android/src/main/cpp/yara/lib/arm64-v8a/libyara.so
android/src/main/cpp/yara/lib/armeabi-v7a/libyara.so
android/src/main/cpp/yara/include/yara.h
android/src/main/cpp/yara/include/yara/...
```

#### 3.2 Alternative: Build YARA from Source

```bash
# Clone YARA repository
git clone https://github.com/VirusTotal/yara.git
cd yara

# Configure for Android
export ANDROID_NDK_ROOT=/path/to/android-ndk
export TOOLCHAIN=$ANDROID_NDK_ROOT/toolchains/llvm/prebuilt/linux-x86_64
export TARGET=aarch64-linux-android
export API=21
export AR=$TOOLCHAIN/bin/llvm-ar
export CC=$TOOLCHAIN/bin/$TARGET$API-clang
export AS=$CC
export CXX=$TOOLCHAIN/bin/$TARGET$API-clang++
export LD=$TOOLCHAIN/bin/ld
export RANLIB=$TOOLCHAIN/bin/llvm-ranlib
export STRIP=$TOOLCHAIN/bin/llvm-strip

# Build
./bootstrap.sh
./configure --host=$TARGET --enable-static --disable-shared
make
```

## Usage

### Basic Integration

```typescript
import YaraEngine from 'react-native-yara-engine';

export class SecurityService {
    private static initialized = false;

    static async initialize(): Promise<void> {
        if (!this.initialized) {
            try {
                await YaraEngine.initializeEngine();
                this.initialized = true;
                console.log('YARA engine initialized successfully');
            } catch (error) {
                console.error('Failed to initialize YARA engine:', error);
                throw error;
            }
        }
    }

    static async scanFile(filePath: string): Promise<YaraScanResult> {
        await this.initialize();
        
        try {
            const result = await YaraEngine.scanFile(filePath);
            console.log('Scan result:', result);
            return result;
        } catch (error) {
            console.error('File scan failed:', error);
            throw error;
        }
    }

    static async scanMemory(data: number[]): Promise<YaraScanResult> {
        await this.initialize();
        
        try {
            const result = await YaraEngine.scanMemory(data);
            console.log('Memory scan result:', result);
            return result;
        } catch (error) {
            console.error('Memory scan failed:', error);
            throw error;
        }
    }

    static async updateRules(rulesContent: string): Promise<void> {
        await this.initialize();
        
        try {
            await YaraEngine.updateRules(rulesContent);
            console.log('Rules updated successfully');
        } catch (error) {
            console.error('Failed to update rules:', error);
            throw error;
        }
    }

    static async getEngineInfo(): Promise<{version: string, rulesCount: number}> {
        await this.initialize();
        
        try {
            const [version, rulesCount] = await Promise.all([
                YaraEngine.getEngineVersion(),
                YaraEngine.getLoadedRulesCount()
            ]);
            
            return { version, rulesCount };
        } catch (error) {
            console.error('Failed to get engine info:', error);
            throw error;
        }
    }
}
```

### Integration with Existing Shabari App

#### 1. Update TypeScript Services

```typescript
// services/SecurityScanService.ts
import { SecurityService } from './YaraSecurityService';
import { DatabaseService } from './DatabaseService';

export class SecurityScanService {
    static async scanDownloadedFile(filePath: string): Promise<void> {
        try {
            const result = await SecurityService.scanFile(filePath);
            
            // Store result in database
            await DatabaseService.storeScanResult({
                filePath,
                scanTime: new Date(),
                isSafe: result.isSafe,
                threatName: result.threatName,
                severity: result.severity,
                details: result.details
            });

            // Alert user if threat detected
            if (!result.isSafe) {
                Alert.alert(
                    'Security Threat Detected',
                    `File: ${filePath}\nThreat: ${result.threatName}\nSeverity: ${result.severity}`,
                    [
                        { text: 'Delete File', onPress: () => this.deleteFile(filePath) },
                        { text: 'Quarantine', onPress: () => this.quarantineFile(filePath) },
                        { text: 'Ignore', style: 'cancel' }
                    ]
                );
            }
        } catch (error) {
            console.error('Security scan failed:', error);
        }
    }
}
```

#### 2. Update Feature Management

```typescript
// screens/FeatureManagementScreen.tsx
import { SecurityService } from '../services/YaraSecurityService';

export const FeatureManagementScreen = () => {
    const [yaraEnabled, setYaraEnabled] = useState(false);
    const [engineInfo, setEngineInfo] = useState({ version: '', rulesCount: 0 });

    useEffect(() => {
        loadYaraStatus();
    }, []);

    const loadYaraStatus = async () => {
        try {
            const info = await SecurityService.getEngineInfo();
            setEngineInfo(info);
            setYaraEnabled(true);
        } catch (error) {
            console.log('YARA engine not available');
            setYaraEnabled(false);
        }
    };

    const toggleYaraEngine = async (enabled: boolean) => {
        if (enabled) {
            try {
                await SecurityService.initialize();
                setYaraEnabled(true);
            } catch (error) {
                Alert.alert('Error', 'Failed to enable YARA engine');
            }
        } else {
            setYaraEnabled(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Security Features</Text>
            
            <View style={styles.featureRow}>
                <Text style={styles.featureLabel}>YARA Malware Detection</Text>
                <Switch
                    value={yaraEnabled}
                    onValueChange={toggleYaraEngine}
                />
            </View>
            
            {yaraEnabled && (
                <View style={styles.engineInfo}>
                    <Text>Engine Version: {engineInfo.version}</Text>
                    <Text>Loaded Rules: {engineInfo.rulesCount}</Text>
                </View>
            )}
        </View>
    );
};
```

#### 3. Database Schema Extension

```sql
-- Add to your existing SQLite schema
CREATE TABLE IF NOT EXISTS yara_scan_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT NOT NULL,
    scan_time DATETIME NOT NULL,
    is_safe BOOLEAN NOT NULL,
    threat_name TEXT,
    threat_category TEXT,
    severity TEXT,
    matched_rules TEXT, -- JSON array
    scan_duration INTEGER,
    file_size INTEGER,
    details TEXT
);

CREATE INDEX idx_yara_scan_time ON yara_scan_results(scan_time);
CREATE INDEX idx_yara_file_path ON yara_scan_results(file_path);
```

## API Reference

### Methods

#### `initializeEngine(): Promise<string>`
Initializes the YARA engine with default rules.

#### `loadRules(rulesPath: string): Promise<string>`
Loads YARA rules from a file path.

#### `scanFile(filePath: string): Promise<YaraScanResult>`
Scans a file for malware.

#### `scanMemory(data: number[]): Promise<YaraScanResult>`
Scans memory data for malware.

#### `updateRules(rulesContent: string): Promise<string>`
Updates YARA rules with new content.

#### `getEngineVersion(): Promise<string>`
Returns the YARA engine version.

#### `getLoadedRulesCount(): Promise<number>`
Returns the number of loaded rules.

### Types

```typescript
interface YaraScanResult {
    isSafe: boolean;
    threatName: string;
    threatCategory: string;
    severity: string;
    matchedRules: string[];
    scanTime: number;
    fileSize: number;
    scanEngine: string;
    details: string;
}
```

## Performance Considerations

- **File Size**: Large files (>100MB) may take longer to scan
- **Memory Usage**: Keep memory usage under 5MB during scanning
- **Thread Safety**: All methods are thread-safe and can be called concurrently
- **Battery Impact**: Frequent scanning may impact battery life

## Troubleshooting

### Common Issues

1. **Native library not found**
   - Ensure YARA libraries are properly placed in the correct architecture folders
   - Check that the NDK version is compatible

2. **Rules compilation failed**
   - Verify YARA rule syntax
   - Check for unsupported YARA features on Android

3. **Scan performance issues**
   - Optimize YARA rules for mobile devices
   - Consider scanning files in background threads

### Debug Logging

Enable debug logging in your app:

```typescript
// Enable debug logging
console.log('YARA Debug logging enabled');
```

Check Android logs:
```bash
adb logcat | grep YaraEngine
```

## Security Considerations

- Keep YARA rules updated regularly
- Validate file paths before scanning
- Handle scan results securely
- Consider user privacy when scanning files

## License

This module is licensed under the MIT License. YARA library is licensed under the BSD 3-Clause License.

