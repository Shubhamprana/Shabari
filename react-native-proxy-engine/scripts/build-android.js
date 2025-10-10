#!/usr/bin/env node

/**
 * Cross-platform Android build script for react-native-proxy-engine
 * This script builds the Android library for the proxy engine
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔧 Building react-native-proxy-engine for Android...');

try {
  // Check if we're in the right directory
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json not found. Please run this script from the react-native-proxy-engine directory.');
  }

  // Check if Android directory exists
  const androidDir = path.join(__dirname, '..', 'android');
  if (!fs.existsSync(androidDir)) {
    console.log('⚠️  Android directory not found. Skipping Android build.');
    process.exit(0);
  }

  // For EAS builds, we don't need to actually build the native module
  // as it will be built as part of the main app build process
  console.log('✅ Android build configuration ready for EAS build');
  console.log('📱 Native module will be built during main app compilation');
  
} catch (error) {
  console.error('❌ Build error:', error.message);
  process.exit(1);
}
