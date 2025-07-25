/**
 * 🔗 SHARE INTENT FUNCTIONALITY TEST
 * 
 * This script tests and verifies the share intent configuration
 * to ensure Shabari appears in the "Share with" menu
 * 
 * Run: node test-share-intent-functionality.js
 */

console.log('🚀 Testing Share Intent Functionality...\n');

// Mock React Native environment
global.Platform = { OS: 'android' };

function testShareIntentConfiguration() {
  console.log('📋 SHARE INTENT CONFIGURATION ANALYSIS');
  console.log('=' .repeat(50));
  
  // Read app.json configuration
  const fs = require('fs');
  const path = require('path');
  
  try {
    const appJsonPath = path.join(__dirname, 'app.json');
    const appJsonContent = fs.readFileSync(appJsonPath, 'utf8');
    const appConfig = JSON.parse(appJsonContent);
    
    console.log('✅ app.json found and parsed successfully');
    
    // Check Android intent filters
    const androidConfig = appConfig.expo?.android;
    if (androidConfig && androidConfig.intentFilters) {
      console.log('✅ Intent filters found in app.json');
      console.log(`📊 Number of intent filters: ${androidConfig.intentFilters.length}`);
      
      // Analyze each intent filter
      androidConfig.intentFilters.forEach((filter, index) => {
        console.log(`\n🔍 Intent Filter ${index + 1}:`);
        console.log(`   Action: ${filter.action}`);
        console.log(`   Categories: ${filter.category ? filter.category.join(', ') : 'None'}`);
        
        if (filter.data) {
          if (Array.isArray(filter.data)) {
            console.log(`   MIME Types: ${filter.data.map(d => d.mimeType || d.scheme).join(', ')}`);
          } else {
            console.log(`   MIME Type: ${filter.data.mimeType || filter.data.scheme || 'Unknown'}`);
          }
        }
      });
      
      // Check for required intent filters
      const requiredFilters = [
        'android.intent.action.SEND',
        'android.intent.action.SEND_MULTIPLE',
        'android.intent.action.PROCESS_TEXT'
      ];
      
      const foundActions = androidConfig.intentFilters.map(f => f.action);
      const missingActions = requiredFilters.filter(action => !foundActions.includes(action));
      
      if (missingActions.length === 0) {
        console.log('\n✅ All required intent filters are present');
      } else {
        console.log('\n⚠️ Missing intent filters:', missingActions.join(', '));
      }
      
    } else {
      console.log('❌ No intent filters found in app.json');
    }
    
  } catch (error) {
    console.error('❌ Error reading app.json:', error.message);
  }
}

function testAndroidManifestConfiguration() {
  console.log('\n📱 ANDROID MANIFEST CONFIGURATION');
  console.log('=' .repeat(50));
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const manifestPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
    
    if (fs.existsSync(manifestPath)) {
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      console.log('✅ AndroidManifest.xml found');
      
      // Check for intent filters in manifest
      const intentFilterCount = (manifestContent.match(/<intent-filter/g) || []).length;
      console.log(`📊 Intent filters in manifest: ${intentFilterCount}`);
      
      // Check for specific actions
      const actions = [
        'android.intent.action.SEND',
        'android.intent.action.SEND_MULTIPLE',
        'android.intent.action.PROCESS_TEXT'
      ];
      
      actions.forEach(action => {
        if (manifestContent.includes(action)) {
          console.log(`✅ Found: ${action}`);
        } else {
          console.log(`❌ Missing: ${action}`);
        }
      });
      
      // Check for MIME types
      const mimeTypes = [
        'text/plain',
        'image/*',
        'image/jpeg',
        'image/png'
      ];
      
      console.log('\n📋 MIME Type Support:');
      mimeTypes.forEach(mimeType => {
        if (manifestContent.includes(mimeType)) {
          console.log(`✅ Supports: ${mimeType}`);
        } else {
          console.log(`❌ Missing: ${mimeType}`);
        }
      });
      
    } else {
      console.log('⚠️ AndroidManifest.xml not found - will be generated by Expo');
      console.log('📝 Intent filters from app.json will be used instead');
    }
    
  } catch (error) {
    console.error('❌ Error reading AndroidManifest.xml:', error.message);
  }
}

function testShareIntentService() {
  console.log('\n🔧 SHARE INTENT SERVICE TEST');
  console.log('=' .repeat(50));
  
  try {
    // Test the ShareIntentService
    console.log('📦 Testing ShareIntentService import...');
    
    // Mock the react-native-receive-sharing-intent module
    const mockReceiveSharingIntent = {
      getReceivedFiles: () => Promise.resolve([]),
      getReceivedText: () => Promise.resolve(''),
      clearReceivedFiles: () => Promise.resolve(),
      clearReceivedText: () => Promise.resolve()
    };
    
    // Mock require function
    const originalRequire = require;
    require = function(moduleName) {
      if (moduleName === 'react-native-receive-sharing-intent') {
        return mockReceiveSharingIntent;
      }
      return originalRequire.apply(this, arguments);
    };
    
    // Import ShareIntentService
    const { ShareIntentService } = require('./src/services/ShareIntentService');
    
    console.log('✅ ShareIntentService imported successfully');
    
    // Test service initialization
    const service = ShareIntentService.getInstance();
    console.log('✅ ShareIntentService instance created');
    
    // Test callbacks
    const mockCallbacks = {
      onUrlReceived: (url) => console.log('📥 URL received:', url),
      onFileReceived: (file) => console.log('📁 File received:', file.fileName),
      onScanComplete: (result) => console.log('🔍 Scan complete:', result.scanType),
      onUrlBlocked: (result) => console.log('🚫 URL blocked:', result.url),
      onUrlVerified: (result) => console.log('✅ URL verified:', result.url),
      onError: (error) => console.log('❌ Error:', error)
    };
    
    service.initialize(mockCallbacks);
    console.log('✅ ShareIntentService initialized with callbacks');
    
    // Test service status
    console.log(`📊 Service initialized: ${service.isServiceInitialized()}`);
    console.log(`📊 Share intent supported: ${service.isShareIntentSupported()}`);
    
    // Restore original require
    require = originalRequire;
    
  } catch (error) {
    console.error('❌ ShareIntentService test failed:', error.message);
  }
}

function provideTroubleshootingSteps() {
  console.log('\n🔧 TROUBLESHOOTING STEPS');
  console.log('=' .repeat(50));
  
  console.log(`
📱 WHY SHABARI MIGHT NOT APPEAR IN SHARE MENU:

1. 🏗️ BUILD REQUIRED:
   • Expo Go doesn't support share intents
   • You need to build a development build or production APK
   • Run: npx expo run:android

2. 📦 PACKAGE INSTALLATION:
   • Ensure react-native-receive-sharing-intent is installed
   • Check: npm list react-native-receive-sharing-intent

3. 🔄 APP RESTART:
   • After configuration changes, rebuild the app
   • Clear app cache and restart

4. 📱 DEVICE TESTING:
   • Test on real Android device (not emulator)
   • Share a photo or text from another app
   • Look for "Shabari" in the share menu

5. ⚙️ PERMISSIONS:
   • Check if app has necessary permissions
   • Go to Settings > Apps > Shabari > Permissions

📋 HOW TO TEST SHARE FUNCTIONALITY:

1. 📸 SHARE A PHOTO:
   • Open Gallery app
   • Select any photo
   • Tap Share button
   • Look for "Shabari" in the list

2. 📝 SHARE TEXT:
   • Open Messages or WhatsApp
   • Select text message
   • Tap Share button
   • Look for "Shabari" in the list

3. 🔗 SHARE A LINK:
   • Open Chrome browser
   • Visit any website
   • Tap Share button
   • Look for "Shabari" in the list

✅ EXPECTED BEHAVIOR:
   • Shabari should appear in share menu
   • When selected, app should open
   • Content should be analyzed for fraud
   • Results should be displayed

🚀 BUILD COMMANDS:
   • Development build: npx expo run:android
   • Production build: eas build --platform android
   • Install APK: adb install app.apk
  `);
}

function checkPackageDependencies() {
  console.log('\n📦 PACKAGE DEPENDENCIES CHECK');
  console.log('=' .repeat(50));
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const requiredPackages = {
      'react-native-receive-sharing-intent': 'Share intent handling',
      'expo-intent-launcher': 'Intent launching',
      'expo-linking': 'Deep linking support',
      '@react-native-clipboard/clipboard': 'Clipboard access'
    };
    
    console.log('📋 Required packages for share functionality:');
    
    Object.entries(requiredPackages).forEach(([packageName, description]) => {
      const version = packageJson.dependencies?.[packageName] || packageJson.devDependencies?.[packageName];
      if (version) {
        console.log(`✅ ${packageName}: ${version} - ${description}`);
      } else {
        console.log(`❌ ${packageName}: NOT INSTALLED - ${description}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error reading package.json:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  try {
    testShareIntentConfiguration();
    testAndroidManifestConfiguration();
    testShareIntentService();
    checkPackageDependencies();
    provideTroubleshootingSteps();
    
    console.log('\n🎉 Share Intent Functionality Test Complete!');
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Build the app: npx expo run:android');
    console.log('2. Install on real Android device');
    console.log('3. Test sharing from Gallery, Messages, or Browser');
    console.log('4. Look for "Shabari" in the share menu');
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
}

runAllTests(); 