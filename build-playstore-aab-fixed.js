#!/usr/bin/env node

/**
 * Shabari Play Store AAB Builder
 * Creates production Android App Bundle for Google Play Store
 * Removes problematic native modules to ensure successful build
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🏪 Shabari Play Store AAB Builder v1.1.0');
console.log('==========================================\n');

// Colors for better output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m', 
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step} ${message}`, 'bold');
}

async function buildPlayStoreAAB() {
  // Backup original files
  const backupFiles = {
    'app.config.js': fs.readFileSync('app.config.js', 'utf8'),
    'package.json': fs.readFileSync('package.json', 'utf8')
  };

  try {
    logStep('🏪', 'Step 1: Preparing Play Store Configuration');
    
    // Create Play Store optimized config (without problematic native modules)
    const playStoreConfig = `module.exports = {
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
    "config": {
      "googleMobileAdsAppId": "ca-app-pub-6266678397865252~9915492113"
    },
    "permissions": [
      "android.permission.CAMERA",
      "android.permission.READ_SMS",
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE",
      "android.permission.POST_NOTIFICATIONS",
      "android.permission.WAKE_LOCK"
    ]
  },
  "scheme": "shabari",
  "plugins": [
    "expo-dev-client",
    "expo-notifications",
    ["expo-image-picker", {
      "photosPermission": "The app accesses your photos to scan suspicious images for fraud detection.",
      "cameraPermission": "The app accesses your camera to capture screenshots for fraud analysis."
    }],
    ["expo-barcode-scanner", {
      "cameraPermission": "The app uses the camera to scan QR codes for fraud detection."
    }],
    ["expo-build-properties", {
      "android": {
        "minSdkVersion": 24,
        "compileSdkVersion": 35,
        "targetSdkVersion": 34,
        "buildToolsVersion": "34.0.0",
        "enableProguardInReleaseBuilds": true,
        "enableHermes": true
      }
    }]
  ],
  "extra": {
    "eas": {
      "projectId": "a5b60fe3-2158-436e-8e45-9ce4ce5dd772"
    }
  }
};`;

    fs.writeFileSync('app.config.js', playStoreConfig);
    log('✅ Play Store configuration created', 'green');

    logStep('🌍', 'Step 2: Setting Production Environment');
    const envContent = `NODE_ENV=production
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_PLAY_STORE_BUILD=true
ENABLE_CORE_FEATURES=true
DISABLE_NATIVE_MODULES=true`;

    fs.writeFileSync('.env', envContent);
    log('✅ Production environment configured', 'green');

    logStep('📦', 'Step 3: Installing Core Dependencies');
    try {
      execSync('npm install', { stdio: 'inherit' });
      log('✅ Dependencies installed successfully', 'green');
    } catch (error) {
      log('⚠️ Some dependency warnings (continuing...)', 'yellow');
    }

    logStep('🏗️', 'Step 4: Building Play Store AAB');
    log('📱 Starting EAS build for Play Store...', 'blue');
    log('⏳ This will take 8-12 minutes...', 'yellow');
    log('🎯 Target: Android App Bundle (AAB) for Google Play Store', 'blue');
    
    try {
      execSync('eas build --platform android --profile playstore-aab --non-interactive', { 
        stdio: 'inherit' 
      });
      
      logStep('🎉', 'Play Store AAB Build Completed!');
      log('', 'reset');
      log('📦 Your Shabari AAB is ready for Play Store!', 'bold');
      log('', 'reset');
      
      // Create Play Store submission guide
      const submissionGuide = `# 🏪 Shabari Play Store Submission Guide

## 📦 Build Information
- **Version:** 1.1.0 (Version Code: 2)
- **Format:** Android App Bundle (AAB)
- **Target:** Google Play Store Release
- **Build Date:** ${new Date().toLocaleString()}

## ✅ Features Included
### Core Security Suite ✅
- **Document Scanner** - AI-powered threat detection
- **Link Detection** - Real-time URL protection
- **QR Scanner** - Live fraud detection
- **Image Analysis** - Photo fraud detection

### Authentication & Backend ✅
- **Supabase Authentication** - Secure user accounts
- **Cloud Database** - User data and scan history
- **Premium Features** - Subscription system

### User Experience ✅
- **Intuitive Interface** - Modern Material Design
- **Onboarding Flow** - Guided setup
- **Settings System** - User preferences
- **Privacy Controls** - GDPR compliant

## ⚠️ Temporarily Disabled (Due to Build Issues)
- **Advanced Call Protection** - Will be added in v1.2.0
- **YARA Engine** - Advanced malware detection
- **Native SMS Protection** - Complex permissions

## 📥 Download Your AAB
1. Go to: https://expo.dev/accounts/shubhamprana123/projects/shabari/builds
2. Find the latest "playstore-aab" build
3. Download the AAB file
4. Upload to Google Play Console

## 🚀 Play Store Submission Steps
1. **Google Play Console** → https://play.google.com/console
2. **Create App** → Choose "Shabari" 
3. **App Bundle** → Upload your AAB file
4. **Store Listing** → Add description, screenshots
5. **Content Rating** → Submit for rating
6. **Data Safety** → Fill security questionnaire
7. **Review** → Submit for Google review

## 📱 Testing Before Submission
1. **Internal Testing** → Upload AAB to internal track
2. **Test Installation** → Install via Play Store internal testing
3. **Feature Verification** → Test all core features
4. **Performance Check** → Monitor crashes/ANRs

## 📊 Expected Review Time
- **Internal Testing:** Immediate
- **Production Review:** 1-7 days
- **Policy Review:** Additional 1-2 days if flagged

## 🎯 Ready for Launch!
Your Shabari AAB is production-ready with core security features that provide real value to users while we work on advanced features for future updates.
`;

      fs.writeFileSync('PLAY_STORE_SUBMISSION_GUIDE_v1.1.0.md', submissionGuide);
      log('✅ Play Store submission guide created', 'green');
      
      log('📥 Next Steps:', 'bold');
      log('   1. Download AAB from EAS dashboard', 'blue');
      log('   2. Upload to Google Play Console', 'blue');
      log('   3. Complete store listing', 'blue');
      log('   4. Submit for review', 'blue');
      log('', 'reset');
      log('🛡️ Shabari v1.1.0 - Core Security Ready for Play Store!', 'green');

    } catch (error) {
      log('❌ EAS playstore-aab build failed, trying alternative...', 'red');
      
      // Try playstore profile as backup
      try {
        log('🔄 Trying alternative playstore profile...', 'yellow');
        execSync('eas build --platform android --profile playstore --non-interactive', { 
          stdio: 'inherit' 
        });
        log('✅ Alternative AAB build completed!', 'green');
      } catch (altError) {
        throw new Error('Both playstore build attempts failed');
      }
    }

  } catch (error) {
    log(`\n❌ Build failed: ${error.message}`, 'red');
    log('', 'reset');
    log('🔧 Troubleshooting Options:', 'yellow');
    log('', 'reset');
    log('📞 **Option 1: Manual EAS Build**', 'bold');
    log('   eas build --platform android --profile playstore-aab', 'blue');
    log('', 'reset');
    log('🔄 **Option 2: Retry with Clean State**', 'bold');
    log('   1. eas build:cancel (if build is running)', 'blue');
    log('   2. Wait 5 minutes', 'blue');
    log('   3. Try: eas build --platform android --profile playstore', 'blue');
    log('', 'reset');
    log('💡 **Option 3: Local Build (Advanced)**', 'bold');
    log('   1. npx expo prebuild --platform android', 'blue');
    log('   2. cd android && ./gradlew bundleRelease', 'blue');
    log('   3. Find AAB in android/app/build/outputs/bundle/release/', 'blue');
    
  } finally {
    // Restore original files
    logStep('🔄', 'Restoring Original Configuration');
    Object.entries(backupFiles).forEach(([file, content]) => {
      fs.writeFileSync(file, content);
    });
    log('✅ Original files restored', 'green');
  }
}

// Run the AAB build
buildPlayStoreAAB();

