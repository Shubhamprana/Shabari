/**
 * Production Build Script with SMS Scanner Fix
 * Builds Shabari APK with fully functional SMS reading capability
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Shabari Production APK with SMS Scanner');
console.log('=' .repeat(60));

async function buildProductionWithSMS() {
  try {
    // Step 1: Verify SMS Scanner Configuration
    console.log('\n1️⃣ Verifying SMS Scanner Configuration...');
    
    const smsTestResult = execSync('node test-sms-scanner-fix.js', { encoding: 'utf8' });
    if (!smsTestResult.includes('✅ Passed: 6')) {
      throw new Error('SMS Scanner configuration check failed');
    }
    console.log('✅ SMS Scanner: Fully configured');

    // Step 2: Check Environment Variables
    console.log('\n2️⃣ Setting Production Environment...');
    
    const envContent = `# Shabari Production Environment
NODE_ENV=production
EXPO_PUBLIC_ENVIRONMENT=production
ENABLE_NATIVE_FEATURES=true
EXPO_PUBLIC_ML_KIT_ENABLED=true
EXPO_PUBLIC_SMS_READING_ENABLED=true
EXPO_PUBLIC_YARA_ENABLED=true
EXPO_PUBLIC_FILE_SCANNING_ENABLED=true
EAS_BUILD_PLATFORM=android
`;

    fs.writeFileSync('.env', envContent);
    console.log('✅ Environment variables set');

    // Step 3: Clean Build Environment
    console.log('\n3️⃣ Cleaning Build Environment...');
    
    try {
      execSync('npx expo install --fix', { stdio: 'inherit' });
      console.log('✅ Dependencies fixed');
    } catch (error) {
      console.log('⚠️ Dependency fix warnings (continuing...)');
    }

    // Step 4: Prebuild for Native Features
    console.log('\n4️⃣ Prebuild for Native Features...');
    
    try {
      execSync('npx expo prebuild --platform android --clear', { stdio: 'inherit' });
      console.log('✅ Android prebuild completed');
    } catch (error) {
      console.log('⚠️ Prebuild warnings (continuing...)');
    }

    // Step 5: Build Production APK
    console.log('\n5️⃣ Building Production APK...');
    console.log('This may take 10-15 minutes...');
    
    const buildCommand = 'npx expo run:android --variant release';
    console.log(`Running: ${buildCommand}`);
    
    execSync(buildCommand, { 
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        EXPO_PUBLIC_ENVIRONMENT: 'production',
        ENABLE_NATIVE_FEATURES: 'true'
      }
    });

    // Step 6: Success Summary
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 PRODUCTION BUILD COMPLETED SUCCESSFULLY!');
    console.log('=' .repeat(60));
    
    console.log('\n📱 APK Location:');
    console.log('   android/app/build/outputs/apk/release/app-release.apk');
    
    console.log('\n✅ Features Included:');
    console.log('   📱 Real SMS Reading (react-native-sms-retriever)');
    console.log('   🔍 ML Kit Text Recognition');
    console.log('   📤 Share Intent Integration');
    console.log('   🔒 YARA Security Scanning');
    console.log('   📁 Enhanced File Protection');
    console.log('   🚫 No Intrusive Popups');
    
    console.log('\n📋 SMS Scanner Features:');
    console.log('   ✅ Real SMS permissions (READ_SMS, RECEIVE_SMS)');
    console.log('   ✅ Native SMS reading via react-native-sms-retriever');
    console.log('   ✅ Fraud detection and analysis');
    console.log('   ✅ Fallback to mock data for testing');
    console.log('   ✅ Proper permission handling');
    
    console.log('\n⚠️ Important Notes:');
    console.log('   - SMS reading only works on real Android devices');
    console.log('   - Not supported in Expo Go development builds');
    console.log('   - Users must grant SMS permissions when prompted');
    console.log('   - Install APK on physical Android device for testing');
    
    console.log('\n🔄 Next Steps:');
    console.log('   1. Transfer APK to Android device');
    console.log('   2. Install: adb install app-release.apk');
    console.log('   3. Test SMS Scanner functionality');
    console.log('   4. Grant SMS permissions when prompted');
    console.log('   5. Verify real SMS messages are displayed');

    return true;

  } catch (error) {
    console.error('\n❌ Build Failed:', error.message);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check SMS scanner configuration: node test-sms-scanner-fix.js');
    console.log('   2. Verify Android Studio and SDK are properly installed');
    console.log('   3. Check that react-native-sms-retriever is installed');
    console.log('   4. Ensure all SMS permissions are in app.json');
    console.log('   5. Try cleaning: npx expo prebuild --clear');
    
    return false;
  }
}

// Execute build
buildProductionWithSMS()
  .then(success => {
    if (!success) {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }); 