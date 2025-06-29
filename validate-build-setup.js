#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Android Build Setup...\n');

let allValid = true;

// 1. Check KotlinPlugin.gradle exists
const kotlinPluginPath = path.join('node_modules', 'expo-modules-core', 'android', 'KotlinPlugin.gradle');
if (fs.existsSync(kotlinPluginPath)) {
    console.log('✅ KotlinPlugin.gradle exists');
} else {
    console.log('❌ KotlinPlugin.gradle missing');
    allValid = false;
}

// 2. Check ExpoModulesCorePlugin.gradle has compileSdkVersion
const expoPluginPath = path.join('node_modules', 'expo-modules-core', 'android', 'ExpoModulesCorePlugin.gradle');
if (fs.existsSync(expoPluginPath)) {
    const content = fs.readFileSync(expoPluginPath, 'utf8');
    if (content.includes('compileSdkVersion')) {
        console.log('✅ ExpoModulesCorePlugin.gradle has compileSdkVersion');
    } else {
        console.log('❌ ExpoModulesCorePlugin.gradle missing compileSdkVersion');
        allValid = false;
    }
} else {
    console.log('❌ ExpoModulesCorePlugin.gradle missing');
    allValid = false;
}

// 3. Check main expo build.gradle has compileSdkVersion
const expoBuildGradlePath = path.join('node_modules', 'expo', 'android', 'build.gradle');
if (fs.existsSync(expoBuildGradlePath)) {
    const content = fs.readFileSync(expoBuildGradlePath, 'utf8');
    if (content.includes('compileSdkVersion')) {
        console.log('✅ Expo build.gradle has compileSdkVersion');
    } else {
        console.log('❌ Expo build.gradle missing compileSdkVersion');
        allValid = false;
    }
} else {
    console.log('❌ Expo build.gradle missing');
    allValid = false;
}

// 4. Check app.config.js configuration
const appConfigPath = path.join(process.cwd(), 'app.config.js');
if (fs.existsSync(appConfigPath)) {
    const content = fs.readFileSync(appConfigPath, 'utf8');
    if (content.includes('compileSdkVersion') && content.includes('targetSdkVersion')) {
        console.log('✅ app.config.js has proper SDK configuration');
    } else {
        console.log('⚠️  app.config.js may need SDK version updates');
    }
} else {
    console.log('❌ app.config.js missing');
    allValid = false;
}

// 5. Check eas.json configuration
const easJsonPath = path.join(process.cwd(), 'eas.json');
if (fs.existsSync(easJsonPath)) {
    const content = fs.readFileSync(easJsonPath, 'utf8');
    const config = JSON.parse(content);
    if (config.build && config.build.playstore) {
        console.log('✅ eas.json has playstore build configuration');
    } else {
        console.log('⚠️  eas.json missing playstore build profile');
    }
} else {
    console.log('❌ eas.json missing');
    allValid = false;
}

console.log('\n' + '='.repeat(50));
if (allValid) {
    console.log('🎯 All validations passed! Build setup is ready.');
    console.log('\n🚀 You can now run: eas build --platform android --profile playstore');
} else {
    console.log('❌ Some validations failed. Please fix the issues above.');
}
console.log('='.repeat(50)); 