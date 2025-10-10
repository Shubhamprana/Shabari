import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import { Alert, Linking } from 'react-native';

/**
 * Permission Manager for Shabari App
 * Handles all user permissions required for security features
 */
export class PermissionManager {
  private static instance: PermissionManager;

  // Permission keys for AsyncStorage
  private static readonly PERMISSION_KEYS = {
    BACKGROUND_MONITORING: 'permission_background_monitoring',
    DOWNLOAD_PROTECTION: 'permission_download_protection',
    NOTIFICATIONS: 'permission_notifications',
    FILE_ACCESS: 'permission_file_access',
    FIRST_TIME_SETUP: 'permission_first_time_setup'
  };

  private constructor() {}

  public static getInstance(): PermissionManager {
    if (!PermissionManager.instance) {
      PermissionManager.instance = new PermissionManager();
    }
    return PermissionManager.instance;
  }

  /**
   * Request all required permissions for security features
   */
  public async requestAllPermissions(): Promise<{
    backgroundMonitoring: boolean;
    downloadProtection: boolean;
    notifications: boolean;
    fileAccess: boolean;
  }> {
    console.log('🔐 Starting permission request flow...');

    // Check if this is first time setup
    const isFirstTime = await this.isFirstTimeSetup();
    
    if (isFirstTime) {
      await this.showWelcomeAndExplanation();
    }

    // Request permissions in logical order
    const notifications = await this.requestNotificationPermission();
    const fileAccess = await this.requestFileAccessPermission();
    const backgroundMonitoring = await this.requestBackgroundMonitoringPermission();
    const downloadProtection = await this.requestDownloadProtectionPermission();

    // Mark first-time setup as complete
    await AsyncStorage.setItem(PermissionManager.PERMISSION_KEYS.FIRST_TIME_SETUP, 'true');

    return {
      backgroundMonitoring,
      downloadProtection,
      notifications,
      fileAccess
    };
  }

  /**
   * Show welcome message and explain why permissions are needed
   */
  private async showWelcomeAndExplanation(): Promise<void> {
    return new Promise((resolve) => {
      Alert.alert(
        '🛡️ Welcome to Shabari Security',
        `To protect your device from threats, Shabari needs some permissions:\n\n🔍 File Monitoring: Watch for malicious files\n📥 Download Protection: Scan downloads in real-time\n🔔 Notifications: Alert you about threats\n📁 Storage Access: Scan files for security\n\nYour privacy is protected - we only scan for threats and never collect personal data.`,
        [
          {
            text: 'Continue Setup',
            onPress: () => resolve(),
            style: 'default'
          }
        ],
        { cancelable: false }
      );
    });
  }

  /**
   * Request notification permission
   */
  public async requestNotificationPermission(): Promise<boolean> {
    try {
      console.log('🔔 Requesting notification permission...');

      // Check current permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      if (existingStatus === 'granted') {
        console.log('✅ Notification permission already granted');
        await AsyncStorage.setItem(PermissionManager.PERMISSION_KEYS.NOTIFICATIONS, 'true');
        return true;
      }

      // Show explanation dialog
      const userConsent = await this.showPermissionDialog(
        '🔔 Notification Permission',
        'Shabari needs notification permission to:\n\n• Alert you about detected threats\n• Inform you when malicious files are found\n• Send security recommendations\n• Notify about download risks\n\nThis helps keep you safe in real-time.',
        'Allow Notifications',
        'Skip (Not Recommended)'
      );

      if (!userConsent) {
        await AsyncStorage.setItem(PermissionManager.PERMISSION_KEYS.NOTIFICATIONS, 'false');
        return false;
      }

      // Request permission
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });

      const granted = status === 'granted';
      await AsyncStorage.setItem(PermissionManager.PERMISSION_KEYS.NOTIFICATIONS, granted.toString());
      
      if (granted) {
        console.log('✅ Notification permission granted');
      } else {
        console.log('❌ Notification permission denied');
        this.showPermissionDeniedDialog('Notifications');
      }

      return granted;
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Request file access permission
   */
  public async requestFileAccessPermission(): Promise<boolean> {
    try {
      console.log('📁 Requesting file access permission...');

      // Check if already granted
      const stored = await AsyncStorage.getItem(PermissionManager.PERMISSION_KEYS.FILE_ACCESS);
      if (stored === 'true') {
        console.log('✅ File access permission already granted');
        return true;
      }

      // Show explanation dialog
      const userConsent = await this.showPermissionDialog(
        '📁 File Access Permission',
        'Shabari needs file access to:\n\n• Scan download folders for threats\n• Monitor new files for malicious content\n• Quarantine dangerous files safely\n• Protect your documents and media\n\nWe only scan for security threats - your personal files remain private.',
        'Allow File Access',
        'Skip (Limited Protection)'
      );

      if (!userConsent) {
        await AsyncStorage.setItem(PermissionManager.PERMISSION_KEYS.FILE_ACCESS, 'false');
        return false;
      }

      // Test file system access
      try {
        const testDir = `${FileSystem.documentDirectory}shabari_test/`;
        await FileSystem.makeDirectoryAsync(testDir, { intermediates: true });
        await FileSystem.deleteAsync(testDir);
        
        await AsyncStorage.setItem(PermissionManager.PERMISSION_KEYS.FILE_ACCESS, 'true');
        console.log('✅ File access permission granted');
        return true;
      } catch (error) {
        console.warn('⚠️ File access limited:', error);
        await AsyncStorage.setItem(PermissionManager.PERMISSION_KEYS.FILE_ACCESS, 'limited');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting file access permission:', error);
      return false;
    }
  }

  /**
   * Request background monitoring permission
   */
  public async requestBackgroundMonitoringPermission(): Promise<boolean> {
    try {
      console.log('🔍 Requesting background monitoring permission...');

      // Check if already granted
      const stored = await AsyncStorage.getItem(PermissionManager.PERMISSION_KEYS.BACKGROUND_MONITORING);
      if (stored === 'true') {
        console.log('✅ Background monitoring permission already granted');
        return true;
      }

      // Show detailed explanation
      const userConsent = await this.showPermissionDialog(
        '🔍 Background File Monitoring',
        'Enable automatic threat detection that works 24/7:\n\n🛡️ Real-time file scanning\n🚨 Instant threat alerts\n🐕 Continuous watchdog protection\n⚡ Automatic malware detection\n🔒 Silent background protection\n\nYour device will be protected even when the app is closed.\n\nNote: This may slightly impact battery life but provides maximum security.',
        'Enable Protection',
        'Manual Scan Only'
      );

      await AsyncStorage.setItem(PermissionManager.PERMISSION_KEYS.BACKGROUND_MONITORING, userConsent.toString());
      
      if (userConsent) {
        console.log('✅ Background monitoring permission granted');
      } else {
        console.log('ℹ️ User chose manual scanning only');
      }

      return userConsent;
    } catch (error) {
      console.error('❌ Error requesting background monitoring permission:', error);
      return false;
    }
  }

  /**
   * Request download protection permission
   */
  public async requestDownloadProtectionPermission(): Promise<boolean> {
    try {
      console.log('📥 Requesting download protection permission...');

      // Check if already granted
      const stored = await AsyncStorage.getItem(PermissionManager.PERMISSION_KEYS.DOWNLOAD_PROTECTION);
      if (stored === 'true') {
        console.log('✅ Download protection permission already granted');
        return true;
      }

      // Show detailed explanation
      const userConsent = await this.showPermissionDialog(
        '📥 Real-Time Download Protection',
        'Protect yourself from malicious downloads:\n\n🚫 Block dangerous files automatically\n🔍 Scan downloads as they happen\n⚡ Instant threat detection\n🛡️ URL safety analysis\n📊 Smart risk assessment\n🔒 Automatic quarantine\n\nPrevent trojans, viruses, and malware before they can harm your device.\n\nNote: Downloads will be analyzed for security threats.',
        'Enable Protection',
        'Manual Check Only'
      );

      await AsyncStorage.setItem(PermissionManager.PERMISSION_KEYS.DOWNLOAD_PROTECTION, userConsent.toString());
      
      if (userConsent) {
        console.log('✅ Download protection permission granted');
      } else {
        console.log('ℹ️ User chose manual download checking only');
      }

      return userConsent;
    } catch (error) {
      console.error('❌ Error requesting download protection permission:', error);
      return false;
    }
  }

  /**
   * Show permission dialog with custom message
   */
  private async showPermissionDialog(
    title: string,
    message: string,
    allowText: string,
    denyText: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        title,
        message,
        [
          {
            text: denyText,
            onPress: () => resolve(false),
            style: 'cancel'
          },
          {
            text: allowText,
            onPress: () => resolve(true),
            style: 'default'
          }
        ],
        { cancelable: false }
      );
    });
  }

  /**
   * Show dialog when permission is denied
   */
  private showPermissionDeniedDialog(permissionType: string): void {
    Alert.alert(
      '⚠️ Permission Denied',
      `${permissionType} permission was denied. You can:\n\n• Continue with limited protection\n• Enable it later in Settings\n• Grant permission now in device settings`,
      [
        { text: 'Continue', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => Linking.openSettings(),
          style: 'default'
        }
      ]
    );
  }

  /**
   * Check if this is first time setup
   */
  private async isFirstTimeSetup(): Promise<boolean> {
    try {
      const isSetup = await AsyncStorage.getItem(PermissionManager.PERMISSION_KEYS.FIRST_TIME_SETUP);
      return isSetup !== 'true';
    } catch {
      return true;
    }
  }

  /**
   * Get permission status for a specific feature
   */
  public async getPermissionStatus(permission: 'background' | 'download' | 'notifications' | 'files'): Promise<boolean> {
    try {
      let key: string;
      switch (permission) {
        case 'background':
          key = PermissionManager.PERMISSION_KEYS.BACKGROUND_MONITORING;
          break;
        case 'download':
          key = PermissionManager.PERMISSION_KEYS.DOWNLOAD_PROTECTION;
          break;
        case 'notifications':
          key = PermissionManager.PERMISSION_KEYS.NOTIFICATIONS;
          break;
        case 'files':
          key = PermissionManager.PERMISSION_KEYS.FILE_ACCESS;
          break;
        default:
          return false;
      }
      
      const status = await AsyncStorage.getItem(key);
      return status === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Get all permission statuses
   */
  public async getAllPermissionStatuses(): Promise<{
    backgroundMonitoring: boolean;
    downloadProtection: boolean;
    notifications: boolean;
    fileAccess: boolean;
  }> {
    const [background, download, notifications, files] = await Promise.all([
      this.getPermissionStatus('background'),
      this.getPermissionStatus('download'),
      this.getPermissionStatus('notifications'),
      this.getPermissionStatus('files')
    ]);

    return {
      backgroundMonitoring: background,
      downloadProtection: download,
      notifications,
      fileAccess: files
    };
  }

  /**
   * Reset all permissions (for testing/debugging)
   */
  public async resetAllPermissions(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(PermissionManager.PERMISSION_KEYS.BACKGROUND_MONITORING),
        AsyncStorage.removeItem(PermissionManager.PERMISSION_KEYS.DOWNLOAD_PROTECTION),
        AsyncStorage.removeItem(PermissionManager.PERMISSION_KEYS.NOTIFICATIONS),
        AsyncStorage.removeItem(PermissionManager.PERMISSION_KEYS.FILE_ACCESS),
        AsyncStorage.removeItem(PermissionManager.PERMISSION_KEYS.FIRST_TIME_SETUP)
      ]);
      console.log('🔄 All permissions reset');
    } catch (error) {
      console.error('❌ Error resetting permissions:', error);
    }
  }

  /**
   * Request specific permission
   */
  public async requestSpecificPermission(permission: 'background' | 'download' | 'notifications' | 'files'): Promise<boolean> {
    switch (permission) {
      case 'background':
        return await this.requestBackgroundMonitoringPermission();
      case 'download':
        return await this.requestDownloadProtectionPermission();
      case 'notifications':
        return await this.requestNotificationPermission();
      case 'files':
        return await this.requestFileAccessPermission();
      default:
        return false;
    }
  }

  /**
   * Show permission settings panel
   */
  public async showPermissionSettings(): Promise<void> {
    const permissions = await this.getAllPermissionStatuses();
    
    const statusText = `Current Permission Status:

🔔 Notifications: ${permissions.notifications ? '✅ Enabled' : '❌ Disabled'}
📁 File Access: ${permissions.fileAccess ? '✅ Enabled' : '❌ Disabled'}
🔍 Background Monitoring: ${permissions.backgroundMonitoring ? '✅ Enabled' : '❌ Disabled'}
📥 Download Protection: ${permissions.downloadProtection ? '✅ Enabled' : '❌ Disabled'}

Manage your security permissions:`;

    Alert.alert(
      '🔐 Security Permissions',
      statusText,
      [
        { text: 'Request Missing', onPress: () => this.requestAllPermissions() },
        { text: 'Device Settings', onPress: () => Linking.openSettings() },
        { text: 'Close' }
      ]
    );
  }
}

export default PermissionManager;
