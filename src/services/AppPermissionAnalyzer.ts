import * as Sentry from '@sentry/react-native';
import { NativeModules, Platform } from 'react-native';

// ==============================================================================
// INTERFACES & TYPES
// ==============================================================================

export interface AppPermissionInfo {
  packageName: string;
  appName: string;
  permissions: string[];
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';
  riskScore: number;
  dangerousPermissions: string[];
  permissionCategories: PermissionCategory[];
  isSystemApp: boolean;
  installTime?: number;
  lastUpdateTime?: number;
}

export interface PermissionCategory {
  category: string;
  permissions: string[];
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  icon: string;
}

export interface AppPermissionScanResult {
  totalApps: number;
  scannedApps: number;
  riskyApps: AppPermissionInfo[];
  safeApps: number;
  criticalApps: number;
  highRiskApps: number;
  mediumRiskApps: number;
  lowRiskApps: number;
  scanDuration: number;
  timestamp: number;
}

// ==============================================================================
// PERMISSION RISK DEFINITIONS
// ==============================================================================

const CRITICAL_PERMISSIONS = [
  'android.permission.BIND_ACCESSIBILITY_SERVICE',
  'android.permission.BIND_DEVICE_ADMIN',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.WRITE_SECURE_SETTINGS',
  'android.permission.INSTALL_PACKAGES',
  'android.permission.DELETE_PACKAGES',
  'android.permission.BIND_VPN_SERVICE'
];

const HIGH_RISK_PERMISSIONS = [
  'android.permission.READ_SMS',
  'android.permission.SEND_SMS',
  'android.permission.RECEIVE_SMS',
  'android.permission.READ_CALL_LOG',
  'android.permission.WRITE_CALL_LOG',
  'android.permission.CALL_PHONE',
  'android.permission.READ_PHONE_STATE',
  'android.permission.READ_CONTACTS',
  'android.permission.WRITE_CONTACTS',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.RECORD_AUDIO',
  'android.permission.CAMERA'
];

const MEDIUM_RISK_PERMISSIONS = [
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.MANAGE_EXTERNAL_STORAGE',
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
  'android.permission.READ_MEDIA_AUDIO',
  'android.permission.ACCESS_NETWORK_STATE',
  'android.permission.INTERNET',
  'android.permission.WAKE_LOCK',
  'android.permission.RECEIVE_BOOT_COMPLETED'
];

const PERMISSION_CATEGORIES: { [key: string]: PermissionCategory } = {
  SMS_PHONE: {
    category: 'SMS & Phone Access',
    permissions: [
      'android.permission.READ_SMS',
      'android.permission.SEND_SMS',
      'android.permission.RECEIVE_SMS',
      'android.permission.READ_CALL_LOG',
      'android.permission.WRITE_CALL_LOG',
      'android.permission.CALL_PHONE',
      'android.permission.READ_PHONE_STATE'
    ],
    riskLevel: 'HIGH',
    description: 'Can read/send SMS messages and access call logs',
    icon: '📱'
  },
  CONTACTS: {
    category: 'Contacts Access',
    permissions: [
      'android.permission.READ_CONTACTS',
      'android.permission.WRITE_CONTACTS'
    ],
    riskLevel: 'HIGH',
    description: 'Can access and modify your contact list',
    icon: '👥'
  },
  LOCATION: {
    category: 'Location Tracking',
    permissions: [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION'
    ],
    riskLevel: 'HIGH',
    description: 'Can track your precise location',
    icon: '📍'
  },
  MEDIA: {
    category: 'Camera & Microphone',
    permissions: [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO'
    ],
    riskLevel: 'HIGH',
    description: 'Can access camera and record audio',
    icon: '📷'
  },
  STORAGE: {
    category: 'File System Access',
    permissions: [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.MANAGE_EXTERNAL_STORAGE',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
      'android.permission.READ_MEDIA_AUDIO'
    ],
    riskLevel: 'MEDIUM',
    description: 'Can access files, photos, and media on your device',
    icon: '📁'
  },
  SYSTEM_CONTROL: {
    category: 'System Control',
    permissions: [
      'android.permission.BIND_ACCESSIBILITY_SERVICE',
      'android.permission.BIND_DEVICE_ADMIN',
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.WRITE_SECURE_SETTINGS'
    ],
    riskLevel: 'CRITICAL',
    description: 'Can control system functions and overlay other apps',
    icon: '⚙️'
  },
  NETWORK: {
    category: 'Network Access',
    permissions: [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.ACCESS_WIFI_STATE',
      'android.permission.BIND_VPN_SERVICE'
    ],
    riskLevel: 'MEDIUM',
    description: 'Can access internet and network information',
    icon: '🌐'
  }
};

// ==============================================================================
// NATIVE MODULE INTERFACE
// ==============================================================================

interface AppScannerNativeModule {
  getInstalledApps: () => Promise<Array<{
    packageName: string;
    appName: string;
    permissions: string[];
    isSystemApp: boolean;
    installTime?: number;
    lastUpdateTime?: number;
  }>>;
  getAppPermissions: (packageName: string) => Promise<string[]>;
}

// ==============================================================================
// APP PERMISSION ANALYZER SERVICE
// ==============================================================================

export class AppPermissionAnalyzer {
  private static instance: AppPermissionAnalyzer;
  private nativeModule: AppScannerNativeModule;

  private constructor() {
    this.nativeModule = this.createNativeModuleInterface();
  }

  public static getInstance(): AppPermissionAnalyzer {
    if (!AppPermissionAnalyzer.instance) {
      AppPermissionAnalyzer.instance = new AppPermissionAnalyzer();
    }
    return AppPermissionAnalyzer.instance;
  }

  private createNativeModuleInterface(): AppScannerNativeModule {
    // Try to get the real native module
    const { AppPermissionScanner } = NativeModules;

    if (AppPermissionScanner && Platform.OS === 'android') {
      // REAL NATIVE MODULE - Use actual PackageManager on Android
      console.log('✅ Using REAL native AppPermissionScanner module');
      return {
        getInstalledApps: async () => {
          console.log('📱 AppPermissionAnalyzer: Calling NATIVE MODULE to get installed apps...');

          try {
            // Call the native Android module that uses PackageManager
            const result = await AppPermissionScanner.scanInstalledApps();

            console.log(`✅ Native module returned ${result.totalApps} real apps from device`);

            // Convert native result to our format
            const apps = result.apps.map((app: any) => ({
              packageName: app.packageName,
              appName: app.appName,
              permissions: app.permissions || [],
              isSystemApp: app.isSystemApp,
              installTime: app.installTime,
              lastUpdateTime: app.lastUpdateTime
            }));

            return apps;

          } catch (error) {
            console.error('❌ Native module scan failed:', error);
            throw new Error(`Failed to scan installed apps: ${error}`);
          }
        },

        getAppPermissions: async (packageName: string) => {
          console.log(`📱 Getting permissions for ${packageName} from native module`);
          try {
            const result = await AppPermissionScanner.getAppDetails(packageName);
            return result.permissions || [];
          } catch (error) {
            console.error(`❌ Failed to get app details for ${packageName}:`, error);
            return [];
          }
        }
      };
    } else {
      // FALLBACK for development/web - Mock data
      console.warn('⚠️ Native module not available - using mock data');
      console.warn('⚠️ This will show fake apps. Build APK to see real apps!');

      return {
        getInstalledApps: async () => {
          console.log('📱 AppPermissionAnalyzer: Using MOCK DATA (development only)');

          // Mock data for development only
          return [
            {
              packageName: 'com.whatsapp',
              appName: 'WhatsApp (MOCK)',
              permissions: [
                'android.permission.READ_CONTACTS',
                'android.permission.CAMERA',
                'android.permission.RECORD_AUDIO',
                'android.permission.READ_EXTERNAL_STORAGE',
                'android.permission.INTERNET'
              ],
              isSystemApp: false,
              installTime: Date.now() - 86400000 * 30
            },
            {
              packageName: 'com.suspicious.app',
              appName: 'Free VPN Master (MOCK)',
              permissions: [
                'android.permission.BIND_ACCESSIBILITY_SERVICE',
                'android.permission.READ_SMS',
                'android.permission.READ_CALL_LOG',
                'android.permission.ACCESS_FINE_LOCATION',
                'android.permission.SYSTEM_ALERT_WINDOW',
                'android.permission.BIND_VPN_SERVICE'
              ],
              isSystemApp: false,
              installTime: Date.now() - 86400000 * 2
            },
            {
              packageName: 'com.banking.app',
              appName: 'Banking App (MOCK)',
              permissions: [
                'android.permission.READ_SMS',
                'android.permission.READ_PHONE_STATE',
                'android.permission.CAMERA',
                'android.permission.INTERNET'
              ],
              isSystemApp: false,
              installTime: Date.now() - 86400000 * 60
            }
          ];
        },

        getAppPermissions: async (packageName: string) => {
          console.log(`📱 Getting permissions for ${packageName} (MOCK)`);
          return [];
        }
      };
    }
  }

  /**
   * Scan all installed apps and analyze their permissions
   */
  public async scanAllApps(): Promise<AppPermissionScanResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 AppPermissionAnalyzer: Starting comprehensive app permission scan...');
      
      // Get all installed apps
      const installedApps = await this.nativeModule.getInstalledApps();
      console.log(`📱 Found ${installedApps.length} installed apps`);
      
      const riskyApps: AppPermissionInfo[] = [];
      let safeApps = 0;
      let criticalApps = 0;
      let highRiskApps = 0;
      let mediumRiskApps = 0;
      let lowRiskApps = 0;
      
      // Analyze each app
      for (const app of installedApps) {
        const analysis = this.analyzeAppPermissions(app);
        
        if (analysis.riskLevel !== 'SAFE') {
          riskyApps.push(analysis);
          
          switch (analysis.riskLevel) {
            case 'CRITICAL':
              criticalApps++;
              break;
            case 'HIGH':
              highRiskApps++;
              break;
            case 'MEDIUM':
              mediumRiskApps++;
              break;
            case 'LOW':
              lowRiskApps++;
              break;
          }
        } else {
          safeApps++;
        }
      }
      
      const scanDuration = Date.now() - startTime;
      
      const result: AppPermissionScanResult = {
        totalApps: installedApps.length,
        scannedApps: installedApps.length,
        riskyApps: riskyApps.sort((a, b) => b.riskScore - a.riskScore), // Sort by risk score descending
        safeApps,
        criticalApps,
        highRiskApps,
        mediumRiskApps,
        lowRiskApps,
        scanDuration,
        timestamp: Date.now()
      };
      
      console.log('✅ App permission scan complete:', {
        totalApps: result.totalApps,
        riskyApps: result.riskyApps.length,
        criticalApps,
        highRiskApps,
        mediumRiskApps
      });
      
      return result;
      
    } catch (error) {
      console.error('❌ AppPermissionAnalyzer: Scan failed:', error);
      Sentry.captureException(error);
      throw new Error('Failed to scan app permissions');
    }
  }

  /**
   * Analyze permissions for a single app
   */
  private analyzeAppPermissions(app: {
    packageName: string;
    appName: string;
    permissions: string[];
    isSystemApp: boolean;
    installTime?: number;
    lastUpdateTime?: number;
  }): AppPermissionInfo {
    
    const dangerousPermissions = app.permissions.filter(permission => 
      CRITICAL_PERMISSIONS.includes(permission) || 
      HIGH_RISK_PERMISSIONS.includes(permission) ||
      MEDIUM_RISK_PERMISSIONS.includes(permission)
    );
    
    // Calculate risk score
    let riskScore = 0;
    const criticalCount = app.permissions.filter(p => CRITICAL_PERMISSIONS.includes(p)).length;
    const highRiskCount = app.permissions.filter(p => HIGH_RISK_PERMISSIONS.includes(p)).length;
    const mediumRiskCount = app.permissions.filter(p => MEDIUM_RISK_PERMISSIONS.includes(p)).length;
    
    riskScore += criticalCount * 30; // Critical permissions worth 30 points each
    riskScore += highRiskCount * 15; // High risk permissions worth 15 points each
    riskScore += mediumRiskCount * 5; // Medium risk permissions worth 5 points each
    
    // Additional risk factors
    if (!app.isSystemApp && criticalCount > 0) riskScore += 20; // Non-system apps with critical permissions
    if (highRiskCount >= 3) riskScore += 15; // Apps with many high-risk permissions
    if (app.installTime && (Date.now() - app.installTime) < 86400000 * 7) riskScore += 10; // Recently installed apps
    
    // Determine risk level
    let riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';
    if (criticalCount > 0 && !app.isSystemApp) {
      riskLevel = 'CRITICAL';
    } else if (riskScore >= 50) {
      riskLevel = 'CRITICAL';
    } else if (riskScore >= 30) {
      riskLevel = 'HIGH';
    } else if (riskScore >= 15) {
      riskLevel = 'MEDIUM';
    } else if (riskScore > 0) {
      riskLevel = 'LOW';
    } else {
      riskLevel = 'SAFE';
    }
    
    // Categorize permissions
    const permissionCategories: PermissionCategory[] = [];
    for (const [categoryKey, category] of Object.entries(PERMISSION_CATEGORIES)) {
      const categoryPermissions = app.permissions.filter(permission => 
        category.permissions.includes(permission)
      );
      
      if (categoryPermissions.length > 0) {
        permissionCategories.push({
          ...category,
          permissions: categoryPermissions
        });
      }
    }
    
    return {
      packageName: app.packageName,
      appName: app.appName,
      permissions: app.permissions,
      riskLevel,
      riskScore,
      dangerousPermissions,
      permissionCategories,
      isSystemApp: app.isSystemApp,
      installTime: app.installTime,
      lastUpdateTime: app.lastUpdateTime
    };
  }

  /**
   * Get detailed explanation for a permission
   */
  public getPermissionExplanation(permission: string): string {
    const explanations: { [key: string]: string } = {
      'android.permission.READ_SMS': 'Can read all SMS messages on your device',
      'android.permission.SEND_SMS': 'Can send SMS messages, potentially incurring charges',
      'android.permission.READ_CALL_LOG': 'Can access your call history and see who you called',
      'android.permission.READ_CONTACTS': 'Can access your entire contact list',
      'android.permission.ACCESS_FINE_LOCATION': 'Can track your precise GPS location',
      'android.permission.CAMERA': 'Can take photos and record videos',
      'android.permission.RECORD_AUDIO': 'Can record audio and conversations',
      'android.permission.BIND_ACCESSIBILITY_SERVICE': 'Can control your entire device and see everything on screen',
      'android.permission.SYSTEM_ALERT_WINDOW': 'Can display windows over other apps',
      'android.permission.BIND_DEVICE_ADMIN': 'Can have administrator control over your device',
      'android.permission.READ_EXTERNAL_STORAGE': 'Can access files, photos, and documents',
      'android.permission.INTERNET': 'Can connect to the internet and send data'
    };
    
    return explanations[permission] || 'Can access system features';
  }

  /**
   * Get risk assessment for specific permission combinations
   */
  public assessPermissionCombination(permissions: string[]): {
    isHighRisk: boolean;
    riskFactors: string[];
    recommendations: string[];
  } {
    const riskFactors: string[] = [];
    const recommendations: string[] = [];
    
    // Check for dangerous combinations
    const hasSMS = permissions.some(p => p.includes('SMS'));
    const hasLocation = permissions.some(p => p.includes('LOCATION'));
    const hasContacts = permissions.some(p => p.includes('CONTACTS'));
    const hasAccessibility = permissions.includes('android.permission.BIND_ACCESSIBILITY_SERVICE');
    const hasSystemAlert = permissions.includes('android.permission.SYSTEM_ALERT_WINDOW');
    
    if (hasAccessibility) {
      riskFactors.push('Can control your entire device');
      recommendations.push('Consider uninstalling - this is extremely dangerous');
    }
    
    if (hasSMS && hasLocation) {
      riskFactors.push('Can read messages and track location - potential for stalking');
      recommendations.push('Review if this app really needs both SMS and location access');
    }
    
    if (hasSystemAlert && (hasSMS || hasContacts)) {
      riskFactors.push('Can overlay fake screens to steal information');
      recommendations.push('Be very careful - this app can create fake login screens');
    }
    
    const isHighRisk = riskFactors.length > 0;
    
    return {
      isHighRisk,
      riskFactors,
      recommendations
    };
  }
}
