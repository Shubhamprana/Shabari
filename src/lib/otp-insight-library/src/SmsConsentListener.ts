/**
 * SMS Consent Listener Service - DISABLED FOR PLAY STORE COMPLIANCE
 * 
 * This service has been disabled to comply with Google Play Store policies.
 * Automatic SMS monitoring and processing is not allowed.
 * 
 * REMOVED FEATURES (for Play Store compliance):
 * - Automatic SMS listening/monitoring
 * - Background SMS processing
 * - Automatic consent handling
 * - RECEIVE_SMS permission usage
 * 
 * USE INSTEAD:
 * - Manual SMS scanning via SMSReaderService
 * - User-initiated SMS analysis only
 * - Privacy-first manual approach
 */

import { OtpFrequencyTracker, UserContextTracker } from './contextRules';
import { MLIntegrationService } from './mlIntegration';
import { NotificationBuilder } from './notificationBuilder';
import { OTPInsightService } from './otpInsightService';
import { SenderVerificationService } from './senderVerification';
import { SmsConsentResult } from './useSmsConsent';

export interface OtpAnalysisResult {
  message: string;
  senderId: string | null;
  senderVerification: any;
  otpAnalysis: any;
  mlAnalysis: any;
  contextFlags: {
    contextSuspicious: boolean;
    possibleAttack: boolean;
  };
  riskLevel: 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CRITICAL';
}

export interface SmsConsentListenerConfig {
  onOtpReceived?: (analysis: OtpAnalysisResult) => void;
  onError?: (error: string) => void;
  autoStart?: boolean;
  enableDebugLogging?: boolean;
}

/**
 * SMS Consent Listener Service - DISABLED FOR PLAY STORE COMPLIANCE
 * 
 * This service is now disabled to comply with Google Play Store policies.
 * All automatic SMS monitoring has been removed.
 * 
 * For SMS fraud detection, use the manual SMS scanning features instead.
 */
export class SmsConsentListenerService {
  private config: SmsConsentListenerConfig;
  private isInitialized: boolean = false;
  private isListening: boolean = false;
  private isDisabledForCompliance: boolean = true;

  // Services (kept for compatibility but not used for automatic monitoring)
  private otpService: OTPInsightService;
  private senderService: SenderVerificationService;
  private mlService: MLIntegrationService;
  private notificationService: NotificationBuilder;
  private contextTracker: UserContextTracker;
  private frequencyTracker: OtpFrequencyTracker;

  constructor(config: SmsConsentListenerConfig = {}) {
    this.config = config;
    
    // Initialize services for manual use only
    this.otpService = new OTPInsightService();
    this.senderService = new SenderVerificationService();
    this.mlService = new MLIntegrationService();
    this.notificationService = new NotificationBuilder();
    this.contextTracker = new UserContextTracker();
    this.frequencyTracker = new OtpFrequencyTracker();

    this.log('SMS Consent Listener Service initialized (DISABLED for Play Store compliance)');
  }

  /**
   * Initialize the service - DISABLED FOR COMPLIANCE
   */
  public async initialize(): Promise<boolean> {
    if (this.isDisabledForCompliance) {
      const error = 'SMS Consent Listener Service is disabled for Play Store compliance. Use manual SMS scanning instead.';
      this.log(error, 'error');
      if (this.config.onError) {
        this.config.onError(error);
      }
      return false;
    }

    // Legacy code kept for compatibility
    if (this.isInitialized) {
      this.log('Service already initialized');
      return true;
    }

    try {
      // Load ML model for manual use
      await this.mlService.loadModel();
      
      this.isInitialized = true;
      this.log('Service initialization complete (manual mode only)');

      return true;
    } catch (error: any) {
      const errorMessage = `Failed to initialize SMS consent listener: ${error.message}`;
      this.log(errorMessage, 'error');
      
      if (this.config.onError) {
        this.config.onError(errorMessage);
      }
      
      return false;
    }
  }

  /**
   * Start listening - DISABLED FOR COMPLIANCE
   */
  public async startListening(): Promise<boolean> {
    const error = 'Automatic SMS listening is disabled for Play Store compliance. Use manual SMS scanning instead.';
    this.log(error, 'error');
    
    if (this.config.onError) {
      this.config.onError(error);
    }
    
    return false;
  }

  /**
   * Stop listening - No-op since no automatic listening
   */
  public stopListening(): void {
    this.log('No automatic listening to stop (compliance mode)');
    this.isListening = false;
  }

  /**
   * Process a message manually (for compatibility)
   * This can be used for manual SMS analysis only
   */
  public async processConsentedMessage(consentResult: SmsConsentResult): Promise<OtpAnalysisResult | null> {
    if (!consentResult.success || !consentResult.message) {
      this.log('Invalid consent result', 'error');
      return null;
    }

    const { message, senderId } = consentResult;
    this.log(`Processing message manually: "${message.substring(0, 50)}..."`);

    try {
      // This can be used for manual analysis only
      const senderVerification = this.senderService.verifySender(senderId || 'UNKNOWN', message);
      const otpAnalysis = this.otpService.analyzeOTP(message);
      const mlAnalysis = await this.mlService.predictWithModel(message);
      
      const contextFlags = {
        contextSuspicious: false,
        possibleAttack: false,
      };

      const riskLevel = this.determineOverallRiskLevel(
        senderVerification,
        otpAnalysis,
        mlAnalysis,
        contextFlags
      );

      const analysisResult: OtpAnalysisResult = {
        message,
        senderId,
        senderVerification,
        otpAnalysis,
        mlAnalysis,
        contextFlags,
        riskLevel,
      };

      this.log('Manual message analysis complete');
      return analysisResult;

    } catch (error: any) {
      this.log(`Error processing message: ${error.message}`, 'error');
      return null;
    }
  }

  /**
   * Determine overall risk level
   */
  private determineOverallRiskLevel(
    senderVerification: any,
    otpAnalysis: any,
    mlAnalysis: any,
    contextFlags: any
  ): 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CRITICAL' {
    // Simplified risk assessment for manual use
    if (mlAnalysis?.isFraud) {
      return 'HIGH_RISK';
    }
    
    if (otpAnalysis?.suspiciousPatterns?.length > 0) {
      return 'SUSPICIOUS';
    }
    
    return 'SAFE';
  }

  /**
   * Get service status
   */
  public getStatus(): {
    isInitialized: boolean;
    isListening: boolean;
    mlModelLoaded: boolean;
    isDisabledForCompliance: boolean;
    complianceNote: string;
  } {
    return {
      isInitialized: this.isInitialized,
      isListening: this.isListening,
      mlModelLoaded: true,
      isDisabledForCompliance: this.isDisabledForCompliance,
      complianceNote: 'Automatic SMS monitoring disabled for Play Store compliance'
    };
  }

  /**
   * Log messages
   */
  private log(message: string, level: 'info' | 'error' | 'debug' = 'info'): void {
    const prefix = '[SmsConsentListener]';
    
    if (this.config.enableDebugLogging || level === 'error') {
      switch (level) {
        case 'error':
          console.error(`${prefix} ${message}`);
          break;
        case 'debug':
          console.debug(`${prefix} ${message}`);
          break;
        default:
          console.log(`${prefix} ${message}`);
      }
    }
  }
} 