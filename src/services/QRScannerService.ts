import { Platform } from 'react-native';
import { otpInsightService } from './OtpInsightService';
import { LinkScannerService, UrlScanResult } from './ScannerService';

export interface QRScanResult {
  type: string;
  data: string;
  isFraudulent: boolean;
  riskLevel: 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CRITICAL';
  riskScore: number;
  analysis: {
    urlScan?: UrlScanResult;
    textAnalysis?: any;
    fraudIndicators: string[];
    warnings: string[];
  };
  timestamp: number;
}

export class QRScannerService {
  private static instance: QRScannerService;
  private isInitialized: boolean = false;
  private scanHistory: QRScanResult[] = [];

  private constructor() {}

  static getInstance(): QRScannerService {
    if (!QRScannerService.instance) {
      QRScannerService.instance = new QRScannerService();
    }
    return QRScannerService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize required services
      await LinkScannerService.initializeService();
      await otpInsightService.initialize();
      
      this.isInitialized = true;
      console.log('✅ QR Scanner Service initialized');
    } catch (error) {
      console.error('❌ QR Scanner Service initialization failed:', error);
      throw error;
    }
  }

  /**
   * Analyze QR code data with smart payment/non-payment detection
   */
  async analyzeQRCode(type: string, data: string): Promise<QRScanResult> {
    // Ensure parameters are valid
    if (!type || typeof type !== 'string') {
      type = 'UNKNOWN';
    }
    if (!data || typeof data !== 'string') {
      data = '';
    }

    console.log('🔍 Analyzing QR code:', { type, data: data.substring(0, 100) + '...' });

    const result: QRScanResult = {
      type,
      data,
      isFraudulent: false,
      riskLevel: 'SAFE',
      riskScore: 0,
      analysis: {
        fraudIndicators: [],
        warnings: []
      },
      timestamp: Date.now()
    };

    try {
      // STEP 1: Classify QR Type - Payment vs Non-Payment
      const qrCategory = this.classifyQRType(type, data);
      console.log(`📱 QR Category: ${qrCategory}`);

      if (qrCategory === 'PAYMENT') {
        // IMMEDIATE PROTECTION for Payment QR Codes
        console.log('💰 Payment QR detected - applying immediate protection');
        return await this.immediatePaymentProtection(type, data, result);
        
      } else {
        // DETAILED VIRUSTOTAL ANALYSIS for Non-Payment QR Codes
        console.log('🌐 Non-payment QR detected - sending to VirusTotal for detailed analysis');
        return await this.detailedVirusTotalAnalysis(type, data, result);
      }

    } catch (error) {
      console.error('❌ QR analysis failed:', error);
      result.analysis.warnings.push('Analysis failed - treat with caution');
      result.riskLevel = 'SUSPICIOUS';
      result.riskScore = 50;
      return result;
    }
  }

  /**
   * Classify QR code as Payment or Non-Payment related
   */
  public classifyQRType(type: string, data: string): 'PAYMENT' | 'NON_PAYMENT' {
    const dataLower = data.toLowerCase();
    
    // UPI Payment Patterns
    if (dataLower.startsWith('upi://pay') || 
        dataLower.includes('upi://pay?') ||
        dataLower.includes('pa=') && dataLower.includes('am=')) {
      return 'PAYMENT';
    }
    
    // Cryptocurrency Payment Patterns
    if (dataLower.startsWith('bitcoin:') || 
        dataLower.startsWith('ethereum:') ||
        dataLower.includes('bitcoin address') ||
        dataLower.includes('wallet address')) {
      return 'PAYMENT';
    }
    
    // Banking/Payment URLs
    if (dataLower.includes('netbanking') ||
        dataLower.includes('payment') ||
        dataLower.includes('paynow') ||
        dataLower.includes('razorpay') ||
        dataLower.includes('paytm') ||
        dataLower.includes('phonepe') ||
        dataLower.includes('googlepay')) {
      return 'PAYMENT';
    }
    
    // Money Transfer Patterns
    if (dataLower.includes('send money') ||
        dataLower.includes('transfer') && dataLower.includes('amount') ||
        dataLower.includes('₹') || dataLower.includes('rs.') ||
        dataLower.includes('inr') || dataLower.includes('rupees')) {
      return 'PAYMENT';
    }
    
    // Everything else is non-payment
    return 'NON_PAYMENT';
  }

  /**
   * Immediate protection analysis for payment QR codes
   */
  private async immediatePaymentProtection(type: string, data: string, result: QRScanResult): Promise<QRScanResult> {
    console.log('🚨 Applying immediate payment protection...');
    
    // Fast local analysis only - no external API calls
    result.analysis.warnings.push('Payment QR - Local security analysis applied');
    
    // 1. UPI Structure Validation (if UPI)
    if (data.toLowerCase().startsWith('upi://')) {
      const upiAnalysis = this.analyzeUPIStructure(data);
      result.riskScore += upiAnalysis.riskScore;
      result.analysis.fraudIndicators.push(...upiAnalysis.indicators);
      result.analysis.warnings.push(...upiAnalysis.warnings);
    }
    
    // 2. Payment-specific fraud patterns (local analysis)
    const paymentRisks = this.analyzePaymentFraudPatterns(data);
    result.riskScore += paymentRisks.score;
    result.analysis.fraudIndicators.push(...paymentRisks.indicators);
    result.analysis.warnings.push(...paymentRisks.warnings);
    
    // 3. Quick text analysis for payment context (no notifications - QR scanner handles results)
    const textAnalysis = await otpInsightService.analyzeMessage(data, 'PAYMENT_QR', false);
    if (textAnalysis.overallRiskLevel !== 'SAFE') {
      result.riskScore += this.convertRiskLevelToScore(textAnalysis.overallRiskLevel);
      if (textAnalysis.details) {
        result.analysis.fraudIndicators.push(textAnalysis.details);
      }
    }
    
    // 4. Payment-specific risk thresholds (more strict)
    result.riskLevel = this.calculatePaymentRiskLevel(result.riskScore);
    result.isFraudulent = result.riskLevel === 'HIGH_RISK' || result.riskLevel === 'CRITICAL';
    
    // 5. Store in history
    this.addToHistory(result);
    
    console.log('⚡ Immediate payment protection complete:', {
      riskLevel: result.riskLevel,
      riskScore: result.riskScore,
      fraudulent: result.isFraudulent
    });
    
    return result;
  }

  /**
   * Detailed VirusTotal analysis for non-payment QR codes
   */
  private async detailedVirusTotalAnalysis(type: string, data: string, result: QRScanResult): Promise<QRScanResult> {
    console.log('🔍 Performing detailed VirusTotal analysis...');
    
    result.analysis.warnings.push('Non-payment QR - Detailed cloud analysis applied');
    
    try {
      // 1. URL Analysis with VirusTotal (if URL detected)
      if (this.isURL(data)) {
        console.log('🌐 URL detected - scanning with VirusTotal');
        const urlScan = await LinkScannerService.scanUrl(data);
        result.analysis.urlScan = urlScan;

        if (!urlScan.isSafe) {
          result.isFraudulent = true;
          result.riskLevel = 'CRITICAL';
          result.riskScore += 80;
          result.analysis.fraudIndicators.push('Malicious URL detected by VirusTotal');
          result.analysis.warnings.push('This QR code contains a dangerous link');
        } else {
          result.analysis.warnings.push('URL verified safe by VirusTotal');
        }
      }

      // 2. Comprehensive text pattern analysis (no notifications - QR scanner handles results)
      const textAnalysis = await otpInsightService.analyzeMessage(data, 'QR_CODE', false);
      result.analysis.textAnalysis = textAnalysis;

      if (textAnalysis.overallRiskLevel !== 'SAFE') {
        result.riskScore += this.convertRiskLevelToScore(textAnalysis.overallRiskLevel);
        if (textAnalysis.details) {
          result.analysis.fraudIndicators.push(textAnalysis.details);
        }
      }

      // 3. QR-specific fraud patterns (more lenient for non-payment)
      const qrSpecificRisks = this.analyzeQRSpecificPatterns(type, data);
      result.riskScore += qrSpecificRisks.score;
      result.analysis.fraudIndicators.push(...qrSpecificRisks.indicators);
      result.analysis.warnings.push(...qrSpecificRisks.warnings);

      // 4. Check for safe patterns (more generous for non-payment)
      const safePatterns = this.checkForSafePatterns(type, data);
      if (safePatterns.isSafe) {
        result.riskScore = Math.max(0, result.riskScore - safePatterns.safetyBonus);
        result.analysis.warnings.push('QR appears to be from a legitimate source');
      }

      // 5. Non-payment risk thresholds (more lenient)
      result.riskLevel = this.calculateNonPaymentRiskLevel(result.riskScore);
      result.isFraudulent = result.riskLevel === 'CRITICAL'; // Only block critical threats

      // 6. Store in history
      this.addToHistory(result);

      console.log('📊 Detailed VirusTotal analysis complete:', {
        riskLevel: result.riskLevel,
        riskScore: result.riskScore,
        fraudulent: result.isFraudulent
      });

    } catch (error) {
      console.error('❌ VirusTotal analysis failed:', error);
      result.analysis.warnings.push('Cloud analysis failed - using local analysis only');
      
      // Fallback to local analysis
      const localAnalysis = this.analyzeQRSpecificPatterns(type, data);
      result.riskScore += localAnalysis.score;
      result.analysis.fraudIndicators.push(...localAnalysis.indicators);
      result.analysis.warnings.push(...localAnalysis.warnings);
      
      result.riskLevel = this.calculateNonPaymentRiskLevel(result.riskScore);
      result.isFraudulent = result.riskLevel === 'CRITICAL';
    }
    
    return result;
  }

  /**
   * Analyze QR-specific fraud patterns
   */
  private analyzeQRSpecificPatterns(type: string, data: string): {
    score: number;
    indicators: string[];
    warnings: string[];
  } {
    const result = { score: 0, indicators: [] as string[], warnings: [] as string[] };

    // Ensure type is valid before processing
    if (!type || typeof type !== 'string') {
      type = 'UNKNOWN';
    }

    // 1. QR types that need extra verification (but not automatically suspicious)
    const extraVerificationTypes = ['EMAIL', 'SMS', 'TEL'];
    if (extraVerificationTypes.includes(type.toUpperCase())) {
      result.score += 5; // Reduced from 10 to 5
      result.indicators.push(`QR type requires verification: ${type}`);
      result.warnings.push(`Verify ${type} requests are from legitimate sources`);
    }

    // 2. Phishing patterns in data
    const phishingPatterns = [
      /urgent.*action.*required/i,
      /verify.*account.*immediately/i,
      /suspended.*click.*here/i,
      /free.*money.*claim/i,
      /won.*lottery.*prize/i,
      /tax.*refund.*claim/i,
      /bitcoin.*wallet.*transfer/i,
      /crypto.*investment.*opportunity/i
    ];

    for (const pattern of phishingPatterns) {
      if (pattern.test(data)) {
        result.score += 25;
        result.indicators.push('Phishing language detected in QR content');
        result.warnings.push('QR contains suspicious phishing-like text');
        break;
      }
    }

    // 3. URL shorteners (require verification but not automatically suspicious)
    const urlShorteners = [
      'bit.ly', 'tinyurl.com', 'short.link', 'rebrand.ly',
      'ow.ly', 'buff.ly', 't.co', 'goo.gl'
    ];

    for (const domain of urlShorteners) {
      if (data.toLowerCase().includes(domain)) {
        result.score += 10; // Reduced from 15 to 10
        result.indicators.push(`URL shortener detected: ${domain}`);
        result.warnings.push('QR uses URL shortening - verify final destination is legitimate');
        break;
      }
    }

    // 4. Fake payment/crypto QR codes
    const cryptoPatterns = [
      /bitcoin.*address/i,
      /ethereum.*wallet/i,
      /crypto.*payment/i,
      /wallet.*address/i,
      /send.*btc/i,
      /send.*eth/i
    ];

    for (const pattern of cryptoPatterns) {
      if (pattern.test(data)) {
        result.score += 30;
        result.indicators.push('Cryptocurrency payment request detected');
        result.warnings.push('Verify cryptocurrency payment requests carefully');
        break;
      }
    }

    // 5. Emergency/urgency indicators
    const urgencyPatterns = [
      /urgent/i, /immediate/i, /expire/i, /limited.*time/i,
      /act.*now/i, /hurry/i, /deadline/i, /final.*notice/i
    ];

    let urgencyCount = 0;
    for (const pattern of urgencyPatterns) {
      if (pattern.test(data)) {
        urgencyCount++;
      }
    }

    if (urgencyCount > 0) {
      result.score += urgencyCount * 10;
      result.indicators.push(`Urgency language detected (${urgencyCount} instances)`);
      result.warnings.push('QR content uses pressure tactics - be cautious');
    }

    return result;
  }

  /**
   * Check for common safe QR patterns to reduce false positives
   */
  private checkForSafePatterns(type: string, data: string): { isSafe: boolean; safetyBonus: number } {
    const result = { isSafe: false, safetyBonus: 0 };

    // Ensure type is valid before processing
    if (!type || typeof type !== 'string') {
      type = 'UNKNOWN';
    }

    // Common legitimate domains and services
    const legitimateDomains = [
      'google.com', 'youtube.com', 'facebook.com', 'instagram.com',
      'twitter.com', 'linkedin.com', 'microsoft.com', 'apple.com',
      'amazon.com', 'netflix.com', 'spotify.com', 'github.com',
      'stackoverflow.com', 'wikipedia.org', 'medium.com'
    ];

    // Check for legitimate domains
    for (const domain of legitimateDomains) {
      if (data.toLowerCase().includes(domain)) {
        result.isSafe = true;
        result.safetyBonus = 15;
        break;
      }
    }

    // Safe QR patterns
    if (type === 'url' || type === 'URL') {
      // HTTPS is generally safer than HTTP
      if (data.startsWith('https://')) {
        result.safetyBonus += 5;
      }
      
      // Popular social media and tech platforms
      if (data.includes('youtube.com/watch') || 
          data.includes('github.com/') ||
          data.includes('linkedin.com/in/')) {
        result.isSafe = true;
        result.safetyBonus = 20;
      }
    }

    // WiFi QR codes are usually safe
    if (type === 'wifi' || type === 'WIFI' || data.startsWith('WIFI:')) {
      result.isSafe = true;
      result.safetyBonus = 10;
    }

    // Contact/vCard QR codes are usually safe
    if (type === 'vcard' || type === 'VCARD' || data.startsWith('BEGIN:VCARD')) {
      result.isSafe = true;
      result.safetyBonus = 10;
    }

    return result;
  }

  /**
   * Check if data is a URL
   */
  private isURL(data: string): boolean {
    try {
      new URL(data);
      return true;
    } catch {
      return /^https?:\/\//.test(data) || data.includes('www.') || data.includes('.com');
    }
  }

  /**
   * Convert risk level to numeric score
   */
  private convertRiskLevelToScore(riskLevel: string): number {
    switch (riskLevel) {
      case 'SAFE': return 0;
      case 'SUSPICIOUS': return 25;
      case 'HIGH_RISK': return 50;
      case 'CRITICAL': return 75;
      default: return 10;
    }
  }

  /**
   * Analyze UPI structure for fraud patterns
   */
  private analyzeUPIStructure(data: string): { riskScore: number; indicators: string[]; warnings: string[] } {
    const result = { riskScore: 0, indicators: [] as string[], warnings: [] as string[] };
    
    try {
      // Parse UPI parameters
      const url = new URL(data);
      const params = url.searchParams;
      
      const payeeAddress = params.get('pa') || '';
      const payeeName = params.get('pn') || '';
      const amount = params.get('am') || '';
      const currency = params.get('cu') || '';
      const transactionNote = params.get('tn') || '';
      
      // Check for suspicious payee addresses
      const suspiciousDomains = ['fakepay', 'scambank', 'fraudpay', 'tempbank'];
      for (const domain of suspiciousDomains) {
        if (payeeAddress.toLowerCase().includes(domain)) {
          result.riskScore += 80;
          result.indicators.push(`Suspicious bank handle: ${payeeAddress}`);
          break;
        }
      }
      
      // Check for suspicious payee names
      const suspiciousNames = ['freemoney', 'lottery', 'winner', 'prize', 'urgent'];
      for (const name of suspiciousNames) {
        if (payeeName.toLowerCase().includes(name)) {
          result.riskScore += 30;
          result.indicators.push(`Suspicious merchant name: ${payeeName}`);
          break;
        }
      }
      
      // Check for unusual amounts
      if (amount) {
        const amountNum = parseFloat(amount);
        if (amountNum > 100000) {
          result.riskScore += 20;
          result.indicators.push(`High amount transaction: ₹${amountNum}`);
          result.warnings.push('Verify high-value transaction carefully');
        }
        if (amountNum === 0 || amountNum < 0) {
          result.riskScore += 50;
          result.indicators.push(`Invalid amount: ₹${amountNum}`);
        }
      }
      
      // Check transaction note for fraud patterns
      if (transactionNote) {
        const fraudPatterns = [/urgent/i, /emergency/i, /lottery/i, /prize/i, /free.*money/i];
        for (const pattern of fraudPatterns) {
          if (pattern.test(transactionNote)) {
            result.riskScore += 15;
            result.indicators.push(`Suspicious transaction note: ${transactionNote}`);
            break;
          }
        }
      }
      
    } catch (error) {
      result.riskScore += 10;
      result.indicators.push('Invalid UPI format');
      result.warnings.push('UPI format appears malformed');
    }
    
    return result;
  }

  /**
   * Analyze payment-specific fraud patterns
   */
  private analyzePaymentFraudPatterns(data: string): { score: number; indicators: string[]; warnings: string[] } {
    const result = { score: 0, indicators: [] as string[], warnings: [] as string[] };
    const dataLower = data.toLowerCase();
    
    // High-risk payment fraud patterns
    const highRiskPatterns = [
      { pattern: /send.*money.*urgent/i, score: 40, name: 'Urgent money transfer request' },
      { pattern: /lottery.*winner.*pay/i, score: 50, name: 'Lottery winner payment scam' },
      { pattern: /free.*money.*claim/i, score: 45, name: 'Free money claim scam' },
      { pattern: /tax.*refund.*payment/i, score: 35, name: 'Fake tax refund scam' }
    ];
    
    for (const { pattern, score, name } of highRiskPatterns) {
      if (pattern.test(data)) {
        result.score += score;
        result.indicators.push(name);
        result.warnings.push(`Payment fraud pattern detected: ${name}`);
        break;
      }
    }
    
    // Cryptocurrency payment risks
    if (dataLower.includes('bitcoin') || dataLower.includes('btc') || 
        dataLower.includes('ethereum') || dataLower.includes('crypto')) {
      result.score += 25;
      result.indicators.push('Cryptocurrency payment detected');
      result.warnings.push('Verify cryptocurrency payments carefully - irreversible');
    }
    
    // Suspicious payment amounts in text
    const largeAmountPattern = /₹\s*(\d{1,3}(?:,\d{3})*|\d+)/g;
    const matches = data.match(largeAmountPattern);
    if (matches) {
      for (const match of matches) {
        const amount = parseInt(match.replace(/[₹,\s]/g, ''));
        if (amount > 50000) {
          result.score += 15;
          result.indicators.push(`Large amount mentioned: ${match}`);
          result.warnings.push('Verify large payment amounts carefully');
          break;
        }
      }
    }
    
    return result;
  }

  /**
   * Calculate risk level for payment QR codes (more strict thresholds)
   */
  private calculatePaymentRiskLevel(score: number): 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CRITICAL' {
    if (score >= 70) return 'CRITICAL';     // Stricter for payments
    if (score >= 50) return 'HIGH_RISK';    // Stricter for payments
    if (score >= 30) return 'SUSPICIOUS';   // Stricter for payments
    return 'SAFE';
  }

  /**
   * Calculate risk level for non-payment QR codes (more lenient thresholds)
   */
  private calculateNonPaymentRiskLevel(score: number): 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CRITICAL' {
    if (score >= 90) return 'CRITICAL';     // More lenient for non-payments
    if (score >= 70) return 'HIGH_RISK';    // More lenient for non-payments
    if (score >= 45) return 'SUSPICIOUS';   // More lenient for non-payments
    return 'SAFE';
  }

  /**
   * Calculate final risk level based on score (legacy method for compatibility)
   */
  private calculateFinalRiskLevel(score: number): 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CRITICAL' {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH_RISK';     // Increased from 50 to 60
    if (score >= 35) return 'SUSPICIOUS';    // Increased from 25 to 35  
    return 'SAFE';
  }

  /**
   * Add scan result to history
   */
  private addToHistory(result: QRScanResult): void {
    this.scanHistory.unshift(result);
    
    // Keep only last 50 scans
    if (this.scanHistory.length > 50) {
      this.scanHistory = this.scanHistory.slice(0, 50);
    }
  }

  /**
   * Get scan history
   */
  getScanHistory(): QRScanResult[] {
    return [...this.scanHistory];
  }

  /**
   * Clear scan history
   */
  clearHistory(): void {
    this.scanHistory = [];
  }

  /**
   * Get service status
   */
  getStatus(): {
    initialized: boolean;
    platform: string;
    totalScans: number;
    fraudulentScans: number;
    lastScanTime?: number;
  } {
    const fraudulentScans = this.scanHistory.filter(scan => scan.isFraudulent).length;
    const lastScan = this.scanHistory[0];

    return {
      initialized: this.isInitialized,
      platform: Platform.OS,
      totalScans: this.scanHistory.length,
      fraudulentScans,
      lastScanTime: lastScan?.timestamp
    };
  }
}

// Export singleton instance
export const qrScannerService = QRScannerService.getInstance(); 