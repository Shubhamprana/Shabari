/**
 * Test Script for Link Checker & VirusTotal Integration
 * 
 * This script tests the fixed ScannerService to verify:
 * 1. VirusTotal V3 API integration works correctly
 * 2. False positives are reduced with threshold logic
 * 3. Safe URLs are not blocked
 * 4. Malicious URLs are properly detected
 * 5. Error handling works as expected
 */

import { LinkScannerService } from './src/services/ScannerService';

// Test URLs
const TEST_URLS = {
  safe: [
    'https://google.com',
    'https://github.com',
    'https://stackoverflow.com',
    'https://wikipedia.org',
    'https://microsoft.com',
  ],
  malicious: [
    'http://malware.testing.google.test/testing/malware/',
    'http://testsafebrowsing.appspot.com/s/malware.html',
  ],
  localBlocklist: [
    'malware-test.com',
    'phishing-example.com',
    'dangerous-site.net',
    'scam-website.org',
  ],
  invalid: [
    'not-a-url',
    'htp://invalid',
    '',
  ]
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testUrl(url: string, expectedSafe: boolean, category: string) {
  log(`\n${'='.repeat(80)}`, colors.cyan);
  log(`Testing: ${url}`, colors.blue);
  log(`Category: ${category}`, colors.blue);
  log(`Expected: ${expectedSafe ? 'SAFE' : 'MALICIOUS'}`, colors.blue);
  log('='.repeat(80), colors.cyan);

  try {
    const startTime = Date.now();
    const result = await LinkScannerService.scanUrl(url);
    const duration = Date.now() - startTime;

    log(`\nResult:`, colors.cyan);
    log(`  isSafe: ${result.isSafe}`, result.isSafe ? colors.green : colors.red);
    log(`  Details: ${result.details}`, colors.yellow);
    log(`  Scan Duration: ${duration}ms`, colors.blue);

    // Verify result matches expectation
    const passed = result.isSafe === expectedSafe;
    
    if (passed) {
      log(`\n✅ TEST PASSED`, colors.green);
    } else {
      log(`\n❌ TEST FAILED`, colors.red);
      log(`   Expected isSafe=${expectedSafe}, got isSafe=${result.isSafe}`, colors.red);
    }

    return { url, passed, duration, result };
  } catch (error: any) {
    log(`\n❌ TEST ERROR: ${error.message}`, colors.red);
    return { url, passed: false, duration: 0, result: null, error: error.message };
  }
}

async function runTests() {
  log('\n' + '='.repeat(80), colors.cyan);
  log('🧪 LINK CHECKER & VIRUSTOTAL INTEGRATION TEST SUITE', colors.cyan);
  log('='.repeat(80) + '\n', colors.cyan);

  const results: any[] = [];

  // Initialize service
  log('Initializing LinkScannerService...', colors.blue);
  await LinkScannerService.initializeService();
  log('✅ Service initialized\n', colors.green);

  // Test 1: Safe URLs (should NOT be blocked)
  log('\n' + '='.repeat(80), colors.cyan);
  log('TEST SUITE 1: SAFE URLs (Should Pass)', colors.cyan);
  log('='.repeat(80), colors.cyan);
  
  for (const url of TEST_URLS.safe) {
    const result = await testUrl(url, true, 'Safe URL');
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }

  // Test 2: Local Blocklist (should be blocked immediately)
  log('\n' + '='.repeat(80), colors.cyan);
  log('TEST SUITE 2: LOCAL BLOCKLIST (Should Block)', colors.cyan);
  log('='.repeat(80), colors.cyan);
  
  for (const url of TEST_URLS.localBlocklist) {
    const result = await testUrl(url, false, 'Local Blocklist');
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Test 3: Malicious URLs (should be blocked by VirusTotal)
  log('\n' + '='.repeat(80), colors.cyan);
  log('TEST SUITE 3: MALICIOUS URLs (Should Block)', colors.cyan);
  log('='.repeat(80), colors.cyan);
  
  for (const url of TEST_URLS.malicious) {
    const result = await testUrl(url, false, 'Malicious URL');
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Longer wait for API
  }

  // Test 4: Invalid URLs (should handle gracefully)
  log('\n' + '='.repeat(80), colors.cyan);
  log('TEST SUITE 4: INVALID URLs (Should Handle Gracefully)', colors.cyan);
  log('='.repeat(80), colors.cyan);
  
  for (const url of TEST_URLS.invalid) {
    const result = await testUrl(url, false, 'Invalid URL');
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  log('\n' + '='.repeat(80), colors.cyan);
  log('📊 TEST SUMMARY', colors.cyan);
  log('='.repeat(80) + '\n', colors.cyan);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / total;

  log(`Total Tests: ${total}`, colors.blue);
  log(`Passed: ${passed}`, colors.green);
  log(`Failed: ${failed}`, failed > 0 ? colors.red : colors.green);
  log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`, colors.blue);
  log(`Average Scan Time: ${avgDuration.toFixed(0)}ms`, colors.blue);

  if (failed > 0) {
    log('\n❌ FAILED TESTS:', colors.red);
    results.filter(r => !r.passed).forEach(r => {
      log(`  - ${r.url}: ${r.error || 'Unexpected result'}`, colors.red);
    });
  }

  log('\n' + '='.repeat(80), colors.cyan);
  if (failed === 0) {
    log('✅ ALL TESTS PASSED!', colors.green);
  } else {
    log('❌ SOME TESTS FAILED', colors.red);
  }
  log('='.repeat(80) + '\n', colors.cyan);

  return { passed, failed, total };
}

// Run tests
if (require.main === module) {
  runTests()
    .then(summary => {
      process.exit(summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { runTests, testUrl };
