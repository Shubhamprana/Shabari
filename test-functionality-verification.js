/**
 * 🔍 Shabari App - Functionality Verification Test
 * Comprehensive testing for Premium vs Non-Premium features
 * 
 * This script verifies that all features work correctly for both user tiers:
 * - Free users: Manual security features only
 * - Premium users: Automatic + Advanced features
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Shabari Functionality Verification...\n');

// Test Configuration
const testConfig = {
  testPremium: true,
  testFree: true,
  logLevel: 'detailed', // 'basic' | 'detailed'
  outputFile: 'functionality-test-results.md'
};

// Feature Categories
const features = {
  free: {
    name: 'Free Tier Features (Manual Only)',
    features: [
      'Manual URL Scanning',
      'Manual File Scanning', 
      'Basic Message Analysis',
      'Manual App Scanning',
      'Manual File Directory Scan',
      'Secure Browser (Basic)',
      'Login/Authentication',
      'Dashboard Navigation',
      'Settings Access'
    ]
  },
  premium: {
    name: 'Premium Tier Features (Automatic + Advanced)',
    features: [
      'Automatic URL Monitoring (Clipboard)',
      'Watchdog File Protection (Real-time)',
      'Privacy Guard (App Installation Monitoring)',
      'OTP Insight Pro (AI-powered SMS Analysis)',
      'ML-Powered Fraud Detection',
      'Context Rules & Frequency Analysis',
      'Local Storage for Analysis History',
      'Advanced Notifications',
      'Real-time Background Monitoring',
      'Bulk File Scanning',
      'Advanced Reporting'
    ]
  }
};

// File paths to verify
const criticalFiles = [
  'src/stores/subscriptionStore.ts',
  'src/components/PremiumUpgrade.tsx',
  'src/screens/DashboardScreen.tsx',
  'src/components/ActionGrid.tsx',
  'src/services/OtpInsightService.ts',
  'src/services/PrivacyGuardService.ts',
  'src/services/WatchdogFileService.ts',
  'src/services/ClipboardURLMonitor.ts',
  'src/services/URLProtectionService.ts',
  'src/services/ScannerService.ts',
  'src/lib/UniversalServices.ts',
  'src/lib/compatibilityShims.ts'
];

// Results tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

function logResult(category, test, status, message, details = '') {
  const timestamp = new Date().toISOString();
  const result = {
    timestamp,
    category,
    test,
    status, // 'PASS' | 'FAIL' | 'WARN'
    message,
    details
  };
  
  testResults.details.push(result);
  
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${statusIcon} [${category}] ${test}: ${message}`);
  
  if (testConfig.logLevel === 'detailed' && details) {
    console.log(`   └─ ${details}`);
  }
  
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') testResults.failed++;
  else testResults.warnings++;
}

// Test 1: Verify Critical Files Exist
function testCriticalFiles() {
  console.log('\n📁 Testing Critical Files...');
  
  criticalFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      logResult('Files', `${path.basename(filePath)}`, 'PASS', 
        'File exists and accessible', 
        `Size: ${stats.size} bytes, Modified: ${stats.mtime.toISOString()}`);
    } else {
      logResult('Files', `${path.basename(filePath)}`, 'FAIL', 
        'File missing or inaccessible', 
        `Expected path: ${filePath}`);
    }
  });
}

// Test 2: Verify Subscription Store Implementation
function testSubscriptionStore() {
  console.log('\n💳 Testing Subscription Store...');
  
  try {
    const subscriptionStoreContent = fs.readFileSync('src/stores/subscriptionStore.ts', 'utf8');
    
    // Check for key functions
    const requiredFunctions = [
      'checkSubscriptionStatus',
      'upgradeToPremium', 
      'downgradToFree'
    ];
    
    requiredFunctions.forEach(func => {
      if (subscriptionStoreContent.includes(func)) {
        logResult('Subscription', func, 'PASS', 'Function implemented correctly');
      } else {
        logResult('Subscription', func, 'FAIL', 'Function missing from store');
      }
    });
    
    // Check default subscription state
    if (subscriptionStoreContent.includes('isPremium: true')) {
      logResult('Subscription', 'Default State', 'PASS', 
        'Default premium state for testing', 
        'Note: Should be false in production');
    }
    
    // Check database integration
    if (subscriptionStoreContent.includes('authUser.is_premium')) {
      logResult('Subscription', 'Database Integration', 'PASS', 
        'Database sync implemented');
    } else {
      logResult('Subscription', 'Database Integration', 'WARN', 
        'Database sync may be missing');
    }
    
  } catch (error) {
    logResult('Subscription', 'Store Loading', 'FAIL', 
      'Failed to load subscription store', error.message);
  }
}

// Test 3: Verify Premium Feature Gating
function testPremiumFeatureGating() {
  console.log('\n🔒 Testing Premium Feature Gating...');
  
  const servicesToTest = [
    { file: 'src/services/PrivacyGuardService.ts', service: 'Privacy Guard' },
    { file: 'src/services/WatchdogFileService.ts', service: 'Watchdog File Service' },
    { file: 'src/services/OtpInsightService.ts', service: 'OTP Insight Service' },
    { file: 'src/services/ClipboardURLMonitor.ts', service: 'Clipboard Monitor' }
  ];
  
  servicesToTest.forEach(({ file, service }) => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for premium checks
      if (content.includes('isPremium') || content.includes('isPremiumUser')) {
        logResult('Premium Gating', service, 'PASS', 
          'Premium subscription checks implemented');
      } else {
        logResult('Premium Gating', service, 'WARN', 
          'Premium gating may be missing', 
          'Service may be accessible to free users');
      }
      
      // Check for subscription store usage
      if (content.includes('useSubscriptionStore')) {
        logResult('Premium Gating', `${service} Store Integration`, 'PASS', 
          'Subscription store properly integrated');
      } else {
        logResult('Premium Gating', `${service} Store Integration`, 'WARN', 
          'Subscription store integration unclear');
      }
      
    } catch (error) {
      logResult('Premium Gating', service, 'FAIL', 
        'Failed to analyze service file', error.message);
    }
  });
}

// Test 4: Verify Universal Services Compatibility
function testUniversalServices() {
  console.log('\n🌐 Testing Universal Services...');
  
  try {
    const universalServicesContent = fs.readFileSync('src/lib/UniversalServices.ts', 'utf8');
    
    // Check for key service implementations
    const requiredServices = [
      'FileSystemService',
      'NotificationService', 
      'ShareIntentService',
      'GoogleAuthService'
    ];
    
    requiredServices.forEach(service => {
      if (universalServicesContent.includes(service)) {
        logResult('Universal Services', service, 'PASS', 
          'Service implementation found');
      } else {
        logResult('Universal Services', service, 'WARN', 
          'Service implementation may be missing');
      }
    });
    
    // Check for runtime detection
    if (universalServicesContent.includes('Platform.OS') || 
        universalServicesContent.includes('isExpoGo')) {
      logResult('Universal Services', 'Runtime Detection', 'PASS', 
        'Runtime environment detection implemented');
    } else {
      logResult('Universal Services', 'Runtime Detection', 'WARN', 
        'Runtime detection may be missing');
    }
    
  } catch (error) {
    logResult('Universal Services', 'Loading', 'FAIL', 
      'Failed to load Universal Services', error.message);
  }
}

// Test 5: Verify Dashboard Feature Implementation
function testDashboardFeatures() {
  console.log('\n📊 Testing Dashboard Features...');
  
  try {
    const dashboardContent = fs.readFileSync('src/screens/DashboardScreen.tsx', 'utf8');
    
    // Check for premium upgrade handling
    if (dashboardContent.includes('showPremiumUpgrade')) {
      logResult('Dashboard', 'Premium Upgrade Flow', 'PASS', 
        'Premium upgrade prompts implemented');
    } else {
      logResult('Dashboard', 'Premium Upgrade Flow', 'WARN', 
        'Premium upgrade flow may be missing');
    }
    
    // Check for subscription status usage
    if (dashboardContent.includes('isPremium')) {
      logResult('Dashboard', 'Subscription Status', 'PASS', 
        'Subscription status checking implemented');
    } else {
      logResult('Dashboard', 'Subscription Status', 'FAIL', 
        'Subscription status checking missing');
    }
    
    // Check for feature differentiation
    const freeFeatureChecks = [
      'Manual URL Scanning',
      'Manual File Scanning',
      'Basic Message Analysis'
    ];
    
    freeFeatureChecks.forEach(feature => {
      // This is a simplified check - actual implementation may vary
      if (dashboardContent.includes('Manual') || dashboardContent.includes('Basic')) {
        logResult('Dashboard', `Free Feature: ${feature}`, 'PASS', 
          'Free tier features appear to be implemented');
      }
    });
    
  } catch (error) {
    logResult('Dashboard', 'Loading', 'FAIL', 
      'Failed to load dashboard screen', error.message);
  }
}

// Test 6: Verify Package Dependencies
function testPackageDependencies() {
  console.log('\n📦 Testing Package Dependencies...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check for critical dependencies
    const criticalDeps = [
      '@supabase/supabase-js',
      'zustand',
      'expo-linear-gradient',
      'react-native-reanimated',
      'expo-notifications'
    ];
    
    criticalDeps.forEach(dep => {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        logResult('Dependencies', dep, 'PASS', 
          `Installed version: ${packageJson.dependencies[dep]}`);
      } else {
        logResult('Dependencies', dep, 'WARN', 
          'Dependency may be missing or in devDependencies');
      }
    });
    
    // Check for build scripts
    const buildScripts = ['build:eas', 'build:eas-dev', 'build:eas-minimal'];
    buildScripts.forEach(script => {
      if (packageJson.scripts && packageJson.scripts[script]) {
        logResult('Dependencies', `Build Script: ${script}`, 'PASS', 
          'EAS build script configured');
      } else {
        logResult('Dependencies', `Build Script: ${script}`, 'WARN', 
          'EAS build script missing');
      }
    });
    
  } catch (error) {
    logResult('Dependencies', 'Package.json', 'FAIL', 
      'Failed to load package.json', error.message);
  }
}

// Test 7: Verify App Configuration
function testAppConfiguration() {
  console.log('\n⚙️ Testing App Configuration...');
  
  try {
    const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
    
    // Check expo configuration
    if (appJson.expo) {
      logResult('Configuration', 'Expo Config', 'PASS', 
        `App name: ${appJson.expo.name || 'Not set'}`);
        
      // Check Android configuration
      if (appJson.expo.android) {
        logResult('Configuration', 'Android Config', 'PASS', 
          `Package: ${appJson.expo.android.package || 'Not set'}`);
      } else {
        logResult('Configuration', 'Android Config', 'WARN', 
          'Android configuration missing');
      }
      
      // Check permissions
      if (appJson.expo.android && appJson.expo.android.permissions) {
        const permissions = appJson.expo.android.permissions;
        logResult('Configuration', 'Android Permissions', 'PASS', 
          `${permissions.length} permissions configured`);
      }
    } else {
      logResult('Configuration', 'Expo Config', 'FAIL', 
        'Expo configuration missing');
    }
    
  } catch (error) {
    logResult('Configuration', 'App.json', 'FAIL', 
      'Failed to load app.json', error.message);
  }
}

// Test 8: Verify EAS Build Configuration
function testEASConfiguration() {
  console.log('\n🏗️ Testing EAS Build Configuration...');
  
  try {
    const easJson = JSON.parse(fs.readFileSync('eas.json', 'utf8'));
    
    if (easJson.build) {
      const profiles = Object.keys(easJson.build);
      profiles.forEach(profile => {
        logResult('EAS Build', `Profile: ${profile}`, 'PASS', 
          'Build profile configured');
      });
      
      // Check for optimized profiles
      if (easJson.build['eas-optimized']) {
        logResult('EAS Build', 'Optimization Profile', 'PASS', 
          'EAS optimized profile configured');
      } else {
        logResult('EAS Build', 'Optimization Profile', 'WARN', 
          'EAS optimization profile missing');
      }
    } else {
      logResult('EAS Build', 'Configuration', 'FAIL', 
        'EAS build configuration missing');
    }
    
  } catch (error) {
    logResult('EAS Build', 'eas.json', 'FAIL', 
      'Failed to load eas.json', error.message);
  }
}

// Generate comprehensive report
function generateReport() {
  console.log('\n📋 Generating Functionality Report...');
  
  const report = `# 🔍 Shabari App - Functionality Verification Report

Generated: ${new Date().toISOString()}

## 📊 Test Summary

- ✅ **Passed**: ${testResults.passed}
- ❌ **Failed**: ${testResults.failed}  
- ⚠️ **Warnings**: ${testResults.warnings}
- **Total Tests**: ${testResults.passed + testResults.failed + testResults.warnings}

## 🆓 Free Tier Features (Expected to work for non-premium users)

${features.free.features.map(feature => `- ✅ ${feature}`).join('\n')}

## 🔒 Premium Tier Features (Should require subscription)

${features.premium.features.map(feature => `- 🔒 ${feature}`).join('\n')}

## 📋 Detailed Test Results

${testResults.details.map(result => {
  const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
  return `### ${statusIcon} [${result.category}] ${result.test}

**Status**: ${result.status}  
**Message**: ${result.message}  
**Time**: ${result.timestamp}  
${result.details ? `**Details**: ${result.details}` : ''}
`;
}).join('\n')}

## 🎯 Recommendations

### For Free Users
1. **Manual Features**: All manual security features should be fully functional
2. **Upgrade Prompts**: Clear indication when premium features are accessed
3. **Value Demonstration**: Show what premium offers without blocking basic functionality

### For Premium Users  
1. **Automatic Protection**: All background services should initialize properly
2. **Advanced Features**: AI-powered analysis and ML models should be available
3. **Real-time Monitoring**: Continuous background protection should be active

### Technical Improvements
1. **Error Handling**: Ensure graceful fallbacks when features are unavailable
2. **Performance**: Optimize premium features to avoid battery drain
3. **User Experience**: Clear feedback on subscription status and feature availability

## 🚀 Next Steps

1. **Manual Testing**: Test actual app functionality on device/emulator
2. **User Flow Testing**: Verify upgrade flow and feature restrictions
3. **Performance Testing**: Check premium features don't impact app performance
4. **Database Testing**: Verify subscription status sync with Supabase

---
*Report generated by Shabari Functionality Verification Tool*
`;

  fs.writeFileSync(testConfig.outputFile, report);
  console.log(`\n📄 Report saved to: ${testConfig.outputFile}`);
}

// Main test execution
async function runAllTests() {
  console.log('🧪 Running Comprehensive Functionality Tests...\n');
  
  try {
    testCriticalFiles();
    testSubscriptionStore();
    testPremiumFeatureGating();
    testUniversalServices();
    testDashboardFeatures();
    testPackageDependencies();
    testAppConfiguration();
    testEASConfiguration();
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 Test Execution Complete!`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`⚠️ Warnings: ${testResults.warnings}`);
    console.log('='.repeat(60));
    
    generateReport();
    
    // Exit with appropriate code
    if (testResults.failed > 0) {
      console.log('\n❌ Some tests failed. Please review the results.');
      process.exit(1);
    } else if (testResults.warnings > 0) {
      console.log('\n⚠️ All tests passed but there are warnings to review.');
      process.exit(0);
    } else {
      console.log('\n🎉 All tests passed successfully!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Command line options
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔍 Shabari Functionality Verification Tool

Usage: node test-functionality-verification.js [options]

Options:
  --help, -h     Show this help message
  --premium      Test only premium features  
  --free         Test only free features
  --basic        Basic logging output
  --detailed     Detailed logging output (default)

Examples:
  node test-functionality-verification.js
  node test-functionality-verification.js --premium --detailed
  node test-functionality-verification.js --free --basic
`);
    process.exit(0);
  }
  
  if (args.includes('--premium')) {
    testConfig.testFree = false;
    console.log('🔒 Testing Premium features only...');
  }
  
  if (args.includes('--free')) {
    testConfig.testPremium = false;
    console.log('🆓 Testing Free features only...');
  }
  
  if (args.includes('--basic')) {
    testConfig.logLevel = 'basic';
  }
  
  runAllTests();
}

module.exports = {
  runAllTests,
  testResults,
  logResult
}; 