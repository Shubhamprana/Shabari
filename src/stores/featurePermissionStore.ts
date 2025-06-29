import { Alert, Platform } from 'react-native';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define all premium features that can be controlled
export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  category: 'protection' | 'monitoring' | 'analysis' | 'automation';
  icon: string;
  isSystemCritical: boolean; // Some features might be critical and can't be disabled
  requiresPermissions: string[]; // Android permissions needed
  batteryImpact: 'low' | 'medium' | 'high';
  dataUsage: 'none' | 'low' | 'medium' | 'high';
}

export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: 'privacy_guard',
    name: 'Privacy Guard',
    description: 'Monitor app installations and permission changes in real-time',
    category: 'monitoring',
    icon: '🛡️',
    isSystemCritical: false,
    requiresPermissions: ['QUERY_ALL_PACKAGES', 'PACKAGE_USAGE_STATS'],
    batteryImpact: 'medium',
    dataUsage: 'low'
  },
  {
    id: 'watchdog_protection',
    name: 'Watchdog File Protection',
    description: 'Real-time monitoring of 8+ directories for malicious files',
    category: 'protection',
    icon: '🔍',
    isSystemCritical: false,
    requiresPermissions: ['READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE'],
    batteryImpact: 'high',
    dataUsage: 'medium'
  },
  {
    id: 'clipboard_monitor',
    name: 'Clipboard URL Monitor',
    description: 'Automatically scan URLs copied to clipboard',
    category: 'automation',
    icon: '📋',
    isSystemCritical: false,
    requiresPermissions: [],
    batteryImpact: 'low',
    dataUsage: 'medium'
  },
  {
    id: 'otp_insight_pro',
    name: 'OTP Insight Pro',
    description: 'AI-powered SMS fraud detection with ML analysis',
    category: 'analysis',
    icon: '🧠',
    isSystemCritical: false,
    requiresPermissions: ['READ_SMS', 'RECEIVE_SMS'],
    batteryImpact: 'medium',
    dataUsage: 'high'
  },
  {
    id: 'ml_fraud_detection',
    name: 'ML Fraud Detection',
    description: 'Advanced machine learning threat analysis',
    category: 'analysis',
    icon: '🤖',
    isSystemCritical: false,
    requiresPermissions: [],
    batteryImpact: 'medium',
    dataUsage: 'high'
  },
  {
    id: 'background_monitoring',
    name: 'Background Monitoring',
    description: 'Continuous security monitoring while app is closed',
    category: 'monitoring',
    icon: '⚡',
    isSystemCritical: true, // Critical for security
    requiresPermissions: ['FOREGROUND_SERVICE', 'WAKE_LOCK'],
    batteryImpact: 'high',
    dataUsage: 'low'
  },
  {
    id: 'advanced_notifications',
    name: 'Advanced Notifications',
    description: 'Rich threat alerts with detailed analysis',
    category: 'automation',
    icon: '🔔',
    isSystemCritical: false,
    requiresPermissions: ['POST_NOTIFICATIONS'],
    batteryImpact: 'low',
    dataUsage: 'low'
  },
  {
    id: 'context_rules',
    name: 'Context & Frequency Rules',
    description: 'Smart behavior analysis and attack pattern detection',
    category: 'analysis',
    icon: '📊',
    isSystemCritical: false,
    requiresPermissions: [],
    batteryImpact: 'low',
    dataUsage: 'medium'
  },
  {
    id: 'yara_local_detection',
    name: 'YARA Local Detection',
    description: 'Advanced local malware detection with 127+ detection rules',
    category: 'protection',
    icon: '🛡️',
    isSystemCritical: false,
    requiresPermissions: ['READ_EXTERNAL_STORAGE'],
    batteryImpact: 'low',
    dataUsage: 'none'
  },
  {
    id: 'virustotal_cloud_scanning',
    name: 'VirusTotal Cloud Scanning',
    description: 'Cloud-based threat detection with VirusTotal API (privacy-protected)',
    category: 'protection',
    icon: '☁️',
    isSystemCritical: false,
    requiresPermissions: ['INTERNET'],
    batteryImpact: 'low',
    dataUsage: 'medium'
  },
  {
    id: 'live_qr_scanner',
    name: 'Live QR Scanner',
    description: 'Real-time camera QR code scanning with fraud detection',
    category: 'protection',
    icon: '📷',
    isSystemCritical: false,
    requiresPermissions: ['CAMERA'],
    batteryImpact: 'medium',
    dataUsage: 'low'
  }
];

interface FeaturePermissionState {
  // Feature states
  enabledFeatures: Record<string, boolean>;
  permissionStatus: Record<string, 'granted' | 'denied' | 'pending' | 'not_requested'>;
  
  // User preferences
  batteryOptimizationMode: 'performance' | 'balanced' | 'battery_saver';
  dataUsageMode: 'unlimited' | 'limited' | 'wifi_only';
  
  // State management
  isInitialized: boolean;
  isLoading: boolean;
  lastUpdated: string | null;
  
  // Actions
  initializeFeaturePermissions: () => Promise<void>;
  toggleFeature: (featureId: string) => Promise<boolean>;
  requestFeaturePermissions: (featureId: string) => Promise<boolean>;
  updateBatteryMode: (mode: 'performance' | 'balanced' | 'battery_saver') => void;
  updateDataUsageMode: (mode: 'unlimited' | 'limited' | 'wifi_only') => void;
  getFeatureStatus: (featureId: string) => {
    isEnabled: boolean;
    canEnable: boolean;
    hasPermissions: boolean;
    feature: PremiumFeature | undefined;
  };
  resetToDefaults: () => void;
  exportSettings: () => string;
  importSettings: (settings: string) => Promise<boolean>;
}

export const useFeaturePermissionStore = create<FeaturePermissionState>()(
  persist(
    (set, get) => ({
      // Initial state
      enabledFeatures: {},
      permissionStatus: {},
      batteryOptimizationMode: 'balanced',
      dataUsageMode: 'unlimited',
      isInitialized: false,
      isLoading: false,
      lastUpdated: null,

      initializeFeaturePermissions: async () => {
        set({ isLoading: true });
        
        try {
          console.log('🔧 Initializing feature permissions...');
          
          // Check subscription status
          const { useSubscriptionStore } = await import('./subscriptionStore');
          const { isPremium } = useSubscriptionStore.getState();
          
          if (!isPremium) {
            console.log('⚠️ User not premium - skipping feature permission initialization');
            set({ isLoading: false });
            return;
          }
          
          const currentState = get();
          const newEnabledFeatures = { ...currentState.enabledFeatures };
          const newPermissionStatus = { ...currentState.permissionStatus };
          
          // Initialize default states for new features
          PREMIUM_FEATURES.forEach(feature => {
            // Set default enabled state if not already set
            if (!(feature.id in newEnabledFeatures)) {
              // Critical features enabled by default, others disabled for user control
              newEnabledFeatures[feature.id] = feature.isSystemCritical;
            }
            
            // Initialize permission status if not set
            if (!(feature.id in newPermissionStatus)) {
              newPermissionStatus[feature.id] = 'not_requested';
            }
          });
          
          set({
            enabledFeatures: newEnabledFeatures,
            permissionStatus: newPermissionStatus,
            isInitialized: true,
            isLoading: false,
            lastUpdated: new Date().toISOString()
          });
          
          console.log('✅ Feature permissions initialized');
          
        } catch (error) {
          console.error('❌ Failed to initialize feature permissions:', error);
          set({ isLoading: false });
        }
      },

      toggleFeature: async (featureId: string) => {
        const feature = PREMIUM_FEATURES.find(f => f.id === featureId);
        if (!feature) {
          console.error('❌ Unknown feature:', featureId);
          return false;
        }
        
        const currentState = get();
        const isCurrentlyEnabled = currentState.enabledFeatures[featureId];
        
        // If trying to enable, check permissions first
        if (!isCurrentlyEnabled) {
          const hasPermissions = await get().requestFeaturePermissions(featureId);
          if (!hasPermissions) {
            return false;
          }
        }
        
        // If trying to disable a critical feature, warn user
        if (isCurrentlyEnabled && feature.isSystemCritical) {
          return new Promise((resolve) => {
            Alert.alert(
              '⚠️ Critical Security Feature',
              `${feature.name} is critical for your security. Disabling it may leave your device vulnerable. Are you sure?`,
              [
                {
                  text: 'Keep Enabled',
                  onPress: () => resolve(false),
                  style: 'cancel'
                },
                {
                  text: 'Disable Anyway',
                  onPress: () => {
                    set({
                      enabledFeatures: {
                        ...currentState.enabledFeatures,
                        [featureId]: false
                      },
                      lastUpdated: new Date().toISOString()
                    });
                    console.log(`⚠️ Critical feature ${feature.name} disabled by user`);
                    resolve(true);
                  },
                  style: 'destructive'
                }
              ]
            );
          });
        }
        
        // Toggle the feature
        set({
          enabledFeatures: {
            ...currentState.enabledFeatures,
            [featureId]: !isCurrentlyEnabled
          },
          lastUpdated: new Date().toISOString()
        });
        
        console.log(`${!isCurrentlyEnabled ? '✅' : '❌'} Feature ${feature.name} ${!isCurrentlyEnabled ? 'enabled' : 'disabled'}`);
        return true;
      },

      requestFeaturePermissions: async (featureId: string) => {
        const feature = PREMIUM_FEATURES.find(f => f.id === featureId);
        if (!feature) return false;
        
        console.log(`🔐 Requesting permissions for ${feature.name}...`);
        
        // On web/Expo Go, simulate permission grant
        if (Platform.OS === 'web' || __DEV__) {
          set({
            permissionStatus: {
              ...get().permissionStatus,
              [featureId]: 'granted'
            }
          });
          return true;
        }
        
        // For actual Android permissions, you would integrate with expo-permissions
        // or react-native-permissions here
        try {
          // Simulate permission request
          const granted = await new Promise<boolean>((resolve) => {
            Alert.alert(
              `🔐 ${feature.name} Permissions`,
              `${feature.name} needs the following permissions:\n\n${feature.requiresPermissions.map(p => `• ${p.replace(/_/g, ' ')}`).join('\n')}\n\nBattery Impact: ${feature.batteryImpact.toUpperCase()}\nData Usage: ${feature.dataUsage.toUpperCase()}`,
              [
                {
                  text: 'Deny',
                  onPress: () => resolve(false),
                  style: 'cancel'
                },
                {
                  text: 'Grant Permissions',
                  onPress: () => resolve(true)
                }
              ]
            );
          });
          
          set({
            permissionStatus: {
              ...get().permissionStatus,
              [featureId]: granted ? 'granted' : 'denied'
            }
          });
          
          return granted;
          
        } catch (error) {
          console.error('❌ Permission request failed:', error);
          set({
            permissionStatus: {
              ...get().permissionStatus,
              [featureId]: 'denied'
            }
          });
          return false;
        }
      },

      updateBatteryMode: (mode) => {
        set({ 
          batteryOptimizationMode: mode,
          lastUpdated: new Date().toISOString()
        });
        
        // Auto-adjust features based on battery mode
        const currentState = get();
        const newEnabledFeatures = { ...currentState.enabledFeatures };
        
        if (mode === 'battery_saver') {
          // Disable high-impact features
          PREMIUM_FEATURES.forEach(feature => {
            if (feature.batteryImpact === 'high' && !feature.isSystemCritical) {
              newEnabledFeatures[feature.id] = false;
            }
          });
          
          Alert.alert(
            '🔋 Battery Saver Mode',
            'High battery impact features have been disabled to preserve battery life.',
            [{ text: 'OK' }]
          );
        }
        
        set({ enabledFeatures: newEnabledFeatures });
        console.log(`🔋 Battery mode updated to: ${mode}`);
      },

      updateDataUsageMode: (mode) => {
        set({ 
          dataUsageMode: mode,
          lastUpdated: new Date().toISOString()
        });
        
        // Auto-adjust features based on data usage mode
        const currentState = get();
        const newEnabledFeatures = { ...currentState.enabledFeatures };
        
        if (mode === 'limited' || mode === 'wifi_only') {
          // Disable high data usage features
          PREMIUM_FEATURES.forEach(feature => {
            if (feature.dataUsage === 'high' && !feature.isSystemCritical) {
              newEnabledFeatures[feature.id] = false;
            }
          });
          
          Alert.alert(
            '📶 Data Usage Limited',
            'High data usage features have been disabled to preserve your data allowance.',
            [{ text: 'OK' }]
          );
        }
        
        set({ enabledFeatures: newEnabledFeatures });
        console.log(`📶 Data usage mode updated to: ${mode}`);
      },

      getFeatureStatus: (featureId: string) => {
        const currentState = get();
        const feature = PREMIUM_FEATURES.find(f => f.id === featureId);
        const isEnabled = currentState.enabledFeatures[featureId] || false;
        const permissionStatus = currentState.permissionStatus[featureId] || 'not_requested';
        const hasPermissions = permissionStatus === 'granted';
        
        return {
          isEnabled,
          canEnable: hasPermissions || permissionStatus === 'not_requested',
          hasPermissions,
          feature
        };
      },

      resetToDefaults: () => {
        const defaultEnabledFeatures: Record<string, boolean> = {};
        const defaultPermissionStatus: Record<string, 'granted' | 'denied' | 'pending' | 'not_requested'> = {};
        
        PREMIUM_FEATURES.forEach(feature => {
          defaultEnabledFeatures[feature.id] = feature.isSystemCritical;
          defaultPermissionStatus[feature.id] = 'not_requested';
        });
        
        set({
          enabledFeatures: defaultEnabledFeatures,
          permissionStatus: defaultPermissionStatus,
          batteryOptimizationMode: 'balanced',
          dataUsageMode: 'unlimited',
          lastUpdated: new Date().toISOString()
        });
        
        console.log('🔄 Feature permissions reset to defaults');
      },

      exportSettings: () => {
        const currentState = get();
        const settings = {
          enabledFeatures: currentState.enabledFeatures,
          batteryOptimizationMode: currentState.batteryOptimizationMode,
          dataUsageMode: currentState.dataUsageMode,
          exportedAt: new Date().toISOString()
        };
        
        return JSON.stringify(settings, null, 2);
      },

      importSettings: async (settingsJson: string) => {
        try {
          const settings = JSON.parse(settingsJson);
          
          if (!settings.enabledFeatures) {
            throw new Error('Invalid settings format');
          }
          
          set({
            enabledFeatures: settings.enabledFeatures,
            batteryOptimizationMode: settings.batteryOptimizationMode || 'balanced',
            dataUsageMode: settings.dataUsageMode || 'unlimited',
            lastUpdated: new Date().toISOString()
          });
          
          console.log('✅ Settings imported successfully');
          return true;
          
        } catch (error) {
          console.error('❌ Failed to import settings:', error);
          return false;
        }
      }
    }),
    {
      name: 'shabari-feature-permissions',
      partialize: (state) => ({
        enabledFeatures: state.enabledFeatures,
        permissionStatus: state.permissionStatus,
        batteryOptimizationMode: state.batteryOptimizationMode,
        dataUsageMode: state.dataUsageMode,
        lastUpdated: state.lastUpdated
      })
    }
  )
);

// Initialize feature permissions when subscription changes
if (typeof window !== 'undefined') {
  setTimeout(async () => {
    try {
      const { useSubscriptionStore } = await import('./subscriptionStore');
      useSubscriptionStore.subscribe((state, prevState) => {
        // When user upgrades to premium, initialize feature permissions
        if (!prevState.isPremium && state.isPremium) {
          console.log('🔧 User upgraded to premium - initializing feature permissions');
          useFeaturePermissionStore.getState().initializeFeaturePermissions();
        }
        
        // When user downgrades from premium, reset permissions
        if (prevState.isPremium && !state.isPremium) {
          console.log('📉 User downgraded from premium - resetting feature permissions');
          useFeaturePermissionStore.setState({
            enabledFeatures: {},
            permissionStatus: {},
            isInitialized: false
          });
        }
      });
    } catch (error) {
      console.error('Error setting up feature permission sync:', error);
    }
  }, 100);
} 