#!/usr/bin/env node

/**
 * Check EAS Build Status for Shabari APK
 * Monitors the current build progress
 */

const { execSync } = require('child_process');

console.log('📊 Checking EAS Build Status for Shabari v1.1.0\n');

try {
  console.log('🔍 Fetching latest builds...\n');
  execSync('eas build:list --platform android --limit 5', { stdio: 'inherit' });
  
  console.log('\n📱 To download your APK when ready:');
  console.log('1. Go to: https://expo.dev/accounts/shubham485/projects/shabari/builds');
  console.log('2. Find the latest build with status "FINISHED"');
  console.log('3. Click "Download" to get the APK file');
  console.log('4. Share with testers or install on your device');
  
  console.log('\n⏳ Build typically takes 10-15 minutes');
  console.log('📧 You\'ll receive an email notification when complete');
  
} catch (error) {
  console.error('❌ Error checking build status:', error.message);
  console.log('\n🔧 Alternative: Check manually at');
  console.log('   https://expo.dev/accounts/shubham485/projects/shabari/builds');
}
