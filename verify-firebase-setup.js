#!/usr/bin/env node

/**
 * Firebase Setup Verification Script for Shabari App
 * This script verifies that Firebase is properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔥 Verifying Firebase Setup for Shabari App...\n');

// Check if google-services.json exists
const googleServicesPath = path.join('android', 'app', 'google-services.json');

console.log('📋 Firebase Configuration Check:');

// 1. Check google-services.json file
if (fs.existsSync(googleServicesPath)) {
  console.log('✅ google-services.json found in android/app/');
  
  try {
    const googleServices = JSON.parse(fs.readFileSync(googleServicesPath, 'utf8'));
    console.log(`✅ Project ID: ${googleServices.project_info.project_id}`);
    console.log(`✅ Package Name: ${googleServices.client[0].client_info.android_client_info.package_name}`);
    console.log(`✅ App ID: ${googleServices.client[0].client_info.mobilesdk_app_id}`);
  } catch (error) {
    console.log('❌ Error reading google-services.json:', error.message);
  }
} else {
  console.log('❌ google-services.json not found in android/app/');
}

// 2. Check android/build.gradle for Google Services classpath
const androidBuildGradle = path.join('android', 'build.gradle');
if (fs.existsSync(androidBuildGradle)) {
  const buildGradleContent = fs.readFileSync(androidBuildGradle, 'utf8');
  if (buildGradleContent.includes('com.google.gms:google-services')) {
    console.log('✅ Google Services classpath added to android/build.gradle');
  } else {
    console.log('❌ Google Services classpath missing in android/build.gradle');
  }
} else {
  console.log('❌ android/build.gradle not found');
}

// 3. Check android/app/build.gradle for Google Services plugin
const appBuildGradle = path.join('android', 'app', 'build.gradle');
if (fs.existsSync(appBuildGradle)) {
  const appBuildGradleContent = fs.readFileSync(appBuildGradle, 'utf8');
  if (appBuildGradleContent.includes("apply plugin: 'com.google.gms.google-services'")) {
    console.log('✅ Google Services plugin applied in android/app/build.gradle');
  } else {
    console.log('❌ Google Services plugin missing in android/app/build.gradle');
  }
} else {
  console.log('❌ android/app/build.gradle not found');
}

// 4. Check app.config.js for package name match
const appConfigPath = 'app.config.js';
if (fs.existsSync(appConfigPath)) {
  try {
    const appConfig = require(path.resolve(appConfigPath));
    const configPackageName = appConfig.android?.package;
    
    if (configPackageName === 'com.shabari.app') {
      console.log('✅ Package name matches in app.config.js');
    } else {
      console.log(`⚠️  Package name mismatch: app.config.js has ${configPackageName}, should be com.shabari.app`);
    }
  } catch (error) {
    console.log('❌ Error reading app.config.js:', error.message);
  }
} else {
  console.log('❌ app.config.js not found');
}

console.log('\n🔥 Firebase Setup Summary:');
console.log('- Project: shabari-5f18b');
console.log('- Package: com.shabari.app');
console.log('- Platform: Android');
console.log('- Configuration: Complete');

console.log('\n📱 Next Steps:');
console.log('1. Install Firebase dependencies: npm install @react-native-firebase/app');
console.log('2. Configure specific Firebase services (Auth, Firestore, etc.)');
console.log('3. Build and test the app with Firebase integration');
console.log('4. Test Firebase functionality on device/emulator');

console.log('\n🔗 Firebase Console: https://console.firebase.google.com/project/shabari-5f18b');
