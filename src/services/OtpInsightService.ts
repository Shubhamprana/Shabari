import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { OtpFrequencyTracker, UserContextTracker } from '../lib/otp-insight-library/src/contextRules';
import { LocalStorageService } from '../lib/otp-insight-library/src/localStorage';
import { MLIntegrationService, ModelVerdict } from '../lib/otp-insight-library/src/mlIntegration';
import { NotificationBuilder } from '../lib/otp-insight-library/src/notificationBuilder';
import { OTPInsightService as CoreOTPService, OTPAnalysis } from '../lib/otp-insight-library/src/otpInsightService';
import { SenderVerificationResult, SenderVerificationService } from '../lib/otp-insight-library/src/senderVerification';
import { ProcessedSMS, processSmsForConsent } from '../lib/otp-insight-library/src/smsProcessing';
import { useSubscriptionStore } from '../stores/subscriptionStore';

export interface OtpInsightAnalysisResult {
  originalMessage: string;
  processedSms: ProcessedSMS;
  senderVerdict: SenderVerificationResult;
  otpAnalysis: OTPAnalysis;
  mlVerdict: ModelVerdict;
  contextSuspicious: boolean;
  frequencySuspicious: boolean;
  overallRiskLevel: 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CRITICAL';
  recommendedAction: string;
  details: string;
}

export interface OtpInsightServiceConfig {
  enableMLPrediction: boolean;
  enableContextRules: boolean;
  enableNotifications: boolean;
  enableLocalStorage: boolean;
  isPremiumUser: boolean;
}

class OtpInsightIntegrationService {
  private mlService: MLIntegrationService;
  private senderService: SenderVerificationService;
  private otpService: CoreOTPService;
  private userContextTracker: UserContextTracker;
  private otpFrequencyTracker: OtpFrequencyTracker;
  private notificationBuilder: NotificationBuilder;
  private localStorageService: LocalStorageService;
  private isMLModelLoaded: boolean = false;
  private config: OtpInsightServiceConfig;

  constructor(config: OtpInsightServiceConfig) {
    this.config = config;
    this.mlService = new MLIntegrationService();
    this.senderService = new SenderVerificationService();
    this.otpService = new CoreOTPService();
    this.userContextTracker = new UserContextTracker();
    this.otpFrequencyTracker = new OtpFrequencyTracker();
    this.notificationBuilder = new NotificationBuilder();
    this.localStorageService = new LocalStorageService();
  }

  /**
   * Get current subscription status
   */
  private getCurrentSubscriptionStatus(): boolean {
    return useSubscriptionStore.getState().isPremium;
  }

  /**
   * Initialize the OTP Insight Service
   */
  async initialize(): Promise<void> {
    try {
      console.log('[OTPInsight] Initializing OTP Insight Service...');
      console.log('[OTPInsight] Platform:', Platform.OS);
      
      // Update premium status
      this.config.isPremiumUser = this.getCurrentSubscriptionStatus();
      
      // Initialize local storage
      if (this.config.enableLocalStorage) {
        try {
          await this.localStorageService.initializePersistentStorage();
          console.log('[OTPInsight] Local storage initialized.');
        } catch (error) {
          console.warn('[OTPInsight] Local storage initialization failed:', error);
        }
      }

      // Load ML model (premium feature only)
      if (this.config.enableMLPrediction && this.config.isPremiumUser) {
        try {
          console.log('[OTPInsight] Loading ML model for premium user...');
          await this.mlService.loadModel();
          this.isMLModelLoaded = true;
          console.log('[OTPInsight] ML model loaded successfully.');
        } catch (error) {
          console.warn('[OTPInsight] ML model loading failed:', error);
          this.isMLModelLoaded = false;
        }
      } else if (this.config.enableMLPrediction && !this.config.isPremiumUser) {
        console.log('[OTPInsight] ML features disabled - Premium subscription required');
      }

      // Setup notifications
      if (this.config.enableNotifications) {
        try {
          await this.setupNotifications();
          console.log('[OTPInsight] Notifications setup completed.');
        } catch (error) {
          console.warn('[OTPInsight] Notification setup failed:', error);
        }
      }

      console.log('[OTPInsight] OTP Insight Service initialized successfully.');
      console.log('[OTPInsight] Premium features available:', this.config.isPremiumUser);
    } catch (error) {
      console.error('[OTPInsight] Failed to initialize OTP Insight Service:', error);
      // Don't throw error - allow service to work with reduced functionality
    }
  }

  /**
   * Update user interaction for context tracking
   */
  updateUserInteraction(): void {
    if (this.config.enableContextRules) {
      this.userContextTracker.updateLastInteraction();
    }
  }

  /**
   * Analyze a message for fraud detection
   */
  async analyzeMessage(
    messageText: string, 
    senderId: string = 'UNKNOWN_APP',
    sendNotifications: boolean = true
  ): Promise<OtpInsightAnalysisResult> {
    try {
      console.log('[OTPInsight] Analyzing message:', messageText.substring(0, 50) + '...');

      // 1. Process the message
      const processedSms = processSmsForConsent(messageText);

      // 2. Sender verification
      const senderVerdict = this.senderService.verifySender(senderId, processedSms.messageText);

      // 3. OTP analysis
      const otpAnalysis = this.otpService.analyzeOTP(processedSms.messageText);

      // 4. ML prediction (premium only)
      let mlVerdict: ModelVerdict = {
        isFraud: false,
        confidence: 0,
        details: this.getMLUnavailableReason()
      };

      if (this.config.enableMLPrediction && this.config.isPremiumUser && this.isMLModelLoaded) {
        try {
          mlVerdict = await this.mlService.predictWithModel(processedSms.messageText);
        } catch (error) {
          console.warn('[OTPInsight] ML prediction failed:', error);
          mlVerdict.details = 'ML analysis failed: ' + (error instanceof Error ? error.message : String(error));
        }
      }

      // 5. Context and frequency analysis
      let contextSuspicious = false;
      let frequencySuspicious = false;

      if (this.config.enableContextRules) {
        contextSuspicious = this.userContextTracker.isContextSuspicious(processedSms.timestamp);
        this.otpFrequencyTracker.recordOtpEvent();
        frequencySuspicious = this.otpFrequencyTracker.isPossibleAttack();
      }

      // 6. Calculate overall risk
      const overallRisk = this.calculateOverallRisk({
        senderVerdict,
        mlVerdict,
        contextSuspicious,
        frequencySuspicious,
        otpAnalysis
      });

      // 7. Store analysis data
      if (this.config.enableLocalStorage) {
        try {
          await this.localStorageService.saveOtpEvent(processedSms.timestamp);
        } catch (error) {
          console.warn('[OTPInsight] Failed to save analysis data:', error instanceof Error ? error.message : String(error));
        }
      }

      // 8. Send notifications
      if (sendNotifications && this.config.enableNotifications) {
        try {
          await this.sendNotification(overallRisk, otpAnalysis, messageText);
        } catch (error) {
          console.warn('[OTPInsight] Failed to send notification:', error instanceof Error ? error.message : String(error));
        }
      }

      return {
        originalMessage: messageText,
        processedSms,
        senderVerdict,
        otpAnalysis,
        mlVerdict,
        contextSuspicious,
        frequencySuspicious,
        overallRiskLevel: overallRisk.riskLevel,
        recommendedAction: overallRisk.action,
        details: overallRisk.details
      };

    } catch (error) {
      console.error('[OTPInsight] Error analyzing message:', error);
      
      // Return a safe fallback result
      return {
        originalMessage: messageText,
        processedSms: { messageText, timestamp: Date.now() },
        senderVerdict: { 
          riskLevel: 'SUSPICIOUS', 
          details: { 
            missingHeader: false, 
            badURL: false, 
            isTenDigitNumber: false, 
            unlistedAlphanumeric: false 
          } 
        },
        otpAnalysis: { otpCode: null, transactionType: null },
        mlVerdict: { isFraud: false, confidence: 0, details: 'Analysis failed: ' + (error instanceof Error ? error.message : String(error)) },
        contextSuspicious: false,
        frequencySuspicious: false,
        overallRiskLevel: 'SUSPICIOUS',
        recommendedAction: 'Manual review recommended due to analysis error',
        details: 'Error occurred during analysis: ' + (error instanceof Error ? error.message : String(error))
      };
    }
  }

  /**
   * Get the reason why ML is unavailable
   */
  private getMLUnavailableReason(): string {
    if (!this.config.isPremiumUser) {
      return 'Premium subscription required for AI-powered analysis';
    }
    if (!this.config.enableMLPrediction) {
      return 'ML prediction disabled in configuration';
    }
    if (!this.isMLModelLoaded) {
      return 'ML model not loaded or failed to load';
    }
    return 'ML analysis unavailable';
  }

  /**
   * Calculate overall risk based on all analysis results
   */
  private calculateOverallRisk(analysis: {
    senderVerdict: SenderVerificationResult;
    mlVerdict: ModelVerdict;
    contextSuspicious: boolean;
    frequencySuspicious: boolean;
    otpAnalysis: OTPAnalysis;
  }): { riskLevel: 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CRITICAL'; action: string; details: string } {
    const risks = [];

    // High-risk conditions
    if (analysis.senderVerdict.riskLevel === 'HIGH_RISK_FORGERY') {
      risks.push('Sender forgery detected');
    }
    if (analysis.mlVerdict.isFraud && analysis.mlVerdict.confidence > 0.8) {
      risks.push('High ML fraud confidence');
    }
    if (analysis.frequencySuspicious) {
      risks.push('Suspicious OTP frequency');
    }

    // Medium-risk conditions
    if (analysis.senderVerdict.riskLevel === 'SUSPICIOUS') {
      risks.push('Suspicious sender');
    }
    if (analysis.mlVerdict.isFraud && analysis.mlVerdict.confidence > 0.5) {
      risks.push('ML fraud detection');
    }
    if (analysis.contextSuspicious) {
      risks.push('Suspicious user context');
    }

    // Payment-based risks
    if (analysis.otpAnalysis.transactionType === 'PAYMENT_OUT') {
      risks.push('Payment-related message');
    }

    // Determine overall risk level
    let riskLevel: 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CRITICAL';
    let action: string;
    let details: string;

    if (risks.length === 0) {
      riskLevel = 'SAFE';
      action = 'Message appears safe to proceed';
      details = 'No fraud indicators detected. Sender verification and pattern analysis passed.';
    } else if (risks.some(r => r.includes('forgery') || r.includes('High ML fraud'))) {
      riskLevel = 'CRITICAL';
      action = 'BLOCK IMMEDIATELY - Do not follow any instructions in this message';
      details = `Critical fraud indicators: ${risks.join(', ')}`;
    } else if (risks.length >= 2 || risks.some(r => r.includes('ML fraud') || r.includes('Suspicious OTP frequency'))) {
      riskLevel = 'HIGH_RISK';
      action = 'VERIFY CAREFULLY - Contact your bank/service directly';
      details = `Multiple risk factors detected: ${risks.join(', ')}`;
    } else {
      riskLevel = 'SUSPICIOUS';
      action = 'Exercise caution - Verify sender independently';
      details = `Potential concerns: ${risks.join(', ')}`;
    }

    return { riskLevel, action, details };
  }

  /**
   * Setup notification permissions and handlers
   */
  private async setupNotifications(): Promise<void> {
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('[OTPInsight] Notification permissions denied');
        return;
      }

      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      console.log('[OTPInsight] Notifications setup completed');
    } catch (error) {
      console.error('[OTPInsight] Failed to setup notifications:', error);
    }
  }

  /**
   * Send fraud detection notification
   */
  private async sendNotification(
    risk: { riskLevel: 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' | 'CRITICAL'; action: string; details: string },
    otpAnalysis: OTPAnalysis,
    messageText: string
  ): Promise<void> {
    try {
      if (risk.riskLevel === 'SAFE') {
        return; // No notification for safe messages
      }

      const riskEmojis = {
        'SUSPICIOUS': '⚠️',
        'HIGH_RISK': '🚨',
        'CRITICAL': '🆘'
      };

      const emoji = riskEmojis[risk.riskLevel] || '⚠️';
      const title = `${emoji} Fraud Alert - ${risk.riskLevel}`;
      
      let body = risk.action;
      if (otpAnalysis.otpCode) {
        body += `\nOTP detected: ${otpAnalysis.otpCode}`;
      }
      if (otpAnalysis.amount) {
        body += `\nAmount: ₹${otpAnalysis.amount}`;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            messageText: messageText.substring(0, 100),
            riskLevel: risk.riskLevel,
            analysis: otpAnalysis
          },
        },
        trigger: null, // Show immediately
      });

      console.log('[OTPInsight] Fraud notification sent');
    } catch (error) {
      console.error('[OTPInsight] Failed to send notification:', error);
    }
  }

  /**
   * Get fraud detection statistics
   */
  async getStatistics(): Promise<{
    totalAnalyzed: number;
    fraudDetected: number;
    safeMassages: number;
    suspiciousMessages: number;
  }> {
    try {
      if (this.config.enableLocalStorage) {
        const startTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // Last 30 days
        const events = await this.localStorageService.getOtpEvents(startTime);
        const total = events.length;
        return {
          totalAnalyzed: total,
          fraudDetected: Math.floor(total * 0.02), // Mock data
          safeMassages: Math.floor(total * 0.85),
          suspiciousMessages: Math.floor(total * 0.13),
        };
      }
      return {
        totalAnalyzed: 0,
        fraudDetected: 0,
        safeMassages: 0,
        suspiciousMessages: 0,
      };
    } catch (error) {
      console.error('[OTPInsight] Failed to get statistics:', error);
      return {
        totalAnalyzed: 0,
        fraudDetected: 0,
        safeMassages: 0,
        suspiciousMessages: 0,
      };
    }
  }

  /**
   * Clear all stored data
   */
  async clearData(): Promise<void> {
    try {
      if (this.config.enableLocalStorage) {
        // Clear OTP events older than current time (effectively all)
        await this.localStorageService.deleteOldOtpEvents(Date.now());
        
        // Clear user context data by removing known keys
        const contextKeys = ['lastInteraction', 'userPreferences', 'analysisHistory'];
        for (const key of contextKeys) {
          try {
            await this.localStorageService.removeItem(key);
          } catch (error) {
            console.warn(`[OTPInsight] Failed to remove ${key}:`, error);
          }
        }
      }
      this.otpFrequencyTracker = new OtpFrequencyTracker();
      this.userContextTracker = new UserContextTracker();
      console.log('[OTPInsight] Data cleared successfully');
    } catch (error) {
      console.error('[OTPInsight] Failed to clear data:', error);
    }
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<OtpInsightServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[OTPInsight] Configuration updated:', this.config);
  }

  /**
   * Check if premium features are available
   */
  isPremiumFeaturesAvailable(): boolean {
    return this.getCurrentSubscriptionStatus() && this.isMLModelLoaded;
  }

  /**
   * Get service status
   */
  getServiceStatus(): {
    isInitialized: boolean;
    mlModelLoaded: boolean;
    platform: string;
    isPremiumUser: boolean;
    features: {
      basicAnalysis: boolean;
      senderVerification: boolean;
      otpDetection: boolean;
      contextRules: boolean;
      mlPrediction: boolean;
      notifications: boolean;
      localStorage: boolean;
    };
  } {
    const isPremium = this.getCurrentSubscriptionStatus();
    return {
      isInitialized: true,
      mlModelLoaded: this.isMLModelLoaded,
      platform: Platform.OS,
      isPremiumUser: isPremium,
      features: {
        basicAnalysis: true, // Always available
        senderVerification: true, // Always available
        otpDetection: true, // Always available
        contextRules: isPremium ? this.config.enableContextRules : false,
        mlPrediction: isPremium && this.isPremiumFeaturesAvailable(),
        notifications: this.config.enableNotifications,
        localStorage: isPremium ? this.config.enableLocalStorage : false,
      }
    };
  }

  /**
   * Update service configuration when subscription changes
   */
  updateSubscriptionStatus(): void {
    const wasPremium = this.config.isPremiumUser;
    const isPremium = this.getCurrentSubscriptionStatus();
    
    this.config.isPremiumUser = isPremium;
    
    if (!wasPremium && isPremium) {
      // User upgraded to premium - initialize premium features
      console.log('[OTPInsight] User upgraded to premium - enabling advanced features');
      this.initializePremiumFeatures();
    } else if (wasPremium && !isPremium) {
      // User downgraded from premium - disable premium features
      console.log('[OTPInsight] User downgraded from premium - disabling advanced features');
      this.disablePremiumFeatures();
    }
  }

  /**
   * Initialize premium features when user upgrades
   */
  private async initializePremiumFeatures(): Promise<void> {
    try {
      // Load ML model
      if (this.config.enableMLPrediction) {
        console.log('[OTPInsight] Loading ML model for new premium user...');
        await this.mlService.loadModel();
        this.isMLModelLoaded = true;
      }
      
      // Enable context rules
      this.config.enableContextRules = true;
      
      // Enable local storage
      if (this.config.enableLocalStorage) {
        await this.localStorageService.initializePersistentStorage();
      }
      
      console.log('[OTPInsight] Premium features initialized successfully');
    } catch (error) {
      console.error('[OTPInsight] Failed to initialize premium features:', error);
    }
  }

  /**
   * Disable premium features when user downgrades
   */
  private disablePremiumFeatures(): void {
    // Unload ML model
    this.isMLModelLoaded = false;
    
    // Disable context rules
    this.config.enableContextRules = false;
    
    console.log('[OTPInsight] Premium features disabled');
  }
}

// Create and export the service instance
export const otpInsightService = new OtpInsightIntegrationService({
  enableMLPrediction: true,
  enableContextRules: true,
  enableNotifications: true,
  enableLocalStorage: true,
  isPremiumUser: false, // Will be updated from subscription store
});

// Set up subscription listener to update service when subscription changes
if (typeof window !== 'undefined') {
  const subscriptionStore = useSubscriptionStore;
  subscriptionStore.subscribe((state, prevState) => {
    if (state.isPremium !== prevState.isPremium) {
      console.log('[OTPInsight] Subscription status changed:', state.isPremium ? 'Premium' : 'Free');
      otpInsightService.updateSubscriptionStatus();
    }
  });
}

export default otpInsightService; 