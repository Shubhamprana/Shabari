#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing NDK 27 C++ runtime issues...');

// Fix Android gradle.properties to force libc++ shared
const gradlePropsPath = path.join('android', 'gradle.properties');
if (fs.existsSync(gradlePropsPath)) {
    let content = fs.readFileSync(gradlePropsPath, 'utf8');
    
    // Remove any existing C++ runtime configuration
    content = content.replace(/android\.defaultConfig\.externalNativeBuild\.cmake\.cppFlags.*\n/g, '');
    content = content.replace(/ANDROID_STL.*\n/g, '');
    
    // Add proper NDK 27 configuration
    if (!content.includes('ANDROID_STL=c++_shared')) {
        content += '\n# NDK 27 C++ runtime configuration\n';
        content += 'android.defaultConfig.externalNativeBuild.cmake.cppFlags=-DANDROID_STL=c++_shared\n';
        content += 'android.defaultConfig.externalNativeBuild.cmake.arguments=-DANDROID_STL=c++_shared\n';
    }
    
    fs.writeFileSync(gradlePropsPath, content);
    console.log('✅ Updated gradle.properties with NDK 27 configuration');
}

// Fix app build.gradle to ensure proper C++ runtime
const appBuildGradlePath = path.join('android', 'app', 'build.gradle');
if (fs.existsSync(appBuildGradlePath)) {
    let content = fs.readFileSync(appBuildGradlePath, 'utf8');
    
    // Ensure defaultConfig has proper externalNativeBuild configuration
    if (!content.includes('externalNativeBuild')) {
        const defaultConfigMatch = content.match(/(defaultConfig\s*\{[^}]*)/);
        if (defaultConfigMatch) {
            const replacement = defaultConfigMatch[1] + `
        
        externalNativeBuild {
            cmake {
                cppFlags "-DANDROID_STL=c++_shared"
                arguments "-DANDROID_STL=c++_shared"
            }
        }`;
            content = content.replace(defaultConfigMatch[1], replacement);
            fs.writeFileSync(appBuildGradlePath, content);
            console.log('✅ Updated app build.gradle with C++ runtime configuration');
        }
    }
}

console.log('✅ NDK 27 C++ runtime fixes applied!');
console.log('');
console.log('Next steps:');
console.log('1. cd android');
console.log('2. ./gradlew clean');
console.log('3. ./gradlew assembleDebug'); 