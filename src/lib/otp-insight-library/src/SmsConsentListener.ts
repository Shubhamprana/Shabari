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
 * SMS Consent Listener Service
 * 
 * Handles the complete SMS consent flow:
 * 1. Listens for OTP-like SMS messages using Google SMS User Consent API
 * 2. Triggers OS consent prompt per message
 * 3. Analyzes consented messages for fraud detection
 * 4. Sends appropriate notifications based on risk level
 * 
 * Privacy-first: Only processes messages that user explicitly allows
 */
export class SmsConsentListenerService {
  private config: SmsConsentListenerConfig;
  private isInitialized: boolean = false;
  private isListening: boolean = false;

  // Services
  private otpService: OTPInsightService;
  private senderService: SenderVerificationService;
  private mlService: MLIntegrationService;
  private notificationService: NotificationBuilder;
  private contextTracker: UserContextTracker;
  private frequencyTracker: OtpFrequencyTracker;

  constructor(config: SmsConsentListenerConfig = {}) {
    this.config = config;
    
    // Initialize services
    this.otpService = new OTPInsightService();
    this.senderService = new SenderVerificationService();
    this.mlService = new MLIntegrationService();
    this.notificationService = new NotificationBuilder();
    this.contextTracker = new UserContextTracker();
    this.frequencyTracker = new OtpFrequencyTracker();

    this.log('SMS Consent Listener Service initialized');
  }

  /**
   * Initialize the service and optionally start listening
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      this.log('Service already initialized');
      return true;
    }

    try {
      // Load ML model
      await this.mlService.loadModel();
      
      this.isInitialized = true;
      this.log('Service initialization complete');

      // Auto-start if configured
      if (this.config.autoStart) {
        return await this.startListening();
      }

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
   * Start listening for SMS messages
   */
  public async startListening(): Promise<boolean> {
    if (!this.isInitialized) {
      const error = 'Service not initialized. Call initialize() first.';
      this.log(error, 'error');
      if (this.config.onError) {
        this.config.onError(error);
      }
      return false;
    }

    if (this.isListening) {
      this.log('Already listening for SMS messages');
      return true;
    }

    this.log('Starting SMS consent listening...');
    this.isListening = true;

    // Note: This would integrate with useSmsConsent hook in a React component
    // For service-based usage, this sets up the framework for SMS processing
    return true;
  }

  /**
   * Stop listening for SMS messages
   */
  public stopListening(): void {
    if (!this.isListening) {
      this.log('Not currently listening');
      return;
    }

    this.log('Stopping SMS consent listening');
    this.isListening = false;
  }

  /**
   * Process a consented SMS message through complete analysis pipeline
   */
  public async processConsentedMessage(consentResult: SmsConsentResult): Promise<OtpAnalysisResult | null> {
    if (!consentResult.success || !consentResult.message) {
      this.log('Invalid consent result', 'error');
      return null;
    }

    const { message, senderId } = consentResult;
    this.log(`Processing consented message: "${message.substring(0, 50)}..."`);

    try {
      // Record OTP event for frequency tracking
      this.frequencyTracker.recordOtpEvent();
      
      // 1. Sender Verification ("Who" check)
      const senderVerification = this.senderService.verifySender(senderId || 'UNKNOWN', message);
      this.log('Sender verification complete', 'debug');

      // 2. OTP Analysis ("What" check)
      const otpAnalysis = this.otpService.analyzeOTP(message);
      this.log('OTP analysis complete', 'debug');

      // 3. ML Fraud Detection
      const mlAnalysis = await this.mlService.predictWithModel(message);
      this.log('ML analysis complete', 'debug');

      // 4. Context & Frequency Rules
      const contextSuspicious = this.contextTracker.isContextSuspicious(Date.now());
      const possibleAttack = this.frequencyTracker.isPossibleAttack();
      
      const contextFlags = {
        contextSuspicious,
        possibleAttack,
      };

      // 5. Determine overall risk level
      const riskLevel = this.determineOverallRiskLevel(
        senderVerification,
        otpAnalysis,
        mlAnalysis,
        contextFlags
      );

      // 6. Send appropriate notification
      await this.sendRiskBasedNotification(
        riskLevel,
        message,
        senderVerification,
        otpAnalysis,
        contextFlags
      );

      // 7. Create analysis result
      const analysisResult: OtpAnalysisResult = {
        message,
        senderId,
        senderVerification,
        otpAnalysis,
        mlAnalysis,
        contextFlags,
        riskLevel,
      };

      // 8. Notify callback
      if (this.config.onOtpReceived) {
        this.config.onOtpReceived(analysisResult);
      }

      this.log(`Analysis complete: Risk Level = ${riskLevel}`);
      return analysisResult;

    } catch (error: any) {
      const errorMessage = `Failed to analyze OTP: ${error.message}`;
      this.log(errorMessage, 'error');
      
      if (this.config.onError) {
        this.config.onError(errorMessage);
      }
      
      return null;
    }
  }

  /**
   * Determine overall risk level based on all analysis results
   */
  private determineOverallRiskLevel(
    senderVerification: any,
    otpAnalysis: any,
    mlAnalysis: any,
    contextFlags: any
  ): 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CRITICAL' {
    // Sender forgery is always critical
    if (senderVerification.riskLevel === 'HIGH_RISK_FORGERY') {
      return 'CRITICAL';
    }

    // ML detected high confidence fraud
    if (mlAnalysis.isFraud && mlAnalysis.confidence > 0.8) {
      return 'CRITICAL';
    }

    // Multiple concerning factors
    const concerningFactors = [
      senderVerification.riskLevel === 'SUSPICIOUS',
      mlAnalysis.isFraud,
      contextFlags.contextSuspicious,
      contextFlags.possibleAttack,
      otpAnalysis.transactionType === 'PAYMENT_OUT' && otpAnalysis.amount && parseFloat(otpAnalysis.amount) > 10000
    ].filter(Boolean).length;

    if (concerningFactors >= 3) {
      return 'CRITICAL';
    } else if (concerningFactors >= 2) {
      return 'HIGH_RISK';
    } else if (concerningFactors >= 1) {
      return 'SUSPICIOUS';
    } else {
      return 'SAFE';
    }
  }

  /**
   * Send risk-based notifications
   */
  private async sendRiskBasedNotification(
    riskLevel: string,
    message: string,
    senderVerification: any,
    otpAnalysis: any,
    contextFlags: any
  ): Promise<void> {
    switch (riskLevel) {
      case 'CRITICAL':
        if (senderVerification.riskLevel === 'HIGH_RISK_FORGERY') {
          this.notificationService.sendWarningNotification(message);
        } else {
          this.notificationService.sendSuspiciousNotification(
            message, 
            'Multiple fraud indicators detected'
          );
        }
        break;

      case 'HIGH_RISK':
        if (otpAnalysis.transactionType === 'PAYMENT_OUT' && otpAnalysis.amount) {
          this.notificationService.sendPaymentAlert(otpAnalysis.amount, message);
        } else {
          this.notificationService.sendSuspiciousNotification(
            message, 
            'High-risk transaction detected'
          );
        }
        break;

      case 'SUSPICIOUS':
        if (contextFlags.contextSuspicious || contextFlags.possibleAttack) {
          this.notificationService.sendSuspiciousNotification(
            message, 
            'No recent action on your device'
          );
        } else {
          this.notificationService.sendSuspiciousNotification(
            message, 
            'Suspicious patterns detected'
          );
        }
        break;

      case 'SAFE':
      default:
        this.notificationService.sendStandardNotification(message);
        break;
    }
  }

  /**
   * Update user interaction timestamp
   */
  public updateUserInteraction(): void {
    this.contextTracker.updateLastInteraction();
  }

  /**
   * Get service status
   */
  public getStatus(): {
    isInitialized: boolean;
    isListening: boolean;
    mlModelLoaded: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      isListening: this.isListening,
      mlModelLoaded: this.mlService.getModelInfo().isLoaded,
    };
  }

  /**
   * Internal logging
   */
  private log(message: string, level: 'info' | 'error' | 'debug' = 'info'): void {
    const prefix = '[SmsConsentListener]';
    
    if (this.config.enableDebugLogging || level !== 'debug') {
      switch (level) {
        case 'error':
          console.error(`${prefix} ${message}`);
          break;
        case 'debug':
          console.log(`${prefix} [DEBUG] ${message}`);
          break;
        default:
          console.log(`${prefix} ${message}`);
          break;
      }
    }
  }
} 