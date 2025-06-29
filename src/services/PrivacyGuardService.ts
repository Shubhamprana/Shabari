import { Alert, DeviceEventEmitter, Linking, Platform } from 'react-native';
import { useSubscriptionStore } from '../stores/subscriptionStore';

// High-risk permissions per doccument-image-file.md specifications
const HIGH_RISK_PERMISSIONS = [
  'android.permission.BIND_ACCESSIBILITY_SERVICE',
  'android.permission.READ_SMS',
  'android.permission.BIND_DEVICE_ADMIN',
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.WRITE_EXTERNAL_STORAGE',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.CAMERA',
  'android.permission.RECORD_AUDIO',
  'android.permission.READ_CONTACTS',
  'android.permission.CALL_PHONE',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.READ_CALL_LOG',
  'android.permission.WRITE_CALL_LOG',
  'android.permission.SEND_SMS',
  'android.permission.RECEIVE_SMS',
];

// Native module interface for app monitoring (would be implemented in native code)
interface PrivacyGuardNativeModule {
  startAppMonitoring: () => Promise<boolean>;
  stopAppMonitoring: () => Promise<boolean>;
  isMonitoringActive: () => Promise<boolean>;
  getInstalledApps: () => Promise<Array<{ packageName: string; appName: string; permissions: string[] }>>;
  checkAppPermissions: (packageName: string) => Promise<string[]>;
  openAppSettings: (packageName: string) => Promise<boolean>;
}

export interface PrivacyGuardCallbacks {
  onSuspiciousAppDetected: (result: { 
    appName: string; 
    packageName: string; 
    permissions: string[]; 
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    details: string;
  }) => void;
  onAppInstalled: (result: { appName: string; packageName: string; isSafe: boolean }) => void;
  onError: (error: string) => void;
  onStatusChange: (isActive: boolean) => void;
}

export class PrivacyGuardService {
  private static instance: PrivacyGuardService;
  private callbacks: PrivacyGuardCallbacks | null = null;
  private isActive: boolean = false;
  private isInitialized: boolean = false;
  private nativeModule: PrivacyGuardNativeModule;
  private eventSubscription: any = null;

  private constructor() {
    this.nativeModule = this.createNativeModuleInterface();
    this.setupEventListeners();
  }

  public static getInstance(): PrivacyGuardService {
    if (!PrivacyGuardService.instance) {
      PrivacyGuardService.instance = new PrivacyGuardService();
    }
    return PrivacyGuardService.instance;
  }

  private createNativeModuleInterface(): PrivacyGuardNativeModule {
    // Mock implementation for development - would be real native module in production
    return {
      startAppMonitoring: async () => {
        console.log('🔒 PrivacyGuardService: Mock native module - starting app monitoring');
        
        if (Platform.OS !== 'android') {
          console.log('⚠️ PrivacyGuardService only supported on Android');
          return false;
        }
        
        // Simulate starting the broadcast receiver for PACKAGE_ADDED intent
        console.log('📡 Registering BroadcastReceiver for android.intent.action.PACKAGE_ADDED');
        
        // Start mock app installation detection for demo
        this.startMockAppDetection();
        
        return true;
      },
      
      stopAppMonitoring: async () => {
        console.log('🔒 PrivacyGuardService: Mock native module - stopping app monitoring');
        this.stopMockAppDetection();
        return true;
      },
      
      isMonitoringActive: async () => {
        return this.isActive;
      },
      
      getInstalledApps: async () => {
        // Mock installed apps data
        return [
          {
            packageName: 'com.whatsapp',
            appName: 'WhatsApp',
            permissions: ['android.permission.CAMERA', 'android.permission.READ_CONTACTS']
          },
          {
            packageName: 'com.suspicious.app',
            appName: 'Suspicious App',
            permissions: ['android.permission.BIND_ACCESSIBILITY_SERVICE', 'android.permission.READ_SMS']
          }
        ];
      },
      
      checkAppPermissions: async (packageName: string) => {
        // Mock permission check
        const mockPermissions = {
          'com.whatsapp': ['android.permission.CAMERA', 'android.permission.READ_CONTACTS'],
          'com.suspicious.app': ['android.permission.BIND_ACCESSIBILITY_SERVICE', 'android.permission.READ_SMS'],
          'com.malware.example': ['android.permission.BIND_DEVICE_ADMIN', 'android.permission.SYSTEM_ALERT_WINDOW', 'android.permission.READ_SMS']
        };
        
        return mockPermissions[packageName as keyof typeof mockPermissions] || [];
      },
      
      openAppSettings: async (packageName: string) => {
        try {
          // Open app settings page
          const settingsUrl = `android.settings.APPLICATION_DETAILS_SETTINGS:${packageName}`;
          const canOpen = await Linking.canOpenURL(settingsUrl);
          if (canOpen) {
            await Linking.openURL(settingsUrl);
            return true;
          }
          return false;
        } catch (error) {
          console.error('❌ Failed to open app settings:', error);
          return false;
        }
      }
    };
  }

  private setupEventListeners(): void {
    try {
      // Listen for new app installation events from native code
      this.eventSubscription = DeviceEventEmitter.addListener(
        'PrivacyGuardAppInstalled',
        this.handleAppInstalled.bind(this)
      );
      
      console.log('✅ PrivacyGuardService: Event listeners setup');
    } catch (error) {
      console.error('❌ PrivacyGuardService: Failed to setup event listeners:', error);
    }
  }

  private async handleAppInstalled(event: { packageName: string; appName?: string }): Promise<void> {
    try {
      const { packageName, appName } = event;
      const displayName = appName || packageName;
      
      console.log('🔒 PrivacyGuardService: New app installed:', displayName);
      
      // Get permissions for the newly installed app
      const permissions = await this.nativeModule.checkAppPermissions(packageName);
      
      console.log('🔍 PrivacyGuardService: Analyzing permissions for', displayName, ':', permissions);
      
      // Analyze permissions per doccument-image-file.md logic
      const analysis = this.analyzePermissions(permissions);
      
      // Notify that an app was installed
      if (this.callbacks) {
        this.callbacks.onAppInstalled({
          appName: displayName,
          packageName,
          isSafe: analysis.riskLevel !== 'HIGH'
        });
      }
      
      if (analysis.riskLevel === 'HIGH') {
        // CRITICAL ALERT: High-risk permissions detected
        console.log('🚨 PrivacyGuardService: HIGH RISK app detected:', displayName);
        
        if (this.callbacks) {
          this.callbacks.onSuspiciousAppDetected({
            appName: displayName,
            packageName,
            permissions: analysis.dangerousPermissions,
            riskLevel: analysis.riskLevel,
            details: analysis.details
          });
        }
        
        // Show critical alert per doccument-image-file.md specifications
        await this.showCriticalAlert(displayName, packageName, analysis);
      } else if (analysis.riskLevel === 'MEDIUM') {
        // Medium risk - show warning but not critical alert
        console.log('⚠️ PrivacyGuardService: Medium risk app detected:', displayName);
        
        if (this.callbacks) {
          this.callbacks.onSuspiciousAppDetected({
            appName: displayName,
            packageName,
            permissions: analysis.dangerousPermissions,
            riskLevel: analysis.riskLevel,
            details: analysis.details
          });
        }
        
        Alert.alert(
          '⚠️ Privacy Warning',
          `The app '${displayName}' has requested some sensitive permissions.\n\n${analysis.details}\n\nReview the app's permissions if you're unsure about its trustworthiness.`,
          [
            {
              text: 'Review App',
              onPress: () => this.nativeModule.openAppSettings(packageName)
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
      } else {
        console.log('✅ PrivacyGuardService: App appears safe:', displayName);
      }
      
    } catch (error) {
      console.error('❌ PrivacyGuardService: Error handling app installation:', error);
      if (this.callbacks) {
        this.callbacks.onError('Failed to analyze newly installed app');
      }
    }
  }

  private analyzePermissions(permissions: string[]): {
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    dangerousPermissions: string[];
    details: string;
  } {
    const dangerousPermissions = permissions.filter(permission => 
      HIGH_RISK_PERMISSIONS.includes(permission)
    );
    
    // Categorize risk level based on dangerous permissions
    const criticalPermissions = [
      'android.permission.BIND_ACCESSIBILITY_SERVICE',
      'android.permission.BIND_DEVICE_ADMIN',
      'android.permission.SYSTEM_ALERT_WINDOW'
    ];
    
    const hasCriticalPermissions = dangerousPermissions.some(permission =>
      criticalPermissions.includes(permission)
    );
    
    if (hasCriticalPermissions) {
      return {
        riskLevel: 'HIGH',
        dangerousPermissions,
        details: `This app requests dangerous permissions that could grant it full device control. Critical permissions: ${dangerousPermissions.join(', ')}`
      };
    } else if (dangerousPermissions.length >= 3) {
      return {
        riskLevel: 'HIGH', 
        dangerousPermissions,
        details: `This app requests multiple sensitive permissions (${dangerousPermissions.length}), which is highly suspicious.`
      };
    } else if (dangerousPermissions.length > 0) {
      return {
        riskLevel: 'MEDIUM',
        dangerousPermissions,
        details: `This app requests some sensitive permissions: ${dangerousPermissions.join(', ')}`
      };
    } else {
      return {
        riskLevel: 'LOW',
        dangerousPermissions: [],
        details: 'This app appears to use standard permissions only.'
      };
    }
  }

  private async showCriticalAlert(appName: string, packageName: string, analysis: any): Promise<void> {
    try {
      // Critical alert per doccument-image-file.md specifications
      Alert.alert(
        '🔒 CRITICAL SECURITY ALERT 🔒',
        `The new app '${appName}' is requesting dangerous permissions that could grant it full device control. This is highly suspicious.\n\n${analysis.details}\n\n⚠️ RECOMMENDATION: Uninstall this app immediately unless you trust it completely.`,
        [
          {
            text: 'Uninstall App',
            style: 'destructive',
            onPress: async () => {
              // Take user to app settings for uninstallation
              const success = await this.nativeModule.openAppSettings(packageName);
              if (success) {
                Alert.alert(
                  '📱 App Settings Opened',
                  'Tap "Uninstall" to remove this potentially dangerous app from your device.',
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert(
                  '❌ Settings Error',
                  'Unable to open app settings. Please manually uninstall the app from your device settings.',
                  [{ text: 'OK' }]
                );
              }
            }
          },
          {
            text: 'View Permissions',
            onPress: async () => {
              Alert.alert(
                '🔍 Dangerous Permissions',
                `'${appName}' has requested these dangerous permissions:\n\n${analysis.dangerousPermissions.map((p: string) => `• ${p.split('.').pop()}`).join('\n')}\n\nThese permissions could allow the app to:\n• Access all your messages\n• Control your device completely\n• Monitor your activity\n• Access admin functions`,
                [
                  {
                    text: 'Uninstall App',
                    style: 'destructive',
                    onPress: () => this.nativeModule.openAppSettings(packageName)
                  },
                  {
                    text: 'Keep App (Risky)',
                    style: 'cancel'
                  }
                ]
              );
            }
          },
          {
            text: 'Keep App (Risky)',
            style: 'cancel'
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ PrivacyGuardService: Failed to show critical alert:', error);
    }
  }

  public async initialize(callbacks: PrivacyGuardCallbacks): Promise<boolean> {
    try {
      console.log('🔒 PrivacyGuardService: Initializing...');
      
      // Check if user has premium subscription
      const { isPremium } = useSubscriptionStore.getState();
      if (!isPremium) {
        console.log('⚠️ PrivacyGuardService: Premium subscription required');
        return false;
      }
      
      // Check if feature is enabled in user preferences
      try {
        const { useFeaturePermissionStore } = await import('../stores/featurePermissionStore');
        const { getFeatureStatus } = useFeaturePermissionStore.getState();
        const featureStatus = getFeatureStatus('privacy_guard');
        
        if (!featureStatus.isEnabled) {
          console.log('⚠️ PrivacyGuardService: Feature disabled by user preferences');
          return false;
        }
        
        if (!featureStatus.hasPermissions) {
          console.log('⚠️ PrivacyGuardService: Required permissions not granted');
          return false;
        }
      } catch (error) {
        console.log('⚠️ PrivacyGuardService: Feature permission check failed, proceeding with default behavior');
      }
      
      this.callbacks = callbacks;
      
      // Check platform compatibility
      if (Platform.OS !== 'android') {
        console.log('⚠️ PrivacyGuardService: Only supported on Android');
        return false;
      }
      
      this.isInitialized = true;
      console.log('✅ PrivacyGuardService: Initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ PrivacyGuardService: Initialization failed:', error);
      if (this.callbacks) {
        this.callbacks.onError('Failed to initialize PrivacyGuardService: ' + error);
      }
      return false;
    }
  }

  /**
   * Check if user has premium subscription
   */
  private isPremiumUser(): boolean {
    return useSubscriptionStore.getState().isPremium;
  }

  public async startMonitoring(): Promise<boolean> {
    if (!this.isInitialized) {
      console.log('❌ PrivacyGuardService: Service not initialized');
      return false;
    }

    // Check premium subscription for automatic monitoring
    if (!this.isPremiumUser()) {
      console.log('🔒 PrivacyGuardService: Automatic monitoring requires Premium subscription');
      
      if (this.callbacks) {
        this.callbacks.onError('Automatic app monitoring requires Premium subscription. Upgrade to enable real-time protection.');
      }
      
      return false;
    }

    if (this.isActive) {
      console.log('✅ PrivacyGuardService: Already monitoring');
      return true;
    }

    try {
      console.log('🛡️ PrivacyGuardService: Starting automatic app monitoring...');
      
      const success = await this.nativeModule.startAppMonitoring();
      
      if (success) {
        this.isActive = true;
        
        if (this.callbacks) {
          this.callbacks.onStatusChange(true);
        }
        
        console.log('✅ PrivacyGuardService: Automatic monitoring started successfully');
        
        // Show confirmation for premium users
        Alert.alert(
          '🛡️ Premium Protection Active',
          'Automatic app monitoring is now active. We\'ll alert you about suspicious apps in real-time.',
          [{ text: 'Great!' }]
        );
        
        return true;
      } else {
        console.log('❌ PrivacyGuardService: Failed to start monitoring');
        return false;
      }
    } catch (error) {
      console.error('❌ PrivacyGuardService: Error starting monitoring:', error);
      
      if (this.callbacks) {
        this.callbacks.onError('Failed to start app monitoring');
      }
      
      return false;
    }
  }

  public async stopMonitoring(): Promise<boolean> {
    try {
      console.log('🔒 PrivacyGuardService: Stopping app monitoring...');
      
      const success = await this.nativeModule.stopAppMonitoring();
      
      if (success) {
        this.isActive = false;
        console.log('✅ PrivacyGuardService: App monitoring stopped');
        
        if (this.callbacks) {
          this.callbacks.onStatusChange(false);
        }
        
        Alert.alert(
          '🔓 App Monitoring Deactivated',
          'App installation monitoring has been turned off. You will no longer receive alerts for new app installations.',
          [{ text: 'OK' }]
        );
        
        return true;
      } else {
        throw new Error('Failed to stop native service');
      }
    } catch (error) {
      console.error('❌ PrivacyGuardService: Failed to stop monitoring:', error);
      if (this.callbacks) {
        this.callbacks.onError('Failed to stop app monitoring: ' + error);
      }
      return false;
    }
  }

  public async scanInstalledApps(): Promise<void> {
    try {
      console.log('🔍 PrivacyGuardService: Scanning installed apps...');
      
      const installedApps = await this.nativeModule.getInstalledApps();
      
      let suspiciousApps = 0;
      
      for (const app of installedApps) {
        const analysis = this.analyzePermissions(app.permissions);
        
        if (analysis.riskLevel === 'HIGH') {
          suspiciousApps++;
          console.log('🚨 Suspicious app found:', app.appName);
          
          if (this.callbacks) {
            this.callbacks.onSuspiciousAppDetected({
              appName: app.appName,
              packageName: app.packageName,
              permissions: analysis.dangerousPermissions,
              riskLevel: analysis.riskLevel,
              details: analysis.details
            });
          }
        }
      }
      
      Alert.alert(
        '🔍 App Scan Complete',
        suspiciousApps === 0 
          ? `Scanned ${installedApps.length} apps. No suspicious apps found.`
          : `Scanned ${installedApps.length} apps. Found ${suspiciousApps} apps with suspicious permissions.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ PrivacyGuardService: Failed to scan installed apps:', error);
      if (this.callbacks) {
        this.callbacks.onError('Failed to scan installed apps');
      }
    }
  }

  public getServiceStatus(): { 
    isActive: boolean; 
    isInitialized: boolean; 
    isPremiumRequired: boolean;
    isPremiumUser: boolean;
    automaticMonitoringAvailable: boolean;
  } {
    const isPremium = this.isPremiumUser();
    return {
      isActive: this.isActive,
      isInitialized: this.isInitialized,
      isPremiumRequired: true, // Automatic monitoring requires premium
      isPremiumUser: isPremium,
      automaticMonitoringAvailable: isPremium,
    };
  }

  /**
   * Manual app scan - available for free users
   */
  public async scanInstalledAppsManual(): Promise<{
    totalApps: number;
    suspiciousApps: Array<{
      appName: string;
      packageName: string;
      riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
      permissions: string[];
      details: string;
    }>;
  }> {
    try {
      console.log('🔍 PrivacyGuardService: Starting manual app scan...');
      
      const apps = await this.nativeModule.getInstalledApps();
      const suspiciousApps: any[] = [];
      
      for (const app of apps) {
        const permissions = await this.nativeModule.checkAppPermissions(app.packageName);
        const analysis = this.analyzePermissions(permissions);
        
        if (analysis.riskLevel === 'HIGH' || analysis.riskLevel === 'MEDIUM') {
          suspiciousApps.push({
            appName: app.appName,
            packageName: app.packageName,
            riskLevel: analysis.riskLevel,
            permissions: analysis.dangerousPermissions,
            details: analysis.details
          });
        }
      }
      
      console.log(`🔍 PrivacyGuardService: Manual scan complete. Found ${suspiciousApps.length} suspicious apps out of ${apps.length} total apps`);
      
      return {
        totalApps: apps.length,
        suspiciousApps
      };
      
    } catch (error) {
      console.error('❌ PrivacyGuardService: Manual scan failed:', error);
      throw error;
    }
  }

  // Mock app installation detection for demo purposes
  private mockAppDetectionInterval: any = null;
  
  private startMockAppDetection(): void {
    // Simulate app installations for demo
    this.mockAppDetectionInterval = setInterval(() => {
      // Simulate new app installation 5% of the time
      if (Math.random() < 0.05) {
        const mockApps = [
          { packageName: 'com.legitimate.app', appName: 'Photo Editor' },
          { packageName: 'com.suspicious.app', appName: 'Free VPN Pro' },
          { packageName: 'com.malware.example', appName: 'System Optimizer' },
          { packageName: 'com.game.puzzle', appName: 'Puzzle Game' },
        ];
        
        const randomApp = mockApps[Math.floor(Math.random() * mockApps.length)];
        
        console.log('🎭 PrivacyGuardService: Mock app installation ->', randomApp.appName);
        
        // Emit the app installation event
        DeviceEventEmitter.emit('PrivacyGuardAppInstalled', randomApp);
      }
    }, 20000); // Check every 20 seconds for demo
  }
  
  private stopMockAppDetection(): void {
    if (this.mockAppDetectionInterval) {
      clearInterval(this.mockAppDetectionInterval);
      this.mockAppDetectionInterval = null;
    }
  }

  public cleanup(): void {
    try {
      this.stopMonitoring();
      
      if (this.eventSubscription) {
        this.eventSubscription.remove();
        this.eventSubscription = null;
      }
      
      this.stopMockAppDetection();
      
      this.callbacks = null;
      this.isInitialized = false;
      this.isActive = false;
      
      console.log('✅ PrivacyGuardService: Cleaned up');
    } catch (error) {
      console.error('❌ PrivacyGuardService: Cleanup error:', error);
    }
  }
}

// Export singleton instance
export const privacyGuardService = PrivacyGuardService.getInstance(); 