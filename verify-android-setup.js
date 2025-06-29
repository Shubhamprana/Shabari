#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Verifying Android Build Setup...\n');

let allGood = true;

// 1. Check Java Environment
console.log('📋 Checking Java Environment...');
try {
    const javaVersion = execSync('java -version 2>&1', { encoding: 'utf8' });
    if (javaVersion.includes('17.0.15')) {
        console.log('✅ Java 17 properly configured');
    } else {
        console.log('❌ Java version issue:', javaVersion.split('\n')[0]);
        allGood = false;
    }
} catch (error) {
    console.log('❌ Java not found or not in PATH');
    allGood = false;
}

// 2. Check JAVA_HOME
const javaHome = process.env.JAVA_HOME;
if (javaHome && javaHome.includes('jdk-17')) {
    console.log('✅ JAVA_HOME correctly set to JDK 17');
} else {
    console.log('❌ JAVA_HOME not set or incorrect:', javaHome);
    allGood = false;
}

// 3. Check Android SDK
const androidHome = process.env.ANDROID_HOME || process.env.LOCALAPPDATA + '\\Android\\Sdk';
if (fs.existsSync(androidHome)) {
    console.log('✅ Android SDK found at:', androidHome);
} else {
    console.log('❌ Android SDK not found. Expected at:', androidHome);
    allGood = false;
}

// 4. Check Android project structure
console.log('\n📁 Checking Project Structure...');
const androidDir = path.join(__dirname, 'android');
const appBuildGradle = path.join(androidDir, 'app', 'build.gradle');
const rootBuildGradle = path.join(androidDir, 'build.gradle');

if (fs.existsSync(androidDir)) {
    console.log('✅ Android directory exists');
} else {
    console.log('❌ Android directory missing');
    allGood = false;
}

if (fs.existsSync(appBuildGradle)) {
    console.log('✅ App build.gradle exists');
} else {
    console.log('❌ App build.gradle missing');
    allGood = false;
}

// 5. Check our C++ fixes
console.log('\n🔧 Checking Applied Fixes...');
const expoModulesCore = 'node_modules/expo-modules-core/android/CMakeLists.txt';
if (fs.existsSync(expoModulesCore)) {
    const content = fs.readFileSync(expoModulesCore, 'utf8');
    if (content.includes('c++_shared')) {
        console.log('✅ expo-modules-core C++ fix applied');
    } else {
        console.log('❌ expo-modules-core C++ fix missing');
        allGood = false;
    }
} else {
    console.log('❌ expo-modules-core CMakeLists.txt not found');
    allGood = false;
}

const reactNativeScreens = 'node_modules/react-native-screens/android/CMakeLists.txt';
if (fs.existsSync(reactNativeScreens)) {
    const content = fs.readFileSync(reactNativeScreens, 'utf8');
    if (content.includes('c++_shared')) {
        console.log('✅ react-native-screens C++ fix applied');
    } else {
        console.log('❌ react-native-screens C++ fix missing');
        allGood = false;
    }
} else {
    console.log('❌ react-native-screens CMakeLists.txt not found');
    allGood = false;
}

// 6. Check for Android Studio
console.log('\n🎯 Checking Android Studio...');
const studioPaths = [
    'C:\\Program Files\\Android\\Android Studio\\bin\\studio64.exe',
    `C:\\Users\\${process.env.USERNAME}\\AppData\\Local\\Android Studio\\bin\\studio64.exe`
];

let studioFound = false;
for (const studioPath of studioPaths) {
    if (fs.existsSync(studioPath)) {
        console.log('✅ Android Studio found at:', studioPath);
        studioFound = true;
        break;
    }
}

if (!studioFound) {
    console.log('❌ Android Studio not found in standard locations');
    console.log('   Please install Android Studio from: https://developer.android.com/studio');
    allGood = false;
}

// 7. Check Gradle Wrapper
console.log('\n⚙️ Checking Gradle...');
const gradleWrapper = path.join(androidDir, 'gradlew.bat');
if (fs.existsSync(gradleWrapper)) {
    console.log('✅ Gradle wrapper exists');
} else {
    console.log('❌ Gradle wrapper missing');
    allGood = false;
}

// Final summary
console.log('\n' + '='.repeat(50));
if (allGood) {
    console.log('🎉 ALL CHECKS PASSED!');
    console.log('\n✅ Your project is ready for Android Studio!');
    console.log('\n📋 Next Steps:');
    console.log('1. Run: open-in-android-studio.bat');
    console.log('2. Or manually open the "android" folder in Android Studio');
    console.log('3. Wait for Gradle sync');
    console.log('4. Build > Build Bundle(s) / APK(s) > Build APK(s)');
} else {
    console.log('❌ SOME ISSUES FOUND!');
    console.log('\n🔧 Please fix the issues above before proceeding.');
    console.log('📖 Check the guide: open-android-studio.md');
}
console.log('='.repeat(50)); 