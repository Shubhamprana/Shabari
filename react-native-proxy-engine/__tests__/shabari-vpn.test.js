import { NativeModules, NativeEventEmitter } from 'react-native';
import shabariVpn, { EVENTS, ShabariVpnEngine } from '../js/shabari-vpn';

// Mock NativeModules
const mockNativeModule = {
  startProtection: jest.fn().mockResolvedValue({ success: true, message: 'Started' }),
  stopProtection: jest.fn().mockResolvedValue({ success: true, message: 'Stopped' }),
  getStatus: jest.fn().mockResolvedValue({ 
    status: 'running', 
    isRunning: true,
    statistics: {
      blocked_count: 100,
      warned_count: 50,
      bytes_transferred: 1024000,
      uptime_ms: 3600000
    }
  }),
  report: jest.fn().mockResolvedValue({ success: true }),
  updateFilters: jest.fn().mockResolvedValue({ success: true }),
  getStatistics: jest.fn().mockResolvedValue({ 
    blocked_count: 100,
    warned_count: 50 
  }),
  checkTarget: jest.fn().mockResolvedValue({ 
    isBlocked: true, 
    result: 'BLOCK' 
  }),
  configure: jest.fn().mockResolvedValue({ success: true }),
  getConfiguration: jest.fn().mockResolvedValue({
    blockAds: true,
    blockTrackers: true,
    blockMalware: true,
    blockPhishing: true,
    enableCallProtection: true,
    enableDnsOverHttps: false
  }),
  clearCache: jest.fn().mockResolvedValue({ success: true }),
  requestPermissions: jest.fn().mockResolvedValue({ allGranted: true })
};

NativeModules.ShabariVpn = mockNativeModule;

// Mock NativeEventEmitter
jest.mock('react-native', () => ({
  NativeModules: {
    ShabariVpn: mockNativeModule
  },
  NativeEventEmitter: jest.fn().mockImplementation(() => ({
    addListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    removeAllListeners: jest.fn()
  })),
  Platform: {
    OS: 'android'
  },
  PermissionsAndroid: {
    check: jest.fn().mockResolvedValue(true),
    requestMultiple: jest.fn().mockResolvedValue({
      'android.permission.READ_PHONE_STATE': 'granted',
      'android.permission.READ_CALL_LOG': 'granted',
      'android.permission.CALL_PHONE': 'granted'
    }),
    PERMISSIONS: {
      READ_PHONE_STATE: 'android.permission.READ_PHONE_STATE',
      READ_CALL_LOG: 'android.permission.READ_CALL_LOG',
      CALL_PHONE: 'android.permission.CALL_PHONE'
    },
    RESULTS: {
      GRANTED: 'granted'
    }
  }
}));

describe('ShabariVpnEngine', () => {
  let engine;

  beforeEach(() => {
    jest.clearAllMocks();
    engine = new ShabariVpnEngine();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      const result = await engine.initialize();
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('VPN engine initialized successfully');
      expect(engine.isInitialized).toBe(true);
    });

    it('should not re-initialize if already initialized', async () => {
      await engine.initialize();
      const result = await engine.initialize();
      
      expect(result.message).toBe('Already initialized');
    });
  });

  describe('protection control', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should start protection', async () => {
      const result = await engine.startProtection();
      
      expect(mockNativeModule.startProtection).toHaveBeenCalledWith({});
      expect(result.success).toBe(true);
      expect(engine.currentStatus).toBe('running');
    });

    it('should stop protection', async () => {
      await engine.startProtection();
      const result = await engine.stopProtection();
      
      expect(mockNativeModule.stopProtection).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(engine.currentStatus).toBe('stopped');
    });

    it('should get current status', async () => {
      const status = await engine.getStatus();
      
      expect(status.status).toBe('running');
      expect(status.isRunning).toBe(true);
      expect(status.statistics).toBeDefined();
    });
  });

  describe('reporting', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should report a domain', async () => {
      const result = await engine.report('malware.com', 'domain', 'Malware site');
      
      expect(mockNativeModule.report).toHaveBeenCalledWith(
        'malware.com',
        'domain',
        'Malware site'
      );
      expect(result.success).toBe(true);
    });

    it('should validate report type', async () => {
      await expect(engine.report('test', 'invalid'))
        .rejects.toThrow('Invalid report type');
    });

    it('should require target and type', async () => {
      await expect(engine.report())
        .rejects.toThrow('Target and type are required');
    });
  });

  describe('target checking', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should check if domain is blocked', async () => {
      const result = await engine.checkTarget('malware.com', 'domain');
      
      expect(mockNativeModule.checkTarget).toHaveBeenCalledWith(
        'malware.com',
        'domain'
      );
      expect(result.isBlocked).toBe(true);
    });

    it('should validate target type', async () => {
      await expect(engine.checkTarget('test', 'invalid'))
        .rejects.toThrow('Invalid target type');
    });
  });

  describe('configuration', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should configure settings', async () => {
      const settings = {
        blockAds: false,
        blockTrackers: true
      };
      
      const result = await engine.configure(settings);
      
      expect(mockNativeModule.configure).toHaveBeenCalledWith({
        blockAds: false,
        blockTrackers: true,
        blockMalware: true,
        blockPhishing: true,
        enableCallProtection: true,
        enableDnsOverHttps: false
      });
      expect(result.success).toBe(true);
    });

    it('should get current configuration', async () => {
      const config = await engine.getConfiguration();
      
      expect(config.blockAds).toBe(true);
      expect(config.blockTrackers).toBe(true);
    });
  });

  describe('statistics', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should get statistics', async () => {
      const stats = await engine.getStatistics();
      
      expect(stats.blocked_count).toBe(100);
      expect(stats.warned_count).toBe(50);
    });

    it('should format statistics correctly', () => {
      const stats = {
        blocked_count: 100,
        warned_count: 50,
        bytes_transferred: 1024000,
        uptime_ms: 3600000,
        dns_stats: {
          queries_processed: 1000,
          cache_hit_rate: 75.5
        }
      };
      
      const formatted = engine.formatStatistics(stats);
      
      expect(formatted.threatsBlocked).toBe(100);
      expect(formatted.threatsWarned).toBe(50);
      expect(formatted.dataTransferred).toBe('1000 KB');
      expect(formatted.uptime).toBe('1h 0m');
      expect(formatted.dnsQueries).toBe(1000);
      expect(formatted.cacheHitRate).toBe('75.5%');
    });
  });

  describe('utility functions', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should format phone numbers', () => {
      expect(engine.formatPhoneNumber('+1234567890')).toBe('+12****890');
      expect(engine.formatPhoneNumber('123')).toBe('****');
      expect(engine.formatPhoneNumber(null)).toBe('****');
    });

    it('should format bytes correctly', () => {
      expect(engine.formatBytes(0)).toBe('0 B');
      expect(engine.formatBytes(1024)).toBe('1 KB');
      expect(engine.formatBytes(1048576)).toBe('1 MB');
      expect(engine.formatBytes(1073741824)).toBe('1 GB');
    });

    it('should format uptime correctly', () => {
      expect(engine.formatUptime(1000)).toBe('1s');
      expect(engine.formatUptime(60000)).toBe('1m 0s');
      expect(engine.formatUptime(3600000)).toBe('1h 0m');
      expect(engine.formatUptime(86400000)).toBe('1d 0h');
    });
  });

  describe('event handling', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should register event listeners', () => {
      const callback = jest.fn();
      const listener = engine.on('BLOCKED', callback);
      
      expect(listener).toBeDefined();
      expect(listener.remove).toBeDefined();
    });

    it('should validate event types', () => {
      expect(() => engine.on('INVALID_EVENT', jest.fn()))
        .toThrow('Invalid event type');
    });

    it('should remove event listeners', () => {
      const callback = jest.fn();
      engine.on('BLOCKED', callback);
      
      expect(() => engine.off('BLOCKED')).not.toThrow();
    });

    it('should remove all listeners', () => {
      engine.on('BLOCKED', jest.fn());
      engine.on('WARNING', jest.fn());
      
      expect(() => engine.removeAllListeners()).not.toThrow();
    });
  });

  describe('cache management', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should clear cache', async () => {
      const result = await engine.clearCache();
      
      expect(mockNativeModule.clearCache).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('state management', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should track protection status', async () => {
      expect(engine.isProtectionRunning()).toBe(false);
      
      await engine.startProtection();
      expect(engine.isProtectionRunning()).toBe(true);
      
      await engine.stopProtection();
      expect(engine.isProtectionRunning()).toBe(false);
    });

    it('should cache statistics', async () => {
      await engine.getStatistics();
      
      const cached = engine.getCachedStatistics();
      expect(cached).toBeDefined();
      expect(cached.blocked_count).toBe(100);
    });

    it('should cache configuration', async () => {
      await engine.getConfiguration();
      
      const cached = engine.getCachedConfiguration();
      expect(cached).toBeDefined();
      expect(cached.blockAds).toBe(true);
    });
  });
});

describe('Module exports', () => {
  it('should export default instance', () => {
    expect(shabariVpn).toBeDefined();
    expect(shabariVpn).toBeInstanceOf(ShabariVpnEngine);
  });

  it('should export EVENTS constant', () => {
    expect(EVENTS).toBeDefined();
    expect(EVENTS.BLOCKED).toBe('ShabariVpnBlocked');
    expect(EVENTS.WARNING).toBe('ShabariVpnWarning');
  });

  it('should export convenience functions', () => {
    const { startProtection, stopProtection, getStatus } = require('../js/shabari-vpn');
    
    expect(typeof startProtection).toBe('function');
    expect(typeof stopProtection).toBe('function');
    expect(typeof getStatus).toBe('function');
  });
});
