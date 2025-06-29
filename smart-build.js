#!/usr/bin/env node
console.log('🚀 Starting optimized EAS build...');

const { execSync } = require('child_process');

function runBuild(profile) {
  try {
    console.log(`Building with profile: ${profile}`);
    execSync(`eas build --platform android --profile ${profile} --non-interactive`, {
      stdio: 'inherit'
    });
    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    return false;
  }
  return true;
}

// Try builds in order of success probability
const profiles = ['minimal', 'preview', 'development'];

for (const profile of profiles) {
  console.log(`\n🔄 Attempting build with ${profile} profile...\n`);
  if (runBuild(profile)) {
    process.exit(0);
  }
  console.log(`\n⚠️ ${profile} build failed, trying next profile...\n`);
}

console.log('❌ All build profiles failed');
process.exit(1);
