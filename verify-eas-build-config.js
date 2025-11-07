#!/usr/bin/env node

/**
 * Verify EAS Build Configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying EAS Build Configuration...\n');

const checks = [
  {
    name: 'YARA Engine AAR',
    path: 'react-native-yara-engine/dist/react-native-yara-engine-1.0.0.aar',
    required: true
  },
  {
    name: 'App Permission Scanner Java',
    path: 'react-native-app-permission-scanner/android/src/main/java/com/shabari/appscanner/AppPermissionScanner.java',
    required: true
  },
  {
    name: 'App Permission Scanner Package',
    path: 'react-native-app-permission-scanner/android/src/main/java/com/shabari/appscanner/AppPermissionScannerPackage.java',
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
  console.log('\n🎉 All native modules are properly configured for EAS build!');
  console.log('🚀 Ready for EAS build!');
} else {
  console.log('\n⚠️ Some native modules are missing or misconfigured.');
  console.log('🔧 Please run this script again after fixing the issues.');
}

module.exports = { allChecksPassed };
