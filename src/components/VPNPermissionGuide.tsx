/**
 * VPN Permission Guide Component
 * Provides user-friendly explanation for VPN permission requirement
 * and guides users through the setup process
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Alert,
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { proxyEngineService } from '../services/ProxyEngineService';

interface VPNPermissionGuideProps {
  visible: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
}

export const VPNPermissionGuide: React.FC<VPNPermissionGuideProps> = ({
  visible,
  onClose,
  onPermissionGranted
}) => {

  const handleEnableProtection = async () => {
    try {
      // Show detailed explanation before requesting permission
      Alert.alert(
        '🛡️ Enable Call Protection',
        'Shabari needs VPN permission to:\n\n' +
        '✅ Monitor incoming calls in real-time\n' +
        '✅ Check phone numbers against spam database\n' +
        '✅ Block fraudulent calls automatically\n' +
        '✅ Provide Truecaller-like protection\n\n' +
        '🔒 Your privacy is protected:\n' +
        '• No personal data is collected\n' +
        '• All processing happens locally\n' +
        '• No browsing data is monitored\n' +
        '• Only call protection is active',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Enable Protection',
            onPress: async () => {
              await requestVPNPermission();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in permission guide:', error);
    }
  };

  const requestVPNPermission = async () => {
    try {
       const result = await proxyEngineService.startProtection({
         blockAds: false,
         blockTrackers: false,
         blockMalware: true,
         blockPhishing: true,
         enableCallProtection: true,
         enableDnsOverHttps: true
       });

      if (result.success) {
        // Save auto-start preference
        await AsyncStorage.setItem('call_protection_auto_start', 'true');
        
        Alert.alert(
          '🎉 Protection Enabled!',
          'Call protection is now active. Shabari will monitor incoming calls and protect you from spam and fraud automatically.\n\n' +
          '💡 You can toggle this protection on/off from the main dashboard.',
          [
            {
              text: 'Great!',
              onPress: () => {
                onPermissionGranted?.();
                onClose();
              }
            }
          ]
        );
      } else {
        // Handle permission denial or error
        Alert.alert(
          'Permission Required',
          'VPN permission is required for call protection. ' + result.message,
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'android') {
                  Linking.openSettings();
                }
              }
            },
            {
              text: 'Try Again',
              onPress: requestVPNPermission
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting VPN permission:', error);
      Alert.alert(
        'Error',
        'An error occurred while setting up call protection. Please try again.'
      );
    }
  };

  const handleLearnMore = () => {
    Alert.alert(
      '🔍 How Call Protection Works',
      '1. 📞 When you receive a call, Shabari instantly checks the number\n\n' +
      '2. 🗃️ The number is compared against our spam/fraud database\n\n' +
      '3. ⚡ Within milliseconds, you get a notification if it\'s suspicious\n\n' +
      '4. 🛡️ You can choose to block, answer, or report the number\n\n' +
      '5. 🤝 Your reports help protect the entire community\n\n' +
      '🔒 Privacy Notes:\n' +
      '• Only phone numbers are checked\n' +
      '• No call content is accessed\n' +
      '• No internet browsing is monitored\n' +
      '• All data is encrypted and secure',
      [{ text: 'Got It!' }]
    );
  };

  const handleSkip = async () => {
    // Remember that user skipped this setup
    await AsyncStorage.setItem('vpn_permission_guide_shown', 'true');
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.modalGradient}
          >
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="shield-check" size={48} color="#FFFFFF" />
                </View>
                <Text style={styles.title}>Enable Call Protection</Text>
                <Text style={styles.subtitle}>
                  Get Truecaller-like protection against spam and fraud calls
                </Text>
              </View>

              {/* Features List */}
              <View style={styles.featuresContainer}>
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="phone-check" size={24} color="#FFFFFF" />
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>Real-time Call Screening</Text>
                    <Text style={styles.featureDescription}>
                      Instantly identify spam, fraud, and telemarketing calls
                    </Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="database-check" size={24} color="#FFFFFF" />
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>Community Database</Text>
                    <Text style={styles.featureDescription}>
                      Access to millions of reported spam numbers from users
                    </Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="shield-alert" size={24} color="#FFFFFF" />
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>Automatic Blocking</Text>
                    <Text style={styles.featureDescription}>
                      Block known fraudsters before they can reach you
                    </Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="account-group" size={24} color="#FFFFFF" />
                  <View style={styles.featureText}>
                    <Text style={styles.featureTitle}>Community Reporting</Text>
                    <Text style={styles.featureDescription}>
                      Report suspicious numbers to protect others
                    </Text>
                  </View>
                </View>
              </View>

              {/* Privacy Assurance */}
              <View style={styles.privacyContainer}>
                <MaterialCommunityIcons name="lock-check" size={20} color="#FFFFFF" />
                <Text style={styles.privacyText}>
                  🔒 Your privacy is our priority. Only call protection is active - 
                  no browsing data or personal information is collected.
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionContainer}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleEnableProtection}
                >
                  <LinearGradient
                    colors={['#FFFFFF', '#F8F9FA']}
                    style={styles.buttonGradient}
                  >
                    <MaterialCommunityIcons name="shield-check" size={20} color="#667eea" />
                    <Text style={styles.primaryButtonText}>Enable Protection</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.secondaryActions}>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleLearnMore}
                  >
                    <MaterialCommunityIcons name="information-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.secondaryButtonText}>Learn More</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleSkip}
                  >
                    <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
                    <Text style={styles.secondaryButtonText}>Skip for Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalGradient: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureText: {
    flex: 1,
    marginLeft: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginLeft: 8,
  },
  actionContainer: {
    marginBottom: 16,
  },
  primaryButton: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#667eea',
    marginLeft: 8,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 4,
  },
});
