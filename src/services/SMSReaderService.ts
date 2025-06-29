/**
 * SMS Reader Service
 * Provides direct access to SMS messages for manual fraud detection
 * User-controlled SMS scanning without automatic monitoring
 */

import { Alert, Linking, PermissionsAndroid, Platform } from 'react-native';
import { otpInsightService } from './OtpInsightService';

export interface SMSMessage {
  id: string;
  address: string; // Phone number
  body: string;    // Message content
  date: number;    // Timestamp
  type: number;    // 1 = inbox, 2 = sent
  read: number;    // 0 = unread, 1 = read
  thread_id: string;
  person?: string;
  date_sent?: number;
  protocol?: number;
  service_center?: string;
  subject?: string;
}

export interface SMSFilter {
  messageType?: 'inbox' | 'sent' | 'all';
  limit?: number;
  timeRange?: {
    start: Date;
    end: Date;
  };
  containsKeywords?: string[];
  suspiciousOnly?: boolean;
}

export interface SMSAnalysisResult {
  messageId: string;
  isSuspicious: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  threats: string[];
  details: string;
  confidence: number;
  timestamp: Date;
}

export class SMSReaderService {
  private static instance: SMSReaderService;
  private hasPermissions: boolean = false;
  private isInitialized: boolean = false;
  private permissionRequestInProgress: boolean = false;

  private constructor() {}

  static getInstance(): SMSReaderService {
    if (!SMSReaderService.instance) {
      SMSReaderService.instance = new SMSReaderService();
    }
    return SMSReaderService.instance;
  }

  /**
   * Initialize SMS Reader Service with comprehensive permission handling
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('📱 Initializing SMS Reader Service...');
      
      if (Platform.OS !== 'android') {
        console.warn('📱 SMS reading only supported on Android');
        return false;
      }

      // Check current permission status first
      const currentPermissionStatus = await this.checkCurrentSMSPermissions();
      console.log('📱 Current SMS permission status:', currentPermissionStatus);

      if (currentPermissionStatus.granted) {
        this.hasPermissions = true;
        this.isInitialized = true;
        console.log('✅ SMS Reader Service initialized - permissions already granted');
        return true;
      }

      // Request permissions with proper user context
      const hasPermission = await this.requestSMSPermissionsWithContext();
      if (!hasPermission) {
        console.warn('📱 SMS permissions not granted');
        return false;
      }

      this.hasPermissions = true;
      this.isInitialized = true;
      
      console.log('✅ SMS Reader Service initialized successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize SMS Reader Service:', error);
      return false;
    }
  }

  /**
   * Check current SMS permission status without requesting
   */
  private async checkCurrentSMSPermissions(): Promise<{
    granted: boolean;
    canRequest: boolean;
    shouldShowRationale: boolean;
  }> {
    try {
      if (Platform.OS !== 'android') {
        return { granted: false, canRequest: false, shouldShowRationale: false };
      }

      // Check if permission is already granted
      const readSmsGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_SMS
      );

      if (readSmsGranted) {
        return { granted: true, canRequest: false, shouldShowRationale: false };
      }

      // Check if we should show rationale (available on Android)
      let shouldShowRationale = false;
      try {
        if (Platform.Version >= 23) { // Android 6.0+
          shouldShowRationale = await (PermissionsAndroid as any).shouldShowRequestPermissionRationale(
            PermissionsAndroid.PERMISSIONS.READ_SMS
          );
        }
      } catch (error) {
        console.log('shouldShowRequestPermissionRationale not available on this version');
      }

      return { 
        granted: false, 
        canRequest: true, 
        shouldShowRationale: shouldShowRationale 
      };
      
    } catch (error) {
      console.error('❌ Error checking SMS permissions:', error);
      return { granted: false, canRequest: false, shouldShowRationale: false };
    }
  }

  /**
   * Request SMS permissions with user-friendly context and rationale
   */
  private async requestSMSPermissionsWithContext(): Promise<boolean> {
    try {
      if (this.permissionRequestInProgress) {
        console.log('📱 Permission request already in progress');
        return false;
      }

      this.permissionRequestInProgress = true;

      const permissionStatus = await this.checkCurrentSMSPermissions();
      
      // If permission was denied before, show rationale first
      if (permissionStatus.shouldShowRationale) {
        const shouldContinue = await this.showPermissionRationale();
        if (!shouldContinue) {
          this.permissionRequestInProgress = false;
          return false;
        }
      }

      console.log('📱 Requesting SMS permissions...');

      // Request the permission
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: '📱 SMS Security Scanner Permission',
          message: 'Shabari needs to read SMS messages to scan them for fraud and security threats.\n\n🔒 Your privacy is protected:\n• Only used when YOU manually scan\n• Messages are analyzed locally\n• No data is sent to external servers\n• You control what gets scanned',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Deny',
          buttonPositive: 'Allow SMS Access',
        }
      );

      this.permissionRequestInProgress = false;
      
      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      
      if (isGranted) {
        console.log('✅ SMS permission granted successfully');
        return true;
      } else {
        console.log('❌ SMS permission denied:', granted);
        
        // Handle different denial scenarios
        if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          await this.handlePermissionPermanentlyDenied();
        } else {
          await this.handlePermissionDenied();
        }
        
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error requesting SMS permissions:', error);
      this.permissionRequestInProgress = false;
      return false;
    }
  }

  /**
   * Show permission rationale dialog
   */
  private async showPermissionRationale(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        '🔐 SMS Permission Required',
        'Shabari requests SMS access for fraud protection only:\n\n✅ How we protect you:\n• Manual scanning only (YOU choose what to scan)\n• Detect phishing links and scam patterns\n• Identify suspicious phone numbers\n• Alert you to potential OTP fraud\n\n🔒 Your Privacy is Protected:\n• No automatic reading of messages\n• All analysis happens on YOUR device only\n• No messages sent to external servers\n• No message content stored or transmitted\n• You have full control over this feature\n\n📱 How it works:\n1. You manually select messages to scan\n2. Shabari analyzes them locally on your device\n3. You get instant fraud detection results\n4. No data leaves your phone\n\nThis permission is required by Android for any app that reads SMS content, even manually.',
        [
          {
            text: 'Learn More',
            onPress: () => {
              Alert.alert(
                'SMS Permission Details',
                'Google Play requires clear explanation of SMS permissions:\n\n• This permission allows reading SMS content\n• We only read messages you manually select\n• Used exclusively for fraud detection\n• No automatic monitoring or data collection\n• Complies with Google Play SMS policy requirements\n\nYou can revoke this permission anytime in Android Settings.',
                [
                  { text: 'Deny Permission', style: 'cancel', onPress: () => resolve(false) },
                  { text: 'Grant Permission', onPress: () => resolve(true) }
                ]
              );
            }
          },
          {
            text: 'Deny',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: 'Grant Permission',
            onPress: () => resolve(true)
          }
        ]
      );
    });
  }

  /**
   * Handle permission denied scenario
   */
  private async handlePermissionDenied(): Promise<void> {
    Alert.alert(
      '⚠️ SMS Permission Denied',
      'SMS fraud scanning is disabled. You can still use other security features.\n\nTo enable SMS scanning later, go to:\nSettings → Apps → Shabari → Permissions → SMS',
      [{ text: 'OK' }]
    );
  }

  /**
   * Handle permission permanently denied scenario
   */
  private async handlePermissionPermanentlyDenied(): Promise<void> {
    return new Promise((resolve) => {
      Alert.alert(
        '🔧 Manual Permission Required',
        'SMS permission was permanently denied. To enable SMS fraud scanning:\n\n1. Tap "Open Settings" below\n2. Find "Permissions" or "App permissions"\n3. Enable "SMS" permission\n4. Return to Shabari\n\nThis allows Shabari to scan your messages for fraud protection.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve()
          },
          {
            text: 'Open Settings',
            onPress: async () => {
              try {
                await Linking.openSettings();
              } catch (error) {
                console.error('❌ Failed to open settings:', error);
              }
              resolve();
            }
          }
        ]
      );
    });
  }

  /**
   * Get SMS messages from device with improved error handling
   */
  async getSMSMessages(filter?: SMSFilter): Promise<SMSMessage[]> {
    if (!this.hasPermissions) {
      throw new Error('SMS permissions not granted. Please initialize the service first.');
    }

    try {
      console.log('📱 Reading SMS messages from device...');
      
      // Check permission status again before reading
      const permissionCheck = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_SMS
      );
      
      if (!permissionCheck) {
        throw new Error('SMS permission was revoked. Please re-grant permission.');
      }
      
      // Use react-native-sms-retriever for actual SMS reading
      let SmsRetriever: any = null;
      try {
        SmsRetriever = require('react-native-sms-retriever');
      } catch (error) {
        console.error('❌ SMS Retriever module not available:', error);
        throw new Error('SMS reading module not available. Please ensure react-native-sms-retriever is properly installed.');
      }
      
      // Get SMS messages from device
      const smsMessages = await SmsRetriever.getMessages(filter?.limit || 50);
      console.log(`📊 Found ${smsMessages.length} SMS messages`);
      
      // Convert to our SMS message format
      const formattedMessages: SMSMessage[] = smsMessages.map((sms: any) => ({
        id: sms._id || String(Date.now() + Math.random()),
        address: sms.address || 'Unknown',
        body: sms.body || '',
        date: sms.date || Date.now(),
        type: sms.type || 1, // Default to inbox
        read: sms.read || 0,
        thread_id: sms.thread_id || '0',
        person: sms.person,
        date_sent: sms.date_sent,
        protocol: sms.protocol,
        service_center: sms.service_center,
        subject: sms.subject
      }));

      // Apply filters
      let filteredMessages = formattedMessages;
      
      if (filter) {
        // Filter by message type
        if (filter.messageType && filter.messageType !== 'all') {
          const typeValue = filter.messageType === 'inbox' ? 1 : 2;
          filteredMessages = filteredMessages.filter(msg => msg.type === typeValue);
        }

        // Filter by time range
        if (filter.timeRange) {
          const startTime = filter.timeRange.start.getTime();
          const endTime = filter.timeRange.end.getTime();
          filteredMessages = filteredMessages.filter(msg => 
            msg.date >= startTime && msg.date <= endTime
          );
        }
        
        // Filter by keywords
        if (filter.containsKeywords && filter.containsKeywords.length > 0) {
          filteredMessages = filteredMessages.filter(msg =>
            filter.containsKeywords!.some(keyword =>
              msg.body.toLowerCase().includes(keyword.toLowerCase()) ||
              msg.address.toLowerCase().includes(keyword.toLowerCase())
            )
          );
        }
        
        // Filter for suspicious messages only
        if (filter.suspiciousOnly) {
          filteredMessages = filteredMessages.filter(msg => {
            const body = msg.body.toLowerCase();
            const suspiciousPatterns = [
              'urgent', 'verify', 'click', 'expire', 'suspend',
              'lottery', 'prize', 'congratulations', 'winner',
              'bank', 'account', 'security', 'alert', 'blocked',
              'confirm', 'immediate', 'action', 'required'
            ];
            return suspiciousPatterns.some(pattern => body.includes(pattern));
          });
        }
      }

      console.log(`📊 Returning ${filteredMessages.length} filtered messages`);
      return filteredMessages;
      
    } catch (error) {
      console.error('❌ Error reading SMS messages:', error);
      throw error;
    }
  }

  /**
   * Analyze a specific SMS message for fraud
   */
  async analyzeSMSMessage(message: SMSMessage): Promise<SMSAnalysisResult> {
    try {
      console.log('🔍 Analyzing SMS message:', message.body.substring(0, 50) + '...');

      // Use OTP Insight Service for analysis
      const otpAnalysis = await otpInsightService.analyzeMessage(message.body, message.address);

      // Enhanced SMS-specific analysis
      const smsAnalysis = this.performSMSSpecificAnalysis(message);
      
              // Map risk levels to our format
        const mapRiskLevel = (level: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
          switch (level) {
            case 'SAFE': return 'LOW';
            case 'SUSPICIOUS': return 'MEDIUM';
            case 'HIGH_RISK': return 'HIGH';
            case 'CRITICAL': return 'CRITICAL';
            default: return 'LOW';
          }
        };
      
      // Combine results
        const mappedRiskLevel = mapRiskLevel(otpAnalysis.overallRiskLevel);
      const result: SMSAnalysisResult = {
          messageId: message.id,
          isSuspicious: mappedRiskLevel === 'HIGH' || mappedRiskLevel === 'CRITICAL',
          riskLevel: mappedRiskLevel,
          threats: this.extractThreats(message.body, otpAnalysis),
          details: JSON.stringify(otpAnalysis.senderVerdict.details),
        confidence: this.calculateConfidence(otpAnalysis),
          timestamp: new Date()
      };

      console.log('📊 SMS analysis complete:', result.riskLevel);
      return result;
      
    } catch (error) {
      console.error('❌ Error analyzing SMS message:', error);
      throw error;
    }
  }

  /**
   * Analyze multiple SMS messages
   */
  async analyzeMultipleSMS(messages: SMSMessage[]): Promise<SMSAnalysisResult[]> {
    const results: SMSAnalysisResult[] = [];
    
    for (const message of messages) {
      try {
        const analysis = await this.analyzeSMSMessage(message);
        results.push(analysis);
      } catch (error) {
        console.error('❌ Error analyzing SMS:', message.id, error);
      }
    }
    
    return results;
  }

  /**
   * Get SMS messages with fraud analysis
   */
  async getSMSWithAnalysis(filter?: SMSFilter): Promise<SMSAnalysisResult[]> {
    try {
      const messages = await this.getSMSMessages(filter);
      return await this.analyzeMultipleSMS(messages);
    } catch (error) {
      console.error('❌ Error getting SMS with analysis:', error);
      throw error;
    }
  }

  /**
   * Search SMS messages by content
   */
  async searchSMS(searchTerm: string, filter?: SMSFilter): Promise<SMSMessage[]> {
    try {
      const messages = await this.getSMSMessages(filter);
      return messages.filter(msg => 
        msg.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.address.includes(searchTerm)
      );
    } catch (error) {
      console.error('❌ Error searching SMS:', error);
      throw error;
    }
  }

  /**
   * Get fraud statistics from SMS
   */
  async getSMSFraudStatistics(timeRange?: { from: number; to: number }): Promise<{
    totalMessages: number;
    fraudulentMessages: number;
    suspiciousMessages: number;
    safeMessages: number;
    riskDistribution: Record<string, number>;
  }> {
    try {
      const filter: SMSFilter = timeRange ? { 
        timeRange: {
          start: new Date(timeRange.from),
          end: new Date(timeRange.to)
        }
      } : {};
      const analysisResults = await this.getSMSWithAnalysis(filter);
      
      const stats = {
        totalMessages: analysisResults.length,
        fraudulentMessages: analysisResults.filter(r => r.riskLevel === 'CRITICAL' || r.riskLevel === 'HIGH').length,
        suspiciousMessages: analysisResults.filter(r => r.riskLevel === 'MEDIUM').length,
        safeMessages: analysisResults.filter(r => r.riskLevel === 'LOW').length,
        riskDistribution: {
          LOW: 0,
          MEDIUM: 0,
          HIGH: 0,
          CRITICAL: 0
        }
      };

      analysisResults.forEach(result => {
        stats.riskDistribution[result.riskLevel]++;
      });

      return stats;
      
    } catch (error) {
      console.error('❌ Error getting SMS fraud statistics:', error);
      throw error;
    }
  }

  /**
   * Perform SMS-specific analysis
   */
  private performSMSSpecificAnalysis(message: SMSMessage): {
    hasOTP: boolean;
    hasPhishingPatterns: boolean;
    hasUrgentLanguage: boolean;
    hasMoneyRequest: boolean;
    hasSuspiciousLinks: boolean;
  } {
    const body = message.body.toLowerCase();
    
    return {
      hasOTP: /\b\d{4,8}\b/.test(body) && /(otp|code|pin|verification)/i.test(body),
      hasPhishingPatterns: /(click here|verify now|urgent|expire|suspend|block)/i.test(body),
      hasUrgentLanguage: /(urgent|immediate|expire|suspend|block|verify now)/i.test(body),
      hasMoneyRequest: /(pay|payment|money|amount|₹|rs|rupees|transfer)/i.test(body),
      hasSuspiciousLinks: /(http|www\.|\.com|bit\.ly|tinyurl)/i.test(body)
    };
  }

  /**
   * Extract threats from analysis
   */
  private extractThreats(messageBody: string, analysis: any): string[] {
    const threats: string[] = [];
    
    if (analysis.mlVerdict?.isFraud) {
      threats.push('AI detected fraud patterns');
    }
    
    if (!analysis.senderVerdict?.isVerified) {
      threats.push('Unverified sender');
    }
    
    if (/(urgent|expire|suspend)/i.test(messageBody)) {
      threats.push('Urgent language detected');
    }
    
    if (/(click|verify|update)/i.test(messageBody)) {
      threats.push('Phishing patterns detected');
    }
    
    return threats;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(analysis: any): number {
    let confidence = 50; // Base confidence
    
    if (analysis.mlVerdict?.confidence) {
      confidence += analysis.mlVerdict.confidence * 30;
    }
    
    if (analysis.senderVerdict?.isVerified) {
      confidence += 20;
    }
    
    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.hasPermissions;
  }

  /**
   * Get service status
   */
  getStatus(): {
    isInitialized: boolean;
    hasPermissions: boolean;
    platform: string;
    isSupported: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      hasPermissions: this.hasPermissions,
      platform: Platform.OS,
      isSupported: Platform.OS === 'android'
    };
  }
}

// Export singleton instance
export const smsReaderService = SMSReaderService.getInstance(); 