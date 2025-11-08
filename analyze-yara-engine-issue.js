#!/usr/bin/env node

/**
 * 🔍 YARA Engine Missing Analysis
 * 
 * This script analyzes why the YARA engine is not found in the built APK
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 YARA Engine Missing Analysis');
console.log('================================\n');

// Check 1: YARA Engine Plugin Configuration
console.log('1️⃣ Checking YARA Engine Plugin Configuration...');
try {
  const appConfig = JSON.parse(fs.readFileSync('app.config.js', 'utf8'));
  const plugins = appConfig.plugins || [];
  const yaraPlugin = plugins.find(plugin => 
    typeof plugin === 'string' && plugin.includes('yara-engine')
  );
  
  if (yaraPlugin) {
    console.log('✅ YARA plugin configured in app.config.js');
    console.log(`   Plugin: ${yaraPlugin}`);
  } else {
    console.log('❌ YARA plugin NOT found in app.config.js');
    console.log('   Available plugins:', plugins);
  }
} catch (error) {
  console.log('❌ Error reading app.config.js:', error.message);
}

// Check 2: YARA Engine Native Libraries
console.log('\n2️⃣ Checking YARA Engine Native Libraries...');
const jniLibsPath = 'react-native-yara-engine/android/src/main/jniLibs';
const arm64Path = path.join(jniLibsPath, 'arm64-v8a');
const armv7Path = path.join(jniLibsPath, 'armeabi-v7a');

try {
  if (fs.existsSync(arm64Path)) {
    const arm64Files = fs.readdirSync(arm64Path);
    const yaraLib = arm64Files.find(file => file.includes('yara'));
    if (yaraLib) {
      console.log('✅ ARM64 YARA library found:', yaraLib);
    } else {
      console.log('❌ ARM64 YARA library NOT found');
      console.log('   Available files:', arm64Files);
    }
  } else {
    console.log('❌ ARM64 directory not found');
  }

  if (fs.existsSync(armv7Path)) {
    const armv7Files = fs.readdirSync(armv7Path);
    const yaraLib = armv7Files.find(file => file.includes('yara'));
    if (yaraLib) {
      console.log('✅ ARMv7 YARA library found:', yaraLib);
    } else {
      console.log('❌ ARMv7 YARA library NOT found');
      console.log('   Available files:', armv7Files);
    }
  } else {
    console.log('❌ ARMv7 directory not found');
  }
} catch (error) {
  console.log('❌ Error checking native libraries:', error.message);
}

// Check 3: YARA Package Registration
console.log('\n3️⃣ Checking YARA Package Registration...');
try {
  const mainApplicationPath = 'android/app/src/main/java/com/shabari/app/MainApplication.kt';
  if (fs.existsSync(mainApplicationPath)) {
    const mainAppContent = fs.readFileSync(mainApplicationPath, 'utf8');
    
    if (mainAppContent.includes('YaraPackage')) {
      console.log('✅ YaraPackage import found in MainApplication.kt');
    } else {
      console.log('❌ YaraPackage import NOT found in MainApplication.kt');
    }
    
    if (mainAppContent.includes('packages.add(YaraPackage())')) {
      console.log('✅ YaraPackage registration found in MainApplication.kt');
    } else {
      console.log('❌ YaraPackage registration NOT found in MainApplication.kt');
    }
  } else {
    console.log('❌ MainApplication.kt not found');
  }
} catch (error) {
  console.log('❌ Error checking MainApplication.kt:', error.message);
}

// Check 4: YARA Engine Service
console.log('\n4️⃣ Checking YARA Engine Service...');
try {
  const yaraServicePath = 'src/services/YaraSecurityService.ts';
  if (fs.existsSync(yaraServicePath)) {
    console.log('✅ YaraSecurityService.ts found');
    
    const yaraServiceContent = fs.readFileSync(yaraServicePath, 'utf8');
    if (yaraServiceContent.includes('react-native-yara-engine')) {
      console.log('✅ YARA engine import found in service');
    } else {
      console.log('❌ YARA engine import NOT found in service');
    }
  } else {
    console.log('❌ YaraSecurityService.ts not found');
  }
} catch (error) {
  console.log('❌ Error checking YARA service:', error.message);
}

// Check 5: AutoInitializationService
console.log('\n5️⃣ Checking AutoInitializationService...');
try {
  const autoInitPath = 'src/services/AutoInitializationService.ts';
  if (fs.existsSync(autoInitPath)) {
    const autoInitContent = fs.readFileSync(autoInitPath, 'utf8');
    
    if (autoInitContent.includes('initializeYaraEngine')) {
      console.log('✅ YARA engine initialization method found');
    } else {
      console.log('❌ YARA engine initialization method NOT found');
    }
    
    if (autoInitContent.includes('YaraSecurityService')) {
      console.log('✅ YaraSecurityService import found');
    } else {
      console.log('❌ YaraSecurityService import NOT found');
    }
  } else {
    console.log('❌ AutoInitializationService.ts not found');
  }
} catch (error) {
  console.log('❌ Error checking AutoInitializationService:', error.message);
}

// Check 6: YARA Engine Module Files
console.log('\n6️⃣ Checking YARA Engine Module Files...');
const yaraModuleFiles = [
  'react-native-yara-engine/index.js',
  'react-native-yara-engine/android/src/main/java/com/shabari/yara/YaraModule.java',
  'react-native-yara-engine/android/src/main/java/com/shabari/yara/YaraPackage.java',
  'react-native-yara-engine/android/src/main/java/com/shabari/yara/YaraEngine.java'
];

yaraModuleFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} NOT found`);
  }
});

// Check 7: ProGuard Rules
console.log('\n7️⃣ Checking ProGuard Rules...');
try {
  const proguardPath = 'proguard-rules.pro';
  if (fs.existsSync(proguardPath)) {
    const proguardContent = fs.readFileSync(proguardPath, 'utf8');
    
    if (proguardContent.includes('com.shabari.yara')) {
      console.log('✅ YARA ProGuard rules found');
    } else {
      console.log('❌ YARA ProGuard rules NOT found');
    }
  } else {
    console.log('❌ proguard-rules.pro not found');
  }
} catch (error) {
  console.log('❌ Error checking ProGuard rules:', error.message);
}

console.log('\n🎯 ANALYSIS COMPLETE');
console.log('====================');
console.log('If any checks failed, those are the issues preventing YARA engine from working.');
console.log('The most common issues are:');
console.log('1. Missing YaraPackage registration in MainApplication.kt');
console.log('2. Missing native .so libraries');
console.log('3. YARA plugin not configured in app.config.js');
console.log('4. ProGuard rules not protecting YARA classes');

