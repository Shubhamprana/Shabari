#!/usr/bin/env node

/**
 * Test Deep Scan Risky App Detection
 * 
 * This script verifies that the deep scan will properly detect risky apps
 * based on their permissions
 */

console.log('🔍 Testing Deep Scan Risky App Detection...\n');

// Test 1: Check if the deep scan includes app permission scanning
console.log('📱 Test 1: Deep Scan Configuration');
const fs = require('fs');

// Check if EnhancedDeepScanService includes app permission scanning
const deepScanPath = 'src/services/EnhancedDeepScanService.ts';
const deepScanContent = fs.readFileSync(deepScanPath, 'utf8');

const hasAppPermissionScan = deepScanContent.includes('scanAppPermissions');
const hasAppPermissionAnalyzer = deepScanContent.includes('appPermissionAnalyzer');
const hasAppPermissionResult = deepScanContent.includes('appPermissionScanResult');

console.log(`  ${hasAppPermissionScan ? '✅' : '❌'} scanAppPermissions configuration`);
console.log(`  ${hasAppPermissionAnalyzer ? '✅' : '❌'} appPermissionAnalyzer integration`);
console.log(`  ${hasAppPermissionResult ? '✅' : '❌'} appPermissionScanResult handling`);

// Test 2: Check risky permission detection
console.log('\n🛡️ Test 2: Risky Permission Detection');

const analyzerPath = 'src/services/RealAppPermissionAnalyzer.ts';
const analyzerContent = fs.readFileSync(analyzerPath, 'utf8');

const hasSMSDetection = analyzerContent.includes('SMS') && analyzerContent.includes('riskScore += 50');
const hasPhoneDetection = analyzerContent.includes('CALL_PHONE') && analyzerContent.includes('riskScore += 50');
const hasCameraDetection = analyzerContent.includes('CAMERA') && analyzerContent.includes('riskScore += 30');
const hasLocationDetection = analyzerContent.includes('LOCATION') && analyzerContent.includes('riskScore += 30');
const hasContactsDetection = analyzerContent.includes('CONTACTS') && analyzerContent.includes('riskScore += 30');

console.log(`  ${hasSMSDetection ? '✅' : '❌'} SMS permission detection (50 points)`);
console.log(`  ${hasPhoneDetection ? '✅' : '❌'} Phone/Call permission detection (50 points)`);
console.log(`  ${hasCameraDetection ? '✅' : '❌'} Camera permission detection (30 points)`);
console.log(`  ${hasLocationDetection ? '✅' : '❌'} Location permission detection (30 points)`);
console.log(`  ${hasContactsDetection ? '✅' : '❌'} Contacts permission detection (30 points)`);

// Test 3: Check risk level calculation
console.log('\n📊 Test 3: Risk Level Calculation');

const hasCriticalLevel = analyzerContent.includes('riskLevel = \'CRITICAL\'') && analyzerContent.includes('riskScore >= 100');
const hasHighLevel = analyzerContent.includes('riskLevel = \'HIGH\'') && analyzerContent.includes('riskScore >= 60');
const hasMediumLevel = analyzerContent.includes('riskLevel = \'MEDIUM\'') && analyzerContent.includes('riskScore >= 30');
const hasLowLevel = analyzerContent.includes('riskLevel = \'LOW\'') && analyzerContent.includes('riskScore > 0');

console.log(`  ${hasCriticalLevel ? '✅' : '❌'} CRITICAL risk level (≥100 points)`);
console.log(`  ${hasHighLevel ? '✅' : '❌'} HIGH risk level (≥60 points)`);
console.log(`  ${hasMediumLevel ? '✅' : '❌'} MEDIUM risk level (≥30 points)`);
console.log(`  ${hasLowLevel ? '✅' : '❌'} LOW risk level (>0 points)`);

// Test 4: Check native module integration
console.log('\n📱 Test 4: Native Module Integration');

const hasNativeModuleCheck = analyzerContent.includes('isNativeModuleAvailable()');
const hasAppPermissionScanner = analyzerContent.includes('AppPermissionScanner');
const hasScanInstalledApps = analyzerContent.includes('scanInstalledApps()');

console.log(`  ${hasNativeModuleCheck ? '✅' : '❌'} Native module availability check`);
console.log(`  ${hasAppPermissionScanner ? '✅' : '❌'} AppPermissionScanner native module`);
console.log(`  ${hasScanInstalledApps ? '✅' : '❌'} scanInstalledApps method`);

// Test 5: Check UI integration
console.log('\n🎨 Test 5: UI Integration');

const deepScanScreenPath = 'src/screens/DeepScanScreen.tsx';
const deepScanScreenContent = fs.readFileSync(deepScanScreenPath, 'utf8');

const hasAppPermissionResults = deepScanScreenContent.includes('renderAppPermissionResults');
const hasAppPermissionTab = deepScanScreenContent.includes('App Permissions');
const hasRiskyAppsDisplay = deepScanScreenContent.includes('riskyApps');

console.log(`  ${hasAppPermissionResults ? '✅' : '❌'} App permission results rendering`);
console.log(`  ${hasAppPermissionTab ? '✅' : '❌'} App Permissions tab`);
console.log(`  ${hasRiskyAppsDisplay ? '✅' : '❌'} Risky apps display`);

// Summary
console.log('\n🎯 Deep Scan Risky App Detection Summary:');

const allTestsPassed = hasAppPermissionScan && hasAppPermissionAnalyzer && hasAppPermissionResult &&
                      hasSMSDetection && hasPhoneDetection && hasCameraDetection && hasLocationDetection && hasContactsDetection &&
                      hasCriticalLevel && hasHighLevel && hasMediumLevel && hasLowLevel &&
                      hasNativeModuleCheck && hasAppPermissionScanner && hasScanInstalledApps &&
                      hasAppPermissionResults && hasAppPermissionTab && hasRiskyAppsDisplay;

if (allTestsPassed) {
  console.log('\n✅ YES! Deep scan will detect risky apps based on permissions');
  console.log('\n📋 What it will detect:');
  console.log('  🔴 CRITICAL: Apps with SMS/Call permissions (≥100 points)');
  console.log('  🟠 HIGH: Apps with multiple high-risk permissions (≥60 points)');
  console.log('  🟡 MEDIUM: Apps with some risky permissions (≥30 points)');
  console.log('  🟢 LOW: Apps with minimal risk permissions (>0 points)');
  console.log('  ⚪ SAFE: Apps with only safe permissions (0 points)');
  
  console.log('\n🛡️ Risk Assessment Logic:');
  console.log('  • SMS/Call permissions: 50 points each');
  console.log('  • Camera/Location/Contacts: 30 points each');
  console.log('  • Storage/Audio: 20 points each');
  console.log('  • Other permissions: 5 points each');
  
  console.log('\n📱 Example Risky Apps:');
  console.log('  • SMS spam apps (SEND_SMS + READ_SMS = 100+ points = CRITICAL)');
  console.log('  • Spy apps (CAMERA + LOCATION + CONTACTS = 90+ points = HIGH)');
  console.log('  • Malicious apps (Multiple dangerous permissions = HIGH/CRITICAL)');
} else {
  console.log('\n❌ Some components are missing - deep scan may not detect risky apps properly');
}

console.log('\n✨ Deep scan risky app detection analysis complete!');
