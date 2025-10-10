#!/usr/bin/env node

/**
 * Shabari APK Build Script with AdMob Integration
 * This script builds the Android APK with Google AdMob ads included
 */

const { exec } = require('child_process');
const fs = require('fs');

console.log('📱💰 Building Shabari APK with Google AdMob Integration...\n');

// Verify AdMob configuration
const verifyAdMobConfig = () => {
  console.log('🔍 Verifying AdMob Configuration...');
  
  // Check app.config.js
  try {
    const appConfig = require('./app.config.js');
    const adMobAppId = appConfig.android?.config?.googleMobileAdsAppId;
    
    if (adMobAppId && adMobAppId.includes('ca-app-pub-6266678397865252')) {
      console.log('✅ AdMob App ID configured:', adMobAppId);
    } else {
      console.warn('⚠️  AdMob App ID not found or incorrect');
    }
  } catch (error) {
    console.error('❌ Error reading app.config.js:', error.message);
  }
  
  // Check if AdMob components exist
  const bannerComponent = './src/components/AdMobBanner.tsx';
  const interstitialComponent = './src/components/AdMobInterstitial.tsx';
  
  if (fs.existsSync(bannerComponent)) {
    console.log('✅ AdMob Banner component found');
  } else {
    console.warn('⚠️  AdMob Banner component missing');
  }
  
  if (fs.existsSync(interstitialComponent)) {
    console.log('✅ AdMob Interstitial component found');
  } else {
    console.warn('⚠️  AdMob Interstitial component missing');
  }
  
  console.log('');
};

// Build configuration options
const buildProfiles = {
  development: {
    profile: 'development',
    description: 'Development build with test ads',
    adType: 'Test Ad Units (Google Test IDs)'
  },
  production: {
    profile: 'production',
    description: 'Production build with real ads',
    adType: 'Real Ad Units (Your AdMob IDs)'
  },
  playstore: {
    profile: 'playstore',
    description: 'Play Store AAB with real ads',
    adType: 'Real Ad Units (Your AdMob IDs)'
  }
};

// Get build profile from command line or default to production
const profileArg = process.argv[2];
const selectedProfile = buildProfiles[profileArg] || buildProfiles.production;

console.log('📋 Build Configuration:');
console.log(`- Profile: ${selectedProfile.profile}`);
console.log(`- Description: ${selectedProfile.description}`);
console.log(`- Ad Type: ${selectedProfile.adType}`);
console.log(`- Platform: Android`);
console.log('');

// Verify configuration
verifyAdMobConfig();

// Build command
const buildCommand = `eas build --platform android --profile ${selectedProfile.profile} --clear-cache`;

console.log('🚀 Starting build with AdMob integration...');
console.log(`Command: ${buildCommand}\n`);

console.log('💡 AdMob Features Included:');
console.log('- Banner ads at bottom of Dashboard');
console.log('- Interstitial ads after scan actions');
console.log('- Automatic test/production ad switching');
console.log('- Error handling for ad failures');
console.log('- Firebase integration maintained\n');

// Execute build
const buildProcess = exec(buildCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Build failed:', error);
    return;
  }
  
  if (stderr) {
    console.warn('⚠️  Build warnings:', stderr);
  }
});

buildProcess.stdout.on('data', (data) => {
  process.stdout.write(data);
});

buildProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n🎉 AdMob-enabled APK build completed successfully!');
    console.log('\n📱 Your app now includes:');
    console.log('✅ Google AdMob integration');
    console.log('✅ Firebase configuration');
    console.log('✅ All security features');
    console.log('✅ Production signing');
    
    console.log('\n💰 AdMob Revenue Features:');
    console.log('- Banner ads for continuous revenue');
    console.log('- Interstitial ads for higher eCPM');
    console.log('- Smart ad unit switching (test/prod)');
    console.log('- AdMob console integration ready');
    
    console.log('\n🔗 Next Steps:');
    console.log('1. Download APK from EAS dashboard');
    console.log('2. Test ads on device');
    console.log('3. Monitor AdMob console for ad performance');
    console.log('4. Submit to Play Store');
    
    console.log('\n📊 AdMob Console: https://apps.admob.com/');
    console.log('🔗 EAS Builds: https://expo.dev/accounts/shubham485/projects/shabari/builds');
  } else {
    console.error(`\n❌ Build failed with exit code ${code}`);
    console.log('\n🔧 Troubleshooting:');
    console.log('- Check AdMob configuration in app.config.js');
    console.log('- Verify expo-ads-admob package is installed');
    console.log('- Check EAS build logs for detailed errors');
    console.log('- Ensure Firebase integration is working');
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⏹️  Build process interrupted');
  buildProcess.kill();
  process.exit(1);
});
