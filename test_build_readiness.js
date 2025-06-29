#!/usr/bin/env node

console.log('🔍 COMPREHENSIVE BUILD READINESS ANALYSIS');
console.log('==========================================\n');

const fs = require('fs');
const path = require('path');

// Test results storage
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

function logTest(category, test, status, details = '') {
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${emoji} ${category}: ${test} - ${status}`);
  if (details) console.log(`   ${details}\n`);
  
  if (status === 'PASS') testResults.passed.push(`${category}: ${test}`);
  else if (status === 'FAIL') testResults.failed.push(`${category}: ${test} - ${details}`);
  else testResults.warnings.push(`${category}: ${test} - ${details}`);
}

// Test 1: Package.json Analysis
function testPackageConfiguration() {
  console.log('📦 TESTING PACKAGE CONFIGURATION\n');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    
    // Check React versions
    const reactVersion = packageJson.dependencies.react;
    const reactDomVersion = packageJson.dependencies['react-dom'];
    const reactNativeVersion = packageJson.dependencies['react-native'];
    const expoVersion = packageJson.dependencies.expo;
    
    logTest('Package', 'React version compatibility', 
      reactVersion === '19.0.0' ? 'PASS' : 'FAIL',
      `React: ${reactVersion}, Expected: 19.0.0`);
    
    logTest('Package', 'React DOM version compatibility',
      reactDomVersion === '19.0.0' ? 'PASS' : 'FAIL', 
      `React DOM: ${reactDomVersion}, Expected: 19.0.0`);
    
    // Check problematic native modules
    const problematicModules = [
      'react-native-fs',
      'react-native-push-notification',
      'react-native-receive-sharing-intent', 
      'react-native-sms-retriever',
      'react-native-sqlite-storage'
    ];
    
    const foundProblematic = [];
    problematicModules.forEach(module => {
      if (packageJson.dependencies[module]) {
        foundProblematic.push(module);
      }
    });
    
    if (foundProblematic.length > 0) {
      logTest('Package', 'Native modules compatibility', 'FAIL',
        `Found problematic modules: ${foundProblematic.join(', ')} - These require custom dev build`);
    } else {
      logTest('Package', 'Native modules compatibility', 'PASS');
    }
    
    // Check for SQLite conflicts
    const hasBothSQLite = packageJson.dependencies['expo-sqlite'] && packageJson.dependencies['react-native-sqlite-storage'];
    logTest('Package', 'SQLite conflict check', 
      hasBothSQLite ? 'FAIL' : 'PASS',
      hasBothSQLite ? 'Both expo-sqlite and react-native-sqlite-storage present' : '');
    
  } catch (error) {
    logTest('Package', 'Configuration file read', 'FAIL', error.message);
  }
}

// Test 2: EAS Configuration
function testEASConfiguration() {
  console.log('🚀 TESTING EAS CONFIGURATION\n');
  
  try {
    const easJson = JSON.parse(fs.readFileSync('./eas.json', 'utf8'));
    
    // Check build profiles
    const requiredProfiles = ['development', 'preview', 'production', 'minimal'];
    const actualProfiles = Object.keys(easJson.build || {});
    
    requiredProfiles.forEach(profile => {
      const exists = actualProfiles.includes(profile);
      logTest('EAS', `${profile} profile exists`, exists ? 'PASS' : 'FAIL');
      
      if (exists && easJson.build[profile].android) {
        const buildType = easJson.build[profile].android.buildType;
        const validTypes = ['apk', 'app-bundle'];
        logTest('EAS', `${profile} buildType valid`, 
          validTypes.includes(buildType) ? 'PASS' : 'FAIL',
          `BuildType: ${buildType}`);
      }
    });
    
  } catch (error) {
    logTest('EAS', 'Configuration file read', 'FAIL', error.message);
  }
}

// Test 3: App Configuration  
function testAppConfiguration() {
  console.log('📱 TESTING APP CONFIGURATION\n');
  
  try {
    const appJson = JSON.parse(fs.readFileSync('./app.json', 'utf8'));
    
    // Check expo configuration
    const expo = appJson.expo;
    logTest('App', 'Expo config exists', expo ? 'PASS' : 'FAIL');
    
    if (expo) {
      logTest('App', 'Bundle identifier set', 
        expo.android?.package ? 'PASS' : 'FAIL',
        `Package: ${expo.android?.package || 'Not set'}`);
      
      logTest('App', 'App name set',
        expo.name ? 'PASS' : 'FAIL',
        `Name: ${expo.name || 'Not set'}`);
      
      logTest('App', 'SDK version compatible',
        expo.sdkVersion === '53.0.0' || !expo.sdkVersion ? 'PASS' : 'WARN',
        `SDK: ${expo.sdkVersion || 'Auto-detected'}`);
      
      logTest('App', 'Web output configuration',
        expo.web?.output !== 'static' ? 'PASS' : 'FAIL',
        `Web output: ${expo.web?.output || 'default'} (static requires expo-router)`);
    }
    
  } catch (error) {
    logTest('App', 'Configuration file read', 'FAIL', error.message);
  }
}

// Test 4: TypeScript Configuration
function testTypeScriptConfiguration() {
  console.log('📝 TESTING TYPESCRIPT CONFIGURATION\n');
  
  try {
    const tsConfig = JSON.parse(fs.readFileSync('./tsconfig.json', 'utf8'));
    
    logTest('TypeScript', 'Configuration exists', 'PASS');
    logTest('TypeScript', 'Extends expo config',
      tsConfig.extends?.includes('expo') ? 'PASS' : 'WARN',
      `Extends: ${tsConfig.extends || 'None'}`);
    
  } catch (error) {
    logTest('TypeScript', 'Configuration file read', 'FAIL', error.message);
  }
}

// Test 5: Metro Configuration
function testMetroConfiguration() {
  console.log('⚡ TESTING METRO CONFIGURATION\n');
  
  try {
    const metroContent = fs.readFileSync('./metro.config.js', 'utf8');
    
    // Check for complex configurations that might cause issues
    const hasComplexConfig = metroContent.includes('maxWorkers') || 
                            metroContent.includes('blockList') ||
                            metroContent.includes('minifierConfig');
    
    logTest('Metro', 'Configuration complexity',
      hasComplexConfig ? 'WARN' : 'PASS',
      hasComplexConfig ? 'Complex config detected - may cause build issues' : 'Simple default config');
    
    logTest('Metro', 'Uses default expo config',
      metroContent.includes('getDefaultConfig') ? 'PASS' : 'FAIL');
    
  } catch (error) {
    logTest('Metro', 'Configuration file read', 'FAIL', error.message);
  }
}

// Test 6: Source Code Analysis
function testSourceCodeStructure() {
  console.log('📂 TESTING SOURCE CODE STRUCTURE\n');
  
  // Check essential files
  const essentialFiles = [
    'App.tsx',
    'index.js',
    'package.json',
    'app.json',
    'eas.json'
  ];
  
  essentialFiles.forEach(file => {
    const exists = fs.existsSync(file);
    logTest('Structure', `${file} exists`, exists ? 'PASS' : 'FAIL');
  });
  
  // Check source directory
  const srcExists = fs.existsSync('./src');
  logTest('Structure', 'src directory exists', srcExists ? 'PASS' : 'FAIL');
  
  if (srcExists) {
    const srcDirs = ['components', 'screens', 'services', 'stores', 'navigation'];
    srcDirs.forEach(dir => {
      const exists = fs.existsSync(`./src/${dir}`);
      logTest('Structure', `src/${dir} exists`, exists ? 'PASS' : 'WARN');
    });
  }
}

// Test 7: Environment Variables
function testEnvironmentVariables() {
  console.log('🔐 TESTING ENVIRONMENT VARIABLES\n');
  
  try {
    const envExists = fs.existsSync('.env');
    logTest('Environment', '.env file exists', envExists ? 'PASS' : 'WARN');
    
    if (envExists) {
      const envContent = fs.readFileSync('.env', 'utf8');
      const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
      
      requiredVars.forEach(varName => {
        const hasVar = envContent.includes(varName);
        logTest('Environment', `${varName} configured`, hasVar ? 'PASS' : 'WARN');
      });
    }
    
  } catch (error) {
    logTest('Environment', 'Environment file read', 'FAIL', error.message);
  }
}

// Test 8: Build Profile Analysis
function analyzeBuildProfiles() {
  console.log('🎯 BUILD PROFILE ANALYSIS\n');
  
  try {
    const easJson = JSON.parse(fs.readFileSync('./eas.json', 'utf8'));
    
    console.log('📋 RECOMMENDED BUILD ORDER (by success probability):\n');
    
    console.log('1. 🎯 MINIMAL PROFILE (Highest Success Rate)');
    console.log('   - Uses: apk build type');
    console.log('   - Gradle: --no-daemon --max-workers=1');
    console.log('   - Cache: disabled');
    console.log('   - Best for: Basic app functionality');
    console.log('   - Command: eas build --platform android --profile minimal\n');
    
    console.log('2. 🚀 PREVIEW PROFILE (Medium Success Rate)');
    console.log('   - Uses: apk build type');
    console.log('   - Gradle: --no-daemon --max-workers=1');
    console.log('   - Cache: enabled');
    console.log('   - Optimization: enabled');
    console.log('   - Best for: Testing full features');
    console.log('   - Command: eas build --platform android --profile preview\n');
    
    console.log('3. 🔧 DEVELOPMENT PROFILE (Lower Success Rate)');
    console.log('   - Uses: apk build type');
    console.log('   - Gradle: standard flags');
    console.log('   - Cache: enabled');
    console.log('   - Best for: Development with native modules');
    console.log('   - Command: eas build --platform android --profile development\n');
    
  } catch (error) {
    console.log('❌ Could not analyze build profiles:', error.message);
  }
}

// Test 9: Native Module Compatibility
function testNativeModuleCompatibility() {
  console.log('🔧 TESTING NATIVE MODULE COMPATIBILITY\n');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const deps = packageJson.dependencies;
    
    // Categorize modules
    const expoModules = [];
    const nativeModules = [];
    const problematicModules = [];
    
    Object.keys(deps).forEach(dep => {
      if (dep.startsWith('expo-')) {
        expoModules.push(dep);
      } else if (dep.startsWith('react-native-') && !dep.includes('@')) {
        if (['react-native-fs', 'react-native-push-notification', 'react-native-receive-sharing-intent', 
             'react-native-sms-retriever', 'react-native-sqlite-storage'].includes(dep)) {
          problematicModules.push(dep);
        } else {
          nativeModules.push(dep);
        }
      }
    });
    
    console.log(`📊 DEPENDENCY ANALYSIS:`);
    console.log(`   Expo modules: ${expoModules.length}`);
    console.log(`   Native modules: ${nativeModules.length}`);
    console.log(`   Problematic modules: ${problematicModules.length}\n`);
    
    if (problematicModules.length > 0) {
      console.log('⚠️  PROBLEMATIC MODULES FOUND:');
      problematicModules.forEach(module => {
        console.log(`   - ${module} (requires custom development build)`);
      });
      console.log();
    }
    
    logTest('Native', 'Module compatibility', 
      problematicModules.length === 0 ? 'PASS' : 'FAIL',
      `${problematicModules.length} problematic modules found`);
    
  } catch (error) {
    logTest('Native', 'Module analysis', 'FAIL', error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🏁 STARTING COMPREHENSIVE BUILD READINESS TESTS\n');
  
  testPackageConfiguration();
  testEASConfiguration();
  testAppConfiguration(); 
  testTypeScriptConfiguration();
  testMetroConfiguration();
  testSourceCodeStructure();
  testEnvironmentVariables();
  testNativeModuleCompatibility();
  analyzeBuildProfiles();
  
  // Summary
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('========================\n');
  
  console.log(`✅ PASSED: ${testResults.passed.length} tests`);
  console.log(`❌ FAILED: ${testResults.failed.length} tests`);
  console.log(`⚠️  WARNINGS: ${testResults.warnings.length} tests\n`);
  
  if (testResults.failed.length > 0) {
    console.log('❌ CRITICAL ISSUES TO FIX:\n');
    testResults.failed.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
    console.log();
  }
  
  if (testResults.warnings.length > 0) {
    console.log('⚠️  WARNINGS TO CONSIDER:\n');
    testResults.warnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning}`);
    });
    console.log();
  }
  
  // Build recommendation
  console.log('🎯 BUILD RECOMMENDATION:\n');
  
  if (testResults.failed.length === 0) {
    console.log('✅ READY FOR BUILD!');
    console.log('   Recommended: eas build --platform android --profile minimal');
  } else if (testResults.failed.length <= 2) {
    console.log('⚠️  BUILD MAY SUCCEED WITH FIXES');
    console.log('   Try: eas build --platform android --profile minimal');
    console.log('   Fix critical issues first for better success rate');
  } else {
    console.log('❌ HIGH RISK OF BUILD FAILURE');
    console.log('   Fix critical issues before attempting build');
    console.log('   Focus on: Native module compatibility and package versions');
  }
  
  console.log('\n🚀 NEXT STEPS:');
  console.log('1. Fix all critical issues listed above');
  console.log('2. Run this test again to verify fixes');
  console.log('3. Try minimal build profile first');
  console.log('4. If successful, try preview or development profiles\n');
}

// Run tests
runAllTests().catch(console.error); 