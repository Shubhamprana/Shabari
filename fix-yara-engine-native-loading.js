#!/usr/bin/env node

/**
 * 🔧 Fix YARA Engine Native Loading
 * 
 * This script fixes the YARA engine native loading issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing YARA Engine Native Loading');
console.log('===================================\n');

// Fix 1: Ensure YARA engine is properly registered in MainApplication
console.log('1️⃣ Ensuring YARA Package Registration...');
try {
  const mainApplicationPath = 'android/app/src/main/java/com/shabari/app/MainApplication.kt';
  let content = fs.readFileSync(mainApplicationPath, 'utf8');
  
  // Check if YaraPackage is already imported and registered
  if (!content.includes('import com.shabari.yara.YaraPackage')) {
    // Add import
    const importLine = 'import expo.modules.ReactNativeHostWrapper';
    const yaraImport = 'import expo.modules.ReactNativeHostWrapper\nimport com.shabari.yara.YaraPackage';
    content = content.replace(importLine, yaraImport);
    console.log('✅ Added YaraPackage import');
  } else {
    console.log('✅ YaraPackage import already exists');
  }
  
  if (!content.includes('packages.add(YaraPackage())')) {
    // Add package registration
    const packagesLine = 'val packages = PackageList(this).packages';
    const yaraRegistration = 'val packages = PackageList(this).packages\n            packages.add(YaraPackage())';
    content = content.replace(packagesLine, yaraRegistration);
    console.log('✅ Added YaraPackage registration');
  } else {
    console.log('✅ YaraPackage registration already exists');
  }
  
  fs.writeFileSync(mainApplicationPath, content);
  console.log('✅ MainApplication.kt updated successfully');
} catch (error) {
  console.log('❌ Error updating MainApplication.kt:', error.message);
}

// Fix 2: Ensure YARA engine plugin is properly configured
console.log('\n2️⃣ Checking YARA Engine Plugin Configuration...');
try {
  const appConfigPath = 'app.config.js';
  let content = fs.readFileSync(appConfigPath, 'utf8');
  
  if (!content.includes('./react-native-yara-engine/app.plugin.js')) {
    console.log('❌ YARA engine plugin not found in app.config.js');
    console.log('   Please add: "./react-native-yara-engine/app.plugin.js" to plugins array');
  } else {
    console.log('✅ YARA engine plugin configured in app.config.js');
  }
} catch (error) {
  console.log('❌ Error checking app.config.js:', error.message);
}

// Fix 3: Ensure ProGuard rules are protecting YARA classes
console.log('\n3️⃣ Checking ProGuard Rules...');
try {
  const proguardPath = 'proguard-rules.pro';
  let content = fs.readFileSync(proguardPath, 'utf8');
  
  const yaraRules = [
    '# Keep YARA Engine Native Module',
    '-keep class com.shabari.yara.** { *; }',
    '-keepclassmembers class com.shabari.yara.** { *; }',
    '-dontwarn com.shabari.yara.**'
  ];
  
  let needsUpdate = false;
  yaraRules.forEach(rule => {
    if (!content.includes(rule)) {
      needsUpdate = true;
    }
  });
  
  if (needsUpdate) {
    content += '\n\n# YARA Engine Protection\n' + yaraRules.join('\n') + '\n';
    fs.writeFileSync(proguardPath, content);
    console.log('✅ ProGuard rules updated for YARA engine');
  } else {
    console.log('✅ ProGuard rules already protect YARA engine');
  }
} catch (error) {
  console.log('❌ Error updating ProGuard rules:', error.message);
}

// Fix 4: Verify native libraries exist and are valid
console.log('\n4️⃣ Verifying Native Libraries...');
try {
  const jniLibsPath = 'react-native-yara-engine/android/src/main/jniLibs';
  const arm64Path = path.join(jniLibsPath, 'arm64-v8a', 'libyara-engine.so');
  const armv7Path = path.join(jniLibsPath, 'armeabi-v7a', 'libyara-engine.so');
  
  if (fs.existsSync(arm64Path)) {
    const stats = fs.statSync(arm64Path);
    console.log(`✅ ARM64 library exists (${(stats.size / 1024).toFixed(2)} KB)`);
    
    if (stats.size < 1000) {
      console.log('⚠️  WARNING: ARM64 library is very small, might be corrupted');
    }
  } else {
    console.log('❌ ARM64 library not found');
  }
  
  if (fs.existsSync(armv7Path)) {
    const stats = fs.statSync(armv7Path);
    console.log(`✅ ARMv7 library exists (${(stats.size / 1024).toFixed(2)} KB)`);
    
    if (stats.size < 1000) {
      console.log('⚠️  WARNING: ARMv7 library is very small, might be corrupted');
    }
  } else {
    console.log('❌ ARMv7 library not found');
  }
} catch (error) {
  console.log('❌ Error checking native libraries:', error.message);
}

// Fix 5: Check if the issue is in the YARA engine initialization
console.log('\n5️⃣ Checking YARA Engine Initialization...');
try {
  const yaraEnginePath = 'react-native-yara-engine/android/src/main/java/com/shabari/yara/YaraEngine.java';
  let content = fs.readFileSync(yaraEnginePath, 'utf8');
  
  // Check if the static block is properly handling library loading
  if (content.includes('System.loadLibrary("yara-engine")')) {
    console.log('✅ System.loadLibrary call found');
  } else {
    console.log('❌ System.loadLibrary call NOT found');
  }
  
  // Check if error handling is proper
  if (content.includes('UnsatisfiedLinkError')) {
    console.log('✅ UnsatisfiedLinkError handling found');
  } else {
    console.log('❌ UnsatisfiedLinkError handling NOT found');
  }
  
  // Check if the native library availability check is working
  if (content.includes('isNativeLibraryAvailable()')) {
    console.log('✅ Native library availability check found');
  } else {
    console.log('❌ Native library availability check NOT found');
  }
} catch (error) {
  console.log('❌ Error checking YARA engine:', error.message);
}

console.log('\n🎯 SUMMARY');
console.log('==========');
console.log('The YARA engine should now be properly configured. If it\'s still showing as "Mock":');
console.log('1. The native libraries might be corrupted - try rebuilding them');
console.log('2. The device architecture might not match the libraries');
console.log('3. The APK might not include the native libraries');
console.log('4. Test on a physical device (not emulator)');
console.log('5. Check Android logs for UnsatisfiedLinkError');

console.log('\n🚀 NEXT STEPS');
console.log('=============');
console.log('1. Clean and rebuild the project');
console.log('2. Test on a physical Android device');
console.log('3. Check the app logs for YARA engine status');
console.log('4. If still showing "Mock", the native libraries need to be rebuilt');

