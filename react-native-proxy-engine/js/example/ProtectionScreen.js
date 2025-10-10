import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import shabariVpn, { EVENTS } from '../shabari-vpn';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Production-ready Protection Screen for Shabari VPN
 */
const ProtectionScreen = () => {
  // State management
  const [isProtectionEnabled, setIsProtectionEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [formattedStats, setFormattedStats] = useState(null);
  const [config, setConfig] = useState({
    blockAds: true,
    blockTrackers: true,
    blockMalware: true,
    blockPhishing: true,
    enableCallProtection: true,
    enableDnsOverHttps: false,
  });
  
  const [recentBlocks, setRecentBlocks] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState('');
  const [reportType, setReportType] = useState('domain');
  const [reportDetails, setReportDetails] = useState('');
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  
  // Event listeners refs
  const listenersRef = useRef([]);

  // Initialize VPN engine on mount
  useEffect(() => {
    initializeVpn();
    setupEventListeners();
    
    return () => {
      // Cleanup listeners
      listenersRef.current.forEach(listener => listener.remove());
      shabariVpn.removeAllListeners();
    };
  }, []);

  // Pulse animation for protection status
  useEffect(() => {
    if (isProtectionEnabled) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      
      return () => pulseAnimation.stop();
    }
  }, [isProtectionEnabled, pulseAnim]);

  const initializeVpn = async () => {
    try {
      setIsLoading(true);
      
      const result = await shabariVpn.initialize();
      console.log('VPN initialized:', result);
      
      // Load current status
      const status = await shabariVpn.getStatus();
      setIsProtectionEnabled(status.isRunning);
      
      if (status.statistics) {
        setStatistics(status.statistics);
        setFormattedStats(shabariVpn.formatStatistics(status.statistics));
      }
      
      // Load configuration
      const currentConfig = await shabariVpn.getConfiguration();
      setConfig(currentConfig);
      
    } catch (error) {
      console.error('Failed to initialize VPN:', error);
      Alert.alert('Initialization Error', 'Failed to initialize protection engine. Please restart the app.');
    } finally {
      setIsLoading(false);
    }
  };

  const setupEventListeners = () => {
    // Status changed event
    const statusListener = shabariVpn.on('STATUS_CHANGED', (event) => {
      console.log('Status changed:', event);
      setIsProtectionEnabled(event.status === 'running');
      if (event.statistics) {
        setStatistics(event.statistics);
        setFormattedStats(shabariVpn.formatStatistics(event.statistics));
      }
    });

    // Blocked event
    const blockedListener = shabariVpn.on('BLOCKED', (event) => {
      console.log('Threat blocked:', event);
      
      // Add to recent blocks
      setRecentBlocks(prev => [{
        target: event.target,
        reason: event.reason,
        timestamp: new Date(event.timestamp),
      }, ...prev.slice(0, 9)]);
      
      // Show notification
      showBlockNotification(event.target, event.reason);
    });

    // Warning event
    const warningListener = shabariVpn.on('WARNING', (event) => {
      console.log('Warning:', event);
      Alert.alert(
        'Security Warning',
        `Suspicious activity detected: ${event.target}\n\n${event.message}`,
        [{ text: 'OK' }]
      );
    });

    // Call blocked event
    const callBlockedListener = shabariVpn.on('CALL_BLOCKED', (event) => {
      console.log('Call blocked:', event);
      Alert.alert(
        'Fraud Call Blocked',
        `Blocked suspicious call from ${shabariVpn.formatPhoneNumber(event.phoneNumber)}`,
        [{ text: 'OK' }]
      );
    });

    // Error event
    const errorListener = shabariVpn.on('ERROR', (event) => {
      console.error('VPN Error:', event);
      Alert.alert('Protection Error', event.error || 'An error occurred');
    });

    listenersRef.current = [
      statusListener,
      blockedListener,
      warningListener,
      callBlockedListener,
      errorListener,
    ];
  };

  const toggleProtection = async () => {
    try {
      setIsLoading(true);
      
      if (isProtectionEnabled) {
        // Stop protection
        await shabariVpn.stopProtection();
        setIsProtectionEnabled(false);
        
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }).start();
        
      } else {
        // Start protection
        await shabariVpn.startProtection();
        setIsProtectionEnabled(true);
        
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
      
      // Refresh statistics
      await refreshStatistics();
      
    } catch (error) {
      console.error('Failed to toggle protection:', error);
      
      const errorMessage = error.code === 'VPN_PERMISSION_DENIED'
        ? 'VPN permission denied. Please grant permission to enable protection.'
        : `Failed to ${isProtectionEnabled ? 'stop' : 'start'} protection. Please try again.`;
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStatistics = async () => {
    try {
      setIsRefreshing(true);
      
      const stats = await shabariVpn.getStatistics();
      setStatistics(stats);
      setFormattedStats(shabariVpn.formatStatistics(stats));
      
      // Update filters
      await shabariVpn.updateFilters();
      
    } catch (error) {
      console.error('Failed to refresh statistics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const updateConfiguration = async (key, value) => {
    try {
      const newConfig = { ...config, [key]: value };
      setConfig(newConfig);
      
      await shabariVpn.configure(newConfig);
      
    } catch (error) {
      console.error('Failed to update configuration:', error);
      Alert.alert('Configuration Error', 'Failed to update settings. Please try again.');
      
      // Revert the change
      setConfig(prev => ({ ...prev, [key]: !value }));
    }
  };

  const submitReport = async () => {
    if (!reportTarget.trim()) {
      Alert.alert('Invalid Report', 'Please enter a target to report.');
      return;
    }

    try {
      setIsLoading(true);
      
      await shabariVpn.report(reportTarget, reportType, reportDetails);
      
      Alert.alert('Report Submitted', 'Thank you for helping improve our protection database.');
      
      // Reset form
      setShowReportModal(false);
      setReportTarget('');
      setReportDetails('');
      
    } catch (error) {
      console.error('Failed to submit report:', error);
      Alert.alert('Report Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const showBlockNotification = (target, reason) => {
    // Animate notification slide
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const clearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached protection data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await shabariVpn.clearCache();
              Alert.alert('Success', 'Cache cleared successfully.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear cache.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refreshStatistics}
          tintColor="#007AFF"
        />
      }
    >
      {/* Notification Bar */}
      <Animated.View
        style={[
          styles.notificationBar,
          { transform: [{ translateY: slideAnim }] }
        ]}
      >
        <Text style={styles.notificationText}>Threat Blocked!</Text>
      </Animated.View>

      {/* Protection Status */}
      <View style={styles.statusContainer}>
        <Animated.View
          style={[
            styles.statusCircle,
            isProtectionEnabled && styles.statusCircleActive,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="#FFF" />
          ) : (
            <TouchableOpacity onPress={toggleProtection} disabled={isLoading}>
              <Text style={styles.statusIcon}>
                {isProtectionEnabled ? '🛡️' : '⚠️'}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>
        
        <Text style={styles.statusText}>
          Protection {isProtectionEnabled ? 'Active' : 'Inactive'}
        </Text>
        
        <TouchableOpacity
          style={[
            styles.toggleButton,
            isProtectionEnabled && styles.toggleButtonActive
          ]}
          onPress={toggleProtection}
          disabled={isLoading}
        >
          <Text style={styles.toggleButtonText}>
            {isProtectionEnabled ? 'Stop Protection' : 'Start Protection'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Statistics */}
      {formattedStats && (
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Protection Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formattedStats.threatsBlocked}</Text>
              <Text style={styles.statLabel}>Threats Blocked</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formattedStats.threatsWarned}</Text>
              <Text style={styles.statLabel}>Warnings</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formattedStats.dataTransferred}</Text>
              <Text style={styles.statLabel}>Data Filtered</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formattedStats.uptime}</Text>
              <Text style={styles.statLabel}>Uptime</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formattedStats.dnsQueries}</Text>
              <Text style={styles.statLabel}>DNS Queries</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formattedStats.cacheHitRate}</Text>
              <Text style={styles.statLabel}>Cache Hit Rate</Text>
            </View>
          </View>
        </View>
      )}

      {/* Protection Settings */}
      <View style={styles.settingsContainer}>
        <Text style={styles.sectionTitle}>Protection Settings</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Block Ads</Text>
          <Switch
            value={config.blockAds}
            onValueChange={(value) => updateConfiguration('blockAds', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={config.blockAds ? '#007AFF' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Block Trackers</Text>
          <Switch
            value={config.blockTrackers}
            onValueChange={(value) => updateConfiguration('blockTrackers', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={config.blockTrackers ? '#007AFF' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Block Malware</Text>
          <Switch
            value={config.blockMalware}
            onValueChange={(value) => updateConfiguration('blockMalware', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={config.blockMalware ? '#007AFF' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Block Phishing</Text>
          <Switch
            value={config.blockPhishing}
            onValueChange={(value) => updateConfiguration('blockPhishing', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={config.blockPhishing ? '#007AFF' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Call Protection</Text>
          <Switch
            value={config.enableCallProtection}
            onValueChange={(value) => updateConfiguration('enableCallProtection', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={config.enableCallProtection ? '#007AFF' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>DNS over HTTPS</Text>
          <Switch
            value={config.enableDnsOverHttps}
            onValueChange={(value) => updateConfiguration('enableDnsOverHttps', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={config.enableDnsOverHttps ? '#007AFF' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Recent Blocks */}
      {recentBlocks.length > 0 && (
        <View style={styles.recentBlocksContainer}>
          <Text style={styles.sectionTitle}>Recent Blocks</Text>
          
          {recentBlocks.map((block, index) => (
            <View key={index} style={styles.blockItem}>
              <Text style={styles.blockTarget} numberOfLines={1}>
                {block.target}
              </Text>
              <Text style={styles.blockReason}>{block.reason}</Text>
              <Text style={styles.blockTime}>
                {block.timestamp.toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowReportModal(true)}
        >
          <Text style={styles.actionButtonText}>Report Threat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={clearCache}
        >
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
            Clear Cache
          </Text>
        </TouchableOpacity>
      </View>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report Threat</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Enter domain, IP, or phone number"
              value={reportTarget}
              onChangeText={setReportTarget}
              autoCapitalize="none"
            />
            
            <View style={styles.reportTypeContainer}>
              {['domain', 'ip', 'phone'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.reportTypeButton,
                    reportType === type && styles.reportTypeButtonActive
                  ]}
                  onPress={() => setReportType(type)}
                >
                  <Text
                    style={[
                      styles.reportTypeText,
                      reportType === type && styles.reportTypeTextActive
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Additional details (optional)"
              value={reportDetails}
              onChangeText={setReportDetails}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowReportModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={submitReport}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    paddingBottom: 30,
  },
  notificationBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    padding: 15,
    zIndex: 1000,
  },
  notificationText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  statusContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFF',
  },
  statusCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusCircleActive: {
    backgroundColor: '#4CAF50',
  },
  statusIcon: {
    fontSize: 50,
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  toggleButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#007AFF',
  },
  toggleButtonActive: {
    backgroundColor: '#FF3B30',
  },
  toggleButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    backgroundColor: '#FFF',
    marginTop: 20,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    backgroundColor: '#F8F8F8',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  settingsContainer: {
    backgroundColor: '#FFF',
    marginTop: 20,
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLabel: {
    fontSize: 16,
  },
  recentBlocksContainer: {
    backgroundColor: '#FFF',
    marginTop: 20,
    padding: 20,
  },
  blockItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  blockTarget: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  blockReason: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  blockTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  secondaryButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  actionButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 20,
    width: SCREEN_WIDTH - 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  reportTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  reportTypeButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  reportTypeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  reportTypeText: {
    textAlign: 'center',
    color: '#666',
  },
  reportTypeTextActive: {
    color: '#FFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    textAlign: 'center',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    textAlign: 'center',
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default ProtectionScreen;
