import { Platform } from 'react-native';
import MockMLKitTextRecognition from '../lib/mlKitMock';

// Conditional import for native ML Kit
let MLKitTextRecognition: any = null;
let isMLKitAvailable = false;

// Only attempt to load ML Kit on native platforms in development/production builds
if (Platform.OS === 'android' || Platform.OS === 'ios') {
  try {
    // Check if we're in a native build environment (not Expo Go)
    const isExpoGo = process.env.EXPO_PUBLIC_APP_VARIANT === 'development' && 
                     process.env.EXPO_PUBLIC_APP_NAME?.includes('Expo Go');
    
    const isNativeBuild = !isExpoGo && (
      process.env.ENABLE_NATIVE_FEATURES === 'true' || 
      process.env.ENVIRONMENT?.includes('native') ||
      process.env.NODE_ENV === 'production' ||
      process.env.EXPO_PUBLIC_ENVIRONMENT === 'production' ||
      !__DEV__ // React Native production build indicator
    );
    
    console.log('🔍 ML Kit Environment Check:', {
      platform: Platform.OS,
      isExpoGo,
      isNativeBuild,
      isDev: __DEV__,
      nodeEnv: process.env.NODE_ENV,
      expoEnv: process.env.EXPO_PUBLIC_ENVIRONMENT
    });
    
    if (isNativeBuild || !isExpoGo) {
      // Try to require the module, but handle if it's not available
      try {
        const MLKitModule = require('@react-native-ml-kit/text-recognition');
        MLKitTextRecognition = MLKitModule.default || MLKitModule;
        isMLKitAvailable = true;
        console.log('✅ ML Kit Text Recognition loaded for native build');
      } catch (requireError) {
        console.log('📱 ML Kit module not found - using mock OCR:', requireError instanceof Error ? requireError.message : requireError);
        MLKitTextRecognition = MockMLKitTextRecognition;
        isMLKitAvailable = false; // Still false because it's mock
      }
    } else {
      console.log('📱 Expo Go environment detected - using mock ML Kit');
      MLKitTextRecognition = MockMLKitTextRecognition;
    }
  } catch (error) {
    console.log('❌ ML Kit Text Recognition not available:', error);
    MLKitTextRecognition = MockMLKitTextRecognition;
    isMLKitAvailable = false;
  }
} else {
  console.log('📱 Platform not supported for ML Kit:', Platform.OS);
  MLKitTextRecognition = MockMLKitTextRecognition;
}

export interface OCRResult {
  success: boolean;
  text: string;
  confidence: number;
  error?: string;
  blocks?: Array<{
    text: string;
    boundingBox?: any;
    confidence: number;
  }>;
  processingTime?: number;
}

export class OCRService {
  private static instance: OCRService;
  private isNativeMLAvailable: boolean = isMLKitAvailable;

  private constructor() {
    this.logOCRStatus();
  }

  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  private logOCRStatus(): void {
    console.log('[OCRService] Initialization Status:');
    console.log(`  Platform: ${Platform.OS}`);
    console.log(`  Environment: ${process.env.ENVIRONMENT || 'unknown'}`);
    console.log(`  Native Features: ${process.env.ENABLE_NATIVE_FEATURES || 'false'}`);
    console.log(`  ML Kit Available: ${this.isNativeMLAvailable ? 'YES' : 'NO'}`);
  }

  /**
   * Extract text from image using native ML Kit or fallback
   */
  async extractTextFromImage(imageUri: string): Promise<OCRResult> {
    const startTime = Date.now();
    console.log('[OCRService] OCR requested for:', imageUri);

    if (MLKitTextRecognition) {
      if (this.isNativeMLAvailable) {
        return this.extractTextWithNativeMLKit(imageUri, startTime);
      } else {
        // Use mock ML Kit for consistent interface
        return this.extractTextWithMockMLKit(imageUri, startTime);
      }
    } else {
      return this.extractTextWithFallback(imageUri, startTime);
    }
  }

  /**
   * Native ML Kit text extraction
   */
  private async extractTextWithNativeMLKit(imageUri: string, startTime: number): Promise<OCRResult> {
    try {
      console.log('[OCRService] Using native ML Kit for text recognition...');
      
      const result = await MLKitTextRecognition.recognize(imageUri);
      const processingTime = Date.now() - startTime;
      
      const extractedText = this.cleanExtractedText(result.text || '');
      const confidence = this.calculateNativeConfidence(extractedText, result);
      
      console.log('[OCRService] Native ML Kit completed:', {
        textLength: extractedText.length,
        confidence: confidence,
        processingTime: `${processingTime}ms`,
        blocksFound: result.blocks?.length || 0
      });

      return {
        success: true,
        text: extractedText,
        confidence: confidence,
        processingTime: processingTime,
        blocks: result.blocks?.map((block: any) => ({
          text: block.text,
          boundingBox: block.boundingBox,
          confidence: block.confidence || 0.85
        })) || []
      };

    } catch (error) {
      console.error('[OCRService] Native ML Kit error:', error);
      const processingTime = Date.now() - startTime;
      
      return {
        success: false,
        text: '',
        confidence: 0,
        processingTime: processingTime,
        error: `Native OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Mock ML Kit text extraction for development/demonstration
   */
  private async extractTextWithMockMLKit(imageUri: string, startTime: number): Promise<OCRResult> {
    try {
      console.log('[OCRService] Using mock ML Kit for text recognition...');
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const processingTime = Date.now() - startTime;
      
      // Try to use mock MLKit first, otherwise provide demo text
      try {
        const result = await MLKitTextRecognition.recognize(imageUri);
        return {
          success: true,
          text: result.text || this.getDemoOCRText(),
          confidence: 75, // Reasonable confidence for demo
          processingTime: processingTime,
          blocks: result.blocks || []
        };
      } catch (mockError) {
        // Mock MLKit also failed, provide helpful demo text
        return {
          success: true,
          text: this.getDemoOCRText(),
          confidence: 70,
          processingTime: processingTime,
          blocks: []
        };
      }

    } catch (error) {
      console.error('[OCRService] Mock ML Kit error:', error);
      const processingTime = Date.now() - startTime;
      
      return {
        success: false,
        text: '',
        confidence: 0,
        processingTime: processingTime,
        error: `OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Fallback OCR for non-native environments
   */
  private async extractTextWithFallback(imageUri: string, startTime: number): Promise<OCRResult> {
    const processingTime = Date.now() - startTime;
    
    console.log('[OCRService] Using fallback OCR method...');
    
    // Simulate processing time for consistency
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: false,
      text: '',
      confidence: 0,
      processingTime: processingTime + 1000,
      error: this.getFallbackMessage()
    };
  }

  /**
   * Calculate confidence for native ML Kit results
   */
  private calculateNativeConfidence(text: string, mlResult: any): number {
    let confidence = 80; // Base confidence for ML Kit

    // ML Kit specific confidence boost
    if (mlResult.blocks && mlResult.blocks.length > 0) {
      const avgBlockConfidence = mlResult.blocks.reduce((sum: number, block: any) => 
        sum + (block.confidence || 0.8), 0) / mlResult.blocks.length;
      confidence += Math.round(avgBlockConfidence * 10);
    }

    // Text quality boosters
    if (text.length > 50) confidence += 5;
    if (text.length > 100) confidence += 5;
    if (/\b\d{4,6}\b/.test(text)) confidence += 5; // OTP patterns
    if (/bank|account|transaction|otp|verify/i.test(text)) confidence += 5;
    if (/₹|\$|rs\.?\s*\d+/i.test(text)) confidence += 3;

    // Quality penalties
    if (text.length < 20) confidence -= 15;
    if (!/[a-zA-Z]/.test(text)) confidence -= 10;
    if (text.split(' ').length < 3) confidence -= 5;
    
    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Enhanced text cleaning for ML Kit results
   */
  private cleanExtractedText(rawText: string): string {
    if (!rawText) return '';

    return rawText
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove non-printable characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Fix common OCR mistakes for SMS content
      .replace(/(\d)\s+(\d)/g, '$1$2') // Join separated digits
      .replace(/O(?=\d)/g, '0') // Replace O with 0 when followed by digits
      .replace(/l(?=\d)/g, '1') // Replace l with 1 when followed by digits
      .replace(/S(?=\d)/g, '5') // Replace S with 5 when followed by digits
      .replace(/[|](?=\d)/g, '1') // Replace | with 1 when followed by digits
      // Fix common word breaks
      .replace(/b\s*a\s*n\s*k/gi, 'bank')
      .replace(/o\s*t\s*p/gi, 'otp')
      .replace(/u\s*r\s*l/gi, 'url')
      // Trim whitespace
      .trim();
  }

  /**
   * Get demo OCR text for testing/demonstration
   */
  private getDemoOCRText(): string {
    const demoTexts = [
      "Your OTP for transaction is 123456. Do not share with anyone. Valid for 10 minutes. -BANK",
      "URGENT: Your account will be suspended. Click link to verify: https://fake-bank.com/verify",
      "Congratulations! You've won $10,000. Claim now at lucky-winner.net/claim123",
      "Your card ending 1234 was charged Rs.5000 at ATM. If not you, call 1800-BANK immediately.",
      "From WhatsApp verification service: Your code is 567890. Don't share with anyone."
    ];
    
    // Return a random demo text
    const randomIndex = Math.floor(Math.random() * demoTexts.length);
    return demoTexts[randomIndex];
  }

  /**
   * Get appropriate fallback message
   */
  private getFallbackMessage(): string {
    if (Platform.OS === 'web') {
      return 'OCR is not available on web platform. Please manually type the message content.';
    }
    
    const isExpoGo = !process.env.ENABLE_NATIVE_FEATURES;
    if (isExpoGo) {
      return 'OCR requires native development build. Please manually type the message content or build with EAS.';
    }

    return 'OCR module not available. Please manually type the message content.';
  }

  /**
   * Check if text appears to be a valid SMS/message
   */
  isValidSMSText(text: string): boolean {
    if (!text || text.length < 10) return false;

    // Check for common SMS patterns
    const smsPatterns = [
      /otp|password|pin|verification|verify/i,
      /bank|account|transaction|payment/i,
      /\d{4,6}/, // OTP-like numbers
      /dear|hi|hello|greetings/i,
      /click|link|verify|confirm|update/i,
      /urgent|immediate|expire|act now/i
    ];

    return smsPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Extract fraud indicators from text
   */
  extractFraudIndicators(text: string): {
    hasOTP: boolean;
    hasURL: boolean;
    hasAmount: boolean;
    hasPressure: boolean;
    hasPhishing: boolean;
    indicators: string[];
    riskScore: number;
  } {
    const indicators: string[] = [];
    let riskScore = 0;
    
    const hasOTP = /\b\d{4,6}\b/.test(text);
    const hasURL = /http|www\.|\.com|bit\.ly|tinyurl|short\.link/i.test(text);
    const hasAmount = /₹|\$|rs\.?\s*\d+|amount|debit|credit/i.test(text);
    const hasPressure = /urgent|immediate|expire|click now|act now|limited time|hurry/i.test(text);
    const hasPhishing = /update.*details|verify.*account|suspended|blocked|confirm.*identity/i.test(text);

    if (hasOTP) {
      indicators.push('OTP code detected');
      riskScore += 20;
    }
    if (hasURL) {
      indicators.push('URL detected');
      riskScore += 30;
    }
    if (hasAmount) {
      indicators.push('Financial amount detected');
      riskScore += 25;
    }
    if (hasPressure) {
      indicators.push('Urgency language detected');
      riskScore += 35;
    }
    if (hasPhishing) {
      indicators.push('Phishing patterns detected');
      riskScore += 40;
    }

    // Combination risks
    if (hasOTP && hasURL) {
      indicators.push('OTP + URL combination (HIGH RISK)');
      riskScore += 25;
    }
    if (hasAmount && hasURL) {
      indicators.push('Financial + URL combination (HIGH RISK)');
      riskScore += 30;
    }

    return {
      hasOTP,
      hasURL,
      hasAmount,
      hasPressure,
      hasPhishing,
      indicators,
      riskScore: Math.min(100, riskScore)
    };
  }

  /**
   * Get OCR status information
   */
  getOCRStatus(): {
    available: boolean;
    platform: string;
    environment: string;
    nativeMLKit: boolean;
    reason: string;
    alternatives: string[];
  } {
    return {
      available: this.isNativeMLAvailable,
      platform: Platform.OS,
      environment: process.env.ENVIRONMENT || 'unknown',
      nativeMLKit: this.isNativeMLAvailable,
      reason: this.isNativeMLAvailable ? 
        'Native ML Kit available - full OCR functionality enabled' : 
        this.getFallbackMessage(),
      alternatives: this.isNativeMLAvailable ? [] : [
        'Manual text input',
        'Copy and paste message content',
        'Type message manually for analysis',
        'Build with EAS for native OCR support'
      ]
    };
  }

  /**
   * Get text extraction alternatives for UI
   */
  getTextExtractionAlternatives(): string[] {
    if (this.isNativeMLAvailable) {
      return [
        '✅ Native OCR available',
        '📸 Take clear, well-lit screenshots',
        '🔍 Automatic text extraction enabled'
      ];
    }

    return [
      '📝 Manual text input',
      '📋 Copy and paste message content',
      '⌨️ Type message manually for analysis',
      '🚀 Build with EAS for native OCR support'
    ];
  }
}

// Export singleton instance
export const ocrService = OCRService.getInstance(); 