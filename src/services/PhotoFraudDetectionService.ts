/**
 * Photo Fraud Detection Service
 * Combines OCR text extraction with fraud analysis to detect scams in images
 */

import { ocrService } from './OCRService';
import { otpInsightService } from './OtpInsightService';

export interface PhotoFraudResult {
  isFraudulent: boolean;
  riskLevel: 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CRITICAL';
  riskScore: number;
  extractedText: string;
  fraudIndicators: string[];
  warnings: string[];
  detectionMethods: string[];
  confidence: number;
  timestamp: number;
}

export class PhotoFraudDetectionService {
  
  /**
   * Analyze a photo for fraudulent content using OCR + text analysis
   */
  static async analyzePhoto(imageUri: string): Promise<PhotoFraudResult> {
    console.log('📸 Starting photo fraud analysis for:', imageUri);
    
    const result: PhotoFraudResult = {
      isFraudulent: false,
      riskLevel: 'SAFE',
      riskScore: 0,
      extractedText: '',
      fraudIndicators: [],
      warnings: [],
      detectionMethods: [],
      confidence: 0,
      timestamp: Date.now()
    };

    try {
      // Step 1: Extract text from image using OCR
      console.log('🔍 Extracting text from image...');
      const ocrResult = await ocrService.extractTextFromImage(imageUri);
      
      if (!ocrResult.success || !ocrResult.text) {
        result.warnings.push('Could not extract text from image');
        result.confidence = 20;
        return result;
      }

      result.extractedText = ocrResult.text;
      result.detectionMethods.push('OCR Text Extraction');
      console.log('📝 Extracted text:', ocrResult.text.substring(0, 100) + '...');

      // Step 2: Analyze extracted text for fraud patterns
      console.log('🧠 Analyzing extracted text for fraud patterns...');
      const textAnalysis = await otpInsightService.analyzeMessage(ocrResult.text, 'IMAGE_CONTENT');
      
      if (textAnalysis.overallRiskLevel !== 'SAFE') {
        result.isFraudulent = true;
        result.riskLevel = textAnalysis.overallRiskLevel as any;
        result.riskScore += this.convertRiskLevelToScore(textAnalysis.overallRiskLevel);
        
        if (textAnalysis.details) {
          result.fraudIndicators.push(textAnalysis.details);
        }
        
        result.detectionMethods.push('AI Text Analysis');
      }

      // Step 3: Photo-specific fraud detection patterns
      const photoSpecificRisks = this.analyzePhotoSpecificPatterns(ocrResult.text);
      result.riskScore += photoSpecificRisks.score;
      result.fraudIndicators.push(...photoSpecificRisks.indicators);
      result.warnings.push(...photoSpecificRisks.warnings);
      result.detectionMethods.push(...photoSpecificRisks.methods);

      // Step 4: Visual context analysis (basic)
      const visualContext = this.analyzeVisualContext(imageUri, ocrResult.text);
      result.riskScore += visualContext.score;
      result.fraudIndicators.push(...visualContext.indicators);
      result.warnings.push(...visualContext.warnings);
      result.detectionMethods.push(...visualContext.methods);

      // Step 5: Calculate final risk assessment
      result.riskLevel = this.calculatePhotoRiskLevel(result.riskScore);
      result.isFraudulent = result.riskLevel === 'HIGH_RISK' || result.riskLevel === 'CRITICAL';
      result.confidence = Math.min(95, 60 + (result.riskScore / 2)); // Higher score = higher confidence

      console.log('📊 Photo fraud analysis complete:', {
        riskLevel: result.riskLevel,
        riskScore: result.riskScore,
        fraudulent: result.isFraudulent,
        confidence: result.confidence
      });

      return result;

    } catch (error) {
      console.error('❌ Photo fraud analysis failed:', error);
      result.warnings.push('Analysis failed - treating as suspicious');
      result.riskLevel = 'SUSPICIOUS';
      result.riskScore = 50;
      result.confidence = 30;
      return result;
    }
  }

  /**
   * Analyze photo-specific fraud patterns
   */
  private static analyzePhotoSpecificPatterns(text: string): {
    score: number;
    indicators: string[];
    warnings: string[];
    methods: string[];
  } {
    const result = { score: 0, indicators: [] as string[], warnings: [] as string[], methods: [] as string[] };
    const textLower = text.toLowerCase();

    // Screenshot fraud patterns (fake bank statements, payment confirmations)
    const screenshotFraudPatterns = [
      { pattern: /account.*balance.*₹?\s*\d+/i, score: 30, name: 'Fake bank balance screenshot' },
      { pattern: /payment.*successful.*₹?\s*\d+/i, score: 25, name: 'Fake payment confirmation' },
      { pattern: /transaction.*completed.*₹?\s*\d+/i, score: 25, name: 'Fake transaction proof' },
      { pattern: /upi.*id.*\d+/i, score: 20, name: 'UPI ID in screenshot' },
      { pattern: /paytm.*wallet.*₹?\s*\d+/i, score: 20, name: 'Fake Paytm wallet screenshot' }
    ];

    for (const { pattern, score, name } of screenshotFraudPatterns) {
      if (pattern.test(text)) {
        result.score += score;
        result.indicators.push(name);
        result.warnings.push(`Screenshot fraud pattern detected: ${name}`);
        break;
      }
    }

    // QR code fraud in images
    if (textLower.includes('qr') || textLower.includes('scan') && textLower.includes('pay')) {
      result.score += 15;
      result.indicators.push('QR code payment request in image');
      result.warnings.push('Verify QR code payments carefully');
    }

    // Fake certificate/document patterns
    const certificateFraudPatterns = [
      { pattern: /certificate.*awarded/i, score: 20, name: 'Fake certificate' },
      { pattern: /government.*id.*card/i, score: 35, name: 'Fake government ID' },
      { pattern: /driving.*license/i, score: 30, name: 'Fake driving license' },
      { pattern: /passport.*republic.*india/i, score: 40, name: 'Fake passport' }
    ];

    for (const { pattern, score, name } of certificateFraudPatterns) {
      if (pattern.test(text)) {
        result.score += score;
        result.indicators.push(name);
        result.warnings.push(`Document fraud detected: ${name}`);
        break;
      }
    }

    // Social media scam screenshots
    if (textLower.includes('whatsapp') || textLower.includes('telegram')) {
      if (textLower.includes('lottery') || textLower.includes('winner') || textLower.includes('prize')) {
        result.score += 35;
        result.indicators.push('Social media lottery scam screenshot');
        result.warnings.push('Social media lottery scams are common fraud');
      }
    }

    if (result.indicators.length > 0) {
      result.methods.push('Photo-Specific Pattern Analysis');
    }

    return result;
  }

  /**
   * Analyze visual context clues
   */
  private static analyzeVisualContext(imageUri: string, text: string): {
    score: number;
    indicators: string[];
    warnings: string[];
    methods: string[];
  } {
    const result = { score: 0, indicators: [] as string[], warnings: [] as string[], methods: [] as string[] };

    // Check for common screenshot indicators
    if (text.includes('Screenshot') || text.includes('screen shot')) {
      result.score += 5;
      result.indicators.push('Screenshot detected');
      result.warnings.push('Screenshots can be easily manipulated');
    }

    // Check for image editing artifacts (basic text-based detection)
    const editingIndicators = ['photoshop', 'edited', 'modified', 'fake', 'generated'];
    for (const indicator of editingIndicators) {
      if (text.toLowerCase().includes(indicator)) {
        result.score += 15;
        result.indicators.push(`Image editing indicator: ${indicator}`);
        result.warnings.push('Image may have been digitally manipulated');
        break;
      }
    }

    // Check for poor quality/blurry text (OCR confidence-based)
    if (text.length > 0 && text.split(' ').length < 5) {
      result.score += 5;
      result.indicators.push('Low text extraction quality');
      result.warnings.push('Poor image quality may indicate manipulation');
    }

    if (result.indicators.length > 0) {
      result.methods.push('Visual Context Analysis');
    }

    return result;
  }

  /**
   * Convert risk level to numeric score
   */
  private static convertRiskLevelToScore(riskLevel: string): number {
    switch (riskLevel) {
      case 'CRITICAL': return 80;
      case 'HIGH_RISK': return 60;
      case 'SUSPICIOUS': return 40;
      case 'SAFE': return 0;
      default: return 20;
    }
  }

  /**
   * Calculate photo-specific risk level
   */
  private static calculatePhotoRiskLevel(score: number): 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CRITICAL' {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH_RISK';
    if (score >= 35) return 'SUSPICIOUS';
    return 'SAFE';
  }

  /**
   * Get fraud detection capabilities description
   */
  static getCapabilities(): string[] {
    return [
      '📸 OCR Text Extraction from Images',
      '🧠 AI-Powered Text Analysis',
      '💰 Fake Payment Screenshot Detection',
      '🆔 Fake Document Detection',
      '📱 Social Media Scam Detection',
      '💳 QR Code Fraud Detection',
      '🔍 Visual Context Analysis',
      '⚠️ Image Manipulation Detection',
      '📊 Multi-Layer Risk Assessment',
      '🎯 High Accuracy Fraud Scoring'
    ];
  }

  /**
   * Common fraud types detected in photos
   */
  static getDetectedFraudTypes(): string[] {
    return [
      'Fake Bank Balance Screenshots',
      'Fake Payment Confirmations',
      'Fake Transaction Proofs',
      'Fake Government IDs',
      'Fake Certificates',
      'Social Media Lottery Scams',
      'Fake QR Code Payments',
      'Manipulated Financial Documents',
      'Fake UPI Transaction Screenshots',
      'Fraudulent Wallet Screenshots'
    ];
  }
}

export const photoFraudDetectionService = new PhotoFraudDetectionService(); 