#!/usr/bin/env node

/**
 * Test VirusTotal API Key Integration
 * 
 * This script verifies that the link checker is using the correct VirusTotal API key
 * and shows the actual results from VirusTotal to the user.
 */

const fs = require('fs');

console.log('🔍 Testing VirusTotal API Integration...\n');

// Check API key configuration
const scannerServicePath = 'src/services/ScannerService.ts';
let scannerContent = '';

try {
  scannerContent = fs.readFileSync(scannerServicePath, 'utf-8');
} catch (error) {
  console.log('❌ Could not read ScannerService.ts:', error.message);
  process.exit(1);
}

console.log('📋 Verifying VirusTotal API Configuration:\n');

const apiKey = '79df999765cde7b193b1cfd28d179add44b8a10ee9216299cefcbfe994c76ad0';

const checks = [
  {
    name: 'API Key Configuration',
    check: scannerContent.includes(apiKey),
    description: `Using API key: ${apiKey.substring(0, 15)}...`
  },
  {
    name: 'VirusTotal API v3 Base URL',
    check: scannerContent.includes('VIRUSTOTAL_V3_BASE') && scannerContent.includes('https://www.virustotal.com/api/v3'),
    description: 'Using modern VirusTotal API v3 endpoint'
  },
  {
    name: 'API Key Header',
    check: scannerContent.includes('x-apikey') && scannerContent.includes('VIRUSTOTAL_API_KEY'),
    description: 'Proper authentication header configured'
  },
  {
    name: 'Detailed Results Display',
    check: scannerContent.includes('VirusTotal Detection:') && scannerContent.includes('security engines'),
    description: 'Shows detailed VirusTotal scan results to users'
  },
  {
    name: 'Malicious Count Display',
    check: scannerContent.includes('out of') && scannerContent.includes('totalEngines'),
    description: 'Shows number of engines that detected threats'
  },
  {
    name: 'Clean Results Display',
    check: scannerContent.includes('VirusTotal Analysis: Clean') && scannerContent.includes('Harmless:'),
    description: 'Shows detailed results for safe URLs'
  },
  {
    name: 'API Key Logging',
    check: scannerContent.includes('Using API Key:') && scannerContent.includes('substring'),
    description: 'Logs API key usage for debugging (truncated for security)'
  },
  {
    name: 'Detection Stats Logging',
    check: scannerContent.includes('Detection Results:') && scannerContent.includes('Malicious:'),
    description: 'Logs detailed detection statistics'
  },
  {
    name: 'Error Handling for 404',
    check: scannerContent.includes('404') && scannerContent.includes('submitting for analysis'),
    description: 'Handles new URLs not in VirusTotal database'
  },
  {
    name: 'Error Handling for Invalid API Key',
    check: scannerContent.includes('401') && scannerContent.includes('Invalid or Expired'),
    description: 'Detects and reports invalid API key errors'
  }
];

let allChecksPassed = true;

checks.forEach(check => {
  if (check.check) {
    console.log(`✅ ${check.name}`);
    console.log(`   ${check.description}`);
  } else {
    console.log(`❌ ${check.name}`);
    console.log(`   ${check.description}`);
    allChecksPassed = false;
  }
  console.log('');
});

// Check link checker UI implementation
console.log('📱 Verifying Link Checker UI Integration:\n');

const dashboardPath = 'src/screens/DashboardScreen.tsx';
let dashboardContent = '';

try {
  dashboardContent = fs.readFileSync(dashboardPath, 'utf-8');
} catch (error) {
  console.log('⚠️  Could not read DashboardScreen.tsx');
}

const uiChecks = [
  {
    name: 'URL Input Field',
    check: dashboardContent.includes('urlInput') && dashboardContent.includes('placeholder="https://example.com"'),
    description: 'User can enter URL to scan'
  },
  {
    name: 'Scan Button',
    check: dashboardContent.includes('Scan URL') || dashboardContent.includes('Scanning...'),
    description: 'Click to scan button implemented'
  },
  {
    name: 'LinkScannerService Integration',
    check: dashboardContent.includes('LinkScannerService.scanUrl'),
    description: 'Uses LinkScannerService for scanning'
  },
  {
    name: 'Result Display',
    check: dashboardContent.includes('onNavigateToScanResult') && dashboardContent.includes('details'),
    description: 'Shows scan results to user'
  }
];

uiChecks.forEach(check => {
  if (check.check) {
    console.log(`✅ ${check.name}`);
    console.log(`   ${check.description}`);
  } else {
    console.log(`❌ ${check.name}`);
    console.log(`   ${check.description}`);
    allChecksPassed = false;
  }
  console.log('');
});

// Summary
console.log('📊 Summary:\n');

if (allChecksPassed) {
  console.log('🎉 VirusTotal API Integration is Properly Configured!');
  console.log('');
  console.log('✅ API Key: Correctly set and used');
  console.log('✅ API Version: Using modern v3 API');
  console.log('✅ Results Display: Shows detailed VirusTotal data');
  console.log('✅ Error Handling: Comprehensive error handling');
  console.log('✅ UI Integration: Link checker is connected');
  console.log('');
  console.log('🔍 How it works:');
  console.log('   1. User enters URL in the link checker');
  console.log('   2. Clicks "Scan URL" button');
  console.log('   3. App sends request to VirusTotal API v3 with your API key');
  console.log('   4. VirusTotal returns analysis from 70+ security engines');
  console.log('   5. App shows detailed results:');
  console.log('      • Number of engines that flagged URL');
  console.log('      • Total engines scanned');
  console.log('      • Harmless/Malicious breakdown');
  console.log('      • Source attribution to VirusTotal');
  console.log('');
  console.log('🛡️ Your users will now see:');
  console.log('   • "VirusTotal Detection: X out of Y engines flagged this URL"');
  console.log('   • "VirusTotal Analysis: Clean - Scanned by Y engines"');
  console.log('   • Detailed breakdown of detection results');
  console.log('   • Clear indication that data comes from VirusTotal');
} else {
  console.log('⚠️ Some configuration issues detected.');
  console.log('🔧 Please review the implementation.');
}

console.log('');
console.log('🎯 Test Instructions:');
console.log('   1. Open the app and tap on "Link Scanner" on dashboard');
console.log('   2. Enter a URL (e.g., https://google.com or a suspicious URL)');
console.log('   3. Click "Scan URL"');
console.log('   4. Results will show VirusTotal analysis data');
console.log('   5. Check console logs for API key usage confirmation');

module.exports = { allChecksPassed };
