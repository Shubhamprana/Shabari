#!/usr/bin/env node

/**
 * Pre-Build Environment Check for Shabari APK
 * Verifies all requirements are met before building
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Shabari Pre-Build Environment Check\n');

const checks = [];

function checkItem(name, check, required = true) {
  try {
    const result = check();
    if (result) {
      console.log(`✅ ${name}: ${result}`);
      checks.push({ name, status: 'pass', result });
    } else {
      console.log(`${required ? '❌' : '⚠️'} ${name}: Not found`);
      checks.push({ name, status: required ? 'fail' : 'warn', result: 'Not found' });
    }
  } catch (error) {
    console.log(`${required ? '❌' : '⚠️'} ${name}: ${error.message}`);
    checks.push({ name, status: required ? 'fail' : 'warn', result: error.message });
  }
}

console.log('📋 Checking Build Requirements...\n');

// Check Node.js version
checkItem('Node.js Version', () => {
  const version = process.version;
  return version;
});

// Check NPM version
checkItem('NPM Version', () => {
  return execSync('npm --version', { encoding: 'utf8' }).trim();
});

// Check EAS CLI
checkItem('EAS CLI', () => {
  return execSync('eas --version', { encoding: 'utf8' }).trim();
});

// Check if logged in to EAS
checkItem('EAS Login Status', () => {
  try {
    const whoami = execSync('eas whoami', { encoding: 'utf8' }).trim();
    return whoami;
  } catch (error) {
    throw new Error('Not logged in to EAS');
  }
});

// Check Expo CLI
checkItem('Expo CLI', () => {
  return execSync('npx expo --version', { encoding: 'utf8' }).trim();
}, false);

console.log('\n📁 Checking Project Files...\n');

// Check critical files
checkItem('package.json', () => {
  return fs.existsSync('package.json') ? 'Found' : false;
});

checkItem('app.config.js', () => {
  return fs.existsSync('app.config.js') ? 'Found' : false;
});

checkItem('eas.json', () => {
  return fs.existsSync('eas.json') ? 'Found' : false;
});

// Check keystore
checkItem('Production Keystore', () => {
  if (fs.existsSync('@shubham485__shabari.jks')) {
    return 'Found: @shubham485__shabari.jks';
  }
  return false;
}, false);

// Check native modules
checkItem('YARA Engine', () => {
  return fs.existsSync('react-native-yara-engine') ? 'Module present' : false;
}, false);

checkItem('Proxy Engine', () => {
  return fs.existsSync('react-native-proxy-engine') ? 'Module present' : false;
}, false);

console.log('\n🔧 Checking Dependencies...\n');

// Check critical dependencies
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const criticalDeps = [
  '@supabase/supabase-js',
  'expo',
  'react-native',
  '@react-navigation/native',
  '@expo/vector-icons'
];

criticalDeps.forEach(dep => {
  checkItem(`Dependency: ${dep}`, () => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      return packageJson.dependencies[dep];
    }
    return false;
  });
});

console.log('\n📊 Pre-Build Check Summary\n');

const passedChecks = checks.filter(c => c.status === 'pass').length;
const failedChecks = checks.filter(c => c.status === 'fail').length;
const warnChecks = checks.filter(c => c.status === 'warn').length;

console.log(`✅ Passed: ${passedChecks}`);
console.log(`❌ Failed: ${failedChecks}`);
console.log(`⚠️ Warnings: ${warnChecks}`);

if (failedChecks > 0) {
  console.log('\n❌ Build cannot proceed. Please fix the failed checks above.');
  
  console.log('\n🔧 Quick fixes:');
  checks.filter(c => c.status === 'fail').forEach(check => {
    switch (check.name) {
      case 'EAS CLI':
        console.log('   • Install EAS CLI: npm install -g @expo/eas-cli');
        break;
      case 'EAS Login Status':
        console.log('   • Login to EAS: eas login');
        break;
      default:
        console.log(`   • Fix: ${check.name}`);
    }
  });
  
  process.exit(1);
} else {
  console.log('\n🎉 All critical checks passed! Ready to build APK.');
  
  if (warnChecks > 0) {
    console.log('\n⚠️ Warnings (non-critical):');
    checks.filter(c => c.status === 'warn').forEach(check => {
      console.log(`   • ${check.name}: ${check.result}`);
    });
  }
  
  console.log('\n🚀 You can now run the production build:');
  console.log('   node build-production-apk-final.js');
}
