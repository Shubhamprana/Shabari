const fs = require('fs');
const path = require('path');

// Validate Android manifest and permissions
function validateAndroidManifest() {
  console.log('📱 Validating Android Manifest...');
  
  const manifestPath = path.join(__dirname, '../react-native-proxy-engine/android/app/src/main/AndroidManifest.xml');
  
  if (!fs.existsSync(manifestPath)) {
    console.log('❌ AndroidManifest.xml not found');
    return false;
  }
  
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  
  // Check required permissions
  const requiredPermissions = [
    'android.permission.BIND_VPN_SERVICE',
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.ACCESS_WIFI_STATE',
    'android.permission.READ_PHONE_STATE',
    'android.permission.READ_CALL_LOG',
    'android.permission.CALL_PHONE',
    'android.permission.ANSWER_PHONE_CALLS',
    'android.permission.POST_NOTIFICATIONS',
    'android.permission.WAKE_LOCK',
    'android.permission.FOREGROUND_SERVICE',
    'android.permission.FOREGROUND_SERVICE_DATA_SYNC'
  ];
  
  const missingPermissions = requiredPermissions.filter(permission => 
    !manifestContent.includes(permission)
  );
  
  if (missingPermissions.length > 0) {
    console.log(`❌ Missing permissions: ${missingPermissions.join(', ')}`);
    return false;
  }
  
  console.log('✅ All required permissions found');
  
  // Check for VPN service declaration
  if (!manifestContent.includes('ShabariVpnService')) {
    console.log('❌ ShabariVpnService not declared in manifest');
    return false;
  }
  
  console.log('✅ VPN service properly declared');
  
  return true;
}

// Validate build.gradle files
function validateBuildGradle() {
  console.log('📱 Validating Gradle build files...');
  
  const buildFiles = [
    'react-native-proxy-engine/android/build.gradle',
    'react-native-proxy-engine/android/app/build.gradle'
  ];
  
  for (const buildFile of buildFiles) {
    const buildPath = path.join(__dirname, '../', buildFile);
    
    if (!fs.existsSync(buildPath)) {
      console.log(`❌ ${buildFile} not found`);
      return false;
    }
    
    const buildContent = fs.readFileSync(buildPath, 'utf8');
    
    // Check for Kotlin support
    if (buildFile.includes('app/build.gradle')) {
      if (!buildContent.includes('kotlin')) {
        console.log(`❌ Kotlin not configured in ${buildFile}`);
        return false;
      }
      console.log(`✅ Kotlin configured in ${buildFile}`);
    }
  }
  
  return true;
}

// Validate Kotlin source files
function validateKotlinSources() {
  console.log('📱 Validating Kotlin source files...');
  
  const kotlinFiles = [
    'react-native-proxy-engine/android/app/src/main/java/com/reactnativeproxyengine/ShabariVpnService.kt',
    'react-native-proxy-engine/android/app/src/main/java/com/reactnativeproxyengine/ShabariVpnModule.kt',
    'react-native-proxy-engine/android/app/src/main/java/com/reactnativeproxyengine/ProxyServer.kt',
    'react-native-proxy-engine/android/app/src/main/java/com/reactnativeproxyengine/FilterEngine.kt',
    'react-native-proxy-engine/android/app/src/main/java/com/reactnativeproxyengine/LocalDnsProxy.kt',
    'react-native-proxy-engine/android/app/src/main/java/com/reactnativeproxyengine/CallDetector.kt'
  ];
  
  let validFiles = 0;
  
  for (const kotlinFile of kotlinFiles) {
    const filePath = path.join(__dirname, '../', kotlinFile);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${kotlinFile} not found`);
      continue;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Basic validation
    if (!content.includes('package com.reactnativeproxyengine')) {
      console.log(`❌ Invalid package declaration in ${kotlinFile}`);
      continue;
    }
    
    // Check for class definition
    const fileName = path.basename(kotlinFile, '.kt');
    if (!content.includes(`class ${fileName}`) && !content.includes(`object ${fileName}`)) {
      console.log(`⚠️  Class ${fileName} not found in ${kotlinFile}`);
    }
    
    validFiles++;
    console.log(`✅ ${kotlinFile} validated`);
  }
  
  console.log(`✅ ${validFiles}/${kotlinFiles.length} Kotlin files validated`);
  return validFiles === kotlinFiles.length;
}

// Validate React Native integration
function validateReactNativeIntegration() {
  console.log('📱 Validating React Native integration...');
  
  // Check main package.json
  const packagePath = path.join(__dirname, '../react-native-proxy-engine/package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('❌ react-native-proxy-engine package.json not found');
    return false;
  }
  
  const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Check required fields
  if (!packageContent.name || packageContent.name !== 'react-native-proxy-engine') {
    console.log('❌ Invalid package name');
    return false;
  }
  
  if (!packageContent.main || !packageContent.types) {
    console.log('❌ Missing main or types field');
    return false;
  }
  
  // Check for React Native config
  const configPath = path.join(__dirname, '../react-native-proxy-engine/react-native.config.js');
  if (!fs.existsSync(configPath)) {
    console.log('❌ react-native.config.js not found');
    return false;
  }
  
  // Check JavaScript bridge
  const bridgePath = path.join(__dirname, '../react-native-proxy-engine/js/shabari-vpn/index.js');
  if (!fs.existsSync(bridgePath)) {
    console.log('❌ JavaScript bridge not found');
    return false;
  }
  
  const bridgeContent = fs.readFileSync(bridgePath, 'utf8');
  
  // Check for required methods
  const requiredMethods = [
    'startProtection',
    'stopProtection',
    'getStatus',
    'updateFilters',
    'updateFiltersWithCustomFeed',
    'checkTarget',
    'configure',
    'report'
  ];
  
  const missingMethods = requiredMethods.filter(method => 
    !bridgeContent.includes(method)
  );
  
  if (missingMethods.length > 0) {
    console.log(`❌ Missing JavaScript methods: ${missingMethods.join(', ')}`);
    return false;
  }
  
  console.log('✅ React Native integration validated');
  return true;
}

// Validate TypeScript definitions
function validateTypeScriptDefinitions() {
  console.log('📱 Validating TypeScript definitions...');
  
  const defsPath = path.join(__dirname, '../react-native-proxy-engine/index.d.ts');
  
  if (!fs.existsSync(defsPath)) {
    console.log('❌ TypeScript definitions not found');
    return false;
  }
  
  const defsContent = fs.readFileSync(defsPath, 'utf8');
  
  // Check for required interfaces
  const requiredInterfaces = [
    'ProxyConfig',
    'ProxyResponse',
    'ReactNativeProxyEngine'
  ];
  
  const missingInterfaces = requiredInterfaces.filter(iface => 
    !defsContent.includes(iface)
  );
  
  if (missingInterfaces.length > 0) {
    console.log(`❌ Missing TypeScript interfaces: ${missingInterfaces.join(', ')}`);
    return false;
  }
  
  console.log('✅ TypeScript definitions validated');
  return true;
}

// Check for security best practices
function validateSecurity() {
  console.log('🔒 Validating security implementation...');
  
  // Check ProxyServer for security features
  const proxyPath = path.join(__dirname, '../react-native-proxy-engine/android/app/src/main/java/com/reactnativeproxyengine/ProxyServer.kt');
  
  if (!fs.existsSync(proxyPath)) {
    console.log('❌ ProxyServer.kt not found');
    return false;
  }
  
  const proxyContent = fs.readFileSync(proxyPath, 'utf8');
  
  // Check for threat detection
  const securityFeatures = [
    'checkThreatDetection',
    'performHeuristicChecks',
    'typosquatting',
    'sendBlockedResponse',
    'extractDomain',
    'extractIP'
  ];
  
  const missingFeatures = securityFeatures.filter(feature => 
    !proxyContent.toLowerCase().includes(feature.toLowerCase())
  );
  
  if (missingFeatures.length > 0) {
    console.log(`❌ Missing security features: ${missingFeatures.join(', ')}`);
    return false;
  }
  
  // Check VPN service for proper protection
  const vpnPath = path.join(__dirname, '../react-native-proxy-engine/android/app/src/main/java/com/reactnativeproxyengine/ShabariVpnService.kt');
  
  if (fs.existsSync(vpnPath)) {
    const vpnContent = fs.readFileSync(vpnPath, 'utf8');
    
    if (!vpnContent.includes('FilterEngine') || !vpnContent.includes('processIncomingPacket')) {
      console.log('❌ VPN packet filtering not properly implemented');
      return false;
    }
  }
  
  console.log('✅ Security implementation validated');
  return true;
}

// Generate build readiness report
function generateBuildReport() {
  console.log('\n📋 ANDROID BUILD READINESS REPORT');
  console.log('=' .repeat(60));
  
  const tests = [
    { name: 'Android Manifest & Permissions', test: validateAndroidManifest },
    { name: 'Gradle Build Configuration', test: validateBuildGradle },
    { name: 'Kotlin Source Files', test: validateKotlinSources },
    { name: 'React Native Integration', test: validateReactNativeIntegration },
    { name: 'TypeScript Definitions', test: validateTypeScriptDefinitions },
    { name: 'Security Implementation', test: validateSecurity }
  ];
  
  let passedTests = 0;
  const results = [];
  
  for (const { name, test } of tests) {
    console.log(`\n🔍 ${name}:`);
    try {
      const passed = test();
      results.push({ name, passed });
      if (passed) {
        passedTests++;
        console.log(`✅ ${name}: PASSED`);
      } else {
        console.log(`❌ ${name}: FAILED`);
      }
    } catch (error) {
      console.log(`❌ ${name}: ERROR - ${error.message}`);
      results.push({ name, passed: false, error: error.message });
    }
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 BUILD READINESS SUMMARY');
  console.log('=' .repeat(60));
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${status} - ${result.name}`);
    if (result.error) {
      console.log(`         Error: ${result.error}`);
    }
  });
  
  console.log(`\n📈 Success Rate: ${passedTests}/${tests.length} (${Math.round((passedTests/tests.length) * 100)}%)`);
  
  if (passedTests === tests.length) {
    console.log('\n🎉 BUILD READY FOR PRODUCTION!');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Run: expo run:android');
    console.log('   2. Test VPN permissions on device');
    console.log('   3. Verify threat blocking works');
    console.log('   4. Test call protection features');
    console.log('   5. Monitor performance metrics');
    console.log('\n📱 Your Shabari app is ready for deployment!');
  } else {
    console.log('\n⚠️  BUILD NOT READY');
    console.log('   Please fix the failing tests above before deploying');
    console.log('   The app may work partially but some features will be missing');
  }
  
  return passedTests === tests.length;
}

// Main function
async function main() {
  console.log('🛡️  Shabari Android Build Validation');
  console.log('📱 Checking if the app is ready for Android deployment\n');
  
  const isReady = generateBuildReport();
  
  if (isReady) {
    console.log('\n🎯 VALIDATION COMPLETE - READY FOR DEPLOYMENT! 🎯');
  } else {
    console.log('\n⚠️  VALIDATION INCOMPLETE - PLEASE FIX ISSUES ABOVE');
    process.exit(1);
  }
}

main().catch(console.error);
