import { supabase } from '../lib/supabase';
import { notificationService } from './ExpoNotificationService';
import { localThreatDetectionService } from './LocalThreatDetectionService';

// Import the proxy engine with safe loading
let ShabariVpn: any = null;
let isProxyEngineAvailable = false;

try {
  const proxyModule = require('react-native-proxy-engine/js/shabari-vpn');
  
  if (proxyModule && proxyModule.default) {
    ShabariVpn = proxyModule.default;
    isProxyEngineAvailable = true;
    console.log('✅ Proxy Engine module loaded successfully');
  } else {
    throw new Error('Proxy Engine module exists but default export is missing');
  }
} catch (error) {
  const errorMsg = error instanceof Error ? error.message : String(error);
  console.warn('⚠️ Proxy Engine not available:', errorMsg);
  console.log('📱 App will continue with limited VPN features');
  isProxyEngineAvailable = false;
  
  // Create a mock module to prevent crashes
  ShabariVpn = {
    initialize: () => Promise.resolve({ success: false, message: 'Native module not available' }),
    startProtection: () => Promise.resolve({ success: false, message: 'Native module not available' }),
    stopProtection: () => Promise.resolve({ success: false, message: 'Native module not available' }),
    getStatus: () => Promise.resolve({ isRunning: false, status: 'stopped' }),
  };
}

export interface ProxyEngineStatus {
  isRunning: boolean;
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error';
  statistics?: {
    threatsBlocked: number;
    threatsWarned: number;
    dataTransferred: string;
    uptime: string;
    dnsQueries: number;
    cacheHitRate: string;
  };
}

export interface ProxyEngineConfig {
  blockAds: boolean;
  blockTrackers: boolean;
  blockMalware: boolean;
  blockPhishing: boolean;
  enableCallProtection: boolean;
  enableDnsOverHttps: boolean;
}

export class ProxyEngineService {
  private static instance: ProxyEngineService;
  private isInitialized = false;
  private currentStatus: ProxyEngineStatus = {
    isRunning: false,
    status: 'stopped'
  };
  private eventListeners: Map<string, any> = new Map();

  static getInstance(): ProxyEngineService {
    if (!ProxyEngineService.instance) {
      ProxyEngineService.instance = new ProxyEngineService();
    }
    return ProxyEngineService.instance;
  }

  /**
   * Check if proxy engine is available
   */
  isAvailable(): boolean {
    return isProxyEngineAvailable && ShabariVpn !== null;
  }

  /**
   * Initialize the proxy engine
   */
  async initialize(): Promise<{ success: boolean; message: string }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        message: 'Proxy engine is not available on this platform'
      };
    }

    if (this.isInitialized) {
      return {
        success: true,
        message: 'Proxy engine already initialized'
      };
    }

    try {
      console.log('🚀 Initializing Proxy Engine...');
      
      const result = await ShabariVpn.initialize();
      
      if (result.success) {
        this.isInitialized = true;
        this.setupEventListeners();
        
        console.log('✅ Proxy Engine initialized successfully');
        return {
          success: true,
          message: 'Proxy engine initialized successfully'
        };
      } else {
        console.error('❌ Failed to initialize proxy engine:', result.message);
        return {
          success: false,
          message: result.message || 'Failed to initialize proxy engine'
        };
      }
    } catch (error) {
      console.error('❌ Proxy engine initialization error:', error);
      return {
        success: false,
        message: `Initialization error: ${error}`
      };
    }
  }

  /**
   * Start VPN protection
   */
  async startProtection(config?: Partial<ProxyEngineConfig>): Promise<{ success: boolean; message: string }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        message: 'Proxy engine is not available'
      };
    }

    if (!this.isInitialized) {
      const initResult = await this.initialize();
      if (!initResult.success) {
        return initResult;
      }
    }

    try {
      console.log('🛡️ Starting VPN protection...');
      
      const defaultConfig: ProxyEngineConfig = {
        blockAds: true,
        blockTrackers: true,
        blockMalware: true,
        blockPhishing: true,
        enableCallProtection: true,
        enableDnsOverHttps: false
      };

      const finalConfig = { ...defaultConfig, ...config };
      
      const result = await ShabariVpn.startProtection(finalConfig);
      
      if (result.success) {
        this.currentStatus.status = 'running';
        this.currentStatus.isRunning = true;
        
        console.log('✅ VPN protection started successfully');
        
        // Show notification
        await this.showProtectionStartedNotification();
        
        return {
          success: true,
          message: 'VPN protection started successfully'
        };
      } else {
        console.error('❌ Failed to start VPN protection:', result.message);
        return {
          success: false,
          message: result.message || 'Failed to start VPN protection'
        };
      }
    } catch (error) {
      console.error('❌ VPN protection start error:', error);
      return {
        success: false,
        message: `Start error: ${error}`
      };
    }
  }

  /**
   * Stop VPN protection
   */
  async stopProtection(): Promise<{ success: boolean; message: string }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        message: 'Proxy engine is not available'
      };
    }

    try {
      console.log('🛑 Stopping VPN protection...');
      
      const result = await ShabariVpn.stopProtection();
      
      if (result.success) {
        this.currentStatus.status = 'stopped';
        this.currentStatus.isRunning = false;
        
        console.log('✅ VPN protection stopped successfully');
        
        // Show notification
        await this.showProtectionStoppedNotification();
        
        return {
          success: true,
          message: 'VPN protection stopped successfully'
        };
      } else {
        console.error('❌ Failed to stop VPN protection:', result.message);
        return {
          success: false,
          message: result.message || 'Failed to stop VPN protection'
        };
      }
    } catch (error) {
      console.error('❌ VPN protection stop error:', error);
      return {
        success: false,
        message: `Stop error: ${error}`
      };
    }
  }

  /**
   * Configure proxy engine settings
   */
  async configure(config: Partial<ProxyEngineConfig>): Promise<{ success: boolean; message: string }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        message: 'Proxy engine is not available'
      };
    }

    try {
      console.log('⚙️ Configuring proxy engine...');
      
      const result = await ShabariVpn.configure(config);
      
      if (result.success) {
        console.log('✅ Proxy engine configured successfully');
        return {
          success: true,
          message: 'Proxy engine configured successfully'
        };
      } else {
        console.error('❌ Failed to configure proxy engine:', result.message);
        return {
          success: false,
          message: result.message || 'Failed to configure proxy engine'
        };
      }
    } catch (error) {
      console.error('❌ Configuration error:', error);
      return {
        success: false,
        message: `Configuration error: ${error}`
      };
    }
  }

  /**
   * Get current configuration
   */
  async getConfiguration(): Promise<ProxyEngineConfig | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const config = await ShabariVpn.getConfiguration();
      return config;
    } catch (error) {
      console.error('❌ Failed to get configuration:', error);
      return null;
    }
  }

  /**
   * Get current status
   */
  async getStatus(): Promise<ProxyEngineStatus> {
    if (!this.isAvailable()) {
      return {
        isRunning: false,
        status: 'error'
      };
    }

    try {
      const status = await ShabariVpn.getStatus();
      
      this.currentStatus = {
        isRunning: status.isRunning || false,
        status: status.status || 'stopped',
        statistics: status.statistics ? ShabariVpn.formatStatistics(status.statistics) : undefined
      };
      
      return this.currentStatus;
    } catch (error) {
      console.error('❌ Failed to get status:', error);
      return {
        isRunning: false,
        status: 'error'
      };
    }
  }

  /**
   * Check if a URL is a threat using the threat detection service
   */
  async checkURLThreat(url: string): Promise<{ isThreat: boolean; details?: string; confidence?: number }> {
    try {
      console.log(`🔍 Checking URL threat: ${url}`);
      
      // Initialize threat detection service if not already done
      await localThreatDetectionService.initialize();
      
      // Check the URL
      const result = await localThreatDetectionService.checkURL(url);
      
      console.log(`📊 Threat check result: ${result.isThreat ? 'THREAT' : 'SAFE'} (${result.confidence}% confidence)`);
      
      return {
        isThreat: result.isThreat,
        details: result.details,
        confidence: result.confidence
      };
      
    } catch (error) {
      console.error('❌ Error checking URL threat:', error);
      return {
        isThreat: false,
        details: `Error checking threat: ${error}`
      };
    }
  }

  /**
   * Check if an IP is a threat using the threat detection service
   */
  async checkIPThreat(ip: string): Promise<{ isThreat: boolean; details?: string; confidence?: number }> {
    try {
      console.log(`🔍 Checking IP threat: ${ip}`);
      
      // Initialize threat detection service if not already done
      await localThreatDetectionService.initialize();
      
      // Check the IP
      const result = await localThreatDetectionService.checkIP(ip);
      
      console.log(`📊 IP threat check result: ${result.isThreat ? 'THREAT' : 'SAFE'} (${result.confidence}% confidence)`);
      
      return {
        isThreat: result.isThreat,
        details: result.details,
        confidence: result.confidence
      };
      
    } catch (error) {
      console.error('❌ Error checking IP threat:', error);
      return {
        isThreat: false,
        details: `Error checking threat: ${error}`
      };
    }
  }

  /**
   * Get cached status
   */
  getCachedStatus(): ProxyEngineStatus {
    return this.currentStatus;
  }

  /**
   * Report a suspicious target
   */
  async reportThreat(target: string, type: 'domain' | 'ip' | 'phone' | 'app' | 'other', details?: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`📊 Reporting threat: ${type} - ${target}`);
      
      // Report to Supabase
      const { error: supabaseError } = await supabase
        .from('proxy_reports')
        .insert({
          target: target,
          type: type,
          action: 'reported',
          device_id: 'shabari_app', // You can get actual device ID
          details: details || 'User reported suspicious activity',
          timestamp: Date.now(),
          created_at: new Date().toISOString()
        });

      if (supabaseError) {
        console.error('❌ Failed to report to Supabase:', supabaseError);
        return {
          success: false,
          message: `Database error: ${supabaseError.message}`
        };
      }

      // Also report to proxy engine if available
      if (this.isAvailable()) {
        try {
          const result = await ShabariVpn.report(target, type, details);
          if (result.success) {
            console.log('✅ Threat reported to both Supabase and proxy engine');
          }
        } catch (proxyError) {
          console.warn('⚠️ Proxy engine report failed, but Supabase report succeeded:', proxyError);
        }
      }

      console.log('✅ Threat reported successfully to Supabase');
      return {
        success: true,
        message: 'Threat reported successfully'
      };
    } catch (error) {
      console.error('❌ Threat report error:', error);
      return {
        success: false,
        message: `Report error: ${error}`
      };
    }
  }

  /**
   * Update filter rules
   */
  async updateFilters(): Promise<{ success: boolean; message: string }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        message: 'Proxy engine is not available'
      };
    }

    try {
      console.log('🔄 Updating filter rules...');
      
      const result = await ShabariVpn.updateFilters();
      
      if (result.success) {
        console.log('✅ Filter rules updated successfully');
        return {
          success: true,
          message: 'Filter rules updated successfully'
        };
      } else {
        console.error('❌ Failed to update filters:', result.message);
        return {
          success: false,
          message: result.message || 'Failed to update filters'
        };
      }
    } catch (error) {
      console.error('❌ Filter update error:', error);
      return {
        success: false,
        message: `Update error: ${error}`
      };
    }
  }

  /**
   * Inject a custom threat feed (e.g. test_data/shabari_proxy_test_feed.json) into the proxy engine.
   * The engine should update its internal filter lists accordingly.
   */
  async updateFiltersWithCustomFeed(feed: any): Promise<{ success: boolean; message: string }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        message: 'Proxy engine is not available'
      };
    }

    try {
      console.log('🔄 Loading custom threat feed into proxy engine...');

      const result = await ShabariVpn.updateFiltersWithCustomFeed(feed);

      if (result?.success) {
        console.log('✅ Custom feed applied successfully');
        return {
          success: true,
          message: 'Custom feed applied successfully'
        };
      } else {
        console.error('❌ Failed to apply custom feed:', result?.message);
        return {
          success: false,
          message: result?.message || 'Failed to apply custom feed'
        };
      }
    } catch (error) {
      console.error('❌ Custom feed apply error:', error);
      return {
        success: false,
        message: `Custom feed apply error: ${error}`
      };
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.isAvailable()) return;

    try {
      // Status change listener
      const statusListener = ShabariVpn.on('STATUS_CHANGED', (data: any) => {
        console.log('📊 Proxy Engine status changed:', data);
        this.currentStatus.status = data.status;
        this.currentStatus.isRunning = data.status === 'running';
        this.currentStatus.statistics = data.statistics;
      });

      // Blocked threat listener
      const blockedListener = ShabariVpn.on('BLOCKED', (data: any) => {
        console.log('🚫 Threat blocked:', data);
        this.showThreatBlockedNotification(data.target, data.reason);
      });

      // Warning listener
      const warningListener = ShabariVpn.on('WARNING', (data: any) => {
        console.log('⚠️ Threat warning:', data);
        this.showThreatWarningNotification(data.target, data.message);
      });

      // Call blocked listener
      const callBlockedListener = ShabariVpn.on('CALL_BLOCKED', (data: any) => {
        console.log('📞 Fraud call blocked:', data);
        this.showCallBlockedNotification(data.phoneNumber, data.fraudType);
      });

      // Store listeners for cleanup
      this.eventListeners.set('STATUS_CHANGED', statusListener);
      this.eventListeners.set('BLOCKED', blockedListener);
      this.eventListeners.set('WARNING', warningListener);
      this.eventListeners.set('CALL_BLOCKED', callBlockedListener);

    } catch (error) {
      console.error('❌ Failed to setup event listeners:', error);
    }
  }

  /**
   * Cleanup event listeners
   */
  cleanup(): void {
    this.eventListeners.forEach((listener, event) => {
      try {
        ShabariVpn.off(event);
      } catch (error) {
        console.error(`❌ Failed to remove listener for ${event}:`, error);
      }
    });
    this.eventListeners.clear();
  }

  /**
   * Show protection started notification
   */
  private async showProtectionStartedNotification(): Promise<void> {
    try {
      await notificationService.showNotification({
        title: '🛡️ Shabari Protection Active',
        message: 'VPN protection has been started. Your device is now protected from threats.',
        data: { type: 'protection_started' }
      });
    } catch (error) {
      console.error('❌ Failed to show protection started notification:', error);
    }
  }

  /**
   * Show protection stopped notification
   */
  private async showProtectionStoppedNotification(): Promise<void> {
    try {
      await notificationService.showNotification({
        title: '🛑 Shabari Protection Stopped',
        message: 'VPN protection has been stopped. Your device is no longer protected.',
        data: { type: 'protection_stopped' }
      });
    } catch (error) {
      console.error('❌ Failed to show protection stopped notification:', error);
    }
  }

  /**
   * Show threat blocked notification
   */
  private async showThreatBlockedNotification(target: string, reason: string): Promise<void> {
    try {
      await notificationService.showNotification({
        title: '🚫 Threat Blocked',
        message: `Blocked: ${target}\nReason: ${reason}`,
        data: { type: 'threat_blocked', target, reason }
      });
    } catch (error) {
      console.error('❌ Failed to show threat blocked notification:', error);
    }
  }

  /**
   * Show threat warning notification
   */
  private async showThreatWarningNotification(target: string, message: string): Promise<void> {
    try {
      await notificationService.showNotification({
        title: '⚠️ Threat Warning',
        message: `Warning: ${target}\n${message}`,
        data: { type: 'threat_warning', target, message }
      });
    } catch (error) {
      console.error('❌ Failed to show threat warning notification:', error);
    }
  }

  /**
   * Show call blocked notification
   */
  private async showCallBlockedNotification(phoneNumber: string, fraudType: string): Promise<void> {
    try {
      const maskedNumber = ShabariVpn.formatPhoneNumber(phoneNumber);
      await notificationService.showNotification({
        title: '📞 Fraud Call Blocked',
        message: `Blocked call from ${maskedNumber}\nType: ${fraudType}`,
        data: { type: 'call_blocked', phoneNumber, fraudType }
      });
    } catch (error) {
      console.error('❌ Failed to show call blocked notification:', error);
    }
  }
}

// Export singleton instance
export const proxyEngineService = ProxyEngineService.getInstance();
