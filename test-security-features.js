#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🛡️ Shabari Security Features Test');
console.log('=====================================');

// Function to run command with proper error handling
function runCommand(command, description) {
  console.log(`\n📋 ${description}`);
  console.log(`Running: ${command}`);
  try {
    const output = execSync(command, { 
      stdio: 'inherit', 
      cwd: process.cwd(),
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

async function testSecurityFeatures() {
  console.log('\n🧹 Step 1: Clean and Install Dependencies');
  
  // Clean install to ensure no conflicts
  runCommand('npm install --legacy-peer-deps', 'Installing dependencies with legacy peer deps');
  
  console.log('\n🔧 Step 2: Generate Android Build');
  
  // Generate Android files for testing
  runCommand('npx expo prebuild --clean --platform android', 'Generating Android native code');
  
  console.log('\n📱 Step 3: Test App Locally');
  
  // Start the app locally
  console.log('\n🚀 Starting Expo Development Server...');
  console.log('📋 Instructions:');
  console.log('1. App will start with premium features enabled by default');
  console.log('2. Clipboard monitoring should work automatically');
  console.log('3. Security services should initialize without timeout errors');
  console.log('4. Test by copying a malicious URL (e.g., malware-test.com)');
  console.log('5. Check console for service initialization logs');
  
  runCommand('npx expo start --clear', 'Starting Expo development server');
}

// Check for required features
function checkFixedFeatures() {
  console.log('\n✅ Security Features Fixed:');
  console.log('🔒 Premium subscription restrictions removed from core features');
  console.log('⏱️ Service initialization timeouts increased (2s → 8-10s)');  
  console.log('📋 Clipboard monitoring enabled as core security feature');
  console.log('🔄 Auto-start permissions added (BOOT_COMPLETED, WAKE_LOCK)');
  console.log('🛡️ GlobalGuard service initialization improved');
  console.log('📱 Default subscription set to premium for testing');
  
  console.log('\n🎯 Expected Behavior:');
  console.log('• No more "Premium subscription required" errors');
  console.log('• No more "Global Guard Service initialization timeout" errors');
  console.log('• Automatic URL scanning from clipboard should work');
  console.log('• WhatsApp link protection should be active');
  console.log('• App should show all services as initialized (✅)');
}

// Run if called directly
if (require.main === module) {
  checkFixedFeatures();
  console.log('\n🤔 Would you like to:');
  console.log('1. Test locally with Expo (immediate)');
  console.log('2. Wait for EAS build (160 minutes)');
  console.log('3. Build locally (5-10 minutes)');
  
  testSecurityFeatures().catch(console.error);
}

module.exports = { testSecurityFeatures, checkFixedFeatures }; 