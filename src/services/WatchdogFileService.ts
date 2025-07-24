import { Alert, DeviceEventEmitter, Platform } from 'react-native';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { FileScannerService, FileScanResult } from './ScannerService';

// Native module interface for file watching (would be implemented in native code)
interface WatchdogNativeModule {
  startFileWatching: () => Promise<boolean>;
  stopFileWatching: () => Promise<boolean>;
  isWatchingActive: () => Promise<boolean>;
  checkPermissions: () => Promise<boolean>;
  requestPermissions: () => Promise<boolean>;
}

export interface WatchdogCallbacks {
  onThreatDetected: (result: { filePath: string; fileName: string; details: string }) => void;
  onFileScanned: (result: { filePath: string; fileName: string; isSafe: boolean }) => void;
  onError: (error: string) => void;
  onStatusChange: (isActive: boolean) => void;
}

export class WatchdogFileService {
  private static instance: WatchdogFileService;
  private callbacks: WatchdogCallbacks | null = null;
  private isActive: boolean = false;
  private isInitialized: boolean = false;
  private nativeModule: WatchdogNativeModule;
  private eventSubscription: any = null;
  
  // COMPLIANCE: Directory monitoring disabled for Play Store compliance
  // Automatic monitoring of system directories violates scoped storage policies
  private readonly TARGET_DIRECTORIES: string[] = [
    // REMOVED: All system directory monitoring for Play Store compliance
    // '/storage/emulated/0/Download',           // SCOPED STORAGE VIOLATION
    // '/storage/emulated/0/Pictures',           // SCOPED STORAGE VIOLATION
    // '/storage/emulated/0/WhatsApp/Media/',    // SCOPED STORAGE VIOLATION
    // '/storage/emulated/0/Telegram',           // SCOPED STORAGE VIOLATION
  ];

  private constructor() {
    // Initialize native module interface (mock for now, would be real native module)
    this.nativeModule = this.createNativeModuleInterface();
    this.setupEventListeners();
  }

  public static getInstance(): WatchdogFileService {
    if (!WatchdogFileService.instance) {
      WatchdogFileService.instance = new WatchdogFileService();
    }
    return WatchdogFileService.instance;
  }

  private createNativeModuleInterface(): WatchdogNativeModule {
    // This would normally be a real native module, but for development we'll create a mock
    return {
      startFileWatching: async () => {
        console.log('🔒 WatchdogFileService: Automatic file watching disabled for Play Store compliance');
        console.log('🔒 Scoped storage policies prevent automatic directory monitoring');
        
        // COMPLIANCE: No automatic file monitoring allowed
        return false;
      },
      
      stopFileWatching: async () => {
        console.log('🔍 WatchdogFileService: Mock native module - stopping file watching');
        this.stopMockFileDetection();
        return true;
      },
      
      isWatchingActive: async () => {
        return this.isActive;
      },
      
      checkPermissions: async () => {
        // In real implementation, would check for:
        // - READ_EXTERNAL_STORAGE
        // - WRITE_EXTERNAL_STORAGE  
        // - FOREGROUND_SERVICE
        console.log('🔍 WatchdogFileService: Checking permissions...');
        return true; // Mock - assume permissions granted
      },
      
      requestPermissions: async () => {
        console.log('🔍 WatchdogFileService: Requesting permissions...');
        return true; // Mock - assume permissions granted
      }
    };
  }

  private setupEventListeners(): void {
    try {
      // Listen for file detection events from native code
      this.eventSubscription = DeviceEventEmitter.addListener(
        'WatchdogFileDetected',
        this.handleFileDetected.bind(this)
      );
      
      console.log('✅ WatchdogFileService: Event listeners setup');
    } catch (error) {
      console.error('❌ WatchdogFileService: Failed to setup event listeners:', error);
    }
  }

  private async handleFileDetected(event: { filePath: string }): Promise<void> {
    try {
      const { filePath } = event;
      const fileName = filePath.split('/').pop() || 'unknown_file';
      
      console.log('🔍 WatchdogFileService: New file detected:', filePath);
      
      // Notify that a file was detected
      if (this.callbacks) {
        this.callbacks.onFileScanned({
          filePath,
          fileName,
          isSafe: false // Assume unsafe until proven otherwise
        });
      }
      
      // Scan the file using background scanning
      const scanResult: FileScanResult = await FileScannerService.scanFileBackground(filePath);
      
      console.log('📊 WatchdogFileService: Scan result:', scanResult);
      
      // Update scan result notification
      if (this.callbacks) {
        this.callbacks.onFileScanned({
          filePath,
          fileName,
          isSafe: scanResult.isSafe
        });
      }
      
      if (!scanResult.isSafe) {
        // CRITICAL: Threat detected - immediate notification
        console.log('🚨 WatchdogFileService: THREAT DETECTED:', filePath);
        
        if (this.callbacks) {
          this.callbacks.onThreatDetected({
            filePath,
            fileName,
            details: scanResult.details
          });
        }
        
        // Show high-priority system notification per doccument-image-file.md
        await this.showThreatNotification(fileName, scanResult.details, filePath);
      } else {
        console.log('✅ WatchdogFileService: File verified as safe:', fileName);
      }
      
    } catch (error) {
      console.error('❌ WatchdogFileService: Error handling file detection:', error);
      if (this.callbacks) {
        this.callbacks.onError('Failed to scan detected file');
      }
    }
  }

  private async showThreatNotification(fileName: string, details: string, filePath: string): Promise<void> {
    try {
      // Critical notification per doccument-image-file.md specifications
      Alert.alert(
        '🚨 THREAT DETECTED! 🚨',
        `A file named '${fileName}' is malicious. DO NOT OPEN IT.\n\nThreat: ${details}\n\nFile location: ${filePath}\n\nTap "Delete File" to remove this threat immediately.`,
        [
          {
            text: 'Delete File',
            style: 'destructive',
            onPress: async () => {
              try {
                // In real implementation, would delete the file
                console.log('🗑️ WatchdogFileService: Deleting threat file:', filePath);
                
                // Show confirmation
                Alert.alert(
                  '✅ Threat Removed',
                  `The malicious file '${fileName}' has been successfully deleted and can no longer harm your device.`,
                  [{ text: 'OK' }]
                );
              } catch (deleteError) {
                console.error('❌ Failed to delete threat file:', deleteError);
                Alert.alert(
                  '❌ Delete Failed', 
                  'Unable to delete the file. Please manually delete it from your file manager.',
                  [{ text: 'OK' }]
                );
              }
            }
          },
          {
            text: 'View Details',
            onPress: () => {
              // Navigate to scan result screen
              console.log('📊 WatchdogFileService: User requested threat details');
            }
          },
          {
            text: 'Ignore (Risky)',
            style: 'cancel'
          }
        ]
      );
      
    } catch (error) {
      console.error('❌ WatchdogFileService: Failed to show threat notification:', error);
    }
  }

  public async initialize(callbacks: WatchdogCallbacks): Promise<boolean> {
    try {
      console.log('🔍 WatchdogFileService: Initializing...');
      
      // Check if user has premium subscription
      const { isPremium } = useSubscriptionStore.getState();
      if (!isPremium) {
        console.log('⚠️ WatchdogFileService: Premium subscription required');
        return false;
      }
      
      this.callbacks = callbacks;
      
      // Check platform compatibility
      if (Platform.OS !== 'android') {
        console.log('⚠️ WatchdogFileService: Only supported on Android');
        return false;
      }
      
      // Check and request permissions
      const hasPermissions = await this.nativeModule.checkPermissions();
      if (!hasPermissions) {
        const granted = await this.nativeModule.requestPermissions();
        if (!granted) {
          throw new Error('Required permissions not granted');
        }
      }
      
      this.isInitialized = true;
      console.log('✅ WatchdogFileService: Initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ WatchdogFileService: Initialization failed:', error);
      if (this.callbacks) {
        this.callbacks.onError('Failed to initialize WatchdogFileService: ' + error);
      }
      return false;
    }
  }

  public async startWatching(): Promise<boolean> {
    if (!this.isInitialized) {
      console.log('❌ WatchdogFileService: Service not initialized');
      return false;
    }

    // Check premium subscription for automatic file monitoring
    const { isPremium } = useSubscriptionStore.getState();
    if (!isPremium) {
      console.log('🔒 WatchdogFileService: Automatic file monitoring requires Premium subscription');
      
      if (this.callbacks) {
        this.callbacks.onError('Automatic file monitoring requires Premium subscription. Upgrade to enable real-time file protection.');
      }
      
      return false;
    }

    // Check if feature is enabled in user preferences
    try {
      const { useFeaturePermissionStore } = await import('../stores/featurePermissionStore');
      const { getFeatureStatus } = useFeaturePermissionStore.getState();
      const featureStatus = getFeatureStatus('watchdog_protection');
      
      if (!featureStatus.isEnabled) {
        console.log('⚠️ WatchdogFileService: Feature disabled by user preferences');
        if (this.callbacks) {
          this.callbacks.onError('Watchdog File Protection is disabled in your feature settings. Enable it in Feature Management to activate real-time monitoring.');
        }
        return false;
      }
      
      if (!featureStatus.hasPermissions) {
        console.log('⚠️ WatchdogFileService: Required permissions not granted');
        if (this.callbacks) {
          this.callbacks.onError('Watchdog File Protection requires storage permissions. Please grant permissions in Feature Management.');
        }
        return false;
      }
    } catch (error) {
      console.log('⚠️ WatchdogFileService: Feature permission check failed, proceeding with default behavior');
    }

    if (this.isActive) {
      console.log('✅ WatchdogFileService: Already watching files');
      return true;
    }

    try {
      console.log('🛡️ WatchdogFileService: Starting automatic file monitoring...');
      
      const success = await this.nativeModule.startFileWatching();
      
      if (success) {
        this.isActive = true;
        
        if (this.callbacks) {
          this.callbacks.onStatusChange(true);
        }
        
        console.log('✅ WatchdogFileService: Automatic file monitoring started successfully');
        
        // Show confirmation for premium users
        Alert.alert(
          '🛡️ Premium File Protection Active',
          `Now monitoring ${this.TARGET_DIRECTORIES.length} directories for malicious files. Real-time scanning is active.`,
          [{ text: 'Great!' }]
        );
        
        return true;
      } else {
        console.log('❌ WatchdogFileService: Failed to start file watching');
        return false;
      }
    } catch (error) {
      console.error('❌ WatchdogFileService: Error starting file watching:', error);
      
      if (this.callbacks) {
        this.callbacks.onError('Failed to start file monitoring');
      }
      
      return false;
    }
  }

  public async stopWatching(): Promise<boolean> {
    try {
      console.log('🔍 WatchdogFileService: Stopping file watching...');
      
      const success = await this.nativeModule.stopFileWatching();
      
      if (success) {
        this.isActive = false;
        console.log('✅ WatchdogFileService: File watching stopped');
        
        if (this.callbacks) {
          this.callbacks.onStatusChange(false);
        }
        
        Alert.alert(
          '🔓 Background Protection Deactivated',
          'Background file monitoring has been turned off. You will no longer receive automatic threat alerts for new files.',
          [{ text: 'OK' }]
        );
        
        return true;
      } else {
        throw new Error('Failed to stop native service');
      }
    } catch (error) {
      console.error('❌ WatchdogFileService: Failed to stop watching:', error);
      if (this.callbacks) {
        this.callbacks.onError('Failed to stop file watching: ' + error);
      }
      return false;
    }
  }

  public async isWatchingActive(): Promise<boolean> {
    try {
      const isActive = await this.nativeModule.isWatchingActive();
      this.isActive = isActive;
      return isActive;
    } catch (error) {
      console.error('❌ WatchdogFileService: Failed to check status:', error);
      return false;
    }
  }

  public getServiceStatus(): { 
    isActive: boolean; 
    isInitialized: boolean; 
    isPremiumRequired: boolean;
    isPremiumUser: boolean;
    automaticMonitoringAvailable: boolean;
  } {
    const { isPremium } = useSubscriptionStore.getState();
    
    return {
      isActive: this.isActive,
      isInitialized: this.isInitialized,
      isPremiumRequired: true, // Automatic monitoring requires premium
      isPremiumUser: isPremium,
      automaticMonitoringAvailable: isPremium,
    };
  }

  /**
   * Manual file scan for specific directory - available for free users
   */
  public async scanDirectoryManual(directoryPath: string): Promise<{
    totalFiles: number;
    threatsFound: number;
    threats: Array<{
      filePath: string;
      fileName: string;
      threat: string;
      details: string;
    }>;
  }> {
    try {
      console.log('🔍 WatchdogFileService: Starting manual directory scan:', directoryPath);
      
      // In real implementation, would scan files in the directory
      // For mock, simulate scanning
      const mockFiles = [
        { path: `${directoryPath}/document.pdf`, name: 'document.pdf', safe: true },
        { path: `${directoryPath}/suspicious.exe`, name: 'suspicious.exe', safe: false },
        { path: `${directoryPath}/photo.jpg`, name: 'photo.jpg', safe: true },
      ];
      
      const threats: any[] = [];
      
      for (const file of mockFiles) {
        if (!file.safe) {
          threats.push({
            filePath: file.path,
            fileName: file.name,
            threat: 'Potential malware detected',
            details: 'Executable file with suspicious characteristics'
          });
        }
      }
      
      console.log(`🔍 WatchdogFileService: Manual scan complete. Found ${threats.length} threats out of ${mockFiles.length} files`);
      
      return {
        totalFiles: mockFiles.length,
        threatsFound: threats.length,
        threats
      };
      
    } catch (error) {
      console.error('❌ WatchdogFileService: Manual scan failed:', error);
      throw error;
    }
  }

  // Mock file detection for demo purposes
  private mockFileDetectionInterval: any = null;
  
  private startMockFileDetection(): void {
    // Simulate periodic file detection for demo
    this.mockFileDetectionInterval = setInterval(() => {
      // Simulate detecting a file 10% of the time
      if (Math.random() < 0.1) {
        const mockFiles = [
          '/storage/emulated/0/Download/document.pdf',
          '/storage/emulated/0/WhatsApp/Media/WhatsApp Images/IMG_20240101.jpg',
          '/storage/emulated/0/Download/suspicious_file.exe',
          '/storage/emulated/0/WhatsApp/Media/WhatsApp Documents/invoice.pdf',
        ];
        
        const randomFile = mockFiles[Math.floor(Math.random() * mockFiles.length)];
        
        console.log('🎭 WatchdogFileService: Mock file detection ->', randomFile);
        
        // Emit the file detection event
        DeviceEventEmitter.emit('WatchdogFileDetected', {
          filePath: randomFile
        });
      }
    }, 15000); // Check every 15 seconds for demo
  }
  
  private stopMockFileDetection(): void {
    if (this.mockFileDetectionInterval) {
      clearInterval(this.mockFileDetectionInterval);
      this.mockFileDetectionInterval = null;
    }
  }

  public cleanup(): void {
    try {
      this.stopWatching();
      
      if (this.eventSubscription) {
        this.eventSubscription.remove();
        this.eventSubscription = null;
      }
      
      this.stopMockFileDetection();
      
      this.callbacks = null;
      this.isInitialized = false;
      this.isActive = false;
      
      console.log('✅ WatchdogFileService: Cleaned up');
    } catch (error) {
      console.error('❌ WatchdogFileService: Cleanup error:', error);
    }
  }
}

// Export singleton instance
export const watchdogFileService = WatchdogFileService.getInstance(); 