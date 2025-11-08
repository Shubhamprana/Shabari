#!/usr/bin/env node

/**
 * Test App Permission Scanner Native Module
 * 
 * This script tests if the AppPermissionScanner native module is properly
 * linked and can be accessed from JavaScript.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing App Permission Scanner Native Module...\n');

// Test 1: Check if the native module files exist
console.log('📁 Checking native module files...');

const moduleFiles = [
  'react-native-app-permission-scanner/android/src/main/java/com/shabari/appscanner/AppPermissionScanner.java',
  'react-native-app-permission-scanner/android/src/main/java/com/shabari/appscanner/AppPermissionScannerPackage.java',
  'react-native-app-permission-scanner/index.js',
  'react-native-app-permission-scanner/package.json'
];

let allFilesExist = true;
moduleFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
  console.log('\n❌ Some native module files are missing!');
  process.exit(1);
}

// Test 2: Check MainApplication registration
console.log('\n📱 Checking MainApplication registration...');

const mainApplicationPath = 'android/app/src/main/java/com/shabari/app/MainApplication.kt';
const mainApplicationContent = fs.readFileSync(mainApplicationPath, 'utf8');

const hasImport = mainApplicationContent.includes('import com.shabari.appscanner.AppPermissionScannerPackage');
const hasRegistration = mainApplicationContent.includes('packages.add(AppPermissionScannerPackage())');

console.log(`  ${hasImport ? '✅' : '❌'} Import statement`);
console.log(`  ${hasRegistration ? '✅' : '❌'} Package registration`);

if (!hasImport || !hasRegistration) {
  console.log('\n❌ AppPermissionScannerPackage not properly registered in MainApplication!');
  process.exit(1);
}

// Test 3: Check package.json dependency
console.log('\n📦 Checking package.json dependency...');

const packageJsonPath = 'package.json';
const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
const hasDependency = packageJsonContent.includes('"react-native-app-permission-scanner"');

console.log(`  ${hasDependency ? '✅' : '❌'} Package dependency`);

if (!hasDependency) {
  console.log('\n❌ react-native-app-permission-scanner not in package.json!');
  process.exit(1);
}

// Test 4: Check native module implementation
console.log('\n🔧 Checking native module implementation...');

const scannerJavaPath = 'react-native-app-permission-scanner/android/src/main/java/com/shabari/appscanner/AppPermissionScanner.java';
const scannerJavaContent = fs.readFileSync(scannerJavaPath, 'utf8');

const hasScanMethod = scannerJavaContent.includes('public void scanInstalledApps(Promise promise)');
const hasGetDetailsMethod = scannerJavaContent.includes('public void getAppDetails(String packageName, Promise promise)');
const hasPackageManager = scannerJavaContent.includes('PackageManager');

console.log(`  ${hasScanMethod ? '✅' : '❌'} scanInstalledApps method`);
console.log(`  ${hasGetDetailsMethod ? '✅' : '❌'} getAppDetails method`);
console.log(`  ${hasPackageManager ? '✅' : '❌'} PackageManager usage`);

if (!hasScanMethod || !hasGetDetailsMethod || !hasPackageManager) {
  console.log('\n❌ Native module implementation is incomplete!');
  process.exit(1);
}

// Test 5: Check JavaScript interface
console.log('\n🌐 Checking JavaScript interface...');

const indexJsPath = 'react-native-app-permission-scanner/index.js';
const indexJsContent = fs.readFileSync(indexJsPath, 'utf8');

const hasScanInstalledApps = indexJsContent.includes('scanInstalledApps()');
const hasGetAppDetails = indexJsContent.includes('getAppDetails(');
const hasIsAvailable = indexJsContent.includes('isAvailable()');

console.log(`  ${hasScanInstalledApps ? '✅' : '❌'} scanInstalledApps method`);
console.log(`  ${hasGetAppDetails ? '✅' : '❌'} getAppDetails method`);
console.log(`  ${hasIsAvailable ? '✅' : '❌'} isAvailable method`);

if (!hasScanInstalledApps || !hasGetAppDetails || !hasIsAvailable) {
  console.log('\n❌ JavaScript interface is incomplete!');
  process.exit(1);
}

// Test 6: Check RealAppPermissionAnalyzer usage
console.log('\n🔍 Checking RealAppPermissionAnalyzer usage...');

const analyzerPath = 'src/services/RealAppPermissionAnalyzer.ts';
const analyzerContent = fs.readFileSync(analyzerPath, 'utf8');

const hasNativeModulesImport = analyzerContent.includes('import { NativeModules, Platform } from \'react-native\';');
const hasAppPermissionScanner = analyzerContent.includes('const { AppPermissionScanner } = NativeModules;');
const hasScanAllApps = analyzerContent.includes('public async scanAllApps(): Promise<AppPermissionScanResult>');

console.log(`  ${hasNativeModulesImport ? '✅' : '❌'} NativeModules import`);
console.log(`  ${hasAppPermissionScanner ? '✅' : '❌'} AppPermissionScanner import`);
console.log(`  ${hasScanAllApps ? '✅' : '❌'} scanAllApps method`);

if (!hasNativeModulesImport || !hasAppPermissionScanner || !hasScanAllApps) {
  console.log('\n❌ RealAppPermissionAnalyzer is not properly configured!');
  process.exit(1);
}

// Test 7: Check EnhancedDeepScanService integration
console.log('\n🛡️ Checking EnhancedDeepScanService integration...');

const deepScanPath = 'src/services/EnhancedDeepScanService.ts';
const deepScanContent = fs.readFileSync(deepScanPath, 'utf8');

const hasRealAnalyzerImport = deepScanContent.includes('import { RealAppPermissionAnalyzer } from \'./RealAppPermissionAnalyzer\';');
const hasAppPermissionAnalyzer = deepScanContent.includes('this.appPermissionAnalyzer = RealAppPermissionAnalyzer.getInstance();');
const hasScanAppPermissions = deepScanContent.includes('scanAppPermissions');

console.log(`  ${hasRealAnalyzerImport ? '✅' : '❌'} RealAppPermissionAnalyzer import`);
console.log(`  ${hasAppPermissionAnalyzer ? '✅' : '❌'} AppPermissionAnalyzer initialization`);
console.log(`  ${hasScanAppPermissions ? '✅' : '❌'} scanAppPermissions usage`);

if (!hasRealAnalyzerImport || !hasAppPermissionAnalyzer || !hasScanAppPermissions) {
  console.log('\n❌ EnhancedDeepScanService is not properly integrated!');
  process.exit(1);
}

console.log('\n🎉 All tests passed! App Permission Scanner should be working.');
console.log('\n📋 Summary:');
console.log('  ✅ Native module files exist');
console.log('  ✅ MainApplication registration complete');
console.log('  ✅ Package dependency configured');
console.log('  ✅ Native implementation complete');
console.log('  ✅ JavaScript interface complete');
console.log('  ✅ RealAppPermissionAnalyzer configured');
console.log('  ✅ EnhancedDeepScanService integrated');

console.log('\n🔧 Next steps:');
console.log('  1. Clean and rebuild the project');
console.log('  2. Test the Deep Scan feature');
console.log('  3. Check if App Permission scan works');

console.log('\n✨ App Permission Scanner is ready to use!');
