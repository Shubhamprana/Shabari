#!/usr/bin/env node

/**
 * 🔍 YARA Engine Build Verification
 * 
 * This script verifies that the YARA engine is properly included in the build
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 YARA Engine Build Verification');
console.log('==================================\n');

// Check if YARA engine is in the APK
console.log('1️⃣ Checking if YARA engine is included in the build...');

// Check if the native libraries are in the correct location
const jniLibsPath = 'react-native-yara-engine/android/src/main/jniLibs';
const arm64Path = path.join(jniLibsPath, 'arm64-v8a');
const armv7Path = path.join(jniLibsPath, 'armeabi-v7a');

try {
  if (fs.existsSync(arm64Path)) {
    const files = fs.readdirSync(arm64Path);
    const yaraLib = files.find(f => f.includes('yara'));
    if (yaraLib) {
      console.log('✅ ARM64 YARA library found:', yaraLib);
    } else {
      console.log('❌ ARM64 YARA library NOT found');
    }
  }
  
  if (fs.existsSync(armv7Path)) {
    const files = fs.readdirSync(armv7Path);
    const yaraLib = files.find(f => f.includes('yara'));
    if (yaraLib) {
      console.log('✅ ARMv7 YARA library found:', yaraLib);
    } else {
      console.log('❌ ARMv7 YARA library NOT found');
    }
  }
} catch (error) {
  console.log('❌ Error checking native libraries:', error.message);
}

console.log('\n🎯 VERIFICATION COMPLETE');
console.log('=========================');
console.log('If YARA libraries are found, they should be included in the APK.');
console.log('If they are missing, the build process is not including them.');
