/**
 * Threat Detection Screen
 * Main screen for testing and demonstrating threat detection functionality
 * Premium feature only
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { PremiumFeature } from '../components/PremiumFeature';
import { ThreatDetectionTest } from '../components/ThreatDetectionTest';
import { useSubscriptionStore } from '../stores/subscriptionStore';

export const ThreatDetectionScreen: React.FC = () => {
  const { isPremium, checkSubscriptionStatus } = useSubscriptionStore();

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <PremiumFeature 
          featureName="Threat Detection"
          description="Access advanced threat detection with real-time analysis, PhishTank database, Google Safe Browsing, and AbuseIPDB integration."
          features={[
            "Real-time URL threat analysis",
            "PhishTank phishing database",
            "Google Safe Browsing API",
            "AbuseIPDB IP reputation",
            "Custom threat detection settings",
            "Advanced filtering options"
          ]}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThreatDetectionTest />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
