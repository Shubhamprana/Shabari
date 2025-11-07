import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Sentry from '@sentry/react-native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DeepScanActionButtons from '../components/DeepScanActionButtons';
import DeepScanConfigPanel from '../components/DeepScanConfigPanel';
import DeepScanProgressCard from '../components/DeepScanProgressCard';
import DeepScanResultSummary from '../components/DeepScanResultSummary';
import DeepScanStatisticsCard from '../components/DeepScanStatisticsCard';
import DeepScanThreatCard from '../components/DeepScanThreatCard';
import EnhancedDeepScanService, {
  DeepScanConfig,
  DeepScanProgress,
  DeepScanResult,
  DeepScanThreat,
} from '../services/EnhancedDeepScanService';
import { ThreatActionType } from '../types/deepScan.types';
import QuarantineService from '../services/QuarantineService';

// ==============================================================================
// COMPONENT PROPS
// ==============================================================================

interface DeepScanScreenProps {
  onGoBack: () => void;
  onNavigateToQuarantine?: () => void;
}

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================

const DeepScanScreen: React.FC<DeepScanScreenProps> = ({ onGoBack, onNavigateToQuarantine }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<DeepScanProgress | null>(null);
  const [scanResult, setScanResult] = useState<DeepScanResult | null>(null);
  const [expandedThreat, setExpandedThreat] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [scanConfig, setScanConfig] = useState<DeepScanConfig>({
    scanType: 'quick',
    scanDownloads: true,
    scanDocuments: false,
    scanImages: false,
    scanWhatsApp: false,
    scanTelegram: false,
    scanCache: false,
    scanSystemDirs: false,
    scanAllFolders: false,
    scanSocialMediaFolders: false,
    scanApkFiles: true,
    scanAppPermissions: true,
    scanAllApps: false,
    scanUserApps: true,
    scanSystemApps: false,
    recursiveScan: false,
    maxScanDepth: 2,
    scanPriority: 'speed',
    enableYaraEngine: false,
    enableHeuristicScan: true,
    skipSystemFiles: true,
    skipHiddenFiles: false,
  });

  // Animations
  const scannerRotation = useRef(new Animated.Value(0)).current;
  const progressPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    console.log('🔍 Deep Scan Screen initialized');
    Sentry.addBreadcrumb({ message: 'Deep Scan Screen opened' });

    return () => {
      // Cleanup: Cancel scan if user navigates away
      if (isScanning) {
        EnhancedDeepScanService.cancelScan();
      }
    };
  }, []);

  // Start rotation animation when scanning
  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.timing(scannerRotation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(progressPulse, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(progressPulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scannerRotation.setValue(0);
      progressPulse.setValue(1);
    }
  }, [isScanning]);

  const spin = scannerRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ==============================================================================
  // SCAN HANDLERS
  // ==============================================================================

  const handleStartQuickScan = async () => {
    const quickConfig: DeepScanConfig = {
      ...scanConfig,
      scanType: 'quick',
      scanDownloads: true,
      scanDocuments: false,
      scanImages: false,
      scanWhatsApp: false,
      scanTelegram: false,
      scanCache: false,
      scanSystemDirs: false,
      scanAllFolders: false,
      scanSocialMediaFolders: false,
      recursiveScan: false,
      maxScanDepth: 2,
      scanPriority: 'speed',
      maxFileSize: 50 * 1024 * 1024, // 50MB for quick scan
    };
    setScanConfig(quickConfig);
    await performScan(quickConfig, 'Quick Scan');
  };

  const handleStartFullScan = async () => {
    const fullConfig: DeepScanConfig = {
      ...scanConfig,
      scanType: 'full',
      scanDownloads: true,
      scanDocuments: true,
      scanImages: true,
      scanWhatsApp: true,
      scanTelegram: true,
      scanCache: true,
      scanSystemDirs: false,
      scanAllFolders: true,
      scanSocialMediaFolders: true,
      recursiveScan: true,
      maxScanDepth: 10,
      scanPriority: 'thorough',
      enableYaraEngine: true,
      maxFileSize: 100 * 1024 * 1024, // 100MB for full scan
    };
    setScanConfig(fullConfig);
    await performScan(fullConfig, 'Full Deep Scan');
  };

  const performScan = async (config: Partial<DeepScanConfig>, scanType: string) => {
    try {
      console.log(`🔍 Starting ${scanType}...`);
      Sentry.addBreadcrumb({ message: `${scanType} initiated`, data: { config } });

      setIsScanning(true);
      setScanProgress(null);
      setScanResult(null);

      const result = await EnhancedDeepScanService.performDeepScan(config, (progress) => {
        setScanProgress(progress);
      });

      setIsScanning(false);
      setScanResult(result);

      console.log(`✅ ${scanType} completed:`, {
        filesScanned: result.totalFilesScanned,
        threatsFound: result.threatsDetected.length,
        duration: `${(result.scanDuration / 1000).toFixed(2)}s`,
      });

      Sentry.addBreadcrumb({
        message: `${scanType} completed`,
        data: {
          filesScanned: result.totalFilesScanned,
          threatsFound: result.threatsDetected.length,
          duration: result.scanDuration,
        },
      });

      // Show result alert
      if (result.threatsDetected.length > 0) {
        Alert.alert(
          '⚠️ Threats Detected!',
          `Found ${result.threatsDetected.length} potential threat(s) on your device.\n\nPlease review the results and take appropriate action.`,
          [{ text: 'View Results', style: 'default' }]
        );
      } else {
        Alert.alert(
          '✅ Device is Clean!',
          `Scanned ${result.totalFilesScanned} files.\n\nNo threats detected. Your device is secure!`,
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('❌ Scan error:', error);
      Sentry.captureException(error, { tags: { screen: 'deepScan', action: 'performScan' } });

      setIsScanning(false);
      setScanProgress(null);

      Alert.alert(
        '❌ Scan Failed',
        error instanceof Error ? error.message : 'An unknown error occurred during the scan.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCancelScan = () => {
    Alert.alert(
      'Cancel Scan?',
      'Are you sure you want to cancel the current scan?',
      [
        { text: 'Continue Scanning', style: 'cancel' },
        {
          text: 'Cancel Scan',
          style: 'destructive',
          onPress: () => {
            EnhancedDeepScanService.cancelScan();
            setIsScanning(false);
            setScanProgress(null);
          },
        },
      ]
    );
  };

  const handleDeleteThreat = (threat: DeepScanThreat) => {
    Alert.alert(
      '⚠️ Delete Threat?',
      `Are you sure you want to delete this file?\n\n${threat.fileName}\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Attempting to delete threat file:', threat.fileName);
              
              // Import FileSystem dynamically to avoid crashes in development
              let FileSystem: any = null;
              try {
                FileSystem = require('expo-file-system');
              } catch (error) {
                console.warn('⚠️ FileSystem not available:', error);
                Alert.alert('❌ Error', 'File system not available. Cannot delete file.');
                return;
              }

              // Check if file exists
              const fileInfo = await FileSystem.getInfoAsync(threat.filePath);
              if (!fileInfo.exists) {
                Alert.alert('❌ File Not Found', 'The file has already been deleted or moved.');
                return;
              }

              // Delete the file
              await FileSystem.deleteAsync(threat.filePath, { idempotent: true });
              
              console.log('✅ Threat file deleted successfully:', threat.fileName);
              
              // Remove from scan results
              if (scanResult) {
                const updatedThreats = scanResult.threatsDetected.filter(t => t.id !== threat.id);
                setScanResult({
                  ...scanResult,
                  threatsDetected: updatedThreats
                });
              }

              Alert.alert('✅ Success', `Threat file "${threat.fileName}" has been deleted successfully.`);
              
            } catch (error) {
              console.error('❌ Error deleting threat file:', error);
              Alert.alert('❌ Error', `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          },
        },
      ]
    );
  };

  const handleQuarantineAllThreats = () => {
    if (!scanResult || scanResult.threatsDetected.length === 0) {
      return;
    }

    Alert.alert(
      '🔒 Quarantine All Threats?',
      `Move all ${scanResult.threatsDetected.length} threat(s) to quarantine?\n\nThis will isolate all detected threats in a secure location.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Quarantine All',
          onPress: async () => {
            try {
              console.log(`🔒 Attempting to quarantine all ${scanResult.threatsDetected.length} threats`);

              const quarantineService = QuarantineService.getInstance();
              let successCount = 0;
              let errorCount = 0;

              // Process each threat
              for (const threat of scanResult.threatsDetected) {
                try {
                  const result = await quarantineService.quarantineFile(
                    threat.filePath,
                    threat.fileName,
                    {
                      isSafe: false,
                      threatName: threat.threatName,
                      scanEngine: threat.scanEngine,
                      details: threat.details,
                      filePath: threat.filePath,
                      fileSize: threat.fileSize
                    }
                  );

                  if (result.success) {
                    successCount++;
                    console.log(`✅ Quarantined: ${threat.fileName}`);
                  } else {
                    console.error(`❌ Error quarantining ${threat.fileName}: ${result.error}`);
                    errorCount++;
                  }

                } catch (error) {
                  console.error(`❌ Error quarantining ${threat.fileName}:`, error);
                  errorCount++;
                }
              }

              // Clear all threats from results
              setScanResult({
                ...scanResult,
                threatsDetected: []
              });

              // Show results
              if (errorCount === 0) {
                Alert.alert(
                  '✅ All Threats Quarantined!',
                  `Successfully quarantined all ${successCount} threat(s).\n\nYou can manage quarantined files in the Quarantine section.`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert(
                  '⚠️ Partial Success',
                  `Quarantined ${successCount} threat(s).\n\n${errorCount} file(s) could not be quarantined (may have been deleted or moved).`,
                  [{ text: 'OK' }]
                );
              }

            } catch (error) {
              console.error('❌ Error in bulk quarantine:', error);
              Alert.alert('❌ Error', `Failed to quarantine threats: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAllThreats = () => {
    if (!scanResult || scanResult.threatsDetected.length === 0) {
      return;
    }

    Alert.alert(
      '⚠️ Delete All Threats?',
      `Are you sure you want to permanently delete all ${scanResult.threatsDetected.length} threat(s)?\n\nThis action cannot be undone!`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log(`🗑️ Attempting to delete all ${scanResult.threatsDetected.length} threats`);
              
              // Import FileSystem dynamically
              let FileSystem: any = null;
              try {
                FileSystem = require('expo-file-system');
              } catch (error) {
                console.warn('⚠️ FileSystem not available:', error);
                Alert.alert('❌ Error', 'File system not available. Cannot delete files.');
                return;
              }

              let successCount = 0;
              let errorCount = 0;

              // Process each threat
              for (const threat of scanResult.threatsDetected) {
                try {
                  // Check if file exists
                  const fileInfo = await FileSystem.getInfoAsync(threat.filePath);
                  if (!fileInfo.exists) {
                    console.warn(`⚠️ File not found: ${threat.fileName}`);
                    errorCount++;
                    continue;
                  }

                  // Delete the file
                  await FileSystem.deleteAsync(threat.filePath, { idempotent: true });
                  successCount++;
                  console.log(`✅ Deleted: ${threat.fileName}`);
                  
                } catch (error) {
                  console.error(`❌ Error deleting ${threat.fileName}:`, error);
                  errorCount++;
                }
              }

              // Clear all threats from results
              setScanResult({
                ...scanResult,
                threatsDetected: []
              });

              // Show results
              if (errorCount === 0) {
                Alert.alert(
                  '✅ All Threats Deleted!', 
                  `Successfully deleted all ${successCount} threat(s).\n\nYour device is now clean!`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert(
                  '⚠️ Partial Success', 
                  `Deleted ${successCount} threat(s).\n\n${errorCount} file(s) could not be deleted (may have been already deleted or moved).`,
                  [{ text: 'OK' }]
                );
              }
              
            } catch (error) {
              console.error('❌ Error in bulk delete:', error);
              Alert.alert('❌ Error', `Failed to delete threats: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          },
        },
      ]
    );
  };

  const handleThreatAction = (action: ThreatActionType, threat: DeepScanThreat) => {
    switch (action) {
      case 'quarantine':
        handleQuarantineThreat(threat);
        break;
      case 'delete':
        handleDeleteThreat(threat);
        break;
      case 'view_details':
        setExpandedThreat(expandedThreat === threat.id ? null : threat.id);
        break;
      case 'ignore':
        // Remove threat from results
        if (scanResult) {
          const updatedThreats = scanResult.threatsDetected.filter(t => t.id !== threat.id);
          setScanResult({
            ...scanResult,
            threatsDetected: updatedThreats
          });
        }
        break;
      case 'scan_again':
        // Re-scan this specific file
        Alert.alert('Info', 'Re-scan feature coming soon');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleQuarantineThreat = (threat: DeepScanThreat) => {
    Alert.alert(
      '🔒 Quarantine Threat?',
      `Move this file to quarantine?\n\n${threat.fileName}\n\nThis will isolate the file in a secure location.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Quarantine',
          onPress: async () => {
            try {
              console.log('🔒 Attempting to quarantine threat file:', threat.fileName);

              const quarantineService = QuarantineService.getInstance();

              const result = await quarantineService.quarantineFile(
                threat.filePath,
                threat.fileName,
                {
                  isSafe: false,
                  threatName: threat.threatName,
                  scanEngine: threat.scanEngine,
                  details: threat.details,
                  filePath: threat.filePath,
                  fileSize: threat.fileSize
                }
              );

              if (result.success) {
                console.log('✅ Threat file quarantined successfully:', threat.fileName);
              
                // Remove from scan results (file is now quarantined)
                if (scanResult) {
                  const updatedThreats = scanResult.threatsDetected.filter(t => t.id !== threat.id);
                  setScanResult({
                    ...scanResult,
                    threatsDetected: updatedThreats
                  });
                }

                Alert.alert(
                  '✅ Quarantined', 
                  `Threat file "${threat.fileName}" has been moved to quarantine.\n\nYou can manage quarantined files in the Quarantine section.`,
                  [
                    { text: 'OK' },
                    { 
                      text: 'View Quarantine', 
                      onPress: () => {
                        // Navigate to quarantine screen if available
                        console.log('🔍 Navigate to quarantine screen');
                      }
                    }
                  ]
                );
              } else {
                Alert.alert('❌ Error', `Failed to quarantine file: ${result.error}`);
              }

            } catch (error) {
              console.error('❌ Error quarantining threat file:', error);
              Alert.alert('❌ Error', `Failed to quarantine file: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          },
        },
      ]
    );
  };

  // ==============================================================================
  // RENDER FUNCTIONS
  // ==============================================================================

  const renderScanOptions = () => {
    if (isScanning || scanResult) {
      return null;
    }

    return (
      <View style={styles.optionsContainer}>
        <Text style={styles.title}>🛡️ Device Security Scanner</Text>
        <Text style={styles.subtitle}>
          Scan your device for malware, suspicious APKs, and corrupted files
        </Text>

        {/* Development Mode Warning */}
        {__DEV__ && (
          <View style={styles.devWarningContainer}>
            <MaterialCommunityIcons name="information" size={20} color="#f59e0b" />
            <Text style={styles.devWarningText}>
              Development Mode: Scanning excludes cache files that get regenerated on app restart.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleStartQuickScan}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4facfe', '#00f2fe']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            <MaterialCommunityIcons name="shield-search" size={32} color="#fff" />
            <Text style={styles.buttonText}>Quick Scan</Text>
            <Text style={styles.buttonSubtext}>~2-5 minutes</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleStartFullScan}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#f093fb', '#f5576c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            <MaterialCommunityIcons name="shield-check" size={32} color="#fff" />
            <Text style={styles.buttonText}>Full Deep Scan</Text>
            <Text style={styles.buttonSubtext}>~5-15 minutes</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="information" size={24} color="#00d4ff" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>What We Scan:</Text>
            <Text style={styles.infoText}>✓ Malicious APK files</Text>
            <Text style={styles.infoText}>✓ Corrupted or suspicious files</Text>
            <Text style={styles.infoText}>✓ Potentially harmful applications</Text>
            <Text style={styles.infoText}>✓ Hidden malware in Downloads</Text>
            <Text style={styles.infoText}>✓ WhatsApp media threats</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderScanProgress = () => {
    if (!isScanning || !scanProgress) {
      return null;
    }

    return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <DeepScanProgressCard
          progress={scanProgress}
          onCancel={handleCancelScan}
        />
      </ScrollView>
    );
  };

  const renderScanResults = () => {
    if (!scanResult || isScanning) {
      return null;
    }

    return (
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Result Summary */}
        <DeepScanResultSummary
          result={scanResult}
          onViewThreat={(threat) => setExpandedThreat(expandedThreat === threat.id ? null : threat.id)}
          onExport={() => {
            Alert.alert('Export', 'Export feature coming soon');
          }}
        />

        {/* Statistics Card */}
        <DeepScanStatisticsCard result={scanResult} />

        {/* Threats List */}
        {scanResult.threatsDetected.length > 0 && (
          <View style={styles.threatsSection}>
            <Text style={styles.threatsTitle}>Detected Threats</Text>
            {scanResult.threatsDetected.map((threat) => (
              <DeepScanThreatCard
                key={threat.id}
                threat={threat}
                onAction={handleThreatAction}
                expanded={expandedThreat === threat.id}
              />
            ))}
            
            {/* Bulk Actions */}
            <View style={styles.bulkActionsContainer}>
              <Text style={styles.bulkActionsTitle}>Bulk Actions:</Text>
              <View style={styles.bulkActionsRow}>
                <TouchableOpacity
                  style={[styles.bulkActionButton, styles.quarantineAllButton]}
                  onPress={handleQuarantineAllThreats}
                >
                  <MaterialCommunityIcons name="shield-lock" size={20} color="#ffffff" />
                  <Text style={styles.bulkActionButtonText}>Quarantine All</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.bulkActionButton, styles.deleteAllButton]}
                  onPress={handleDeleteAllThreats}
                >
                  <MaterialCommunityIcons name="delete-sweep" size={20} color="#ffffff" />
                  <Text style={styles.bulkActionButtonText}>Delete All</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* New Scan Button */}
        <TouchableOpacity
          style={styles.newScanButton}
          onPress={() => {
            setScanResult(null);
            setScanProgress(null);
            setExpandedThreat(null);
          }}
        >
          <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
          <Text style={styles.newScanButtonText}>Start New Scan</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };


  // ==============================================================================
  // MAIN RENDER
  // ==============================================================================

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Deep Scan</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {showConfig ? (
          <DeepScanConfigPanel
            config={scanConfig}
            onChange={setScanConfig}
          />
        ) : (
          <>
            {renderScanOptions()}
            {renderScanProgress()}
            {renderScanResults()}
          </>
        )}
        
        {/* Config Toggle Button */}
        {!isScanning && !scanResult && (
          <TouchableOpacity
            style={styles.configButton}
            onPress={() => setShowConfig(!showConfig)}
          >
            <MaterialCommunityIcons
              name={showConfig ? 'close' : 'cog'}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        )}
      </LinearGradient>
    </View>
  );
};

// ==============================================================================
// STYLES
// ==============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 40 : 50,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerPlaceholder: {
    width: 40,
  },
  optionsContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 30,
  },
  scanButton: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradientButton: {
    padding: 24,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  buttonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  progressContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scannerIcon: {
    marginBottom: 30,
  },
  progressTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  progressMessage: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 30,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#00d4ff',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: 30,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  currentFile: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    width: '100%',
  },
  cancelButton: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: '#dc2626',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
    padding: 20,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  scanStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#334155',
  },
  scanStatItem: {
    alignItems: 'center',
  },
  scanStatLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
  },
  scanStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00d4ff',
  },
  scrollView: {
    flex: 1,
  },
  threatsSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  threatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    marginLeft: 16,
  },
  configButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  threatCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  threatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  threatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  threatName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  threatFileName: {
    fontSize: 12,
    color: '#94a3b8',
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  severityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  threatDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  threatDetailsText: {
    fontSize: 12,
    color: '#cbd5e1',
    marginBottom: 8,
  },
  threatDetailsLabel: {
    fontWeight: '600',
    color: '#fff',
  },
  threatActions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  threatActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  quarantineButton: {
    backgroundColor: '#f59e0b',
  },
  deleteButton: {
    backgroundColor: '#dc2626',
  },
  threatActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  newScanButton: {
    backgroundColor: '#00d4ff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  newScanButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Bulk Actions Styles
  bulkActionsContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bulkActionsTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  bulkActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bulkActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  quarantineAllButton: {
    backgroundColor: '#f59e0b',
  },
  deleteAllButton: {
    backgroundColor: '#dc2626',
  },
  bulkActionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Development Warning Styles
  devWarningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 10,
    gap: 8,
  },
  devWarningText: {
    color: '#f59e0b',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});

export default DeepScanScreen;

