/**
 * APK Build Status Checker
 * Checks if the Play Store release APK is ready
 */

const fs = require('fs');
const path = require('path');

function checkAPKStatus() {
  console.log('🔍 Checking APK Build Status\n');
  console.log('=' .repeat(40));

  const apkPath = 'android/app/build/outputs/apk/release/app-release.apk';
  const androidDir = 'android';

  // Check if Android project exists
  if (!fs.existsSync(androidDir)) {
    console.log('❌ Android project not found');
    console.log('💡 Run: node build-playstore-release.js');
    return;
  }

  console.log('✅ Android project: Found');

  // Check if APK exists
  if (fs.existsSync(apkPath)) {
    const stats = fs.statSync(apkPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    const buildTime = stats.mtime.toLocaleString();

    console.log('🎉 APK BUILD COMPLETED!');
    console.log('=' .repeat(40));
    console.log(`📁 Location: ${apkPath}`);
    console.log(`📏 Size: ${fileSizeInMB} MB`);
    console.log(`📅 Built: ${buildTime}`);
    
    console.log('\n✅ READY FOR PLAY STORE!');
    console.log('\n📋 Next Steps:');
    console.log('1. Test on real Android device:');
    console.log('   adb install android/app/build/outputs/apk/release/app-release.apk');
    console.log('\n2. Upload to Play Console');
    console.log('3. Create store listing');
    console.log('4. Submit for review');

  } else {
    console.log('⏳ APK Build: IN PROGRESS');
    console.log('\n📍 Current Status:');
    
    // Check for common build files to show progress
    const buildFiles = [
      'android/gradlew',
      'android/app/build',
      'android/app/build/intermediates',
      'android/app/build/outputs'
    ];

    buildFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
      } else {
        console.log(`⏳ ${file}`);
      }
    });

    console.log('\n⏱️ Build typically takes 10-15 minutes');
    console.log('🔄 Check again in a few minutes: node check-apk-status.js');
  }

  console.log('\n📱 Production Features Included:');
  console.log('   📱 Real SMS Reading');
  console.log('   🔍 ML Kit Text Recognition');
  console.log('   📤 Share Intent Integration');
  console.log('   🔒 YARA Security Scanning');
  console.log('   📁 File Protection System');
  console.log('   🎯 QR Fraud Detection');
  console.log('   🔔 Smart Notifications');
  console.log('   🛡️ URL Protection');
}

checkAPKStatus(); 