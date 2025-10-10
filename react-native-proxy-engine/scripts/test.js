#!/usr/bin/env node

/**
 * Cross-platform test script for react-native-proxy-engine
 * This script runs tests for the proxy engine
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🧪 Running react-native-proxy-engine tests...');

try {
  // Check if we're in the right directory
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('package.json not found. Please run this script from the react-native-proxy-engine directory.');
  }

  // Run Jest tests
  console.log('📋 Running Jest tests...');
  execSync('npm test', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('✅ All tests completed successfully');
  
} catch (error) {
  console.error('❌ Test error:', error.message);
  process.exit(1);
}
