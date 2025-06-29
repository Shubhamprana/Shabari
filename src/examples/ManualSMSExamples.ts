/**
 * Manual SMS Analyzer - Usage Examples
 * Demonstrates WHO and WHAT analysis with real-world test cases
 */

import { manualSMSAnalyzer, SMSAnalysisInput } from '../services/ManualSMSAnalyzer';

export class ManualSMSExamples {
  
  /**
   * Example 1: Classic Banking Fraud SMS
   */
  static async testBankingFraudSMS() {
    console.log('\n🚨 Testing Banking Fraud SMS...');
    
    const fraudSMS: SMSAnalysisInput = {
      senderInfo: 'SBI12345',  // WHO: Fake SBI sender (suspicious pattern)
      messageContent: 'URGENT: Your SBI account has been blocked due to suspicious activity. Click link to reactivate immediately: http://sbi-verify.tk/reactivate. Share OTP when prompted. Valid for 2 hours only.',  // WHAT: Multiple fraud patterns
      userLocation: 'Mumbai',
      receivedTime: new Date()
    };

    const result = await manualSMSAnalyzer.analyzeSMS(fraudSMS);
    
    console.log('📊 Analysis Result:');
    console.log(`   Fraud Status: ${result.isFraud ? '🚨 FRAUD DETECTED' : '✅ APPEARS SAFE'}`);
    console.log(`   Risk Level: ${result.riskLevel}`);
    console.log(`   Confidence: ${result.confidenceScore}%`);
    console.log(`   WHO Analysis: ${result.senderAnalysis.senderLegitimacy} (${result.senderAnalysis.senderReputation}% reputation)`);
    console.log(`   WHAT Analysis: ${result.contentAnalysis.fraudPatterns.length} fraud patterns detected`);
    console.log(`   Summary: ${result.explanation.summary}`);
    
    return result;
  }

  /**
   * Example 2: Legitimate Bank SMS
   */
  static async testLegitimateSSMS() {
    console.log('\n✅ Testing Legitimate SMS...');
    
    const legitSMS: SMSAnalysisInput = {
      senderInfo: 'SBIINB',  // WHO: Real SBI sender (legitimate pattern)
      messageContent: 'Dear Customer, your account ending 1234 has been credited with Rs.5000 on 15-Jan-2024. Balance: Rs.25000. For queries call our helpline 1800-11-2211.',  // WHAT: Professional, no fraud patterns
      userLocation: 'Delhi',
      receivedTime: new Date()
    };

    const result = await manualSMSAnalyzer.analyzeSMS(legitSMS);
    
    console.log('📊 Analysis Result:');
    console.log(`   Fraud Status: ${result.isFraud ? '🚨 FRAUD DETECTED' : '✅ APPEARS SAFE'}`);
    console.log(`   Risk Level: ${result.riskLevel}`);
    console.log(`   Confidence: ${result.confidenceScore}%`);
    console.log(`   WHO Analysis: ${result.senderAnalysis.senderLegitimacy} (${result.senderAnalysis.senderReputation}% reputation)`);
    console.log(`   WHAT Analysis: ${result.contentAnalysis.fraudPatterns.length} fraud patterns detected`);
    console.log(`   Summary: ${result.explanation.summary}`);
    
    return result;
  }

  /**
   * Example 3: Government Impersonation Fraud
   */
  static async testGovernmentFraudSMS() {
    console.log('\n🏛️ Testing Government Impersonation Fraud...');
    
    const govFraudSMS: SMSAnalysisInput = {
      senderInfo: 'UIDAI123',  // WHO: Fake UIDAI sender
      messageContent: 'URGENT: Your Aadhaar card will be blocked within 24 hours. Update details immediately by calling 9876543210 and sharing OTP. Failure to comply will result in legal action.',  // WHAT: Threats + urgency + information harvesting
      userLocation: 'Bangalore',
      receivedTime: new Date()
    };

    const result = await manualSMSAnalyzer.analyzeSMS(govFraudSMS);
    
    console.log('📊 Analysis Result:');
    console.log(`   Fraud Status: ${result.isFraud ? '🚨 FRAUD DETECTED' : '✅ APPEARS SAFE'}`);
    console.log(`   Risk Level: ${result.riskLevel}`);
    console.log(`   Confidence: ${result.confidenceScore}%`);
    console.log(`   WHO Analysis: ${result.senderAnalysis.senderLegitimacy} (${result.senderAnalysis.senderReputation}% reputation)`);
    console.log(`   WHAT Analysis: ${result.contentAnalysis.fraudPatterns.length} fraud patterns detected`);
    console.log(`   Summary: ${result.explanation.summary}`);
    
    return result;
  }

  /**
   * Example 4: Prize/Lottery Fraud
   */
  static async testLotteryFraudSMS() {
    console.log('\n🎰 Testing Lottery Fraud SMS...');
    
    const lotteryFraudSMS: SMSAnalysisInput = {
      senderInfo: '+91-9876543210',  // WHO: Phone number (suspicious for lottery claims)
      messageContent: 'Congratulations! You have won Rs.50,000 in KBC lottery. To claim your prize, click: http://kbc-winner.tk and share your bank details. Winner ID: KBC123456. Valid till tomorrow only!',  // WHAT: Prize fraud + urgency + information harvesting
      userLocation: 'Chennai',
      receivedTime: new Date()
    };

    const result = await manualSMSAnalyzer.analyzeSMS(lotteryFraudSMS);
    
    console.log('📊 Analysis Result:');
    console.log(`   Fraud Status: ${result.isFraud ? '🚨 FRAUD DETECTED' : '✅ APPEARS SAFE'}`);
    console.log(`   Risk Level: ${result.riskLevel}`);
    console.log(`   Confidence: ${result.confidenceScore}%`);
    console.log(`   WHO Analysis: ${result.senderAnalysis.senderLegitimacy} (${result.senderAnalysis.senderReputation}% reputation)`);
    console.log(`   WHAT Analysis: ${result.contentAnalysis.fraudPatterns.length} fraud patterns detected`);
    console.log(`   Summary: ${result.explanation.summary}`);
    
    return result;
  }

  /**
   * Example 5: OTP Phishing
   */
  static async testOTPPhishingSMS() {
    console.log('\n🔐 Testing OTP Phishing SMS...');
    
    const otpPhishingSMS: SMSAnalysisInput = {
      senderInfo: 'HDFCBK1',  // WHO: Fake HDFC sender (suspicious pattern)
      messageContent: 'Dear Customer, suspicious login detected on your HDFC account. For security, please call 8765432109 immediately and provide the OTP we will send to verify your identity.',  // WHAT: Social engineering + OTP harvesting
      userLocation: 'Pune',
      receivedTime: new Date()
    };

    const result = await manualSMSAnalyzer.analyzeSMS(otpPhishingSMS);
    
    console.log('📊 Analysis Result:');
    console.log(`   Fraud Status: ${result.isFraud ? '🚨 FRAUD DETECTED' : '✅ APPEARS SAFE'}`);
    console.log(`   Risk Level: ${result.riskLevel}`);
    console.log(`   Confidence: ${result.confidenceScore}%`);
    console.log(`   WHO Analysis: ${result.senderAnalysis.senderLegitimacy} (${result.senderAnalysis.senderReputation}% reputation)`);
    console.log(`   WHAT Analysis: ${result.contentAnalysis.fraudPatterns.length} fraud patterns detected`);
    console.log(`   Summary: ${result.explanation.summary}`);
    
    return result;
  }

  /**
   * Run all test examples
   */
  static async runAllExamples() {
    console.log('🔍 MANUAL SMS ANALYZER - WHO & WHAT ANALYSIS EXAMPLES');
    console.log('=====================================================');
    
    try {
      await this.testBankingFraudSMS();
      await this.testLegitimateSSMS();
      await this.testGovernmentFraudSMS();
      await this.testLotteryFraudSMS();
      await this.testOTPPhishingSMS();
      
      console.log('\n✅ All examples completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Error running examples:', error);
    }
  }

  /**
   * Quick fraud check for simple use cases
   */
  static async quickCheck(senderInfo: string, messageContent: string) {
    console.log(`\n🔍 Quick Check: ${senderInfo}`);
    
    const result = await manualSMSAnalyzer.analyzeSMS({
      senderInfo,
      messageContent
    });
    
    console.log(`Result: ${result.isFraud ? '🚨 FRAUD' : '✅ SAFE'} (${result.riskLevel} risk, ${result.confidenceScore}% confidence)`);
    console.log(`Reason: ${result.explanation.summary}`);
    
    return result;
  }
}

// Export for easy testing
export const testManualSMSAnalyzer = ManualSMSExamples.runAllExamples; 