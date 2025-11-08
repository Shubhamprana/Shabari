#!/usr/bin/env node

/**
 * Verify Native Modules Build
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Native Modules Build...\n');

// Check if native modules are properly configured
const checks = [
  {
    name: 'YARA Engine AAR',
    path: 'react-native-yara-engine/dist/react-native-yara-engine-1.0.0.aar',
    required: true
  },
  {
    name: 'YARA Engine Plugin',
    path: 'react-native-yara-engine/app.plugin.js',
    required: true
  },
  {
    name: 'App Permission Scanner Plugin',
    path: 'react-native-app-permission-scanner/app.plugin.js',
    required: true
  },
  {
    name: 'MainApplication.kt',
    path: 'android/app/src/main/java/com/shabari/app/MainApplication.kt',
    required: true
  }
];

let allChecksPassed = true;

checks.forEach(check => {
  const fullPath = path.join(__dirname, check.path);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${check.name}: Found`);
  } else {
    console.log(`❌ ${check.name}: Missing`);
    if (check.required) {
      allChecksPassed = false;
    }
  }
});

if (allChecksPassed) {
  console.log('\n🎉 All native modules are properly configured!');
  console.log('🚀 Ready for EAS build!');
} else {
  console.log('\n⚠️  Some native modules are missing or misconfigured.');
  console.log('🔧 Please run this script again after fixing the issues.');
}

module.exports = { allChecksPassed };
