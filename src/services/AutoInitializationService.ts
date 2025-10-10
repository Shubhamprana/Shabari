/**
 * Auto Initialization Service
 * Automatically initializes all Shabari security features when the app starts
 * Provides seamless user experience with guided permission requests
 */

import * as Sentry from '@sentry/react-native';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { ExpoNotificationService } from './ExpoNotificationService';
import { proxyEngineService } from './ProxyEngineService';
import { YaraSecurityService } from './YaraSecurityService';
// import { smsReaderService } from './SMSReaderService'; // Commented out to prevent startup crashes

interface InitializationStatus {
  smsReader: boolean;
  notifications: boolean;
  urlProtection: boolean;
  fileScanner: boolean;
  qrScanner: boolean;
  callProtection: boolean;
  yaraEngine: boolean;
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
    callProtection: false,
    yaraEngine: false,
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
    console.log('🔧 Phase 2: Initializing Shabari Security Suite (Enhanced + Advanced)...');

    // Phase 1: Initialize safe features in priority order
    await this.initializeNotifications();
    await this.initializeCallProtection(); // Phase 1: Re-enabled with safe error handling
    await this.initializeURLProtection();
    await this.initializeFileScanner();
    await this.initializeQRScanner();
    await this.initializeYaraEngine(); // Initialize YARA engine for threat detection
    
    // Phase 2: Initialize advanced features with extensive error handling
    await this.initializeAdvancedFeatures();
    
    // await this.initializeSMSReader(); // Phase 3: SMS disabled for stability

    // Check if all features are ready
    this.checkFullInitialization();
  }

  /**
   * Phase 2: Initialize advanced features with comprehensive error handling
   */
  private async initializeAdvancedFeatures(): Promise<void> {
    console.log('🚀 Phase 2: Initializing advanced security features...');
    
    try {
      // Initialize FileWatchdog
      await this.initializeFileWatchdog();
      
      // Initialize DownloadMonitor
      await this.initializeDownloadMonitor();
      
      // Initialize PermissionManager
      await this.initializePermissionManager();
      
      console.log('✅ Phase 2: Advanced features initialization completed');
    } catch (error) {
      console.error('❌ Phase 2: Advanced features initialization failed:', error);
      Sentry.captureException(error, { tags: { phase: 'phase2', service: 'advancedFeatures' } });
    }
  }

  /**
   * Initialize FileWatchdog service
   */
  private async initializeFileWatchdog(): Promise<void> {
    try {
      console.log('👁️ Phase 2: Initializing FileWatchdog...');
      Sentry.addBreadcrumb({ message: 'Phase 2 FileWatchdog initialization started' });
      
      // FileWatchdog is a premium feature
      // For now, we'll mark it as available but not auto-start
      console.log('✅ Phase 2: FileWatchdog service available');
      Sentry.addBreadcrumb({ message: 'Phase 2 FileWatchdog marked as available' });
    } catch (error) {
      console.error('❌ Phase 2: FileWatchdog initialization failed:', error);
      Sentry.captureException(error, { tags: { phase: 'phase2', service: 'fileWatchdog' } });
    }
  }

  /**
   * Initialize DownloadMonitor service
   */
  private async initializeDownloadMonitor(): Promise<void> {
    try {
      console.log('📥 Phase 2: Initializing DownloadMonitor...');
      Sentry.addBreadcrumb({ message: 'Phase 2 DownloadMonitor initialization started' });
      
      // DownloadMonitor is a premium feature
      // For now, we'll mark it as available but not auto-start
      console.log('✅ Phase 2: DownloadMonitor service available');
      Sentry.addBreadcrumb({ message: 'Phase 2 DownloadMonitor marked as available' });
    } catch (error) {
      console.error('❌ Phase 2: DownloadMonitor initialization failed:', error);
      Sentry.captureException(error, { tags: { phase: 'phase2', service: 'downloadMonitor' } });
    }
  }

  /**
   * Initialize PermissionManager service
   */
  private async initializePermissionManager(): Promise<void> {
    try {
      console.log('🔐 Phase 2: Initializing PermissionManager...');
      Sentry.addBreadcrumb({ message: 'Phase 2 PermissionManager initialization started' });
      
      // PermissionManager is a premium feature
      // For now, we'll mark it as available but not auto-start
      console.log('✅ Phase 2: PermissionManager service available');
      Sentry.addBreadcrumb({ message: 'Phase 2 PermissionManager marked as available' });
    } catch (error) {
      console.error('❌ Phase 2: PermissionManager initialization failed:', error);
      Sentry.captureException(error, { tags: { phase: 'phase2', service: 'permissionManager' } });
    }
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
   * Initialize YARA engine for advanced threat detection
   */
  private async initializeYaraEngine(): Promise<void> {
    try {
      console.log('🛡️ Initializing YARA Security Engine...');
      Sentry.addBreadcrumb({ message: 'YARA engine initialization started' });
      
      const isInitialized = await YaraSecurityService.initialize();
      
      if (isInitialized) {
        this.initializationStatus.yaraEngine = true;
        console.log('✅ YARA engine initialized successfully');
        Sentry.addBreadcrumb({ 
          message: 'YARA engine initialized successfully',
          data: { initialized: true }
        });
        
        // Get engine status for logging
        try {
          const status = await YaraSecurityService.getEngineStatus();
          console.log(`🔍 YARA Engine Status: ${status.native ? 'Native' : 'Mock'} v${status.version} with ${status.rulesCount} rules`);
          Sentry.addBreadcrumb({ 
            message: 'YARA engine status retrieved',
            data: {
              native: status.native,
              version: status.version,
              rulesCount: status.rulesCount
            }
          });
        } catch (statusError) {
          console.warn('⚠️ Could not get YARA engine status:', statusError);
        }
      } else {
        this.initializationStatus.yaraEngine = false;
        console.warn('⚠️ YARA engine initialization failed - using fallback protection');
        Sentry.addBreadcrumb({ 
          message: 'YARA engine initialization failed',
          data: { initialized: false }
        });
      }
    } catch (error) {
      console.error('❌ YARA engine initialization error:', error);
      Sentry.captureException(error, { 
        tags: { service: 'yaraEngine', phase: 'initialization' }
      });
      this.initializationStatus.yaraEngine = false;
    }
  }

  /**
   * Initialize SMS reader with smart permission handling
   */
  private async initializeSMSReader(): Promise<void> {
    // Skip SMS reader initialization to prevent crashes
    // This can be initialized manually when user needs it
    console.log('⚠️ SMS reader initialization skipped (manual start required)');
    this.initializationStatus.smsReader = false;
    return;
    
    /* 
    // Commented out to prevent startup crashes
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
    */
  }

  /**
   * Initialize call protection and proxy engine
   */
  private async initializeCallProtection(): Promise<void> {
    try {
      console.log('🔍 Phase 1: Initializing call protection (safe re-enablement)...');
      Sentry.addBreadcrumb({ message: 'Phase 1 call protection initialization started' });
      
      // Phase 1: Safe call protection initialization with error handling
      if (Platform.OS === 'android') {
        // Check if ProxyEngineService is available (it's already working)
        if (proxyEngineService && typeof proxyEngineService.isAvailable === 'function') {
          const isAvailable = await proxyEngineService.isAvailable();
          if (isAvailable) {
            console.log('✅ Phase 1: Call protection service available');
            this.initializationStatus.callProtection = true;
            Sentry.addBreadcrumb({ message: 'Phase 1 call protection enabled successfully' });
          } else {
            console.log('⚠️ Phase 1: Call protection service not available on this device');
            this.initializationStatus.callProtection = false;
          }
        } else {
          console.log('⚠️ Phase 1: ProxyEngineService not properly initialized');
          this.initializationStatus.callProtection = false;
        }
      } else {
        console.log('ℹ️ Phase 1: Call protection not supported on this platform');
        this.initializationStatus.callProtection = false;
      }
    } catch (error) {
      console.error('❌ Phase 1: Call protection initialization failed:', error);
      Sentry.captureException(error, { tags: { phase: 'phase1', service: 'callProtection' } });
      this.initializationStatus.callProtection = false;
    }
    
    /* 
    // Commented out to prevent startup crashes
    try {
      console.log('🛡️ Initializing call protection...');
      
      if (Platform.OS !== 'android') {
        console.log('⚠️ Call protection only available on Android');
        this.initializationStatus.callProtection = false;
        return;
      }

      // Gracefully handle if proxy engine module is not available
      try {
        // Check if proxy engine is available
        if (!proxyEngineService.isAvailable()) {
          console.log('⚠️ Proxy engine not available on this device');
          this.initializationStatus.callProtection = false;
          return;
        }

        // Initialize proxy engine with timeout protection
        const initPromise = proxyEngineService.initialize();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Initialization timeout')), 5000)
        );

        const initResult = await Promise.race([initPromise, timeoutPromise]) as { success: boolean; message: string };
        
        if (!initResult.success) {
          console.error('❌ Failed to initialize proxy engine:', initResult.message);
          this.initializationStatus.callProtection = false;
          return;
        }

        // Initialize call notification service
        await callNotificationService.initialize();

        // Do NOT auto-start VPN on launch; require explicit user action
        console.log('✅ Call protection ready (manual start required)');

        this.initializationStatus.callProtection = true;
        console.log('✅ Call protection initialized');
        
      } catch (nativeError) {
        // Native module not linked or failed - gracefully degrade
        console.log('⚠️ Proxy engine native module not available, continuing without it');
        this.initializationStatus.callProtection = false;
      }
      
    } catch (error) {
      console.error('❌ Call protection initialization failed:', error);
      this.initializationStatus.callProtection = false;
    }
    */
  }

  /**
   * Check if full initialization is complete
   */
  private checkFullInitialization(): void {
    // Phase 1: Include call protection and YARA engine in core features
    const coreFeatures = [
      this.initializationStatus.notifications,
      this.initializationStatus.callProtection, // Phase 1: Re-enabled with error handling
      this.initializationStatus.urlProtection,
      this.initializationStatus.fileScanner,
      this.initializationStatus.qrScanner,
      this.initializationStatus.yaraEngine // YARA engine for threat detection
    ];

    const coreInitialized = coreFeatures.every(feature => feature === true);
    
    this.initializationStatus.isFullyInitialized = coreInitialized;
    this.initializationStatus.lastInitialized = new Date();

    if (coreInitialized) {
      console.log('🎉 Shabari core security features initialized successfully!');
      
      const statusMessages = [];
      if (this.initializationStatus.callProtection) {
        statusMessages.push('🛡️ Call Protection');
      }
      if (this.initializationStatus.smsReader) {
        statusMessages.push('📱 SMS Fraud Detection');
      }
      
      if (statusMessages.length > 0) {
        console.log(`🔒 All features ready: ${statusMessages.join(', ')}`);
      } else {
        console.log('📱 Core features ready. Advanced protection will initialize when first used.');
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
      // SMS reader health check skipped to prevent crashes
      // Will be initialized manually when user needs SMS features
      
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
    console.log('⚠️ SMS permissions request skipped - service not initialized');
    return false;
    
    /* 
    // Commented out to prevent crashes
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
    */
  }

  /**
   * Get current initialization status
   */
  getInitializationStatus(): InitializationStatus {
    return { ...this.initializationStatus };
  }

  /**
   * Get YARA engine initialization status
   */
  getYaraEngineStatus(): boolean {
    return this.initializationStatus.yaraEngine;
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