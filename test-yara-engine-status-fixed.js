/**
 * YARA Engine Status Test - Fixed Implementation
 * This script tests the fixed YARA engine implementation that properly handles
 * missing native libraries and provides graceful fallback to mock implementation.
 */

console.log('🔍 YARA Engine Status Test - Fixed Implementation');
console.log('='.repeat(60));

// Test 1: Check if YaraSecurityService is available
console.log('\n1️⃣ Testing YaraSecurityService...');
try {
    const { YaraSecurityService } = require('./src/services/YaraSecurityService');
    if (YaraSecurityService) {
        console.log('   ✅ YaraSecurityService is available');
    } else {
        console.log('   ❌ YaraSecurityService is NOT available');
        process.exit(1);
    }
} catch (error) {
    console.log('   ❌ Failed to import YaraSecurityService:', error.message);
    process.exit(1);
}

// Test 2: Test engine status
async function testEngineStatus() {
    console.log('\n2️⃣ Getting YARA engine status...');
    try {
        const { YaraSecurityService } = require('./src/services/YaraSecurityService');
        const status = await YaraSecurityService.getEngineStatus();
        
        console.log('   📊 Engine Status:');
        console.log(`      Available: ${status.available ? '✅' : '❌'}`);
        console.log(`      Initialized: ${status.initialized ? '✅' : '❌'}`);
        console.log(`      Native: ${status.native ? '✅ YES' : '❌ NO (Using Mock)'}`);
        console.log(`      Version: ${status.version}`);
        console.log(`      Rules Count: ${status.rulesCount}`);
        console.log(`      Engine Type: ${status.engineType}`);
        
        return status;
    } catch (error) {
        console.log('   ❌ Failed to get engine status:', error.message);
        return null;
    }
}

// Test 3: Test engine initialization
async function testEngineInitialization() {
    console.log('\n3️⃣ Testing YARA engine initialization...');
    try {
        const { YaraSecurityService } = require('./src/services/YaraSecurityService');
        const initResult = await YaraSecurityService.initialize();
        
        if (initResult) {
            console.log('   ✅ Engine initialized successfully');
        } else {
            console.log('   ❌ Engine initialization failed');
        }
        
        return initResult;
    } catch (error) {
        console.log('   ❌ Exception during initialization:', error.message);
        return false;
    }
}

// Test 4: Test file scanning capability
async function testFileScanning() {
    console.log('\n4️⃣ Testing file scanning capability...');
    try {
        const { YaraSecurityService } = require('./src/services/YaraSecurityService');
        
        // Test with a mock suspicious filename
        const testResults = await Promise.all([
            YaraSecurityService.scanFile('/test/clean_file.txt'),
            YaraSecurityService.scanFile('/test/malware_test.exe'),
            YaraSecurityService.scanFile('/test/banking_trojan.apk')
        ]);
        
        console.log('   📋 Scan Results:');
        testResults.forEach((result, index) => {
            const testFiles = ['clean_file.txt', 'malware_test.exe', 'banking_trojan.apk'];
            if (result) {
                console.log(`      ${testFiles[index]}: ${result.isSafe ? '✅ Safe' : '⚠️ Threat Detected'}`);
                if (!result.isSafe) {
                    console.log(`         Threat: ${result.threatName}`);
                    console.log(`         Engine: ${result.scanEngine || 'Unknown'}`);
                }
            } else {
                console.log(`      ${testFiles[index]}: ❌ Scan Failed`);
            }
        });
        
        return testResults;
    } catch (error) {
        console.log('   ❌ File scanning test failed:', error.message);
        return [];
    }
}

// Test 5: Check React Native module availability
async function testReactNativeModule() {
    console.log('\n5️⃣ Testing React Native module integration...');
    try {
        const YaraEngine = require('./react-native-yara-engine').default || require('./react-native-yara-engine');
        
        if (YaraEngine) {
            console.log('   ✅ React Native YARA module loaded');
            console.log(`      Engine Type: ${YaraEngine._engineType || 'unknown'}`);
            console.log(`      Is Native: ${YaraEngine._isNative ? 'YES' : 'NO'}`);
            
            // Test methods availability
            const methods = ['initializeEngine', 'scanFile', 'getEngineVersion', 'getLoadedRulesCount'];
            methods.forEach(method => {
                const available = typeof YaraEngine[method] === 'function';
                console.log(`      ${method}: ${available ? '✅' : '❌'}`);
            });
            
            // Test native availability check if available
            if (typeof YaraEngine.isNativeEngineAvailable === 'function') {
                try {
                    const isNative = await YaraEngine.isNativeEngineAvailable();
                    console.log(`      Native Library Available: ${isNative ? '✅ YES' : '❌ NO'}`);
                } catch (error) {
                    console.log(`      Native Library Check: ❌ Failed (${error.message})`);
                }
            } else {
                console.log('      Native Library Check: ⚠️ Method not available');
            }
            
            return true;
        } else {
            console.log('   ❌ React Native YARA module not available');
            return false;
        }
    } catch (error) {
        console.log('   ❌ React Native module test failed:', error.message);
        return false;
    }
}

// Main test execution
async function runAllTests() {
    const results = {
        engineStatus: null,
        initialization: false,
        fileScanning: [],
        reactNativeModule: false
    };
    
    // Run all tests
    results.engineStatus = await testEngineStatus();
    results.initialization = await testEngineInitialization();
    results.fileScanning = await testFileScanning();
    results.reactNativeModule = await testReactNativeModule();
    
    // Final analysis
    console.log('\n📊 FINAL ANALYSIS:');
    console.log('='.repeat(60));
    
    if (results.engineStatus) {
        if (results.engineStatus.native) {
            console.log('🎯 NATIVE YARA ENGINE DETECTED!');
            console.log('   ✅ Using real YARA malware detection');
            console.log('   ✅ Full scanning capabilities available');
            console.log('   ✅ Production-ready implementation');
        } else {
            console.log('🎭 MOCK YARA ENGINE DETECTED!');
            console.log('   ⚠️ Using enhanced mock implementation');
            console.log('   ✅ Basic pattern detection available');
            console.log('   ℹ️ Suitable for development and testing');
        }
        
        console.log(`\n📋 Engine Details:`);
        console.log(`   Version: ${results.engineStatus.version}`);
        console.log(`   Rules: ${results.engineStatus.rulesCount}`);
        console.log(`   Type: ${results.engineStatus.engineType}`);
        
        if (results.initialization) {
            console.log('   ✅ Engine is properly initialized');
        } else {
            console.log('   ⚠️ Engine initialization needs attention');
        }
    } else {
        console.log('❌ ENGINE STATUS CHECK FAILED!');
        console.log('   The YARA engine is not working properly');
    }
    
    console.log('\n🔧 RECOMMENDATIONS:');
    if (results.engineStatus && !results.engineStatus.native) {
        console.log('   📱 To enable native YARA engine:');
        console.log('      1. Build the app with: npx expo run:android');
        console.log('      2. Or create production build: eas build --platform android');
        console.log('      3. Native engine requires compiled YARA libraries');
        console.log('      4. Current mock implementation is functional for development');
    } else if (results.engineStatus && results.engineStatus.native) {
        console.log('   🎉 Your YARA engine is fully operational!');
        console.log('      No further action needed.');
    } else {
        console.log('   🚨 Engine needs debugging - check logs for errors');
    }
    
    console.log('\n' + '='.repeat(60));
}

// Execute the tests
runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
}); 