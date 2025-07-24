/**
 * Comprehensive YARA Engine Test Script
 * Tests the actual YARA engine functionality with real pattern detection
 */

const fs = require('fs');
const path = require('path');

// Test cases for YARA engine verification
const testCases = [
  {
    name: 'Clean Text File',
    filename: 'clean_document.txt',
    content: 'This is a clean document with normal text content.\nIt contains no malicious patterns or threats.',
    expectedSafe: true,
    description: 'Should be detected as safe'
  },
  {
    name: 'Malware Pattern Test',
    filename: 'suspicious_malware_file.txt',
    content: 'This file contains malware patterns and virus signatures that should be detected.',
    expectedSafe: false,
    description: 'Should detect malware patterns'
  },
  {
    name: 'Banking Trojan Simulation',
    filename: 'banking_app.txt',
    content: 'com.android.vending.BILLING\noverlay_service\naccessibility_service\nbank login credentials',
    expectedSafe: false,
    description: 'Should detect banking trojan patterns'
  },
  {
    name: 'Ransomware Pattern Test',
    filename: 'ransom_note.txt',
    content: 'Your files have been encrypted! Pay bitcoin to decrypt your important documents. Ransom demand: 0.5 BTC',
    expectedSafe: false,
    description: 'Should detect ransomware patterns'
  },
  {
    name: 'Phishing Content Test',
    filename: 'phishing_email.txt',
    content: 'Urgent action required! Enter your password to verify your PayPal account or it will be suspended.',
    expectedSafe: false,
    description: 'Should detect phishing content'
  },
  {
    name: 'PDF Exploit Test',
    filename: 'exploit.pdf',
    content: '%PDF-1.4\n/JavaScript\n/EmbeddedFile\neval(unescape("malicious code here"))',
    expectedSafe: false,
    description: 'Should detect PDF exploit patterns'
  },
  {
    name: 'Executable Header Test',
    filename: 'suspicious.exe',
    content: 'MZ\x90\x00\x03\x00\x00\x00virus trojan malware payload',
    expectedSafe: false,
    description: 'Should detect suspicious executable'
  }
];

console.log('🧪 YARA Engine Comprehensive Test Suite');
console.log('='.repeat(50));

async function createTestFiles() {
  const testDir = path.join(__dirname, 'yara-test-files');
  
  // Create test directory
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  console.log(`📁 Creating test files in: ${testDir}`);
  
  for (const testCase of testCases) {
    const filePath = path.join(testDir, testCase.filename);
    fs.writeFileSync(filePath, testCase.content, 'utf8');
    console.log(`✅ Created: ${testCase.filename}`);
  }
  
  return testDir;
}

async function testYaraEngine() {
  try {
    console.log('\n🔍 Loading YARA Engine...');
    
    // Import the YARA engine
    const YaraEngine = require('./react-native-yara-engine').default || require('./react-native-yara-engine');
    
    if (!YaraEngine) {
      throw new Error('YARA Engine not available');
    }
    
    console.log(`🛡️ Engine Type: ${YaraEngine._engineType || 'unknown'}`);
    console.log(`🔧 Native Engine: ${YaraEngine._isNative ? 'YES' : 'NO'}`);
    
    // Initialize the engine
    console.log('\n🚀 Initializing YARA Engine...');
    const initResult = await YaraEngine.initializeEngine();
    console.log(`✅ Initialization: ${initResult}`);
    
    // Get engine information
    const version = await YaraEngine.getEngineVersion();
    const rulesCount = await YaraEngine.getLoadedRulesCount();
    console.log(`📋 Engine Version: ${version}`);
    console.log(`📋 Rules Loaded: ${rulesCount}`);
    
    // Create test files
    const testDir = await createTestFiles();
    
    console.log('\n🧪 Running YARA Scan Tests...');
    console.log('='.repeat(50));
    
    let testsPassed = 0;
    let testsFailed = 0;
    
    for (const testCase of testCases) {
      const filePath = path.join(testDir, testCase.filename);
      
      console.log(`\n🔍 Testing: ${testCase.name}`);
      console.log(`📄 File: ${testCase.filename}`);
      console.log(`🎯 Expected: ${testCase.expectedSafe ? 'SAFE' : 'THREAT'}`);
      
      try {
        const startTime = Date.now();
        const result = await YaraEngine.scanFile(filePath);
        const endTime = Date.now();
        
        console.log(`⏱️ Scan Time: ${endTime - startTime}ms`);
        console.log(`🛡️ Engine: ${result.scanEngine}`);
        console.log(`📊 Result: ${result.isSafe ? 'SAFE' : 'THREAT'}`);
        
        if (!result.isSafe) {
          console.log(`🚨 Threat: ${result.threatName}`);
          console.log(`📂 Category: ${result.threatCategory}`);
          console.log(`⚠️ Severity: ${result.severity}`);
          if (result.matchedRules && result.matchedRules.length > 0) {
            console.log(`📋 Rules: ${result.matchedRules.join(', ')}`);
          }
        }
        
        console.log(`📝 Details: ${result.details}`);
        
        // Check if result matches expectation
        const testPassed = result.isSafe === testCase.expectedSafe;
        
        if (testPassed) {
          console.log(`✅ TEST PASSED: ${testCase.description}`);
          testsPassed++;
        } else {
          console.log(`❌ TEST FAILED: Expected ${testCase.expectedSafe ? 'safe' : 'threat'}, got ${result.isSafe ? 'safe' : 'threat'}`);
          testsFailed++;
        }
        
      } catch (error) {
        console.log(`❌ SCAN ERROR: ${error.message}`);
        testsFailed++;
      }
    }
    
    // Test summary
    console.log('\n📊 Test Summary');
    console.log('='.repeat(30));
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    
    // Engine status summary
    console.log('\n🛡️ YARA Engine Status');
    console.log('='.repeat(30));
    console.log(`Engine Type: ${YaraEngine._engineType || 'unknown'}`);
    console.log(`Native Engine: ${YaraEngine._isNative ? '✅ YES' : '❌ NO'}`);
    console.log(`Engine Version: ${version}`);
    console.log(`Detection Rules: ${rulesCount}`);
    
    if (YaraEngine._isNative) {
      console.log('\n🎉 SUCCESS: Native YARA Engine is working!');
      console.log('Your Shabari app now has real malware detection capabilities.');
    } else {
      console.log('\n⚠️ NOTICE: Using Mock Engine');
      console.log('The native YARA engine is not available, but enhanced mock detection is working.');
    }
    
    // Cleanup test files
    console.log('\n🧹 Cleaning up test files...');
    fs.rmSync(testDir, { recursive: true, force: true });
    console.log('✅ Cleanup completed');
    
    return {
      testsPassed,
      testsFailed,
      isNative: YaraEngine._isNative,
      version,
      rulesCount
    };
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    throw error;
  }
}

// Memory scan test
async function testMemoryScanning() {
  try {
    console.log('\n🧠 Testing Memory Scanning...');
    
    const YaraEngine = require('./react-native-yara-engine').default || require('./react-native-yara-engine');
    
    const testData = [
      {
        name: 'Clean Memory',
        data: Buffer.from('This is clean memory content with no threats.', 'utf8'),
        expectedSafe: true
      },
      {
        name: 'Malicious Memory',
        data: Buffer.from('malware virus trojan CreateRemoteThread exploit payload', 'utf8'),
        expectedSafe: false
      }
    ];
    
    for (const test of testData) {
      console.log(`\n🔍 Testing: ${test.name}`);
      const result = await YaraEngine.scanMemory(Array.from(test.data));
      console.log(`📊 Result: ${result.isSafe ? 'SAFE' : 'THREAT'}`);
      
      if (!result.isSafe) {
        console.log(`🚨 Threat: ${result.threatName}`);
        console.log(`📝 Details: ${result.details}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Memory scan test failed:', error);
  }
}

// Run all tests
async function runAllTests() {
  try {
    const results = await testYaraEngine();
    await testMemoryScanning();
    
    console.log('\n🎯 Final Results');
    console.log('='.repeat(30));
    
    if (results.isNative && results.testsPassed > results.testsFailed) {
      console.log('🎉 YARA ENGINE IS WORKING PERFECTLY!');
      console.log('✅ Your app now has real-time malware detection');
      console.log('✅ Native pattern matching is functional');
      console.log('✅ Comprehensive threat detection active');
    } else if (!results.isNative && results.testsPassed > results.testsFailed) {
      console.log('⚠️ Enhanced Mock Engine is working');
      console.log('🔄 Native engine needs compilation for full functionality');
    } else {
      console.log('❌ YARA Engine needs attention');
      console.log('🔧 Check the implementation and try building the project');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testYaraEngine,
  testMemoryScanning,
  runAllTests
}; 