/**
 * Test script to verify URL scanning functionality
 * Tests the LinkScannerService directly without React Native dependencies
 */

// Mock React Native environment for testing
global.Platform = {
  OS: 'android'
};

// Mock console for React Native
global.console = console;

async function testUrlScanning() {
  console.log('🧪 Testing Shabari URL Scanning...\n');

  try {
    // Test LinkScannerService directly
    const { LinkScannerService } = require('./src/services/ScannerService');
    
    // Initialize the service
    await LinkScannerService.initializeService();
    
    // Test URLs
    const testUrls = [
      'http://www.eicar.org/download/eicar.com.txt', // Known malicious test file
      'https://google.com', // Safe URL
      'https://github.com', // Safe URL
      'malware-test.com', // Should be in blocklist
      'dangerous-site.net', // Should be in blocklist
    ];

    for (const url of testUrls) {
      console.log(`\n🔍 Testing URL: ${url}`);
      try {
        const result = await LinkScannerService.scanUrl(url);
        console.log(`   Result: ${result.isSafe ? '✅ SAFE' : '🚫 DANGEROUS'}`);
        console.log(`   Details: ${result.details}`);
        
        if (!result.isSafe) {
          console.log('   🛡️ This URL would be BLOCKED by Shabari');
        }
      } catch (error) {
        console.log(`   ❌ Scan error: ${error.message}`);
      }
      
      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✅ URL scanning test completed!');
    console.log('\n📱 To test with real sharing:');
    console.log('1. Build and install the Shabari app on your phone');
    console.log('2. Open WhatsApp or any app with links');
    console.log('3. Share a link to Shabari');
    console.log('4. The app should automatically scan and show protection status');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUrlScanning().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
}); 