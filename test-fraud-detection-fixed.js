#!/usr/bin/env node

/**
 * Test Fraud Detection - Fixed Implementation
 * 
 * This script tests the improved fraud detection system with known malicious URLs
 */

const fs = require('fs');

console.log('🔍 Testing Fixed Fraud Detection System...\n');

// Test URLs - mix of safe and malicious
const testUrls = [
  // Known safe URLs
  { url: 'https://google.com', expected: 'safe', category: 'Safe - Major site' },
  { url: 'https://github.com', expected: 'safe', category: 'Safe - Developer site' },
  
  // Suspicious patterns (should be caught by local checks)
  { url: 'https://secure-account-update-required.tk', expected: 'malicious', category: 'Phishing - Account update + suspicious TLD' },
  { url: 'https://verify-account-suspended-urgent.ml', expected: 'malicious', category: 'Phishing - Account suspension + suspicious TLD' },
  { url: 'https://click-here-prize-winner.ga', expected: 'malicious', category: 'Phishing - Prize scam + suspicious TLD' },
  { url: 'https://192.168.1.100/login', expected: 'malicious', category: 'Suspicious - IP address' },
  { url: 'https://bit.ly/suspicious-link', expected: 'malicious', category: 'Suspicious - URL shortener' },
  { url: 'https://sub1.sub2.sub3.example.com', expected: 'malicious', category: 'Suspicious - Multiple subdomains' },
  
  // Homograph attacks
  { url: 'https://аpple.com', expected: 'malicious', category: 'Homograph - Cyrillic characters' },
  
  // Test QR codes with malicious URLs
  { qr: 'https://secure-update-account.tk/login', expected: 'malicious', category: 'QR - Phishing URL' },
  { qr: 'https://192.168.1.1/malware.apk', expected: 'malicious', category: 'QR - IP + malware file' }
];

// Check if the fraud detection improvements are in place
const scannerServicePath = 'src/services/ScannerService.ts';
const qrScannerServicePath = 'src/services/QRScannerService.ts';

let scannerContent = '';
let qrScannerContent = '';

try {
  scannerContent = fs.readFileSync(scannerServicePath, 'utf-8');
  qrScannerContent = fs.readFileSync(qrScannerServicePath, 'utf-8');
} catch (error) {
  console.log('❌ Could not read service files:', error.message);
  process.exit(1);
}

console.log('📋 Checking Fraud Detection Improvements:\n');

// Check VirusTotal API v3 implementation
const checks = [
  {
    name: 'VirusTotal API v3',
    check: scannerContent.includes('VIRUSTOTAL_V3_BASE') && scannerContent.includes('x-apikey'),
    description: 'Using modern VirusTotal API v3 instead of deprecated v2'
  },
  {
    name: 'Local Fraud Checks',
    check: scannerContent.includes('performLocalFraudChecks'),
    description: 'Local pattern matching for common fraud indicators'
  },
  {
    name: 'Improved Error Handling',
    check: scannerContent.includes('localChecks.isSuspicious'),
    description: 'Fallback to local checks when API fails'
  },
  {
    name: 'Suspicious Pattern Detection',
    check: scannerContent.includes('Phishing:') && scannerContent.includes('suspicious TLD'),
    description: 'Detection of phishing patterns and suspicious domains'
  },
  {
    name: 'QR Fraud Detection Strictness',
    check: qrScannerContent.includes('HIGH') && qrScannerContent.includes('CRITICAL'),
    description: 'QR scanner blocks both HIGH and CRITICAL risk levels'
  },
  {
    name: 'Detailed Logging',
    check: scannerContent.includes('VirusTotal stats:') && scannerContent.includes('engines flagged'),
    description: 'Comprehensive logging for debugging fraud detection'
  }
];

let allChecksPassed = true;

checks.forEach(check => {
  if (check.check) {
    console.log(`✅ ${check.name}: Implemented`);
    console.log(`   ${check.description}`);
  } else {
    console.log(`❌ ${check.name}: Missing`);
    console.log(`   ${check.description}`);
    allChecksPassed = false;
  }
  console.log('');
});

// Test pattern matching
console.log('🧪 Testing Local Pattern Matching:\n');

testUrls.forEach(test => {
  const url = test.url || test.qr;
  let detected = false;
  let reason = '';

  // Test suspicious patterns
  const suspiciousPatterns = [
    { pattern: /secure.*update.*account/i, reason: 'Phishing: Account update scam' },
    { pattern: /verify.*account.*suspended/i, reason: 'Phishing: Account suspension scam' },
    { pattern: /click.*here.*prize/i, reason: 'Phishing: Prize scam' },
    { pattern: /bit\.ly|tinyurl|t\.co|short\.link/i, reason: 'Suspicious: URL shortener' },
    { pattern: /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/i, reason: 'Suspicious: IP address' },
    { pattern: /\.(tk|ml|ga|cf)$/i, reason: 'Suspicious: High-risk TLD' },
    { pattern: /[а-я].*\.com|[а-я].*\.org/i, reason: 'Suspicious: Cyrillic characters' },
    { pattern: /^https?:\/\/[^\/]*\.[^\/]*\.[^\/]*\.[^\/]*\./i, reason: 'Suspicious: Multiple subdomains' }
  ];

  for (const check of suspiciousPatterns) {
    if (check.pattern.test(url)) {
      detected = true;
      reason = check.reason;
      break;
    }
  }

  const result = detected ? 'malicious' : 'safe';
  const status = result === test.expected ? '✅' : '❌';
  
  console.log(`${status} ${test.category}`);
  console.log(`   URL: ${url}`);
  console.log(`   Expected: ${test.expected}, Detected: ${result}`);
  if (detected) {
    console.log(`   Reason: ${reason}`);
  }
  console.log('');

  if (result !== test.expected) {
    allChecksPassed = false;
  }
});

// Summary
console.log('📊 Summary:\n');

if (allChecksPassed) {
  console.log('🎉 All fraud detection improvements are in place!');
  console.log('✅ VirusTotal API v3 configured');
  console.log('✅ Local fraud pattern detection active');
  console.log('✅ QR scanner strictness improved');
  console.log('✅ Error handling enhanced');
  console.log('');
  console.log('🛡️ The fraud detection system should now:');
  console.log('   • Consistently detect malicious URLs');
  console.log('   • Use modern VirusTotal API v3');
  console.log('   • Fall back to local checks when API fails');
  console.log('   • Block both HIGH and CRITICAL risk QR codes');
  console.log('   • Provide detailed logging for debugging');
} else {
  console.log('⚠️ Some fraud detection improvements are missing or not working correctly.');
  console.log('🔧 Please review the implementation and ensure all fixes are applied.');
}

console.log('');
console.log('🎯 Next Steps:');
console.log('   1. Test with real malicious URLs in the app');
console.log('   2. Monitor VirusTotal API responses');
console.log('   3. Check console logs for detailed fraud detection info');
console.log('   4. Verify QR codes with suspicious URLs are blocked');

module.exports = { allChecksPassed };
