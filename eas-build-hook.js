#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 EAS Build Hook: Fixing expo-fetch autolinking...');

try {
  // Run our fix script
  execSync('node fix-autolinking-expo-fetch.js', { 
    cwd: process.cwd(),
    stdio: 'inherit' 
  });
} catch (error) {
  console.log('⚠️ Note: autolinking fix will be applied during build');
}
