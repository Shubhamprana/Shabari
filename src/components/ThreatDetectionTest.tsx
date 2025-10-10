/**
 * Threat Detection Test Component
 * Demonstrates the local threat detection service functionality
 */

import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { localThreatDetectionService, ThreatResult } from '../services/LocalThreatDetectionService';

interface TestResult {
  url: string;
  result: ThreatResult;
  timestamp: Date;
}

export const ThreatDetectionTest: React.FC = () => {
  const navigation = useNavigation();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cacheStats, setCacheStats] = useState({ phishTankEntries: 0, isInitialized: false });

  useEffect(() => {
    initializeService();
  }, []);

  const initializeService = async () => {
    try {
      setIsLoading(true);
      await localThreatDetectionService.initialize();
      setIsInitialized(true);
      setCacheStats(localThreatDetectionService.getCacheStats());
      console.log('✅ Threat detection service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize threat detection service:', error);
      Alert.alert('Error', 'Failed to initialize threat detection service');
    } finally {
      setIsLoading(false);
    }
  };

  const testURL = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a URL to test');
      return;
    }

    if (!isInitialized) {
      Alert.alert('Error', 'Threat detection service not initialized');
      return;
    }

    try {
      setIsLoading(true);
      const result = await localThreatDetectionService.checkURL(url);
      
      const testResult: TestResult = {
        url: url,
        result: result,
        timestamp: new Date()
      };

      setTestResults(prev => [testResult, ...prev.slice(0, 9)]); // Keep last 10 results
      setUrl('');
      
      // Show alert for threats
      if (result.isThreat) {
        Alert.alert(
          '🚨 THREAT DETECTED!',
          `URL: ${url}\nType: ${result.threatType}\nSource: ${result.source}\nConfidence: ${result.confidence}%\nSeverity: ${result.severity}/100\nDetails: ${result.details || 'No additional details'}`
        );
      } else {
        Alert.alert('✅ Safe', `URL: ${url}\nNo threats detected`);
      }

    } catch (error) {
      console.error('❌ Error testing URL:', error);
      Alert.alert('Error', 'Failed to test URL');
    } finally {
      setIsLoading(false);
    }
  };

  const testSampleURLs = async () => {
    const sampleURLs = [
      'https://sso--en--coinbasepro--cdn--m--auth.webflow.io/',
      'https://qat-102480.weeblysite.com/',
      'https://google.com',
      'https://facebook.com',
      'https://malicious-site.example.com'
    ];

    for (const testUrl of sampleURLs) {
      setUrl(testUrl);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between tests
      await testURL();
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getThreatColor = (result: ThreatResult) => {
    if (!result.isThreat) return '#4CAF50'; // Green
    if (result.severity >= 90) return '#F44336'; // Red
    if (result.severity >= 70) return '#FF9800'; // Orange
    return '#FFC107'; // Yellow
  };

  const getThreatIcon = (result: ThreatResult) => {
    if (!result.isThreat) return '✅';
    if (result.severity >= 90) return '🚨';
    if (result.severity >= 70) return '⚠️';
    return '🔶';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.title}>🛡️ Threat Detection Test</Text>
            <Text style={styles.subtitle}>Test URLs against PhishTank and API databases</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('ThreatDetectionSettings' as never)}
          >
            <Text style={styles.settingsButtonText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Service Status</Text>
        <Text style={[styles.statusText, { color: isInitialized ? '#4CAF50' : '#F44336' }]}>
          {isInitialized ? '✅ Initialized' : '❌ Not Initialized'}
        </Text>
        <Text style={styles.statusText}>
          PhishTank Entries: {cacheStats.phishTankEntries}
        </Text>
      </View>

      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>Enter URL to test:</Text>
        <TextInput
          style={styles.urlInput}
          value={url}
          onChangeText={setUrl}
          placeholder="https://example.com"
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={testURL}
            disabled={isLoading || !isInitialized}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>🔍 Test URL</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.sampleButton]}
            onPress={testSampleURLs}
            disabled={isLoading || !isInitialized}
          >
            <Text style={styles.buttonText}>🧪 Test Samples</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.proxyButton]}
            onPress={() => navigation.navigate('ProxyEngineTest' as never)}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>🔧 Test Proxy Engine</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.vpnButton]}
            onPress={() => navigation.navigate('VPNControl' as never)}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>🛡️ VPN Control</Text>
          </TouchableOpacity>
        </View>
      </View>

      {testResults.length > 0 && (
        <View style={styles.resultsCard}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Test Results</Text>
            <TouchableOpacity onPress={clearResults} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {testResults.map((testResult, index) => (
            <View key={index} style={styles.resultItem}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultIcon}>
                  {getThreatIcon(testResult.result)}
                </Text>
                <Text style={styles.resultUrl} numberOfLines={1}>
                  {testResult.url}
                </Text>
              </View>
              
              <View style={styles.resultDetails}>
                <Text style={styles.resultText}>
                  <Text style={styles.resultLabel}>Status: </Text>
                  <Text style={[styles.resultValue, { color: getThreatColor(testResult.result) }]}>
                    {testResult.result.isThreat ? 'THREAT' : 'SAFE'}
                  </Text>
                </Text>
                
                {testResult.result.isThreat && (
                  <>
                    <Text style={styles.resultText}>
                      <Text style={styles.resultLabel}>Type: </Text>
                      <Text style={styles.resultValue}>{testResult.result.threatType}</Text>
                    </Text>
                    <Text style={styles.resultText}>
                      <Text style={styles.resultLabel}>Source: </Text>
                      <Text style={styles.resultValue}>{testResult.result.source}</Text>
                    </Text>
                    <Text style={styles.resultText}>
                      <Text style={styles.resultLabel}>Confidence: </Text>
                      <Text style={styles.resultValue}>{testResult.result.confidence}%</Text>
                    </Text>
                    <Text style={styles.resultText}>
                      <Text style={styles.resultLabel}>Severity: </Text>
                      <Text style={styles.resultValue}>{testResult.result.severity}/100</Text>
                    </Text>
                    {testResult.result.details && (
                      <Text style={styles.resultText}>
                        <Text style={styles.resultLabel}>Details: </Text>
                        <Text style={styles.resultValue}>{testResult.result.details}</Text>
                      </Text>
                    )}
                  </>
                )}
                
                <Text style={styles.resultTimestamp}>
                  {testResult.timestamp.toLocaleTimeString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>ℹ️ How it works:</Text>
        <Text style={styles.infoText}>
          1. Checks local PhishTank database (51,440+ entries)
        </Text>
        <Text style={styles.infoText}>
          2. Queries Google Safe Browsing API
        </Text>
        <Text style={styles.infoText}>
          3. Checks local Supabase database
        </Text>
        <Text style={styles.infoText}>
          4. Returns threat assessment with confidence score
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
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
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
  settingsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 5,
  },
  inputCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  testButton: {
    backgroundColor: '#2196F3',
  },
  sampleButton: {
    backgroundColor: '#FF9800',
  },
  proxyButton: {
    backgroundColor: '#9C27B0',
  },
  vpnButton: {
    backgroundColor: '#FF5722',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultItem: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  resultUrl: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultDetails: {
    marginLeft: 30,
  },
  resultText: {
    fontSize: 12,
    marginBottom: 3,
  },
  resultLabel: {
    fontWeight: 'bold',
  },
  resultValue: {
    color: '#333',
  },
  resultTimestamp: {
    fontSize: 10,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
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
    marginBottom: 5,
    color: '#666',
  },
});
