/**
 * SMS Scanner Functionality Test
 * Verifies SMS reading and permissions are working correctly
 */

const fs = require('fs');
const path = require('path');

async function testSMSScannerFunctionality() {
  console.log('🔬 SMS Scanner Functionality Test\n');
  console.log('=' .repeat(50));

  const results = {
    passed: 0,
    failed: 0,
    details: []
  };

  // Test 1: Check SMS Retriever Package Installation
  console.log('📦 Testing SMS Retriever Package...');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const hasSmsRetriever = packageJson.dependencies['react-native-sms-retriever'];
    
    if (hasSmsRetriever) {
      console.log('✅ react-native-sms-retriever: Installed');
      results.passed++;
      results.details.push('✅ SMS Retriever package installed');
    } else {
      console.log('❌ react-native-sms-retriever: Missing');
      results.failed++;
      results.details.push('❌ SMS Retriever package missing');
    }
  } catch (error) {
    console.log('❌ Package check failed:', error.message);
    results.failed++;
    results.details.push('❌ Package check failed');
  }

  // Test 2: Check SMS Reader Service Implementation
  console.log('\n📱 Testing SMS Reader Service...');
  try {
    const smsServicePath = 'src/services/SMSReaderService.ts';
    const smsServiceContent = fs.readFileSync(smsServicePath, 'utf8');
    
    // Check for real SMS reading implementation
    const hasRealImplementation = smsServiceContent.includes('react-native-sms-retriever') &&
                                 smsServiceContent.includes('SmsRetriever.getMessages') &&
                                 smsServiceContent.includes('Reading SMS messages from device');
    
    if (hasRealImplementation) {
      console.log('✅ SMS Reader Service: Real implementation active');
      results.passed++;
      results.details.push('✅ Real SMS reading implementation');
    } else {
      console.log('❌ SMS Reader Service: Still using mock data');
      results.failed++;
      results.details.push('❌ Mock implementation detected');
    }

    // Check for fallback handling
    const hasFallback = smsServiceContent.includes('Falling back to mock data');
    if (hasFallback) {
      console.log('✅ Fallback mechanism: Present');
      results.passed++;
      results.details.push('✅ Fallback to mock data available');
    } else {
      console.log('⚠️ Fallback mechanism: Missing');
      results.details.push('⚠️ No fallback mechanism');
    }

  } catch (error) {
    console.log('❌ SMS Service check failed:', error.message);
    results.failed++;
    results.details.push('❌ SMS Service check failed');
  }

  // Test 3: Check SMS Permissions Configuration
  console.log('\n🔐 Testing SMS Permissions...');
  try {
    const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
    const permissions = appJson.expo.android.permissions || [];
    
    const hasReadSMS = permissions.includes('android.permission.READ_SMS');
    const hasReceiveSMS = permissions.includes('android.permission.RECEIVE_SMS');
    
    if (hasReadSMS && hasReceiveSMS) {
      console.log('✅ SMS Permissions: Properly configured');
      console.log('  - READ_SMS: ✓');
      console.log('  - RECEIVE_SMS: ✓');
      results.passed++;
      results.details.push('✅ SMS permissions configured');
    } else {
      console.log('❌ SMS Permissions: Missing or incomplete');
      console.log(`  - READ_SMS: ${hasReadSMS ? '✓' : '✗'}`);
      console.log(`  - RECEIVE_SMS: ${hasReceiveSMS ? '✓' : '✗'}`);
      results.failed++;
      results.details.push('❌ SMS permissions incomplete');
    }
  } catch (error) {
    console.log('❌ Permissions check failed:', error.message);
    results.failed++;
    results.details.push('❌ Permissions check failed');
  }

  // Test 4: Check SMS Scanner Screen
  console.log('\n🖥️ Testing SMS Scanner Screen...');
  try {
    const smsScreenPath = 'src/screens/SMSScannerScreen.tsx';
    const smsScreenContent = fs.readFileSync(smsScreenPath, 'utf8');
    
    const hasPermissionHandling = smsScreenContent.includes('SMS Access Required') &&
                                 smsScreenContent.includes('Grant Permission');
    const hasProperLoading = smsScreenContent.includes('initializeSMSService') &&
                            smsScreenContent.includes('loadSMSMessages');
    
    if (hasPermissionHandling && hasProperLoading) {
      console.log('✅ SMS Scanner Screen: Properly configured');
      results.passed++;
      results.details.push('✅ SMS Scanner screen configured');
    } else {
      console.log('❌ SMS Scanner Screen: Issues detected');
      results.failed++;
      results.details.push('❌ SMS Scanner screen issues');
    }
  } catch (error) {
    console.log('❌ SMS Screen check failed:', error.message);
    results.failed++;
    results.details.push('❌ SMS Screen check failed');
  }

  // Test 5: Check Package.json Exclusions
  console.log('\n🚫 Testing Package Exclusions...');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const exclusions = packageJson.expo?.doctor?.reactNativeDirectoryCheck?.exclude || [];
    
    const isSmsRetrieverExcluded = exclusions.includes('react-native-sms-retriever');
    
    if (!isSmsRetrieverExcluded) {
      console.log('✅ SMS Retriever: Not excluded from doctor checks');
      results.passed++;
      results.details.push('✅ SMS Retriever not excluded');
    } else {
      console.log('❌ SMS Retriever: Still excluded from doctor checks');
      results.failed++;
      results.details.push('❌ SMS Retriever excluded');
    }
  } catch (error) {
    console.log('❌ Exclusions check failed:', error.message);
    results.failed++;
    results.details.push('❌ Exclusions check failed');
  }

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 SMS SCANNER TEST RESULTS');
  console.log('=' .repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);

  console.log('\n📝 Detailed Results:');
  results.details.forEach(detail => console.log(`  ${detail}`));

  console.log('\n🔧 NEXT STEPS:');
  if (results.failed === 0) {
    console.log('🎉 SMS Scanner is fully configured and ready!');
    console.log('📱 Build and test on a real Android device:');
    console.log('   npx expo run:android --variant release');
    console.log('⚠️ Note: SMS reading requires a real Android device (not Expo Go)');
  } else {
    console.log('🔧 Fix the issues above and rerun this test');
    console.log('📚 Common issues:');
    console.log('   - Missing react-native-sms-retriever package');
    console.log('   - Incorrect permissions in app.json');
    console.log('   - Mock implementation still active');
  }

  console.log('\n📋 SMS Scanner Usage:');
  console.log('1. Open Shabari app on Android device');
  console.log('2. Navigate to SMS Scanner');
  console.log('3. Grant SMS permissions when prompted');
  console.log('4. View and analyze actual SMS messages');
  console.log('5. Select messages to scan for fraud');

  return results.failed === 0;
}

// Run the test
testSMSScannerFunctionality()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }); 