import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { LinkScannerService, UrlScanResult } from '../services/ScannerService';
import { useSubscriptionStore } from '../stores/subscriptionStore';

// Conditional import for WebView
let WebView: any = null;
if (Platform.OS !== 'web') {
  try {
    WebView = require('react-native-webview').WebView;
  } catch (error) {
    console.log('WebView not available on this platform');
  }
}

interface SecureBrowserScreenProps {
  onNavigateToScanResult: (result: any) => void;
  onGoBack: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

const SecureBrowserScreen: React.FC<SecureBrowserScreenProps> = ({
  onNavigateToScanResult,
  onGoBack,
}) => {
  const [currentUrl, setCurrentUrl] = useState('https://duckduckgo.com');
  const [inputUrl, setInputUrl] = useState('https://duckduckgo.com');
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isSecure, setIsSecure] = useState(true);
  const [pageTitle, setPageTitle] = useState('Shabari Secure Browser');
  const [showUrlBar, setShowUrlBar] = useState(false);
  const [threatCount, setThreatCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('Secure');
  
  const webViewRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const securityPulse = useRef(new Animated.Value(1)).current;
  
  // Premium user check
  const { isPremium } = useSubscriptionStore();

  useEffect(() => {
    // Initialize the LinkScannerService on component mount
    LinkScannerService.initializeService();
    
    // Start security pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(securityPulse, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(securityPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    
    return () => pulseAnimation.stop();
  }, []);

  // Check if user has premium access before rendering
  useEffect(() => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature',
        'Secure Browser is a premium feature. Please upgrade to access this functionality.',
        [
          {
            text: 'Go Back',
            onPress: onGoBack,
          },
        ]
      );
    }
  }, [isPremium, onGoBack]);

  const animateProgress = (progress: number) => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleUrlSubmit = async () => {
    let url = inputUrl.trim();
    
    // If it looks like a search query (no dots or spaces), search with Google
    if (!url.includes('.') || url.includes(' ')) {
      url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // Scan URL before navigation
    try {
      console.log('🔍 SecureBrowser: Pre-scanning URL before navigation:', url);
      setIsScanning(true);
      animateProgress(0.3);
      
      const result: UrlScanResult = await LinkScannerService.scanUrl(url);
      
      setIsScanning(false);
      animateProgress(0);
      
      if (result.isSafe === false) {
        console.log('🚫 SecureBrowser: Blocking malicious URL before navigation:', url);
        setThreatCount(prev => prev + 1);
        
        Alert.alert(
          '🛡️ Threat Blocked by Shabari',
          `Our advanced security system has blocked a dangerous website:\n\n${url}\n\nThreat Details: ${result.details}\n\nYour device is protected.`,
          [
            {
              text: 'View Security Report',
              onPress: () => {
                onNavigateToScanResult({
                  url: url,
                  isSafe: false,
                  details: result.details,
                  threatName: 'Malicious website blocked',
                  scanEngine: 'Shabari Advanced Scanner',
                  scanType: 'url',
                  scanTime: new Date(),
                });
              }
            },
            {
              text: 'Continue Browsing',
              style: 'default'
            }
          ]
        );
        return; // Don't navigate to malicious URL
      }
      
      console.log('✅ SecureBrowser: URL pre-scan passed, proceeding with navigation');
      setIsSecure(url.startsWith('https://'));
      setConnectionStatus(url.startsWith('https://') ? 'Secure' : 'Not Secure');
    } catch (error) {
      console.error('❌ SecureBrowser: Pre-scan error:', error);
      setIsScanning(false);
      animateProgress(0);
    }
    
    setCurrentUrl(url);
    setInputUrl(url);
    setShowUrlBar(false);
  };

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);
    if (!showUrlBar) {
      setInputUrl(navState.url);
    }
    setPageTitle(navState.title || 'Shabari Secure Browser');
    setIsSecure(navState.url.startsWith('https://'));
    setConnectionStatus(navState.url.startsWith('https://') ? 'Secure' : 'Not Secure');
  };

  const handleDownload = async (downloadUrl: string, fileName: string) => {
    setIsScanning(true);
    animateProgress(0.5);
    
    try {
      // Simulate download and scan process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate scan result
      const isSafe = Math.random() > 0.3; // 70% chance of being safe
      
      onNavigateToScanResult({
        fileName: fileName || 'downloaded_file',
        isSafe,
        threatName: isSafe ? null : 'Potential malware detected',
        downloadUrl,
      });
    } catch (error) {
      Alert.alert('Shabari Security Alert', 'Failed to scan downloaded file');
    } finally {
      setIsScanning(false);
      animateProgress(0);
    }
  };

  // Async URL scanning for WebView
  const handleAsyncUrlScan = async (url: string) => {
    try {
      console.log('🔍 SecureBrowser: Async scanning URL:', url);
      
      // Show scanning state
      setIsScanning(true);
      animateProgress(0.7);
      
      // Extract and scan actual target URLs from search queries
      const urlsToScan = extractUrlsFromSearchQuery(url);
      
      for (const targetUrl of urlsToScan) {
        console.log('🔍 SecureBrowser: Scanning extracted URL:', targetUrl);
        
        // Call LinkScannerService to scan the URL
        const result: UrlScanResult = await LinkScannerService.scanUrl(targetUrl);
        
        console.log('🔍 SecureBrowser: Scan result for', targetUrl, ':', result);
        
        if (result.isSafe === false) {
          console.log('🚫 SecureBrowser: Blocking malicious URL found in search:', targetUrl);
          
          // Hide scanning state
          setIsScanning(false);
          animateProgress(0);
          setThreatCount(prev => prev + 1);
          
          // Stop the WebView and go back
          if (webViewRef.current) {
            webViewRef.current.stopLoading();
            webViewRef.current.goBack();
          }
          
          // Show immediate alert
          Alert.alert(
            '🛡️ Shabari Protection Active',
            `Our real-time scanner detected a dangerous URL:\n\n${targetUrl}\n\nThreat: ${result.details}\n\nThe page has been automatically blocked to protect your device.`,
            [
              {
                text: 'View Security Report',
                onPress: () => {
                  // Navigate to ScanResultScreen with dangerous verdict
                  onNavigateToScanResult({
                    url: targetUrl,
                    isSafe: false,
                    details: result.details,
                    threatName: 'Real-time threat detection',
                    scanEngine: 'Shabari Advanced Scanner',
                    scanType: 'url',
                    scanTime: new Date(),
                  });
                }
              },
              {
                text: 'Continue Browsing',
                style: 'default'
              }
            ]
          );
          return;
        }
      }
      
      // If we get here, scan the main URL as well
      const mainResult: UrlScanResult = await LinkScannerService.scanUrl(url);
      console.log('🔍 SecureBrowser: Main URL scan result:', mainResult);
      
      // Hide scanning state
      setIsScanning(false);
      animateProgress(0);
      
      if (mainResult.isSafe === false) {
        console.log('🚫 SecureBrowser: Blocking main URL:', url);
        setThreatCount(prev => prev + 1);
        
        // Stop the WebView and go back
        if (webViewRef.current) {
          webViewRef.current.stopLoading();
          webViewRef.current.goBack();
        }
        
        Alert.alert(
          '🛡️ Shabari Protection Active',
          `Dangerous website blocked:\n\n${url}\n\nReason: ${mainResult.details}`,
          [{ text: 'OK' }]
        );
        return;
      }
      
      console.log('✅ SecureBrowser: URL is safe:', url);
    } catch (error) {
      console.error('❌ SecureBrowser: Async scan error:', error);
      setIsScanning(false);
      animateProgress(0);
    }
  };

  // Extract URLs from search query parameters
  const extractUrlsFromSearchQuery = (url: string): string[] => {
    const urls: string[] = [];
    
    try {
      const urlObj = new URL(url);
      const searchParams = urlObj.searchParams;
      
      // Common search parameter names that might contain URLs
      const searchParamNames = ['q', 'query', 'search', 'url', 'link'];
      
      for (const paramName of searchParamNames) {
        const paramValue = searchParams.get(paramName);
        if (paramValue) {
          try {
            // Try to decode the parameter value
            const decodedValue = decodeURIComponent(paramValue);
            
            // Look for URLs in the decoded value
            const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
            const foundUrls = decodedValue.match(urlRegex);
            
            if (foundUrls) {
              urls.push(...foundUrls);
            }
          } catch (decodeError) {
            console.log('Error extracting URLs from search query:', decodeError);
            // If decoding fails, try to extract URLs from the raw parameter value
            const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]&]+/gi;
            const foundUrls = paramValue.match(urlRegex);
            if (foundUrls) {
              urls.push(...foundUrls.map(u => decodeURIComponent(u)));
            }
          }
        }
      }
    } catch (error) {
      console.log('Error parsing URL for search query extraction:', error);
    }
    
    return urls;
  };

  const handleShouldStartLoadWithRequest = async (request: any): Promise<boolean> => {
    console.log('🔍 SecureBrowser: WebView intercepting:', request.url);
    
    // Check if it's a download link first
    const downloadExtensions = ['.pdf', '.doc', '.docx', '.zip', '.exe', '.apk'];
    const isDownload = downloadExtensions.some(ext => 
      request.url.toLowerCase().includes(ext)
    );
    
    if (isDownload) {
      const fileName = request.url.split('/').pop() || 'download';
      handleDownload(request.url, fileName);
      return false; // Prevent navigation
    }
    
    // For regular navigation, perform async scanning
    // We'll allow the navigation initially and then handle blocking if needed
    handleAsyncUrlScan(request.url);
    return true; // Allow navigation for now, we'll handle blocking in the scan function
  };

  const handleWebNavigation = (action: string) => {
    switch (action) {
      case 'back':
        if (Platform.OS === 'web' && iframeRef.current) {
          // For web, we can't control iframe navigation directly
          console.log('Back navigation not supported in web iframe');
        } else if (webViewRef.current && canGoBack) {
          webViewRef.current.goBack();
        }
        break;
      case 'forward':
        if (Platform.OS === 'web' && iframeRef.current) {
          // For web, we can't control iframe navigation directly
          console.log('Forward navigation not supported in web iframe');
        } else if (webViewRef.current && canGoForward) {
          webViewRef.current.goForward();
        }
        break;
      case 'reload':
        if (Platform.OS === 'web' && iframeRef.current) {
          iframeRef.current.src = iframeRef.current.src;
        } else if (webViewRef.current) {
          webViewRef.current.reload();
        }
        break;
      case 'home':
        setCurrentUrl('https://duckduckgo.com');
        setInputUrl('https://duckduckgo.com');
        break;
    }
  };

  const SecurityIndicator = () => (
    <View style={styles.securityIndicator}>
      <Animated.View style={[styles.securityIcon, { transform: [{ scale: securityPulse }] }]}>
        <Text style={styles.securityIconText}>🛡️</Text>
      </Animated.View>
      <View style={styles.securityInfo}>
        <Text style={styles.securityStatus}>{connectionStatus}</Text>
        <Text style={styles.securitySubtext}>Shabari Protected</Text>
      </View>
      {threatCount > 0 && (
        <View style={styles.threatBadge}>
          <Text style={styles.threatBadgeText}>{threatCount}</Text>
        </View>
      )}
    </View>
  );

  const CustomAddressBar = () => (
    <TouchableOpacity 
      style={styles.addressBarContainer}
      onPress={() => setShowUrlBar(true)}
      activeOpacity={0.8}
    >
      <View style={styles.addressBar}>
        <View style={styles.lockIcon}>
          <Text style={styles.lockIconText}>{isSecure ? '🔒' : '⚠️'}</Text>
        </View>
        <Text style={styles.addressText} numberOfLines={1}>
          {currentUrl.replace(/^https?:\/\//, '').replace(/^www\./, '')}
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={() => handleWebNavigation('reload')}>
          <Text style={styles.refreshButtonText}>⟳</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const UrlInputModal = () => {
    if (!showUrlBar) return null;
    
    return (
      <View style={styles.urlInputModal}>
        <View style={styles.urlModalContent}>
          <View style={styles.urlModalHeader}>
            <Text style={styles.urlModalTitle}>🔍 Search or Enter URL</Text>
            <TouchableOpacity 
              style={styles.urlModalClose} 
              onPress={() => setShowUrlBar(false)}
            >
              <Text style={styles.urlModalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.urlInputRow}>
            <View style={styles.urlInputWrapper}>
              <Text style={styles.urlInputIcon}>🌐</Text>
              <TextInput
                style={styles.urlInput}
                value={inputUrl}
                onChangeText={setInputUrl}
                onSubmitEditing={handleUrlSubmit}
                placeholder="Search Google or type a URL..."
                placeholderTextColor="#888"
                autoCapitalize="none"
                autoCorrect={false}
                autoFocus={true}
                selectTextOnFocus={false}
                keyboardType="url"
                returnKeyType="go"
                blurOnSubmit={true}
              />
            </View>
            <TouchableOpacity style={styles.urlSubmitButton} onPress={handleUrlSubmit}>
              <Text style={styles.urlSubmitButtonText}>Go</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.urlSuggestions}>
            <Text style={styles.urlSuggestionsTitle}>Quick Access</Text>
            <View style={styles.urlSuggestionsList}>
              <TouchableOpacity 
                style={styles.urlSuggestionItem}
                onPress={() => {
                  setInputUrl('https://google.com');
                  handleUrlSubmit();
                }}
              >
                <Text style={styles.urlSuggestionIcon}>🔍</Text>
                <Text style={styles.urlSuggestionText}>Google Search</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.urlSuggestionItem}
                onPress={() => {
                  setInputUrl('https://duckduckgo.com');
                  handleUrlSubmit();
                }}
              >
                <Text style={styles.urlSuggestionIcon}>🦆</Text>
                <Text style={styles.urlSuggestionText}>DuckDuckGo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.urlSuggestionItem}
                onPress={() => {
                  setInputUrl('https://github.com');
                  handleUrlSubmit();
                }}
              >
                <Text style={styles.urlSuggestionIcon}>💻</Text>
                <Text style={styles.urlSuggestionText}>GitHub</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.urlSecurityNote}>
            <Text style={styles.urlSecurityIcon}>🛡️</Text>
            <Text style={styles.urlSecurityText}>
              All websites are scanned for threats before loading
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const ProgressBar = () => (
    <Animated.View 
      style={[
        styles.progressBar,
        {
          width: progressAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          }),
        },
      ]}
    />
  );

  const NavigationControls = () => (
    <View style={styles.navigationControls}>
      <TouchableOpacity
        style={[styles.navButton, !canGoBack && styles.navButtonDisabled]}
        onPress={() => handleWebNavigation('back')}
        disabled={!canGoBack}
      >
        <Text style={[styles.navButtonText, !canGoBack && styles.navButtonTextDisabled]}>←</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.navButton, !canGoForward && styles.navButtonDisabled]}
        onPress={() => handleWebNavigation('forward')}
        disabled={!canGoForward}
      >
        <Text style={[styles.navButtonText, !canGoForward && styles.navButtonTextDisabled]}>→</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => setShowUrlBar(true)}
      >
        <Text style={styles.navButtonText}>🔍</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => handleWebNavigation('home')}
      >
        <Text style={styles.navButtonText}>🏠</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.navButton}
        onPress={onGoBack}
      >
        <Text style={styles.navButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  const renderWebContent = () => {
    if (Platform.OS === 'web') {
      // Use iframe for web platform
      return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <iframe
            ref={iframeRef}
            src={currentUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#ffffff',
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              console.log('Failed to load URL in iframe:', currentUrl);
              setIsLoading(false);
            }}
            title="Shabari Secure Browser"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'linear-gradient(135deg, #4ecdc4, #44a08d)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 1000,
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }}>
            🛡️ Shabari Protected
          </div>
        </div>
      );
    } else if (WebView) {
      // Use WebView for mobile platforms with proper URL interception
      return (
        <WebView
          ref={webViewRef}
          source={{ uri: currentUrl }}
          style={styles.webView}
          onLoadStart={() => {
            setIsLoading(true);
            animateProgress(0.1);
          }}
          onLoadProgress={({ nativeEvent }: { nativeEvent: { progress: number } }) => {
            animateProgress(nativeEvent.progress);
          }}
          onLoadEnd={() => {
            setIsLoading(false);
            animateProgress(0);
          }}
          onNavigationStateChange={handleNavigationStateChange}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4ecdc4" />
              <Text style={styles.loadingText}>Loading securely...</Text>
            </View>
          )}
          onShouldStartLoadWithRequest={(request: any) => {
            console.log('🔍 SecureBrowser: WebView intercepting:', request.url);
            
            // Check if it's a download link first
            const downloadExtensions = ['.pdf', '.doc', '.docx', '.zip', '.exe', '.apk'];
            const isDownload = downloadExtensions.some(ext => 
              request.url.toLowerCase().includes(ext)
            );
            
            if (isDownload) {
              const fileName = request.url.split('/').pop() || 'download';
              handleDownload(request.url, fileName);
              return false; // Prevent navigation
            }
            
            // For regular navigation, perform async scanning
            // We'll allow the navigation initially and then handle blocking if needed
            handleAsyncUrlScan(request.url);
            return true; // Allow navigation for now, we'll handle blocking in the scan function
          }}
        />
      );
    } else {
      // Fallback for unsupported platforms
      return (
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackIcon}>🌐</Text>
          <Text style={styles.fallbackText}>
            Shabari Secure Browser
          </Text>
          <Text style={styles.fallbackSubtext}>
            This feature requires a mobile device with WebView support.
          </Text>
          <TouchableOpacity style={styles.fallbackButton} onPress={onGoBack}>
            <Text style={styles.fallbackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }
  };

  // Don't render the browser if not premium
  if (!isPremium) {
    return (
      <View style={styles.premiumContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
        <View style={styles.premiumContent}>
          <Animated.View style={[styles.premiumIcon, { transform: [{ scale: securityPulse }] }]}>
            <Text style={styles.premiumIconText}>🛡️</Text>
          </Animated.View>
          <Text style={styles.premiumTitle}>Shabari Secure Browser</Text>
          <Text style={styles.premiumSubtitle}>Premium Security Feature</Text>
          <Text style={styles.premiumDescription}>
            Experience the ultimate in secure browsing with our advanced threat protection,
            real-time malware scanning, and privacy-first architecture.
          </Text>
          <View style={styles.premiumFeatures}>
            <Text style={styles.premiumFeature}>🔒 End-to-end encryption</Text>
            <Text style={styles.premiumFeature}>🛡️ Real-time threat detection</Text>
            <Text style={styles.premiumFeature}>🚫 Ad & tracker blocking</Text>
            <Text style={styles.premiumFeature}>⚡ Lightning-fast performance</Text>
          </View>
          <TouchableOpacity style={styles.upgradeButton} onPress={onGoBack}>
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={onGoBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <SecurityIndicator />
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Shabari Browser</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{pageTitle}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <ProgressBar />

      {/* Custom Address Bar */}
      <CustomAddressBar />

      {/* Scanning Overlay */}
      {isScanning && (
        <View style={styles.scanningOverlay}>
          <View style={styles.scanningContent}>
            <ActivityIndicator size="large" color="#4ecdc4" />
            <Text style={styles.scanningText}>Scanning for threats...</Text>
            <Text style={styles.scanningSubtext}>Shabari is protecting your browsing</Text>
          </View>
        </View>
      )}

      {/* Web Content */}
      <View style={styles.webViewContainer}>
        {renderWebContent()}
      </View>

      {/* Navigation Controls */}
      <NavigationControls />

      {/* URL Input Modal */}
      <UrlInputModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 15,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a40',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    color: '#cccccc',
    marginTop: 2,
  },
  securityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4ecdc4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityIconText: {
    fontSize: 20,
  },
  securityInfo: {
    marginLeft: 10,
  },
  securityStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4ecdc4',
  },
  securitySubtext: {
    fontSize: 10,
    color: '#888',
  },
  threatBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  threatBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 3,
    backgroundColor: '#4ecdc4',
    position: 'absolute',
    top: Platform.OS === 'ios' ? 89 : 69,
    left: 0,
    zIndex: 1000,
  },
  addressBarContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#16213e',
  },
  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a40',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lockIcon: {
    marginRight: 10,
  },
  lockIconText: {
    fontSize: 16,
  },
  addressText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
  },
  refreshButton: {
    padding: 5,
  },
  refreshButtonText: {
    fontSize: 18,
    color: '#4ecdc4',
  },
  urlInputModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  urlModalContent: {
    backgroundColor: '#2a2a40',
    borderRadius: 20,
    padding: 25,
    width: '90%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  urlModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  urlModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  urlModalClose: {
    backgroundColor: '#ff4757',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urlModalCloseText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  urlInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#4ecdc4',
  },
  urlInputIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  urlInput: {
    flex: 1,
    color: '#ffffff',
    paddingVertical: 15,
    fontSize: 16,
  },
  urlSuggestions: {
    marginBottom: 20,
  },
  urlSuggestionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4ecdc4',
    marginBottom: 10,
  },
  urlSuggestionsList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  urlSuggestionItem: {
    backgroundColor: '#1a1a2e',
    borderRadius: 15,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#4ecdc4',
  },
  urlSuggestionIcon: {
    fontSize: 20,
    marginBottom: 5,
  },
  urlSuggestionText: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
  },
  urlSecurityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#4ecdc4',
  },
  urlSecurityIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  urlSecurityText: {
    color: '#cccccc',
    fontSize: 12,
    flex: 1,
  },
  urlSubmitButton: {
    backgroundColor: '#4ecdc4',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  urlSubmitButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webView: {
    flex: 1,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 40,
  },
  fallbackIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  fallbackText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  fallbackSubtext: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 30,
  },
  fallbackButton: {
    backgroundColor: '#4ecdc4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  fallbackButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scanningOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 26, 46, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1500,
  },
  scanningContent: {
    alignItems: 'center',
    backgroundColor: '#2a2a40',
    padding: 30,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  scanningText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  scanningSubtext: {
    color: '#cccccc',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 15,
  },
  navigationControls: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    paddingVertical: 15,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#2a2a40',
  },
  navButton: {
    backgroundColor: '#2a2a40',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 50,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navButtonDisabled: {
    backgroundColor: '#1a1a2e',
    opacity: 0.5,
  },
  navButtonText: {
    color: '#4ecdc4',
    fontSize: 18,
    fontWeight: 'bold',
  },
  navButtonTextDisabled: {
    color: '#666',
  },
  premiumContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  premiumContent: {
    backgroundColor: '#2a2a40',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  premiumIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4ecdc4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  premiumIconText: {
    fontSize: 40,
  },
  premiumTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  premiumSubtitle: {
    fontSize: 16,
    color: '#4ecdc4',
    marginBottom: 15,
    textAlign: 'center',
  },
  premiumDescription: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  premiumFeatures: {
    alignSelf: 'stretch',
    marginBottom: 25,
  },
  premiumFeature: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 8,
    paddingLeft: 10,
  },
  upgradeButton: {
    backgroundColor: '#4ecdc4',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
    width: '100%',
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  backButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#4ecdc4',
    width: '100%',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#4ecdc4',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SecureBrowserScreen;

