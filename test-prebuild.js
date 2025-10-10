#!/usr/bin/env node

/**
 * Test Prebuild Fix Script
 * This script tests if the prebuild issue is fixed
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing prebuild fix...');

try {
  // Clean android directory if it exists
  const androidDir = path.join(process.cwd(), 'android');
  if (fs.existsSync(androidDir)) {
    console.log('🧹 Cleaning existing android directory...');
    fs.rmSync(androidDir, { recursive: true, force: true });
  }

  // Test prebuild
  console.log('🚀 Running expo prebuild...');
  execSync('npx expo prebuild --platform android --no-install', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('✅ Prebuild successful! The platformProjectRoot issue is fixed.');
  console.log('');
  console.log('🎉 Next steps:');
  console.log('1. Run: npx eas build -p android --profile production');
  console.log('2. This will create a production APK with all features working');

} catch (error) {
  console.error('❌ Prebuild failed:', error.message);
  console.log('');
  console.log('🔧 If you still get platformProjectRoot errors:');
  console.log('1. Check that react-native-yara-engine/app.plugin.js uses config.modRequest.projectRoot');
  console.log('2. Make sure all path references are correct');
  console.log('3. Try running: npm install && npx expo prebuild --platform android');
}
