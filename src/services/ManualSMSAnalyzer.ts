/**
 * Manual SMS Fraud Detection Service
 * Analyzes SMS content provided by user (no SMS permissions required)
 * Implements WHO (sender) and WHAT (content) analysis for fraud detection
 * Enhanced with ML model integration for advanced fraud prediction
 */

import { MLIntegrationService } from '../lib/otp-insight-library/src/mlIntegration';

// ModelVerdict interface for ML analysis results
interface ModelVerdict {
  isFraud: boolean;
  confidence: number;
  details: string;
}

export interface SMSAnalysisInput {
  senderInfo: string;    // Phone number or sender name
  messageContent: string; // SMS text content
  receivedTime?: Date;   // When SMS was received (optional)
  userLocation?: string; // User's city/state for context (optional)
  enableMLAnalysis?: boolean; // Whether to use ML model (default: true)
}

export interface SMSAnalysisResult {
  // Overall assessment
  isFraud: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidenceScore: number; // 0-100
  
  // WHO analysis results
  senderAnalysis: {
    senderType: 'unknown' | 'individual' | 'business' | 'bank' | 'government' | 'scammer';
    senderLegitimacy: 'legitimate' | 'suspicious' | 'fraudulent' | 'unknown';
    senderReputation: number; // 0-100
    senderRedFlags: string[];
  };
  
  // WHAT analysis results
  contentAnalysis: {
    fraudPatterns: string[];
    urgencyLevel: 'none' | 'low' | 'medium' | 'high' | 'extreme';
    socialEngineeringTactics: string[];
    suspiciousElements: string[];
  };
  
  // ML analysis results
  mlAnalysis: {
    isEnabled: boolean;
    isModelLoaded: boolean;
    mlVerdict: ModelVerdict | null;
    mlScore: number; // 0-100 (ML confidence converted to percentage)
    mlContribution: number; // How much ML influenced final decision (0-100%)
  };
  
  // Detailed explanation
  explanation: {
    summary: string;
    detailedAnalysis: string;
    redFlags: string[];
    recommendations: string[];
  };
}

export class ManualSMSAnalyzer {
  private static instance: ManualSMSAnalyzer;
  private mlService: MLIntegrationService;
  private isMLModelLoaded: boolean = false;
  
  // Comprehensive fraud pattern database
  private readonly fraudPatterns = {
    // WHO patterns - Sender analysis
    suspiciousSenderPatterns: [
      // Fake bank patterns
      /^(SBI|HDFC|ICICI|AXIS|PNB|BOB|CANARA|UNION|INDIAN|KOTAK)[-_]?(BANK|BNK|ALERT|OTP|INFO|MSG)[0-9]*$/i,
      /^(SBI|HDFC|ICICI|AXIS|PNB|BOB|CANARA|UNION|INDIAN|KOTAK)[0-9]+$/i,
      
      // Fake government patterns
      /^(AADHAAR|AADHAR|UIDAI|EPFO|PF|INCOME|TAX|IT|DEPT|GOV|GOVT)[0-9]*$/i,
      /^(POLICE|COURT|LEGAL|CYBER|CRIME|CBI|ED|RBI)[0-9]*$/i,
      
      // Generic suspicious patterns
      /^[A-Z]{2,6}[0-9]{3,6}$/,           // Random letters + numbers
      /^[0-9]{6,10}$/,                    // Only numbers (not shortcodes)
      /^[+]?[0-9]{10,15}$/,              // Long phone numbers claiming to be businesses
    ],
    
    // Legitimate sender patterns
    legitimateSenderPatterns: [
      // Real bank shortcodes
      /^(SBIINB|HDFCBK|ICICIB|AXISBK|PNBSMS|BOBSMS|CANBKS|UNBNKS|IOBSMS|KOTAK)$/,
      
      // Real government shortcodes
      /^(UIDAI|EPFINDIA|CBDTAX|PFUND|RAILWAY|POLICE|COURTS)$/,
      
      // Real service providers
      /^(AMAZON|FLIPKART|PAYTM|GPAY|PHONEPE|BHIMUPI|IRCTC|ZOMATO|SWIGGY|UBER|OLA)$/,
    ],
    
    // WHAT patterns - Content analysis
    fraudContentPatterns: [
      // Urgency patterns
      /(?:urgent|immediate|expire|expiring|expires|act now|limited time|last chance|final notice)/i,
      /(?:within|before|today|tomorrow|2 hours|24 hours|deadline|time limit)/i,
      
      // Threat patterns
      /(?:blocked|suspended|cancelled|deactivated|legal action|arrest|penalty|fine)/i,
      /(?:verify|update|confirm|validate|authenticate|activate|reactivate)/i,
      
      // Reward/Prize patterns
      /(?:congratulations|winner|won|prize|reward|cash|cashback|bonus|gift|lottery)/i,
      /(?:₹|rs\.?|rupees?|lakh|crore|thousand|million|amount|money|cash)/i,
      
      // Information harvesting
      /(?:otp|password|pin|cvv|card|account|bank|login|username|id|number)/i,
      /(?:click|link|visit|download|install|app|website|url|http|www)/i,
      
      // Social engineering
      /(?:dear customer|valued customer|sir|madam|friend|congratulations|important)/i,
      /(?:call|contact|reply|respond|sms|message|whatsapp|telegram)/i,
    ]
  };
  
  // Indian banking and financial institutions database
  private readonly legitimateInstitutions = {
    banks: [
      'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Punjab National Bank',
      'Bank of Baroda', 'Canara Bank', 'Union Bank', 'Indian Bank', 'Kotak Mahindra Bank'
    ],
    
    legitimateShortcodes: {
      'SBIINB': 'State Bank of India',
      'HDFCBK': 'HDFC Bank',
      'ICICIB': 'ICICI Bank',
      'AXISBK': 'Axis Bank',
      'PNBSMS': 'Punjab National Bank',
      'UIDAI': 'Unique Identification Authority of India',
      'EPFINDIA': 'Employee Provident Fund Organization',
      'PAYTM': 'Paytm',
      'GPAY': 'Google Pay',
      'PHONEPE': 'PhonePe'
    }
  };

  private constructor() {
    this.mlService = new MLIntegrationService();
    this.initializeMLModel();
  }

  private async initializeMLModel(): Promise<void> {
    try {
      await this.mlService.loadModel();
      this.isMLModelLoaded = true;
      console.log('✅ ML model loaded successfully for ManualSMSAnalyzer');
    } catch (error) {
      console.warn('⚠️ ML model failed to load:', error);
      this.isMLModelLoaded = false;
    }
  }

  private async performMLAnalysis(senderInfo: string, messageContent: string, isEnabled: boolean): Promise<SMSAnalysisResult['mlAnalysis']> {
    console.log('🤖 Performing comprehensive ML analysis (sender + content)...');
    
    const mlAnalysis: SMSAnalysisResult['mlAnalysis'] = {
      isEnabled: isEnabled,
      isModelLoaded: this.isMLModelLoaded,
      mlVerdict: null,
      mlScore: 0,
      mlContribution: 0
    };
    
    if (!isEnabled) {
      console.log('🤖 ML analysis disabled by user');
      return mlAnalysis;
    }
    
    if (!this.isMLModelLoaded) {
      console.log('⚠️ ML model not loaded, skipping ML analysis');
      return mlAnalysis;
    }
    
    try {
      // Prepare complete SMS for ML model (as it was trained to handle both sender and content)
      const completeSMS = `FROM: ${senderInfo}\nMESSAGE: ${messageContent}`;
      
      console.log(`🤖 Analyzing complete SMS structure for ML model...`);
      const verdict = await this.mlService.predictWithModel(completeSMS);
      
      mlAnalysis.mlVerdict = {
        isFraud: verdict.isFraud,
        confidence: verdict.confidence,
        details: verdict.details || 'ML comprehensive analysis completed'
      };
      mlAnalysis.mlScore = Math.round(verdict.confidence * 100);
      mlAnalysis.mlContribution = 70; // ML is primary analyzer (70% weight)
      
      console.log(`🤖 ML PRIMARY analysis complete: ${verdict.isFraud ? 'FRAUD' : 'SAFE'} (${mlAnalysis.mlScore}% confidence, 70% contribution)`);
    } catch (error) {
      console.error('❌ ML analysis failed:', error);
      mlAnalysis.mlVerdict = {
        isFraud: false,
        confidence: 0,
        details: `ML analysis failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
    
    return mlAnalysis;
  }

  static getInstance(): ManualSMSAnalyzer {
    if (!ManualSMSAnalyzer.instance) {
      ManualSMSAnalyzer.instance = new ManualSMSAnalyzer();
    }
    return ManualSMSAnalyzer.instance;
  }

  async analyzeSMS(input: SMSAnalysisInput): Promise<SMSAnalysisResult> {
    console.log('🔍 Starting SMS fraud analysis...');
    
    const senderAnalysis = await this.analyzeWHO(input.senderInfo);
    const contentAnalysis = await this.analyzeWHAT(input.messageContent);
    
    // ML Analysis (if enabled) - now handles complete SMS as designed
    const mlAnalysis = await this.performMLAnalysis(input.senderInfo, input.messageContent, input.enableMLAnalysis !== false);
    
    const combinedAnalysis = this.combineAnalyses(senderAnalysis, contentAnalysis, mlAnalysis);
    const explanation = this.generateExplanation(senderAnalysis, contentAnalysis, combinedAnalysis, mlAnalysis);
    
    return {
      isFraud: combinedAnalysis.isFraud,
      riskLevel: combinedAnalysis.riskLevel,
      confidenceScore: combinedAnalysis.confidenceScore,
      senderAnalysis,
      contentAnalysis,
      mlAnalysis,
      explanation
    };
  }

  private async analyzeWHO(senderInfo: string): Promise<SMSAnalysisResult['senderAnalysis']> {
    console.log('👤 Analyzing WHO: Sender verification...');
    
    const senderRedFlags: string[] = [];
    let senderType: SMSAnalysisResult['senderAnalysis']['senderType'] = 'unknown';
    let senderLegitimacy: SMSAnalysisResult['senderAnalysis']['senderLegitimacy'] = 'unknown';
    let senderReputation = 50;
    
    const cleanSender = senderInfo.trim().toUpperCase();
    
    // Step 1: Check if sender is in legitimate institutions
    const legitimateShortcodes = this.legitimateInstitutions.legitimateShortcodes as { [key: string]: string };
    if (legitimateShortcodes[cleanSender]) {
      senderType = cleanSender.includes('BANK') ? 'bank' : 
                  ['UIDAI', 'EPFINDIA'].includes(cleanSender) ? 'government' : 'business';
      senderLegitimacy = 'legitimate';
      senderReputation = 95;
      console.log(`✅ WHO: Verified legitimate sender - ${legitimateShortcodes[cleanSender]}`);
      return { senderType, senderLegitimacy, senderReputation, senderRedFlags };
    }
    
    // Step 2: Check against legitimate patterns
    for (const pattern of this.fraudPatterns.legitimateSenderPatterns) {
      if (pattern.test(cleanSender)) {
        senderType = 'business';
        senderLegitimacy = 'legitimate';
        senderReputation = 85;
        console.log(`✅ WHO: Matches legitimate sender pattern`);
        return { senderType, senderLegitimacy, senderReputation, senderRedFlags };
      }
    }
    
    // Step 3: Check for phone number patterns
    const phonePattern = /^[+]?[0-9\s\-()]{10,15}$/;
    const isPhoneNumber = phonePattern.test(senderInfo.replace(/\s/g, ''));
    
    if (isPhoneNumber) {
      const phoneAnalysis = this.analyzePhoneNumberWHO(senderInfo);
      senderType = phoneAnalysis.type;
      senderReputation = phoneAnalysis.reputation;
      senderRedFlags.push(...phoneAnalysis.redFlags);
      
      if (phoneAnalysis.reputation < 30) {
        senderLegitimacy = 'fraudulent';
      } else if (phoneAnalysis.reputation < 60) {
        senderLegitimacy = 'suspicious';
      }
      
      console.log(`📞 WHO: Phone number analysis - ${phoneAnalysis.reputation}% reputation`);
    } else {
      // Step 4: Check against suspicious patterns
      for (const pattern of this.fraudPatterns.suspiciousSenderPatterns) {
        if (pattern.test(cleanSender)) {
          senderRedFlags.push('Sender name matches known fraud patterns');
          senderType = 'scammer';
          senderLegitimacy = 'fraudulent';
          senderReputation = 5;
          
          // Specific impersonation checks
          if (cleanSender.includes('SBI') || cleanSender.includes('HDFC') || cleanSender.includes('BANK')) {
            senderRedFlags.push('Impersonating legitimate bank');
          }
          if (cleanSender.includes('UIDAI') || cleanSender.includes('GOVT') || cleanSender.includes('GOV')) {
            senderRedFlags.push('Impersonating government agency');
          }
          
          console.log(`🚨 WHO: Fraudulent sender detected - ${cleanSender}`);
          break;
        }
      }
      
      // Step 5: Check for typosquatting
      if (senderLegitimacy === 'unknown') {
        const typosquattingCheck = this.checkTyposquatting(cleanSender);
        if (typosquattingCheck.isTyposquatting) {
          senderRedFlags.push(`Possible typosquatting of ${typosquattingCheck.target}`);
          senderLegitimacy = 'suspicious';
          senderReputation = 20;
          console.log(`⚠️ WHO: Possible typosquatting detected`);
        }
      }
    }
    
    return {
      senderType,
      senderLegitimacy,
      senderReputation,
      senderRedFlags
    };
  }
  
  private analyzePhoneNumberWHO(phoneNumber: string): {
    type: SMSAnalysisResult['senderAnalysis']['senderType'];
    reputation: number;
    redFlags: string[];
  } {
    const redFlags: string[] = [];
    let reputation = 60;
    let type: SMSAnalysisResult['senderAnalysis']['senderType'] = 'individual';
    
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    
    // Indian number analysis
    if (cleanPhone.startsWith('+91') || cleanPhone.startsWith('91')) {
      const number = cleanPhone.replace(/^(\+91|91)/, '');
      
      // Check suspicious ranges
      if (/^[6-8]/.test(number)) {
        redFlags.push('Number range commonly used by bulk SMS services');
        reputation -= 20;
      }
      
      if (/^[9][6-9]/.test(number)) {
        redFlags.push('Potentially VoIP or virtual number');
        reputation -= 15;
      }
      
      // Standard mobile check
      if (!/^[7-9][0-9]{9}$/.test(number)) {
        redFlags.push('Non-standard mobile number format');
        reputation -= 10;
      }
    } else {
      // International number for local services
      redFlags.push('International number claiming to provide local services');
      reputation -= 30;
    }
    
    return { type, reputation, redFlags };
  }
  
  private checkTyposquatting(senderName: string): { isTyposquatting: boolean; target?: string } {
    const commonTargets = ['SBIINB', 'HDFCBK', 'ICICIB', 'AXISBK', 'PAYTM', 'UIDAI', 'EPFINDIA'];
    
    for (const target of commonTargets) {
      const distance = this.calculateLevenshteinDistance(senderName, target);
      if (distance === 1 || distance === 2) {
        return { isTyposquatting: true, target };
      }
    }
    
    return { isTyposquatting: false };
  }
  
  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private async analyzeWHAT(messageContent: string): Promise<SMSAnalysisResult['contentAnalysis']> {
    console.log('📝 Analyzing WHAT: Content analysis...');
    
    const fraudPatterns: string[] = [];
    const socialEngineeringTactics: string[] = [];
    const suspiciousElements: string[] = [];
    let urgencyLevel: SMSAnalysisResult['contentAnalysis']['urgencyLevel'] = 'none';
    
    const content = messageContent.toLowerCase();
    const patterns = this.fraudPatterns.fraudContentPatterns;
    
    // Step 1: Check for urgency patterns
    if (patterns[0].test(messageContent) || patterns[1].test(messageContent)) {
      fraudPatterns.push('Urgency Language');
      urgencyLevel = 'high';
      socialEngineeringTactics.push('Creates false urgency to pressure immediate action');
      console.log('⚠️ WHAT: Urgency language detected');
    }
    
    // Step 2: Check for threat patterns
    if (patterns[2].test(messageContent) || patterns[3].test(messageContent)) {
      fraudPatterns.push('Threat Language');
      socialEngineeringTactics.push('Uses fear tactics and threats');
      if (urgencyLevel === 'none') urgencyLevel = 'medium';
      console.log('🚨 WHAT: Threat language detected');
    }
    
    // Step 3: Check for reward/prize patterns
    if (patterns[4].test(messageContent) || patterns[5].test(messageContent)) {
      fraudPatterns.push('Fake Reward/Prize Claim');
      socialEngineeringTactics.push('Offers fake rewards to entice victims');
      console.log('🎁 WHAT: Prize/reward fraud pattern detected');
    }
    
    // Step 4: Check for information harvesting
    if (patterns[6].test(messageContent) || patterns[7].test(messageContent)) {
      fraudPatterns.push('Information Harvesting');
      socialEngineeringTactics.push('Attempts to steal personal/financial information');
      if (urgencyLevel === 'none') urgencyLevel = 'medium';
      console.log('🎣 WHAT: Information harvesting detected');
    }
    
    // Step 5: Check for social engineering
    if (patterns[8].test(messageContent) || patterns[9].test(messageContent)) {
      fraudPatterns.push('Social Engineering');
      socialEngineeringTactics.push('Uses psychological manipulation techniques');
      console.log('🎭 WHAT: Social engineering tactics detected');
    }
    
    // Step 6: Analyze language quality
    const languageAnalysis = this.analyzeLanguageQuality(messageContent);
    if (languageAnalysis.quality === 'poor') {
      suspiciousElements.push('Poor grammar and spelling errors');
      suspiciousElements.push(...languageAnalysis.issues);
    }
    
    // Step 7: Check for suspicious links
    const linkAnalysis = this.checkSuspiciousLinks(messageContent);
    if (linkAnalysis.hasSuspiciousLinks) {
      fraudPatterns.push('Suspicious Links');
      suspiciousElements.push(...linkAnalysis.issues);
      console.log('🔗 WHAT: Suspicious links detected');
    }
    
    // Step 8: Check for additional phone numbers
    if (this.containsPhoneNumbers(messageContent)) {
      suspiciousElements.push('Contains additional phone numbers for callback');
      console.log('📞 WHAT: Additional phone numbers found');
    }
    
    // Step 9: Financial terms analysis
    if (this.containsFinancialTerms(messageContent)) {
      if (fraudPatterns.length > 0) {
        suspiciousElements.push('Combines financial terms with fraud patterns');
      }
      console.log('💰 WHAT: Financial terms detected');
    }
    
    // Step 10: Set extreme urgency for critical combinations
    if (fraudPatterns.includes('Threat Language') && fraudPatterns.includes('Urgency Language')) {
      urgencyLevel = 'extreme';
      console.log('🚨 WHAT: EXTREME urgency - combines threats with time pressure');
    }
    
    return {
      fraudPatterns,
      urgencyLevel,
      socialEngineeringTactics,
      suspiciousElements
    };
  }
  
  private analyzeLanguageQuality(content: string): { quality: 'professional' | 'poor' | 'mixed'; issues: string[] } {
    const issues: string[] = [];
    
    // Check for excessive capitalization
    if ((content.match(/[A-Z]/g) || []).length / content.length > 0.3) {
      issues.push('Excessive use of capital letters');
    }
    
    // Check for poor punctuation
    if (/[!]{2,}|[?]{2,}|[.]{3,}/.test(content)) {
      issues.push('Unprofessional punctuation usage');
    }
    
    // Check for spelling mistakes (common ones)
    const commonMistakes = /\b(recieve|seperate|teh|acount|verfiy|imediately|expier)\b/i;
    if (commonMistakes.test(content)) {
      issues.push('Common spelling mistakes detected');
    }
    
    // Check for word repetition
    const words = content.toLowerCase().split(/\s+/);
    const wordCounts = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    for (const [word, count] of Object.entries(wordCounts)) {
      if (count > 3 && word.length > 3) {
        issues.push(`Repetitive use of word "${word}"`);
        break;
      }
    }
    
    const quality = issues.length > 2 ? 'poor' : issues.length > 0 ? 'mixed' : 'professional';
    return { quality, issues };
  }
  
  private checkSuspiciousLinks(content: string): { hasSuspiciousLinks: boolean; issues: string[] } {
    const issues: string[] = [];
    let hasSuspiciousLinks = false;
    
    // Check for URL shorteners
    if (/bit\.ly|tinyurl|t\.co|goo\.gl|short\.link|tiny\.cc/i.test(content)) {
      hasSuspiciousLinks = true;
      issues.push('Uses URL shorteners to hide true destination');
    }
    
    // Check for suspicious domains
    if (/\.tk|\.ml|\.ga|\.cf|\.pw|\.xyz|\.click|\.download/i.test(content)) {
      hasSuspiciousLinks = true;
      issues.push('Uses suspicious free domain extensions');
    }
    
    // Check for phishing-like subdomains
    if (/https?:\/\/[^\/]*(?:secure-|bank-|verify-|update-|confirm-|login-)/i.test(content)) {
      hasSuspiciousLinks = true;
      issues.push('Uses phishing-like subdomain structure');
    }
    
    // Check for IP addresses instead of domains
    if (/https?:\/\/(?:\d{1,3}\.){3}\d{1,3}/i.test(content)) {
      hasSuspiciousLinks = true;
      issues.push('Uses IP address instead of proper domain name');
    }
    
    return { hasSuspiciousLinks, issues };
  }
  
  private containsPhoneNumbers(content: string): boolean {
    // Look for Indian phone numbers
    return /(?:\+91|91)?[-\s]?[6-9]\d{9}/.test(content);
  }
  
  private containsFinancialTerms(content: string): boolean {
    return /₹|rs\.?|rupees?|account|bank|card|otp|cvv|pin|loan|emi|payment|balance|credit|debit/i.test(content);
  }

    private combineAnalyses(
    senderAnalysis: SMSAnalysisResult['senderAnalysis'],
    contentAnalysis: SMSAnalysisResult['contentAnalysis'],
    mlAnalysis: SMSAnalysisResult['mlAnalysis']
  ) {
    let riskScore = 0;
    let finalRiskScore = 0;
    
    // ML Analysis is PRIMARY (70% weight) - handles complete SMS analysis as designed
    if (mlAnalysis.isEnabled && mlAnalysis.mlVerdict) {
      const mlRiskScore = mlAnalysis.mlScore;
      finalRiskScore += mlRiskScore * 0.7;
      
      // WHO + WHAT Analysis as SUPPLEMENTARY (30% combined) - for additional validation
      const whoRisk = this.calculateWHORisk(senderAnalysis);
      const whatRisk = this.calculateWHATRisk(contentAnalysis);
      const traditionalRisk = (whoRisk * 0.4 + whatRisk * 0.6); // Internal weighting for traditional methods
      finalRiskScore += traditionalRisk * 0.3;
      
      riskScore = finalRiskScore;
      console.log(`🔍 ML-Primary Analysis: ML=${mlRiskScore}% (70%), Traditional=${Math.round(traditionalRisk)}% (30%), Final=${Math.round(riskScore)}%`);
    } else {
      // Fallback to traditional analysis when ML is not available
      const whoRisk = this.calculateWHORisk(senderAnalysis);
      const whatRisk = this.calculateWHATRisk(contentAnalysis);
      riskScore = whoRisk * 0.4 + whatRisk * 0.6;
      console.log(`🔍 Traditional Fallback Analysis: WHO=${whoRisk}%, WHAT=${whatRisk}%, Total=${Math.round(riskScore)}%`);
    }
    
    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    if (riskScore >= 80) {
      riskLevel = 'CRITICAL';
    } else if (riskScore >= 60) {
      riskLevel = 'HIGH';
    } else if (riskScore >= 40) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }
    
    // Determine fraud status - ML-primary approach
    let isFraud = false;
    
    if (mlAnalysis.isEnabled && mlAnalysis.mlVerdict) {
      // ML-primary decision: Trust ML model as it was trained for comprehensive analysis
      isFraud = mlAnalysis.mlVerdict.isFraud || riskScore >= 70; // Higher threshold for ML-assisted analysis
      console.log(`🤖 ML-primary fraud decision: ${isFraud} (ML verdict: ${mlAnalysis.mlVerdict.isFraud}, Combined risk: ${riskScore}%)`);
    } else {
      // Traditional fallback decision
      isFraud = riskScore >= 60 || 
                senderAnalysis.senderLegitimacy === 'fraudulent' ||
                (contentAnalysis.fraudPatterns.length >= 3 && contentAnalysis.urgencyLevel === 'extreme');
      console.log(`🔍 Traditional fraud decision: ${isFraud} (Risk: ${riskScore}%)`);
    }
    
    // Calculate confidence score - ML-primary approach
    let confidenceScore = 70; // Base confidence
    
    if (mlAnalysis.isEnabled && mlAnalysis.mlVerdict) {
      // ML-primary confidence: Use ML confidence as primary indicator
      confidenceScore = Math.round(mlAnalysis.mlVerdict.confidence * 80 + 20); // Convert ML confidence to 20-100 range
      
      // Adjust based on traditional analysis agreement
      const traditionalAgrees = (mlAnalysis.mlVerdict.isFraud && senderAnalysis.senderLegitimacy === 'fraudulent') ||
                               (!mlAnalysis.mlVerdict.isFraud && senderAnalysis.senderLegitimacy === 'legitimate');
      if (traditionalAgrees) confidenceScore += 10; // Boost when traditional analysis agrees
      
      console.log(`🤖 ML-primary confidence: ${confidenceScore}% (ML base: ${Math.round(mlAnalysis.mlVerdict.confidence * 100)}%)`);
    } else {
      // Traditional confidence calculation
      if (senderAnalysis.senderLegitimacy === 'legitimate') confidenceScore += 15;
      if (senderAnalysis.senderLegitimacy === 'fraudulent') confidenceScore += 20;
      if (contentAnalysis.fraudPatterns.length > 0) confidenceScore += 10;
      if (contentAnalysis.socialEngineeringTactics.length > 2) confidenceScore += 10;
      
      // Decrease confidence with ambiguous data
      if (senderAnalysis.senderLegitimacy === 'unknown') confidenceScore -= 15;
      if (contentAnalysis.fraudPatterns.length === 0 && contentAnalysis.suspiciousElements.length === 0) confidenceScore -= 10;
      
      console.log(`🔍 Traditional confidence calculation: ${confidenceScore}%`);
    }
    
    confidenceScore = Math.min(Math.max(confidenceScore, 30), 98);
    
    return { isFraud, riskLevel, confidenceScore: Math.round(confidenceScore) };
  }
  
  private calculateWHORisk(senderAnalysis: SMSAnalysisResult['senderAnalysis']): number {
    let risk = 0;
    
    // Base risk from sender reputation (inverted - high reputation = low risk)
    risk += (100 - senderAnalysis.senderReputation);
    
    // Risk from legitimacy assessment
    switch (senderAnalysis.senderLegitimacy) {
      case 'fraudulent':
        risk += 50;
        break;
      case 'suspicious':
        risk += 30;
        break;
      case 'legitimate':
        risk = Math.max(risk - 20, 0);
        break;
      case 'unknown':
        risk += 10;
        break;
    }
    
    // Risk from red flags
    risk += senderAnalysis.senderRedFlags.length * 15;
    
    // Cap the risk score
    return Math.min(risk, 100);
  }
  
  private calculateWHATRisk(contentAnalysis: SMSAnalysisResult['contentAnalysis']): number {
    let risk = 0;
    
    // Risk from fraud patterns
    risk += contentAnalysis.fraudPatterns.length * 18;
    
    // Risk from urgency level
    const urgencyRisk = {
      'none': 0,
      'low': 8,
      'medium': 18,
      'high': 30,
      'extreme': 45
    };
    risk += urgencyRisk[contentAnalysis.urgencyLevel];
    
    // Risk from social engineering tactics
    risk += contentAnalysis.socialEngineeringTactics.length * 12;
    
    // Risk from suspicious elements
    risk += contentAnalysis.suspiciousElements.length * 8;
    
    // Special combinations that increase risk
    if (contentAnalysis.fraudPatterns.includes('Threat Language') && 
        contentAnalysis.fraudPatterns.includes('Information Harvesting')) {
      risk += 25; // Very dangerous combination
    }
    
    if (contentAnalysis.fraudPatterns.includes('Urgency Language') && 
        contentAnalysis.fraudPatterns.includes('Suspicious Links')) {
      risk += 20; // Time pressure + malicious links
    }
    
    // Cap the risk score
    return Math.min(risk, 100);
  }

  private generateExplanation(
    senderAnalysis: SMSAnalysisResult['senderAnalysis'], 
    contentAnalysis: SMSAnalysisResult['contentAnalysis'], 
    combinedAnalysis: { isFraud: boolean; riskLevel: string; confidenceScore: number },
    mlAnalysis: SMSAnalysisResult['mlAnalysis']
  ) {
    const redFlags: string[] = [];
    const recommendations: string[] = [];
    
    // Collect all red flags
    redFlags.push(...senderAnalysis.senderRedFlags);
    redFlags.push(...contentAnalysis.fraudPatterns.map(pattern => `Content: ${pattern}`));
    redFlags.push(...contentAnalysis.suspiciousElements.map(element => `Suspicious: ${element}`));
    
    // Generate summary based on analysis results
    let summary: string;
    if (combinedAnalysis.isFraud) {
      summary = `🚨 FRAUD DETECTED: This message is ${combinedAnalysis.riskLevel} risk with ${combinedAnalysis.confidenceScore}% confidence. `;
      
      if (senderAnalysis.senderLegitimacy === 'fraudulent') {
        summary += 'Sender is impersonating legitimate organization. ';
      }
      
      if (contentAnalysis.fraudPatterns.length > 0) {
        summary += `Contains ${contentAnalysis.fraudPatterns.length} fraud patterns. `;
      }
      
      if (contentAnalysis.urgencyLevel === 'extreme' || contentAnalysis.urgencyLevel === 'high') {
        summary += 'Uses high-pressure tactics.';
      }
    } else {
      summary = `✅ APPEARS SAFE: This message is ${combinedAnalysis.riskLevel} risk with ${combinedAnalysis.confidenceScore}% confidence. `;
      
      if (senderAnalysis.senderLegitimacy === 'legitimate') {
        summary += 'Sender appears to be legitimate organization. ';
      }
      
      if (contentAnalysis.fraudPatterns.length === 0) {
        summary += 'No obvious fraud patterns detected.';
      } else {
        summary += 'Some caution still advised.';
      }
    }
    
    // Generate recommendations based on risk level
    if (combinedAnalysis.isFraud || combinedAnalysis.riskLevel === 'CRITICAL') {
      recommendations.push('🚫 DO NOT respond to this message');
      recommendations.push('🚫 DO NOT click any links or call numbers mentioned');
      recommendations.push('🚫 DO NOT share personal information, OTP, or passwords');
      recommendations.push('📱 Block this sender immediately');
      recommendations.push('🚨 Report this message to cybercrime authorities');
      recommendations.push('⚠️ Warn friends and family about similar messages');
    } else if (combinedAnalysis.riskLevel === 'HIGH') {
      recommendations.push('⚠️ Proceed with EXTREME caution');
      recommendations.push('✅ Verify sender through official channels before acting');
      recommendations.push('📞 Contact organization directly using official phone numbers');
      recommendations.push('🔍 Never act on urgent requests without independent verification');
      recommendations.push('🚫 Do not share sensitive information via SMS');
    } else if (combinedAnalysis.riskLevel === 'MEDIUM') {
      recommendations.push('⚠️ Exercise caution with this message');
      recommendations.push('✅ Verify any important requests independently');
      recommendations.push('🔍 Double-check sender authenticity if uncertain');
      recommendations.push('📞 Use official contact methods for verification');
    } else {
      recommendations.push('✅ Message appears legitimate based on analysis');
      recommendations.push('🔍 Still verify important financial or personal requests');
      recommendations.push('🛡️ Stay alert for future suspicious messages');
      recommendations.push('📚 Keep learning about fraud patterns to stay protected');
    }
    
    // Generate detailed technical analysis
    const detailedAnalysis = [
      `**🤖 ML Analysis (PRIMARY - AI Detection):**`,
      `• ML Enabled: ${mlAnalysis.isEnabled ? 'Yes' : 'No'}`,
      `• Model Status: ${mlAnalysis.isModelLoaded ? 'Loaded' : 'Not Available'}`,
      `• ML Verdict: ${mlAnalysis.mlVerdict ? (mlAnalysis.mlVerdict.isFraud ? 'FRAUD DETECTED' : 'SAFE') : 'N/A'}`,
      `• ML Confidence: ${mlAnalysis.mlScore}%`,
      `• ML Weight: ${mlAnalysis.mlContribution}% (Primary Analyzer)`,
      mlAnalysis.mlVerdict ? `• ML Details: ${mlAnalysis.mlVerdict.details}` : '',
      ``,
      `**👤 WHO Analysis (Supplementary - Sender Verification):**`,
      `• Sender Type: ${senderAnalysis.senderType}`,
      `• Legitimacy: ${senderAnalysis.senderLegitimacy}`,
      `• Reputation Score: ${senderAnalysis.senderReputation}/100`,
      `• Red Flags: ${senderAnalysis.senderRedFlags.length}`,
      ``,
      `**📝 WHAT Analysis (Supplementary - Content Patterns):**`,
      `• Fraud Patterns: ${contentAnalysis.fraudPatterns.length} detected`,
      `• Urgency Level: ${contentAnalysis.urgencyLevel}`,
      `• Social Engineering: ${contentAnalysis.socialEngineeringTactics.length} tactics`,
      `• Suspicious Elements: ${contentAnalysis.suspiciousElements.length} found`,
      ``,
      `**📊 Final Risk Assessment:**`,
      `• Analysis Method: ${mlAnalysis.isEnabled && mlAnalysis.mlVerdict ? 'ML-Primary (70%) + Traditional (30%)' : 'Traditional Fallback Only'}`,
      `• Overall Risk: ${combinedAnalysis.riskLevel}`,
      `• Confidence: ${combinedAnalysis.confidenceScore}%`,
      `• Fraud Status: ${combinedAnalysis.isFraud ? 'FRAUDULENT' : 'APPEARS SAFE'}`
    ].filter(line => line !== '').join('\n');
    
    return {
      summary,
      detailedAnalysis,
      redFlags,
      recommendations
    };
  }
}

export const manualSMSAnalyzer = ManualSMSAnalyzer.getInstance(); 