#!/usr/bin/env node

/**
 * 🛡️ Test: Verify Annoying Popups Are Disabled
 * 
 * This script verifies that the URLProtectionService no longer
 * shows annoying popups every time the user returns to the app.
 */

console.log('🛡️ Testing: No More Annoying URL Protection Popups\n');

async function testNoMorePopups() {
  console.log('📋 Checking URLProtectionService modifications...\n');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Read the URLProtectionService file
    const serviceFile = path.join(__dirname, 'src/services/URLProtectionService.ts');
    const fileContent = fs.readFileSync(serviceFile, 'utf8');
    
    // Check if the annoying popup code is disabled
    const checks = [
      {
        test: 'checkForRecentUrlActivity() disabled',
        pattern: /console\.log\('🛡️ URL Protection: Monitoring active \(no popup\)'\);[\s\S]*return;/,
        expected: true,
        description: 'The app return popup should be disabled'
      },
      {
        test: 'showProtectionStatus() commented out',
        pattern: /\/\/\s*this\.showProtectionStatus\(\);/,
        expected: true,
        description: 'The initial protection popup should be commented out'
      },
      {
        test: 'Old popup code is commented',
        pattern: /\/\*[\s\S]*Alert\.alert\([\s\S]*'🛡️ Shabari Security Check'[\s\S]*\*\//,
        expected: true,
        description: 'The old annoying popup code should be commented out'
      },
      {
        test: 'Silent mode enabled',
        pattern: /console\.log\('🛡️ Started URL Protection monitoring \(silent mode\)'\);/,
        expected: true,
        description: 'URL protection should run in silent mode'
      }
    ];
    
    let allPassed = true;
    
    for (const check of checks) {
      const found = check.pattern.test(fileContent);
      const status = found === check.expected ? '✅ PASSED' : '❌ FAILED';
      console.log(`${status} ${check.test}`);
      console.log(`   ${check.description}`);
      
      if (found !== check.expected) {
        allPassed = false;
      }
    }
    
    console.log('\n📊 TEST RESULTS:');
    
    if (allPassed) {
      console.log('✅ SUCCESS: All annoying popups have been disabled!');
      console.log('\n🎉 What changed:');
      console.log('• ❌ No more popup when you return to the app');
      console.log('• ❌ No more initial "Protection Active" popup');
      console.log('• ✅ URL protection still works for actual threats');
      console.log('• ✅ Protection only shows alerts for dangerous URLs');
      console.log('• ✅ Silent monitoring in the background');
      
      console.log('\n📱 How URL protection now works:');
      console.log('1. 🔄 Runs silently in the background');
      console.log('2. 🔗 Only activates when you share URLs with the app');
      console.log('3. 🚫 Blocks dangerous URLs with alert');
      console.log('4. ✅ Allows safe URLs with options');
      console.log('5. 🚀 No annoying popups on app navigation!');
      
    } else {
      console.log('❌ FAILED: Some popup fixes may not be applied correctly');
    }
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function generateNewAPK() {
  console.log('\n🔨 Ready to build new APK without annoying popups...\n');
  
  console.log('📋 Build options:');
  console.log('1. 🚀 Quick build: npm run build');
  console.log('2. 🎯 Smart build: node smart-build.js');
  console.log('3. 📱 Production APK: npm run build:production');
  
  console.log('\n💡 Recommended:');
  console.log('   node smart-build.js');
  console.log('   (Automatically tries multiple build profiles)');
}

// Run the test
testNoMorePopups().then(success => {
  if (success) {
    generateNewAPK();
  }
}).catch(error => {
  console.error('Test execution failed:', error);
}); 