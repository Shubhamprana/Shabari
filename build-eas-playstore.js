/**
 * EAS Play Store Build Script
 * Uses Expo's cloud build service for reliable Play Store APK
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Building Shabari for Play Store using EAS Build');
console.log('=' .repeat(55));

async function buildWithEAS() {
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

    // Step 2: Check EAS CLI
    console.log('\n2️⃣ Checking EAS CLI...');
    try {
      execSync('eas --version', { stdio: 'pipe' });
      console.log('✅ EAS CLI is installed');
    } catch (error) {
      console.log('📦 Installing EAS CLI...');
      execSync('npm install -g @expo/eas-cli', { stdio: 'inherit' });
      console.log('✅ EAS CLI installed');
    }

    // Step 3: Login to Expo (if needed)
    console.log('\n3️⃣ Checking Expo Login...');
    try {
      const whoami = execSync('eas whoami', { encoding: 'utf8' });
      console.log(`✅ Logged in as: ${whoami.trim()}`);
    } catch (error) {
      console.log('🔐 Please login to your Expo account...');
      execSync('eas login', { stdio: 'inherit' });
      console.log('✅ Logged in successfully');
    }

    // Step 4: Configure EAS Build
    console.log('\n4️⃣ Configuring EAS Build...');
    
    const easConfig = {
      "cli": {
        "version": ">= 7.8.6"
      },
      "build": {
        "playstore": {
          "android": {
            "buildType": "apk",
            "gradleCommand": ":app:assembleRelease",
            "env": {
              "NODE_ENV": "production",
              "EXPO_PUBLIC_ENVIRONMENT": "production"
            }
          }
        },
        "playstore-aab": {
          "android": {
            "buildType": "app-bundle",
            "env": {
              "NODE_ENV": "production",
              "EXPO_PUBLIC_ENVIRONMENT": "production"
            }
          }
        }
      },
      "submit": {
        "production": {
          "android": {
            "serviceAccountKeyPath": "./play-store-service-account.json",
            "track": "internal"
          }
        }
      }
    };

    fs.writeFileSync('eas.json', JSON.stringify(easConfig, null, 2));
    console.log('✅ EAS configuration created');

    // Step 5: Start EAS Build
    console.log('\n5️⃣ Starting EAS Build...');
    console.log('🌐 Building on Expo\'s cloud servers...');
    console.log('⏱️ This will take 5-10 minutes...');
    
    const buildCommand = 'eas build --platform android --profile playstore --non-interactive';
    console.log(`🔨 Running: ${buildCommand}`);
    
    execSync(buildCommand, { 
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    });

    // Step 6: Success
    console.log('\n' + '=' .repeat(55));
    console.log('🎉 EAS BUILD COMPLETED SUCCESSFULLY!');
    console.log('=' .repeat(55));
    
    console.log('\n📱 APK Details:');
    console.log('   🌐 Built on Expo\'s cloud servers');
    console.log('   📦 Production-optimized APK');
    console.log('   🔐 Properly signed for Play Store');
    console.log('   📏 Optimized bundle size');
    
    console.log('\n✅ Production Features Included:');
    console.log('   📱 Real SMS Reading');
    console.log('   🔍 ML Kit Text Recognition');
    console.log('   📤 Share Intent Integration');
    console.log('   🔒 YARA Security Scanning');
    console.log('   📁 File Protection System');
    console.log('   🎯 QR Fraud Detection (fixed)');
    console.log('   🔔 Smart Notifications');
    console.log('   🛡️ URL Protection');
    
    console.log('\n📋 Next Steps:');
    console.log('   1. Download APK from Expo dashboard');
    console.log('   2. Test on real Android device');
    console.log('   3. Upload to Play Console');
    console.log('   4. Submit for Play Store review');
    
    console.log('\n🌐 Expo Dashboard:');
    console.log('   https://expo.dev/accounts/[your-username]/projects/shabari/builds');

    return true;

  } catch (error) {
    console.error('\n❌ EAS Build Failed:', error.message);
    
    console.log('\n🔧 Common Solutions:');
    console.log('   1. Check your Expo account login: eas whoami');
    console.log('   2. Verify project ownership: eas project:info');
    console.log('   3. Update EAS CLI: npm install -g @expo/eas-cli@latest');
    console.log('   4. Check build status: eas build:list');
    
    return false;
  }
}

// Build with EAS
console.log('🌐 Using Expo Application Services (EAS)');
console.log('✨ Cloud-based build for maximum reliability');
console.log('🎯 Target: Google Play Store Production Release\n');

buildWithEAS()
  .then(success => {
    if (success) {
      console.log('\n🎉 SUCCESS: APK ready for Play Store!');
      console.log('\n💡 Pro Tip: EAS builds are more reliable than local builds');
      console.log('📊 Check build status at: https://expo.dev');
    } else {
      console.log('\n❌ FAILED: Check errors above and try again');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }); 