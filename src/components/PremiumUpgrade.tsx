import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { theme } from '../theme';

interface PremiumUpgradeProps {
  visible: boolean;
  onClose: () => void;
  featureRequested?: string;
}

export const PremiumUpgrade: React.FC<PremiumUpgradeProps> = ({
  visible,
  onClose,
  featureRequested
}) => {
  const { upgradeToPremium, isLoading } = useSubscriptionStore();

  const premiumFeatures = [
    {
      title: '🛡️ Automatic Protection',
      description: 'Real-time threat monitoring and protection',
      features: ['Watchdog File Protection', 'Privacy Guard', 'URL Auto-Scanning']
    },
    {
      title: '🤖 AI-Powered Analysis',
      description: 'Advanced machine learning fraud detection',
      features: ['OTP Insight Pro', 'ML Fraud Detection', '99.9% Accuracy']
    },
    {
      title: '⚡ Real-time Monitoring',
      description: 'Continuous background protection',
      features: ['Clipboard Monitoring', 'App Installation Alerts', 'SMS Auto-Analysis']
    },
    {
      title: '🎯 Advanced Features',
      description: 'Premium security tools',
      features: ['Bulk File Scanning', 'Advanced Reporting', 'Priority Support']
    }
  ];

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
          { text: 'Maybe Later', onPress: onClose }
        ]
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Upgrade to Premium</Text>
            <Text style={styles.headerSubtitle}>
              Unlock Advanced Security Features
            </Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {featureRequested && (
            <View style={styles.requestedFeature}>
              <Text style={styles.requestedFeatureTitle}>
                🔒 "{featureRequested}" requires Premium
              </Text>
              <Text style={styles.requestedFeatureText}>
                Upgrade now to access this advanced security feature and many more!
              </Text>
            </View>
          )}

          <View style={styles.currentPlan}>
            <Text style={styles.currentPlanTitle}>Current Plan: Free</Text>
            <Text style={styles.currentPlanSubtitle}>Manual security features only</Text>
          </View>

          <View style={styles.featuresContainer}>
            {premiumFeatures.map((category, index) => (
              <View key={index} style={styles.featureCategory}>
                <Text style={styles.featureCategoryTitle}>{category.title}</Text>
                <Text style={styles.featureCategoryDescription}>{category.description}</Text>
                {category.features.map((feature, featureIndex) => (
                  <View key={featureIndex} style={styles.featureItem}>
                    <Text style={styles.featureItemText}>✓ {feature}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          <View style={styles.comparison}>
            <Text style={styles.comparisonTitle}>Free vs Premium</Text>
            
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonFeature}>Manual URL Scanning</Text>
              <Text style={styles.comparisonFree}>✓</Text>
              <Text style={styles.comparisonPremium}>✓</Text>
            </View>
            
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonFeature}>Manual File Scanning</Text>
              <Text style={styles.comparisonFree}>✓</Text>
              <Text style={styles.comparisonPremium}>✓</Text>
            </View>
            
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonFeature}>Basic Message Analysis</Text>
              <Text style={styles.comparisonFree}>✓</Text>
              <Text style={styles.comparisonPremium}>✓</Text>
            </View>
            
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonFeature}>Automatic Protection</Text>
              <Text style={styles.comparisonFree}>✗</Text>
              <Text style={styles.comparisonPremium}>✓</Text>
            </View>
            
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonFeature}>AI-Powered Detection</Text>
              <Text style={styles.comparisonFree}>✗</Text>
              <Text style={styles.comparisonPremium}>✓</Text>
            </View>
            
            <View style={styles.comparisonRow}>
              <Text style={styles.comparisonFeature}>Real-time Monitoring</Text>
              <Text style={styles.comparisonFree}>✗</Text>
              <Text style={styles.comparisonPremium}>✓</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <LinearGradient
            colors={['#4c63d2', '#667eea']}
            style={styles.upgradeButton}
          >
            <Pressable
              style={styles.upgradeButtonInner}
              onPress={handleUpgrade}
              disabled={isLoading}
            >
              <Text style={styles.upgradeButtonText}>
                {isLoading ? 'Connecting...' : '💳 Subscribe to Premium - $9.99/month'}
              </Text>
            </Pressable>
          </LinearGradient>
          
          <Pressable style={styles.laterButton} onPress={onClose}>
            <Text style={styles.laterButtonText}>Maybe Later</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerContent: {
    position: 'relative',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
  },
  closeButton: {
    position: 'absolute',
    top: -10,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  requestedFeature: {
    backgroundColor: theme.colors.warning,
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  requestedFeatureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  requestedFeatureText: {
    fontSize: 14,
    color: 'white',
  },
  currentPlan: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  currentPlanTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6c757d',
  },
  currentPlanSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4,
  },
  featuresContainer: {
    marginVertical: 16,
  },
  featureCategory: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureCategoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  featureCategoryDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureItemText: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 8,
  },
  comparison: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  comparisonFeature: {
    flex: 1,
    fontSize: 14,
    color: '#495057',
  },
  comparisonFree: {
    width: 40,
    textAlign: 'center',
    fontSize: 16,
    color: '#6c757d',
  },
  comparisonPremium: {
    width: 40,
    textAlign: 'center',
    fontSize: 16,
    color: theme.colors.success,
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  upgradeButton: {
    borderRadius: 12,
    marginBottom: 12,
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
  laterButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  laterButtonText: {
    color: '#6c757d',
    fontSize: 14,
  },
}); 