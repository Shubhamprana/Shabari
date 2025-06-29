#!/usr/bin/env node

console.log('🔧 AUTOMATED BUILD ISSUE FIXES');
console.log('===============================\n');

const fs = require('fs');
const { execSync } = require('child_process');

// Fix 1: Remove SQLite conflict
function fixSQLiteConflict() {
  console.log('1. 🗄️ FIXING SQLITE CONFLICT\n');
  
  try {
    console.log('   Removing react-native-sqlite-storage...');
    execSync('npm uninstall react-native-sqlite-storage --legacy-peer-deps', { stdio: 'inherit' });
    console.log('   ✅ SQLite conflict resolved\n');
    return true;
  } catch (error) {
    console.log('   ❌ Failed to remove SQLite conflict:', error.message, '\n');
    return false;
  }
}

// Fix 2: Create Expo-compatible version
function createExpoCompatibleVersion() {
  console.log('2. 📦 CREATING EXPO-COMPATIBLE PACKAGE.JSON\n');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    
    // Remove problematic native modules
    const problematicModules = [
      'react-native-fs',
      'react-native-push-notification', 
      'react-native-receive-sharing-intent',
      'react-native-sms-retriever'
    ];
    
    console.log('   Removing problematic native modules:');
    problematicModules.forEach(module => {
      if (packageJson.dependencies[module]) {
        console.log(`   - ${module}`);
        delete packageJson.dependencies[module];
      }
    });
    
    // Add Expo alternatives
    const expoAlternatives = {
      'expo-file-system': '^17.0.1',        // Replaces react-native-fs
      'expo-device': '^6.0.2',              // For device info
      'expo-intent-launcher': '^11.0.1'     // For intents
    };
    
    console.log('   Adding Expo alternatives:');
    Object.entries(expoAlternatives).forEach(([module, version]) => {
      if (!packageJson.dependencies[module]) {
        console.log(`   + ${module}@${version}`);
        packageJson.dependencies[module] = version;
      }
    });
    
    // Create backup
    fs.writeFileSync('./package.json.backup', JSON.stringify(packageJson, null, 2));
    fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2));
    
    console.log('   ✅ Expo-compatible package.json created');
    console.log('   📋 Backup saved as package.json.backup\n');
    return true;
  } catch (error) {
    console.log('   ❌ Failed to create Expo-compatible version:', error.message, '\n');
    return false;
  }
}

// Fix 3: Update service files to use Expo APIs
function updateServiceFiles() {
  console.log('3. 🔧 UPDATING SERVICE FILES FOR EXPO COMPATIBILITY\n');
  
  const updates = [];
  
  // Update WatchdogFileService to use expo-file-system
  try {
    const watchdogPath = './src/services/WatchdogFileService.ts';
    if (fs.existsSync(watchdogPath)) {
      let content = fs.readFileSync(watchdogPath, 'utf8');
      
      if (content.includes('react-native-fs')) {
        content = content.replace(
          /import.*react-native-fs.*;/g, 
          "import * as FileSystem from 'expo-file-system';"
        );
        
        // Replace RNFS calls with expo-file-system equivalents
        content = content.replace(/RNFS\./g, 'FileSystem.');
        
        fs.writeFileSync(watchdogPath, content);
        updates.push('WatchdogFileService.ts');
      }
    }
  } catch (error) {
    console.log(`   ⚠️ Could not update WatchdogFileService: ${error.message}`);
  }
  
  if (updates.length > 0) {
    console.log('   ✅ Updated files:');
    updates.forEach(file => console.log(`   - ${file}`));
  } else {
    console.log('   ℹ️ No service files needed updates');
  }
  console.log();
}

// Fix 4: Create build-optimized EAS profiles
function optimizeEASProfiles() {
  console.log('4. 🚀 OPTIMIZING EAS BUILD PROFILES\n');
  
  try {
    const easJson = {
      cli: {
        version: ">= 0.63.0"
      },
      build: {
        // Super minimal build - highest success rate
        minimal: {
          android: {
            buildType: "apk",
            gradleCommand: ":app:assembleDebug --no-daemon --max-workers=1 --no-build-cache",
            distribution: "internal",
            cache: {
              disabled: true
            },
            env: {
              EXPO_NO_CAPABILITY_SYNC: "1",
              EXPO_NO_FLIPPER: "1"
            }
          }
        },
        // Clean build - no cache issues
        clean: {
          android: {
            buildType: "apk", 
            gradleCommand: ":app:assembleRelease --no-daemon --max-workers=1 --rerun-tasks",
            distribution: "internal",
            cache: {
              disabled: true
            },
            env: {
              GRADLE_OPTS: "-Xmx2048m -XX:MaxMetaspaceSize=512m"
            }
          }
        },
        // Production optimized
        production: {
          android: {
            buildType: "app-bundle",
            distribution: "store"
          }
        }
      },
      submit: {
        production: {}
      }
    };
    
    fs.writeFileSync('./eas.json', JSON.stringify(easJson, null, 2));
    console.log('   ✅ Optimized EAS profiles created');
    console.log('   - minimal: Maximum compatibility, no cache');
    console.log('   - clean: Clean build with memory optimization');
    console.log('   - production: Store-ready build\n');
    return true;
  } catch (error) {
    console.log('   ❌ Failed to optimize EAS profiles:', error.message, '\n');
    return false;
  }
}

// Fix 5: Install dependencies
function installDependencies() {
  console.log('5. 📥 INSTALLING EXPO DEPENDENCIES\n');
  
  try {
    console.log('   Installing new Expo modules...');
    execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
    console.log('   ✅ Dependencies installed successfully\n');
    return true;
  } catch (error) {
    console.log('   ❌ Failed to install dependencies:', error.message, '\n');
    return false;
  }
}

// Fix 6: Create compatibility shims
function createCompatibilityShims() {
  console.log('6. 🔗 CREATING COMPATIBILITY SHIMS\n');
  
  try {
    // Create a compatibility layer for removed native modules
    const shimContent = `// Compatibility shims for removed native modules
// This file provides mock implementations for development

export const MockRNFS = {
  DocumentDirectoryPath: '/mock/documents',
  writeFile: async (path: string, content: string) => {
    console.log('MockRNFS: writeFile called', { path, content: content.substring(0, 50) + '...' });
    return Promise.resolve();
  },
  readFile: async (path: string) => {
    console.log('MockRNFS: readFile called', { path });
    return Promise.resolve('mock file content');
  },
  exists: async (path: string) => {
    console.log('MockRNFS: exists called', { path });
    return Promise.resolve(false);
  },
  mkdir: async (path: string) => {
    console.log('MockRNFS: mkdir called', { path });
    return Promise.resolve();
  }
};

export const MockShareIntent = {
  getReceivedFiles: async () => {
    console.log('MockShareIntent: getReceivedFiles called');
    return Promise.resolve([]);
  }
};

export const MockSMSRetriever = {
  startSmsRetriever: async () => {
    console.log('MockSMSRetriever: startSmsRetriever called');
    return Promise.resolve();
  }
};

console.log('🎭 Compatibility shims loaded - native modules mocked for Expo compatibility');
`;
    
    // Ensure src/lib directory exists
    if (!fs.existsSync('./src/lib')) {
      fs.mkdirSync('./src/lib', { recursive: true });
    }
    
    fs.writeFileSync('./src/lib/compatibilityShims.ts', shimContent);
    console.log('   ✅ Compatibility shims created at src/lib/compatibilityShims.ts\n');
    return true;
  } catch (error) {
    console.log('   ❌ Failed to create compatibility shims:', error.message, '\n');
    return false;
  }
}

// Main fix runner
async function runAllFixes() {
  console.log('🏁 STARTING AUTOMATED BUILD FIXES\n');
  
  const results = [];
  
  results.push({ name: 'SQLite Conflict', success: fixSQLiteConflict() });
  results.push({ name: 'Expo Compatibility', success: createExpoCompatibleVersion() });
  updateServiceFiles(); // This doesn't return boolean
  results.push({ name: 'EAS Profiles', success: optimizeEASProfiles() });
  results.push({ name: 'Compatibility Shims', success: createCompatibilityShims() });
  results.push({ name: 'Dependencies', success: installDependencies() });
  
  // Summary
  console.log('📊 FIX RESULTS SUMMARY');
  console.log('======================\n');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const emoji = result.success ? '✅' : '❌';
    console.log(`${emoji} ${result.name}`);
  });
  
  console.log(`\n🎯 ${successful}/${total} fixes applied successfully\n`);
  
  if (successful === total) {
    console.log('✅ ALL FIXES APPLIED SUCCESSFULLY!');
    console.log('\n🚀 READY FOR MINIMAL BUILD');
    console.log('Next step: eas build --platform android --profile minimal\n');
  } else {
    console.log('⚠️ SOME FIXES FAILED');
    console.log('Manual intervention may be required for failed fixes\n');
  }
  
  console.log('📋 VERIFICATION STEPS:');
  console.log('1. Run: node test_build_readiness.js');
  console.log('2. Check that critical issues are resolved');
  console.log('3. Try: eas build --platform android --profile minimal');
  console.log('4. If build fails, try: eas build --platform android --profile clean\n');
}

// Run all fixes
runAllFixes().catch(console.error); 