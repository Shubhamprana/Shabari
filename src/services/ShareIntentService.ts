import { useEffect } from 'react';
import { Alert, AppState, AppStateStatus, Linking, Platform } from 'react-native';
import { FileScannerService, LinkScannerService } from './ScannerService';

// Import the Expo share intent library
let useShareIntent: any = null;
let isShareIntentAvailable = false;

try {
  if (Platform.OS !== 'web') {
    const ExpoShareIntent = require('expo-share-intent');
    useShareIntent = ExpoShareIntent.useShareIntent;
    isShareIntentAvailable = true;
    console.log('✅ Expo Share Intent library loaded successfully');
  }
} catch (error) {
  console.log('📱 expo-share-intent not available:', error);
  isShareIntentAvailable = false;
}

export interface SharedContent {
  type: 'text' | 'url' | 'file';
  content: string;
  timestamp: Date;
  fileName?: string;
  fileUri?: string;
}

export interface ShareIntentCallbacks {
  onUrlReceived: (url: string) => void;
  onFileReceived: (file: { fileName: string; contentUri: string }) => void;
  onScanComplete: (result: { url?: string; fileName?: string; isSafe: boolean; details: string; scanType: 'url' | 'file' }) => void;
  onUrlBlocked: (result: { url: string; details: string }) => void;
  onUrlVerified: (result: { url: string; details: string }) => void;
  onError: (error: string) => void;
}

export class ShareIntentService {
  private static instance: ShareIntentService;
  private callbacks: ShareIntentCallbacks | null = null;
  private isInitialized: boolean = false;
  private appStateSubscription: any = null;
  private linkingSubscription: any = null;
  private shareIntentData: any = null;

  private constructor() {
    this.setupAppStateListener();
    this.setupLinkingListener();
  }

  public static getInstance(): ShareIntentService {
    if (!ShareIntentService.instance) {
      ShareIntentService.instance = new ShareIntentService();
    }
    return ShareIntentService.instance;
  }

  private setupAppStateListener(): void {
    try {
      // Listen for app state changes to detect when app is opened via share intent
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
    } catch (error) {
      console.error('Failed to setup app state listener:', error);
    }
  }

  private setupLinkingListener(): void {
    try {
      // Listen for URL intents (this is the key for automatic URL interception)
      this.linkingSubscription = Linking.addEventListener('url', this.handleIncomingUrl.bind(this));
      
      // Check for initial URL when app starts
      Linking.getInitialURL().then((url) => {
        if (url) {
          console.log('🔗 App opened with initial URL:', url);
          this.handleIncomingUrl({ url });
        }
      });
    } catch (error) {
      console.error('Failed to setup linking listener:', error);
    }
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'active') {
      // Check for shared content when app becomes active
      this.checkForSharedContent();
    }
  }

  private async handleIncomingUrl(event: { url: string }): Promise<void> {
    const url = event.url;
    console.log('🔗 Incoming URL detected:', url);

    // Skip processing Expo development URLs
    if (url.startsWith('exp://') || url.includes('localhost') || url.includes('192.168')) {
      console.log('⚠️ Skipping development URL');
      return;
    }

    // This is the core automatic URL interception logic from link-browser.md
    await this.interceptAndScanUrl(url);
  }

  private async interceptAndScanUrl(url: string): Promise<void> {
    if (!this.callbacks) {
      console.warn('ShareIntentService: No callbacks registered for URL interception');
      // Still proceed with scanning to block dangerous URLs
    }

    try {
      console.log('🛡️ INTERCEPTING URL:', url);
      
      // Normalize the URL
      let normalizedUrl = url.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }

      // Notify that URL was intercepted (if callbacks exist)
      if (this.callbacks) {
        this.callbacks.onUrlReceived(normalizedUrl);
      }

      // Initialize LinkScannerService if needed
      await LinkScannerService.initializeService();

      // CRITICAL: Scan the URL BEFORE allowing it to proceed
      console.log('🔍 Scanning intercepted URL:', normalizedUrl);
      const scanResult = await LinkScannerService.scanUrl(normalizedUrl);

      console.log('📊 Scan result:', scanResult);

      if (scanResult.isSafe === false) {
        // BLOCK the dangerous URL - this is the core protection
        console.log('🚫 BLOCKING DANGEROUS URL:', normalizedUrl);
        
        if (this.callbacks) {
          this.callbacks.onUrlBlocked({
            url: normalizedUrl,
            details: scanResult.details,
          });
        }

        // Show immediate blocking alert
        Alert.alert(
          '🛡️ SHABARI PROTECTION',
          `DANGEROUS WEBSITE BLOCKED!\n\n${normalizedUrl}\n\nThreat: ${scanResult.details}\n\n⚠️ This malicious link was automatically intercepted and blocked to protect your device.`,
          [
            {
              text: 'View Details',
              onPress: () => {
                // Navigate to scan result screen with dangerous verdict
                if (this.callbacks) {
                  this.callbacks.onScanComplete({
                    url: normalizedUrl,
                    isSafe: false,
                    details: scanResult.details,
                    scanType: 'url',
                  });
                }
              }
            },
            {
              text: 'OK',
              style: 'default'
            }
          ]
        );

        // DO NOT open the URL - protection complete
        return;

      } else {
        // URL is safe - allow user to choose how to proceed
        console.log('✅ URL verified as safe:', normalizedUrl);
        
        if (this.callbacks) {
          this.callbacks.onUrlVerified({
            url: normalizedUrl,
            details: scanResult.details,
          });
        }

        // Show safe URL options
        Alert.alert(
          '🔗 Link Verified Safe',
          `This link has been scanned and verified as safe:\n\n${normalizedUrl}\n\nHow would you like to open it?`,
          [
            {
              text: 'Open in Shabari Browser',
              onPress: () => {
                console.log('🔄 Opening safe URL in Shabari browser');
                if (this.callbacks) {
                  this.callbacks.onScanComplete({
                    url: normalizedUrl,
                    isSafe: true,
                    details: scanResult.details,
                    scanType: 'url',
                  });
                }
              }
            },
            {
              text: 'Open in System Browser',
              onPress: () => {
                console.log('🔄 Opening safe URL in system browser');
                Linking.openURL(normalizedUrl);
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
      console.error('❌ URL scanning error:', error);
      if (this.callbacks) {
        this.callbacks.onError(`Failed to scan URL: ${error}`);
      }
    }
  }

  private async handleSharedFiles(files: any[]): Promise<void> {
    if (!files || files.length === 0) {
      return;
    }

    console.log('📁 Processing shared files:', files);

    for (const file of files) {
      try {
        const fileName = file.fileName || file.name || 'Unknown File';
        const fileUri = file.path || file.uri;
        
        console.log('🔍 Processing shared file for quarantine:', fileName);

        // Notify that file was received
        if (this.callbacks) {
          this.callbacks.onFileReceived({
            fileName: fileName,
            contentUri: fileUri
          });
        }

        // 🚨 CRITICAL FIX: Use FileScannerService.scanFile() which includes quarantine
        // This follows the correct workflow from doccument-image-file.md:
        // Step 1: Quarantine file (handled inside FileScannerService.scanFile)
        // Step 2: Scan quarantined file 
        // Step 3: Return results
        console.log('🔍 Scanning and quarantining shared file:', fileName);
        const scanResult = await FileScannerService.scanFile(fileUri, fileName);

        console.log('📊 File scan completed:', {
          fileName,
          isSafe: scanResult.isSafe,
          threatName: scanResult.threatName,
          quarantinedPath: scanResult.filePath
        });

        if (scanResult.isSafe === false) {
          console.log('🚫 BLOCKING DANGEROUS FILE:', fileName);
          
          Alert.alert(
            '🛡️ SHABARI PROTECTION',
            `DANGEROUS FILE BLOCKED!\n\nFile: ${fileName}\nThreat: ${scanResult.threatName || 'Unknown threat'}\n\n⚠️ This malicious file was automatically quarantined and blocked to protect your device.\n\nYou can view it in the Quarantine folder.`,
            [
              {
                text: 'View in Quarantine',
                onPress: () => {
                  if (this.callbacks) {
                    this.callbacks.onScanComplete({
                      fileName: fileName,
                      isSafe: false,
                      details: scanResult.details,
                      scanType: 'file',
                    });
                  }
                }
              },
              {
                text: 'OK',
                style: 'default'
              }
            ]
          );
        } else {
          console.log('✅ File verified as safe:', fileName);
          
          Alert.alert(
            '📁 File Verified Safe',
            `File "${fileName}" has been scanned and quarantined for your security, then verified as safe.\n\nDetails: ${scanResult.details}\n\nYou can restore it from the Quarantine folder if needed.`,
            [
              {
                text: 'View in Quarantine',
                onPress: () => {
                  if (this.callbacks) {
                    this.callbacks.onScanComplete({
                      fileName: fileName,
                      isSafe: true,
                      details: scanResult.details,
                      scanType: 'file',
                    });
                  }
                }
              },
              {
                text: 'OK',
                style: 'default'
              }
            ]
          );
        }

      } catch (error) {
        console.error('Error processing shared file:', error);
        if (this.callbacks) {
          this.callbacks.onError(`Failed to process file ${file.fileName}: ${error}`);
        }
      }
    }
  }

  public initialize(callbacks: ShareIntentCallbacks): void {
    this.callbacks = callbacks;
    this.isInitialized = true;
    
    console.log('📱 ShareIntentService initialized with callbacks');
    
    // Set up share intent listeners if available
    if (isShareIntentAvailable) {
      this.setupSharingIntentListeners();
    }
    
    // Check for any pending shared content immediately
    this.checkForSharedContent();
  }

  private setupSharingIntentListeners(): void {
    try {
      console.log('🔗 Setting up Expo Share Intent listeners');
      // Note: The actual useShareIntent hook should be used in React components
      // This service provides the callback handling logic
    } catch (error) {
      console.error('Failed to setup sharing intent listeners:', error);
    }
  }

  private async handleSharedText(sharedText: string): Promise<void> {
    console.log('📝 Processing shared text:', sharedText);

    if (this.isUrl(sharedText)) {
      // Handle as URL
      await this.interceptAndScanUrl(sharedText);
    } else {
      // Handle as plain text
      console.log('📝 Received plain text share');
      if (this.callbacks) {
        this.callbacks.onScanComplete({
          url: sharedText,
          isSafe: true,
          details: 'Plain text content - no scanning required',
          scanType: 'url',
        });
      }
    }
  }

  private checkForSharedContent(): void {
    // This will be handled by the useShareIntent hook in React components
    console.log('🔍 Checking for shared content...');
  }

  private isUrl(text: string): boolean {
    try {
      const urlRegex = /^(https?:\/\/|www\.)/i;
      return urlRegex.test(text.trim()) || text.includes('.com') || text.includes('.org') || text.includes('.net');
    } catch (error) {
      return false;
    }
  }

  public async scanUrlManually(url: string): Promise<void> {
    await this.interceptAndScanUrl(url);
  }

  public cleanup(): void {
    try {
      if (this.appStateSubscription) {
        this.appStateSubscription.remove();
      }
      if (this.linkingSubscription) {
        this.linkingSubscription.remove();
      }
      this.callbacks = null;
      this.isInitialized = false;
      console.log('🧹 ShareIntentService cleaned up');
    } catch (error) {
      console.error('Error during ShareIntentService cleanup:', error);
    }
  }

  // Public methods for checking service status
  public isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  public isShareIntentSupported(): boolean {
    return isShareIntentAvailable;
  }

  public getStatus(): { initialized: boolean; nativeSupport: boolean; platform: string } {
    return {
      initialized: this.isInitialized,
      nativeSupport: isShareIntentAvailable,
      platform: Platform.OS,
    };
  }

  // Method to handle share intent data from React components
  public async processShareIntentData(shareIntent: any): Promise<void> {
    if (!shareIntent) return;

    try {
      console.log('📱 Processing share intent data:', shareIntent);

      if (shareIntent.text || shareIntent.webUrl) {
        const contentToScan = shareIntent.webUrl || shareIntent.text;
        await this.handleSharedText(contentToScan);
      }

      if (shareIntent.files && shareIntent.files.length > 0) {
        await this.handleSharedFiles(shareIntent.files);
      }
    } catch (error) {
      console.error('Error processing share intent data:', error);
      if (this.callbacks) {
        this.callbacks.onError('Failed to process shared content: ' + error);
      }
    }
  }
}

export const openUrlSafely = async (url: string): Promise<boolean> => {
  try {
    const service = ShareIntentService.getInstance();
    await service.scanUrlManually(url);
    return true;
  } catch (error) {
    console.error('Failed to safely open URL:', error);
    return false;
  }
};

// Custom React hook that integrates expo-share-intent with ShareIntentService
export const useShabariShareIntent = (callbacks: ShareIntentCallbacks) => {
  const service = ShareIntentService.getInstance();

  // Initialize the service with callbacks
  useEffect(() => {
    service.initialize(callbacks);
    return () => {
      service.cleanup();
    };
  }, [callbacks]);

  // Get share intent data if available
  let shareIntentData = null;
  if (isShareIntentAvailable && useShareIntent) {
    try {
      shareIntentData = useShareIntent();
    } catch (error) {
      console.error('Error in useShareIntent hook:', error);
    }
  }

  // Process share intent data when it changes
  useEffect(() => {
    if (shareIntentData?.hasShareIntent && shareIntentData?.shareIntent) {
      console.log('📱 Share intent detected:', shareIntentData.shareIntent);
      service.processShareIntentData(shareIntentData.shareIntent);
      
      // Reset the share intent after processing
      if (shareIntentData.resetShareIntent) {
        shareIntentData.resetShareIntent();
      }
    }
  }, [shareIntentData?.hasShareIntent, shareIntentData?.shareIntent, service]);

  return {
    isSupported: service.isShareIntentSupported(),
    isInitialized: service.isServiceInitialized(),
    scanUrlManually: service.scanUrlManually.bind(service),
    status: service.getStatus(),
    shareIntentData: shareIntentData
  };
};

// Export singleton instance for use in App.tsx
export const shareIntentService = ShareIntentService.getInstance();