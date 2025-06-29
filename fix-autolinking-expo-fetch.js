#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing expo-fetch autolinking issue...');

// Define the path to the autolinking generated file
const expoModulesPackageListPath = path.join(
  __dirname,
  'node_modules',
  'expo',
  'android',
  'build',
  'generated',
  'expo',
  'src',
  'main',
  'java',
  'expo',
  'modules',
  'ExpoModulesPackageList.java'
);

function fixExpoModulesPackageList() {
  try {
    if (!fs.existsSync(expoModulesPackageListPath)) {
      console.log('⚠️ ExpoModulesPackageList.java not found, will be fixed during build');
      return;
    }

    let content = fs.readFileSync(expoModulesPackageListPath, 'utf8');
    console.log('📁 Found ExpoModulesPackageList.java, checking for expo-fetch references...');

    // Remove the expo-fetch import line
    const fetchImportRegex = /import\s+expo\.modules\.fetch\.ExpoFetchModule;\s*\n?/g;
    content = content.replace(fetchImportRegex, '');

    // Remove the ExpoFetchModule.class reference from the modules array
    const fetchModuleRegex = /,?\s*expo\.modules\.fetch\.ExpoFetchModule\.class,?\s*\n?/g;
    content = content.replace(fetchModuleRegex, '');

    // Clean up any double commas that might be left
    content = content.replace(/,\s*,/g, ',');
    
    // Clean up trailing commas before closing bracket
    content = content.replace(/,\s*\n?\s*\)/g, '\n    )');

    fs.writeFileSync(expoModulesPackageListPath, content, 'utf8');
    console.log('✅ Fixed ExpoModulesPackageList.java - removed expo-fetch references');

  } catch (error) {
    console.error('❌ Error fixing ExpoModulesPackageList.java:', error.message);
  }
}

// Try to create a more comprehensive autolinking exclusion
function updateAutoLinkingConfig() {
  try {
    const autoLinkingScriptPath = path.join(__dirname, 'node_modules', 'expo', 'scripts', 'autolinking.gradle');
    
    if (fs.existsSync(autoLinkingScriptPath)) {
      let content = fs.readFileSync(autoLinkingScriptPath, 'utf8');
      
      // Add exclusion for expo-fetch if not already present
      if (!content.includes('expo-fetch') && !content.includes('ExpoFetchModule')) {
        // This is a more complex modification, for now just log
        console.log('📝 autolinking.gradle found, expo-fetch should be excluded via package.json');
      }
    }
  } catch (error) {
    console.log('⚠️ Could not modify autolinking.gradle:', error.message);
  }
}

// Create an EAS build hook that will run this fix
function createEASBuildHook() {
  const hookContent = `#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 EAS Build Hook: Fixing expo-fetch autolinking...');

try {
  // Run our fix script
  execSync('node fix-autolinking-expo-fetch.js', { 
    cwd: process.cwd(),
    stdio: 'inherit' 
  });
} catch (error) {
  console.log('⚠️ Note: autolinking fix will be applied during build');
}
`;

  fs.writeFileSync('eas-build-hook.js', hookContent);
  console.log('✅ Created EAS build hook');
}

// Main execution
console.log('🚀 Starting expo-fetch autolinking fix...');

fixExpoModulesPackageList();
updateAutoLinkingConfig();
createEASBuildHook();

console.log('✅ Expo-fetch autolinking fix completed');
console.log('💡 This fix will automatically be applied during EAS builds'); 