import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import ReactNativeProxyEngine from 'react-native-proxy-engine';

const App = () => {
  const [proxyConfig, setProxyConfig] = useState({
    host: '127.0.0.1',
    port: '8080',
    type: 'HTTP',
  });
  const [proxyStatus, setProxyStatus] = useState(null);
  const [proxyStats, setProxyStats] = useState(null);
  const [testUrl, setTestUrl] = useState('https://httpbin.org/get');
  const [requestResult, setRequestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    updateProxyStatus();
    updateProxyStats();
  }, []);

  const updateProxyStatus = async () => {
    try {
      const result = await ReactNativeProxyEngine.getProxyStatus();
      if (result.success) {
        setProxyStatus(result.data);
      }
    } catch (error) {
      console.error('Error getting proxy status:', error);
    }
  };

  const updateProxyStats = async () => {
    try {
      const result = await ReactNativeProxyEngine.getProxyStats();
      if (result.success) {
        setProxyStats(result.data);
      }
    } catch (error) {
      console.error('Error getting proxy stats:', error);
    }
  };

  const startProxy = async () => {
    setIsLoading(true);
    try {
      const config = {
        ...proxyConfig,
        port: parseInt(proxyConfig.port, 10),
      };

      const result = await ReactNativeProxyEngine.startProxy(config);
      
      if (result.success) {
        Alert.alert('Success', result.message);
        updateProxyStatus();
        updateProxyStats();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to start proxy: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const stopProxy = async () => {
    setIsLoading(true);
    try {
      const result = await ReactNativeProxyEngine.stopProxy();
      
      if (result.success) {
        Alert.alert('Success', result.message);
        updateProxyStatus();
        updateProxyStats();
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to stop proxy: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const makeTestRequest = async () => {
    setIsLoading(true);
    try {
      const result = await ReactNativeProxyEngine.makeProxyRequest(testUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'ReactNativeProxyEngine/1.0.0',
        },
      });
      
      setRequestResult(result);
      updateProxyStats();
    } catch (error) {
      setRequestResult({
        success: false,
        message: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>React Native Proxy Engine Demo</Text>

        {/* Proxy Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Proxy Configuration</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Host:</Text>
            <TextInput
              style={styles.input}
              value={proxyConfig.host}
              onChangeText={(text) => setProxyConfig({ ...proxyConfig, host: text })}
              placeholder="127.0.0.1"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Port:</Text>
            <TextInput
              style={styles.input}
              value={proxyConfig.port}
              onChangeText={(text) => setProxyConfig({ ...proxyConfig, port: text })}
              placeholder="8080"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type:</Text>
            <View style={styles.typeButtons}>
              {['HTTP', 'HTTPS', 'SOCKS4', 'SOCKS5'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    proxyConfig.type === type && styles.typeButtonActive,
                  ]}
                  onPress={() => setProxyConfig({ ...proxyConfig, type })}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      proxyConfig.type === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.startButton]}
              onPress={startProxy}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Start Proxy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={stopProxy}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Stop Proxy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Proxy Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Proxy Status</Text>
          {proxyStatus ? (
            <View style={styles.statusContainer}>
              <Text style={styles.statusText}>
                Status: {proxyStatus.isRunning ? '🟢 Running' : '🔴 Stopped'}
              </Text>
              <Text style={styles.statusText}>
                Requests: {proxyStatus.requestCount || 0}
              </Text>
              <Text style={styles.statusText}>
                Bytes Transferred: {proxyStatus.bytesTransferred || 0}
              </Text>
            </View>
          ) : (
            <Text style={styles.statusText}>No status available</Text>
          )}
        </View>

        {/* Test Request */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Request</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>URL:</Text>
            <TextInput
              style={styles.input}
              value={testUrl}
              onChangeText={setTestUrl}
              placeholder="https://httpbin.org/get"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={makeTestRequest}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Make Test Request</Text>
          </TouchableOpacity>

          {requestResult && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Request Result:</Text>
              <Text style={styles.resultText}>
                {JSON.stringify(requestResult, null, 2)}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: 'white',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  testButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  resultContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
  },
});

export default App;

