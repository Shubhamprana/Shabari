#!/usr/bin/env node

/**
 * 🛡️ Verify: Popups Restored
 */

console.log('🛡️ Verifying URL Protection Popups Restored...\n');

const fs = require('fs');
const path = require('path');

try {
  // Read the URLProtectionService file
  const serviceFile = path.join(__dirname, 'src/services/URLProtectionService.ts');
  const fileContent = fs.readFileSync(serviceFile, 'utf8');
  
  // Check that original functionality is restored
  const checks = [
    { 
      name: 'App return popup enabled', 
      check: fileContent.includes("Alert.alert(") && fileContent.includes("'🛡️ Shabari Security Check'")
    },
    { 
      name: 'Initial popup enabled', 
      check: fileContent.includes('this.showProtectionStatus();') && !fileContent.includes('// this.showProtectionStatus();')
    },
    { 
      name: 'Original monitoring mode', 
      check: fileContent.includes("'🛡️ Started URL Protection monitoring'") && !fileContent.includes('silent mode')
    },
    { 
      name: 'URL activity check active', 
      check: fileContent.includes('timeSinceStateChange < 3000') && !fileContent.includes('return;') 
    }
  ];
  
  console.log('📋 Restoration Status:');
  let allRestored = true;
  
  checks.forEach(check => {
    const status = check.check ? '✅ RESTORED' : '❌ NOT RESTORED';
    console.log(`${status} ${check.name}`);
    if (!check.check) allRestored = false;
  });
  
  console.log('\n🎉 RESULT:');
  if (allRestored) {
    console.log('✅ SUCCESS: Original popup functionality has been restored!');
    console.log('\n📱 What\'s back:');
    console.log('• Popup when returning to app after potential link click');
    console.log('• Initial "Protection Active" popup when service starts');
    console.log('• Full URL protection monitoring');
    console.log('• Proactive security checking');
  } else {
    console.log('❌ Some original functionality may not be fully restored');
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
} 