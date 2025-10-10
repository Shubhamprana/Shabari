#!/usr/bin/env node

/**
 * Streamlined Play Store AAB Builder
 * Creates AAB by temporarily removing problematic native modules
 * Focus: Get working AAB for Play Store submission
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🏪 Streamlined Play Store AAB Builder v1.1.0');
console.log('============================================\n');

async function buildStreamlinedAAB() {
  // Backup original files
  const originalAppConfig = fs.readFileSync('app.config.js', 'utf8');

  try {
    console.log('🔧 Step 1: Creating streamlined configuration...');
    
    // Create minimal config WITHOUT problematic native modules
    const streamlinedConfig = `module.exports = {
  "name": "Shabari",
  "slug": "shabari",
  "version": "1.1.0",
  "platforms": ["android"],
  "orientation": "portrait",
  "icon": "./assets/images/icon.png",
  "userInterfaceStyle": "light",
  "splash": {
    "image": "./assets/images/splash-icon.png",
    "resizeMode": "contain",
    "backgroundColor": "#1e3a8a"
  },
  "assetBundlePatterns": ["**/*"],
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/images/adaptive-icon.png",
      "backgroundColor": "#1e3a8a"
    },
    "package": "com.shabari.app",
    "versionCode": 2,
    "privacyPolicy": "https://shubham485.github.io/shabari-privacy-policy/",
    "permissions": [
      "android.permission.CAMERA",
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE",
      "android.permission.POST_NOTIFICATIONS"
    ]
  },
  "plugins": [
    "expo-dev-client",
    "expo-notifications",
    ["expo-image-picker", {
      "photosPermission": "The app accesses your photos to scan suspicious images.",
      "cameraPermission": "The app accesses your camera to capture screenshots."
    }],
    ["expo-barcode-scanner", {
      "cameraPermission": "The app uses the camera to scan QR codes."
    }],
    ["expo-build-properties", {
      "android": {
        "minSdkVersion": 24,
        "compileSdkVersion": 35,
        "targetSdkVersion": 34,
        "enableProguardInReleaseBuilds": true
      }
    }]
  ],
  "extra": {
    "eas": {
      "projectId": "a5b60fe3-2158-436e-8e45-9ce4ce5dd772"
    }
  }
};`;

    fs.writeFileSync('app.config.js', streamlinedConfig);
    console.log('✅ Streamlined configuration created (native modules temporarily removed)');

    console.log('\n🌍 Step 2: Setting production environment...');
    fs.writeFileSync('.env', `NODE_ENV=production
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_STREAMLINED_BUILD=true`);
    console.log('✅ Production environment set');

    console.log('\n🚀 Step 3: Building streamlined AAB...');
    console.log('📱 Building for Play Store (this should work without native module issues)');
    console.log('⏳ Estimated time: 5-8 minutes\n');

    // Try the most reliable build profile
    execSync('eas build --platform android --profile playstore-aab --non-interactive', {
      stdio: 'inherit'
    });

    console.log('\n🎉 SUCCESS! Streamlined AAB created for Play Store');
    console.log('\n📦 Your AAB includes:');
    console.log('✅ Core document scanning');
    console.log('✅ URL protection');
    console.log('✅ QR code scanning');
    console.log('✅ Image analysis');
    console.log('✅ Authentication system');
    console.log('✅ Premium features');
    console.log('✅ Clean Material Design UI');
    
    console.log('\n⚠️ Temporarily excluded (will add in v1.2.0):');
    console.log('❌ Advanced call protection (native module issues)');
    console.log('❌ YARA malware engine (C++ compilation issues)');
    
    console.log('\n📥 Download your AAB:');
    console.log('https://expo.dev/accounts/shubhamprana123/projects/shabari/builds');
    
    console.log('\n🏪 Ready for Play Store submission!');

  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    console.log('\n🔧 Trying alternative approach...');
    
    try {
      console.log('📱 Attempting with development profile...');
      execSync('eas build --platform android --profile development --non-interactive', {
        stdio: 'inherit'
      });
      console.log('✅ Development AAB created successfully!');
    } catch (devError) {
      console.error('❌ All build attempts failed');
      console.log('\n💡 Manual options:');
      console.log('1. Try: eas build --platform android --profile playstore');
      console.log('2. Check EAS dashboard for detailed logs');
      console.log('3. Consider local build with Android Studio');
    }
    
  } finally {
    console.log('\n🔄 Restoring original configuration...');
    fs.writeFileSync('app.config.js', originalAppConfig);
    console.log('✅ Original config restored');
  }
}

buildStreamlinedAAB();

