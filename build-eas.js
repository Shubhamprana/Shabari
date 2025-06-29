#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 EAS Build Optimization Script');
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

async function main() {
  console.log('\n🧹 Step 1: Cleanup Build Cache');
  
  // Clean npm cache
  runCommand('npm cache clean --force', 'Cleaning npm cache');
  
  // Clean Expo cache
  runCommand('npx expo install --fix', 'Fixing Expo dependencies');
  
  // Clean Metro cache
  runCommand('npx expo start --clear --non-interactive || true', 'Clearing Metro cache');
  
  console.log('\n🔧 Step 2: Remove Local Android Build');
  
  // Remove local android directory to prevent path conflicts
  if (fs.existsSync('android')) {
    console.log('📱 Removing local android directory to prevent EAS conflicts...');
    try {
      fs.rmSync('android', { recursive: true, force: true });
      console.log('✅ Local android directory removed');
    } catch (error) {
      console.warn(`⚠️ Could not remove android directory: ${error.message}`);
    }
  }
  
  console.log('\n🏗️ Step 3: EAS Build with Optimized Profile');
  
  // Run EAS build with the optimized profile
  const buildSuccess = runCommand(
    'npx eas build --platform android --profile eas-optimized --non-interactive', 
    'Building with EAS optimized profile'
  );
  
  if (buildSuccess) {
    console.log('\n🎉 EAS Build completed successfully!');
    console.log('📱 Check your Expo dashboard for the build status and download link.');
  } else {
    console.log('\n⚠️ EAS Build failed. Trying with minimal profile...');
    runCommand(
      'npx eas build --platform android --profile minimal --non-interactive', 
      'Building with minimal profile (fallback)'
    );
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runCommand }; 