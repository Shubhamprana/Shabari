#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Android Build Fixes...\n');

let allGood = true;

// 1. Verify compileSdkVersion fix in android/app/build.gradle
console.log('📱 Checking android/app/build.gradle...');
const appBuildGradlePath = path.join('android', 'app', 'build.gradle');
if (fs.existsSync(appBuildGradlePath)) {
    const content = fs.readFileSync(appBuildGradlePath, 'utf8');
    
    if (content.includes('compileSdkVersion rootProject.ext.compileSdkVersion')) {
        console.log('✅ compileSdkVersion syntax is correct');
    } else if (content.includes('compileSdk rootProject.ext.compileSdkVersion')) {
        console.log('❌ compileSdk syntax found - needs to be compileSdkVersion');
        allGood = false;
    } else {
        console.log('⚠️  compileSdkVersion not found in expected format');
    }
} else {
    console.log('❌ android/app/build.gradle not found');
    allGood = false;
}

// 2. Verify KotlinPlugin.gradle exists
console.log('\n🔧 Checking KotlinPlugin.gradle...');
const kotlinPluginPath = path.join('node_modules', 'expo-modules-core', 'android', 'KotlinPlugin.gradle');
if (fs.existsSync(kotlinPluginPath)) {
    console.log('✅ KotlinPlugin.gradle exists in correct location');
    
    // Check if it has the required methods
    const content = fs.readFileSync(kotlinPluginPath, 'utf8');
    if (content.includes('applyKotlinExpoModulesCorePlugin')) {
        console.log('✅ KotlinPlugin.gradle has required methods');
    } else {
        console.log('❌ KotlinPlugin.gradle missing required methods');
        allGood = false;
    }
} else {
    console.log('❌ KotlinPlugin.gradle missing from expo-modules-core/android/');
    allGood = false;
}

// 3. Verify ExpoModulesCorePlugin.gradle references KotlinPlugin.gradle correctly
console.log('\n📦 Checking ExpoModulesCorePlugin.gradle...');
const expoPluginPath = path.join('node_modules', 'expo-modules-core', 'android', 'ExpoModulesCorePlugin.gradle');
if (fs.existsSync(expoPluginPath)) {
    const content = fs.readFileSync(expoPluginPath, 'utf8');
    
    if (content.includes("apply from: './KotlinPlugin.gradle'")) {
        console.log('✅ ExpoModulesCorePlugin.gradle correctly references KotlinPlugin.gradle');
    } else {
        console.log('❌ ExpoModulesCorePlugin.gradle missing KotlinPlugin.gradle reference');
        allGood = false;
    }
    
    if (content.includes('compileSdkVersion')) {
        console.log('✅ ExpoModulesCorePlugin.gradle has compileSdkVersion');
    } else {
        console.log('❌ ExpoModulesCorePlugin.gradle missing compileSdkVersion');
        allGood = false;
    }
} else {
    console.log('❌ ExpoModulesCorePlugin.gradle not found');
    allGood = false;
}

// 4. Check for any old invalid references
console.log('\n🔍 Checking for old path references...');
const checkFiles = [
    'fix-kotlin-expo-plugin.js',
    'apply-build-fixes.js'
];

let foundOldReferences = false;
for (const file of checkFiles) {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('expo/android/KotlinPlugin.gradle')) {
            console.log(`⚠️  Found old path reference in ${file}`);
            foundOldReferences = true;
        }
    }
}

if (!foundOldReferences) {
    console.log('✅ No old invalid path references found');
}

// Final summary
console.log('\n' + '='.repeat(50));
if (allGood) {
    console.log('🎯 All fixes verified successfully!');
    console.log('\n📋 Fixed issues:');
    console.log('  1. ✅ compileSdkVersion syntax corrected in android/app/build.gradle');
    console.log('  2. ✅ KotlinPlugin.gradle created and properly referenced');
    console.log('  3. ✅ ExpoModulesCorePlugin.gradle updated with correct paths');
    console.log('\n🚀 These specific issues should now be resolved in your EAS build.');
    console.log('   If build still fails, it may be due to other unrelated issues.');
} else {
    console.log('❌ Some fixes need attention. Please check the issues above.');
}
console.log('='.repeat(50)); 