#!/usr/bin/env node

/**
 * Fix Gradle Configuration for Expo SDK 52
 * This script ensures proper Gradle configuration
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Gradle configuration for Expo SDK 52...');

try {
  // Check if android directory exists
  const androidDir = path.join(process.cwd(), 'android');
  if (!fs.existsSync(androidDir)) {
    console.log('❌ Android directory not found. Run "npx expo prebuild" first.');
    return;
  }

  // Fix build.gradle files
  const buildGradlePath = path.join(androidDir, 'build.gradle');
  const appBuildGradlePath = path.join(androidDir, 'app', 'build.gradle');
  
  if (fs.existsSync(buildGradlePath)) {
    console.log('📝 Updating root build.gradle...');
    let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
    
    // Ensure proper Gradle version for Expo SDK 52
    if (!buildGradle.includes('gradle:8.3.2')) {
      buildGradle = buildGradle.replace(
        /classpath\('com\.android\.tools\.build:gradle:[^']+'\)/,
        "classpath('com.android.tools.build:gradle:8.3.2')"
      );
    }
    
    // Ensure proper repositories
    if (!buildGradle.includes('google()')) {
      buildGradle = buildGradle.replace(
        /repositories\s*{/,
        'repositories {\n        google()\n        mavenCentral()'
      );
    }
    
    fs.writeFileSync(buildGradlePath, buildGradle);
    console.log('  ✅ Updated root build.gradle');
  }
  
  if (fs.existsSync(appBuildGradlePath)) {
    console.log('📝 Updating app build.gradle...');
    let appBuildGradle = fs.readFileSync(appBuildGradlePath, 'utf8');
    
    // Ensure proper compileSdkVersion for Expo SDK 52
    if (!appBuildGradle.includes('compileSdk 35')) {
      appBuildGradle = appBuildGradle.replace(
        /compileSdk\s+\d+/,
        'compileSdk 35'
      );
    }
    
    // Ensure proper targetSdkVersion
    if (!appBuildGradle.includes('targetSdk 34')) {
      appBuildGradle = appBuildGradle.replace(
        /targetSdk\s+\d+/,
        'targetSdk 34'
      );
    }
    
    fs.writeFileSync(appBuildGradlePath, appBuildGradle);
    console.log('  ✅ Updated app build.gradle');
  }
  
  // Fix gradle.properties
  const gradlePropertiesPath = path.join(androidDir, 'gradle.properties');
  if (fs.existsSync(gradlePropertiesPath)) {
    console.log('📝 Updating gradle.properties...');
    let gradleProperties = fs.readFileSync(gradlePropertiesPath, 'utf8');
    
    // Add necessary properties for Expo SDK 52
    const requiredProperties = [
      'android.useAndroidX=true',
      'android.enableJetifier=true',
      'org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m',
      'android.defaults.buildfeatures.buildconfig=true',
      'android.nonTransitiveRClass=false',
      'android.nonFinalResIds=false'
    ];
    
    requiredProperties.forEach(prop => {
      if (!gradleProperties.includes(prop.split('=')[0])) {
        gradleProperties += `\n${prop}`;
      }
    });
    
    fs.writeFileSync(gradlePropertiesPath, gradleProperties);
    console.log('  ✅ Updated gradle.properties');
  }
  
  console.log('✅ Gradle configuration fixed successfully!');
  console.log('');
  console.log('🎯 Key fixes applied:');
  console.log('- Updated Gradle version to 8.3.2 (compatible with Expo SDK 52)');
  console.log('- Set compileSdk to 35');
  console.log('- Set targetSdk to 34');
  console.log('- Added necessary Gradle properties');
  console.log('- Ensured proper repository configuration');
  
} catch (error) {
  console.error('❌ Error fixing Gradle configuration:', error.message);
}
