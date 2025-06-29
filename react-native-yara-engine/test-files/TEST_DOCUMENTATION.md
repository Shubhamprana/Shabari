# YARA Engine Test Documentation

## Test Files Created

### 1. Clean Test File
- **File**: `clean_test.txt`
- **Purpose**: Test file that should pass all scans without triggering any YARA rules
- **Expected Result**: `isSafe: true`, no threats detected

### 2. Malicious APK Test File
- **File**: `malicious_apk_test.txt`
- **Purpose**: Contains strings that should trigger the `Android_Banking_Trojan` and `Android_Malware_APK` rules
- **Contains**: DEX header, banking-related strings, SMS permissions
- **Expected Result**: `isSafe: false`, multiple rule matches

### 3. Fake WhatsApp Test File
- **File**: `fake_whatsapp_test.txt`
- **Purpose**: Contains strings that should trigger the `Fake_WhatsApp_APK` rule
- **Contains**: WhatsApp package name and fake app identifiers
- **Expected Result**: `isSafe: false`, `Fake_WhatsApp_APK` rule match

### 4. Malicious PDF Test File
- **File**: `malicious_pdf_test.pdf`
- **Purpose**: PDF file with JavaScript, embedded files, and launch actions
- **Contains**: PDF header, JavaScript, EmbeddedFile, Launch action
- **Expected Result**: `isSafe: false`, `Malicious_PDF_Exploit` rule match

### 5. Large File Performance Test
- **File**: `large_file_test.bin`
- **Purpose**: 10MB file for performance testing
- **Size**: 10,485,760 bytes (10 MB)
- **Expected Result**: Scan should complete within performance requirements (<100ms per file)

## Performance Requirements

- **Scan Speed**: 10-100ms per file
- **Memory Usage**: <5MB RAM
- **Thread Safety**: All methods must be thread-safe
- **Error Handling**: Comprehensive error handling with detailed messages

## Test Execution

To run tests with the YARA engine:

```javascript
import YaraEngine from 'react-native-yara-engine';

// Initialize engine
await YaraEngine.initializeEngine();

// Test clean file
const cleanResult = await YaraEngine.scanFile('/path/to/clean_test.txt');
console.log('Clean file result:', cleanResult);

// Test malicious APK
const maliciousResult = await YaraEngine.scanFile('/path/to/malicious_apk_test.txt');
console.log('Malicious APK result:', maliciousResult);

// Test fake WhatsApp
const fakeWhatsAppResult = await YaraEngine.scanFile('/path/to/fake_whatsapp_test.txt');
console.log('Fake WhatsApp result:', fakeWhatsAppResult);

// Test malicious PDF
const pdfResult = await YaraEngine.scanFile('/path/to/malicious_pdf_test.pdf');
console.log('PDF result:', pdfResult);

// Test large file performance
const startTime = Date.now();
const largeFileResult = await YaraEngine.scanFile('/path/to/large_file_test.bin');
const endTime = Date.now();
console.log('Large file result:', largeFileResult);
console.log('Scan time:', endTime - startTime, 'ms');
```

## Expected Results Summary

| Test File | Expected isSafe | Expected Rules Matched | Expected Category |
|-----------|----------------|----------------------|-------------------|
| clean_test.txt | true | [] | - |
| malicious_apk_test.txt | false | ["Android_Banking_Trojan", "Android_Malware_APK"] | malware |
| fake_whatsapp_test.txt | false | ["Fake_WhatsApp_APK"] | impersonation |
| malicious_pdf_test.pdf | false | ["Malicious_PDF_Exploit"] | exploit |
| large_file_test.bin | true | [] | - |

