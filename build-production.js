#!/usr/bin/env node

/**
 * Production Build Script for Google Play Store
 * Builds AAB and APK files ready for Play Store submission
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Play Store Production Build Script');
console.log('=====================================');

// Build configurations
const builds = [
  {
    name: 'AAB (Google Play Store)',
    profile: 'production',
    description: 'Android App Bundle for Play Store upload'
  },
  {
    name: 'APK (Sideload/Testing)',
    profile: 'production-apk', 
    description: 'Production APK for testing and sideloading'
  }
];

function runCommand(command, description) {
  console.log(`\n📋 ${description}`);
  console.log(`Running: ${command}`);
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

async function main() {
  console.log('\n🧹 Step 1: Pre-build Cleanup');
  
  // Clean caches
  runCommand('npm cache clean --force', 'Cleaning npm cache');
  runCommand('npx expo install --fix', 'Fixing Expo dependencies');
  
  // Verify environment
  if (!process.env.VIRUSTOTAL_API_KEY) {
    console.log('⚠️  Warning: VIRUSTOTAL_API_KEY not set - using default demo key');
  }
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.log('⚠️  Warning: Supabase keys not set - some features may not work');
  }

  console.log('\n🏗️  Step 2: Production Builds');
  
  for (const build of builds) {
    console.log(`\n📦 Building ${build.name}`);
    console.log(`   ${build.description}`);
    
    const success = runCommand(
      `eas build --platform android --profile ${build.profile} --non-interactive`,
      `Building ${build.name}`
    );
    
    if (success) {
      console.log(`✅ ${build.name} build completed successfully!`);
    } else {
      console.error(`❌ ${build.name} build failed`);
      console.log('\n🔧 Troubleshooting suggestions:');
      console.log('   • Check your .env file has all required API keys');
      console.log('   • Verify your EAS account is properly configured');
      console.log('   • Try running: eas login');
    }
  }

  console.log('\n🎉 Production Build Process Complete!');
  console.log('\n📋 Next Steps for Play Store:');
  console.log('   1. Download the AAB file from EAS dashboard');
  console.log('   2. Upload to Google Play Console');
  console.log('   3. Complete store listing information');
  console.log('   4. Submit for review');
  
  console.log('\n🔗 Useful Links:');
  console.log('   • EAS Dashboard: https://expo.dev/accounts/shubham485/projects/shabari/builds');
  console.log('   • Play Console: https://play.google.com/console');
  console.log('   • App Signing: https://developer.android.com/studio/publish/app-signing');
}

// Handle script execution
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Build script failed:', error);
    process.exit(1);
  });
} 