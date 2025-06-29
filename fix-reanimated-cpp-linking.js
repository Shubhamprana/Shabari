#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing react-native-reanimated C++ linking issues...');

// Fix worklets CMakeLists.txt
const workletsPath = path.join('node_modules', 'react-native-reanimated', 'android', 'src', 'main', 'cpp', 'worklets', 'CMakeLists.txt');
if (fs.existsSync(workletsPath)) {
    let content = fs.readFileSync(workletsPath, 'utf8');
    
    // Check if c++_shared is already linked
    if (!content.includes('c++_shared')) {
        // Find the target_link_libraries line for worklets and add c++_shared
        content = content.replace(
            /target_link_libraries\(worklets log ReactAndroid::jsi fbjni::fbjni\)/,
            'target_link_libraries(worklets log ReactAndroid::jsi fbjni::fbjni c++_shared)'
        );
        
        fs.writeFileSync(workletsPath, content);
        console.log('✅ Fixed worklets CMakeLists.txt - added c++_shared library');
    } else {
        console.log('✅ worklets CMakeLists.txt already has c++_shared library');
    }
} else {
    console.log('❌ worklets CMakeLists.txt not found');
}

// Fix reanimated CMakeLists.txt
const reanimatedPath = path.join('node_modules', 'react-native-reanimated', 'android', 'src', 'main', 'cpp', 'reanimated', 'CMakeLists.txt');
if (fs.existsSync(reanimatedPath)) {
    let content = fs.readFileSync(reanimatedPath, 'utf8');
    
    // Check if c++_shared is already linked
    if (!content.includes('c++_shared')) {
        // Find the target_link_libraries line for reanimated and add c++_shared
        content = content.replace(
            /target_link_libraries\(reanimated worklets android\)/,
            'target_link_libraries(reanimated worklets android c++_shared)'
        );
        
        fs.writeFileSync(reanimatedPath, content);
        console.log('✅ Fixed reanimated CMakeLists.txt - added c++_shared library');
    } else {
        console.log('✅ reanimated CMakeLists.txt already has c++_shared library');
    }
} else {
    console.log('❌ reanimated CMakeLists.txt not found');
}

// Clean build cache to force rebuild
const cleanPaths = [
    path.join('node_modules', 'react-native-reanimated', 'android', '.cxx'),
    path.join('android', 'app', 'build', 'intermediates', 'cxx'),
    path.join('android', 'app', '.cxx')
];

cleanPaths.forEach(cleanPath => {
    if (fs.existsSync(cleanPath)) {
        try {
            fs.rmSync(cleanPath, { recursive: true, force: true });
            console.log(`🧹 Cleaned build cache: ${cleanPath}`);
        } catch (error) {
            console.log(`⚠️  Could not clean ${cleanPath}: ${error.message}`);
        }
    }
});

console.log('');
console.log('🎯 Next steps:');
console.log('1. Set NODE_ENV environment variable: set NODE_ENV=development');
console.log('2. Try building again in Android Studio');
console.log('3. If path issues persist, consider moving project to a path without spaces');
console.log(''); 