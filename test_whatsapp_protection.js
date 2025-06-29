/**
 * Test script to verify WhatsApp URL protection functionality
 * Tests both clipboard monitoring and direct URL handling
 */

console.log('🧪 Testing WhatsApp URL Protection...\n');

// Mock React Native environment for testing
global.Platform = {
  OS: 'android'
};

// Test the URL scanning directly
async function testUrlScanning() {
  console.log('🔍 Testing direct URL scanning...');
  
  const { LinkScannerService } = require('./src/services/ScannerService');
  
  // Initialize the service
  await LinkScannerService.initializeService();
  
  // Test URLs
  const testUrls = [
    'http://www.eicar.org/download/eicar.com.txt', // Malicious test URL
    'https://google.com', // Safe URL
    'https://example.com/malicious.exe', // Suspicious file
  ];
  
  for (const url of testUrls) {
    console.log(`\n📋 Testing: ${url}`);
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
  }
}

// Test clipboard monitoring simulation
async function testClipboardMonitoring() {
  console.log('\n📋 Testing clipboard monitoring simulation...');
  
  const { clipboardMonitor } = require('./src/services/ClipboardURLMonitor');
  
  // Mock callbacks
  const testCallbacks = {
    onUrlDetected: (url) => {
      console.log(`📥 URL detected: ${url}`);
    },
    onScanComplete: (result) => {
      console.log(`🔍 Scan result for ${result.url}:`);
      console.log(`   Safe: ${result.isSafe ? 'YES' : 'NO'}`);
      console.log(`   Details: ${result.details}`);
      
      if (result.isSafe === false) {
        console.log('   🚨 ALERT: This would trigger a warning dialog!');
        console.log('   🛡️ User would see: "Dangerous website blocked!"');
      } else {
        console.log('   ℹ️ User would see: "Safe link detected"');
      }
    },
    onError: (error) => {
      console.error(`❌ Clipboard error: ${error}`);
    }
  };
  
  // Initialize and test
  clipboardMonitor.initialize(testCallbacks);
  
  // Simulate URLs being detected
  const testUrls = [
    'http://www.eicar.org/download/eicar.com.txt',
    'https://google.com'
  ];
  
  for (const url of testUrls) {
    console.log(`\n📋 Simulating clipboard detection: ${url}`);
    await clipboardMonitor.scanUrlManually(url);
  }
}

// Test deep link handling
function testDeepLinkHandling() {
  console.log('\n🔗 Testing deep link URL handling...');
  
  const testUrls = [
    'shabari://browser?url=http://www.eicar.org/download/eicar.com.txt',
    'https://example.com/malicious-link',
    'http://www.eicar.org/download/eicar.com.txt'
  ];
  
  for (const url of testUrls) {
    console.log(`\n🔗 Testing deep link: ${url}`);
    
    // Extract target URL (same logic as in App.tsx)
    let targetUrl = url;
    if (url.startsWith('shabari://')) {
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      targetUrl = urlParams.get('url') || urlParams.get('link') || url;
    }
    
    console.log(`   Target URL: ${targetUrl}`);
    console.log(`   🔍 This would be scanned automatically`);
    console.log(`   🛡️ If malicious, user would see blocking alert`);
  }
}

// Main test execution
async function runAllTests() {
  try {
    await testUrlScanning();
    await testClipboardMonitoring();
    testDeepLinkHandling();
    
    console.log('\n✅ All tests completed!');
    console.log('\n📱 How to test with WhatsApp:');
    console.log('1. Copy this malicious URL: http://www.eicar.org/download/eicar.com.txt');
    console.log('2. Open Shabari app');
    console.log('3. The clipboard monitor should detect and warn about the URL');
    console.log('4. Try sharing a link from WhatsApp to see if Shabari appears as an option');
    console.log('5. If Shabari is set as default browser, it will intercept all URLs');
    
    console.log('\n🔧 For full URL interception from WhatsApp:');
    console.log('1. Rebuild the app: expo run:android');
    console.log('2. Set Shabari as default browser in Android settings');
    console.log('3. All clicked URLs will be scanned before opening');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
runAllTests(); 