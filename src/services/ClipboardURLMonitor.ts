import { AppState, AppStateStatus, Platform } from 'react-native';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { LinkScannerService, UrlScanResult } from './ScannerService';

// Conditional import for Clipboard
let Clipboard: any = null;
try {
  if (Platform.OS !== 'web') {
    Clipboard = require('@react-native-clipboard/clipboard');
  }
} catch (error) {
  console.log('Clipboard library not available:', error);
}

export interface ClipboardMonitorCallbacks {
  onUrlDetected: (url: string) => void;
  onScanComplete: (result: { url: string; isSafe: boolean; details: string }) => void;
  onError: (error: string) => void;
}

export class ClipboardURLMonitor {
  private static instance: ClipboardURLMonitor;
  private callbacks: ClipboardMonitorCallbacks | null = null;
  private isMonitoring: boolean = false;
  private appStateSubscription: any = null;
  private monitorInterval: any = null;
  private lastCheckedContent: string = '';
  private isInitialized: boolean = false;

  private constructor() {
    this.setupAppStateListener();
  }

  public static getInstance(): ClipboardURLMonitor {
    if (!ClipboardURLMonitor.instance) {
      ClipboardURLMonitor.instance = new ClipboardURLMonitor();
    }
    return ClipboardURLMonitor.instance;
  }

  /**
   * Check if user has premium subscription
   */
  private isPremiumUser(): boolean {
    return useSubscriptionStore.getState().isPremium;
  }

  private setupAppStateListener(): void {
    try {
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
    } catch (error) {
      console.error('Failed to setup app state listener:', error);
    }
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'active' && this.isMonitoring) {
      // Check clipboard when app becomes active (user returns from WhatsApp)
      setTimeout(() => {
        this.checkClipboard();
      }, 1000);
    }
  }

  public initialize(callbacks: ClipboardMonitorCallbacks): void {
    this.callbacks = callbacks;
    this.isInitialized = true;
    console.log('📋 Clipboard URL Monitor initialized');
  }

  public async startMonitoring(): Promise<void> {
    if (!this.isInitialized || !Clipboard) {
      console.log('⚠️ Clipboard monitoring not available on this platform');
      return;
    }

    if (!this.isPremiumUser()) {
      console.log('🔒 ClipboardURLMonitor: Premium subscription required for automatic monitoring');
      return;
    }

    // Check if feature is enabled in user preferences
    try {
      const { useFeaturePermissionStore } = await import('../stores/featurePermissionStore');
      const { getFeatureStatus } = useFeaturePermissionStore.getState();
      const featureStatus = getFeatureStatus('clipboard_monitor');
      
      if (!featureStatus.isEnabled) {
        console.log('⚠️ ClipboardURLMonitor: Feature disabled by user preferences');
        return;
      }
      
      if (!featureStatus.hasPermissions) {
        console.log('⚠️ ClipboardURLMonitor: Required permissions not granted');
      return;
      }
    } catch (error) {
      console.log('⚠️ ClipboardURLMonitor: Feature permission check failed, proceeding with default behavior');
    }

    if (this.isMonitoring) {
      console.log('📋 Clipboard monitoring already active');
      return;
    }

    this.isMonitoring = true;
    
    // Check clipboard every 2 seconds when app is active
    this.monitorInterval = setInterval(() => {
      this.checkClipboard();
    }, 2000);

    console.log('📋 Started automatic clipboard URL monitoring (Premium Feature)');
  }

  public stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.isMonitoring = false;
    console.log('📋 Stopped clipboard URL monitoring');
  }

  private async checkClipboard(): Promise<void> {
    if (!Clipboard || !this.callbacks) {
      return;
    }

    try {
      const clipboardContent = await Clipboard.getString();
      
      // Check if content has changed and is a URL
      if (clipboardContent && 
          clipboardContent !== this.lastCheckedContent && 
          this.isUrl(clipboardContent)) {
        
        this.lastCheckedContent = clipboardContent;
        console.log('📋 New URL detected in clipboard:', clipboardContent);
        
        // Notify that URL was detected
        this.callbacks.onUrlDetected(clipboardContent);
        
        // Scan the URL
        await this.scanDetectedUrl(clipboardContent);
      }
    } catch (error) {
      console.error('📋 Error checking clipboard:', error);
      if (this.callbacks) {
        this.callbacks.onError('Failed to check clipboard');
      }
    }
  }

  private isUrl(text: string): boolean {
    try {
      // Simple URL validation
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      return urlPattern.test(text.trim()) || text.includes('://');
    } catch (error) {
      return false;
    }
  }

  private async scanDetectedUrl(url: string): Promise<void> {
    if (!this.callbacks) {
      return;
    }

    try {
      // Normalize the URL
      let normalizedUrl = url.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }

      // Initialize LinkScannerService if needed
      await LinkScannerService.initializeService();

      // Scan the URL
      console.log('📋 Scanning clipboard URL:', normalizedUrl);
      const scanResult: UrlScanResult = await LinkScannerService.scanUrl(normalizedUrl);

      // Notify scan completion
      this.callbacks.onScanComplete({
        url: normalizedUrl,
        isSafe: scanResult.isSafe,
        details: scanResult.details,
      });

    } catch (error) {
      console.error('📋 Error scanning clipboard URL:', error);
      if (this.callbacks) {
        this.callbacks.onError('Failed to scan clipboard URL');
      }
    }
  }

  public async scanUrlManually(url: string): Promise<void> {
    // Allow manual URL scanning for both free and premium users
    try {
      await this.scanDetectedUrl(url);
    } catch (error) {
      console.error('Manual clipboard URL scan failed:', error);
      if (this.callbacks) {
        this.callbacks.onError('Manual scan failed');
      }
    }
  }

  public async scanClipboardManually(): Promise<{ status: 'scanned' | 'not_a_url' | 'error', result?: UrlScanResult, message?: string, url?: string }> {
    if (!Clipboard) {
      return { status: 'error', message: 'Clipboard not available.' };
    }

    try {
      const clipboardContent = await Clipboard.getString();
      
      if (clipboardContent && this.isUrl(clipboardContent)) {
        this.lastCheckedContent = clipboardContent;
        console.log('📋 Manually scanning URL from clipboard:', clipboardContent);
        
        let normalizedUrl = clipboardContent.trim();
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
          normalizedUrl = 'https://' + normalizedUrl;
        }

        await LinkScannerService.initializeService();
        const scanResult: UrlScanResult = await LinkScannerService.scanUrl(normalizedUrl);

        if (this.callbacks) {
          this.callbacks.onScanComplete({
            url: normalizedUrl,
            isSafe: scanResult.isSafe,
            details: scanResult.details,
          });
        }
        return { status: 'scanned', result: scanResult, url: normalizedUrl };

      } else {
        return { status: 'not_a_url', message: 'No URL found in the clipboard.' };
      }
    } catch (error) {
      console.error('📋 Error during manual clipboard scan:', error);
      if (this.callbacks) {
        this.callbacks.onError('Failed to scan clipboard');
      }
      return { status: 'error', message: 'An error occurred during the scan.' };
    }
  }

  public cleanup(): void {
    try {
      this.stopMonitoring();
      
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
        this.appStateSubscription = null;
      }

      this.callbacks = null;
      this.isInitialized = false;
      this.lastCheckedContent = '';
      
      console.log('📋 Clipboard URL Monitor cleaned up');
    } catch (error) {
      console.error('📋 Clipboard monitor cleanup error:', error);
    }
  }

  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  public getServiceStatus(): {
    isInitialized: boolean;
    isMonitoring: boolean;
    isPremiumUser: boolean;
    automaticMonitoringAvailable: boolean;
  } {
    const isPremium = this.isPremiumUser();
    return {
      isInitialized: this.isInitialized,
      isMonitoring: this.isMonitoring,
      isPremiumUser: isPremium,
      automaticMonitoringAvailable: true, // Core security feature - always available
    };
  }

  public isServiceMonitoring(): boolean {
    return this.isMonitoring;
  }
}

// Export singleton instance
export const clipboardMonitor = ClipboardURLMonitor.getInstance(); 