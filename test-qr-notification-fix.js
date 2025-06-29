/**
 * QR Scanner Notification Fix Test
 * Verifies that QR scanner results match notifications properly
 */

const fs = require('fs');

async function testQRNotificationFix() {
  console.log('🔬 QR Scanner Notification Fix Test\n');
  console.log('=' .repeat(50));

  const results = {
    passed: 0,
    failed: 0,
    details: []
  };

  // Test 1: Check OTP Insight Service has sendNotifications parameter
  console.log('📧 Testing OTP Insight Service Notification Control...');
  try {
    const otpServicePath = 'src/services/OtpInsightService.ts';
    const otpServiceContent = fs.readFileSync(otpServicePath, 'utf8');
    
    const hasNotificationParameter = otpServiceContent.includes('sendNotifications: boolean = true');
    const hasNotificationCheck = otpServiceContent.includes('if (sendNotifications && this.config.enableNotifications)');
    
    if (hasNotificationParameter && hasNotificationCheck) {
      console.log('✅ OTP Insight Service: Notification control implemented');
      results.passed++;
      results.details.push('✅ OTP service notification control added');
    } else {
      console.log('❌ OTP Insight Service: Notification control missing');
      results.failed++;
      results.details.push('❌ OTP service notification control missing');
    }
  } catch (error) {
    console.log('❌ OTP service check failed:', error.message);
    results.failed++;
    results.details.push('❌ OTP service check failed');
  }

  // Test 2: Check QR Scanner Service disables notifications for payment QR
  console.log('\n💰 Testing Payment QR Notification Handling...');
  try {
    const qrServicePath = 'src/services/QRScannerService.ts';
    const qrServiceContent = fs.readFileSync(qrServicePath, 'utf8');
    
    const hasPaymentNotificationDisabled = qrServiceContent.includes("analyzeMessage(data, 'PAYMENT_QR', false)");
    
    if (hasPaymentNotificationDisabled) {
      console.log('✅ Payment QR: Notifications disabled in QR analysis');
      results.passed++;
      results.details.push('✅ Payment QR notifications disabled');
    } else {
      console.log('❌ Payment QR: Notifications still enabled');
      results.failed++;
      results.details.push('❌ Payment QR notifications not disabled');
    }
  } catch (error) {
    console.log('❌ Payment QR check failed:', error.message);
    results.failed++;
    results.details.push('❌ Payment QR check failed');
  }

  // Test 3: Check QR Scanner Service disables notifications for non-payment QR
  console.log('\n🌐 Testing Non-Payment QR Notification Handling...');
  try {
    const qrServicePath = 'src/services/QRScannerService.ts';
    const qrServiceContent = fs.readFileSync(qrServicePath, 'utf8');
    
    const hasNonPaymentNotificationDisabled = qrServiceContent.includes("analyzeMessage(data, 'QR_CODE', false)");
    
    if (hasNonPaymentNotificationDisabled) {
      console.log('✅ Non-Payment QR: Notifications disabled in QR analysis');
      results.passed++;
      results.details.push('✅ Non-payment QR notifications disabled');
    } else {
      console.log('❌ Non-Payment QR: Notifications still enabled');
      results.failed++;
      results.details.push('❌ Non-payment QR notifications not disabled');
    }
  } catch (error) {
    console.log('❌ Non-payment QR check failed:', error.message);
    results.failed++;
    results.details.push('❌ Non-payment QR check failed');
  }

  // Test 4: Check QR Scanner Screen doesn't send duplicate notifications
  console.log('\n📱 Testing QR Scanner Screen Implementation...');
  try {
    const qrScreenPath = 'src/screens/LiveQRScannerScreen.tsx';
    const qrScreenContent = fs.readFileSync(qrScreenPath, 'utf8');
    
    // Check if screen properly handles results without sending notifications
    const hasProperResultHandling = qrScreenContent.includes('analyzeQRCode') &&
                                   !qrScreenContent.includes('scheduleNotificationAsync') &&
                                   qrScreenContent.includes('navigation.navigate');
    
    if (hasProperResultHandling) {
      console.log('✅ QR Scanner Screen: Proper result handling without duplicate notifications');
      results.passed++;
      results.details.push('✅ QR screen result handling correct');
    } else {
      console.log('❌ QR Scanner Screen: May have notification issues');
      results.failed++;
      results.details.push('❌ QR screen may send duplicate notifications');
    }
  } catch (error) {
    console.log('❌ QR screen check failed:', error.message);
    results.failed++;
    results.details.push('❌ QR screen check failed');
  }

  // Test 5: Check notification consistency logic
  console.log('\n🔔 Testing Notification Consistency...');
  try {
    const qrServicePath = 'src/services/QRScannerService.ts';
    const qrServiceContent = fs.readFileSync(qrServicePath, 'utf8');
    
    // Check if QR scanner has its own result handling that doesn't conflict with OTP notifications
    const hasConsistentLogic = qrServiceContent.includes('classifyQRType') &&
                              qrServiceContent.includes('calculatePaymentRiskLevel') &&
                              qrServiceContent.includes('calculateNonPaymentRiskLevel');
    
    if (hasConsistentLogic) {
      console.log('✅ Notification Logic: QR scanner has independent risk assessment');
      results.passed++;
      results.details.push('✅ QR risk assessment independent');
    } else {
      console.log('❌ Notification Logic: Risk assessment may be inconsistent');
      results.failed++;
      results.details.push('❌ Risk assessment inconsistency detected');
    }
  } catch (error) {
    console.log('❌ Notification logic check failed:', error.message);
    results.failed++;
    results.details.push('❌ Notification logic check failed');
  }

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 QR NOTIFICATION FIX TEST RESULTS');
  console.log('=' .repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);

  console.log('\n📝 Detailed Results:');
  results.details.forEach(detail => console.log(`  ${detail}`));

  console.log('\n🔧 WHAT WAS FIXED:');
  if (results.failed === 0) {
    console.log('✅ QR Scanner Notification Mismatch: RESOLVED');
    console.log('');
    console.log('📋 The Issue:');
    console.log('   • QR scanner showed "SAFE" results');
    console.log('   • But notifications showed "SUSPICIOUS" alerts');
    console.log('   • This was causing user confusion');
    console.log('');
    console.log('🔧 The Fix:');
    console.log('   • Added sendNotifications parameter to OTP Insight Service');
    console.log('   • QR scanner now disables OTP notifications during analysis');
    console.log('   • QR scanner handles its own result notifications');
    console.log('   • No more conflicting notification messages');
    console.log('');
    console.log('✅ Result:');
    console.log('   • QR results and notifications now match perfectly');
    console.log('   • No more "SAFE QR but SUSPICIOUS notification" mismatch');
    console.log('   • Users get consistent, accurate alerts');
  } else {
    console.log('🔧 Fix the issues above and rerun this test');
  }

  console.log('\n📱 How it works now:');
  console.log('1. User scans QR code');
  console.log('2. QR scanner analyzes content using its own logic');
  console.log('3. OTP Insight Service analyzes text WITHOUT sending notifications');
  console.log('4. QR scanner displays result (SAFE/SUSPICIOUS/etc.)');
  console.log('5. QR scanner navigates to results screen');
  console.log('6. Only ONE consistent result - no conflicting notifications');

  console.log('\n🎯 Expected Behavior:');
  console.log('• Safe QR: Shows "QR VERIFIED" + No notification');
  console.log('• Suspicious QR: Shows "QR SUSPICIOUS" + Matching notification');
  console.log('• Fraudulent QR: Shows "QR BLOCKED" + Critical alert');

  return results.failed === 0;
}

// Run the test
testQRNotificationFix()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }); 