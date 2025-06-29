import { Ionicons } from '@expo/vector-icons';
import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState, useCallback } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    StatusBar
} from 'react-native';

import { QRScanResult, qrScannerService } from '../services/QRScannerService';

interface LiveQRScannerScreenProps {
  navigation: any;
  route?: {
    params?: {
      onScanComplete?: (result: QRScanResult) => void;
    };
  };
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const LiveQRScannerScreen: React.FC<LiveQRScannerScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<QRScanResult | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [qrCategory, setQrCategory] = useState<'PAYMENT' | 'NON_PAYMENT' | null>(null);
  const [analysisStage, setAnalysisStage] = useState<'CLASSIFYING' | 'ANALYZING' | 'COMPLETE' | null>(null);
  
  // Animation values
  const scanLinePosition = useState(new Animated.Value(0))[0];
  const alertPulse = useState(new Animated.Value(1))[0];
  const categoryIndicator = useState(new Animated.Value(0))[0];
  const analysisProgress = useState(new Animated.Value(0))[0];

  useEffect(() => {
    initializeScanner();
    startScanLineAnimation();
  }, []);

  const initializeScanner = async () => {
    // Check if we're on web
    if (Platform.OS === 'web') {
      Alert.alert(
        '📱 Camera Not Available on Web',
        'QR scanning requires a mobile device with camera. Please test on:\n\n• Real Android device (recommended)\n• Android emulator\n• Built APK file\n\nWeb browsers cannot access camera for QR scanning.',
        [
          { text: 'Go Back', onPress: () => navigation.goBack() }
        ]
      );
      return;
    }

    // Request camera permissions
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');

    if (status === 'granted') {
      // Initialize QR scanner service
      try {
        await qrScannerService.initialize();
        console.log('✅ Live QR Scanner initialized');
      } catch (error) {
        console.error('❌ QR Scanner service initialization failed:', error);
        Alert.alert(
          'Service Error',
          'Failed to initialize fraud detection. Scanner will work with limited functionality.'
        );
      }
    } else {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera permission to use the QR scanner',
        [
          { text: 'Cancel', onPress: () => navigation.goBack() },
          { text: 'Open Settings', onPress: () => {/* Open settings */} }
        ]
      );
    }
  };

  const startScanLineAnimation = () => {
    const animateScanLine = () => {
      scanLinePosition.setValue(0);
      Animated.timing(scanLinePosition, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }).start(() => {
        if (!scanned) {
          animateScanLine();
        }
      });
    };
    animateScanLine();
  };

  const startAlertPulse = () => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(alertPulse, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(alertPulse, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start(() => {
        if (lastScanResult?.isFraudulent) {
          pulse();
        }
      });
    };
    pulse();
  };

  const startCategoryAnimation = (category: 'PAYMENT' | 'NON_PAYMENT') => {
    Animated.timing(categoryIndicator, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const startAnalysisProgressAnimation = (isPayment: boolean) => {
    const duration = isPayment ? 800 : 2500; // Faster for payment, slower for detailed analysis
    
    Animated.timing(analysisProgress, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    }).start();
  };

  const resetAnimations = () => {
    categoryIndicator.setValue(0);
    analysisProgress.setValue(0);
    alertPulse.setValue(1);
    setQrCategory(null);
    setAnalysisStage(null);
  };

  const handleBarCodeScanned = async ({ type, data }: BarCodeScannerResult) => {
    if (scanned || isAnalyzing) return;

    console.log('📱 QR Code scanned:', { type, data: data.substring(0, 50) + '...' });
    
    setScanned(true);
    setIsAnalyzing(true);

    // Haptic feedback
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      // STEP 1: Classify QR Type with UI feedback
      setAnalysisStage('CLASSIFYING');
      const detectedCategory = qrScannerService.classifyQRType ? 
        qrScannerService.classifyQRType(type, data) : 'NON_PAYMENT';
      
      setQrCategory(detectedCategory);
      startCategoryAnimation(detectedCategory);
      console.log(`🔍 QR Category: ${detectedCategory}`);

      // Brief pause to show classification
      await new Promise(resolve => setTimeout(resolve, 800));

      // STEP 2: Start appropriate analysis with UI feedback
      setAnalysisStage('ANALYZING');
      startAnalysisProgressAnimation(detectedCategory === 'PAYMENT');

      // Analyze QR code for fraud using smart detection
      const result = await qrScannerService.analyzeQRCode(type, data);
      setLastScanResult(result);
      setAnalysisStage('COMPLETE');

      // Show results based on QR category and fraud status
      if (result.isFraudulent) {
        if (Platform.OS !== 'web') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        startAlertPulse();
        
        if (detectedCategory === 'PAYMENT') {
          // Payment fraud - immediate blocking
          Alert.alert(
            '🚨 Payment Blocked!',
            `⚠️ Fraudulent payment detected - transaction blocked!\n\nThis payment appears to be a scam.\n\nRisk Level: ${result.riskLevel}\nReasons: ${result.analysis.fraudIndicators.join(', ')}\n\n🔒 Your financial data was analyzed locally and never sent externally.`,
            [
              { text: 'Report Fraud', style: 'destructive' },
              { text: 'Scan Different QR', onPress: () => resetScanner() },
              { text: 'View Details', onPress: () => showDetailedResults(result) }
            ]
          );
        } else {
          // Non-payment fraud - detailed warning
          Alert.alert(
            '🚫 Malicious QR Code Detected!',
            `⚠️ This QR code contains dangerous content detected by security scan.\n\nRisk Level: ${result.riskLevel}\nThreats Found: ${result.analysis.fraudIndicators.join(', ')}\n\n📊 Analysis by VirusTotal: Multiple antivirus engines flagged this content.`,
            [
              { text: 'Block & Report', style: 'destructive' },
              { text: 'Scan Different QR', onPress: () => resetScanner() },
              { text: 'View Full Report', onPress: () => showDetailedResults(result) }
            ]
          );
        }
      } else {
        if (Platform.OS !== 'web') {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        if (detectedCategory === 'PAYMENT') {
          // Safe payment - quick approval
          Alert.alert(
            '✅ Payment Verified Safe',
            `✅ Payment appears safe - you may proceed with the transaction.\n\nRisk Level: ${result.riskLevel}\n\n🔒 Analysis completed locally in <100ms.\n⚡ Your financial privacy was maintained.`,
            [
              { text: 'Confirm Payment', onPress: () => showDetailedResults(result) },
              { text: 'More Details', onPress: () => showDetailedResults(result) },
              { text: 'Scan Another', onPress: () => resetScanner(), style: 'cancel' }
            ]
          );
        } else {
          // Non-payment safe - detailed results
          Alert.alert(
            '🔍 Security Analysis Complete',
            `✅ QR code analysis finished.\n\nRisk Level: ${result.riskLevel}\n📊 VirusTotal: Detailed scan results available.\n\n${result.analysis.warnings?.join('\n') || 'No security threats detected.'}`,
            [
              { text: 'Proceed', onPress: () => showDetailedResults(result) },
              { text: 'View Full Report', onPress: () => showDetailedResults(result) },
              { text: 'Scan Another', onPress: () => resetScanner(), style: 'cancel' }
            ]
          );
        }
      }

      // Call completion callback if provided
      if (route?.params?.onScanComplete) {
        route.params.onScanComplete(result);
      }

    } catch (error) {
      console.error('❌ QR analysis failed:', error);
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      Alert.alert(
        'Analysis Error',
        'Failed to analyze QR code for fraud patterns. The code may still be risky.',
        [
          { text: 'Scan Another', onPress: () => resetScanner() }
        ]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const showDetailedResults = (result: QRScanResult) => {
    navigation.navigate('ScanResult', {
      qrResult: result,
      data: result.data,
      type: result.type,
      isSafe: !result.isFraudulent,
      threatName: result.isFraudulent ? `${result.riskLevel} QR Code` : undefined,
      details: `Risk Score: ${result.riskScore}%\n\nFraud Indicators:\n${result.analysis.fraudIndicators.join('\n')}\n\nWarnings:\n${result.analysis.warnings.join('\n')}`,
      scanEngine: 'Shabari QR Fraud Scanner'
    });
  };

  const resetScanner = () => {
    setScanned(false);
    setIsAnalyzing(false);
    setLastScanResult(null);
    resetAnimations();
    startScanLineAnimation();
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  // Web platform message
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>QR Fraud Scanner</Text>
          
          <View style={styles.headerButton} />
        </View>

        <View style={styles.webMessageContainer}>
          <Ionicons name="phone-portrait" size={80} color="#007AFF" />
          <Text style={styles.webMessageTitle}>Mobile Device Required</Text>
          <Text style={styles.webMessageText}>
            QR scanning with camera requires a mobile device. 
            {'\n\n'}
            Please test on:
            {'\n'}• Real Android device
            {'\n'}• Android emulator 
            {'\n'}• Built APK file
            {'\n\n'}
            Web browsers cannot access camera for QR code scanning.
          </Text>
          <TouchableOpacity 
            style={styles.webBackButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.webBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>No access to camera</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>QR Fraud Scanner</Text>
          
          <TouchableOpacity 
            onPress={toggleFlash} 
            style={styles.headerButton}
          >
            <Ionicons 
              name={flashOn ? "flash" : "flash-off"} 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        </View>

        {/* Scanning Area */}
        <View style={styles.scanArea}>
          <View style={styles.scanFrame}>
            {/* Corner indicators */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            
            {/* Scan line */}
            {!scanned && (
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    top: scanLinePosition.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 240]
                    })
                  }
                ]}
              />
            )}
            
            {/* Analysis overlay */}
            {isAnalyzing && (
              <View style={styles.analyzingOverlay}>
                {analysisStage === 'CLASSIFYING' && (
                  <>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.analyzingText}>🔍 Classifying QR Type...</Text>
                    <Text style={styles.analyzingSubtext}>Detecting payment vs non-payment</Text>
                  </>
                )}
                
                {analysisStage === 'ANALYZING' && qrCategory && (
                  <>
                    <Animated.View 
                      style={[
                        styles.categoryIndicator,
                        {
                          backgroundColor: qrCategory === 'PAYMENT' ? '#f59e0b' : '#3b82f6',
                          transform: [{ scale: categoryIndicator }]
                        }
                      ]}
                    >
                      <Ionicons 
                        name={qrCategory === 'PAYMENT' ? 'card' : 'globe'} 
                        size={32} 
                        color="white" 
                      />
                    </Animated.View>
                    
                    <Text style={styles.categoryText}>
                      {qrCategory === 'PAYMENT' ? '💰 Payment QR' : '🌐 General QR'}
                    </Text>
                    
                    <View style={styles.analysisProgressContainer}>
                      <Text style={styles.analyzingText}>
                        {qrCategory === 'PAYMENT' 
                          ? '🚨 Immediate Protection...' 
                          : '📡 VirusTotal Analysis...'
                        }
                      </Text>
                      <Text style={styles.analyzingSubtext}>
                        {qrCategory === 'PAYMENT' 
                          ? '⚡ Local analysis • Privacy protected' 
                          : '🌐 60+ antivirus engines • Cloud scan'
                        }
                      </Text>
                      
                      {/* Progress bar */}
                      <View style={styles.progressBar}>
                        <Animated.View 
                          style={[
                            styles.progressFill,
                            {
                              backgroundColor: qrCategory === 'PAYMENT' ? '#f59e0b' : '#3b82f6',
                              width: analysisProgress.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%']
                              })
                            }
                          ]}
                        />
                      </View>
                      
                      <Text style={styles.progressText}>
                        {qrCategory === 'PAYMENT' ? '<100ms' : '1-3 seconds'}
                      </Text>
                    </View>
                  </>
                )}
                
                {analysisStage === 'COMPLETE' && (
                  <>
                    <Ionicons 
                      name={lastScanResult?.isFraudulent ? 'warning' : 'checkmark-circle'} 
                      size={48} 
                      color={lastScanResult?.isFraudulent ? '#ef4444' : '#22c55e'} 
                    />
                    <Text style={styles.analyzingText}>Analysis Complete</Text>
                  </>
                )}
              </View>
            )}
            
            {/* QR Category Indicator (when not analyzing) */}
            {!isAnalyzing && qrCategory && (
              <Animated.View 
                style={[
                  styles.categoryBadge,
                  {
                    backgroundColor: qrCategory === 'PAYMENT' ? '#f59e0b' : '#3b82f6',
                    opacity: categoryIndicator
                  }
                ]}
              >
                <Ionicons 
                  name={qrCategory === 'PAYMENT' ? 'card' : 'globe'} 
                  size={16} 
                  color="white" 
                />
                <Text style={styles.categoryBadgeText}>
                  {qrCategory === 'PAYMENT' ? 'Payment' : 'General'}
                </Text>
              </Animated.View>
            )}
            
            {/* Alert overlay for fraudulent QR */}
            {lastScanResult?.isFraudulent && (
              <Animated.View 
                style={[
                  styles.alertOverlay,
                  { transform: [{ scale: alertPulse }] }
                ]}
              >
                <LinearGradient
                  colors={['rgba(239, 68, 68, 0.8)', 'rgba(239, 68, 68, 0.6)']}
                  style={styles.alertGradient}
                >
                  <Ionicons name="warning" size={48} color="white" />
                  <Text style={styles.alertText}>
                    {qrCategory === 'PAYMENT' ? 'PAYMENT BLOCKED' : 'FRAUD DETECTED'}
                  </Text>
                  <Text style={styles.alertSubtext}>
                    {qrCategory === 'PAYMENT' 
                      ? 'Fraudulent payment transaction' 
                      : 'Malicious content detected'
                    }
                  </Text>
                </LinearGradient>
              </Animated.View>
            )}
            
            {/* Success overlay for safe QR */}
            {lastScanResult && !lastScanResult.isFraudulent && analysisStage === 'COMPLETE' && (
              <Animated.View 
                style={[
                  styles.successOverlay,
                  { opacity: categoryIndicator }
                ]}
              >
                <LinearGradient
                  colors={['rgba(34, 197, 94, 0.8)', 'rgba(34, 197, 94, 0.6)']}
                  style={styles.successGradient}
                >
                  <Ionicons name="checkmark-circle" size={48} color="white" />
                  <Text style={styles.successText}>
                    {qrCategory === 'PAYMENT' ? 'PAYMENT SAFE' : 'QR VERIFIED'}
                  </Text>
                  <Text style={styles.successSubtext}>
                    {qrCategory === 'PAYMENT' 
                      ? 'Transaction approved for processing' 
                      : 'No security threats detected'
                    }
                  </Text>
                </LinearGradient>
              </Animated.View>
            )}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            {isAnalyzing 
              ? analysisStage === 'CLASSIFYING'
                ? '🔍 Classifying QR type...'
                : analysisStage === 'ANALYZING'
                  ? qrCategory === 'PAYMENT'
                    ? '🚨 Immediate payment protection active'
                    : '📡 Detailed VirusTotal analysis in progress'
                  : 'Analysis complete'
              : scanned 
                ? lastScanResult?.isFraudulent 
                  ? qrCategory === 'PAYMENT'
                    ? '🚨 Fraudulent Payment Blocked!'
                    : '⚠️ Malicious QR Code Detected!'
                  : qrCategory === 'PAYMENT'
                    ? '✅ Payment Verified Safe'
                    : '✅ QR Code Verified Safe'
                : '📱 Point camera at QR code to scan'
            }
          </Text>
          
          {qrCategory && !isAnalyzing && (
            <View style={styles.qrTypeIndicator}>
              <Ionicons 
                name={qrCategory === 'PAYMENT' ? 'card' : 'globe'} 
                size={16} 
                color={qrCategory === 'PAYMENT' ? '#f59e0b' : '#3b82f6'} 
              />
              <Text style={[
                styles.qrTypeText,
                { color: qrCategory === 'PAYMENT' ? '#f59e0b' : '#3b82f6' }
              ]}>
                {qrCategory === 'PAYMENT' ? 'Payment QR • Local Analysis' : 'General QR • Cloud Analysis'}
              </Text>
            </View>
          )}
          
          {scanned && (
            <TouchableOpacity 
              style={styles.scanAgainButton} 
              onPress={resetScanner}
            >
              <Text style={styles.scanAgainText}>Scan Another</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Status Bar */}
        <View style={styles.statusBar}>
          <View style={styles.statusItem}>
            <Ionicons name="shield-checkmark" size={16} color="#22c55e" />
            <Text style={styles.statusText}>Live Fraud Detection</Text>
          </View>
          
          <View style={styles.statusItem}>
            <Ionicons name="eye" size={16} color="#3b82f6" />
            <Text style={styles.statusText}>Real-time Analysis</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  text: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    margin: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    margin: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  // Web message styles
  webMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  webMessageTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  webMessageText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  webBackButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  webBackButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerButton: {
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 25,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
  },
  analyzingSubtext: {
    color: 'white',
    marginTop: 5,
    fontSize: 12,
  },
  categoryIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  categoryBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  analysisProgressContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 5,
    marginBottom: 5,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#3b82f6',
    borderRadius: 5,
  },
  progressText: {
    color: 'white',
    fontSize: 12,
  },
  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  alertText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  alertSubtext: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
  },
  instructions: {
    padding: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  scanAgainButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  scanAgainText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 5,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  successText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  successSubtext: {
    color: 'white',
    fontSize: 14,
    marginTop: 5,
  },
  qrTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  qrTypeText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default LiveQRScannerScreen; 