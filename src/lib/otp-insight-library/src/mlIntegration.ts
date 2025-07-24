// Mock ML Integration Service - No ONNX Runtime dependency
// This provides realistic fraud detection using pattern analysis

export interface SMSExample {
  messageText: string;
  label: string; // 'fraud' or 'legitimate'
}

export interface ModelVerdict {
  isFraud: boolean;
  confidence: number;
  details?: string;
}

// Fraud indicators database - Redesigned for higher accuracy
const FRAUD_INDICATORS = {
  // CRITICAL fraud indicators (immediate red flags) - very specific patterns
  criticalKeywords: [
    'urgent action required', 'account suspended', 'verify immediately',
    'click here now', 'act now or lose', 'limited time offer',
    'congratulations you won', 'lottery winner', 'claim your prize',
    'you won lottery', 'prize of $', 'won $', 'claim prize',
    'tax refund approved', 'government refund', 'irs notice',
    'customs clearance fee', 'inheritance fund', 'million dollars',
    'wire transfer required', 'bitcoin payment', 'western union',
    'final warning', 'legal action', 'arrest warrant',
    'your son arrested', 'bail money required', 'emergency payment'
  ],
  
  // Suspicious patterns (only in specific contexts)
  suspiciousPatterns: [
    /urgent.*verify.*account/i,
    /suspended.*click.*link/i,
    /winner.*claim.*prize/i,
    /government.*refund.*\$\d+/i,
    /arrested.*pay.*bail/i,
    /block.*account.*verify/i
  ],

  // Legitimate banking/service patterns (strong positive indicators) - EXPANDED
  legitimatePatterns: [
    /dear (customer|user|member)/i,
    /your otp (is|for)/i,
    /valid for \d+ (minutes|mins|hours)/i,
    /do not share (this|your|otp)/i,
    /transaction (at|on|for|with)/i,
    /payment.*successful/i,
    /has been processed/i,
    /thank you for using/i,
    /reference number/i,
    /transaction id/i,
    /account balance/i,
    /bill payment/i,
    /debit.*credit card/i,
    // ADDED: More legitimate banking patterns
    /credited.*account/i,
    /debited.*account/i,
    /balance.*rs\.?\s*\d+/i,
    /available.*balance/i,
    /mini.*statement/i,
    /last.*transaction/i,
    /transferred.*successfully/i,
    /upi.*payment/i,
    /neft.*rtgs/i,
    /mobile.*banking/i,
    /internet.*banking/i,
    /atm.*transaction/i,
    /card.*transaction/i,
    /ifsc.*code/i,
    /beneficiary.*added/i,
    /standing.*instruction/i,
    /fixed.*deposit/i,
    /recurring.*deposit/i,
    /loan.*payment/i,
    /emi.*due/i,
    /kyc.*verification/i,
    /customer.*care/i,
    /toll.*free/i,
    /branch.*visit/i,
    /account.*statement/i,
    /cheque.*book/i
  ],

  // Legitimate keywords that should NEVER trigger fraud alerts
  safeKeywords: [
    'hi', 'hello', 'hey', 'thanks', 'ok', 'yes', 'no',
    'good', 'morning', 'evening', 'night', 'how', 'what',
    'when', 'where', 'why', 'please', 'sorry', 'welcome'
  ],
  
  // Suspicious URLs (only shortened/suspicious domains)
  suspiciousUrls: [
    /bit\.ly\/[a-zA-Z0-9]+/i,
    /tinyurl\.com\/[a-zA-Z0-9]+/i,
    /t\.co\/[a-zA-Z0-9]+/i,
    /goo\.gl\/[a-zA-Z0-9]+/i,
    /ow\.ly\/[a-zA-Z0-9]+/i,
    /short\.link/i,
    /click\.me/i
  ],

  // Amount patterns that are suspicious (large amounts with urgency)
  suspiciousAmounts: [
    /pay \$[1-9]\d{3,}/i,  // Pay $1000 or more
    /send ₹[1-9]\d{4,}/i,  // Send ₹10000 or more
    /transfer.*\$[1-9]\d{3,}/i,
    /urgent.*₹[1-9]\d{3,}/i
  ]
};

export class MLIntegrationService {
  private isModelLoaded: boolean = false;
  private modelVersion: string = 'MockML-v2.2-FalsePositiveReduction';

  constructor() {
    console.log(`[MLIntegrationService] Initializing Mock ML Service ${this.modelVersion}`);
  }

  /**
   * Mock model loading - simulates ONNX model initialization
   */
  public async loadModel(): Promise<void> {
    if (this.isModelLoaded) {
      console.log("[MLIntegrationService] Model already loaded.");
      return;
    }

    try {
      console.log("[MLIntegrationService] Loading fraud detection model...");
      
      // Simulate model loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.isModelLoaded = true;
      console.log("[MLIntegrationService] Fraud detection model loaded successfully.");
    } catch (error) {
      console.error("[MLIntegrationService] Failed to load model:", error);
      throw new Error("Failed to load ML model.");
    }
  }

  /**
   * Advanced fraud detection using pattern analysis and heuristics
   * Provides realistic fraud detection comparable to ML models
   * ENHANCED: Includes sender verification to reduce false positives
   */
  public async predictWithModel(messageText: string): Promise<ModelVerdict> {
    if (!this.isModelLoaded) {
      throw new Error("ML model not loaded. Call loadModel() first.");
    }

    console.log(`[MLIntegrationService] Analyzing message: "${messageText.substring(0, 50)}..."`);

    const analysis = this.analyzeMessage(messageText);
    const verdict = this.calculateFraudScore(analysis);

    console.log(`[MLIntegrationService] Fraud analysis complete - Score: ${verdict.confidence.toFixed(3)}, Fraud: ${verdict.isFraud}`);

    return verdict;
  }

  /**
   * Comprehensive message analysis - REDESIGNED for accuracy & reduced false positives
   */
  private analyzeMessage(messageText: string): {
    criticalFlags: string[];
    suspiciousFlags: string[];
    legitimateFlags: string[];
    urlFlags: string[];
    score: number;
  } {
    const text = messageText.toLowerCase().trim();
    
    // Check if this message includes sender information (FROM: pattern)
    const hasSenderInfo = messageText.includes('FROM:');
    let senderInfo = '';
    let actualMessage = messageText;
    
    if (hasSenderInfo) {
      const parts = messageText.split('\nMESSAGE:');
      if (parts.length === 2) {
        senderInfo = parts[0].replace('FROM:', '').trim();
        actualMessage = parts[1].trim();
      }
    }
    const analysis = {
      criticalFlags: [] as string[],
      suspiciousFlags: [] as string[],
      legitimateFlags: [] as string[],
      urlFlags: [] as string[],
      score: 0
    };
    
    // SENDER VERIFICATION: Check for legitimate bank/service senders
    if (hasSenderInfo && senderInfo) {
      const legitimateSenders = [
        'SBIINB', 'HDFCBANK', 'ICICIBANK', 'AXISBANK', 'PNBINB', 'UBIBANK',
        'CANBNK', 'BOBBANK', 'UNIONBNK', 'INDIANBK', 'KOTAKBNK', 'YESBANK',
        'AMAZON', 'FLIPKART', 'PAYTM', 'PHONEPE', 'GPAY', 'BHARATPE',
        'SWIGGY', 'ZOMATO', 'UBEREATS', 'OLA', 'UBER', 'MAKEMYTRIP',
        'IRCTC', 'BSNL', 'AIRTEL', 'JIO', 'VODAFONE', 'TATA', 'ADANI'
      ];
      
      const senderUpper = senderInfo.toUpperCase();
      const isLegitimateOfficialSender = legitimateSenders.some(sender => 
        senderUpper === sender || senderUpper.startsWith(sender)
      );
      
      if (isLegitimateOfficialSender) {
        analysis.legitimateFlags.push('verified_official_sender');
        analysis.score -= 1.0; // Very strong reduction for verified official senders
        console.log(`[MLIntegrationService] Verified official sender detected: ${senderInfo}`);
      }
    }

    // FIRST: Check if this is a safe/normal message
    const isSafeMessage = FRAUD_INDICATORS.safeKeywords.some(keyword => 
      text === keyword.toLowerCase() || 
      text.startsWith(keyword.toLowerCase() + ' ') ||
      text.endsWith(' ' + keyword.toLowerCase()) ||
      text.includes(' ' + keyword.toLowerCase() + ' ')
    );

    if (isSafeMessage && text.length < 50) {
      // This is clearly a normal conversational message
      analysis.legitimateFlags.push('safe conversational message');
      analysis.score = -0.5; // Strong negative score (very safe)
      return analysis;
    }

    // Check for legitimate banking patterns FIRST (strong positive indicators) - ENHANCED
    let legitimatePatternCount = 0;
    FRAUD_INDICATORS.legitimatePatterns.forEach(pattern => {
      if (pattern.test(messageText)) {
        legitimatePatternCount++;
        analysis.legitimateFlags.push('legitimate_banking_pattern');
      }
    });
    
    // STRONGER reduction for legitimate patterns
    if (legitimatePatternCount >= 2) {
      analysis.score -= 0.8; // Very strong reduction for multiple legitimate patterns
    } else if (legitimatePatternCount === 1) {
      analysis.score -= 0.4; // Strong reduction for single legitimate pattern
      }

    // If message has legitimate banking patterns, be very conservative
    const hasStrongLegitimateContext = analysis.legitimateFlags.length > 0;

    // Check for critical fraud indicators (must be exact phrases, not just words)
    FRAUD_INDICATORS.criticalKeywords.forEach(phrase => {
      if (text.includes(phrase.toLowerCase())) {
        analysis.criticalFlags.push(phrase);
        analysis.score += hasStrongLegitimateContext ? 0.15 : 0.3; // Reduced if legitimate context
      }
    });

    // Check for suspicious patterns (only if no strong legitimate context)
    if (!hasStrongLegitimateContext) {
      FRAUD_INDICATORS.suspiciousPatterns.forEach(pattern => {
        if (pattern.test(messageText)) {
          analysis.suspiciousFlags.push(pattern.source);
          analysis.score += 0.15; // Moderate penalty
        }
      });
    }

    // Check for suspicious URLs (only specific patterns)
    FRAUD_INDICATORS.suspiciousUrls.forEach(pattern => {
      if (pattern.test(messageText)) {
        analysis.urlFlags.push(pattern.source);
        analysis.score += hasStrongLegitimateContext ? 0.1 : 0.25; // Reduced if legitimate context
      }
    });

    // Check for suspicious amounts (only large amounts with urgency)
    FRAUD_INDICATORS.suspiciousAmounts.forEach(pattern => {
      if (pattern.test(messageText)) {
        analysis.suspiciousFlags.push('large_amount_request');
        analysis.score += 0.2;
      }
    });

    // Additional conservative heuristics
    analysis.score += this.calculateConservativeHeuristicScore(messageText, hasStrongLegitimateContext);

    return analysis;
  }

  /**
   * Conservative heuristic scoring - much less sensitive
   */
  private calculateConservativeHeuristicScore(messageText: string, hasLegitimateContext: boolean): number {
    let score = 0;

    // Only penalize extremely suspicious characteristics
    
    // Very long messages with urgency
    if (messageText.length > 500 && /urgent|immediate|asap/i.test(messageText)) {
      score += 0.1;
    }

    // Excessive caps (more than 50% caps and long message)
    const upperCaseRatio = (messageText.match(/[A-Z]/g) || []).length / messageText.length;
    if (upperCaseRatio > 0.5 && messageText.length > 50) {
      score += 0.1;
    }

    // Multiple exclamation marks (more than 3)
    const exclamationCount = (messageText.match(/!/g) || []).length;
    if (exclamationCount > 3) {
      score += 0.1;
    }

    // Multiple money symbols with urgency
    const moneySymbols = (messageText.match(/\$|₹|USD|INR|EUR/g) || []).length;
    if (moneySymbols > 2 && /urgent|now|immediate/i.test(messageText)) {
      score += 0.15;
    }

    // Reduce score significantly if legitimate context exists
    if (hasLegitimateContext) {
      score = score * 0.3; // Reduce by 70%
    }

    return Math.min(score, 0.3); // Cap at much lower value
  }

  /**
   * Calculate final fraud verdict with VERY conservative thresholds
   * FIXED: Properly handle confidence for both fraud and safe messages
   */
  private calculateFraudScore(analysis: any): ModelVerdict {
    let confidence = Math.min(Math.max(analysis.score, -1), 1); // Allow negative scores
    
    // Apply much more conservative logic
    const hasMultipleCritical = analysis.criticalFlags.length >= 2;
    const hasUrls = analysis.urlFlags.length > 0;
    const hasLegitimate = analysis.legitimateFlags.length > 0;
    const hasSuspicious = analysis.suspiciousFlags.length > 0;

    // Strong bias towards legitimate messages
    let adjustedScore = confidence;

    // If message has ANY legitimate indicators and no critical flags, likely safe
    if (hasLegitimate && analysis.criticalFlags.length === 0) {
      adjustedScore = Math.max(adjustedScore - 0.6, -1); // Strong reduction
    }

    // Normal conversational messages should never be flagged
    if (analysis.legitimateFlags.includes('safe conversational message')) {
      adjustedScore = -1; // Definitely safe
    }

    // MUCH MORE CONSERVATIVE: Require multiple strong indicators for fraud
    if (hasMultipleCritical && (hasUrls || hasSuspicious)) {
      // Only flag as fraud if multiple critical indicators AND other suspicious elements
      adjustedScore = Math.min(adjustedScore + 0.5, 1.0);
    } else if (hasMultipleCritical) {
      // Multiple critical flags alone are concerning but not definitive
      adjustedScore = Math.min(adjustedScore + 0.3, 1.0);
    } else if (analysis.criticalFlags.length === 1) {
      // Single critical flag is much less concerning now
      adjustedScore = Math.min(adjustedScore + 0.1, 1.0);
    }
    
    // URLs + multiple suspicious elements are concerning
    if (hasUrls && hasSuspicious && analysis.criticalFlags.length > 0) {
      adjustedScore = Math.min(adjustedScore + 0.3, 1.0);
    } else if (hasUrls) {
      // URLs alone are only mildly suspicious
      adjustedScore = Math.min(adjustedScore + 0.1, 1.0);
    }

    // Government/authority impersonation is high risk (but only with specific phrases)
    const hasGovernmentScam = analysis.criticalFlags.some((flag: string) => 
        ['government refund', 'irs notice', 'tax refund approved'].includes(flag.toLowerCase()));
    if (hasGovernmentScam) {
      adjustedScore = Math.min(adjustedScore + 0.3, 1.0);
    }

    // Emergency/arrest scams are critical (but only with specific phrases)
    const hasEmergencyScam = analysis.criticalFlags.some((flag: string) => 
        ['your son arrested', 'bail money required', 'arrest warrant'].includes(flag.toLowerCase()));
    if (hasEmergencyScam) {
      adjustedScore = Math.min(adjustedScore + 0.4, 1.0);
    }

    // Use EXTREMELY conservative threshold for fraud detection - REDUCED FALSE POSITIVES
    const isFraud = adjustedScore > 0.8; // Raised from 0.7 to 0.8 (much more conservative)

    // FIXED: Properly calculate confidence for both fraud and safe messages
    let finalConfidence: number;
    
    if (isFraud) {
      // For fraud messages: confidence = how sure we are it's fraud (0-1 scale)
      finalConfidence = Math.min(Math.max(adjustedScore, 0), 1);
    } else {
      // For safe messages: confidence = how sure we are it's safe (0-1 scale)
      // Convert negative scores (very safe) to high confidence
      if (adjustedScore <= -0.3) {
        finalConfidence = 0.9; // Very confident it's safe
      } else if (adjustedScore <= 0) {
        finalConfidence = 0.7; // Moderately confident it's safe
      } else {
        // Suspicious but not fraudulent - lower confidence
        finalConfidence = Math.max(0.6 - adjustedScore, 0.3);
      }
    }

    // Build detailed explanation
    let details = `AI Analysis (${this.modelVersion}): `;
    
    if (analysis.legitimateFlags.includes('safe conversational message')) {
      details += 'Normal conversational message detected. ';
    } else if (hasLegitimate) {
      details += 'Legitimate banking patterns found. ';
    }
    
    if (analysis.criticalFlags.length > 0) {
      details += `${analysis.criticalFlags.length} critical indicator(s). `;
    }
    if (analysis.urlFlags.length > 0) {
      details += 'Suspicious URLs detected. ';
    }
    
    details += `${isFraud ? 'FRAUD' : 'SAFE'} with ${(finalConfidence * 100).toFixed(1)}% confidence`;

    console.log(`[MLIntegrationService] Final verdict: ${isFraud ? 'FRAUD' : 'SAFE'}, Score: ${adjustedScore.toFixed(3)}, Confidence: ${finalConfidence.toFixed(3)}`);

    return {
      isFraud,
      confidence: finalConfidence, // Now properly calculated for both fraud and safe messages
      details
    };
  }

  /**
   * Get model information
   */
  public getModelInfo(): { version: string; isLoaded: boolean; type: string } {
    return {
      version: this.modelVersion,
      isLoaded: this.isModelLoaded,
      type: 'Pattern-based ML Simulation'
    };
  }
} 