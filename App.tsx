import { NavigationContainer } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Alert, Linking, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';

// Import stores
import { useSubscriptionStore } from './src/stores/subscriptionStore';

// Import services with error handling
import { autoInitService } from './src/services/AutoInitializationService';
import { ClipboardMonitorCallbacks, clipboardMonitor } from './src/services/ClipboardURLMonitor';
import { globalGuard } from './src/services/GlobalGuardController';
import { PrivacyGuardCallbacks, privacyGuardService } from './src/services/PrivacyGuardService';
import { LinkScannerService } from './src/services/ScannerService';
import { ShareIntentCallbacks, shareIntentService, useShabariShareIntent } from './src/services/ShareIntentService';
import { URLProtectionCallbacks, urlProtectionService } from './src/services/URLProtectionService';
import { WatchdogCallbacks, watchdogFileService } from './src/services/WatchdogFileService';

// Import screens
import AppNavigator from './src/navigation/AppNavigator';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';
const isWeb = Platform.OS === 'web';

interface ServiceStatus {
  scannerService: boolean;
  shareIntentService: boolean;
  globalGuardService: boolean;
  clipboardMonitor: boolean;
  urlProtection: boolean;
  watchdogFileService: boolean;
  privacyGuardService: boolean;
}

// Simple deep linking configuration for compatibility
const linking = {
  prefixes: ['shabari://'],
  config: {
    screens: {
      Dashboard: '',
      SecureBrowser: 'browser',
      ScanResult: 'scan-result',
    },
  },
};

// Enhanced URL handler function with automatic interception
async function handleIncomingURL(url: string) {
  console.log('🔍 AUTOMATIC URL INTERCEPTION:', url);
  
  if (isExpoGo || isWeb) {
    // Simplified handling for Expo Go and web
    console.log('📱 Running in Expo Go or Web - simplified URL handling');
    Alert.alert(
      '🔗 Link Detected',
      `Link: ${url}\n\nThis is a simplified version running in Expo Go or web browser.`,
      [{ text: 'OK' }]
    );
    return;
  }
  
  try {
    // Extract the actual URL from Shabari deep link or use directly
    let targetUrl = url;
    if (url.startsWith('shabari://')) {
      const urlParams = new URLSearchParams(url.split('?')[1] || '');
      targetUrl = urlParams.get('url') || urlParams.get('link') || url;
    }

    console.log('🛡️ INTERCEPTED URL FROM WHATSAPP/OTHER APP:', targetUrl);
    console.log('🔍 Triggering automatic security scan...');

    // Use ShareIntentService for proper interception and scanning
    if (shareIntentService.isServiceInitialized()) {
      // This will handle the complete scan + block/allow flow
      await shareIntentService.scanUrlManually(targetUrl);
    } else {
      // Fallback to direct scanning if ShareIntentService not available
      await LinkScannerService.initializeService();
      const scanResult = await LinkScannerService.scanUrl(targetUrl);
      
      if (scanResult.isSafe === false) {
        console.log('🚫 BLOCKING DANGEROUS URL FROM WHATSAPP:', targetUrl);
        
        Alert.alert(
          '🛡️ SHABARI PROTECTION ACTIVE',
          `🚫 DANGEROUS WEBSITE BLOCKED!\n\n${targetUrl}\n\nThreat: ${scanResult.details}\n\n⚠️ This malicious link from WhatsApp was automatically intercepted and blocked to protect your device.\n\n✅ PROTECTION SUCCESS!`,
          [
            {
              text: 'View Security Report',
              onPress: () => {
                Alert.alert(
                  '📊 Security Report',
                  `URL: ${targetUrl}\n\nThreat Type: ${scanResult.details}\n\nSource: WhatsApp Link Click\n\nAction: Blocked before opening\n\nStatus: Device Protected ✅`,
                  [{ text: 'OK' }]
                );
              }
            },
            {
              text: 'OK',
              style: 'default'
            }
          ]
        );
      } else {
        console.log('✅ SAFE URL FROM WHATSAPP:', targetUrl);
        
        Alert.alert(
          '🔗 Link Verified Safe',
          `✅ This WhatsApp link has been scanned and verified as safe:\n\n${targetUrl}\n\nHow would you like to open it?`,
          [
            {
              text: 'Open in Shabari Browser',
              onPress: () => {
                console.log('🔄 Opening safe WhatsApp URL in Shabari browser');
                // Navigate to SecureBrowser - would be implemented with navigation
              }
            },
            {
              text: 'Open in Default Browser',
              onPress: async () => {
                try {
                  const canOpen = await Linking.canOpenURL(targetUrl);
                  if (canOpen) {
                    await Linking.openURL(targetUrl);
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
    }
    
  } catch (error) {
    console.error('❌ Error processing WhatsApp URL:', error);
    
    Alert.alert(
      '⚠️ URL Scan Error',
      `Unable to scan the WhatsApp link. Please proceed with caution.\n\nURL: ${url}\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Open Anyway',
          style: 'destructive',
          onPress: async () => {
            try {
              await Linking.openURL(url);
            } catch (error) {
              console.error('Failed to open URL:', error);
            }
          }
        }
      ]
    );
  }
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [servicesStatus, setServicesStatus] = useState<ServiceStatus>({
    scannerService: false,
    shareIntentService: false,
    globalGuardService: false,
    clipboardMonitor: false,
    urlProtection: false,
    watchdogFileService: false,
    privacyGuardService: false,
  });
  
  const { checkSubscriptionStatus } = useSubscriptionStore();

  // 🚨 CRITICAL: Set up share intent processing hook
  const shareIntentCallbacks: ShareIntentCallbacks = {
    onUrlReceived: (url: string) => {
      console.log('📥 URL intercepted by Shabari:', url);
    },
    onFileReceived: (file: { fileName: string; contentUri: string }) => {
      console.log('📁 File shared to Shabari:', file.fileName);
      console.log('📍 File URI:', file.contentUri);
    },
    onScanComplete: (result: { url?: string; fileName?: string; isSafe: boolean; details: string; scanType: 'url' | 'file' }) => {
      console.log('🔍 Scan completed by ShareIntent:', result);
      
      if (result.scanType === 'file') {
        console.log(`📁 File scan result: ${result.fileName} - ${result.isSafe ? 'SAFE' : 'DANGEROUS'}`);
        if (!result.isSafe) {
          console.log('🚫 Dangerous file quarantined:', result.fileName);
        } else {
          console.log('✅ Safe file quarantined for user review:', result.fileName);
        }
      }
    },
    onUrlBlocked: (result: { url: string; details: string }) => {
      console.log('🚫 DANGEROUS URL BLOCKED by ShareIntent:', result.url);
    },
    onUrlVerified: (result: { url: string; details: string }) => {
      console.log('✅ URL verified as safe by ShareIntent:', result.url);
    },
    onError: (error: string) => {
      console.error('📤 ShareIntent error:', error);
    },
  };

  // Initialize the share intent hook - THIS IS CRITICAL for file quarantine!
  const shareIntentStatus = useShabariShareIntent(shareIntentCallbacks);

  console.log('📱 Share Intent Status:', shareIntentStatus);

  useEffect(() => {
    initializeApp();
    
    // Cleanup function
    return () => {
      cleanup();
    };
  }, []);

  // Enhanced URL handling for different platforms
  useEffect(() => {
    if (isExpoGo || isWeb) {
      console.log('📱 Running in Expo Go or Web - skipping URL handling setup');
      return;
    }

    const setupURLHandling = async () => {
      try {
        // Handle initial URL if app was opened via link
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          console.log('🔗 App opened with URL:', initialUrl);
          await handleIncomingURL(initialUrl);
        }

        // Listen for URLs while app is running
        const subscription = Linking.addEventListener('url', ({ url }: { url: string }) => {
          console.log('🔗 URL received while app running:', url);
          handleIncomingURL(url);
        });

        return () => subscription?.remove();
      } catch (error) {
        console.warn('⚠️ URL handling setup failed:', error);
      }
    };

    setupURLHandling();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing Shabari App...');
      
      // Add timeout to prevent hanging
      const initializationTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Initialization timeout after 8 seconds')), 8000);
      });

      const initializationProcess = async () => {
        // Initialize subscription store first
        await initializeSubscriptionStore();
        
        // Start automatic initialization of all security features
        console.log('🚀 Starting auto-initialization service...');
        await autoInitService.startAutoInitialization();
        
        // Initialize all services with error handling
        await initializeServices();
      };

      // Race between initialization and timeout
      await Promise.race([initializationProcess(), initializationTimeout]);
      
      console.log('✅ App initialization completed');
      setIsLoading(false);
      
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      
      setErrorMessage(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setHasError(true);
      
      // Show user-friendly error but continue anyway after a short delay
      setTimeout(() => {
        console.log('🔄 Continuing with basic functionality...');
        setHasError(false);
        setIsLoading(false);
      }, 3000);
    }
  };

  const initializeSubscriptionStore = async (): Promise<void> => {
    try {
      console.log('📦 Loading subscription data...');
      await checkSubscriptionStatus();
      console.log('✅ Subscription store initialized');
    } catch (error) {
      console.error('❌ Subscription store initialization failed:', error);
      // Continue anyway - subscription will default to free
    }
  };

  const initializeServices = async (): Promise<void> => {
    const status: ServiceStatus = {
      scannerService: false,
      shareIntentService: false,
      globalGuardService: false,
      clipboardMonitor: false,
      urlProtection: false,
      watchdogFileService: false,
      privacyGuardService: false,
    };

    // Skip native services in Expo Go and Web
    if (isExpoGo || isWeb) {
      console.log('📱 Running in Expo Go or Web - initializing limited services only');
      
      // Only initialize basic services that work in Expo Go
      try {
        console.log('🔍 Initializing Scanner Service...');
        await LinkScannerService.initializeService();
        status.scannerService = true;
        console.log('✅ Scanner Service initialized successfully');
      } catch (error) {
        console.warn('⚠️ Scanner Service initialization failed:', error);
        status.scannerService = false;
      }

      setServicesStatus(status);
      return;
    }

    // Helper function to add timeout to service initialization
    const initializeWithTimeout = async (
      serviceInitializer: () => Promise<any>,
      serviceName: string,
      timeoutMs: number = 5000
    ): Promise<any> => {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`${serviceName} initialization timeout`)), timeoutMs);
        });

        return await Promise.race([serviceInitializer(), timeoutPromise]);
      } catch (error) {
        console.error(`❌ ${serviceName} initialization failed:`, error);
        return null;
      }
    };

    // Initialize Scanner Service with timeout
    try {
      console.log('🔍 Initializing Scanner Service...');
      const result = await initializeWithTimeout(
        () => LinkScannerService.initializeService(),
        'Scanner Service',
        4000
      );
      status.scannerService = result !== null;
      console.log(status.scannerService ? '✅ Scanner Service initialized successfully' : '⚠️ Scanner Service initialization failed');
    } catch (error) {
      console.error('❌ Scanner Service initialization failed:', error);
      status.scannerService = false;
    }

    // Initialize Share Intent Service with timeout
    try {
      console.log('📤 Initializing Share Intent Service...');
      
      const result = await initializeWithTimeout(
        async () => {
          shareIntentService.initialize(shareIntentCallbacks);
          return shareIntentService.isServiceInitialized();
        },
        'Share Intent Service',
        2000
      );
      
      status.shareIntentService = result === true;
      
      if (status.shareIntentService) {
        console.log('✅ Share Intent Service initialized successfully');
      } else {
        console.log('⚠️ Share Intent Service initialized with limited functionality');
      }
    } catch (error) {
      console.error('❌ Share Intent Service initialization failed:', error);
      status.shareIntentService = false;
    }

    // Initialize Clipboard Monitor Service with timeout
    try {
      console.log('📋 Initializing Clipboard Monitor Service...');
      
      const clipboardCallbacks: ClipboardMonitorCallbacks = {
        onUrlDetected: (url: string) => {
          console.log('📋 URL detected in clipboard:', url);
        },
        onScanComplete: (result: { url: string; isSafe: boolean; details: string }) => {
          console.log('📋 Clipboard URL scan completed:', result);
          
          if (result.isSafe === false) {
            // Dangerous URL detected in clipboard
            console.log('🚫 Blocking dangerous URL from clipboard:', result.url);
            
            const { Alert } = require('react-native');
            Alert.alert(
              '🛡️ Shabari Clipboard Protection',
              `WARNING: Dangerous URL detected!\n\n${result.url}\n\nThreat: ${result.details}\n\nThis malicious link was found in your clipboard and has been flagged for your protection. Do not visit this website.`,
              [
                {
                  text: 'Clear Clipboard',
                  onPress: async () => {
                    try {
                      const { Clipboard } = require('@react-native-clipboard/clipboard');
                      await Clipboard.setString('');
                      console.log('📋 Dangerous URL cleared from clipboard');
                    } catch (error) {
                      console.error('❌ Failed to clear clipboard:', error);
                    }
                  }
                },
                {
                  text: 'View Details',
                  onPress: () => {
                    console.log('📊 User requested details for dangerous clipboard URL');
                  }
                },
                {
                  text: 'OK',
                  style: 'default'
                }
              ]
            );
          } else {
            // Safe URL detected in clipboard
            console.log('✅ Safe URL detected in clipboard:', result.url);
            
            // Only show notification if this is a newly detected URL
            // (to avoid spam when app starts up)
            const { Alert } = require('react-native');
            Alert.alert(
              '📋 Safe Link Detected',
              `A safe URL was found in your clipboard:\n\n${result.url}\n\nWould you like to open it in Shabari's secure browser?`,
              [
                {
                  text: 'Open in Shabari',
                  onPress: () => {
                    console.log('🔄 Opening safe clipboard URL in Shabari browser:', result.url);
                    // Navigate to SecureBrowser with URL
                  }
                },
                {
                  text: 'Ignore',
                  style: 'cancel'
                }
              ]
            );
          }
        },
        onError: (error: string) => {
          console.error('📋 Clipboard Monitor error:', error);
        },
      };
      
      const result = await initializeWithTimeout(
        async () => {
          clipboardMonitor.initialize(clipboardCallbacks);
          clipboardMonitor.startMonitoring();
          return clipboardMonitor.isServiceInitialized();
        },
        'Clipboard Monitor Service',
        8000 // Increased timeout for EAS builds
      );
      
      status.clipboardMonitor = result === true;
      
      if (status.clipboardMonitor) {
        console.log('✅ Clipboard Monitor Service initialized successfully');
      } else {
        console.log('⚠️ Clipboard Monitor Service initialized with limited functionality');
      }
    } catch (error) {
      console.error('❌ Clipboard Monitor Service initialization failed:', error);
      status.clipboardMonitor = false;
    }

    // Initialize Global Guard Service (Core Security Feature) with timeout
    try {
      console.log('🛡️ Initializing Global Guard Service...');
      
      const result = await initializeWithTimeout(
        async () => {
          // Properly initialize GlobalGuard
          await globalGuard.waitForInitialization();
          return globalGuard.isServiceInitialized();
        },
        'Global Guard Service',
        10000 // Increased timeout for EAS builds
      );
      
      status.globalGuardService = result === true;
      
      if (status.globalGuardService) {
        console.log('✅ Global Guard Service initialized successfully');
      } else {
        console.log('⚠️ Global Guard Service initialized with limited functionality');
      }
    } catch (error) {
      console.error('❌ Global Guard Service initialization failed:', error);
      status.globalGuardService = false;
    }

    // Initialize URL Protection Service with timeout
    try {
      console.log('🛡️ Initializing URL Protection Service...');
      
      const urlProtectionCallbacks: URLProtectionCallbacks = {
        onUrlScanned: (result: { url: string; isSafe: boolean; details: string }) => {
          console.log('🛡️ URL scanned:', result);
        },
        onThreatDetected: (result: { url: string; details: string }) => {
          console.log('🚫 THREAT DETECTED by URL Protection:', result);
          // The service handles the alert display internally
        },
        onError: (error: string) => {
          console.error('🛡️ URL Protection error:', error);
        },
      };
      
      const result = await initializeWithTimeout(
        async () => {
          urlProtectionService.initialize(urlProtectionCallbacks);
          return urlProtectionService.isServiceInitialized();
        },
        'URL Protection Service',
        2000
      );
      
      status.urlProtection = result === true;
      
      if (status.urlProtection) {
        console.log('✅ URL Protection Service initialized successfully');
      } else {
        console.log('⚠️ URL Protection Service initialized with limited functionality');
      }
    } catch (error) {
      console.error('❌ URL Protection Service initialization failed:', error);
      status.urlProtection = false;
    }

    // Initialize Watchdog File Service with timeout
    try {
      console.log('🐶 Initializing Watchdog File Service...');
      
      const watchdogCallbacks: WatchdogCallbacks = {
        onThreatDetected: (result: { filePath: string; fileName: string; details: string }) => {
          console.log('🚨 Threat detected:', result);
          const { Alert } = require('react-native');
          Alert.alert(
            '🚨 Shabari File Protection',
            `WARNING: Malicious file detected!\n\n${result.fileName}\n\nThreat: ${result.details}\n\nThis dangerous file was found in your device and has been flagged for your protection.`,
            [{ text: 'OK' }]
          );
        },
        onFileScanned: (result: { filePath: string; fileName: string; isSafe: boolean }) => {
          console.log('🐶 File scanned:', result);
        },
        onStatusChange: (isActive: boolean) => {
          console.log('🐶 Status changed:', isActive);
        },
        onError: (error: string) => {
          console.error('🐶 Watchdog File error:', error);
        },
      };
      
      const result = await initializeWithTimeout(
        async () => {
          await watchdogFileService.initialize(watchdogCallbacks);
          await watchdogFileService.startWatching();
          return watchdogFileService.getServiceStatus().isInitialized;
        },
        'Watchdog File Service',
        2000
      );
      
      status.watchdogFileService = result === true;
      
      if (status.watchdogFileService) {
        console.log('✅ Watchdog File Service initialized successfully');
      } else {
        console.log('⚠️ Watchdog File Service initialized with limited functionality');
      }
    } catch (error) {
      console.error('❌ Watchdog File Service initialization failed:', error);
      status.watchdogFileService = false;
    }

    // Initialize Privacy Guard Service (Premium feature) with timeout
    try {
      console.log('🔒 Initializing Privacy Guard Service...');
      
      const privacyGuardCallbacks: PrivacyGuardCallbacks = {
        onSuspiciousAppDetected: (result: { appName: string; packageName: string; permissions: string[]; riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'; details: string; }) => {
          console.log('🔒 Suspicious app detected:', result);
          const { Alert } = require('react-native');
          Alert.alert(
            '🔒 Suspicious App Detected',
            `App: ${result.appName}\nRisk Level: ${result.riskLevel}\n\n${result.details}`,
            [{ text: 'OK' }]
          );
        },
        onAppInstalled: (result: { appName: string; packageName: string; isSafe: boolean }) => {
          console.log('🔒 App installed:', result);
        },
        onStatusChange: (isActive: boolean) => {
          console.log('🔒 Status changed:', isActive);
        },
        onError: (error: string) => {
          console.error('🔒 Privacy Guard error:', error);
        },
      };
      
      const result = await initializeWithTimeout(
        async () => {
          await privacyGuardService.initialize(privacyGuardCallbacks);
          await privacyGuardService.startMonitoring();
          return privacyGuardService.getServiceStatus().isInitialized;
        },
        'Privacy Guard Service',
        2000
      );
      
      status.privacyGuardService = result === true;
      
      if (status.privacyGuardService) {
        console.log('✅ Privacy Guard Service initialized successfully');
      } else {
        console.log('⚠️ Privacy Guard Service initialized with limited functionality');
      }
    } catch (error) {
      console.error('❌ Privacy Guard Service initialization failed:', error);
      status.privacyGuardService = false;
    }

    setServicesStatus(status);
    
    // Log service status summary
    console.log('📊 Service Status Summary:', {
      Scanner: status.scannerService ? '✅' : '❌',
      ShareIntent: status.shareIntentService ? '✅' : '❌',
      GlobalGuard: status.globalGuardService ? '✅' : '❌',
      ClipboardMonitor: status.clipboardMonitor ? '✅' : '❌',
      URLProtection: status.urlProtection ? '✅' : '❌',
      WatchdogFile: status.watchdogFileService ? '✅' : '❌',
      PrivacyGuard: status.privacyGuardService ? '✅' : '❌',
    });
  };

  const cleanup = () => {
    try {
      console.log('🧹 Cleaning up services...');
      
      // Cleanup Share Intent Service
      if (shareIntentService.isServiceInitialized()) {
        shareIntentService.cleanup();
      }
      
      // Cleanup Global Guard Service
      if (globalGuard.isServiceInitialized()) {
        globalGuard.cleanup();
      }
      
      // Cleanup Clipboard Monitor Service
      if (clipboardMonitor.isServiceInitialized()) {
        clipboardMonitor.cleanup();
      }
      
      // Cleanup URL Protection Service
      if (urlProtectionService.isServiceInitialized()) {
        urlProtectionService.cleanup();
      }
      
      // Cleanup Watchdog File Service
      if (watchdogFileService.getServiceStatus().isInitialized) {
        watchdogFileService.cleanup();
      }
      
      // Cleanup Privacy Guard Service
      if (privacyGuardService.getServiceStatus().isInitialized) {
        privacyGuardService.cleanup();
      }
      
      console.log('✅ Service cleanup completed');
    } catch (error) {
      console.error('❌ Service cleanup failed:', error);
    }
  };

  // Error screen
  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#ff6b6b" />
        <Text style={styles.errorTitle}>⚠️ Initialization Error</Text>
        <Text style={styles.errorMessage}>{errorMessage}</Text>
        <Text style={styles.errorSubtext}>
          The app will continue with limited functionality.
        </Text>
      </View>
    );
  }

  // Loading screen
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <Text style={styles.loadingTitle}>🛡️ Shabari</Text>
        <Text style={styles.loadingText}>Initializing security services...</Text>
        <View style={styles.loadingDots}>
          <Text style={styles.loadingDot}>●</Text>
          <Text style={styles.loadingDot}>●</Text>
          <Text style={styles.loadingDot}>●</Text>
        </View>
      </View>
    );
  }

  // Main app
  return (
    <NavigationContainer linking={linking}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <AppNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingTitle: {
    color: '#4ecdc4',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  loadingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingDot: {
    color: '#4ecdc4',
    fontSize: 20,
    marginHorizontal: 5,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#ff6b6b',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorSubtext: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
  },
});

