#!/usr/bin/env node

/**
 * Shabari APK Build Script for Production
 * This script builds the Android APK for testing and distribution
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📱 Starting Shabari APK Build for Production...\n');

// Build configuration
const buildProfile = 'production';
const platform = 'android';

console.log('📋 Build Configuration:');
console.log(`- Platform: ${platform}`);
console.log(`- Profile: ${buildProfile}`);
console.log(`- Build Type: APK`);
console.log(`- Environment: production\n`);

// Check if eas.json exists
if (!fs.existsSync('eas.json')) {
  console.error('❌ eas.json not found. Please run eas build:configure first.');
  process.exit(1);
}

// Read eas.json to show profile details
try {
  const easConfig = JSON.parse(fs.readFileSync('eas.json', 'utf8'));
  const profileConfig = easConfig.build[buildProfile];
  
  if (profileConfig && profileConfig.android) {
    console.log('⚙️  Profile Configuration:');
    console.log(`- Build Type: ${profileConfig.android.buildType || 'apk'}`);
    console.log(`- Gradle Command: ${profileConfig.android.gradleCommand || 'default'}`);
    console.log(`- Node Version: ${profileConfig.android.node || 'latest'}`);
    console.log(`- Environment Variables: ${Object.keys(profileConfig.android.env || {}).join(', ') || 'none'}\n`);
  }
} catch (error) {
  console.warn('⚠️  Could not read eas.json configuration details');
}

// Execute the build command
const buildCommand = `eas build --platform ${platform} --profile ${buildProfile}`;

console.log('🚀 Executing build command:');
console.log(`${buildCommand}\n`);

const buildProcess = exec(buildCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Build failed with error:', error);
    return;
  }
  
  if (stderr) {
    console.warn('⚠️  Build warnings:', stderr);
  }
  
  console.log('✅ Build output:', stdout);
});

buildProcess.stdout.on('data', (data) => {
  process.stdout.write(data);
});

buildProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n🎉 APK build completed successfully!');
    console.log('\n📱 Next Steps:');
    console.log('1. Download the APK file from the EAS dashboard');
    console.log('2. Install on Android devices for testing');
    console.log('3. Share with beta testers or distribute directly');
    console.log('\n🔗 Access your build: https://expo.dev/accounts/shubham485/projects/shabari/builds');
    
    // Show additional build profiles available
    console.log('\n📋 Other Build Profiles Available:');
    console.log('- preview: eas build --platform android --profile preview');
    console.log('- development: eas build --platform android --profile development');
    console.log('- production-fixed: eas build --platform android --profile production-fixed');
    console.log('- playstore: eas build --platform android --profile playstore (for AAB)');
  } else {
    console.log(`\n❌ Build process exited with code ${code}`);
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Check your internet connection');
    console.log('2. Verify EAS CLI is logged in: eas login');
    console.log('3. Try with cache disabled: eas build --platform android --profile production --clear-cache');
    console.log('4. Check build logs in EAS dashboard for detailed errors');
  }
});
