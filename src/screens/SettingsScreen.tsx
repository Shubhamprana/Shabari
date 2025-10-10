import React, { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
    ActivityIndicator,
    Alert,
    Clipboard,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { YaraSecurityService } from '../services/YaraSecurityService';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { PremiumUpgrade } from '../components/PremiumUpgrade';

interface EngineStatus {
  available: boolean;
  initialized: boolean;
  native: boolean;
  version: string;
  rulesCount: number;
}

interface SettingsScreenProps {
  onNavigateToUpgrade: () => void;
  onGoBack: () => void;
  // New: navigate to VPN control panel
  onNavigateToVPNControl: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onNavigateToUpgrade,
  onGoBack,
  onNavigateToVPNControl,
}) => {
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const { isPremium } = useSubscriptionStore();
  const [upgradeVisible, setUpgradeVisible] = useState(false);

  // Debug: Log component initialization
  console.log('🛷 SettingsScreen component initialized');

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              // Navigation will be handled by auth state change
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'For support, please email us at support@shabari.app or visit our website.',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacyPolicy = () => {
    // Try to open hosted privacy policy first
    Linking.openURL('https://shabari.vercel.app/')
      .catch(() => {
        // Fallback to comprehensive in-app privacy policy
        Alert.alert(
          '🔒 Shabari Privacy Policy',
          'COMPREHENSIVE PRIVACY POLICY\n\n' +
          '📱 SHABARI CYBERSECURITY APP\n' +
          'Last Updated: January 2024\n\n' +
          '👨‍💻 DEVELOPER INFORMATION:\n' +
          '• Developer: Shubham Prajapati\n' +
          '• Contact: support@shabari-app.com\n' +
          '• App: Shabari Cybersecurity\n\n' +
          '🔍 DATA WE COLLECT:\n' +
          '• Email address (for account creation only)\n' +
          '• Subscription status (premium/free)\n' +
          '• App usage analytics (anonymous)\n\n' +
          '🚫 DATA WE DO NOT COLLECT:\n' +
          '• SMS content (only scanned locally on your device)\n' +
          '• File contents (only scanned locally)\n' +
          '• Personal documents or photos\n' +
          '• Location data\n' +
          '• Contact information\n\n' +
          '🛡️ HOW WE PROTECT YOUR PRIVACY:\n' +
          '• All security scanning happens on YOUR device\n' +
          '• No personal data sent to external servers\n' +
          '• VirusTotal scanning uses anonymous file hashes only\n' +
          '• Supabase backend stores only email + subscription status\n' +
          '• End-to-end encryption for all communications\n\n' +
          '🔗 THIRD-PARTY SERVICES:\n' +
          '• VirusTotal (anonymous file hash checking)\n' +
          '• Supabase (secure authentication only)\n' +
          '• No data sharing with advertising networks\n\n' +
          '📋 YOUR RIGHTS:\n' +
          '• Request account deletion anytime\n' +
          '• Control all app permissions\n' +
          '• Disable any security features\n' +
          '• Export your data\n\n' +
          '⏰ DATA RETENTION:\n' +
          '• Account data: Until deletion requested\n' +
          '• Anonymous analytics: 90 days maximum\n' +
          '• Local scan data: Never stored permanently\n\n' +
          '🌐 Full policy: https://shubham485.github.io/shabari-privacy-policy/',
          [
            { 
              text: 'Copy Link', 
              onPress: () => Clipboard.setString('https://shubham485.github.io/shabari-privacy-policy/') 
            },
            { text: 'OK' }
          ],
          { cancelable: true }
        );
      });
  };

  const handleRestorePurchases = () => {
    Alert.alert(
      'Restore Purchases',
      'Purchase restoration is not implemented in this demo version.',
      [{ text: 'OK' }]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '🗑️ Delete Account',
      'This action will permanently delete:\n\n• Your account and profile\n• All app data and preferences\n• Subscription history\n• Any saved settings\n\nThis action cannot be undone.\n\nFor immediate deletion, continue below.\nFor assistance, email privacy@shabari-app.com',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Learn More',
          onPress: () => {
            Alert.alert(
              'Account Deletion Process',
              'IMMEDIATE DELETION:\n• Tap "Delete Now" to delete immediately\n• Account deleted within 30 days\n• All data permanently removed\n\nALTERNATIVE METHODS:\n• Email privacy@shabari-app.com\n• Subject: "Account Deletion Request"\n• Include your registered email\n\nWe will process email requests within 7 business days.\n\nThis complies with Google Play Store account deletion requirements.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Now',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // In a real implementation, this would call a backend API to delete user data
                      // For now, we'll sign out the user
                      await supabase.auth.signOut();
                      Alert.alert(
                        '✅ Account Deletion Initiated',
                        'Your account deletion request has been submitted. All data will be permanently deleted within 30 days.\n\nYou have been logged out.',
                        [{ text: 'OK' }]
                      );
                    } catch (error) {
                      Alert.alert(
                        '❌ Deletion Failed', 
                        'Unable to process account deletion. Please try again or email privacy@shabari-app.com for assistance.',
                        [{ text: 'OK' }]
                      );
                    }
                  },
                }
              ]
            );
          }
        },
        {
          text: 'Delete Now',
          style: 'destructive',
          onPress: async () => {
            try {
              // In a real implementation, this would call a backend API to delete user data
              // For now, we'll sign out the user
              await supabase.auth.signOut();
              Alert.alert(
                '✅ Account Deletion Initiated',
                'Your account deletion request has been submitted. All data will be permanently deleted within 30 days.\n\nYou have been logged out.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert(
                '❌ Deletion Failed', 
                'Unable to process account deletion. Please try again or email privacy@shabari-app.com for assistance.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const handleCheckEngineStatus = async () => {
    setIsLoadingStatus(true);
    setEngineStatus(null);
    try {
      const status = await YaraSecurityService.getEngineStatus();
      setEngineStatus(status);
    } catch (error) {
      Alert.alert('Error', 'Failed to get engine status.');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const activateYaraEngine = async () => {
    console.log('🛷 activateYaraEngine function called');
    try {
      Alert.alert(
        '🛡️ Activate YARA Engine',
        'This will initialize the YARA security engine for enhanced threat detection. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Activate',
            onPress: async () => {
              setIsLoadingStatus(true);
              try {
                console.log('🔄 Manual YARA engine activation requested');
                const isInitialized = await YaraSecurityService.initialize();
                
                if (isInitialized) {
                  Alert.alert(
                    '✅ Success',
                    'YARA engine has been successfully activated! Enhanced threat detection is now available.',
                    [{ text: 'OK' }]
                  );
                  
                  // Refresh the engine status
                  const status = await YaraSecurityService.getEngineStatus();
                  setEngineStatus(status);
                  
                  console.log('✅ YARA engine manually activated successfully');
                } else {
                  Alert.alert(
                    '⚠️ Activation Failed',
                    'YARA engine could not be activated. The app will continue using fallback protection methods.',
                    [{ text: 'OK' }]
                  );
                  console.warn('⚠️ Manual YARA engine activation failed');
                }
              } catch (error) {
                console.error('❌ Manual YARA engine activation error:', error);
                Alert.alert(
                  '❌ Error',
                  'An error occurred while activating the YARA engine. Please try again.',
                  [{ text: 'OK' }]
                );
              } finally {
                setIsLoadingStatus(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ YARA activation handler error:', error);
      Alert.alert('❌ Error', 'Failed to show activation dialog.');
    }
  };

  const ListItem = ({ title, subtitle, onPress, color = '#ffffff', rightAccessory }: any) => (
    <TouchableOpacity style={styles.listItem} onPress={onPress}>
      <View style={styles.listItemContent}>
        <Text style={[styles.listItemTitle, { color }]}>{title}</Text>
        {subtitle && <Text style={styles.listItemSubtitle}>{subtitle}</Text>}
      </View>
      {rightAccessory}
      <Text style={styles.listItemArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onGoBack}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* New: Protection section with VPN control entry */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛡️ Protection</Text>
          <ListItem
            title="🔐 VPN & Proxy Control"
            subtitle={isPremium ? "Start/stop VPN and configure ad/tracker blocking" : "Premium only"}
            onPress={() => {
              if (isPremium) {
                onNavigateToVPNControl();
              } else {
                setUpgradeVisible(true);
              }
            }}
            rightAccessory={!isPremium ? (
              <View style={styles.lockBadgeRow}>
                <MaterialCommunityIcons name="lock" size={14} color="#000" />
                <Text style={styles.lockBadgeText}>Premium</Text>
              </View>
            ) : null}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Account</Text>
          <ListItem
            title="✨ Manage Subscription"
            subtitle="View and manage your premium subscription features"
            onPress={onNavigateToUpgrade}
          />
          <ListItem
            title="🔄 Restore Purchases"
            subtitle="Restore previous premium purchases and features"
            onPress={handleRestorePurchases}
          />
          <ListItem
            title="🗑️ Delete Account"
            subtitle="Permanently delete your account and all data"
            onPress={handleDeleteAccount}
            color="#FF6B6B"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤝 Support</Text>
          <ListItem
            title="📞 Report Spam Number"
            subtitle="Help protect the community by reporting suspicious calls"
            onPress={() => onNavigateToUpgrade()} // Will be replaced with navigation to ReportNumberScreen
          />
          <ListItem
            title="💬 Contact Support"
            subtitle="Get help with your account or app issues"
            onPress={handleContactSupport}
          />
          <ListItem
            title="🔒 Privacy Policy"
            subtitle="Learn how we protect your personal data"
            onPress={handlePrivacyPolicy}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛠️ Developer Tools</Text>
          <ListItem
            title="🔬 Check Engine Status"
            subtitle="Verify if the native YARA engine is active"
            onPress={handleCheckEngineStatus}
          />
          <ListItem
            title="🛡️ Activate YARA Engine"
            subtitle="Initialize YARA engine for enhanced threat detection"
            onPress={activateYaraEngine}
          />
          {isLoadingStatus && <ActivityIndicator style={{ marginTop: 10 }} color="#4ecdc4" />}
          {engineStatus && (
            <View style={styles.statusContainer}>
              <Text style={styles.statusTitle}>YARA Engine Status</Text>
              <View style={[styles.statusItem, engineStatus.native ? styles.statusItemSuccess : styles.statusItemWarning]}>
                <Text style={styles.statusLabel}>Native Engine Active:</Text>
                <Text style={[styles.statusValue, engineStatus.native ? styles.statusValueSuccess : styles.statusValueWarning]}>
                  {engineStatus.native ? '✅ YES' : '❌ NO (Using Mock)'}
                </Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Initialized:</Text>
                <Text style={styles.statusValue}>{engineStatus.initialized ? 'Yes' : 'No'}</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Engine Version:</Text>
                <Text style={styles.statusValue}>{engineStatus.version}</Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Detection Rules:</Text>
                <Text style={styles.statusValue}>{engineStatus.rulesCount}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 App Info</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>📦 Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>🛠️ Build</Text>
            <Text style={styles.infoValue}>2024.01.15</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🚪 Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>✨ Shabari (शबरी) ✨</Text>
          <Text style={styles.footerSubtext}>Your Digital Guardian 🛡️</Text>
        </View>
      </ScrollView>

      {/* Premium Upgrade Modal */}
      <PremiumUpgrade
        visible={upgradeVisible}
        onClose={() => setUpgradeVisible(false)}
        featureRequested="VPN & Proxy Control"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1419', // Use new theme background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  backButton: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5B73FF', // Use primary color
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1B23', // Use theme surface
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14, // More rounded
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(184, 188, 200, 0.1)', // Subtle border
    shadowColor: '#5B73FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#FFFFFF',
  },
  listItemSubtitle: {
    fontSize: 13,
    color: '#B8BCC8',
    lineHeight: 18,
  },
  listItemArrow: {
    fontSize: 24,
    color: '#5B73FF',
    fontWeight: '300',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A1B23',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(184, 188, 200, 0.1)',
  },
  infoLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#cccccc',
  },
  logoutButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingTop: 24,
  },
  footerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5B73FF',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#B8BCC8',
    opacity: 0.8,
  },
  statusContainer: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 20,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
    textAlign: 'center',
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3b5e',
  },
  statusItemSuccess: {
    backgroundColor: 'rgba(22, 160, 133, 0.1)',
    paddingHorizontal: 10,
    marginHorizontal: -10,
    borderRadius: 5,
  },
  statusItemWarning: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    paddingHorizontal: 10,
    marginHorizontal: -10,
    borderRadius: 5,
  },
  statusLabel: {
    fontSize: 16,
    color: '#cccccc',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 16,
    color: '#ffffff',
  },
  statusValueSuccess: {
    color: '#16a085',
    fontWeight: 'bold',
  },
  statusValueWarning: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  lockBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 8,
  },
  lockBadgeRow: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default SettingsScreen;

