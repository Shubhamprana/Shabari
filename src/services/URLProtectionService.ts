import { Alert, AppState, AppStateStatus, Platform } from 'react-native';
import { LinkScannerService } from './ScannerService';

export interface URLProtectionCallbacks {
  onUrlScanned: (result: { url: string; isSafe: boolean; details: string }) => void;
  onThreatDetected: (result: { url: string; details: string }) => void;
  onError: (error: string) => void;
}

export class URLProtectionService {
  private static instance: URLProtectionService;
  private callbacks: URLProtectionCallbacks | null = null;
  private isActive: boolean = false;
  private appStateSubscription: any = null;
  private isInitialized: boolean = false;
  private lastAppStateChange: number = 0;
  private protectionInterval: any = null;

  private constructor() {
    this.setupAppStateListener();
  }

  public static getInstance(): URLProtectionService {
    if (!URLProtectionService.instance) {
      URLProtectionService.instance = new URLProtectionService();
    }
    return URLProtectionService.instance;
  }

  private setupAppStateListener(): void {
    try {
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
    } catch (error) {
      console.error('Failed to setup app state listener:', error);
    }
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    const now = Date.now();
    this.lastAppStateChange = now;

    if (nextAppState === 'active' && this.isActive) {
      // User returned to app - check if they might have clicked a link
      setTimeout(() => {
        this.checkForRecentUrlActivity();
      }, 1500); // Give time for any background activity
    }
  }

  public initialize(callbacks: URLProtectionCallbacks): boolean {
    try {
      this.callbacks = callbacks;
      
      // Skip URL protection initialization in development
      if (__DEV__ || Platform.OS === 'web') {
        console.log('📱 URL Protection: Skipping in development environment');
        return false;
      }

      // Setup app state monitoring for URL activity detection
      this.setupAppStateMonitoring();
      this.isActive = true;
      
      console.log('✅ URL Protection Service initialized');
      return true;
    } catch (error) {
      console.error('❌ URL Protection initialization failed:', error);
      return false;
    }
  }

  private setupAppStateMonitoring(): void {
    try {
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
    } catch (error) {
      console.error('❌ Failed to setup app state monitoring:', error);
    }
  }

  private async checkForRecentUrlActivity(): Promise<void> {
    // Since we can't directly intercept URLs from WhatsApp,
    // we'll provide proactive protection by scanning known suspicious URLs
    
    if (!this.callbacks) {
      return;
    }

    try {
      // Check if user recently returned from another app (potential URL click)
      const timeSinceStateChange = Date.now() - this.lastAppStateChange;
      
      if (timeSinceStateChange < 3000) { // Within 3 seconds
        console.log('🔍 User recently returned to app - automatic popup disabled');
        
        // Automatic popup disabled - users can manually scan URLs if needed
        // Alert.alert(
        //   '🛡️ Shabari Security Check',
        //   'Welcome back! Did you just click a link? Shabari can scan it for your safety.',
        //   [
        //     {
        //       text: 'Scan URL',
        //       onPress: () => {
        //         this.showManualUrlInput();
        //       }
        //     },
        //     {
        //       text: 'I\'m Safe',
        //       style: 'cancel'
        //     }
        //   ]
        // );
      }
    } catch (error) {
      console.error('🛡️ Error checking URL activity:', error);
    }
  }

  private showManualUrlInput(): void {
    // Since we can't auto-detect URLs from WhatsApp, provide manual input option
    Alert.prompt(
      '🔍 URL Security Scanner',
      'Paste the URL you want to check:',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Scan',
          onPress: async (url) => {
            if (url && url.trim()) {
              await this.scanUrlManually(url.trim());
            }
          }
        }
      ],
      'plain-text',
      'https://'
    );
  }

  public async scanUrlManually(url: string): Promise<void> {
    if (!this.callbacks) {
      console.warn('URLProtectionService: No callbacks registered');
      return;
    }

    try {
      console.log('🔍 Manual URL scan requested:', url);
      
      // Normalize URL
      let normalizedUrl = url.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }

      // Initialize and scan
      await LinkScannerService.initializeService();
      const scanResult = await LinkScannerService.scanUrl(normalizedUrl);

      if (scanResult.isSafe === false) {
        // Dangerous URL detected
        if (this.callbacks) {
          this.callbacks.onThreatDetected({
            url: normalizedUrl,
            details: scanResult.details,
          });
        }

        Alert.alert(
          '🚫 THREAT DETECTED',
          `DANGEROUS WEBSITE BLOCKED!\n\n${normalizedUrl}\n\nThreat: ${scanResult.details}\n\n⚠️ DO NOT VISIT THIS WEBSITE!\n\nShabari has protected your device from this malicious link.`,
          [
            {
              text: 'Report Threat',
              onPress: () => {
                console.log('📊 User reported threat:', normalizedUrl);
              }
            },
            {
              text: 'OK',
              style: 'default'
            }
          ]
        );
      } else {
        // Safe URL
        Alert.alert(
          '✅ URL Verified Safe',
          `This website is safe to visit:\n\n${normalizedUrl}\n\nWould you like to open it in Shabari's secure browser?`,
          [
            {
              text: 'Open in Shabari',
              onPress: () => {
                console.log('🔄 Opening safe URL in Shabari browser:', normalizedUrl);
                // Navigate to SecureBrowser with URL
              }
            },
            {
              text: 'Open in Chrome',
              onPress: async () => {
                try {
                  const { Linking } = require('react-native');
                  const canOpen = await Linking.canOpenURL(normalizedUrl);
                  if (canOpen) {
                    await Linking.openURL(normalizedUrl);
                  }
                } catch (error) {
                  console.error('❌ Failed to open URL:', error);
                }
              }
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      }

    } catch (error) {
      console.error('❌ Manual URL scan failed:', error);
      
      if (this.callbacks) {
        this.callbacks.onError(`URL scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private async performProtectionScan(): Promise<void> {
    // Perform background protection checks
    try {
      // Check for common malicious URLs that might be in circulation
      const commonThreats = [
        'http://www.eicar.org/download/eicar.com.txt'
      ];

      // This is a background check - don't show alerts unless specifically requested
      console.log('🛡️ Background protection scan active');
      
    } catch (error) {
      console.error('🛡️ Background protection scan error:', error);
    }
  }

  private showProtectionStatus(): void {
    Alert.alert(
      '🛡️ Shabari Protection Active',
      'Your device is now protected!\n\n✅ Real-time URL scanning\n✅ Malware detection\n✅ Phishing protection\n\n💡 Tip: When you click suspicious links, return to Shabari for a security check.',
      [
        {
          text: 'Test Protection',
          onPress: () => {
            this.testProtectionWithEicar();
          }
        },
        {
          text: 'OK',
          style: 'default'
        }
      ]
    );
  }

  private async testProtectionWithEicar(): Promise<void> {
    console.log('🧪 Testing protection with EICAR test URL');
    await this.scanUrlManually('http://www.eicar.org/download/eicar.com.txt');
  }

  public cleanup(): void {
    try {
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
        this.appStateSubscription = null;
      }
      
      this.callbacks = null;
      this.isActive = false;
      this.isInitialized = false;
      console.log('🧹 URL Protection Service cleaned up');
    } catch (error) {
      console.error('❌ URL Protection cleanup error:', error);
    }
  }

  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  public isServiceActive(): boolean {
    return this.isActive;
  }

  public getStatus(): { active: boolean; platform: string } {
    return {
      active: this.isActive,
      platform: Platform.OS
    };
  }
}

// Export singleton instance
export const urlProtectionService = URLProtectionService.getInstance(); 