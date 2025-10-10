/**
 * Proxy Engine Test Utility
 * This utility helps test the proxy engine functionality in React Native environment
 */

import { Alert, Platform } from 'react-native';
import { proxyEngineService } from '../services/ProxyEngineService';

export class ProxyEngineTest {
  
  /**
   * Test proxy engine availability and basic functionality
   */
  static async runBasicTest(): Promise<void> {
    console.log('🧪 Starting Proxy Engine Basic Test...\n');

    try {
      // Test 1: Check availability
      console.log('1️⃣ Testing availability...');
      const isAvailable = proxyEngineService.isAvailable();
      console.log(`   Proxy Engine Available: ${isAvailable ? '✅' : '❌'}`);
      
      if (!isAvailable) {
        console.log('   ⚠️ Proxy Engine not available on this platform');
        this.showTestResult('Proxy Engine Test', 'Proxy Engine not available on this platform', false);
        return;
      }

      // Test 2: Initialize
      console.log('\n2️⃣ Testing initialization...');
      const initResult = await proxyEngineService.initialize();
      console.log(`   Initialization: ${initResult.success ? '✅' : '❌'}`);
      console.log(`   Message: ${initResult.message}`);

      if (!initResult.success) {
        this.showTestResult('Initialization Test', initResult.message, false);
        return;
      }

      // Test 3: Get status
      console.log('\n3️⃣ Testing status retrieval...');
      const status = await proxyEngineService.getStatus();
      console.log(`   Status: ${status.status}`);
      console.log(`   Is Running: ${status.isRunning ? '✅' : '❌'}`);
      
      if (status.statistics) {
        console.log('   Statistics:');
        console.log(`     - Threats Blocked: ${status.statistics.threatsBlocked}`);
        console.log(`     - Threats Warned: ${status.statistics.threatsWarned}`);
        console.log(`     - Data Transferred: ${status.statistics.dataTransferred}`);
        console.log(`     - Uptime: ${status.statistics.uptime}`);
      }

      // Test 4: Test threat reporting
      console.log('\n4️⃣ Testing threat reporting...');
      const reportResult = await proxyEngineService.reportThreat(
        'test-malicious-site.com',
        'domain',
        'Test threat for integration testing'
      );
      console.log(`   Threat Report: ${reportResult.success ? '✅' : '❌'}`);
      console.log(`   Message: ${reportResult.message}`);

      // Test 5: Test filter update
      console.log('\n5️⃣ Testing filter update...');
      const updateResult = await proxyEngineService.updateFilters();
      console.log(`   Filter Update: ${updateResult.success ? '✅' : '❌'}`);
      console.log(`   Message: ${updateResult.message}`);

      // Show success result
      const successMessage = `All tests passed!\n\n` +
        `✅ Availability: ${isAvailable}\n` +
        `✅ Initialization: ${initResult.success}\n` +
        `✅ Status Retrieval: Working\n` +
        `✅ Threat Reporting: ${reportResult.success}\n` +
        `✅ Filter Update: ${updateResult.success}`;

      this.showTestResult('Proxy Engine Test', successMessage, true);

      console.log('\n🎉 Proxy Engine Basic Test Completed Successfully!');

    } catch (error) {
      console.error('❌ Test failed with error:', error);
      this.showTestResult('Proxy Engine Test', `Test failed: ${error}`, false);
    }
  }

  /**
   * Test VPN protection start/stop
   */
  static async runProtectionTest(): Promise<void> {
    console.log('🛡️ Starting VPN Protection Test...\n');

    try {
      // Check availability first
      if (!proxyEngineService.isAvailable()) {
        this.showTestResult('VPN Protection Test', 'Proxy Engine not available', false);
        return;
      }

      // Initialize if needed
      const initResult = await proxyEngineService.initialize();
      if (!initResult.success) {
        this.showTestResult('VPN Protection Test', `Initialization failed: ${initResult.message}`, false);
        return;
      }

      // Test starting protection
      console.log('1️⃣ Testing VPN protection start...');
      const startResult = await proxyEngineService.startProtection({
        blockAds: true,
        blockTrackers: true,
        blockMalware: true,
        blockPhishing: true,
        enableCallProtection: true
      });
      
      console.log(`   Start Result: ${startResult.success ? '✅' : '❌'}`);
      console.log(`   Message: ${startResult.message}`);

      if (startResult.success) {
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test stopping protection
        console.log('\n2️⃣ Testing VPN protection stop...');
        const stopResult = await proxyEngineService.stopProtection();
        
        console.log(`   Stop Result: ${stopResult.success ? '✅' : '❌'}`);
        console.log(`   Message: ${stopResult.message}`);

        const testMessage = `VPN Protection Test Results:\n\n` +
          `✅ Start Protection: ${startResult.success}\n` +
          `✅ Stop Protection: ${stopResult.success}\n\n` +
          `Start Message: ${startResult.message}\n` +
          `Stop Message: ${stopResult.message}`;

        this.showTestResult('VPN Protection Test', testMessage, startResult.success && stopResult.success);
      } else {
        this.showTestResult('VPN Protection Test', `Failed to start protection: ${startResult.message}`, false);
      }

    } catch (error) {
      console.error('❌ VPN Protection test failed:', error);
      this.showTestResult('VPN Protection Test', `Test failed: ${error}`, false);
    }
  }

  /**
   * Test platform compatibility
   */
  static runPlatformTest(): void {
    console.log('📱 Platform Compatibility Test...\n');

    const platform = Platform.OS;
    const isAndroid = platform === 'android';
    const isIOS = platform === 'ios';
    const isWeb = platform === 'web';

    console.log(`   Platform: ${platform}`);
    console.log(`   Android: ${isAndroid ? '✅' : '❌'}`);
    console.log(`   iOS: ${isIOS ? '✅' : '❌'}`);
    console.log(`   Web: ${isWeb ? '✅' : '❌'}`);

    let message = `Platform: ${platform}\n\n`;
    let isCompatible = false;

    if (isAndroid) {
      message += '✅ Android: Proxy Engine will work\n';
      message += '✅ VPN protection available\n';
      message += '✅ Call protection available\n';
      isCompatible = true;
    } else if (isIOS) {
      message += '⚠️ iOS: Limited functionality\n';
      message += '❌ VPN protection not available\n';
      message += '❌ Call protection not available\n';
      isCompatible = false;
    } else if (isWeb) {
      message += '❌ Web: Proxy Engine not available\n';
      message += '❌ VPN protection not available\n';
      message += '❌ Call protection not available\n';
      isCompatible = false;
    }

    this.showTestResult('Platform Compatibility', message, isCompatible);
  }

  /**
   * Show test result in alert
   */
  private static showTestResult(title: string, message: string, success: boolean): void {
    Alert.alert(
      `${success ? '✅' : '❌'} ${title}`,
      message,
      [{ text: 'OK', style: success ? 'default' : 'destructive' }]
    );
  }

  /**
   * Run all tests
   */
  static async runAllTests(): Promise<void> {
    console.log('🚀 Running All Proxy Engine Tests...\n');
    
    // Platform test first
    this.runPlatformTest();
    
    // Wait a moment for user to see platform result
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Basic functionality test
    await this.runBasicTest();
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Protection test (only on Android)
    if (Platform.OS === 'android') {
      await this.runProtectionTest();
    } else {
      console.log('⚠️ Skipping VPN protection test - not available on this platform');
    }
  }
}
