/**
 * Test False Positive Reduction
 * Verify that legitimate messages are not flagged as fraud
 */

const { manualSMSAnalyzer } = require('./src/services/ManualSMSAnalyzer');

// Test legitimate messages that should NEVER be flagged as fraud
const legitimateMessages = [
  {
    name: 'Official Bank Credit Alert',
    senderInfo: 'SBIINB',
    messageContent: 'Dear customer, your account has been credited with Rs 25,000 on 15-Jan-2024. Balance: Rs 45,000. Thank you for using SBI.',
    shouldBeFraud: false
  },
  {
    name: 'Bank Debit Alert',
    senderInfo: 'HDFCBANK',
    messageContent: 'Your account ending 1234 has been debited with Rs 500 for UPI payment. Available balance: Rs 12,500. For queries call 18002586161.',
    shouldBeFraud: false
  },
  {
    name: 'OTP Message',
    senderInfo: 'AXISBANK',
    messageContent: 'Your OTP for mobile banking is 123456. Valid for 10 minutes. Do not share your OTP with anyone.',
    shouldBeFraud: false
  },
  {
    name: 'E-commerce Order Confirmation',
    senderInfo: 'AMAZON',
    messageContent: 'Your order has been confirmed. Order ID: 123456789. Track your order on Amazon app. Thank you for shopping with us.',
    shouldBeFraud: false
  },
  {
    name: 'UPI Payment Success',
    senderInfo: 'PAYTM',
    messageContent: 'Payment of Rs 299 to SWIGGY was successful. Transaction ID: PAY123456789. UPI ID: user@paytm',
    shouldBeFraud: false
  },
  {
    name: 'Mobile Recharge Confirmation',
    senderInfo: 'AIRTEL',
    messageContent: 'Your mobile number 9876543210 has been recharged with Rs 199 plan. Validity: 28 days. Talktime: Rs 199.',
    shouldBeFraud: false
  },
  {
    name: 'Bill Payment Confirmation',
    senderInfo: 'PHONEPE',
    messageContent: 'Electricity bill payment of Rs 1,250 was successful. Reference number: EPB123456789. Thank you for using PhonePe.',
    shouldBeFraud: false
  },
  {
    name: 'Casual Conversation',
    senderInfo: '+919876543210',
    messageContent: 'Hi! How are you doing? Are we still meeting for dinner tonight?',
    shouldBeFraud: false
  },
  {
    name: 'Work Message',
    senderInfo: '+919876543211',
    messageContent: 'Please send the report by 5 PM today. Thanks!',
    shouldBeFraud: false
  },
  {
    name: 'ATM Transaction Alert',
    senderInfo: 'ICICIBANK',
    messageContent: 'ATM withdrawal of Rs 2,000 from card ending 1234 at ICICI ATM Mumbai on 15-Jan-2024 15:30. Available balance: Rs 25,000.',
    shouldBeFraud: false
  }
];

// Test messages that should still be detected as fraud
const fraudMessages = [
  {
    name: 'Fake Bank Urgent Action',
    senderInfo: 'FAKE-SBI',
    messageContent: 'URGENT ACTION REQUIRED: Your account will be suspended. Click here immediately to verify: http://bit.ly/fake-sbi-verify',
    shouldBeFraud: true
  },
  {
    name: 'Lottery Scam',
    senderInfo: '+919999999999',
    messageContent: 'Congratulations! You have won lottery prize of $50,000. Call now to claim your prize immediately. Pay processing fee of Rs 5,000.',
    shouldBeFraud: true
  },
  {
    name: 'Government Impersonation',
    senderInfo: 'GOV-FAKE',
    messageContent: 'Government refund of Rs 25,000 approved. Click here to claim: http://tinyurl.com/fake-gov-refund',
    shouldBeFraud: true
  }
];

async function testFalsePositiveReduction() {
  console.log('🛡️ Testing False Positive Reduction\n');
  console.log('🎯 Goal: Ensure legitimate messages are NOT flagged as fraud');
  console.log('🔧 Applied fixes: Higher threshold (0.8), better legitimate patterns, sender verification\n');
  console.log('=' .repeat(80));

  let totalTests = 0;
  let passedTests = 0;
  let falsePositives = 0;
  let falseNegatives = 0;

  console.log('\n📋 TESTING LEGITIMATE MESSAGES (Should be SAFE)');
  console.log('=' .repeat(50));

  // Test legitimate messages
  for (let i = 0; i < legitimateMessages.length; i++) {
    const test = legitimateMessages[i];
    totalTests++;

    console.log(`\n✅ Test ${i + 1}: ${test.name}`);
    console.log(`Sender: ${test.senderInfo}`);
    console.log(`Message: ${test.messageContent.substring(0, 100)}...`);

    try {
      const result = await manualSMSAnalyzer.analyzeSMS({
        senderInfo: test.senderInfo,
        messageContent: test.messageContent,
        enableMLAnalysis: true
      });

      const isCorrect = result.isFraud === test.shouldBeFraud;
      console.log(`Result: ${result.isFraud ? '🚨 FRAUD' : '✅ SAFE'}, Confidence: ${result.confidenceScore}%, Risk: ${result.riskLevel}`);
      
      if (result.mlAnalysis.mlVerdict) {
        console.log(`ML Analysis: ${result.mlAnalysis.mlVerdict.isFraud ? 'FRAUD' : 'SAFE'} (${result.mlAnalysis.mlScore}%)`);
        console.log(`ML Details: "${result.mlAnalysis.mlVerdict.details}"`);
      }

      if (isCorrect) {
        console.log('✅ CORRECT - No false positive');
        passedTests++;
      } else {
        console.log('❌ FALSE POSITIVE - Legitimate message flagged as fraud!');
        falsePositives++;
      }

    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
    }
  }

  console.log('\n\n🚨 TESTING FRAUD MESSAGES (Should be FRAUD)');
  console.log('=' .repeat(50));

  // Test fraud messages
  for (let i = 0; i < fraudMessages.length; i++) {
    const test = fraudMessages[i];
    totalTests++;

    console.log(`\n🚨 Test ${i + 1}: ${test.name}`);
    console.log(`Sender: ${test.senderInfo}`);
    console.log(`Message: ${test.messageContent.substring(0, 100)}...`);

    try {
      const result = await manualSMSAnalyzer.analyzeSMS({
        senderInfo: test.senderInfo,
        messageContent: test.messageContent,
        enableMLAnalysis: true
      });

      const isCorrect = result.isFraud === test.shouldBeFraud;
      console.log(`Result: ${result.isFraud ? '🚨 FRAUD' : '✅ SAFE'}, Confidence: ${result.confidenceScore}%, Risk: ${result.riskLevel}`);
      
      if (result.mlAnalysis.mlVerdict) {
        console.log(`ML Analysis: ${result.mlAnalysis.mlVerdict.isFraud ? 'FRAUD' : 'SAFE'} (${result.mlAnalysis.mlScore}%)`);
        console.log(`ML Details: "${result.mlAnalysis.mlVerdict.details}"`);
      }

      if (isCorrect) {
        console.log('✅ CORRECT - Fraud detected');
        passedTests++;
      } else {
        console.log('❌ FALSE NEGATIVE - Fraud message not detected!');
        falseNegatives++;
      }

    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
    }
  }

  // Summary
  console.log('\n\n📊 FALSE POSITIVE REDUCTION TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`• Total Tests: ${totalTests}`);
  console.log(`• Passed: ${passedTests}`);
  console.log(`• Failed: ${totalTests - passedTests}`);
  console.log(`• False Positives: ${falsePositives} (legitimate messages flagged as fraud)`);
  console.log(`• False Negatives: ${falseNegatives} (fraud messages not detected)`);
  console.log(`• Accuracy: ${Math.round((passedTests / totalTests) * 100)}%`);
  console.log(`• False Positive Rate: ${Math.round((falsePositives / legitimateMessages.length) * 100)}%`);

  if (falsePositives === 0) {
    console.log('\n🎉 EXCELLENT! No false positives detected!');
    console.log('✅ Legitimate messages are properly protected from fraud detection');
  } else {
    console.log(`\n⚠️ ${falsePositives} false positive(s) detected - needs further tuning`);
  }

  if (falseNegatives === 0) {
    console.log('✅ All fraud messages were correctly detected');
  } else {
    console.log(`⚠️ ${falseNegatives} fraud message(s) missed - consider adjusting thresholds`);
  }

  console.log('\n🔧 IMPROVEMENTS APPLIED:');
  console.log('✅ Fraud threshold raised to 0.8 (more conservative)');
  console.log('✅ Enhanced legitimate banking patterns');
  console.log('✅ Official sender verification added');
  console.log('✅ Multiple indicators required for fraud detection');
  console.log('✅ Stronger scoring for legitimate messages');
  
  console.log('\n🎯 RESULT: Model should now have significantly fewer false positives!');
}

// Run the test
testFalsePositiveReduction().catch(console.error); 