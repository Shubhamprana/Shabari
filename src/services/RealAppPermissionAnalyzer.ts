import * as Sentry from '@sentry/react-native';
import { Linking, NativeModules, Platform } from 'react-native';
import { PERMISSIONS, RESULTS, check, request } from 'react-native-permissions';

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
  riskyApps: number;
  criticalApps: number;
  highRiskApps: number;
  mediumRiskApps: number;
  apps: AppPermissionInfo[];
}

// ==============================================================================
// PERMISSION CATEGORIES
// ==============================================================================

const PERMISSION_CATEGORIES = {
  SMS: {
    description: 'SMS and messaging permissions',
    icon: 'message-text',
    riskLevel: 'CRITICAL' as const
  },
  PHONE: {
    description: 'Phone and call permissions',
    icon: 'phone',
    riskLevel: 'CRITICAL' as const
  },
  LOCATION: {
    description: 'Location and GPS permissions',
    icon: 'map-marker',
    riskLevel: 'HIGH' as const
  },
  CAMERA: {
    description: 'Camera and photo permissions',
    icon: 'camera',
    riskLevel: 'HIGH' as const
  },
  CONTACTS: {
    description: 'Contacts and address book permissions',
    icon: 'account-group',
    riskLevel: 'HIGH' as const
  },
  STORAGE: {
    description: 'Storage and file permissions',
    icon: 'folder',
    riskLevel: 'MEDIUM' as const
  },
  NETWORK: {
    description: 'Network and internet permissions',
    icon: 'wifi',
    riskLevel: 'LOW' as const
  },
  AUDIO: {
    description: 'Audio and microphone permissions',
    icon: 'microphone',
    riskLevel: 'HIGH' as const
  },
  OTHER: {
    description: 'Other permissions',
    icon: 'cog',
    riskLevel: 'LOW' as const
  }
};

// ==============================================================================
// REAL APP PERMISSION ANALYZER
// ==============================================================================

export class RealAppPermissionAnalyzer {
  private static instance: RealAppPermissionAnalyzer;

  private constructor() {}

  public static getInstance(): RealAppPermissionAnalyzer {
    if (!RealAppPermissionAnalyzer.instance) {
      RealAppPermissionAnalyzer.instance = new RealAppPermissionAnalyzer();
    }
    return RealAppPermissionAnalyzer.instance;
  }

  /**
   * Scan all installed apps and analyze their permissions
   */
    public async scanAllApps(): Promise<AppPermissionScanResult> {
    try {
      console.log('🔍 Starting REAL app permission scan...');
      
      if (Platform.OS !== 'android') {
        throw new Error('App permission scanning is only available on Android');
      }

      // ------------------------------------------------------------------
      // STEP 0: Request all necessary permissions for app scanning
      // ------------------------------------------------------------------
      if (Platform.OS === 'android') {
        try {
          // Request READ_EXTERNAL_STORAGE permission for file access
          const storagePerm = PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
          let storageStatus = await check(storagePerm);

          if (storageStatus !== RESULTS.GRANTED) {
            storageStatus = await request(storagePerm);
            if (storageStatus !== RESULTS.GRANTED) {
              console.warn('⚠️ READ_EXTERNAL_STORAGE permission denied');
            }
          }

          // Check special permissions via native module
          console.log('📱 Checking for special permissions...');
          
          const { AppPermissionScanner } = NativeModules;
          if (AppPermissionScanner && AppPermissionScanner.checkSpecialPermissions) {
            try {
              const specialPerms = await AppPermissionScanner.checkSpecialPermissions();
              console.log('🔍 Special permissions status:', specialPerms);
              
              if (!specialPerms.allPermissionsGranted) {
                console.log('⚠️ Special permissions not fully granted, opening settings...');
                await Linking.openSettings();
                throw new Error('Special permissions not granted. Please grant Usage Access permission in Settings.');
              }
              
              console.log('✅ All special permissions granted');
            } catch (permError) {
              console.warn('⚠️ Could not check special permissions:', permError);
              // Continue anyway - the native module will handle the actual scanning
            }
          }

          // If critical permissions are denied, show settings
          if (storageStatus !== RESULTS.GRANTED) {
            console.log('🔧 Opening settings for permission grant...');
            await Linking.openSettings();
            throw new Error('Required permissions not granted. Please grant Storage permissions in Settings.');
          }

        } catch (permErr) {
          console.error('❌ Permission request failed:', permErr);
          throw new Error(`Permission error: ${permErr.message}`);
        }
      }

      // Check if native module is available
      if (!this.isNativeModuleAvailable()) {
        throw new Error('AppPermissionScanner native module not available. Please rebuild the app with EAS to enable real app permission scanning.');
      }

      // Use React Native's NativeModules to access Android PackageManager
      const { AppPermissionScanner } = NativeModules;
      
      console.log('📱 Native module available, scanning installed apps...');
      
      let result;
      try {
        result = await AppPermissionScanner.scanInstalledApps();
        console.log('✅ Native module scan completed successfully');
      } catch (nativeError) {
        console.error('❌ Native module scan failed:', nativeError);
        
        // Check if it's a permission-related error
        if (nativeError.message && nativeError.message.includes('permission')) {
          throw new Error('Storage permission denied. Please grant all required permissions in Settings.');
        }
        
        // Check if it's a module-related error
        if (nativeError.message && nativeError.message.includes('module')) {
          throw new Error('Native module error. Please rebuild the app with EAS.');
        }
        
        // Generic error
        throw new Error(`Native scan failed: ${nativeError.message}`);
      }
      
      // Transform the native result to our interface
      const apps: AppPermissionInfo[] = result.apps.map((app: any) => this.analyzeAppPermissions(app));

      const riskyAppsCount = apps.filter(app => app.riskLevel !== 'SAFE').length;
      const criticalAppsCount = apps.filter(app => app.riskLevel === 'CRITICAL').length;
      const highRiskAppsCount = apps.filter(app => app.riskLevel === 'HIGH').length;
      const mediumRiskAppsCount = apps.filter(app => app.riskLevel === 'MEDIUM').length;

      console.log(`✅ Real scan complete: ${result.totalApps} apps scanned, ${riskyAppsCount} risky apps found`);
      
      return {
        totalApps: result.totalApps,
        riskyApps: riskyAppsCount,
        criticalApps: criticalAppsCount,
        highRiskApps: highRiskAppsCount,
        mediumRiskApps: mediumRiskAppsCount,
        apps
      };

    } catch (error) {
      console.error('❌ Real app permission scan failed:', error);
      Sentry.captureException(error);
      throw error; // Re-throw to let the calling service handle it
    }
  }

  /**
   * Get detailed information about a specific app
   */
  public async getAppDetails(packageName: string): Promise<AppPermissionInfo> {
    try {
      if (Platform.OS !== 'android') {
        throw new Error('App permission scanning is only available on Android');
      }

      const { AppPermissionScanner } = NativeModules;
      
      if (!AppPermissionScanner) {
        throw new Error('AppPermissionScanner native module not available');
      }

      const app = await AppPermissionScanner.getAppDetails(packageName);
      
      return this.analyzeAppPermissions(app);

    } catch (error) {
      console.error('❌ Failed to get app details:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Analyze app permissions and determine risk level
   */
  private analyzeAppPermissions(app: any): AppPermissionInfo {
    const permissions = app.permissions || [];
    const dangerousPermissions = permissions.filter((p: string) => 
      p.includes('SMS') || p.includes('PHONE') || p.includes('CALL') || 
      p.includes('LOCATION') || p.includes('CAMERA') || p.includes('CONTACTS')
    );
    
    const riskAssessment = this.assessPermissionCombination(permissions);
    
    return {
      packageName: app.packageName,
      appName: app.appName,
      permissions: permissions,
      riskLevel: riskAssessment.riskLevel,
      riskScore: riskAssessment.riskScore,
      dangerousPermissions: dangerousPermissions,
      permissionCategories: this.categorizePermissionsFromList(permissions),
      isSystemApp: app.isSystemApp || false,
      installTime: app.installTime,
      lastUpdateTime: app.lastUpdateTime
    };
  }

  /**
   * Categorize permissions from a list of permission strings
   */
  private categorizePermissionsFromList(permissions: string[]): PermissionCategory[] {
    const categories: { [key: string]: PermissionCategory } = {};
    
    permissions.forEach((permission: string) => {
      const category = this.getPermissionCategory(permission);
      if (!categories[category]) {
        const categoryInfo = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES];
        categories[category] = {
          category,
          permissions: [],
          riskLevel: categoryInfo.riskLevel,
          description: categoryInfo.description,
          icon: categoryInfo.icon
        };
      }
      categories[category].permissions.push(permission);
    });
    
    return Object.values(categories);
  }

  /**
   * Categorize permissions into groups
   */
  private categorizePermissions(dangerousPermissions: any[], normalPermissions: any[]): PermissionCategory[] {
    const categories: { [key: string]: PermissionCategory } = {};
    
    [...dangerousPermissions, ...normalPermissions].forEach((perm: any) => {
      const category = this.getPermissionCategory(perm.permission);
      if (!categories[category]) {
        const categoryInfo = PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES];
        categories[category] = {
          category,
          permissions: [],
          riskLevel: perm.riskLevel,
          description: categoryInfo.description,
          icon: categoryInfo.icon
        };
      }
      categories[category].permissions.push(perm.permission);
    });
    
    return Object.values(categories);
  }

  /**
   * Determine permission category based on permission name
   */
  private getPermissionCategory(permission: string): string {
    if (permission.includes('SMS')) return 'SMS';
    if (permission.includes('PHONE') || permission.includes('CALL')) return 'PHONE';
    if (permission.includes('LOCATION')) return 'LOCATION';
    if (permission.includes('CAMERA')) return 'CAMERA';
    if (permission.includes('CONTACTS')) return 'CONTACTS';
    if (permission.includes('STORAGE')) return 'STORAGE';
    if (permission.includes('INTERNET') || permission.includes('NETWORK')) return 'NETWORK';
    if (permission.includes('AUDIO') || permission.includes('RECORD')) return 'AUDIO';
    return 'OTHER';
  }

  /**
   * Get explanation for a permission
   */
  public getPermissionExplanation(permission: string): string {
    const explanations: { [key: string]: string } = {
      'android.permission.SEND_SMS': 'Allows the app to send SMS messages, which can incur charges',
      'android.permission.READ_SMS': 'Allows the app to read SMS messages, including sensitive information',
      'android.permission.CALL_PHONE': 'Allows the app to make phone calls without user intervention',
      'android.permission.READ_PHONE_STATE': 'Allows the app to access phone number and device information',
      'android.permission.CAMERA': 'Allows the app to take pictures and record videos',
      'android.permission.RECORD_AUDIO': 'Allows the app to record audio',
      'android.permission.ACCESS_FINE_LOCATION': 'Allows the app to access precise location',
      'android.permission.READ_CONTACTS': 'Allows the app to read contact information',
      'android.permission.WRITE_EXTERNAL_STORAGE': 'Allows the app to write to external storage',
      'android.permission.INTERNET': 'Allows the app to access the internet'
    };
    
    return explanations[permission] || 'Unknown permission';
  }

  /**
   * Assess risk of permission combination
   */
  public assessPermissionCombination(permissions: string[]): {
    riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';
    riskScore: number;
    explanation: string;
  } {
    let riskScore = 0;
    let criticalCount = 0;
    let highCount = 0;
    
    permissions.forEach(permission => {
      if (permission.includes('SMS') || permission.includes('CALL_PHONE')) {
        riskScore += 50;
        criticalCount++;
      } else if (permission.includes('CAMERA') || permission.includes('LOCATION') || permission.includes('CONTACTS')) {
        riskScore += 30;
        highCount++;
      } else if (permission.includes('STORAGE') || permission.includes('AUDIO')) {
        riskScore += 20;
      } else {
        riskScore += 5;
      }
    });
    
    let riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE' = 'SAFE';
    let explanation = 'App has safe permissions';
    
    if (criticalCount > 0 || riskScore >= 100) {
      riskLevel = 'CRITICAL';
      explanation = 'App has critical permissions that could be dangerous';
    } else if (highCount >= 2 || riskScore >= 60) {
      riskLevel = 'HIGH';
      explanation = 'App has multiple high-risk permissions';
    } else if (highCount >= 1 || riskScore >= 30) {
      riskLevel = 'MEDIUM';
      explanation = 'App has some potentially risky permissions';
    } else if (riskScore > 0) {
      riskLevel = 'LOW';
      explanation = 'App has minimal risk permissions';
    }
    
    return { riskLevel, riskScore, explanation };
  }

  /**
   * Check if the native module is properly available
   */
  private isNativeModuleAvailable(): boolean {
    try {
      const { AppPermissionScanner } = NativeModules;
      
      if (Platform.OS !== 'android') {
        console.warn('⚠️ App permission scanning only available on Android');
        return false;
      }
      
      if (!AppPermissionScanner) {
        console.warn('⚠️ AppPermissionScanner native module not found');
        return false;
      }
      
      if (typeof AppPermissionScanner.scanInstalledApps !== 'function') {
        console.warn('⚠️ scanInstalledApps() method missing on native module');
        return false;
      }
      
      console.log('✅ AppPermissionScanner native module is available');
      return true;
    } catch (error) {
      console.error('❌ Error checking native module availability:', error);
      return false;
    }
  }
}
