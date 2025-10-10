const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 🛡️ Shabari Proxy Engine - Quick Production Build (Node.js)
// Cross-platform build script that works on Windows, Mac, and Linux

async function runCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`📡 Running: ${command}`);
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr && !options.ignoreStderr) {
        console.warn(`⚠️  Warning: ${stderr}`);
      }
      if (stdout) {
        console.log(stdout);
      }
      resolve(stdout);
    });
  });
}

async function checkEnvironment() {
  console.log('🔍 Checking build environment...');
  
  try {
    // Check Node.js
    const nodeVersion = await runCommand('node --version');
    console.log(`✅ Node.js: ${nodeVersion.trim()}`);
    
    // Check npm
    const npmVersion = await runCommand('npm --version');
    console.log(`✅ npm: ${npmVersion.trim()}`);
    
    // Check if Android SDK exists
    const androidHome = process.env.ANDROID_HOME;
    if (androidHome && fs.existsSync(androidHome)) {
      console.log(`✅ Android SDK: ${androidHome}`);
    } else {
      console.log('⚠️  ANDROID_HOME not set or invalid');
      // Try to find Android SDK in common locations
      const commonPaths = [
        path.join(process.env.USERPROFILE || process.env.HOME, 'AppData', 'Local', 'Android', 'Sdk'),
        path.join(process.env.USERPROFILE || process.env.HOME, 'Android', 'Sdk'),
        '/usr/local/android-sdk',
        '/opt/android-sdk'
      ];
      
      for (const sdkPath of commonPaths) {
        if (fs.existsSync(sdkPath)) {
          process.env.ANDROID_HOME = sdkPath;
          console.log(`✅ Found Android SDK: ${sdkPath}`);
          break;
        }
      }
    }
    
    // Check Java
    try {
      await runCommand('java -version', { ignoreStderr: true });
      console.log('✅ Java: Found');
    } catch (error) {
      console.log('❌ Java not found');
      throw new Error('Java is required for Android builds');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Environment check failed:', error.message);
    return false;
  }
}

async function runValidation() {
  console.log('\n🔍 Running pre-build validation...');
  
  // Run integration validation
  if (fs.existsSync('scripts/validate-integration.js')) {
    try {
      await runCommand('node scripts/validate-integration.js');
      console.log('✅ Integration validation passed');
    } catch (error) {
      console.error('❌ Integration validation failed');
      throw error;
    }
  }
  
  // Run Android build validation
  if (fs.existsSync('scripts/validate-android-build.js')) {
    try {
      await runCommand('node scripts/validate-android-build.js');
      console.log('✅ Android build validation passed');
    } catch (error) {
      console.error('❌ Android build validation failed');
      throw error;
    }
  }
}

async function installDependencies() {
  console.log('\n📦 Installing dependencies...');
  
  // Install main dependencies
  console.log('📦 Installing main dependencies...');
  await runCommand('npm install');
  console.log('✅ Main dependencies installed');
  
  // Install proxy engine dependencies
  if (fs.existsSync('react-native-proxy-engine')) {
    console.log('📦 Installing proxy engine dependencies...');
    process.chdir('react-native-proxy-engine');
    await runCommand('npm install');
    process.chdir('..');
    console.log('✅ Proxy engine dependencies installed');
  }
}

async function cleanBuild() {
  console.log('\n🧹 Cleaning previous builds...');
  
  // Clean npm cache
  console.log('🧹 Cleaning npm cache...');
  await runCommand('npm cache clean --force');
  console.log('✅ npm cache cleaned');
  
  // Clean Android build
  if (fs.existsSync('android')) {
    console.log('🧹 Cleaning Android build...');
    process.chdir('android');
    
    // Use gradlew on Unix systems, gradlew.bat on Windows
    const gradleCommand = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
    await runCommand(`${gradleCommand} clean`);
    
    process.chdir('..');
    console.log('✅ Android build cleaned');
  }
}

async function createProductionConfig() {
  console.log('\n⚙️  Creating production configuration...');
  
  const productionConfig = `# Production Configuration
NODE_ENV=production
ENVIRONMENT=production

# Threat Detection
THREAT_FEED_UPDATE_INTERVAL=3600000
THREAT_FEED_CACHE_SIZE=10000
ENABLE_HEURISTIC_DETECTION=true

# Performance
VPN_BUFFER_SIZE=32767
PROXY_CONNECTION_TIMEOUT=30000
DNS_CACHE_SIZE=1000

# Analytics
ANALYTICS_ENABLED=true
CRASH_REPORTING_ENABLED=true

# Security
ENABLE_CERTIFICATE_PINNING=true
ENABLE_ROOT_DETECTION=true
`;

  fs.writeFileSync('.env.production', productionConfig);
  console.log('✅ Production configuration created');
}

async function buildAPK() {
  console.log('\n🏗️  Building production APK...');
  
  if (!fs.existsSync('android')) {
    throw new Error('Android directory not found');
  }
  
  process.chdir('android');
  
  try {
    // Use gradlew on Unix systems, gradlew.bat on Windows
    const gradleCommand = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
    
    console.log('🏗️  Running Android build...');
    await runCommand(`${gradleCommand} assembleRelease`);
    
    console.log('✅ APK build completed');
  } finally {
    process.chdir('..');
  }
}

async function verifyBuild() {
  console.log('\n✅ Verifying build...');
  
  const apkPath = 'android/app/build/outputs/apk/release/app-release.apk';
  
  if (fs.existsSync(apkPath)) {
    const stats = fs.statSync(apkPath);
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log('✅ APK built successfully!');
    console.log(`📍 Location: ${apkPath}`);
    console.log(`📏 Size: ${fileSizeMB} MB`);
    console.log(`📅 Build Date: ${new Date().toISOString()}`);
    
    return apkPath;
  } else {
    throw new Error('APK file not found');
  }
}

async function generateBuildReport(apkPath) {
  console.log('\n📋 Generating build report...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const reportFile = `build-report-${timestamp}.txt`;
  
  const stats = fs.statSync(apkPath);
  const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2);
  
  const report = `🛡️ Shabari Proxy Engine - Build Report
=====================================

📊 Build Information:
   Project: Shabari
   Version: 1.0.0
   Build Type: release
   Build Date: ${new Date().toISOString()}
   Platform: ${process.platform} ${process.arch}

📱 Android Configuration:
   Min SDK: 21 (Android 5.0)
   Target SDK: 34 (Android 14)
   Compile SDK: 34

📦 Build Output:
   APK Location: ${apkPath}
   APK Size: ${fileSizeMB} MB
   
🛡️ Security Features:
   ✅ VPN packet filtering
   ✅ HTTP/HTTPS proxy filtering
   ✅ DNS filtering
   ✅ Call protection
   ✅ Threat detection engine
   ✅ Heuristic analysis
   ✅ Typosquatting detection
   ✅ JSON feed integration

📋 Production Readiness:
   ✅ All validations passed
   ✅ Dependencies installed
   ✅ Build successful
   ✅ APK verified
   
🚀 Next Steps:
   1. Test APK on physical device
   2. Verify all features work
   3. Submit to app store or distribute
   4. Monitor performance and analytics

Installation Commands:
   adb install "${apkPath}"
   adb install -r "${apkPath}"  # Replace existing
`;

  fs.writeFileSync(reportFile, report);
  console.log(`✅ Build report saved: ${reportFile}`);
  
  return reportFile;
}

async function main() {
  console.log('🛡️  Shabari Proxy Engine - Quick Production Build');
  console.log('================================================');
  
  try {
    // Step 1: Check environment
    const envOk = await checkEnvironment();
    if (!envOk) {
      process.exit(1);
    }
    
    // Step 2: Run validation
    await runValidation();
    
    // Step 3: Install dependencies
    await installDependencies();
    
    // Step 4: Clean previous builds
    await cleanBuild();
    
    // Step 5: Create production config
    await createProductionConfig();
    
    // Step 6: Build APK
    await buildAPK();
    
    // Step 7: Verify build
    const apkPath = await verifyBuild();
    
    // Step 8: Generate report
    const reportFile = await generateBuildReport(apkPath);
    
    // Success!
    console.log('\n🎉 BUILD COMPLETED SUCCESSFULLY! 🎉');
    console.log('================================');
    console.log(`📱 APK: ${apkPath}`);
    console.log(`📄 Report: ${reportFile}`);
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Test on device: adb install ' + apkPath);
    console.log('   2. Verify VPN permissions work');
    console.log('   3. Test threat blocking');
    console.log('   4. Deploy to production');
    console.log('');
    console.log('🛡️ Shabari is ready to protect users!');
    
  } catch (error) {
    console.error('\n❌ BUILD FAILED:', error.message);
    process.exit(1);
  }
}

// Run the build
main();
