/**
 * VPN Control Screen
 * Main screen for VPN and proxy control
 * Premium feature only
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { PremiumFeature } from '../components/PremiumFeature';
import { VPNControlPanel } from '../components/VPNControlPanel';
import { useSubscriptionStore } from '../stores/subscriptionStore';

export const VPNControlScreen: React.FC = () => {
  const { isPremium, checkSubscriptionStatus } = useSubscriptionStore();

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <PremiumFeature 
          featureName="VPN & Proxy Control"
          description="Take full control of your network security with advanced VPN and proxy protection features."
          features={[
            "Start/Stop VPN protection",
            "Block ads and trackers",
            "Block malware and phishing",
            "Call protection features",
            "DNS over HTTPS",
            "Real-time network monitoring",
            "Advanced proxy configuration"
          ]}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VPNControlPanel />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
