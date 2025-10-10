import { NativeEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';

const { ShabariVpn } = NativeModules;

if (!ShabariVpn) {
  throw new Error('ShabariVpn native module is not available. Make sure you have properly linked the library and rebuilt your app.');
}

// Create event emitter
const eventEmitter = new NativeEventEmitter(ShabariVpn);

// Event types
const EVENTS = {
  STATUS_CHANGED: 'ShabariVpnStatusChanged',
  BLOCKED: 'ShabariVpnBlocked',
  WARNING: 'ShabariVpnWarning',
  ERROR: 'ShabariVpnError',
  STATISTICS: 'ShabariVpnStatistics',
  CALL_BLOCKED: 'ShabariCallBlocked',
  CALL_WARNING: 'ShabariCallWarning',
};

// Cache for event listeners
const listeners = new Map();

/**
 * Shabari VPN Protection Engine JavaScript API
 */
class ShabariVpnEngine {
  constructor() {
    this.isInitialized = false;
    this.currentStatus = 'stopped';
    this.statistics = null;
    this.config = null;
  }

  /**
   * Initialize the VPN engine
   */
  async initialize() {
    if (this.isInitialized) {
      return { success: true, message: 'Already initialized' };
    }

    try {
      // Request permissions on Android
      if (Platform.OS === 'android') {
        await this.requestPermissions();
      }

      // Get initial status
      const status = await this.getStatus();
      this.currentStatus = status.status;
      
      // Load configuration
      this.config = await this.getConfiguration();
      
      this.isInitialized = true;
      
      return { 
        success: true, 
        message: 'VPN engine initialized successfully',
        status: this.currentStatus,
        config: this.config
      };
    } catch (error) {
      console.error('Failed to initialize VPN engine:', error);
      throw error;
    }
  }

  /**
   * Start VPN protection
   */
  async startProtection(config = {}) {
    try {
      const result = await ShabariVpn.startProtection(config);
      this.currentStatus = 'running';
      return result;
    } catch (error) {
      console.error('Failed to start protection:', error);
      throw error;
    }
  }

  /**
   * Stop VPN protection
   */
  async stopProtection() {
    try {
      const result = await ShabariVpn.stopProtection();
      this.currentStatus = 'stopped';
      return result;
    } catch (error) {
      console.error('Failed to stop protection:', error);
      throw error;
    }
  }

  /**
   * Get current VPN status
   */
  async getStatus() {
    try {
      const status = await ShabariVpn.getStatus();
      this.currentStatus = status.status;
      this.statistics = status.statistics;
      return status;
    } catch (error) {
      console.error('Failed to get status:', error);
      throw error;
    }
  }

  /**
   * Report a suspicious target
   */
  async report(target, type, details = null) {
    if (!target || !type) {
      throw new Error('Target and type are required for reporting');
    }

    const validTypes = ['domain', 'ip', 'phone', 'app', 'other'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid report type. Must be one of: ${validTypes.join(', ')}`);
    }

    try {
      return await ShabariVpn.report(target, type, details);
    } catch (error) {
      console.error('Failed to submit report:', error);
      throw error;
    }
  }

  /**
   * Update filter rules from Firebase
   */
  async updateFilters() {
    try {
      return await ShabariVpn.updateFilters();
    } catch (error) {
      console.error('Failed to update filters:', error);
      throw error;
    }
  }

  /**
   * Update filters with custom JSON feed (for testing)
   */
  async updateFiltersWithCustomFeed(feedData) {
    if (!feedData || typeof feedData !== 'object') {
      throw new Error('Feed data must be a valid object');
    }

    try {
      return await ShabariVpn.updateFiltersWithCustomFeed(feedData);
    } catch (error) {
      console.error('Failed to update filters with custom feed:', error);
      throw error;
    }
  }

  /**
   * Get protection statistics
   */
  async getStatistics() {
    try {
      const stats = await ShabariVpn.getStatistics();
      this.statistics = stats;
      return stats;
    } catch (error) {
      console.error('Failed to get statistics:', error);
      throw error;
    }
  }

  /**
   * Check if a specific target is blocked
   */
  async checkTarget(target, type) {
    if (!target || !type) {
      throw new Error('Target and type are required for checking');
    }

    const validTypes = ['domain', 'ip', 'phone'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid target type. Must be one of: ${validTypes.join(', ')}`);
    }

    try {
      return await ShabariVpn.checkTarget(target, type);
    } catch (error) {
      console.error('Failed to check target:', error);
      throw error;
    }
  }

  /**
   * Configure protection settings
   */
  async configure(settings) {
    const defaultSettings = {
      blockAds: true,
      blockTrackers: true,
      blockMalware: true,
      blockPhishing: true,
      enableCallProtection: true,
      enableDnsOverHttps: false,
    };

    const finalSettings = { ...defaultSettings, ...settings };

    try {
      const result = await ShabariVpn.configure(finalSettings);
      this.config = finalSettings;
      return result;
    } catch (error) {
      console.error('Failed to configure settings:', error);
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  async getConfiguration() {
    try {
      const config = await ShabariVpn.getConfiguration();
      this.config = config;
      return config;
    } catch (error) {
      console.error('Failed to get configuration:', error);
      throw error;
    }
  }

  /**
   * Clear all cached data
   */
  async clearCache() {
    try {
      return await ShabariVpn.clearCache();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * Request necessary permissions (Android only)
   */
  async requestPermissions() {
    if (Platform.OS !== 'android') {
      return { allGranted: true };
    }

    try {
      // Check if we need to request VPN permission
      const vpnPermission = await PermissionsAndroid.check(
        'android.permission.BIND_VPN_SERVICE'
      );

      if (!vpnPermission) {
        // VPN permission is handled by the native module
        console.log('VPN permission will be requested when starting protection');
      }

      // Request phone-related permissions for call protection
      const phonePermissions = [
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
        PermissionsAndroid.PERMISSIONS.CALL_PHONE,
      ];

      const results = await PermissionsAndroid.requestMultiple(phonePermissions);
      
      const allGranted = Object.values(results).every(
        result => result === PermissionsAndroid.RESULTS.GRANTED
      );

      if (!allGranted) {
        console.warn('Some permissions were denied. Call protection may not work properly.');
      }

      // Request native permissions through the module
      return await ShabariVpn.requestPermissions();
    } catch (error) {
      console.error('Failed to request permissions:', error);
      throw error;
    }
  }

  /**
   * Subscribe to events
   */
  on(event, callback) {
    if (!EVENTS[event]) {
      throw new Error(`Invalid event type: ${event}`);
    }

    const eventName = EVENTS[event];
    
    // Remove existing listener if any
    if (listeners.has(eventName)) {
      const existingListener = listeners.get(eventName);
      existingListener.remove();
    }

    // Add new listener
    const listener = eventEmitter.addListener(eventName, callback);
    listeners.set(eventName, listener);

    return listener;
  }

  /**
   * Unsubscribe from events
   */
  off(event) {
    if (!EVENTS[event]) {
      throw new Error(`Invalid event type: ${event}`);
    }

    const eventName = EVENTS[event];
    
    if (listeners.has(eventName)) {
      const listener = listeners.get(eventName);
      listener.remove();
      listeners.delete(eventName);
    }
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners() {
    listeners.forEach(listener => listener.remove());
    listeners.clear();
  }

  /**
   * Check if protection is running
   */
  isProtectionRunning() {
    return this.currentStatus === 'running';
  }

  /**
   * Get cached statistics
   */
  getCachedStatistics() {
    return this.statistics;
  }

  /**
   * Get cached configuration
   */
  getCachedConfiguration() {
    return this.config;
  }

  /**
   * Format phone number for display (mask sensitive parts)
   */
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber || phoneNumber.length < 6) {
      return '****';
    }
    
    const start = phoneNumber.substring(0, 3);
    const end = phoneNumber.substring(phoneNumber.length - 3);
    return `${start}****${end}`;
  }

  /**
   * Format statistics for display
   */
  formatStatistics(stats) {
    if (!stats) return null;

    return {
      threatsBlocked: stats.blocked_count || 0,
      threatsWarned: stats.warned_count || 0,
      dataTransferred: this.formatBytes(stats.bytes_transferred || 0),
      uptime: this.formatUptime(stats.uptime_ms || 0),
      dnsQueries: stats.dns_stats?.queries_processed || 0,
      cacheHitRate: stats.dns_stats?.cache_hit_rate 
        ? `${stats.dns_stats.cache_hit_rate.toFixed(1)}%` 
        : '0%',
    };
  }

  /**
   * Format bytes to human-readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Format uptime to human-readable format
   */
  formatUptime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Create singleton instance
const shabariVpn = new ShabariVpnEngine();

// Export both the instance and the class
export { shabariVpn as default, EVENTS, ShabariVpnEngine };

// Also export convenience functions
export const startProtection = (config) => shabariVpn.startProtection(config);
export const stopProtection = () => shabariVpn.stopProtection();
export const getStatus = () => shabariVpn.getStatus();
export const report = (target, type, details) => shabariVpn.report(target, type, details);
export const updateFilters = () => shabariVpn.updateFilters();
export const updateFiltersWithCustomFeed = (feedData) => shabariVpn.updateFiltersWithCustomFeed(feedData);
export const getStatistics = () => shabariVpn.getStatistics();
export const checkTarget = (target, type) => shabariVpn.checkTarget(target, type);
export const configure = (settings) => shabariVpn.configure(settings);
export const clearCache = () => shabariVpn.clearCache();
export const on = (event, callback) => shabariVpn.on(event, callback);
export const off = (event) => shabariVpn.off(event);
