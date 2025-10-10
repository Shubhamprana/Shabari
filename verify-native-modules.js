#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Native Modules Configuration...\n');

let allGood = true;

// Check 1: MainApplication.kt has both packages
console.log('1️⃣ Checking MainApplication.kt...');
const mainAppPath = 'android/app/src/main/java/com/shabari/app/MainApplication.kt';
if (fs.existsSync(mainAppPath)) {
  const content = fs.readFileSync(mainAppPath, 'utf-8');
  const hasYaraImport = content.includes('import com.shabari.yara.YaraPackage');
  const hasProxyImport = content.includes('import com.reactnativeproxyengine.ReactNativeProxyEnginePackage');
  const hasYaraPackage = content.includes('packages.add(YaraPackage())');
  const hasProxyPackage = content.includes('packages.add(ReactNativeProxyEnginePackage())');
  
  console.log(`   ✅ YARA import: ${hasYaraImport ? '✓' : '❌'}`);
  console.log(`   ✅ Proxy import: ${hasProxyImport ? '✓' : '❌'}`);
  console.log(`   ✅ YARA package: ${hasYaraPackage ? '✓' : '❌'}`);
  console.log(`   ✅ Proxy package: ${hasProxyPackage ? '✓' : '❌'}`);
  
  if (!hasYaraImport || !hasProxyImport || !hasYaraPackage || !hasProxyPackage) {
    allGood = false;
  }
} else {
  console.log('   ❌ MainApplication.kt not found');
  allGood = false;
}

// Check 2: settings.gradle includes both modules
console.log('\n2️⃣ Checking settings.gradle...');
const settingsPath = 'android/settings.gradle';
if (fs.existsSync(settingsPath)) {
  const content = fs.readFileSync(settingsPath, 'utf-8');
  const hasYaraInclude = content.includes("include ':react-native-yara-engine'");
  const hasProxyInclude = content.includes("include ':react-native-proxy-engine'");
  
  console.log(`   ✅ YARA include: ${hasYaraInclude ? '✓' : '❌'}`);
  console.log(`   ✅ Proxy include: ${hasProxyInclude ? '✓' : '❌'}`);
  
  if (!hasYaraInclude || !hasProxyInclude) {
    allGood = false;
  }
} else {
  console.log('   ❌ settings.gradle not found');
  allGood = false;
}

// Check 3: app/build.gradle has dependencies
console.log('\n3️⃣ Checking app/build.gradle...');
const buildGradlePath = 'android/app/build.gradle';
if (fs.existsSync(buildGradlePath)) {
  const content = fs.readFileSync(buildGradlePath, 'utf-8');
  const hasYaraDep = content.includes("implementation project(':react-native-yara-engine')");
  const hasProxyDep = content.includes("implementation project(':react-native-proxy-engine')");
  
  console.log(`   ✅ YARA dependency: ${hasYaraDep ? '✓' : '❌'}`);
  console.log(`   ✅ Proxy dependency: ${hasProxyDep ? '✓' : '❌'}`);
  
  if (!hasYaraDep || !hasProxyDep) {
    allGood = false;
  }
} else {
  console.log('   ❌ app/build.gradle not found');
  allGood = false;
}

// Check 4: Native module files exist
console.log('\n4️⃣ Checking native module files...');
const yaraPackagePath = 'react-native-yara-engine/android/src/main/java/com/shabari/yara/YaraPackage.java';
const proxyPackagePath = 'react-native-proxy-engine/android/app/src/main/java/com/reactnativeproxyengine/ReactNativeProxyEnginePackage.kt';

const yaraPackageExists = fs.existsSync(yaraPackagePath);
const proxyPackageExists = fs.existsSync(proxyPackagePath);

console.log(`   ✅ YARA Package: ${yaraPackageExists ? '✓' : '❌'}`);
console.log(`   ✅ Proxy Package: ${proxyPackageExists ? '✓' : '❌'}`);

if (!yaraPackageExists || !proxyPackageExists) {
  allGood = false;
}

// Check 5: AAR file exists
console.log('\n5️⃣ Checking AAR file...');
const aarPath = 'react-native-yara-engine/dist/react-native-yara-engine-1.0.0.aar';
const aarExists = fs.existsSync(aarPath);
console.log(`   ✅ YARA AAR: ${aarExists ? '✓' : '❌'}`);

if (!aarExists) {
  allGood = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('🎉 ALL CHECKS PASSED! Native modules are properly configured.');
  console.log('✅ YARA Engine: Ready');
  console.log('✅ Proxy Engine: Ready');
  console.log('\n📱 You can now build with: npx eas build -p android --profile production');
} else {
  console.log('❌ SOME CHECKS FAILED! Please fix the issues above.');
}
console.log('='.repeat(50));
