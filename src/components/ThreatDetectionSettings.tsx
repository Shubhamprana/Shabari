/**
 * Threat Detection Settings Component
 * Allows users to configure threat detection preferences
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    Slider,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface ThreatDetectionSettings {
  enablePhishTank: boolean;
  enableGoogleSafeBrowsing: boolean;
  enableAbuseIPDB: boolean;
  enableLocalDatabase: boolean;
  threatSensitivity: number; // 0-100
  autoBlockThreats: boolean;
  showThreatWarnings: boolean;
  maxApiCallsPerDay: number;
  customApiKeys: {
    googleSafeBrowsing: string;
    abuseIPDB: string;
  };
}

const DEFAULT_SETTINGS: ThreatDetectionSettings = {
  enablePhishTank: true,
  enableGoogleSafeBrowsing: true,
  enableAbuseIPDB: true,
  enableLocalDatabase: true,
  threatSensitivity: 75,
  autoBlockThreats: false,
  showThreatWarnings: true,
  maxApiCallsPerDay: 1000,
  customApiKeys: {
    googleSafeBrowsing: 'AIzaSyBwTzCistXG-8szpkdTQ5TaTcNzqs4Lumw',
    abuseIPDB: '6c1e3f349638d28fad0acf0304f2d7ab131af3085bed5e28ce75cf888f3d5e6dd97d153e87fabdde'
  }
};

export const ThreatDetectionSettings: React.FC = () => {
  const [settings, setSettings] = useState<ThreatDetectionSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [showApiKeys, setShowApiKeys] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('threatDetectionSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('❌ Error loading threat detection settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: ThreatDetectionSettings) => {
    try {
      await AsyncStorage.setItem('threatDetectionSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
      console.log('✅ Threat detection settings saved');
    } catch (error) {
      console.error('❌ Error saving threat detection settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const updateSetting = <K extends keyof ThreatDetectionSettings>(
    key: K,
    value: ThreatDetectionSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all threat detection settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => saveSettings(DEFAULT_SETTINGS)
        }
      ]
    );
  };

  const testApiConnection = async (apiType: 'google' | 'abuseipdb') => {
    try {
      // This would test the API connection
      Alert.alert(
        'API Test',
        `${apiType === 'google' ? 'Google Safe Browsing' : 'AbuseIPDB'} API connection test would be performed here.`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to test API connection');
    }
  };

  const getSensitivityLabel = (value: number) => {
    if (value >= 90) return 'Very High (90-100)';
    if (value >= 75) return 'High (75-89)';
    if (value >= 50) return 'Medium (50-74)';
    if (value >= 25) return 'Low (25-49)';
    return 'Very Low (0-24)';
  };

  const getSensitivityColor = (value: number) => {
    if (value >= 75) return '#F44336'; // Red
    if (value >= 50) return '#FF9800'; // Orange
    if (value >= 25) return '#FFC107'; // Yellow
    return '#4CAF50'; // Green
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🛡️ Threat Detection Settings</Text>
        <Text style={styles.subtitle}>Configure your security preferences</Text>
      </View>

      {/* Data Sources */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Data Sources</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>PhishTank Database</Text>
            <Text style={styles.settingDescription}>
              Local database with 51,440+ verified phishing URLs
            </Text>
          </View>
          <Switch
            value={settings.enablePhishTank}
            onValueChange={(value) => updateSetting('enablePhishTank', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.enablePhishTank ? '#2196F3' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Google Safe Browsing</Text>
            <Text style={styles.settingDescription}>
              Real-time malware and phishing detection
            </Text>
          </View>
          <Switch
            value={settings.enableGoogleSafeBrowsing}
            onValueChange={(value) => updateSetting('enableGoogleSafeBrowsing', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.enableGoogleSafeBrowsing ? '#2196F3' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>AbuseIPDB</Text>
            <Text style={styles.settingDescription}>
              IP reputation and abuse detection
            </Text>
          </View>
          <Switch
            value={settings.enableAbuseIPDB}
            onValueChange={(value) => updateSetting('enableAbuseIPDB', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.enableAbuseIPDB ? '#2196F3' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Local Database</Text>
            <Text style={styles.settingDescription}>
              User-reported threats and custom rules
            </Text>
          </View>
          <Switch
            value={settings.enableLocalDatabase}
            onValueChange={(value) => updateSetting('enableLocalDatabase', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.enableLocalDatabase ? '#2196F3' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Threat Sensitivity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Threat Sensitivity</Text>
        
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>
            Sensitivity: {getSensitivityLabel(settings.threatSensitivity)}
          </Text>
          <Text style={[styles.sliderValue, { color: getSensitivityColor(settings.threatSensitivity) }]}>
            {settings.threatSensitivity}%
          </Text>
        </View>
        
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          value={settings.threatSensitivity}
          onValueChange={(value) => updateSetting('threatSensitivity', Math.round(value))}
          minimumTrackTintColor="#2196F3"
          maximumTrackTintColor="#ddd"
          thumbStyle={styles.sliderThumb}
        />
        
        <Text style={styles.sliderDescription}>
          Higher sensitivity = more aggressive threat detection (may increase false positives)
        </Text>
      </View>

      {/* Protection Behavior */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔒 Protection Behavior</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto-Block Threats</Text>
            <Text style={styles.settingDescription}>
              Automatically block access to detected threats
            </Text>
          </View>
          <Switch
            value={settings.autoBlockThreats}
            onValueChange={(value) => updateSetting('autoBlockThreats', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.autoBlockThreats ? '#F44336' : '#f4f3f4'}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Show Threat Warnings</Text>
            <Text style={styles.settingDescription}>
              Display warnings for detected threats
            </Text>
          </View>
          <Switch
            value={settings.showThreatWarnings}
            onValueChange={(value) => updateSetting('showThreatWarnings', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.showThreatWarnings ? '#2196F3' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* API Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔑 API Configuration</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Daily API Limit</Text>
            <Text style={styles.settingDescription}>
              Maximum API calls per day to prevent quota exhaustion
            </Text>
          </View>
          <TextInput
            style={styles.numberInput}
            value={settings.maxApiCallsPerDay.toString()}
            onChangeText={(text) => {
              const value = parseInt(text) || 1000;
              updateSetting('maxApiCallsPerDay', Math.max(100, Math.min(10000, value)));
            }}
            keyboardType="numeric"
            placeholder="1000"
          />
        </View>

        <TouchableOpacity
          style={styles.apiKeysButton}
          onPress={() => setShowApiKeys(!showApiKeys)}
        >
          <Text style={styles.apiKeysButtonText}>
            {showApiKeys ? '🔽 Hide API Keys' : '🔑 Show API Keys'}
          </Text>
        </TouchableOpacity>

        {showApiKeys && (
          <View style={styles.apiKeysContainer}>
            <View style={styles.apiKeyItem}>
              <Text style={styles.apiKeyLabel}>Google Safe Browsing Key:</Text>
              <TextInput
                style={styles.apiKeyInput}
                value={settings.customApiKeys.googleSafeBrowsing}
                onChangeText={(text) => updateSetting('customApiKeys', {
                  ...settings.customApiKeys,
                  googleSafeBrowsing: text
                })}
                placeholder="Enter your Google Safe Browsing API key"
                secureTextEntry={true}
              />
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => testApiConnection('google')}
              >
                <Text style={styles.testButtonText}>Test</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.apiKeyItem}>
              <Text style={styles.apiKeyLabel}>AbuseIPDB Key:</Text>
              <TextInput
                style={styles.apiKeyInput}
                value={settings.customApiKeys.abuseIPDB}
                onChangeText={(text) => updateSetting('customApiKeys', {
                  ...settings.customApiKeys,
                  abuseIPDB: text
                })}
                placeholder="Enter your AbuseIPDB API key"
                secureTextEntry={true}
              />
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => testApiConnection('abuseipdb')}
              >
                <Text style={styles.testButtonText}>Test</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Actions</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={resetToDefaults}>
          <Text style={styles.actionButtonText}>🔄 Reset to Defaults</Text>
        </TouchableOpacity>
      </View>

      {/* Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Current Status</Text>
        
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Active Sources: {
              [settings.enablePhishTank, settings.enableGoogleSafeBrowsing, 
               settings.enableAbuseIPDB, settings.enableLocalDatabase]
                .filter(Boolean).length
            }/4
          </Text>
          <Text style={styles.statusText}>
            Sensitivity: {settings.threatSensitivity}%
          </Text>
          <Text style={styles.statusText}>
            Auto-Block: {settings.autoBlockThreats ? 'Enabled' : 'Disabled'}
          </Text>
          <Text style={styles.statusText}>
            Daily API Limit: {settings.maxApiCallsPerDay}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
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
  section: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
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
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 10,
  },
  sliderThumb: {
    backgroundColor: '#2196F3',
    width: 20,
    height: 20,
  },
  sliderDescription: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    width: 80,
    textAlign: 'center',
    fontSize: 16,
  },
  apiKeysButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  apiKeysButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  apiKeysContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  apiKeyItem: {
    marginBottom: 15,
  },
  apiKeyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  apiKeyInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  testButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#FF9800',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
});
