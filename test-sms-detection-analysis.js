/**
 * 📱 SMS DETECTION ANALYSIS TEST
 * 
 * Comprehensive test showing how Shabari analyzes SMS messages:
 * 1. WHO - Sender verification and legitimacy
 * 2. WHAT - Content patterns and fraud detection
 * 
 * Run: node test-sms-detection-analysis.js
 */

console.log('🔍 SHABARI SMS DETECTION ANALYSIS TEST\n');

// Mock the analysis components
const mockSenderVerification = {
  verifySender: (senderId, messageText) => {
    console.log(`👤 SENDER ANALYSIS (WHO):`);
    console.log(`   Sender ID: ${senderId}`);
    
    let isVerified = false;
    let senderType = 'UNKNOWN';
    let riskLevel = 'SAFE';
    let details = [];
    
    // DLT Header verification (India SMS regulation)
    const knownHeaders = ['HDFC-BANK', 'SBI-BANK', 'AMAZON', 'PAYTM', 'GOOGLE', 'WHATSAPP'];
    if (knownHeaders.some(header => senderId.includes(header))) {
      isVerified = true;
      senderType = senderId.includes('BANK') ? 'BANK' : 'ECOMMERCE';
      details.push('✅ Verified DLT header');
    }
    
    // Phone number analysis
    if (/^\+?\d{10,15}$/.test(senderId)) {
      details.push('📞 Phone number sender');
      if (senderId.length === 10) {
        riskLevel = 'SUSPICIOUS';
        details.push('⚠️ 10-digit number (potential spam)');
      }
    }
    
    // Unknown/suspicious sender patterns
    if (!isVerified && senderId.length < 6) {
      riskLevel = 'HIGH_RISK';
      details.push('🚨 Short sender ID (suspicious)');
    }
    
    // URL analysis in message
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = messageText.match(urlRegex);
    if (urls) {
      details.push(`🔗 Contains ${urls.length} URL(s)`);
      urls.forEach(url => {
        try {
          const hostname = new URL(url).hostname;
          const suspiciousDomains = ['bit.ly', 'tinyurl.com', 'fake-bank.com', 'phish-site.com'];
          if (suspiciousDomains.some(domain => hostname.includes(domain))) {
            riskLevel = 'CRITICAL';
            details.push(`🚨 Suspicious URL: ${hostname}`);
          } else {
            details.push(`🔗 URL: ${hostname}`);
          }
        } catch (e) {
          details.push('🚨 Malformed URL detected');
        }
      });
    }
    
    console.log(`   Verification Status: ${isVerified ? '✅ VERIFIED' : '❌ UNVERIFIED'}`);
    console.log(`   Sender Type: ${senderType}`);
    console.log(`   Risk Level: ${riskLevel}`);
    details.forEach(detail => console.log(`   ${detail}`));
    console.log('');
    
    return { isVerified, senderType, riskLevel, details };
  }
};

const mockContentAnalysis = {
  analyzeContent: (messageText) => {
    console.log(`📝 CONTENT ANALYSIS (WHAT):`);
    console.log(`   Message: "${messageText}"`);
    
    const analysis = {
      fraudPatterns: [],
      legitimatePatterns: [],
      contentFlags: {
        hasOTP: false,
        hasPhishing: false,
        hasUrgentLanguage: false,
        hasMoneyRequest: false,
        hasLotteryScam: false,
        hasBankingTerms: false,
        hasThreats: false
      },
      riskScore: 0,
      contentType: 'UNKNOWN'
    };
    
    const text = messageText.toLowerCase();
    
    // 1. OTP Detection
    if (/\b\d{4,8}\b/.test(text) && /(otp|code|pin|verification|authenticate)/i.test(text)) {
      analysis.contentFlags.hasOTP = true;
      analysis.legitimatePatterns.push('✅ OTP code detected');
      analysis.contentType = 'OTP_MESSAGE';
      analysis.riskScore -= 10; // OTP messages are usually legitimate
    }
    
    // 2. Banking/Financial Terms
    if (/(bank|account|transaction|payment|debit|credit|balance)/i.test(text)) {
      analysis.contentFlags.hasBankingTerms = true;
      analysis.legitimatePatterns.push('✅ Banking terminology');
      analysis.riskScore -= 5;
    }
    
    // 3. Phishing Patterns
    const phishingPatterns = [
      { pattern: /(click here|verify now|update.*account)/i, name: 'Action prompts' },
      { pattern: /(suspend|block|freeze).*account/i, name: 'Account threats' },
      { pattern: /(expire|expir).*\d+.*(hour|minute|day)/i, name: 'Time pressure' },
      { pattern: /verify.*(identity|account|card)/i, name: 'Verification requests' }
    ];
    
    phishingPatterns.forEach(({ pattern, name }) => {
      if (pattern.test(text)) {
        analysis.contentFlags.hasPhishing = true;
        analysis.fraudPatterns.push(`🚨 ${name} detected`);
        analysis.riskScore += 25;
      }
    });
    
    // 4. Urgent Language
    if (/(urgent|immediate|asap|act now|final|last chance)/i.test(text)) {
      analysis.contentFlags.hasUrgentLanguage = true;
      analysis.fraudPatterns.push('⚠️ Urgent language detected');
      analysis.riskScore += 15;
    }
    
    // 5. Money/Prize Scams
    const moneyPatterns = [
      { pattern: /(won|win|winner).*(prize|lottery|₹|rs|money)/i, name: 'Lottery scam' },
      { pattern: /(send|transfer|pay).*(₹|rs|money|\d+)/i, name: 'Money request' },
      { pattern: /(refund|cashback).*(₹|rs|\d+)/i, name: 'Fake refund' },
      { pattern: /congratulations.*(won|win|prize)/i, name: 'Prize scam' }
    ];
    
    moneyPatterns.forEach(({ pattern, name }) => {
      if (pattern.test(text)) {
        if (name.includes('Lottery') || name.includes('Prize')) {
          analysis.contentFlags.hasLotteryScam = true;
        } else {
          analysis.contentFlags.hasMoneyRequest = true;
        }
        analysis.fraudPatterns.push(`🚨 ${name} detected`);
        analysis.riskScore += 30;
      }
    });
    
    // 6. Threats and Fear Tactics
    const threatPatterns = [
      /(arrest|police|legal action|court|jail)/i,
      /(penalty|fine|charges|lawsuit)/i,
      /(suspend|block|close).*account/i
    ];
    
    threatPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        analysis.contentFlags.hasThreats = true;
        analysis.fraudPatterns.push('🚨 Threat/fear tactics detected');
        analysis.riskScore += 35;
      }
    });
    
    // 7. Legitimate Service Patterns
    const legitimatePatterns = [
      { pattern: /thank you for (using|your)/i, name: 'Service appreciation' },
      { pattern: /your (order|booking|reservation)/i, name: 'Service confirmation' },
      { pattern: /do not share (this|your|otp)/i, name: 'Security advice' },
      { pattern: /valid for \d+ (minutes|hours)/i, name: 'Time validity' },
      { pattern: /reference (number|id)/i, name: 'Transaction reference' }
    ];
    
    legitimatePatterns.forEach(({ pattern, name }) => {
      if (pattern.test(text)) {
        analysis.legitimatePatterns.push(`✅ ${name}`);
        analysis.riskScore -= 5;
      }
    });
    
    // Determine final risk level
    let riskLevel = 'SAFE';
    if (analysis.riskScore >= 50) riskLevel = 'CRITICAL';
    else if (analysis.riskScore >= 25) riskLevel = 'HIGH_RISK';
    else if (analysis.riskScore >= 10) riskLevel = 'SUSPICIOUS';
    
    console.log(`   Content Type: ${analysis.contentType}`);
    console.log(`   Risk Score: ${analysis.riskScore}`);
    console.log(`   Risk Level: ${riskLevel}`);
    
    if (analysis.legitimatePatterns.length > 0) {
      console.log(`   Legitimate Indicators:`);
      analysis.legitimatePatterns.forEach(pattern => console.log(`     ${pattern}`));
    }
    
    if (analysis.fraudPatterns.length > 0) {
      console.log(`   Fraud Indicators:`);
      analysis.fraudPatterns.forEach(pattern => console.log(`     ${pattern}`));
    }
    
    console.log(`   Content Flags:`);
    Object.entries(analysis.contentFlags).forEach(([flag, value]) => {
      if (value) console.log(`     ✓ ${flag}`);
    });
    
    console.log('');
    return { ...analysis, riskLevel };
  }
};

// Test SMS messages with different fraud patterns
const testMessages = [
  {
    id: 'legitimate_otp',
    sender: 'HDFC-BANK',
    message: 'Your OTP for transaction is 123456. Valid for 10 minutes. Do not share with anyone. -HDFC Bank'
  },
  {
    id: 'phishing_scam',
    sender: '+919876543210',
    message: 'URGENT! Your account will be blocked. Click here to verify: http://fake-bank.com/verify'
  },
  {
    id: 'lottery_scam',
    sender: 'LOTTERY',
    message: 'Congratulations! You have won Rs 50,000 in our lottery. Call now to claim your prize.'
  },
  {
    id: 'legitimate_ecommerce',
    sender: 'AMAZON',
    message: 'Your Amazon order has been shipped. Track: AMZ123456789. Thank you for shopping with us.'
  },
  {
    id: 'money_request_scam',
    sender: '+911234567890',
    message: 'Hi! I need urgent money transfer. Please send Rs 10,000 to this account: 1234567890'
  },
  {
    id: 'fake_government',
    sender: 'GOV-INDIA',
    message: 'Your Aadhaar will be suspended. Pay Rs 500 penalty immediately or face legal action.'
  }
];

// Run the analysis for each test message
function runAllTests() {
  testMessages.forEach(test => {
    console.log(`\n--- Analyzing Message ID: ${test.id} ---`);
    const senderAnalysis = mockSenderVerification.verifySender(test.sender, test.message);
    const contentAnalysis = mockContentAnalysis.analyzeContent(test.message);
    
    // Combine results for a final verdict
    const finalRiskScore = senderAnalysis.riskLevel === 'CRITICAL' ? 100 : contentAnalysis.riskScore;
    let finalVerdict = 'SAFE';
    if (finalRiskScore >= 50) finalVerdict = 'CRITICAL';
    else if (finalRiskScore >= 25) finalVerdict = 'HIGH_RISK';
    else if (finalRiskScore >= 10) finalVerdict = 'SUSPICIOUS';
    
    console.log(`🏁 FINAL VERDICT: ${finalVerdict}\n`);
    console.log('=' .repeat(50));
  });
}

// Execute the test runner
runAllTests(); 