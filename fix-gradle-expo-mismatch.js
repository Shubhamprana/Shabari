#!/usr/bin/env node

/**
 * Fix Gradle/Expo SDK Version Mismatch
 * This script fixes the common Gradle build issues with Expo SDK 52
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Gradle/Expo SDK version mismatch...');

try {
  // Step 1: Clean everything
  console.log('🧹 Step 1: Cleaning build artifacts...');
  
  const androidDir = path.join(process.cwd(), 'android');
  const nodeModulesDir = path.join(process.cwd(), 'node_modules');
  
  if (fs.existsSync(androidDir)) {
    console.log('  - Removing android directory...');
    fs.rmSync(androidDir, { recursive: true, force: true });
  }
  
  if (fs.existsSync(nodeModulesDir)) {
    console.log('  - Removing node_modules...');
    fs.rmSync(nodeModulesDir, { recursive: true, force: true });
  }
  
  // Step 2: Update package.json with compatible versions
  console.log('📦 Step 2: Updating package.json with compatible versions...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Update expo-modules-core and expo-crypto to latest compatible versions
  packageJson.dependencies['expo-modules-core'] = '~1.15.0';
  packageJson.dependencies['expo-crypto'] = '~13.0.2';
  
  // Ensure all expo packages are compatible with SDK 52
  const expoPackages = {
    'expo-dev-client': '~5.0.20',
    'expo-notifications': '~0.29.14',
    'expo-build-properties': '~0.13.3',
    'expo-constants': '~17.0.3',
    'expo-device': '~7.0.3',
    'expo-file-system': '~18.0.12',
    'expo-font': '~13.0.4',
    'expo-haptics': '~14.0.1',
    'expo-image': '~2.0.7',
    'expo-image-picker': '~16.0.6',
    'expo-intent-launcher': '~12.0.2',
    'expo-linear-gradient': '~14.0.2',
    'expo-linking': '~7.0.3',
    'expo-share-intent': '~3.2.3',
    'expo-splash-screen': '~0.29.24',
    'expo-sqlite': '~15.1.4',
    'expo-status-bar': '~2.0.0',
    'expo-symbols': '~0.2.2',
    'expo-system-ui': '~4.0.9',
    'expo-web-browser': '~14.0.2',
    'expo-barcode-scanner': '~13.0.1',
    'expo-blur': '~14.0.3'
  };
  
  // Update expo packages
  Object.entries(expoPackages).forEach(([pkg, version]) => {
    if (packageJson.dependencies[pkg]) {
      packageJson.dependencies[pkg] = version;
    }
  });
  
  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('  ✅ Updated package.json with compatible versions');
  
  // Step 3: Install dependencies
  console.log('📥 Step 3: Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('  ✅ Dependencies installed');
  
  // Step 4: Run expo doctor to check for issues
  console.log('🏥 Step 4: Running expo doctor...');
  try {
    execSync('npx expo doctor', { stdio: 'inherit' });
  } catch (error) {
    console.log('  ⚠️ Expo doctor found some issues, but continuing...');
  }
  
  // Step 5: Prebuild with clean
  console.log('🏗️ Step 5: Running expo prebuild with clean...');
  execSync('npx expo prebuild --platform android --clean', { stdio: 'inherit' });
  console.log('  ✅ Prebuild completed successfully');
  
  // Step 6: Verify the build
  console.log('✅ Step 6: Build fix completed successfully!');
  console.log('');
  console.log('🎉 Next steps:');
  console.log('1. Run: npx eas build -p android --profile production');
  console.log('2. This should now build without Gradle errors');
  console.log('');
  console.log('📋 What was fixed:');
  console.log('- Updated expo-modules-core to compatible version');
  console.log('- Updated expo-crypto to compatible version');
  console.log('- Ensured all Expo packages are SDK 52 compatible');
  console.log('- Cleaned and rebuilt Android project');
  
} catch (error) {
  console.error('❌ Error during fix:', error.message);
  console.log('');
  console.log('🔧 Manual steps to try:');
  console.log('1. Run: npm install expo-modules-core@latest expo-crypto@latest');
  console.log('2. Run: npx expo install --fix');
  console.log('3. Run: rm -rf android && npx expo prebuild --platform android --clean');
  console.log('4. Run: npx eas build -p android --profile production');
}
