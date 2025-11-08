/**
 * DeepScanPermissionAnalyzer.ts
 * 
 * Comprehensive permission analyzer for apps, APK files, and social media downloads.
 * Detects malicious permission patterns and calculates risk scores.
 * 
 * @module DeepScanPermissionAnalyzer
 * @author Shabari Security Team
 */

import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system';

// ==================== TYPES ====================

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';

export type PermissionCategory = 
  | 'SYSTEM_CONTROL' 
  | 'PRIVACY' 
  | 'COMMUNICATION' 
  | 'LOCATION' 
  | 'STORAGE' 
  | 'NETWORK' 
  | 'DEVICE_ADMIN' 
  | 'OTHER';

export interface RiskyPermission {
  permission: string;
  riskLevel: RiskLevel;
  riskScore: number;
  category: PermissionCategory;
  description: string;
  whyRisky: string;
  examplesOfAbuse: string[];
}

export interface PermissionRiskAssessment {
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  criticalCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  riskyPermissions: RiskyPermission[];
  maliciousPatterns: MaliciousPattern[];
  recommendations: string[];
  riskReasons: string[];
}

export interface MaliciousPattern {
  patternName: string;
  patternType: 'spyware' | 'trojan' | 'adware' | 'ransomware' | 'miner' | 'keylogger' | 'banking' | 'other';
  permissions: string[];
  description: string;
  severity: RiskLevel;
  examples: string[];
}

export interface MaliciousPermissionResult {
  isMalicious: boolean;
  maliciousScore: number; // 0-100
  maliciousPatterns: MaliciousPattern[];
  suspiciousCombinations: string[];
  recommendedAction: string;
  confidence: number; // 0-100
}

export interface CombinationRisk {
  combination: string[];
  riskLevel: RiskLevel;
  riskScore: number;
  whyRisky: string;
  commonMalware: string[];
  recommendedAction: string;
}

export interface PermissionScanConfig {
  scanAllApps: boolean;
  scanSystemApps: boolean;
  scanUserApps: boolean;
  scanApkFiles: boolean;
  scanSocialMediaFiles: boolean;
  scanDownloads: boolean;
  scanWhatsApp: boolean;
  scanTelegram: boolean;
  scanInstagram: boolean;
  scanFacebook: boolean;
  scanAllFolders: boolean;
  riskThreshold: number; // 0-100
  enableDeepAnalysis: boolean;
  checkPermissionCombinations: boolean;
  detectMaliciousPatterns: boolean;
}

// ==================== CONSTANTS ====================

// CRITICAL PERMISSIONS (50 points each)
const CRITICAL_PERMISSIONS: Record<string, { category: PermissionCategory; description: string; whyRisky: string; examples: string[] }> = {
  'android.permission.BIND_ACCESSIBILITY_SERVICE': {
    category: 'SYSTEM_CONTROL',
    description: 'Allows app to control entire device through accessibility features',
    whyRisky: 'Can read screen content, intercept keystrokes, and control device actions',
    examples: ['Banking trojans', 'Keyloggers', 'Spyware apps']
  },
  'android.permission.BIND_DEVICE_ADMIN': {
    category: 'DEVICE_ADMIN',
    description: 'Grants device administrator privileges',
    whyRisky: 'Can prevent uninstallation, lock device, and wipe data',
    examples: ['Ransomware', 'Persistent malware']
  },
  'android.permission.SYSTEM_ALERT_WINDOW': {
    category: 'SYSTEM_CONTROL',
    description: 'Allows app to display overlay windows on top of other apps',
    whyRisky: 'Can create fake login screens and intercept credentials',
    examples: ['Banking trojans', 'Phishing apps', 'Clickjacking malware']
  },
  'android.permission.WRITE_SECURE_SETTINGS': {
    category: 'SYSTEM_CONTROL',
    description: 'Allows modification of system settings',
    whyRisky: 'Can change critical system configurations without user consent',
    examples: ['Rootkits', 'System hijackers']
  },
  'android.permission.INSTALL_PACKAGES': {
    category: 'SYSTEM_CONTROL',
    description: 'Allows silent installation of apps',
    whyRisky: 'Can install malware without user knowledge',
    examples: ['Trojan droppers', 'Malware installers']
  },
  'android.permission.DELETE_PACKAGES': {
    category: 'SYSTEM_CONTROL',
    description: 'Allows deletion of installed apps',
    whyRisky: 'Can remove security apps and antivirus software',
    examples: ['Advanced malware', 'Security disablers']
  },
  'android.permission.BIND_VPN_SERVICE': {
    category: 'NETWORK',
    description: 'Allows creation of VPN service',
    whyRisky: 'Can intercept all network traffic including passwords',
    examples: ['Man-in-the-middle attacks', 'Data theft malware']
  },
  'android.permission.REQUEST_INSTALL_PACKAGES': {
    category: 'SYSTEM_CONTROL',
    description: 'Allows requesting app installation',
    whyRisky: 'Can prompt user to install malicious apps',
    examples: ['Adware', 'Trojan installers']
  },
  'android.permission.MANAGE_EXTERNAL_STORAGE': {
    category: 'STORAGE',
    description: 'Full access to all files on device (Android 11+)',
    whyRisky: 'Can access, modify, or delete any file on device',
    examples: ['Ransomware', 'Data theft apps', 'File encryptors']
  }
};

// HIGH RISK PERMISSIONS (30 points each)
const HIGH_RISK_PERMISSIONS: Record<string, { category: PermissionCategory; description: string; whyRisky: string; examples: string[] }> = {
  'android.permission.READ_SMS': {
    category: 'COMMUNICATION',
    description: 'Allows reading SMS messages',
    whyRisky: 'Can intercept 2FA codes and private messages',
    examples: ['Banking trojans', 'Spyware', 'SMS interceptors']
  },
  'android.permission.SEND_SMS': {
    category: 'COMMUNICATION',
    description: 'Allows sending SMS messages',
    whyRisky: 'Can send premium SMS causing financial loss',
    examples: ['SMS fraud apps', 'Premium SMS trojans']
  },
  'android.permission.RECEIVE_SMS': {
    category: 'COMMUNICATION',
    description: 'Allows receiving SMS messages',
    whyRisky: 'Can intercept verification codes and OTPs',
    examples: ['2FA bypass malware', 'Banking trojans']
  },
  'android.permission.READ_CALL_LOG': {
    category: 'PRIVACY',
    description: 'Allows reading call history',
    whyRisky: 'Can track communication patterns and contacts',
    examples: ['Spyware', 'Stalkerware apps']
  },
  'android.permission.WRITE_CALL_LOG': {
    category: 'PRIVACY',
    description: 'Allows modification of call history',
    whyRisky: 'Can hide malicious calls or manipulate records',
    examples: ['Call fraud apps', 'Evidence tampering malware']
  },
  'android.permission.CALL_PHONE': {
    category: 'COMMUNICATION',
    description: 'Allows making phone calls',
    whyRisky: 'Can make premium rate calls causing financial loss',
    examples: ['Premium call fraud', 'Toll fraud malware']
  },
  'android.permission.READ_PHONE_STATE': {
    category: 'PRIVACY',
    description: 'Allows reading phone state and identity',
    whyRisky: 'Can track device and user identity',
    examples: ['Tracking apps', 'Device fingerprinting malware']
  },
  'android.permission.READ_CONTACTS': {
    category: 'PRIVACY',
    description: 'Allows reading contacts',
    whyRisky: 'Can steal contact information for spam or phishing',
    examples: ['Contact harvesters', 'Spam apps']
  },
  'android.permission.WRITE_CONTACTS': {
    category: 'PRIVACY',
    description: 'Allows modification of contacts',
    whyRisky: 'Can inject malicious contacts or redirect calls',
    examples: ['Contact manipulators', 'Call redirectors']
  },
  'android.permission.ACCESS_FINE_LOCATION': {
    category: 'LOCATION',
    description: 'Allows precise GPS location access',
    whyRisky: 'Can track exact user location continuously',
    examples: ['Stalkerware', 'Location tracking malware']
  },
  'android.permission.ACCESS_COARSE_LOCATION': {
    category: 'LOCATION',
    description: 'Allows approximate location access',
    whyRisky: 'Can track general user location',
    examples: ['Tracking apps', 'Location-based malware']
  },
  'android.permission.RECORD_AUDIO': {
    category: 'PRIVACY',
    description: 'Allows recording audio',
    whyRisky: 'Can record conversations and private audio',
    examples: ['Spyware', 'Audio surveillance malware']
  },
  'android.permission.CAMERA': {
    category: 'PRIVACY',
    description: 'Allows camera access',
    whyRisky: 'Can take photos and videos without user knowledge',
    examples: ['Spyware', 'Surveillance apps']
  },
  'android.permission.READ_PHONE_NUMBERS': {
    category: 'PRIVACY',
    description: 'Allows reading phone numbers',
    whyRisky: 'Can identify user and SIM card information',
    examples: ['Identity theft apps', 'Tracking malware']
  }
};

// MEDIUM RISK PERMISSIONS (15 points each)
const MEDIUM_RISK_PERMISSIONS: Record<string, { category: PermissionCategory; description: string; whyRisky: string; examples: string[] }> = {
  'android.permission.READ_EXTERNAL_STORAGE': {
    category: 'STORAGE',
    description: 'Allows reading files from storage',
    whyRisky: 'Can access personal files and documents',
    examples: ['Data theft apps', 'File scanners']
  },
  'android.permission.WRITE_EXTERNAL_STORAGE': {
    category: 'STORAGE',
    description: 'Allows writing files to storage',
    whyRisky: 'Can modify or delete files',
    examples: ['Ransomware', 'File corruptors']
  },
  'android.permission.READ_MEDIA_IMAGES': {
    category: 'STORAGE',
    description: 'Allows reading images (Android 13+)',
    whyRisky: 'Can access private photos',
    examples: ['Photo stealers', 'Privacy invaders']
  },
  'android.permission.READ_MEDIA_VIDEO': {
    category: 'STORAGE',
    description: 'Allows reading videos (Android 13+)',
    whyRisky: 'Can access private videos',
    examples: ['Media stealers', 'Privacy invaders']
  },
  'android.permission.READ_MEDIA_AUDIO': {
    category: 'STORAGE',
    description: 'Allows reading audio files (Android 13+)',
    whyRisky: 'Can access audio recordings',
    examples: ['Audio stealers', 'Privacy invaders']
  },
  'android.permission.ACCESS_NETWORK_STATE': {
    category: 'NETWORK',
    description: 'Allows checking network connectivity',
    whyRisky: 'Can detect network type for targeted attacks',
    examples: ['Network-aware malware']
  },
  'android.permission.INTERNET': {
    category: 'NETWORK',
    description: 'Allows internet access',
    whyRisky: 'Can send stolen data to remote servers',
    examples: ['Data exfiltration malware', 'C&C communication']
  },
  'android.permission.WAKE_LOCK': {
    category: 'SYSTEM_CONTROL',
    description: 'Allows keeping device awake',
    whyRisky: 'Can drain battery for crypto mining',
    examples: ['Crypto miners', 'Battery drainers']
  },
  'android.permission.RECEIVE_BOOT_COMPLETED': {
    category: 'SYSTEM_CONTROL',
    description: 'Allows auto-start on device boot',
    whyRisky: 'Can start malicious services automatically',
    examples: ['Persistent malware', 'Background miners']
  },
  'android.permission.GET_ACCOUNTS': {
    category: 'PRIVACY',
    description: 'Allows reading account information',
    whyRisky: 'Can access email and account details',
    examples: ['Account harvesters', 'Email collectors']
  },
  'android.permission.READ_CALENDAR': {
    category: 'PRIVACY',
    description: 'Allows reading calendar events',
    whyRisky: 'Can track user schedule and activities',
    examples: ['Spyware', 'Schedule trackers']
  },
  'android.permission.WRITE_CALENDAR': {
    category: 'PRIVACY',
    description: 'Allows modifying calendar events',
    whyRisky: 'Can inject fake events or spam',
    examples: ['Calendar spammers', 'Event manipulators']
  }
};

// MALICIOUS PERMISSION PATTERNS
const MALICIOUS_PATTERNS: MaliciousPattern[] = [
  {
    patternName: 'SMS Spyware',
    patternType: 'spyware',
    permissions: ['READ_SMS', 'SEND_SMS', 'RECEIVE_SMS'],
    severity: 'CRITICAL',
    description: 'Can read and send SMS messages, often used by spyware to intercept 2FA codes',
    examples: ['FluBot', 'Anubis', 'Cerberus']
  },
  {
    patternName: 'Banking Trojan',
    patternType: 'banking',
    permissions: ['SYSTEM_ALERT_WINDOW', 'BIND_ACCESSIBILITY_SERVICE', 'READ_SMS'],
    severity: 'CRITICAL',
    description: 'Can overlay banking apps and intercept SMS for 2FA codes',
    examples: ['Godfather', 'Anatsa', 'SharkBot']
  },
  {
    patternName: 'Location Tracker',
    patternType: 'spyware',
    permissions: ['ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'INTERNET'],
    severity: 'HIGH',
    description: 'Can track user location continuously and send to remote server',
    examples: ['Stalkerware apps', 'Location trackers']
  },
  {
    patternName: 'Keylogger',
    patternType: 'keylogger',
    permissions: ['BIND_ACCESSIBILITY_SERVICE', 'INTERNET'],
    severity: 'CRITICAL',
    description: 'Can record all keyboard input and screen content',
    examples: ['TeaBot', 'EventBot']
  },
  {
    patternName: 'Ransomware',
    patternType: 'ransomware',
    permissions: ['WRITE_EXTERNAL_STORAGE', 'MANAGE_EXTERNAL_STORAGE', 'INTERNET'],
    severity: 'CRITICAL',
    description: 'Can encrypt files and demand payment for decryption',
    examples: ['Android/Filecoder', 'DoubleLocker']
  },
  {
    patternName: 'Advanced Ransomware',
    patternType: 'ransomware',
    permissions: ['BIND_DEVICE_ADMIN', 'WRITE_EXTERNAL_STORAGE', 'SYSTEM_ALERT_WINDOW'],
    severity: 'CRITICAL',
    description: 'Can lock device, encrypt files, and prevent uninstallation',
    examples: ['DoubleLocker', 'SLocker']
  },
  {
    patternName: 'Adware',
    patternType: 'adware',
    permissions: ['SYSTEM_ALERT_WINDOW', 'INTERNET', 'RECEIVE_BOOT_COMPLETED'],
    severity: 'MEDIUM',
    description: 'Can display intrusive ads and auto-start on boot',
    examples: ['HiddenAds', 'AdDown']
  },
  {
    patternName: 'Crypto Miner',
    patternType: 'miner',
    permissions: ['WAKE_LOCK', 'INTERNET', 'RECEIVE_BOOT_COMPLETED'],
    severity: 'HIGH',
    description: 'Can mine cryptocurrency in background, draining battery and resources',
    examples: ['CoinMiner', 'HiddenMiner']
  },
  {
    patternName: 'Call Fraud',
    patternType: 'trojan',
    permissions: ['CALL_PHONE', 'READ_PHONE_STATE', 'INTERNET'],
    severity: 'HIGH',
    description: 'Can make premium rate calls causing financial loss',
    examples: ['Joker', 'Hummingbad']
  },
  {
    patternName: 'Contact Harvester',
    patternType: 'spyware',
    permissions: ['READ_CONTACTS', 'INTERNET', 'READ_PHONE_STATE'],
    severity: 'HIGH',
    description: 'Can steal contact information for spam or phishing campaigns',
    examples: ['Contact stealers', 'Spam bots']
  },
  {
    patternName: 'Surveillance Spyware',
    patternType: 'spyware',
    permissions: ['CAMERA', 'RECORD_AUDIO', 'ACCESS_FINE_LOCATION', 'INTERNET'],
    severity: 'CRITICAL',
    description: 'Can record audio, video, and track location for surveillance',
    examples: ['Pegasus-like apps', 'Commercial spyware']
  },
  {
    patternName: 'Data Exfiltration',
    patternType: 'trojan',
    permissions: ['READ_EXTERNAL_STORAGE', 'READ_SMS', 'READ_CONTACTS', 'INTERNET'],
    severity: 'CRITICAL',
    description: 'Can steal files, messages, and contacts from device',
    examples: ['Exodus', 'Triada']
  }
];

// ==================== CLASS ====================

/**
 * DeepScanPermissionAnalyzer
 * 
 * Comprehensive permission analyzer that detects malicious permission patterns,
 * calculates risk scores, and provides actionable security recommendations.
 */
export class DeepScanPermissionAnalyzer {
  private static instance: DeepScanPermissionAnalyzer;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): DeepScanPermissionAnalyzer {
    if (!DeepScanPermissionAnalyzer.instance) {
      DeepScanPermissionAnalyzer.instance = new DeepScanPermissionAnalyzer();
    }
    return DeepScanPermissionAnalyzer.instance;
  }

  /**
   * Analyze permissions and calculate risk assessment
   */
  public async analyzePermissions(permissions: string[]): Promise<PermissionRiskAssessment> {
    const normalizedPermissions = this.normalizePermissions(permissions);
    
    // Count risk levels
    let criticalCount = 0;
    let highRiskCount = 0;
    let mediumRiskCount = 0;
    let lowRiskCount = 0;
    let totalRiskScore = 0;

    const riskyPermissions: RiskyPermission[] = [];

    // Analyze each permission
    for (const permission of normalizedPermissions) {
      const analysis = this.analyzePermission(permission);
      if (analysis) {
        riskyPermissions.push(analysis);
        totalRiskScore += analysis.riskScore;

        switch (analysis.riskLevel) {
          case 'CRITICAL':
            criticalCount++;
            break;
          case 'HIGH':
            highRiskCount++;
            break;
          case 'MEDIUM':
            mediumRiskCount++;
            break;
          case 'LOW':
            lowRiskCount++;
            break;
        }
      }
    }

    // Detect malicious patterns
    const maliciousPatterns = this.detectMaliciousPatterns(normalizedPermissions);

    // Add pattern bonuses to risk score
    const patternBonus = maliciousPatterns.reduce((sum, pattern) => {
      switch (pattern.severity) {
        case 'CRITICAL': return sum + 30;
        case 'HIGH': return sum + 20;
        case 'MEDIUM': return sum + 10;
        default: return sum + 5;
      }
    }, 0);

    totalRiskScore += patternBonus;

    // Calculate final risk score (0-100)
    const riskScore = Math.min(100, totalRiskScore);
    const riskLevel = this.calculateRiskLevel(riskScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      riskLevel,
      riskyPermissions,
      maliciousPatterns
    );

    // Generate risk reasons
    const riskReasons = this.generateRiskReasons(
      riskyPermissions,
      maliciousPatterns
    );

    return {
      riskScore,
      riskLevel,
      criticalCount,
      highRiskCount,
      mediumRiskCount,
      lowRiskCount,
      riskyPermissions,
      maliciousPatterns,
      recommendations,
      riskReasons
    };
  }

  /**
   * Detect malicious permission patterns
   */
  public detectMaliciousPatterns(permissions: string[]): MaliciousPattern[] {
    const normalizedPermissions = this.normalizePermissions(permissions);
    const detectedPatterns: MaliciousPattern[] = [];

    for (const pattern of MALICIOUS_PATTERNS) {
      const normalizedPatternPerms = pattern.permissions.map(p => 
        this.normalizePermission(p)
      );

      const hasAllPermissions = normalizedPatternPerms.every(p =>
        normalizedPermissions.includes(p)
      );

      if (hasAllPermissions) {
        detectedPatterns.push(pattern);
      }
    }

    return detectedPatterns;
  }

  /**
   * Check if permissions indicate malicious behavior
   */
  public async checkMaliciousPermissions(permissions: string[]): Promise<MaliciousPermissionResult> {
    const maliciousPatterns = this.detectMaliciousPatterns(permissions);
    const isMalicious = maliciousPatterns.length > 0;

    // Calculate malicious score
    let maliciousScore = 0;
    for (const pattern of maliciousPatterns) {
      switch (pattern.severity) {
        case 'CRITICAL':
          maliciousScore += 40;
          break;
        case 'HIGH':
          maliciousScore += 25;
          break;
        case 'MEDIUM':
          maliciousScore += 15;
          break;
        default:
          maliciousScore += 5;
      }
    }
    maliciousScore = Math.min(100, maliciousScore);

    // Find suspicious combinations
    const suspiciousCombinations = this.findSuspiciousCombinations(permissions);

    // Calculate confidence
    const confidence = this.calculateConfidence(maliciousPatterns, suspiciousCombinations);

    // Generate recommended action
    const recommendedAction = this.getRecommendedAction(maliciousScore, confidence);

    return {
      isMalicious,
      maliciousScore,
      maliciousPatterns,
      suspiciousCombinations,
      recommendedAction,
      confidence
    };
  }

  /**
   * Analyze risky permission combinations
   */
  public analyzePermissionCombinations(permissions: string[]): CombinationRisk[] {
    const risks: CombinationRisk[] = [];
    const normalizedPermissions = this.normalizePermissions(permissions);

    // Check for specific risky combinations
    const combinations = [
      {
        perms: ['READ_SMS', 'INTERNET'],
        level: 'HIGH' as RiskLevel,
        score: 70,
        why: 'Can intercept SMS and send to remote server',
        malware: ['SMS stealers', 'Banking trojans'],
        action: 'Review app carefully - may steal SMS messages'
      },
      {
        perms: ['CAMERA', 'INTERNET'],
        level: 'MEDIUM' as RiskLevel,
        score: 50,
        why: 'Can capture photos and upload them',
        malware: ['Spyware', 'Photo stealers'],
        action: 'Verify app legitimacy before granting camera access'
      },
      {
        perms: ['RECORD_AUDIO', 'INTERNET'],
        level: 'HIGH' as RiskLevel,
        score: 65,
        why: 'Can record audio and send to remote server',
        malware: ['Audio surveillance apps', 'Spyware'],
        action: 'Review app carefully - may record conversations'
      },
      {
        perms: ['ACCESS_FINE_LOCATION', 'INTERNET', 'RECEIVE_BOOT_COMPLETED'],
        level: 'HIGH' as RiskLevel,
        score: 75,
        why: 'Can track location continuously and auto-start',
        malware: ['Stalkerware', 'Location trackers'],
        action: 'Suspicious - may track your location without consent'
      },
      {
        perms: ['BIND_ACCESSIBILITY_SERVICE', 'INTERNET', 'SYSTEM_ALERT_WINDOW'],
        level: 'CRITICAL' as RiskLevel,
        score: 95,
        why: 'Can control device, overlay apps, and communicate with server',
        malware: ['Banking trojans', 'Advanced malware'],
        action: 'CRITICAL - Uninstall immediately unless from trusted source'
      }
    ];

    for (const combo of combinations) {
      const normalizedComboPerms = combo.perms.map(p => this.normalizePermission(p));
      const hasAll = normalizedComboPerms.every(p => normalizedPermissions.includes(p));

      if (hasAll) {
        risks.push({
          combination: combo.perms,
          riskLevel: combo.level,
          riskScore: combo.score,
          whyRisky: combo.why,
          commonMalware: combo.malware,
          recommendedAction: combo.action
        });
      }
    }

    return risks;
  }

  /**
   * Get permission risk score
   */
  public getPermissionRiskScore(permission: string): number {
    const normalized = this.normalizePermission(permission);

    if (CRITICAL_PERMISSIONS[normalized]) return 50;
    if (HIGH_RISK_PERMISSIONS[normalized]) return 30;
    if (MEDIUM_RISK_PERMISSIONS[normalized]) return 15;

    return 5; // Low risk for unknown permissions
  }

  /**
   * Get permission category
   */
  public getPermissionCategory(permission: string): PermissionCategory {
    const normalized = this.normalizePermission(permission);

    const allPermissions = {
      ...CRITICAL_PERMISSIONS,
      ...HIGH_RISK_PERMISSIONS,
      ...MEDIUM_RISK_PERMISSIONS
    };

    return allPermissions[normalized]?.category || 'OTHER';
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Analyze individual permission
   */
  private analyzePermission(permission: string): RiskyPermission | null {
    const normalized = this.normalizePermission(permission);

    let permData;
    let riskLevel: RiskLevel;
    let riskScore: number;

    if (CRITICAL_PERMISSIONS[normalized]) {
      permData = CRITICAL_PERMISSIONS[normalized];
      riskLevel = 'CRITICAL';
      riskScore = 50;
    } else if (HIGH_RISK_PERMISSIONS[normalized]) {
      permData = HIGH_RISK_PERMISSIONS[normalized];
      riskLevel = 'HIGH';
      riskScore = 30;
    } else if (MEDIUM_RISK_PERMISSIONS[normalized]) {
      permData = MEDIUM_RISK_PERMISSIONS[normalized];
      riskLevel = 'MEDIUM';
      riskScore = 15;
    } else {
      // Unknown permission - low risk
      return {
        permission: normalized,
        riskLevel: 'LOW',
        riskScore: 5,
        category: 'OTHER',
        description: 'Unknown permission',
        whyRisky: 'Not a standard Android permission',
        examplesOfAbuse: []
      };
    }

    return {
      permission: normalized,
      riskLevel,
      riskScore,
      category: permData.category,
      description: permData.description,
      whyRisky: permData.whyRisky,
      examplesOfAbuse: permData.examples
    };
  }

  /**
   * Normalize permission string
   */
  private normalizePermission(permission: string): string {
    // Remove 'android.permission.' prefix if present
    if (permission.startsWith('android.permission.')) {
      return permission;
    }
    return `android.permission.${permission}`;
  }

  /**
   * Normalize array of permissions
   */
  private normalizePermissions(permissions: string[]): string[] {
    return permissions.map(p => this.normalizePermission(p));
  }

  /**
   * Calculate overall risk level
   */
  private calculateRiskLevel(riskScore: number): RiskLevel {
    if (riskScore >= 80) return 'CRITICAL';
    if (riskScore >= 60) return 'HIGH';
    if (riskScore >= 30) return 'MEDIUM';
    if (riskScore >= 10) return 'LOW';
    return 'SAFE';
  }

  /**
   * Generate recommendations based on risk assessment
   */
  private generateRecommendations(
    riskLevel: RiskLevel,
    riskyPermissions: RiskyPermission[],
    maliciousPatterns: MaliciousPattern[]
  ): string[] {
    const recommendations: string[] = [];

    // Risk level based recommendations
    switch (riskLevel) {
      case 'CRITICAL':
        recommendations.push('⚠️ CRITICAL RISK: Uninstall this app immediately unless from a trusted source');
        recommendations.push('This app has extremely dangerous permissions that can compromise your device');
        break;
      case 'HIGH':
        recommendations.push('⚠️ HIGH RISK: Review this app carefully before using');
        recommendations.push('Consider uninstalling if you don\'t fully trust the developer');
        break;
      case 'MEDIUM':
        recommendations.push('⚠️ MEDIUM RISK: Use caution with this app');
        recommendations.push('Review what data the app can access');
        break;
      case 'LOW':
        recommendations.push('ℹ️ LOW RISK: App has some permissions but appears relatively safe');
        break;
      case 'SAFE':
        recommendations.push('✅ SAFE: App has minimal permissions');
        break;
    }

    // Pattern-based recommendations
    if (maliciousPatterns.length > 0) {
      recommendations.push(`⚠️ Detected ${maliciousPatterns.length} malicious permission pattern(s)`);
      for (const pattern of maliciousPatterns) {
        recommendations.push(`  • ${pattern.patternName}: ${pattern.description}`);
      }
    }

    // Permission-specific recommendations
    const criticalPerms = riskyPermissions.filter(p => p.riskLevel === 'CRITICAL');
    if (criticalPerms.length > 0) {
      recommendations.push(`⚠️ Has ${criticalPerms.length} CRITICAL permission(s):`);
      for (const perm of criticalPerms.slice(0, 3)) {
        recommendations.push(`  • ${perm.permission.replace('android.permission.', '')}: ${perm.whyRisky}`);
      }
    }

    return recommendations;
  }

  /**
   * Generate risk reasons
   */
  private generateRiskReasons(
    riskyPermissions: RiskyPermission[],
    maliciousPatterns: MaliciousPattern[]
  ): string[] {
    const reasons: string[] = [];

    // Add pattern reasons
    for (const pattern of maliciousPatterns) {
      reasons.push(`Matches ${pattern.patternName} pattern (${pattern.patternType})`);
    }

    // Add critical permission reasons
    const criticalPerms = riskyPermissions.filter(p => p.riskLevel === 'CRITICAL');
    for (const perm of criticalPerms) {
      reasons.push(`Has CRITICAL permission: ${perm.permission.replace('android.permission.', '')}`);
    }

    // Add high risk permission reasons
    const highRiskPerms = riskyPermissions.filter(p => p.riskLevel === 'HIGH');
    if (highRiskPerms.length >= 3) {
      reasons.push(`Has ${highRiskPerms.length} HIGH RISK permissions`);
    }

    return reasons;
  }

  /**
   * Find suspicious permission combinations
   */
  private findSuspiciousCombinations(permissions: string[]): string[] {
    const combinations: string[] = [];
    const normalizedPermissions = this.normalizePermissions(permissions);

    // Check for common suspicious combinations
    if (
      normalizedPermissions.includes('android.permission.READ_SMS') &&
      normalizedPermissions.includes('android.permission.INTERNET')
    ) {
      combinations.push('READ_SMS + INTERNET (can steal SMS messages)');
    }

    if (
      normalizedPermissions.includes('android.permission.BIND_ACCESSIBILITY_SERVICE') &&
      normalizedPermissions.includes('android.permission.INTERNET')
    ) {
      combinations.push('ACCESSIBILITY + INTERNET (can control device and exfiltrate data)');
    }

    if (
      normalizedPermissions.includes('android.permission.SYSTEM_ALERT_WINDOW') &&
      normalizedPermissions.includes('android.permission.READ_SMS')
    ) {
      combinations.push('OVERLAY + READ_SMS (banking trojan pattern)');
    }

    return combinations;
  }

  /**
   * Calculate confidence in malicious detection
   */
  private calculateConfidence(
    maliciousPatterns: MaliciousPattern[],
    suspiciousCombinations: string[]
  ): number {
    let confidence = 0;

    // Base confidence on number of patterns
    confidence += maliciousPatterns.length * 30;

    // Add confidence for suspicious combinations
    confidence += suspiciousCombinations.length * 15;

    // Cap at 100
    return Math.min(100, confidence);
  }

  /**
   * Get recommended action based on malicious score
   */
  private getRecommendedAction(maliciousScore: number, confidence: number): string {
    if (maliciousScore >= 80 && confidence >= 70) {
      return 'UNINSTALL IMMEDIATELY - High confidence malware detected';
    } else if (maliciousScore >= 60) {
      return 'QUARANTINE - Review carefully before using';
    } else if (maliciousScore >= 40) {
      return 'WARNING - Use extreme caution';
    } else if (maliciousScore >= 20) {
      return 'REVIEW - Check app legitimacy';
    } else {
      return 'MONITOR - Keep an eye on app behavior';
    }
  }
}

// Export singleton instance
export default DeepScanPermissionAnalyzer.getInstance();
