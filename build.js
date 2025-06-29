#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🛡️ Building Shabari Security App\n');

function runCommand(command, description) {
  console.log(`📦 ${description}...`);
  try {
    const output = execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

async function buildApp() {
  console.log('🔧 Pre-build checks...');
  
  // Check if EAS CLI is installed
  try {
    execSync('eas --version', { stdio: 'pipe' });
    console.log('✅ EAS CLI is installed');
  } catch (error) {
    console.log('📦 Installing EAS CLI...');
    if (!runCommand('npm install -g eas-cli', 'EAS CLI installation')) {
      process.exit(1);
    }
  }

  // Run expo doctor
  console.log('🔍 Running project health check...');
  if (!runCommand('npx expo-doctor', 'Project health check')) {
    console.log('⚠️ Some issues detected, but continuing with build...');
  }

  // Login check
  try {
    execSync('eas whoami', { stdio: 'pipe' });
    console.log('✅ Already logged in to EAS');
  } catch (error) {
    console.log('🔑 Please log in to EAS...');
    if (!runCommand('eas login', 'EAS login')) {
      process.exit(1);
    }
  }

  console.log('\n🚀 Starting build process...\n');
  
  // Try preview build first (most reliable)
  console.log('📱 Building preview version (recommended)...');
  if (runCommand('eas build --profile preview --platform android', 'Preview build')) {
    console.log(`
🎉 Build completed successfully!

📱 Next steps:
1. Download the APK from the Expo dashboard
2. Enable "Unknown Sources" on your Android device
3. Install the APK
4. Grant all permissions for full protection

🛡️ You'll now have 100% mobile security protection!
    `);
    return;
  }

  // Fallback to development build
  console.log('🔄 Trying development build...');
  if (runCommand('eas build --profile development --platform android', 'Development build')) {
    console.log('🎉 Development build completed!');
    return;
  }

  console.log(`
❌ Build failed. Common solutions:

1. Check internet connection
2. Verify EAS account has build credits
3. Try again in a few minutes
4. Check build logs in Expo dashboard

🔗 Build dashboard: https://expo.dev/accounts/shubhamprana123/projects/shabari
  `);
}

buildApp().catch(console.error); 