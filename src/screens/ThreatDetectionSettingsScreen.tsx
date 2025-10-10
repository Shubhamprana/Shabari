/**
 * Threat Detection Settings Screen
 * Main screen for configuring threat detection preferences
 * Premium feature only
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { PremiumFeature } from '../components/PremiumFeature';
import { ThreatDetectionSettings } from '../components/ThreatDetectionSettings';
import { useSubscriptionStore } from '../stores/subscriptionStore';

export const ThreatDetectionSettingsScreen: React.FC = () => {
  const { isPremium, checkSubscriptionStatus } = useSubscriptionStore();

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <PremiumFeature 
          featureName="Threat Detection Settings"
          description="Customize your threat detection preferences with advanced configuration options."
          features={[
            "Configure data sources",
            "Adjust threat sensitivity",
            "Set API limits",
            "Custom API keys",
            "Protection behavior settings",
            "Advanced filtering options"
          ]}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThreatDetectionSettings />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
