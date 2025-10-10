/**
 * Proxy Engine Test Screen
 * Main screen for testing VPN and proxy functionality
 * Premium feature only
 */

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { PremiumFeature } from '../components/PremiumFeature';
import { ProxyEngineTest } from '../components/ProxyEngineTest';
import { useSubscriptionStore } from '../stores/subscriptionStore';

export const ProxyEngineTestScreen = () => {
  const { isPremium, checkSubscriptionStatus } = useSubscriptionStore();

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  if (!isPremium) {
    return (
      <View style={styles.container}>
        <PremiumFeature 
          featureName="Proxy Engine Testing"
          description="Test and verify your VPN and proxy engine functionality with comprehensive testing tools."
          features={[
            "VPN connection testing",
            "Proxy engine diagnostics",
            "Threat detection testing",
            "Configuration testing",
            "Performance monitoring",
            "Real-time status checking"
          ]}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ProxyEngineTest />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
