/**
 * Test script for Shabari File Protection Features
 * Tests both Part 1 (Free) and Part 2 (Premium) features from doccument-image-file.md
 */

console.log('🧪 Testing Shabari File Protection System...\n');

// Mock React Native environment
global.Platform = {
  OS: 'android'
};

// Test the file scanning functionality directly
async function testFileScanning() {
  console.log('📁 Testing File Scanning (Part 1 - Free Users)...\n');
  
  try {
    const { FileScannerService } = require('./src/services/ScannerService');
    
    // Test files with different threat levels
    const testFiles = [
      {
        uri: 'file:///storage/emulated/0/Download/document.pdf',
        name: 'document.pdf',
        expected: 'SAFE'
      },
      {
        uri: 'file:///storage/emulated/0/Download/suspicious.exe',
        name: 'suspicious.exe', 
        expected: 'DANGEROUS'
      },
      {
        uri: 'file:///storage/emulated/0/WhatsApp/Media/WhatsApp Images/IMG_001.jpg',
        name: 'IMG_001.jpg',
        expected: 'SAFE'
      },
      {
        uri: 'file:///storage/emulated/0/Download/malware.apk',
        name: 'malware.apk',
        expected: 'DANGEROUS'
      }
    ];
    
    for (const file of testFiles) {
      console.log(`🔍 Testing file: ${file.name}`);
      
      try {
        const result = await FileScannerService.scanFile(file.uri, file.name);
        console.log(`   Result: ${result.isSafe ? '✅ SAFE' : '🚫 DANGEROUS'}`);
        console.log(`   Engine: ${result.scanEngine}`);
        console.log(`   Details: ${result.details}`);
        
        if (result.filePath) {
          console.log(`   Quarantined: ${result.filePath}`);
        }
        
        if (result.fileSize) {
          console.log(`   Size: ${Math.round(result.fileSize / 1024)}KB`);
        }
        
        console.log(`   Expected: ${file.expected} | Actual: ${result.isSafe ? 'SAFE' : 'DANGEROUS'}\n`);
        
      } catch (error) {
        console.log(`   ❌ Scan error: ${error.message}\n`);
      }
    }
    
  } catch (error) {
    console.error('❌ File scanning test failed:', error);
  }
}

// Test share intent handling
async function testShareIntent() {
  console.log('📤 Testing Share Intent File Handling...\n');
  
  try {
    const { shareIntentService } = require('./src/services/ShareIntentService');
    
    // Mock callbacks for testing
    const callbacks = {
      onUrlReceived: (url) => {
        console.log('📥 URL received:', url);
      },
      onFileReceived: (file) => {
        console.log('📁 File received:', file.fileName);
      },
      onScanComplete: (result) => {
        console.log('🔍 Scan complete:', {
          type: result.scanType,
          target: result.fileName || result.url,
          isSafe: result.isSafe,
          details: result.details
        });
        
        if (result.scanType === 'file') {
          if (result.isSafe) {
            console.log('   ✅ File is safe - user can open/save');
          } else {
            console.log('   🚫 DANGEROUS FILE - quarantined for safety');
          }
        }
      },
      onUrlBlocked: (result) => {
        console.log('🛡️ URL blocked:', result.url);
      },
      onUrlVerified: (result) => {
        console.log('✅ URL verified:', result.url);
      },
      onError: (error) => {
        console.error('❌ Error:', error);
      }
    };
    
    shareIntentService.initialize(callbacks);
    
    // Simulate file sharing scenarios
    const mockSharedFiles = [
      {
        contentUri: 'content://downloads/document.pdf',
        fileName: 'document.pdf',
        mimeType: 'application/pdf'
      },
      {
        contentUri: 'content://whatsapp/media/photo.jpg',
        fileName: 'photo.jpg',
        mimeType: 'image/jpeg'
      },
      {
        contentUri: 'content://downloads/suspicious.exe',
        fileName: 'suspicious.exe',
        mimeType: 'application/octet-stream'
      }
    ];
    
    console.log('🧪 Simulating shared files...\n');
    
    for (const file of mockSharedFiles) {
      console.log(`📁 Processing shared file: ${file.fileName}`);
      
      // Simulate the share intent workflow
      await shareIntentService.handleSharedFiles([file]);
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
  } catch (error) {
    console.error('❌ Share intent test failed:', error);
  }
}

// Test premium background services (mock mode)
async function testPremiumServices() {
  console.log('🔒 Testing Premium Services (Part 2 - Background Protection)...\n');
  
  try {
    // Test WatchdogFileService
    console.log('🐶 Testing WatchdogFileService...\n');
    
    const { WatchdogFileService } = require('./src/services/WatchdogFileService');
    const { PrivacyGuardService } = require('./src/services/PrivacyGuardService');
    
    const watchdogCallbacks = {
      onThreatDetected: (result) => {
        console.log('🚨 THREAT DETECTED by Watchdog:', {
          file: result.fileName,
          path: result.filePath,
          details: result.details
        });
        console.log('   🛡️ File would be quarantined/deleted automatically');
      },
      onFileScanned: (result) => {
        console.log('🔍 File scanned by Watchdog:', {
          file: result.fileName,
          safe: result.isSafe
        });
      },
      onError: (error) => {
        console.error('🐶 Watchdog error:', error);
      },
      onStatusChange: (isActive) => {
        console.log(`🐶 Watchdog status: ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
      }
    };
    
    const watchdogService = WatchdogFileService.getInstance();
    const watchdogInitialized = await watchdogService.initialize(watchdogCallbacks);
    console.log(`🐶 Watchdog initialized: ${watchdogInitialized}`);
    
    if (watchdogInitialized) {
      const started = await watchdogService.startWatching();
      console.log(`🐶 Watchdog started: ${started}`);
      
      // Let it run for a few seconds to demonstrate mock detection
      console.log('🐶 Watching for file changes... (demo mode)\n');
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      await watchdogService.stopWatching();
    }
    
  } catch (error) {
    console.error('❌ Watchdog test failed:', error);
  }
  
  try {
    // Test PrivacyGuardService
    console.log('\n🔒 Testing PrivacyGuardService...\n');
    
    const privacyCallbacks = {
      onSuspiciousAppDetected: (result) => {
        console.log('🚨 SUSPICIOUS APP DETECTED:', {
          app: result.appName,
          package: result.packageName,
          riskLevel: result.riskLevel,
          permissions: result.permissions,
          details: result.details
        });
        
        if (result.riskLevel === 'HIGH') {
          console.log('   🛡️ CRITICAL ALERT - User should uninstall immediately');
        } else {
          console.log('   ⚠️ WARNING - User should review permissions');
        }
      },
      onAppInstalled: (result) => {
        console.log('📱 New app installed:', {
          app: result.appName,
          safe: result.isSafe
        });
      },
      onError: (error) => {
        console.error('🔒 Privacy Guard error:', error);
      },
      onStatusChange: (isActive) => {
        console.log(`🔒 Privacy Guard status: ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
      }
    };
    
    const privacyGuard = PrivacyGuardService.getInstance();
    const privacyInitialized = await privacyGuard.initialize(privacyCallbacks);
    console.log(`🔒 Privacy Guard initialized: ${privacyInitialized}`);
    
    if (privacyInitialized) {
      const started = await privacyGuard.startMonitoring();
      console.log(`🔒 Privacy Guard started: ${started}`);
      
      // Test scanning existing apps
      console.log('🔒 Scanning installed apps...');
      await privacyGuard.scanInstalledApps();
      
      // Let it run for a few seconds to demonstrate mock detection
      console.log('🔒 Monitoring app installations... (demo mode)\n');
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      await privacyGuard.stopMonitoring();
    }
    
  } catch (error) {
    console.error('❌ Privacy Guard test failed:', error);
  }
}

// Test the complete workflow
async function testCompleteWorkflow() {
  console.log('🔄 Testing Complete File Protection Workflow...\n');
  
  console.log('📋 Test Scenario: User receives suspicious file via WhatsApp');
  console.log('1. User receives file in WhatsApp');
  console.log('2. User taps "Share" → "Shabari"');
  console.log('3. Shabari quarantines file automatically');
  console.log('4. File is scanned with VirusTotal + local analysis');
  console.log('5. Results displayed with appropriate actions\n');
  
  // Simulate the complete workflow
  try {
    const { FileScannerService } = require('./src/services/ScannerService');
    
    // Step 1: File shared to Shabari
    const sharedFile = {
      contentUri: 'content://whatsapp/media/document.pdf',
      fileName: 'invoice.pdf'
    };
    
    console.log(`📁 Step 1: File shared - ${sharedFile.fileName}`);
    
    // Step 2: Quarantine file (per doccument-image-file.md step 3.a)
    console.log('📁 Step 2: Quarantining file...');
    const quarantined = await FileScannerService.quarantineSharedFile(
      sharedFile.contentUri, 
      sharedFile.fileName
    );
    console.log(`   ✅ Quarantined to: ${quarantined.quarantinedPath}`);
    
    // Step 3: Navigate to ScanResultScreen with loading (step 3.b)
    console.log('📱 Step 3: Navigating to scan result screen (loading state)');
    
    // Step 4: Scan file (step 3.c)
    console.log('🔍 Step 4: Scanning file...');
    const scanResult = await FileScannerService.scanFile(
      sharedFile.contentUri,
      sharedFile.fileName
    );
    
    // Step 5: Update screen with results (step 3.d)
    console.log('📱 Step 5: Updating scan result screen');
    console.log('📊 Final Result:', {
      file: sharedFile.fileName,
      isSafe: scanResult.isSafe,
      threat: scanResult.threatName,
      engine: scanResult.scanEngine,
      details: scanResult.details
    });
    
    // Step 6: Show appropriate actions (step 3.e)
    if (scanResult.isSafe) {
      console.log('✅ Actions: [Save File] [Open File] [Share]');
    } else {
      console.log('🚫 Actions: [Delete File] [Quarantine] [Report Threat]');
    }
    
    console.log('\n🎯 Workflow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Complete workflow test failed:', error);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🧪 SHABARI FILE PROTECTION TEST SUITE');
  console.log('=====================================\n');
  
  // Test Part 1: Free User Features
  await testFileScanning();
  await testShareIntent();
  
  // Test Part 2: Premium User Features  
  await testPremiumServices();
  
  // Test Complete Workflow
  await testCompleteWorkflow();
  
  console.log('\n✅ ALL TESTS COMPLETED!');
  console.log('\n📱 To test manually:');
  console.log('1. Build app: expo run:android');
  console.log('2. Share files to Shabari from other apps');
  console.log('3. Enable premium subscription to test background services');
  console.log('4. Monitor console logs for detailed protection events');
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
}); 