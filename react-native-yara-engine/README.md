# React Native YARA Engine

A powerful native Android module that integrates the YARA (Yet Another Recursive Acronym) malware detection engine with React Native applications. Designed specifically for the Shabari security app, this module provides real-time file and memory scanning capabilities with optimized performance for mobile devices.

## 🚀 Features

- **Native YARA Integration**: Full YARA v4.5.0 engine with JNI bridge
- **Real-time Scanning**: File and memory scanning with sub-100ms performance
- **Built-in Rules**: Pre-configured detection rules for Android malware, banking trojans, fake apps, and PDF exploits
- **Thread-Safe**: Concurrent scanning support with mutex protection
- **Memory Efficient**: <5MB RAM usage during operations
- **TypeScript Support**: Full TypeScript definitions included
- **Production Ready**: Comprehensive error handling and logging

## 📱 Supported Platforms

- **Android**: API level 21+ (Android 5.0+)
- **Architectures**: arm64-v8a, armeabi-v7a
- **React Native**: 0.60.0+

## 🛡️ Built-in Detection Rules

### Android Banking Trojan
Detects Android banking trojans by identifying:
- Billing service access
- Overlay services
- Accessibility service abuse
- SMS interception capabilities

### Fake WhatsApp Applications
Identifies fake WhatsApp variants:
- WhatsApp Plus
- GB WhatsApp
- Other WhatsApp impersonators

### PDF Exploits
Detects malicious PDF documents with:
- Embedded JavaScript
- Launch actions
- Embedded files
- Suspicious content

### Generic Android Malware
Catches common malware patterns:
- DEX file manipulation
- SMS sending capabilities
- Broadcast interception
- Suspicious permissions

## 🔧 Installation

### Quick Start

```bash
npm install react-native-yara-engine
```

### Manual Installation

1. Copy the module to your project:
```bash
cp -r react-native-yara-engine /path/to/your/project/node_modules/
```

2. Add to `android/settings.gradle`:
```gradle
include ':react-native-yara-engine'
project(':react-native-yara-engine').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-yara-engine/android')
```

3. Add to `android/app/build.gradle`:
```gradle
dependencies {
    implementation project(':react-native-yara-engine')
}
```

4. Update `MainApplication.java`:
```java
import com.shabari.yara.YaraPackage;

@Override
protected List<ReactPackage> getPackages() {
    List<ReactPackage> packages = new PackageList(this).getPackages();
    packages.add(new YaraPackage());
    return packages;
}
```

For detailed installation instructions, see [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md).

## 💻 Usage

### Basic Usage

```typescript
import YaraEngine from 'react-native-yara-engine';

// Initialize the engine
await YaraEngine.initializeEngine();

// Scan a file
const result = await YaraEngine.scanFile('/path/to/file.apk');

if (!result.isSafe) {
    console.log(`Threat detected: ${result.threatName}`);
    console.log(`Category: ${result.threatCategory}`);
    console.log(`Severity: ${result.severity}`);
    console.log(`Matched rules: ${result.matchedRules.join(', ')}`);
}
```

### Advanced Usage

```typescript
import YaraEngine, { YaraScanResult } from 'react-native-yara-engine';

class SecurityService {
    static async scanDownload(filePath: string): Promise<boolean> {
        try {
            // Initialize if not already done
            await YaraEngine.initializeEngine();
            
            // Get engine info
            const version = await YaraEngine.getEngineVersion();
            const rulesCount = await YaraEngine.getLoadedRulesCount();
            console.log(`YARA ${version} with ${rulesCount} rules loaded`);
            
            // Scan the file
            const result = await YaraEngine.scanFile(filePath);
            
            // Log scan details
            console.log(`Scanned ${result.fileSize} bytes in ${result.scanTime}ms`);
            
            return result.isSafe;
        } catch (error) {
            console.error('Scan failed:', error);
            return false; // Assume unsafe on error
        }
    }
    
    static async updateSecurityRules(newRules: string): Promise<void> {
        await YaraEngine.updateRules(newRules);
        console.log('Security rules updated');
    }
}
```

### Memory Scanning

```typescript
// Scan memory data (e.g., downloaded content before writing to disk)
const data = new Uint8Array(downloadedBuffer);
const dataArray = Array.from(data);

const result = await YaraEngine.scanMemory(dataArray);
if (!result.isSafe) {
    // Handle threat in memory
    console.log('Malicious content detected in memory');
}
```

## 📊 API Reference

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `initializeEngine()` | - | `Promise<string>` | Initialize YARA engine with default rules |
| `loadRules(rulesPath)` | `string` | `Promise<string>` | Load rules from file path |
| `scanFile(filePath)` | `string` | `Promise<YaraScanResult>` | Scan a file for malware |
| `scanMemory(data)` | `number[]` | `Promise<YaraScanResult>` | Scan memory data |
| `updateRules(content)` | `string` | `Promise<string>` | Update rules with new content |
| `getEngineVersion()` | - | `Promise<string>` | Get YARA engine version |
| `getLoadedRulesCount()` | - | `Promise<number>` | Get number of loaded rules |

### YaraScanResult Interface

```typescript
interface YaraScanResult {
    isSafe: boolean;           // True if no threats detected
    threatName: string;        // Name of detected threat
    threatCategory: string;    // Category (malware, exploit, etc.)
    severity: string;          // Severity level (low, medium, high, critical)
    matchedRules: string[];    // Array of matched rule names
    scanTime: number;          // Scan duration in milliseconds
    fileSize: number;          // Size of scanned data in bytes
    scanEngine: string;        // Engine version used
    details: string;           // Additional details about the scan
}
```

## 🚀 Performance

- **Scan Speed**: 10-100ms per file (depending on size)
- **Memory Usage**: <5MB RAM during operation
- **File Size Support**: Up to 100MB+ files
- **Concurrent Scans**: Thread-safe with mutex protection

See [PERFORMANCE_BENCHMARKS.md](PERFORMANCE_BENCHMARKS.md) for detailed performance analysis.

## 🧪 Testing

The module includes comprehensive test files:

```bash
# Test files included
test-files/
├── clean_test.txt              # Should pass (no threats)
├── malicious_apk_test.txt      # Should detect Android malware
├── fake_whatsapp_test.txt      # Should detect fake WhatsApp
├── malicious_pdf_test.pdf      # Should detect PDF exploit
├── large_file_test.bin         # Performance testing (10MB)
└── TEST_DOCUMENTATION.md       # Test documentation
```

Run tests:
```typescript
import YaraEngine from 'react-native-yara-engine';

// Test clean file
const cleanResult = await YaraEngine.scanFile('./test-files/clean_test.txt');
console.assert(cleanResult.isSafe === true);

// Test malicious file
const maliciousResult = await YaraEngine.scanFile('./test-files/malicious_apk_test.txt');
console.assert(maliciousResult.isSafe === false);
```

## 🔧 Integration with Shabari App

This module is designed to integrate seamlessly with the existing Shabari security app:

### Database Integration
```sql
CREATE TABLE yara_scan_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_path TEXT NOT NULL,
    scan_time DATETIME NOT NULL,
    is_safe BOOLEAN NOT NULL,
    threat_name TEXT,
    severity TEXT,
    details TEXT
);
```

### Feature Management
```typescript
// Add to FeatureManagementScreen
const [yaraEnabled, setYaraEnabled] = useState(false);

const toggleYaraEngine = async (enabled: boolean) => {
    if (enabled) {
        await YaraEngine.initializeEngine();
        setYaraEnabled(true);
    }
};
```

### Background Scanning
```typescript
// Integrate with file download monitoring
const onFileDownloaded = async (filePath: string) => {
    const result = await YaraEngine.scanFile(filePath);
    if (!result.isSafe) {
        // Alert user and take action
        Alert.alert('Security Threat', `Detected: ${result.threatName}`);
    }
};
```

## 🛠️ Development

### Building from Source

1. Clone the repository
2. Install dependencies: `npm install`
3. Build native components: `cd android && ./gradlew assembleRelease`
4. The compiled AAR will be in `android/build/outputs/aar/`

### Requirements

- Android NDK 21+
- YARA library compiled for Android
- CMake 3.18.1+
- Gradle 7.0+

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

YARA library is licensed under BSD 3-Clause License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check the [troubleshooting guide](INSTALLATION_GUIDE.md#troubleshooting)
- Review the [performance benchmarks](PERFORMANCE_BENCHMARKS.md)

## 🔄 Changelog

### v1.0.0
- Initial release
- YARA v4.5.0 integration
- Built-in detection rules
- Thread-safe implementation
- TypeScript support
- Comprehensive testing suite

---

**Built for Shabari Security App** 🛡️

This module provides enterprise-grade malware detection capabilities optimized for mobile devices, ensuring your users stay protected from emerging threats.

