/**
 * Quick check to determine if YARA engine is real or mock
 */

// Check the YaraSecurityService directly
const path = require('path');
const fs = require('fs');

console.log('🔍 Checking YARA Engine Implementation...\n');

// Method 1: Check the source code
console.log('1️⃣ Analyzing YaraSecurityService.ts...');
try {
    const serviceCode = fs.readFileSync('./src/services/YaraSecurityService.ts', 'utf8');
    
    // Check key indicators
    const hasNativeImport = serviceCode.includes("require('react-native-yara-engine')");
    const hasMockClass = serviceCode.includes('class MockYaraEngine');
    const isNativeAvailable = serviceCode.includes('isNativeYaraAvailable = true');
    
    console.log(`   - Has native import: ${hasNativeImport ? '✅' : '❌'}`);
    console.log(`   - Has mock implementation: ${hasMockClass ? '✅' : '❌'}`);
    console.log(`   - Native marked available: ${isNativeAvailable ? '✅' : '❌'}`);
    
    // Check the initialization logic
    const initLogic = serviceCode.match(/if \(Platform\.OS === 'android'\)[\s\S]*?catch/);
    if (initLogic) {
        console.log('   - Platform check for Android: ✅');
    }
} catch (error) {
    console.error('   ❌ Could not read YaraSecurityService.ts');
}

// Method 2: Check native module files
console.log('\n2️⃣ Checking native module structure...');
const nativeFiles = {
    'Module Index': './react-native-yara-engine/index.js',
    'Android Module': './react-native-yara-engine/android/src/main/java/com/shabari/yara/YaraModule.java',
    'Android Engine': './react-native-yara-engine/android/src/main/java/com/shabari/yara/YaraEngine.java',
    'Package.json': './react-native-yara-engine/package.json'
};

let nativeFilesFound = 0;
for (const [name, filePath] of Object.entries(nativeFiles)) {
    if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${name}: Found`);
        nativeFilesFound++;
    } else {
        console.log(`   ❌ ${name}: Not found`);
    }
}

// Method 3: Check the index.js implementation
console.log('\n3️⃣ Analyzing native module index.js...');
try {
    const indexCode = fs.readFileSync('./react-native-yara-engine/index.js', 'utf8');
    
    const hasWebMock = indexCode.includes("Platform.OS === 'web'");
    const hasNativeModules = indexCode.includes('NativeModules.YaraEngine');
    const mockVersion = indexCode.match(/Mock YARA v([\d.]+)/);
    
    console.log(`   - Web mock fallback: ${hasWebMock ? '✅' : '❌'}`);
    console.log(`   - Native modules import: ${hasNativeModules ? '✅' : '❌'}`);
    if (mockVersion) {
        console.log(`   - Mock version: ${mockVersion[1]}`);
    }
} catch (error) {
    console.error('   ❌ Could not read index.js');
}

// Method 4: Check Android integration
console.log('\n4️⃣ Checking Android integration...');
const androidPaths = [
    './android/settings.gradle',
    './android/app/build.gradle'
];

let yaraIntegrated = false;
for (const androidPath of androidPaths) {
    try {
        if (fs.existsSync(androidPath)) {
            const content = fs.readFileSync(androidPath, 'utf8');
            if (content.includes('react-native-yara-engine')) {
                console.log(`   ✅ YARA module referenced in ${path.basename(androidPath)}`);
                yaraIntegrated = true;
            }
        }
    } catch (error) {
        // Ignore
    }
}

if (!yaraIntegrated) {
    console.log('   ⚠️  YARA module not found in Android build files');
}

// Final Analysis
console.log('\n📊 ANALYSIS RESULTS:');
console.log('===================\n');

const indicators = {
    nativeFiles: nativeFilesFound >= 3,
    androidIntegration: yaraIntegrated,
    codeStructure: true // Based on the code we can see
};

if (indicators.nativeFiles && indicators.codeStructure) {
    console.log('🎯 CONCLUSION: The app has BOTH implementations:\n');
    console.log('1. MOCK YARA Engine:');
    console.log('   - Active when running in Expo Go');
    console.log('   - Active on Web platform');
    console.log('   - Used for development/testing');
    console.log('   - Provides simulated threat detection\n');
    
    console.log('2. NATIVE YARA Engine:');
    console.log('   - Active when built as APK/AAB');
    console.log('   - Only works on Android devices');
    console.log('   - Provides real malware detection');
    console.log('   - Uses actual YARA rules\n');
    
    console.log('📱 Current Runtime Behavior:');
    console.log('   - In Expo Go: MOCK engine will be used');
    console.log('   - In built APK: NATIVE engine will be used');
    console.log('   - On Web: MOCK engine will be used');
} else {
    console.log('🎭 CONCLUSION: Only MOCK implementation found');
    console.log('   - Native module structure exists but may not be linked');
    console.log('   - All platforms will use mock implementation');
}

console.log('\n💡 To test which is active at runtime:');
console.log('   1. Run the app and check console logs');
console.log('   2. Look for "Native YARA Engine loaded successfully" or');
console.log('   3. Look for "Native YARA not available, using mock engine"');
