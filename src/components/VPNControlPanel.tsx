/**
 * VPN Control Panel Component
 * Allows users to control and manage VPN/proxy functionality from their device
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { ProxyEngineConfig, proxyEngineService } from '../services/ProxyEngineService';

export const VPNControlPanel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProtectionRunning, setIsProtectionRunning] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<any>(null);
  const [currentConfig, setCurrentConfig] = useState<ProxyEngineConfig | null>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [autoStartEnabled, setAutoStartEnabled] = useState(false);

  useEffect(() => {
    initializeService();
    loadAutoStartPreference();
  }, []);

  const initializeService = async () => {
    try {
      setIsLoading(true);
      await proxyEngineService.initialize();
      setIsInitialized(true);
      
      // Get initial status and configuration
      await refreshStatus();
      await refreshConfiguration();
      
      console.log('✅ VPN Control Panel initialized');
    } catch (error) {
      console.error('❌ Failed to initialize VPN Control Panel:', error);
      Alert.alert('Error', 'Failed to initialize VPN service');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStatus = async () => {
    try {
      const status = await proxyEngineService.getStatus();
      setCurrentStatus(status);
      setIsProtectionRunning(status.isRunning);
      
      if (status.statistics) {
        setStatistics(status.statistics);
      }
    } catch (error) {
      console.error('❌ Failed to get status:', error);
    }
  };

  const refreshConfiguration = async () => {
    try {
      const config = await proxyEngineService.getConfiguration();
      setCurrentConfig(config);
    } catch (error) {
      console.error('❌ Failed to get configuration:', error);
    }
  };

  const loadAutoStartPreference = async () => {
    try {
      const autoStart = await AsyncStorage.getItem('call_protection_auto_start');
      setAutoStartEnabled(autoStart === 'true');
    } catch (error) {
      console.error('❌ Failed to load auto-start preference:', error);
    }
  };

  const toggleAutoStart = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem('call_protection_auto_start', enabled.toString());
      setAutoStartEnabled(enabled);
      
      Alert.alert(
        'Auto-Start Updated',
        enabled ? 
          'Call protection will start automatically when the app opens.' : 
          'Call protection will need to be started manually.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Failed to save auto-start preference:', error);
      Alert.alert('Error', 'Failed to save auto-start preference');
    }
  };

  const handleStartProtection = async () => {
    try {
      setIsLoading(true);
      const result = await proxyEngineService.startProtection();
      
      if (result.success) {
        setIsProtectionRunning(true);
        await refreshStatus();
        Alert.alert('Success', 'VPN protection started successfully!');
      } else {
        Alert.alert('Error', result.message || 'Failed to start VPN protection');
      }
    } catch (error) {
      console.error('❌ Start protection error:', error);
      Alert.alert('Error', 'Failed to start VPN protection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopProtection = async () => {
    try {
      setIsLoading(true);
      const result = await proxyEngineService.stopProtection();
      
      if (result.success) {
        setIsProtectionRunning(false);
        await refreshStatus();
        Alert.alert('Success', 'VPN protection stopped successfully!');
      } else {
        Alert.alert('Error', result.message || 'Failed to stop VPN protection');
      }
    } catch (error) {
      console.error('❌ Stop protection error:', error);
      Alert.alert('Error', 'Failed to stop VPN protection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigChange = async (key: keyof ProxyEngineConfig, value: boolean) => {
    if (!currentConfig) return;

    try {
      const newConfig = { ...currentConfig, [key]: value };
      const result = await proxyEngineService.configure(newConfig);
      
      if (result.success) {
        setCurrentConfig(newConfig);
        Alert.alert('Success', 'Configuration updated successfully!');
      } else {
        Alert.alert('Error', result.message || 'Failed to update configuration');
      }
    } catch (error) {
      console.error('❌ Configuration error:', error);
      Alert.alert('Error', 'Failed to update configuration');
    }
  };

  const getStatusColor = () => {
    if (!isInitialized) return '#F44336';
    if (isProtectionRunning) return '#4CAF50';
    return '#FF9800';
  };

  const getStatusText = () => {
    if (!isInitialized) return 'Not Initialized';
    if (isProtectionRunning) return 'Protection Active';
    return 'Protection Stopped';
  };

  const getStatusIcon = () => {
    if (!isInitialized) return '❌';
    if (isProtectionRunning) return '🟢';
    return '🔴';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛡️ VPN Control Panel</Text>
        <Text style={styles.subtitle}>Manage your VPN and proxy protection</Text>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Protection Status</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={refreshStatus}
            disabled={isLoading}
          >
            <Text style={styles.refreshButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text style={[styles.statusValue, { color: getStatusColor() }]}>
            {getStatusIcon()} {getStatusText()}
          </Text>
        </View>

        {currentStatus && (
          <>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Engine Status:</Text>
              <Text style={styles.statusValue}>{currentStatus.status}</Text>
            </View>
            
            {statistics && (
              <>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Threats Blocked:</Text>
                  <Text style={styles.statusValue}>{statistics.threatsBlocked || 0}</Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Data Transferred:</Text>
                  <Text style={styles.statusValue}>{statistics.dataTransferred || '0 B'}</Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Uptime:</Text>
                  <Text style={styles.statusValue}>{statistics.uptime || '0s'}</Text>
                </View>
              </>
            )}
          </>
        )}
      </View>

      {/* Control Buttons */}
      <View style={styles.controlCard}>
        <Text style={styles.controlTitle}>Protection Control</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              styles.startButton,
              (isLoading || isProtectionRunning) && styles.disabledButton
            ]}
            onPress={handleStartProtection}
            disabled={isLoading || isProtectionRunning}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.controlButtonText}>▶️ Start Protection</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              styles.stopButton,
              (isLoading || !isProtectionRunning) && styles.disabledButton
            ]}
            onPress={handleStopProtection}
            disabled={isLoading || !isProtectionRunning}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.controlButtonText}>⏹️ Stop Protection</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Configuration Settings */}
      {currentConfig && (
        <View style={styles.configCard}>
          <Text style={styles.configTitle}>Protection Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Block Ads</Text>
              <Text style={styles.settingDescription}>
                Block advertisements and tracking scripts
              </Text>
            </View>
            <Switch
              value={currentConfig.blockAds}
              onValueChange={(value) => handleConfigChange('blockAds', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={currentConfig.blockAds ? '#2196F3' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Block Trackers</Text>
              <Text style={styles.settingDescription}>
                Block tracking and analytics scripts
              </Text>
            </View>
            <Switch
              value={currentConfig.blockTrackers}
              onValueChange={(value) => handleConfigChange('blockTrackers', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={currentConfig.blockTrackers ? '#2196F3' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Block Malware</Text>
              <Text style={styles.settingDescription}>
                Block known malware and malicious content
              </Text>
            </View>
            <Switch
              value={currentConfig.blockMalware}
              onValueChange={(value) => handleConfigChange('blockMalware', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={currentConfig.blockMalware ? '#2196F3' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Block Phishing</Text>
              <Text style={styles.settingDescription}>
                Block phishing and scam websites
              </Text>
            </View>
            <Switch
              value={currentConfig.blockPhishing}
              onValueChange={(value) => handleConfigChange('blockPhishing', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={currentConfig.blockPhishing ? '#2196F3' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Call Protection</Text>
              <Text style={styles.settingDescription}>
                Protect against suspicious phone calls
              </Text>
            </View>
            <Switch
              value={currentConfig.enableCallProtection}
              onValueChange={(value) => handleConfigChange('enableCallProtection', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={currentConfig.enableCallProtection ? '#2196F3' : '#f4f3f4'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>DNS over HTTPS</Text>
              <Text style={styles.settingDescription}>
                Use encrypted DNS queries for better privacy
              </Text>
            </View>
            <Switch
              value={currentConfig.enableDnsOverHttps}
              onValueChange={(value) => handleConfigChange('enableDnsOverHttps', value)}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={currentConfig.enableDnsOverHttps ? '#2196F3' : '#f4f3f4'}
            />
          </View>
        </View>
      )}

      {/* Auto-Start Settings */}
      <View style={styles.configCard}>
        <Text style={styles.configTitle}>Startup Settings</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto-Start Protection</Text>
            <Text style={styles.settingDescription}>
              Automatically start call protection when app opens
            </Text>
          </View>
          <Switch
            value={autoStartEnabled}
            onValueChange={toggleAutoStart}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={autoStartEnabled ? '#2196F3' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsCard}>
        <Text style={styles.actionsTitle}>Quick Actions</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={refreshStatus}
            disabled={isLoading}
          >
            <Text style={styles.actionButtonText}>📊 Refresh Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={refreshConfiguration}
            disabled={isLoading}
          >
            <Text style={styles.actionButtonText}>⚙️ Refresh Config</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Information */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>ℹ️ How to Use:</Text>
        <Text style={styles.infoText}>
          • Tap "Start Protection" to activate VPN and proxy protection
        </Text>
        <Text style={styles.infoText}>
          • Configure protection settings using the toggles above
        </Text>
        <Text style={styles.infoText}>
          • Monitor protection status and statistics in real-time
        </Text>
        <Text style={styles.infoText}>
          • Tap "Stop Protection" to disable VPN and proxy
        </Text>
        <Text style={styles.infoText}>
          • Settings are applied immediately when changed
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#E3F2FD',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
  },
  refreshButtonText: {
    fontSize: 18,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  controlCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  controlTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  controlButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  configCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  configTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  actionsCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  actionButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});
