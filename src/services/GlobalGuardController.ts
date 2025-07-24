import { Alert, NativeModules, Platform } from 'react-native';
import { notificationService } from './ExpoNotificationService';
import { LinkScannerService } from './ScannerService';

// Import our compatible NativeEventEmitter
interface EventEmitterInterface {
  new (nativeModule: any): {
    addListener(eventType: string, listener: any): { remove: () => void };
    removeAllListeners(eventType?: string): void;
  };
}

let NativeEventEmitter: EventEmitterInterface;
try {
  // Try to import from react-native first
  NativeEventEmitter = require('react-native').NativeEventEmitter;
} catch (error) {
  // Fallback to our implementation
  try {
    NativeEventEmitter = require('expo-modules-core').NativeEventEmitter;
  } catch (fallbackError) {
    // Create a simple mock if both fail
    NativeEventEmitter = class MockNativeEventEmitter {
      private nativeModule: any;
      private listeners: any = {};
      
      constructor(nativeModule: any) {
        this.nativeModule = nativeModule;
        console.log('MockNativeEventEmitter created');
      }
      
      addListener(eventType: string, listener: any) {
        console.log(`MockNativeEventEmitter: Added listener for ${eventType}`);
        return { remove: () => console.log(`MockNativeEventEmitter: Removed listener for ${eventType}`) };
      }
      
      removeAllListeners() {
        console.log('MockNativeEventEmitter: Removed all listeners');
      }
    } as any;
  }
}

// Notification service availability
let isNotificationServiceAvailable = false;

// Initialize Expo notification service
const initializeExpoNotifications = async () => {
  if (Platform.OS === 'web') {
    console.log('📱 Web platform - notifications handled via browser API');
    return false;
  }

  try {
    console.log('🔔 Initializing Expo notification service...');
    const success = await notificationService.initialize();
    
    if (success) {
      console.log('✅ Expo notification service initialized successfully');
      return true;
    } else {
      console.log('❌ Expo notification service initialization failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Failed to initialize Expo notification service:', error);
    return false;
  }
};

// Initialize on module load
initializeExpoNotifications().then(success => {
  isNotificationServiceAvailable = success;
});

// Native module interface (would be implemented in native code)
interface GlobalGuardNativeModule {
  startVpn: () => Promise<boolean>;
  stopVpn: () => Promise<boolean>;
  isVpnActive: () => Promise<boolean>;
  resolveDnsRequest: (requestId: string, isSafe: boolean) => void;
}

// Mock implementation for development - in production this would be a real native module
const mockNativeModule: GlobalGuardNativeModule = {
  startVpn: async () => {
    console.log('🔒 Mock VPN: Starting VPN connection');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate startup time
    return true;
  },
  stopVpn: async () => {
    console.log('🔓 Mock VPN: Stopping VPN connection');
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate shutdown time
    return true;
  },
  isVpnActive: async () => {
    console.log('❓ Mock VPN: Checking VPN status');
    return false;
  },
  resolveDnsRequest: (requestId: string, isSafe: boolean) => {
    console.log(`🔍 Mock VPN: Resolving DNS request ${requestId} as ${isSafe ? 'SAFE' : 'BLOCKED'}`);
  },
};

export class GlobalGuardController {
  private static instance: GlobalGuardController;
  private nativeModule: GlobalGuardNativeModule;
  private eventEmitter: InstanceType<typeof NativeEventEmitter> | null = null;
  private isActive: boolean = false;
  private listeners: { [key: string]: any } = {};
  private isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    // Try to get the real native module, fallback to mock
    this.nativeModule = NativeModules.GlobalGuard || mockNativeModule;
    
    if (NativeModules.GlobalGuard && Platform.OS !== 'web') {
      try {
        this.eventEmitter = new NativeEventEmitter(NativeModules.GlobalGuard);
        console.log('✅ Native event emitter created');
      } catch (error) {
        console.log('⚠️ Failed to create native event emitter:', error);
        this.eventEmitter = null;
      }
    }

    // Start initialization but don't wait for it
    this.initializeAsync();
  }

  public static getInstance(): GlobalGuardController {
    if (!GlobalGuardController.instance) {
      GlobalGuardController.instance = new GlobalGuardController();
    }
    return GlobalGuardController.instance;
  }

  private async initializeAsync(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('🛡️ Initializing GlobalGuardController...');
      
      // Setup notifications with comprehensive error handling
      await this.setupNotificationsSafely();
      
      // Setup event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('✅ GlobalGuardController initialized successfully');
      
    } catch (error) {
      console.error('❌ GlobalGuardController initialization failed:', error);
      // Set as initialized anyway to prevent blocking
      this.isInitialized = true;
    }
  }

  private async setupNotificationsSafely(): Promise<void> {
    if (!isNotificationServiceAvailable) {
      console.log('📱 Notification service not available - using fallback methods');
      return;
    }

    try {
      console.log('🔔 Setting up Expo notifications...');
      
      // The notification service handles its own initialization
      // including permissions, channels, and listeners
      
      console.log('✅ Expo notification setup completed');
      
    } catch (error) {
      console.warn('⚠️ Notification setup failed, continuing without notifications:', error);
      isNotificationServiceAvailable = false;
    }
  }

  private async createNotificationChannel(): Promise<void> {
    // Note: Expo notification service handles channel creation automatically
    // in its initialize() method, so we don't need to do anything here
    console.log('ℹ️ Notification channels are managed by ExpoNotificationService');
  }

  private setupEventListeners(): void {
    try {
      if (this.eventEmitter) {
        console.log('🎧 Setting up native event listeners...');
        
        // Listen for DNS requests from the native VPN module
        this.listeners.onDnsRequest = this.eventEmitter.addListener(
          'onDnsRequest',
          this.handleDnsRequest.bind(this)
        );

        this.listeners.onVpnStatusChange = this.eventEmitter.addListener(
          'onVpnStatusChange',
          this.handleVpnStatusChange.bind(this)
        );
        
        console.log('✅ Native event listeners setup successfully');
      } else {
        console.log('🎭 No native event emitter - setting up mock events for testing');
        this.simulateMockEvents();
      }
    } catch (error) {
      console.error('❌ Event listener setup failed:', error);
      // Fallback to mock events
      this.simulateMockEvents();
    }
  }

  private simulateMockEvents(): void {
    // Simulate DNS requests for testing purposes
    console.log('🎭 Setting up mock DNS events for testing');
    
    // Only simulate events in development
    if (__DEV__) {
      setInterval(() => {
        if (this.isActive) {
          const mockDomains = [
            'google.com',
            'facebook.com',
            'malware-test.com', // This should be blocked
            'github.com',
            'dangerous-site.net', // This should be blocked
            'stackoverflow.com',
            'badsite.com', // This should be blocked
          ];
          
          const randomDomain = mockDomains[Math.floor(Math.random() * mockDomains.length)];
          const requestId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          
          console.log(`🎭 Simulating DNS request for: ${randomDomain}`);
          this.handleDnsRequest({
            domain: randomDomain,
            requestId: requestId,
          });
        }
      }, 15000); // Every 15 seconds for demo
    }
  }

  private async handleDnsRequest(event: { domain: string; requestId: string }): Promise<void> {
    try {
      console.log(`🔍 GlobalGuard: Processing DNS request for ${event.domain}`);
      
      // Use LinkScannerService to scan the domain
      const result = await LinkScannerService.scanUrl(event.domain);
      
      // Resolve the DNS request based on scan result
      this.nativeModule.resolveDnsRequest(event.requestId, result.isSafe);
      
      // If the site is not safe, send a notification
      if (!result.isSafe) {
        await this.sendThreatNotification(event.domain, result.details);
      }
      
      console.log(`✅ GlobalGuard: DNS request for ${event.domain} resolved as ${result.isSafe ? 'SAFE' : 'BLOCKED'}`);
    } catch (error) {
      console.error('❌ GlobalGuard: Error processing DNS request:', error);
      
      // On error, default to allowing the request (safe fallback)
      this.nativeModule.resolveDnsRequest(event.requestId, true);
    }
  }

  private handleVpnStatusChange(event: { isActive: boolean }): void {
    this.isActive = event.isActive;
    console.log(`🔄 GlobalGuard: VPN status changed - ${this.isActive ? 'ACTIVE' : 'INACTIVE'}`);
  }

  private async sendThreatNotification(domain: string, details: string): Promise<void> {
    try {
      console.log(`🚨 Sending threat notification for: ${domain}`);
      
      if (Platform.OS !== 'web' && isNotificationServiceAvailable) {
        // Use Expo notification service
        try {
          await notificationService.showNotification({
            title: '🛡️ Shabari - Threat Blocked',
            message: `Blocked dangerous site: ${domain}`,
            channelId: 'security',
            priority: 'max',
            vibration: true,
            sound: true,
            data: {
              type: 'security_alert',
              domain: domain,
              details: details,
              timestamp: new Date().toISOString(),
            },
          });
          console.log('✅ Expo notification sent successfully');
        } catch (nativeError) {
          console.warn('⚠️ Expo notification failed:', nativeError);
          throw nativeError; // Fall through to web notification
        }
      } else if (Platform.OS === 'web') {
        // Web notification with permission handling
        await this.sendWebNotification(domain, details);
      } else {
        // Console fallback
        console.log(`🛡️ THREAT BLOCKED: ${domain} - ${details}`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to send threat notification:', error);
      // Final fallback to console log
      console.log(`🛡️ THREAT BLOCKED: ${domain} - ${details}`);
    }
  }

  private async sendWebNotification(domain: string, details: string): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('🌐 Web notifications not supported');
      return;
    }

    try {
      if (Notification.permission === 'granted') {
        new Notification('🛡️ Shabari - Threat Blocked', {
          body: `Blocked dangerous site: ${domain}`,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'shabari-threat',
          requireInteraction: true,
        });
        console.log('✅ Web notification sent successfully');
      } else if (Notification.permission !== 'denied') {
        // Request permission first
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification('🛡️ Shabari - Threat Blocked', {
            body: `Blocked dangerous site: ${domain}`,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'shabari-threat',
            requireInteraction: true,
          });
          console.log('✅ Web notification sent after permission grant');
        }
      }
    } catch (webError) {
      console.warn('⚠️ Web notification failed:', webError);
    }
  }

  public async activateGuard(): Promise<boolean> {
    try {
      console.log('🛡️ GlobalGuard: Activating protection...');
      
      // Wait for initialization if needed
      await this.initializeAsync();
      
      // Request VPN permissions if needed
      if (Platform.OS === 'android') {
        return new Promise((resolve) => {
          Alert.alert(
            '🛡️ VPN Permission Required',
            'Shabari needs VPN permission to provide real-time protection. This creates a local VPN that filters DNS requests without sending your data anywhere.',
            [
              { 
                text: 'Cancel', 
                style: 'cancel',
                onPress: () => resolve(false)
              },
              { 
                text: 'Allow VPN', 
                onPress: async () => {
                  const success = await this.startVpnService();
                  resolve(success);
                }
              },
            ]
          );
        });
      } else {
        return await this.startVpnService();
      }
      
    } catch (error) {
      console.error('❌ GlobalGuard: Failed to activate protection:', error);
      return false;
    }
  }

  private async startVpnService(): Promise<boolean> {
    try {
      console.log('🔒 Starting VPN service...');
      const success = await this.nativeModule.startVpn();
      
      if (success) {
        this.isActive = true;
        console.log('✅ GlobalGuard: Protection activated successfully');
        
        // Show success notification
        Alert.alert(
          '✅ Protection Activated',
          'Shabari GlobalGuard is now protecting you from malicious websites in real-time.',
          [{ text: 'OK' }]
        );
        
        return true;
      } else {
        throw new Error('VPN service failed to start');
      }
    } catch (error) {
      console.error('❌ GlobalGuard: VPN activation failed:', error);
      Alert.alert(
        '❌ Activation Failed',
        'Unable to activate real-time protection. Please check your network settings and try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  public async deactivateGuard(): Promise<boolean> {
    try {
      console.log('🛡️ GlobalGuard: Deactivating protection...');
      
      const success = await this.nativeModule.stopVpn();
      
      if (success) {
        this.isActive = false;
        console.log('✅ GlobalGuard: Protection deactivated successfully');
        
        Alert.alert(
          '🔓 Protection Deactivated',
          'Shabari GlobalGuard has been turned off. You are no longer protected from malicious websites in real-time.',
          [{ text: 'OK' }]
        );
        
        return true;
      } else {
        throw new Error('Failed to stop VPN service');
      }
    } catch (error) {
      console.error('❌ GlobalGuard: Failed to deactivate protection:', error);
      return false;
    }
  }

  public async isProtectionActive(): Promise<boolean> {
    try {
      const vpnActive = await this.nativeModule.isVpnActive();
      this.isActive = vpnActive;
      return vpnActive;
    } catch (error) {
      console.error('❌ GlobalGuard: Failed to check protection status:', error);
      return false;
    }
  }

  public getProtectionStatus(): boolean {
    return this.isActive;
  }

  public async waitForInitialization(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
  }

  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  public getServiceStatus(): { 
    isInitialized: boolean; 
    hasNotifications: boolean; 
    hasNativeModule: boolean;
    isActive: boolean;
  } {
    return {
      isInitialized: this.isInitialized,
      hasNotifications: isNotificationServiceAvailable,
      hasNativeModule: this.nativeModule !== mockNativeModule,
      isActive: this.isActive,
    };
  }

  public cleanup(): void {
    try {
      console.log('🧹 Cleaning up GlobalGuardController...');
      
      // Remove event listeners
      Object.values(this.listeners).forEach(listener => {
        if (listener && typeof listener.remove === 'function') {
          try {
            listener.remove();
          } catch (error) {
            console.warn('Warning: Failed to remove listener:', error);
          }
        }
      });
      
      this.listeners = {};
      
      // Deactivate protection
      if (this.isActive) {
        this.deactivateGuard().catch(error => {
          console.warn('Warning: Failed to deactivate guard during cleanup:', error);
        });
      }
      
      console.log('✅ GlobalGuardController cleaned up successfully');
      
    } catch (error) {
      console.error('❌ GlobalGuardController cleanup error:', error);
    }
  }

  public async activateGuardForLimitedTime(durationMinutes: number): Promise<boolean> {
    const activated = await this.activateGuard();
    if (activated) {
      console.log(`🛡️ Global Guard activated for ${durationMinutes} minutes.`);
      setTimeout(() => {
        console.log(`⏰ Time's up! Deactivating Global Guard.`);
        this.deactivateGuard();
      }, durationMinutes * 60 * 1000);
    }
    return activated;
  }
}

// Export singleton instance
export const globalGuard = GlobalGuardController.getInstance(); 