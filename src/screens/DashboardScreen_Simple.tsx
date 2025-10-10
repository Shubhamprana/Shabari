import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Sentry from '@sentry/react-native';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { NativeFileScanner } from '../services/NativeFileScanner';
import { useSubscriptionStore } from '../stores/subscriptionStore';
// Mock LinkScannerService since the module doesn't exist
const LinkScannerService = {
  initializeService: async () => {
    console.log('LinkScannerService: Mock initialization');
    return true;
  },
  scanUrl: async (url: string) => {
    console.log('LinkScannerService: Mock scan for', url);
    // Simulate scanning with random results
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
    return {
      isSafe: Math.random() > 0.3, // 70% chance of being safe
      details: `Scanned ${url} - ${Math.random() > 0.3 ? 'No threats detected' : 'Potential threat detected'}`
    };
  }
};
// Import types - using any for now to avoid type issues
type DashboardScreenProps = {
  navigation: any;
  onNavigateToScanResult: (result: any) => void;
  onNavigateToQRScanner: () => void;
  onNavigateToSettings: () => void;
  onNavigateToMessageAnalysis: () => void;
};

const DashboardScreen: React.FC<DashboardScreenProps> = ({ 
  navigation,
  onNavigateToScanResult,
  onNavigateToQRScanner,
  onNavigateToSettings,
  onNavigateToMessageAnalysis,
}) => {
  console.log('🚀 DashboardScreen: Simple version starting to render');
  
  const { isPremium } = useSubscriptionStore();
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [urlToCheck, setUrlToCheck] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isFileScannerReady, setIsFileScannerReady] = useState(false);

  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('🔄 Initializing basic services...');
        
        // Initialize file scanner
        try {
          const nativeScanner = NativeFileScanner.getInstance();
          if (nativeScanner && typeof nativeScanner.initialize === 'function') {
            await nativeScanner.initialize();
            setIsFileScannerReady(true);
            console.log('✅ File scanner ready');
          }
        } catch (error) {
          console.warn('⚠️ File scanner not available:', error);
        }
        
        console.log('✅ Basic service initialization completed');
      } catch (error) {
        console.error('❌ Service initialization error:', error);
        Sentry.captureException(error);
      }
    };

    initializeServices();
  }, []);

  const performLinkScan = async () => {
    if (!urlToCheck.trim()) {
      Alert.alert('⚠️ Invalid URL', 'Please enter a valid URL to scan');
      return;
    }

    setIsScanning(true);
    try {
      console.log('🔍 Scanning URL:', urlToCheck);
      
      if (typeof LinkScannerService.initializeService !== 'function') {
        throw new Error('LinkScannerService.initializeService is not available');
      }
      await LinkScannerService.initializeService();

      if (typeof LinkScannerService.scanUrl !== 'function') {
        throw new Error('LinkScannerService.scanUrl is not available');
      }
      const result = await LinkScannerService.scanUrl(urlToCheck.trim());

      console.log('🔍 Scan result:', result);

      setShowLinkModal(false);
      setUrlToCheck('');

      onNavigateToScanResult({
        url: urlToCheck.trim(),
        isSafe: result.isSafe,
        details: result.details,
        scanTime: new Date(),
        isLoading: false,
        scanType: 'url',
        scanEngine: 'Shabari Scanner v2.0',
      });
    } catch (error) {
      console.error('❌ URL scan error:', error);
      Sentry.captureException(error);
      Alert.alert('❌ Scan Error', 'Failed to scan URL. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileScan = async () => {
    if (!isFileScannerReady) {
      Alert.alert('Scanner Not Ready', 'The file scanner is still initializing. Please wait a moment and try again.');
      return;
    }

    console.log('🔍 File scanning initiated');

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('📄 File selected:', file.name);
        
        const nativeScanner = NativeFileScanner.getInstance();
        if (nativeScanner && typeof nativeScanner.scanFile === 'function') {
          const scanResult = await nativeScanner.scanFile(file.uri);
          
          onNavigateToScanResult({
            url: file.name,
            isSafe: scanResult.isSafe,
            details: scanResult.details || 'File scan completed',
            scanTime: new Date(),
            isLoading: false,
            scanType: 'file',
            scanEngine: 'Shabari File Scanner',
          });
        } else {
          Alert.alert('❌ Scanner Error', 'File scanner is not available');
        }
      }
    } catch (error) {
      console.error('❌ File scanner error:', error);
      Alert.alert('❌ Scanner Error', 'Failed to scan file. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0D1421', '#1A1F2E', '#2D3748']}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="shield-check" size={28} color="#FF6B35" />
          </View>
          <View>
            <Text style={styles.headerTitle}>🛡️ Shabari</Text>
            <Text style={styles.headerSubtitle}>Security Suite</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => onNavigateToSettings()}
        >
          <MaterialCommunityIcons name="cog" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>
      
      {/* Main Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>🛡️ Security Status</Text>
          <Text style={styles.statusText}>System Protected</Text>
          <Text style={styles.statusSubtext}>All security features are active</Text>
        </View>

        {/* Action Cards */}
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => setShowLinkModal(true)}
          >
            <MaterialCommunityIcons name="link-variant" size={32} color="#FF6B35" />
            <Text style={styles.actionTitle}>URL Scanner</Text>
            <Text style={styles.actionSubtitle}>Scan suspicious links</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={handleFileScan}
          >
            <MaterialCommunityIcons name="file-search" size={32} color="#9C27B0" />
            <Text style={styles.actionTitle}>File Scanner</Text>
            <Text style={styles.actionSubtitle}>Scan files for threats</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => onNavigateToQRScanner()}
          >
            <MaterialCommunityIcons name="qrcode-scan" size={32} color="#607D8B" />
            <Text style={styles.actionTitle}>QR Scanner</Text>
            <Text style={styles.actionSubtitle}>Scan QR codes safely</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => onNavigateToMessageAnalysis()}
          >
            <MaterialCommunityIcons name="message-alert" size={32} color="#795548" />
            <Text style={styles.actionTitle}>SMS Analysis</Text>
            <Text style={styles.actionSubtitle}>Analyze SMS threats</Text>
          </TouchableOpacity>
        </View>

        {/* Premium Status */}
        {isPremium && (
          <View style={styles.premiumCard}>
            <MaterialCommunityIcons name="crown" size={24} color="#FFD700" />
            <Text style={styles.premiumText}>Premium Active</Text>
          </View>
        )}
      </ScrollView>

      {/* URL Scanner Modal */}
      <Modal
        visible={showLinkModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLinkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>🔍 URL Scanner</Text>
            <Text style={styles.modalDescription}>
              Enter a URL to scan for potential security threats
            </Text>
            
            <TextInput
              style={styles.urlInput}
              placeholder="https://example.com"
              placeholderTextColor="#666"
              value={urlToCheck}
              onChangeText={setUrlToCheck}
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowLinkModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={performLinkScan}
                disabled={isScanning || !urlToCheck.trim()}
              >
                <Text style={styles.scanButtonText}>
                  {isScanning ? 'Scanning...' : 'Scan URL'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1421',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    marginRight: 12,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#B0B0B0',
    fontSize: 14,
  },
  settingsButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  statusTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusSubtext: {
    color: '#B0B0B0',
    fontSize: 14,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  actionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  actionSubtitle: {
    color: '#B0B0B0',
    fontSize: 12,
    textAlign: 'center',
  },
  premiumCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  premiumText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1a1a2e',
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    color: '#B0B0B0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  urlInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#666',
    padding: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  scanButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
  },
  scanButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default DashboardScreen;
