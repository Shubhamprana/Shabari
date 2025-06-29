#!/usr/bin/env node

console.log('🔍 DEPENDENCY CONFLICT ANALYSIS');
console.log('================================\n');

// Read package.json
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

console.log('📦 CRITICAL ISSUES IDENTIFIED:\n');

// Issue 1: React version
console.log('❌ ISSUE 1: React 19.0.0 Compatibility');
console.log('   React Native 0.79.4 may not be compatible with React 19.0.0');
console.log('   Recommended: React 18.x for React Native 0.79.4\n');

// Issue 2: SQLite conflicts
console.log('❌ ISSUE 2: SQLite Package Conflicts');
console.log('   Both expo-sqlite and react-native-sqlite-storage are installed');
console.log('   This causes Android build conflicts\n');

// Issue 3: Native modules
console.log('❌ ISSUE 3: Native Modules Without Expo Dev Build');
console.log('   These packages require custom development build:');
const nativeModules = [
    'react-native-fs',
    'react-native-push-notification', 
    'react-native-receive-sharing-intent',
    'react-native-sqlite-storage',
    'react-native-sms-retriever'
];

nativeModules.forEach(module => {
    if (packageJson.dependencies[module]) {
        console.log(`   - ${module}`);
    }
});

console.log('\n🔧 RECOMMENDED FIXES:\n');

console.log('1. Downgrade React to 18.x:');
console.log('   npm install react@18.2.0 react-dom@18.2.0\n');

console.log('2. Remove SQLite conflict:');
console.log('   npm uninstall react-native-sqlite-storage\n');

console.log('3. Use Expo alternatives:');
console.log('   - Replace react-native-fs with expo-file-system');
console.log('   - Replace react-native-push-notification with expo-notifications');
console.log('   - Use expo-sqlite instead of react-native-sqlite-storage\n');

console.log('4. For EAS Build with native modules:');
console.log('   eas build --platform android --profile development\n');

console.log('📋 DEPENDENCY VERSION ANALYSIS:');
console.log('===============================');

const deps = packageJson.dependencies;
Object.keys(deps).forEach(dep => {
    const version = deps[dep];
    if (version.includes('^') || version.includes('~')) {
        console.log(`✅ ${dep}: ${version} (flexible version)`);
    } else {
        console.log(`⚠️  ${dep}: ${version} (locked version)`);
    }
}); 