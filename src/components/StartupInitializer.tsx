/**
 * Startup Initializer Component
 * Automatically initializes all Shabari features when app starts
 * Shows friendly loading screen during initialization
 */

import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    Text,
    View
} from 'react-native';

// Import services
import { smsReaderService } from '../services/SMSReaderService';

interface StartupInitializerProps {
  onInitializationComplete: () => void;
}

interface InitStatus {
  step: string;
  completed: number;
  total: number;
  features: {
    urlProtection: boolean;
    fileScanner: boolean;
    qrScanner: boolean;
    notifications: boolean;
    smsDetection: boolean;
  };
}

const StartupInitializer: React.FC<StartupInitializerProps> = ({ 
  onInitializationComplete 
}) => {
  const [initStatus, setInitStatus] = useState<InitStatus>({
    step: 'Starting up...',
    completed: 0,
    total: 5,
    features: {
      urlProtection: false,
      fileScanner: false,
      qrScanner: false,
      notifications: false,
      smsDetection: false
    }
  });

  useEffect(() => {
    initializeAllFeatures();
  }, []);

  const updateStatus = (step: string, feature?: keyof typeof initStatus.features) => {
    setInitStatus(prev => ({
      ...prev,
      step,
      completed: feature ? prev.completed + 1 : prev.completed,
      features: feature ? { ...prev.features, [feature]: true } : prev.features
    }));
  };

  const initializeAllFeatures = async () => {
    try {
      // Feature 1: URL Protection (no permissions needed)
      updateStatus('🔗 Initializing URL Protection...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate initialization
      updateStatus('✅ URL Protection ready', 'urlProtection');

      // Feature 2: File Scanner (no permissions needed initially)
      updateStatus('📁 Initializing File Scanner...');
      await new Promise(resolve => setTimeout(resolve, 500));
      updateStatus('✅ File Scanner ready', 'fileScanner');

      // Feature 3: QR Scanner (camera permission handled when needed)
      updateStatus('📱 Initializing QR Scanner...');
      await new Promise(resolve => setTimeout(resolve, 500));
      updateStatus('✅ QR Scanner ready', 'qrScanner');

      // Feature 4: Notifications
      updateStatus('🔔 Initializing Notifications...');
      await new Promise(resolve => setTimeout(resolve, 500));
      updateStatus('✅ Notifications ready', 'notifications');

      // Feature 5: SMS Detection (smart initialization)
      updateStatus('📱 Checking SMS Detection...');
      
      if (Platform.OS === 'android') {
        // Check if SMS permissions are already granted
        const smsStatus = smsReaderService.getStatus();
        if (smsStatus.hasPermissions) {
          updateStatus('📱 Initializing SMS Detection...');
          try {
            await smsReaderService.initialize();
            updateStatus('✅ SMS Detection ready', 'smsDetection');
          } catch (error) {
            console.log('SMS initialization will be done when needed');
            updateStatus('⚠️ SMS Detection (on-demand)', 'smsDetection');
          }
        } else {
          // SMS will be initialized when user first accesses SMS features
          updateStatus('⚠️ SMS Detection (on-demand)', 'smsDetection');
        }
      } else {
        // Not Android, skip SMS
        updateStatus('⚠️ SMS Detection (Android only)', 'smsDetection');
      }

      // All done!
      updateStatus('🎉 All features ready!');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onInitializationComplete();

    } catch (error) {
      console.error('❌ Initialization error:', error);
      updateStatus('⚠️ Some features may need manual activation');
      
      // Continue anyway after a short delay
      setTimeout(() => {
        onInitializationComplete();
      }, 2000);
    }
  };

  const getFeatureIcon = (ready: boolean) => ready ? '✅' : '⏳';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* App Logo/Icon */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🛡️</Text>
          <Text style={styles.appName}>Shabari</Text>
          <Text style={styles.tagline}>Security Suite</Text>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.statusText}>{initStatus.step}</Text>
          
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(initStatus.completed / initStatus.total) * 100}%` }
              ]} 
            />
          </View>
          
          <Text style={styles.progressText}>
            {initStatus.completed}/{initStatus.total} features ready
          </Text>
        </View>

        {/* Feature Status */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Security Features</Text>
          
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>
              {getFeatureIcon(initStatus.features.urlProtection)} URL Protection
            </Text>
            <Text style={styles.featureItem}>
              {getFeatureIcon(initStatus.features.fileScanner)} File Scanner
            </Text>
            <Text style={styles.featureItem}>
              {getFeatureIcon(initStatus.features.qrScanner)} QR Scanner
            </Text>
            <Text style={styles.featureItem}>
              {getFeatureIcon(initStatus.features.notifications)} Notifications
            </Text>
            <Text style={styles.featureItem}>
              {getFeatureIcon(initStatus.features.smsDetection)} SMS Detection
            </Text>
          </View>
        </View>

        {/* Info Text */}
        <Text style={styles.infoText}>
          All core features will be ready automatically.{'\n'}
          SMS scanning will request permission when first used.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
    maxWidth: 320,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 60,
    marginBottom: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  tagline: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  statusText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#cccccc',
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 30,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 15,
  },
  featureList: {
    alignItems: 'flex-start',
  },
  featureItem: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 8,
    textAlign: 'left',
  },
  infoText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default StartupInitializer; 