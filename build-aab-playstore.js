#!/usr/bin/env node

/**
 * Shabari AAB Build Script for Google Play Store
 * This script builds the Android App Bundle (AAB) for Play Store submission
 */

const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Starting Shabari AAB Build for Google Play Store...\n');

// Build configuration
const buildProfile = 'playstore';
const platform = 'android';

console.log('📋 Build Configuration:');
console.log(`- Platform: ${platform}`);
console.log(`- Profile: ${buildProfile}`);
console.log(`- Build Type: app-bundle (AAB)`);
console.log(`- Environment: production\n`);

// Execute the build command
const buildCommand = `eas build --platform ${platform} --profile ${buildProfile}`;

console.log('⚙️  Executing build command:');
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
  console.log(data);
});

buildProcess.stderr.on('data', (data) => {
  console.error(data);
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n🎉 AAB build completed successfully!');
    console.log('\n📱 Next Steps:');
    console.log('1. Download the AAB file from the EAS dashboard');
    console.log('2. Upload to Google Play Console');
    console.log('3. Complete the Play Store submission process');
    console.log('\n🔗 Access your build: https://expo.dev/accounts/shubham485/projects/shabari/builds');
  } else {
    console.log(`\n❌ Build process exited with code ${code}`);
  }
});

