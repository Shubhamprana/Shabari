import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { theme } from '../theme';
import { PremiumUpgrade } from './PremiumUpgrade';

interface PremiumFeatureProps {
  featureName: string;
  description: string;
  features: string[];
}

export const PremiumFeature: React.FC<PremiumFeatureProps> = ({
  featureName,
  description,
  features
}) => {
  const { upgradeToPremium, isLoading } = useSubscriptionStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleUpgrade = async () => {
    try {
      await upgradeToPremium();
    } catch (error: any) {
      Alert.alert(
        '💳 Payment System Required',
        'Premium subscriptions require integration with a payment system (Google Play, App Store, or Stripe). Contact support for subscription options.',
        [
          { text: 'Contact Support', onPress: () => {
            Alert.alert(
              '📧 Support Contact',
              'Email: support@shabari.app\nOr visit our website for subscription options.',
              [{ text: 'OK' }]
            );
          }},
          { text: 'Maybe Later', onPress: () => setShowUpgradeModal(false) }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>🔒 Premium Feature</Text>
            <Text style={styles.headerSubtitle}>
              {featureName} requires Premium
            </Text>
          </View>
        </LinearGradient>

        {/* Feature Description */}
        <View style={styles.featureDescription}>
          <Text style={styles.featureDescriptionText}>
            {description}
          </Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What you'll get:</Text>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureIcon}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Premium Benefits */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Premium Benefits</Text>
          
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🛡️</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Automatic Protection</Text>
              <Text style={styles.benefitDescription}>Real-time threat monitoring and protection</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🤖</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>AI-Powered Analysis</Text>
              <Text style={styles.benefitDescription}>Advanced machine learning fraud detection</Text>
            </View>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⚡</Text>
            <View style={styles.benefitContent}>
              <Text style={styles.benefitTitle}>Real-time Monitoring</Text>
              <Text style={styles.benefitDescription}>Continuous background protection</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Upgrade Button */}
      <View style={styles.footer}>
        <LinearGradient
          colors={['#4c63d2', '#667eea']}
          style={styles.upgradeButton}
        >
          <Pressable
            style={styles.upgradeButtonInner}
            onPress={() => setShowUpgradeModal(true)}
            disabled={isLoading}
          >
            <Text style={styles.upgradeButtonText}>
              {isLoading ? 'Connecting...' : '💳 Upgrade to Premium - $9.99/month'}
            </Text>
          </Pressable>
        </LinearGradient>
      </View>

      {/* Upgrade Modal */}
      <PremiumUpgrade
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureRequested={featureName}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  header: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  featureDescription: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureDescriptionText: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
    textAlign: 'center',
  },
  featuresContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 16,
    color: theme.colors.success,
    marginRight: 12,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
  },
  benefitsContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#6c757d',
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  upgradeButton: {
    borderRadius: 12,
  },
  upgradeButtonInner: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
