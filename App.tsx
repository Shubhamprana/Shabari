import { NavigationContainer } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import stores
import { useSubscriptionStore } from './src/stores/subscriptionStore';

// Import services with error handling
import { ClipboardMonitorCallbacks, clipboardMonitor } from './src/services/ClipboardURLMonitor';
import { globalGuard } from './src/services/GlobalGuardController';
import { PrivacyGuardCallbacks } from './src/services/PrivacyGuardService';
import { LinkScannerService } from './src/services/ScannerService';
import { ShareIntentCallbacks, shareIntentService, useShabariShareIntent } from './src/services/ShareIntentService';
import { URLProtectionCallbacks, urlProtectionService } from './src/services/URLProtectionService';
import { WatchdogCallbacks } from './src/services/WatchdogFileService';

// Import screens
import { supabase } from './src/lib/supabase';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import { useAuthStore } from './src/stores/authStore';

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

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Deep link prefix configuration
const prefix = 'shabari://';

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

const App: React.FC = () => {
  const { isAuthenticated, isLoading, sessionInitialized, checkAuth } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);
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
    const initializeApp = async () => {
      try {
        console.log('🚀 App: Starting initialization...');
        
        // Check existing authentication
        await checkAuth();
        
        // Handle deep links
        const handleDeepLink = async (url: string) => {
          console.log('🔗 Deep link received:', url);
          
          // Handle auth callbacks
          if (url.includes('/auth/callback') || url.includes('/auth/reset-password')) {
            try {
              const { data, error } = await supabase.auth.getSession();
              
              if (error) {
                console.error('❌ Auth callback error:', error);
                Alert.alert('Authentication Error', 'Failed to process authentication. Please try again.');
                return;
              }
              
              if (data.session) {
                console.log('✅ Authentication successful from deep link');
                
                // Check if this is email verification
                if (url.includes('/auth/callback')) {
                  Alert.alert(
                    'Email Verified! ✅',
                    'Your email has been successfully verified. You can now sign in to your account.',
                    [{ text: 'OK' }]
                  );
                }
                
                // Check if this is password reset
                if (url.includes('/auth/reset-password')) {
                  Alert.alert(
                    'Password Reset Ready',
                    'You can now set a new password for your account.',
                    [{ text: 'Continue' }]
                  );
                }
                
                // Refresh auth state
                await checkAuth();
              }
            } catch (authError) {
              console.error('❌ Deep link auth error:', authError);
              Alert.alert('Error', 'Failed to process authentication link.');
            }
          }
        };

        // Handle initial URL (app opened from link)
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          await handleDeepLink(initialUrl);
        }

        // Listen for URL changes (app already open)
        const subscription = Linking.addEventListener('url', ({ url }) => {
          handleDeepLink(url);
        });

        console.log('✅ App: Initialization complete');
        setIsInitializing(false);

        return () => {
          subscription?.remove();
        };
      } catch (error) {
        console.error('❌ App initialization error:', error);
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [checkAuth]);

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
          // clipboardMonitor.startMonitoring(); // 🚨 PLAY STORE COMPLIANCE: Disabled automatic startup
          return clipboardMonitor.isServiceInitialized();
        },
        'Clipboard Monitor Service',
        3000
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
          // await globalGuard.waitForInitialization(); // 🚨 PLAY STORE COMPLIANCE: Disabled automatic startup
          return globalGuard.isServiceInitialized();
        },
        'Global Guard Service',
        7000
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
          // await watchdogFileService.startWatching(); // 🚨 PLAY STORE COMPLIANCE: Disabled automatic startup
          return false;
        },
        'Watchdog File Service',
        10000
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
          // await privacyGuardService.startMonitoring(); // 🚨 PLAY STORE COMPLIANCE: Disabled automatic startup
          return false;
        },
        'Privacy Guard Service',
        10000
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

  // Show loading screen during initialization
  if (isInitializing || !sessionInitialized) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <View style={{ 
          flex: 1, 
          backgroundColor: '#1a1a2e', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <ActivityIndicator size="large" color="#ff6b6b" />
          <Text style={{ 
            color: '#ffffff', 
            marginTop: 20, 
            fontSize: 16 
          }}>
            Initializing Shabari...
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      {/* Show login screen if not authenticated */}
      {!isAuthenticated ? (
        <LoginScreen onLoginSuccess={() => {
          console.log('✅ App: Login success callback received');
        }} />
      ) : (
        <NavigationContainer
          linking={{
            prefixes: [prefix, 'shabari://'],
            config: {
              screens: {
                Dashboard: 'dashboard',
                Scanner: 'scanner',
                QRScanner: 'qr-scanner',
                Settings: 'settings',
                // Auth screens
                AuthCallback: 'auth/callback',
                ResetPassword: 'auth/reset-password',
              },
            },
          }}
        >
      <AppNavigator />
    </NavigationContainer>
      )}
    </SafeAreaProvider>
  );
};

export default App;

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

