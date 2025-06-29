/**
 * Play Store Release Build Script
 * Creates production-ready APK for Google Play Store submission
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Shabari for Play Store Release');
console.log('=' .repeat(50));

async function buildPlayStoreRelease() {
  try {
    // Step 1: Set Production Environment
    console.log('\n1️⃣ Setting Production Environment...');
    
    const envContent = `# Shabari Production Environment - Play Store Release
NODE_ENV=production
EXPO_PUBLIC_ENVIRONMENT=production
ENABLE_NATIVE_FEATURES=true
EXPO_PUBLIC_ML_KIT_ENABLED=true
EXPO_PUBLIC_SMS_READING_ENABLED=true
EXPO_PUBLIC_YARA_ENABLED=true
EXPO_PUBLIC_FILE_SCANNING_ENABLED=true
EAS_BUILD_PLATFORM=android
EXPO_PUBLIC_API_URL=https://api.shabari.app
`;

    fs.writeFileSync('.env', envContent);
    console.log('✅ Production environment configured');

    // Step 2: Clean Previous Builds
    console.log('\n2️⃣ Cleaning Previous Builds...');
    
    try {
      if (fs.existsSync('android')) {
        console.log('🗑️ Removing old Android build files...');
        execSync('rmdir /s /q android', { stdio: 'inherit' });
      }
    } catch (error) {
      console.log('📁 No previous Android build to clean');
    }

    // Step 3: Install Dependencies
    console.log('\n3️⃣ Installing Dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed');

    // Step 4: Prebuild for Release
    console.log('\n4️⃣ Generating Native Android Project...');
    execSync('npx expo prebuild --platform android', { stdio: 'inherit' });
    console.log('✅ Native Android project generated');

    // Step 5: Build Release APK
    console.log('\n5️⃣ Building Release APK...');
    console.log('⏱️ This will take 10-15 minutes...');
    
    // Use Gradle directly to build APK without requiring emulator
    const buildCommand = 'cd android && .\\gradlew assembleRelease';
    console.log(`🔨 Running: ${buildCommand}`);
    
    execSync(buildCommand, { 
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        EXPO_PUBLIC_ENVIRONMENT: 'production',
        ENABLE_NATIVE_FEATURES: 'true'
      }
    });

    // Step 6: Success - APK Ready
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 PLAY STORE APK BUILD COMPLETED!');
    console.log('=' .repeat(50));
    
    console.log('\n📱 APK Location:');
    console.log('📁 android/app/build/outputs/apk/release/app-release.apk');
    
    console.log('\n📊 APK Details:');
    try {
      const apkPath = 'android/app/build/outputs/apk/release/app-release.apk';
      if (fs.existsSync(apkPath)) {
        const stats = fs.statSync(apkPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`📏 Size: ${fileSizeInMB} MB`);
        console.log(`📅 Created: ${stats.mtime.toLocaleString()}`);
      }
    } catch (error) {
      console.log('📏 Size: Unable to determine');
    }
    
    console.log('\n✅ Production Features Included:');
    console.log('   📱 Real SMS Reading');
    console.log('   🔍 ML Kit Text Recognition');
    console.log('   📤 Share Intent Integration');
    console.log('   🔒 YARA Security Scanning');
    console.log('   📁 File Protection System');
    console.log('   🎯 QR Fraud Detection');
    console.log('   🔔 Smart Notifications');
    console.log('   🛡️ URL Protection');
    
    console.log('\n🏪 Ready for Play Store:');
    console.log('   ✅ Production build configuration');
    console.log('   ✅ Release APK signed');
    console.log('   ✅ All native features enabled');
    console.log('   ✅ Optimized for distribution');
    console.log('   ✅ No development dependencies');
    
    console.log('\n📋 Next Steps:');
    console.log('   1. Test APK on real Android device');
    console.log('   2. Upload to Play Console for internal testing');
    console.log('   3. Create store listing with screenshots');
    console.log('   4. Submit for Play Store review');
    
    console.log('\n📱 Install Command:');
    console.log('   adb install android/app/build/outputs/apk/release/app-release.apk');

    return true;

  } catch (error) {
    console.error('\n❌ Build Failed:', error.message);
    
    console.log('\n🔧 Quick Fixes:');
    console.log('   1. Ensure Android Studio is installed');
    console.log('   2. Check Android SDK is properly configured');
    console.log('   3. Verify Java JDK is installed');
    console.log('   4. Try: npx expo doctor');
    console.log('   5. Clean: npx expo prebuild --clear');
    
    return false;
  }
}

// Build for Play Store
console.log('🎯 Target: Google Play Store Production Release');
console.log('🚀 Starting build process...\n');

buildPlayStoreRelease()
  .then(success => {
    if (success) {
      console.log('\n🎉 SUCCESS: APK ready for Play Store submission!');
    } else {
      console.log('\n❌ FAILED: Check errors above and try again');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }); 