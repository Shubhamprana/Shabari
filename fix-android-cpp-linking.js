#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Android C++ Linking Issues...\n');

// 1. Fix expo-modules-core CMakeLists.txt
const cmakeFile = 'node_modules/expo-modules-core/android/CMakeLists.txt';
if (fs.existsSync(cmakeFile)) {
    console.log('📝 Patching expo-modules-core CMakeLists.txt...');
    let cmakeContent = fs.readFileSync(cmakeFile, 'utf8');
    
    // Add c++_shared library linking after the existing target_link_libraries
    if (!cmakeContent.includes('c++_shared')) {
        const linkLibrariesPattern = /(target_link_libraries\(\s*\${PACKAGE_NAME}[\s\S]*?)\)/g;
        const matches = [...cmakeContent.matchAll(linkLibrariesPattern)];
        
        if (matches.length > 0) {
            const lastMatch = matches[matches.length - 1];
            const replacement = lastMatch[1] + '\n  c++_shared\n)';
            cmakeContent = cmakeContent.replace(lastMatch[0], replacement);
            
            fs.writeFileSync(cmakeFile, cmakeContent);
            console.log('✅ Added c++_shared library linking');
        }
    }
}

// 2. Fix react-native-screens CMakeLists.txt if it exists
const screensGradleDir = 'node_modules/react-native-screens/android';
if (fs.existsSync(screensGradleDir)) {
    console.log('📝 Patching react-native-screens configuration...');
    
    // Create or modify CMakeLists.txt for react-native-screens
    const screensCMakeFile = path.join(screensGradleDir, 'CMakeLists.txt');
    const screensBuildGradle = path.join(screensGradleDir, 'build.gradle');
    
    // Check if build.gradle needs NDK config
    if (fs.existsSync(screensBuildGradle)) {
        let buildGradleContent = fs.readFileSync(screensBuildGradle, 'utf8');
        
        // Add NDK configuration if missing
        if (!buildGradleContent.includes('ndkVersion') && !buildGradleContent.includes('cppFlags')) {
            const androidBlock = buildGradleContent.match(/(android\s*\{[\s\S]*?)(\s*})/);
            if (androidBlock) {
                const ndkConfig = `
    externalNativeBuild {
        cmake {
            path "src/main/cpp/CMakeLists.txt"
            version "3.22.1"
        }
    }
    
    defaultConfig {
        externalNativeBuild {
            cmake {
                cppFlags "-std=c++20", "-fexceptions", "-frtti"
                arguments "-DANDROID_STL=c++_shared"
            }
        }
    }
`;
                const replacement = androidBlock[1] + ndkConfig + androidBlock[2];
                buildGradleContent = buildGradleContent.replace(androidBlock[0], replacement);
                fs.writeFileSync(screensBuildGradle, buildGradleContent);
                console.log('✅ Added NDK configuration to react-native-screens');
            }
        }
    }
}

// 3. Fix app build.gradle to ensure proper C++ linking
const appBuildGradle = 'android/app/build.gradle';
if (fs.existsSync(appBuildGradle)) {
    console.log('📝 Patching app build.gradle...');
    let appBuildContent = fs.readFileSync(appBuildGradle, 'utf8');
    
    // Add NDK configuration to defaultConfig if missing
    if (!appBuildContent.includes('ndk {')) {
        const defaultConfigPattern = /(defaultConfig\s*\{[\s\S]*?)(^\s*})/m;
        const match = appBuildContent.match(defaultConfigPattern);
        
        if (match) {
            const ndkConfig = `        ndk {
            abiFilters "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
        }
        packagingOptions {
            pickFirst "lib/x86/libc++_shared.so"
            pickFirst "lib/x86_64/libc++_shared.so"
            pickFirst "lib/arm64-v8a/libc++_shared.so"
            pickFirst "lib/armeabi-v7a/libc++_shared.so"
        }
`;
            const replacement = match[1] + ndkConfig + '\n    ' + match[2];
            appBuildContent = appBuildContent.replace(match[0], replacement);
            fs.writeFileSync(appBuildGradle, appBuildContent);
            console.log('✅ Added NDK configuration to app build.gradle');
        }
    }
}

// 4. Update gradle.properties
const gradleProps = 'android/gradle.properties';
if (fs.existsSync(gradleProps)) {
    console.log('📝 Updating gradle.properties...');
    let propsContent = fs.readFileSync(gradleProps, 'utf8');
    
    const fixes = {
        'android.useAndroidX': 'true',
        'android.enableJetifier': 'true',
        'org.gradle.daemon': 'true',
        'org.gradle.parallel': 'true',
        'org.gradle.configureondemand': 'true',
        'android.enableDexingArtifactTransform': 'false',
        'android.experimental.enableSourceSetPathsMap': 'true',
        'android.overrideVersionCheck': 'true'
    };
    
    Object.entries(fixes).forEach(([key, value]) => {
        if (!propsContent.includes(key)) {
            propsContent += `\n# Added by fix script\n${key}=${value}\n`;
            console.log(`✅ Added ${key}=${value}`);
        }
    });
    
    fs.writeFileSync(gradleProps, propsContent);
}

// 5. Create a local NDK fix script
const ndkFixScript = `#!/bin/bash
# NDK C++ Library Fix Script

echo "🔧 Applying NDK C++ Library Fixes..."

# Clean build artifacts
if [ -d "node_modules/expo-modules-core/android/.cxx" ]; then
    echo "🧹 Cleaning expo-modules-core build cache..."
    rm -rf node_modules/expo-modules-core/android/.cxx
fi

if [ -d "node_modules/react-native-screens/android/.cxx" ]; then
    echo "🧹 Cleaning react-native-screens build cache..."
    rm -rf node_modules/react-native-screens/android/.cxx
fi

if [ -d "android/.gradle" ]; then
    echo "🧹 Cleaning gradle cache..."
    rm -rf android/.gradle
fi

if [ -d "android/app/build" ]; then
    echo "🧹 Cleaning app build cache..."
    rm -rf android/app/build
fi

echo "✅ NDK C++ fixes applied successfully!"
echo "🔄 Run './gradlew clean && ./gradlew assembleDebug' to test the build"
`;

fs.writeFileSync('fix-ndk-cpp.sh', ndkFixScript);
fs.chmodSync('fix-ndk-cpp.sh', '755');

console.log('\n🎉 Android C++ Linking Fix Complete!');
console.log('\n📋 Applied Fixes:');
console.log('   • Added c++_shared library linking to expo-modules-core');
console.log('   • Updated NDK configuration in build.gradle files');
console.log('   • Added proper C++ packaging options');
console.log('   • Updated gradle.properties for better compatibility');
console.log('   • Created NDK cleanup script: fix-ndk-cpp.sh');

console.log('\n🔄 Next Steps:');
console.log('   1. Run: cd android && ./gradlew clean');
console.log('   2. Run: ./gradlew assembleDebug');
console.log('   3. If issues persist, run: ../fix-ndk-cpp.sh');

console.log('\n💡 This fix addresses NDK 27.1 C++ standard library linking issues.'); 