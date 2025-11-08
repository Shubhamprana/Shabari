import { NativeModules, Platform } from 'react-native';

const { AppPermissionScanner } = NativeModules;

class AppPermissionScannerModule {
  /**
   * Scan all installed apps and analyze their permissions
   * @returns {Promise<Object>} Scan results with apps array and statistics
   */
  async scanInstalledApps() {
    if (Platform.OS !== 'android') {
      throw new Error('App permission scanning is only available on Android');
    }
    
    if (!AppPermissionScanner) {
      throw new Error('AppPermissionScanner native module not available');
    }
    
    try {
      console.log('🔍 Starting real app permission scan...');
      const result = await AppPermissionScanner.scanInstalledApps();
      console.log(`✅ Scan complete: ${result.totalScanned} apps scanned, ${result.totalFound} apps analyzed`);
      return result;
    } catch (error) {
      console.error('❌ App permission scan failed:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific app
   * @param {string} packageName - The package name of the app
   * @returns {Promise<Object>} App details and permissions
   */
  async getAppDetails(packageName) {
    if (Platform.OS !== 'android') {
      throw new Error('App permission scanning is only available on Android');
    }
    
    if (!AppPermissionScanner) {
      throw new Error('AppPermissionScanner native module not available');
    }
    
    try {
      console.log(`🔍 Getting details for app: ${packageName}`);
      const result = await AppPermissionScanner.getAppDetails(packageName);
      return result;
    } catch (error) {
      console.error('❌ Failed to get app details:', error);
      throw error;
    }
  }

  /**
   * Check if the module is available
   * @returns {boolean} True if module is available
   */
  isAvailable() {
    return Platform.OS === 'android' && !!AppPermissionScanner;
  }
}

export default new AppPermissionScannerModule();
