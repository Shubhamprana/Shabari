/**
 * Proxy Engine Test Button Component
 * This component provides an easy way to test the proxy engine functionality
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProxyEngineTest } from '../utils/ProxyEngineTest';

interface ProxyEngineTestButtonProps {
  style?: any;
}

export const ProxyEngineTestButton: React.FC<ProxyEngineTestButtonProps> = ({ style }) => {
  
  const runBasicTest = async () => {
    await ProxyEngineTest.runBasicTest();
  };

  const runProtectionTest = async () => {
    await ProxyEngineTest.runProtectionTest();
  };

  const runPlatformTest = () => {
    ProxyEngineTest.runPlatformTest();
  };

  const runAllTests = async () => {
    await ProxyEngineTest.runAllTests();
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>🧪 Proxy Engine Tests</Text>
      <Text style={styles.subtitle}>Test the proxy engine functionality</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={runPlatformTest}>
          <Text style={styles.buttonText}>📱 Platform Test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={runBasicTest}>
          <Text style={styles.buttonText}>🔧 Basic Test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={runProtectionTest}>
          <Text style={styles.buttonText}>🛡️ Protection Test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={runAllTests}>
          <Text style={[styles.buttonText, styles.primaryButtonText]}>🚀 Run All Tests</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.note}>
        Note: VPN tests only work on Android devices with proper permissions
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 15,
  },
  buttonContainer: {
    gap: 10,
  },
  button: {
    backgroundColor: '#e5e7eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#1e3a8a',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  primaryButtonText: {
    color: '#ffffff',
  },
  note: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});
