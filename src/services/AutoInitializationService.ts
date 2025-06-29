/**
 * Auto Initialization Service
 * Automatically initializes all Shabari security features when the app starts
 * Provides seamless user experience with guided permission requests
 */

import { AppState, AppStateStatus, Platform } from 'react-native';
import { ExpoNotificationService } from './ExpoNotificationService';
import { smsReaderService } from './SMSReaderService';

interface InitializationStatus {
  smsReader: boolean;
  notifications: boolean;
  urlProtection: boolean;
  fileScanner: boolean;
  qrScanner: boolean;
  isFullyInitialized: boolean;
  lastInitialized: Date | null;
}

export class AutoInitializationService {
  private static instance: AutoInitializationService;
  private isInitializing: boolean = false;
  private initializationStatus: InitializationStatus = {
    smsReader: false,
    notifications: false,
    urlProtection: false,
    fileScanner: false,
    qrScanner: false,
    isFullyInitialized: false,
    lastInitialized: null
  };
  private appStateSubscription: any = null;

  private constructor() {}

  static getInstance(): AutoInitializationService {
    if (!AutoInitializationService.instance) {
      AutoInitializationService.instance = new AutoInitializationService();
    }
    return AutoInitializationService.instance;
  }

  /**
   * Start auto-initialization on app launch
   */
  async startAutoInitialization(): Promise<void> {
    try {
      console.log('🚀 Starting Shabari Auto-Initialization...');
      
      if (this.isInitializing) {
        console.log('⏳ Initialization already in progress...');
        return;
      }

      this.isInitializing = true;

      // Subscribe to app state changes
      this.subscribeToAppStateChanges();

      // Perform initialization
      await this.performFullInitialization();

    } catch (error) {
      console.error('❌ Auto-initialization failed:', error);
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Perform full initialization of all services
   */
  private async performFullInitialization(): Promise<void> {
    console.log('🔧 Initializing Shabari Security Suite...');

    // Initialize in priority order
    await this.initializeNotifications();
    await this.initializeURLProtection();
    await this.initializeFileScanner();
    await this.initializeQRScanner();
    await this.initializeSMSReader(); // SMS last as it requires user interaction

    // Check if all features are ready
    this.checkFullInitialization();
  }

  /**
   * Initialize notification system
   */
  private async initializeNotifications(): Promise<void> {
    try {
      console.log('🔔 Initializing notifications...');
      
      // Initialize notification service if available
      if (ExpoNotificationService) {
        // Notifications don't require explicit permissions on Android for basic functionality
        this.initializationStatus.notifications = true;
        console.log('✅ Notifications initialized');
      }
    } catch (error) {
      console.error('❌ Notification initialization failed:', error);
      this.initializationStatus.notifications = false;
    }
  }

  /**
   * Initialize URL protection (no permissions needed)
   */
  private async initializeURLProtection(): Promise<void> {
    try {
      console.log('🔗 Initializing URL protection...');
      
      // URL protection doesn't require permissions
      this.initializationStatus.urlProtection = true;
      console.log('✅ URL protection initialized');
    } catch (error) {
      console.error('❌ URL protection initialization failed:', error);
      this.initializationStatus.urlProtection = false;
    }
  }

  /**
   * Initialize file scanner (no permissions needed initially)
   */
  private async initializeFileScanner(): Promise<void> {
    try {
      console.log('📁 Initializing file scanner...');
      
      // File scanner core doesn't require permissions until user scans
      this.initializationStatus.fileScanner = true;
      console.log('✅ File scanner initialized');
    } catch (error) {
      console.error('❌ File scanner initialization failed:', error);
      this.initializationStatus.fileScanner = false;
    }
  }

  /**
   * Initialize QR scanner (camera permission handled when needed)
   */
  private async initializeQRScanner(): Promise<void> {
    try {
      console.log('📱 Initializing QR scanner...');
      
      // QR scanner core doesn't require permissions until user scans
      this.initializationStatus.qrScanner = true;
      console.log('✅ QR scanner initialized');
    } catch (error) {
      console.error('❌ QR scanner initialization failed:', error);
      this.initializationStatus.qrScanner = false;
    }
  }

  /**
   * Initialize SMS reader with smart permission handling
   */
  private async initializeSMSReader(): Promise<void> {
    try {
      console.log('📱 Initializing SMS fraud detection...');
      
      if (Platform.OS !== 'android') {
        console.log('⚠️ SMS reading only available on Android');
        this.initializationStatus.smsReader = false;
        return;
      }

      // Check if SMS service is already ready
      if (smsReaderService.isReady()) {
        console.log('✅ SMS reader already initialized');
        this.initializationStatus.smsReader = true;
        return;
      }

      // Try to initialize silently first (check existing permissions)
      const status = smsReaderService.getStatus();
      if (status.hasPermissions) {
        console.log('✅ SMS permissions already granted, initializing...');
        const initialized = await smsReaderService.initialize();
        this.initializationStatus.smsReader = initialized;
      } else {
        console.log('⚠️ SMS permissions not granted yet');
        // Don't request automatically - let user trigger when they need SMS features
        this.initializationStatus.smsReader = false;
      }
      
    } catch (error) {
      console.error('❌ SMS reader initialization failed:', error);
      this.initializationStatus.smsReader = false;
    }
  }

  /**
   * Check if full initialization is complete
   */
  private checkFullInitialization(): void {
    const coreFeatures = [
      this.initializationStatus.notifications,
      this.initializationStatus.urlProtection,
      this.initializationStatus.fileScanner,
      this.initializationStatus.qrScanner
    ];

    const coreInitialized = coreFeatures.every(feature => feature === true);
    
    this.initializationStatus.isFullyInitialized = coreInitialized;
    this.initializationStatus.lastInitialized = new Date();

    if (coreInitialized) {
      console.log('🎉 Shabari core security features initialized successfully!');
      
      if (this.initializationStatus.smsReader) {
        console.log('🔒 All features including SMS fraud detection are ready!');
      } else {
        console.log('📱 Core features ready. SMS fraud detection will initialize when first used.');
      }
    } else {
      console.log('⚠️ Some features failed to initialize');
    }
  }

  /**
   * Subscribe to app state changes for re-initialization
   */
  private subscribeToAppStateChanges(): void {
    if (this.appStateSubscription) {
      return; // Already subscribed
    }

    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App became active, check if we need to re-initialize
        this.handleAppBecameActive();
      }
    });
  }

  /**
   * Handle app becoming active
   */
  private async handleAppBecameActive(): Promise<void> {
    try {
      // Check if we need to re-initialize (e.g., permissions changed)
      const lastInit = this.initializationStatus.lastInitialized;
      const now = new Date();
      
      // Re-check every 5 minutes if app becomes active
      if (!lastInit || (now.getTime() - lastInit.getTime()) > 300000) {
        console.log('🔄 App became active, checking initialization status...');
        
        // Quick re-check of core services
        await this.quickHealthCheck();
      }
    } catch (error) {
      console.error('❌ App state change handling failed:', error);
    }
  }

  /**
   * Quick health check of all services
   */
  private async quickHealthCheck(): Promise<void> {
    try {
      // Check SMS reader status
      if (Platform.OS === 'android') {
        const smsStatus = smsReaderService.getStatus();
        if (smsStatus.hasPermissions && !this.initializationStatus.smsReader) {
          console.log('📱 SMS permissions now available, initializing...');
          const initialized = await smsReaderService.initialize();
          this.initializationStatus.smsReader = initialized;
        }
      }

      // Update last check time
      this.initializationStatus.lastInitialized = new Date();
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
    }
  }

  /**
   * Request SMS permissions when user needs the feature
   */
  async requestSMSPermissionsWhenNeeded(): Promise<boolean> {
    try {
      if (Platform.OS !== 'android') {
        console.log('⚠️ SMS permissions only available on Android');
        return false;
      }

      console.log('📱 User requested SMS fraud detection, initializing...');
      
      const initialized = await smsReaderService.initialize();
      this.initializationStatus.smsReader = initialized;
      
      if (initialized) {
        console.log('✅ SMS fraud detection is now ready!');
      }
      
      return initialized;
    } catch (error) {
      console.error('❌ SMS permission request failed:', error);
      return false;
    }
  }

  /**
   * Get current initialization status
   */
  getInitializationStatus(): InitializationStatus {
    return { ...this.initializationStatus };
  }

  /**
   * Get user-friendly status for display
   */
  getUserFriendlyStatus(): {
    coreReady: boolean;
    smsReady: boolean;
    readyFeatures: string[];
    pendingFeatures: string[];
    totalFeatures: number;
    readyCount: number;
  } {
    const features = [
      { name: 'URL Protection', ready: this.initializationStatus.urlProtection },
      { name: 'File Scanner', ready: this.initializationStatus.fileScanner },
      { name: 'QR Scanner', ready: this.initializationStatus.qrScanner },
      { name: 'Notifications', ready: this.initializationStatus.notifications },
      { name: 'SMS Fraud Detection', ready: this.initializationStatus.smsReader }
    ];

    const readyFeatures = features.filter(f => f.ready).map(f => f.name);
    const pendingFeatures = features.filter(f => !f.ready).map(f => f.name);

    return {
      coreReady: this.initializationStatus.isFullyInitialized,
      smsReady: this.initializationStatus.smsReader,
      readyFeatures,
      pendingFeatures,
      totalFeatures: features.length,
      readyCount: readyFeatures.length
    };
  }

  /**
   * Cleanup subscriptions
   */
  cleanup(): void {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
  }
}

// Export singleton instance
export const autoInitService = AutoInitializationService.getInstance(); 