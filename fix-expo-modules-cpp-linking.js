#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing expo-modules-core C++ linking issues...');

// Fix expo-modules-core CMakeLists.txt
const expoModulesPath = path.join('node_modules', 'expo-modules-core', 'android', 'CMakeLists.txt');
if (fs.existsSync(expoModulesPath)) {
    let content = fs.readFileSync(expoModulesPath, 'utf8');
    
    // Check if we already have the fix
    if (!content.includes('# SHABARI FIX: Additional C++ libraries')) {
        // Add additional libraries before the conditional linking
        const insertPoint = content.indexOf('if (ReactAndroid_VERSION_MINOR GREATER_EQUAL 76)');
        if (insertPoint !== -1) {
            const beforeConditional = content.substring(0, insertPoint);
            const afterConditional = content.substring(insertPoint);
            
            const additionalLibs = `
# SHABARI FIX: Additional C++ libraries for proper linking
target_link_libraries(
  \${PACKAGE_NAME}
  c++_shared
  c++abi
)

`;
            
            content = beforeConditional + additionalLibs + afterConditional;
            
            fs.writeFileSync(expoModulesPath, content);
            console.log('✅ Fixed expo-modules-core CMakeLists.txt - added c++abi library');
        } else {
            console.log('⚠️  Could not find insertion point in expo-modules-core CMakeLists.txt');
        }
    } else {
        console.log('✅ expo-modules-core CMakeLists.txt already has the fix');
    }
} else {
    console.log('❌ expo-modules-core CMakeLists.txt not found');
}

console.log('');
console.log('🎯 Next steps:');
console.log('1. Clean build: cd android && ./gradlew clean');
console.log('2. Try building again: ./gradlew assembleDebug'); 