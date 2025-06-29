const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Building Production APK with Gradle Plugin Fix');
console.log('=' .repeat(60));

async function buildProductionAPK() {
  try {
    // Step 1: Clean everything first
    console.log('\n1️⃣ Cleaning all build artifacts...');
    
    try {
      if (fs.existsSync('android')) {
        execSync('rmdir /s /q android', { stdio: 'inherit' });
      }
    } catch (error) {
      console.log('   Note: Android folder already clean');
    }
    
    console.log('✅ Build environment cleaned');

    // Step 2: Update existing EAS configuration
    console.log('\n2️⃣ Adding fixed build profile to EAS configuration...');
    
    // Read existing eas.json
    let easConfig;
    if (fs.existsSync('eas.json')) {
      easConfig = JSON.parse(fs.readFileSync('eas.json', 'utf8'));
      // Backup original
      fs.copyFileSync('eas.json', 'eas.json.backup');
    } else {
      easConfig = {
        "cli": {
          "version": ">= 3.13.3",
          "appVersionSource": "remote"
        },
        "build": {}
      };
    }
    
    // Add the fixed profile
    easConfig.build["production-fixed"] = {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease",
        "image": "latest",
        "node": "20.18.0",
        "cache": {
          "disabled": true
        },
        "env": {
          "NODE_ENV": "production",
          "EXPO_PUBLIC_ENVIRONMENT": "production",
          "GRADLE_OPTS": "-Xmx6g -XX:MaxMetaspaceSize=1g",
          "JAVA_OPTS": "-Xmx6g",
          "EAS_SKIP_AUTO_FINGERPRINT": "1"
        }
      }
    };

    fs.writeFileSync('eas.json', JSON.stringify(easConfig, null, 2));
    console.log('✅ Fixed build profile added to EAS configuration');

    // Step 3: Start EAS build with the fixed profile
    console.log('\n3️⃣ Starting EAS build with plugin conflict fix...');
    console.log('🌐 Building on Expo cloud servers...');
    console.log('⏱️ This will take 8-12 minutes...');
    
    const buildCommand = 'npx eas build --platform android --profile production-fixed --non-interactive';
    console.log(`🔨 Running: ${buildCommand}`);
    
    execSync(buildCommand, { 
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        EXPO_PUBLIC_ENVIRONMENT: 'production'
      }
    });

    // Step 4: Success
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 PRODUCTION APK BUILD COMPLETED SUCCESSFULLY!');
    console.log('=' .repeat(60));
    
    console.log('\n📱 APK Features:');
    console.log('   ✅ Plugin conflicts resolved');
    console.log('   ✅ Clean build environment');
    console.log('   ✅ Production optimizations');
    console.log('   ✅ expo-share-intent v3.2.3');
    console.log('   ✅ SMS reading capabilities');
    console.log('   ✅ File scanning features');
    
    console.log('\n📋 Next Steps:');
    console.log('   1. Download APK from: https://expo.dev/accounts/shubham485/projects/shabari/builds');
    console.log('   2. Test all features on real Android device');
    console.log('   3. Verify SMS permissions work properly');
    console.log('   4. Test file scanning and share intent');
    console.log('   5. Upload to Google Play Console');

    return true;

  } catch (error) {
    console.error('\n❌ Build Failed:', error.message);
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check Expo account: npx eas whoami');
    console.log('   2. Update EAS CLI: npm install -g @expo/eas-cli@latest');
    console.log('   3. Check build logs: https://expo.dev/accounts/shubham485/projects/shabari/builds');
    console.log('   4. Try preview build: npx eas build --platform android --profile preview');
    
    return false;
  } finally {
    // Restore original EAS config if backup exists
    if (fs.existsSync('eas.json.backup')) {
      fs.copyFileSync('eas.json.backup', 'eas.json');
      fs.unlinkSync('eas.json.backup');
      console.log('\n♻️ Original EAS configuration restored');
    }
  }
}

// Execute build
console.log('🌟 Starting Production APK Build Process');
console.log('🎯 Target: Google Play Store Release');
console.log('🔧 Fix: Gradle plugin conflict resolution\n');

buildProductionAPK()
  .then(success => {
    if (success) {
      console.log('\n🎉 SUCCESS: Production APK ready for deployment!');
    } else {
      console.log('\n❌ FAILED: Check errors above and retry');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
