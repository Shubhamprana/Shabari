/**
 * Test script to verify if YARA engine is using real native implementation or mock
 * This script will test various aspects of the YARA engine to determine its status
 */

const { Platform } = require('react-native');

// Import the services and modules
const { YaraSecurityService } = require('./src/services/YaraSecurityService');

console.log('🔍 YARA Engine Status Test');
console.log('=========================\n');

async function testYaraEngine() {
    try {
        console.log('1️⃣ Checking Platform...');
        console.log(`   Platform: ${Platform.OS}`);
        console.log(`   Version: ${Platform.Version || 'N/A'}`);
        
        // Test 1: Check if YaraSecurityService is available
        console.log('\n2️⃣ Testing YaraSecurityService availability...');
        if (YaraSecurityService) {
            console.log('   ✅ YaraSecurityService is available');
        } else {
            console.log('   ❌ YaraSecurityService is NOT available');
            return;
        }

        // Test 2: Get engine status
        console.log('\n3️⃣ Getting YARA engine status...');
        const status = await YaraSecurityService.getEngineStatus();
        console.log('   Engine Status:', JSON.stringify(status, null, 2));
        
        // Test 3: Check if native or mock
        console.log('\n4️⃣ Determining engine type...');
        if (status.native) {
            console.log('   🎯 NATIVE YARA ENGINE DETECTED!');
            console.log('   This is the real YARA implementation');
        } else {
            console.log('   🎭 MOCK YARA ENGINE DETECTED!');
            console.log('   This is a simulated implementation for testing');
        }

        // Test 4: Initialize the engine
        console.log('\n5️⃣ Initializing YARA engine...');
        const initResult = await YaraSecurityService.initialize();
        if (initResult) {
            console.log('   ✅ Engine initialized successfully');
        } else {
            console.log('   ❌ Engine initialization failed');
        }

        // Test 5: Check engine details after initialization
        console.log('\n6️⃣ Getting detailed engine info...');
        const detailedStatus = await YaraSecurityService.getEngineStatus();
        console.log(`   Version: ${detailedStatus.version}`);
        console.log(`   Rules Count: ${detailedStatus.rulesCount}`);
        console.log(`   Initialized: ${detailedStatus.initialized}`);

        // Test 6: Perform test scans
        console.log('\n7️⃣ Testing file scanning capabilities...');
        
        // Test with safe file name
        const safeResult = await YaraSecurityService.scanFile('/test/safe_file.txt');
        console.log('   Safe file scan:', {
            isSafe: safeResult.isSafe,
            engine: safeResult.scanEngine
        });

        // Test with suspicious file name (for mock detection)
        const suspiciousResult = await YaraSecurityService.scanFile('/test/malware_test.exe');
        console.log('   Suspicious file scan:', {
            isSafe: suspiciousResult.isSafe,
            threatName: suspiciousResult.threatName,
            engine: suspiciousResult.scanEngine
        });

        // Test 7: Check native module directly
        console.log('\n8️⃣ Checking native module directly...');
        try {
            const NativeYaraEngine = require('./react-native-yara-engine').default;
            if (NativeYaraEngine) {
                console.log('   Native module loaded');
                
                // Check if it's the web mock
                if (Platform.OS === 'web') {
                    console.log('   ⚠️  Web platform detected - using web mock');
                } else {
                    // Try to get version directly
                    const version = await NativeYaraEngine.getEngineVersion();
                    console.log(`   Direct version check: ${version}`);
                    
                    if (version.includes('mock')) {
                        console.log('   🎭 This is the MOCK implementation');
                    } else {
                        console.log('   🎯 This appears to be NATIVE implementation');
                    }
                }
            }
        } catch (error) {
            console.log('   ❌ Could not load native module:', error.message);
        }

        // Test 8: Performance test to distinguish real vs mock
        console.log('\n9️⃣ Performance test (mock should be faster)...');
        const startTime = Date.now();
        const results = [];
        
        for (let i = 0; i < 10; i++) {
            await YaraSecurityService.scanFile(`/test/file_${i}.txt`);
        }
        
        const endTime = Date.now();
        const totalTime = endTime - startTime;
        const avgTime = totalTime / 10;
        
        console.log(`   Total scan time for 10 files: ${totalTime}ms`);
        console.log(`   Average time per scan: ${avgTime}ms`);
        
        if (avgTime < 100) {
            console.log('   🎭 Fast response suggests MOCK implementation');
        } else {
            console.log('   🎯 Slower response suggests NATIVE implementation');
        }

        // Final verdict
        console.log('\n📊 FINAL VERDICT:');
        console.log('================');
        
        if (status.native && !detailedStatus.version.includes('Mock')) {
            console.log('✅ REAL NATIVE YARA ENGINE is working!');
            console.log('   - Native module is loaded');
            console.log('   - Real YARA scanning is available');
            console.log('   - Full malware detection capabilities');
        } else {
            console.log('🎭 MOCK YARA ENGINE is currently active');
            console.log('   - Using simulated scanning');
            console.log('   - Basic threat simulation only');
            console.log('   - Suitable for development/testing');
            
            console.log('\n📝 To enable native YARA:');
            console.log('   1. Build the app for Android (not Expo Go)');
            console.log('   2. Ensure native module is properly linked');
            console.log('   3. Run on actual device or emulator');
        }

    } catch (error) {
        console.error('\n❌ Test failed with error:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Run the test
console.log('Starting YARA engine test...\n');
testYaraEngine().then(() => {
    console.log('\n✅ Test completed');
}).catch(error => {
    console.error('\n❌ Test error:', error);
});
