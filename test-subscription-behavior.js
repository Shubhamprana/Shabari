/**
 * 🔍 Shabari App - Subscription Behavior Test
 * Tests premium vs non-premium feature access patterns
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Subscription Behavior & Feature Access...\n');

// Test Results
const testResults = {
  freeFeatures: [],
  premiumFeatures: [],
  warnings: [],
  errors: []
};

// 1. Check Subscription Store Default State
function checkSubscriptionDefaults() {
  console.log('💳 Checking Subscription Store Defaults...');
  
  const subscriptionStore = fs.readFileSync('src/stores/subscriptionStore.ts', 'utf8');
  
  // Check default isPremium state
  if (subscriptionStore.includes('isPremium: true')) {
    testResults.warnings.push({
      category: 'Subscription Store',
      issue: 'Default isPremium is set to true',
      impact: 'All users will have premium access by default',
      recommendation: 'Set isPremium: false in production'
    });
    console.log('⚠️  WARNING: Default subscription state is Premium (testing mode)');
  } else {
    console.log('✅ Default subscription state is Free (production ready)');
  }
  
  // Check database sync
  if (subscriptionStore.includes('authUser.is_premium')) {
    console.log('✅ Database subscription sync implemented');
  } else {
    testResults.errors.push({
      category: 'Subscription Store',
      issue: 'Database sync missing',
      impact: 'Subscription status won\'t sync with backend'
    });
  }
}

// 2. Analyze Service-Level Premium Gating
function analyzeServicePremiumGating() {
  console.log('\n🔒 Analyzing Service-Level Premium Gating...');
  
  const services = [
    { file: 'src/services/PrivacyGuardService.ts', name: 'Privacy Guard' },
    { file: 'src/services/WatchdogFileService.ts', name: 'Watchdog File Protection' },
    { file: 'src/services/OtpInsightService.ts', name: 'OTP Insight Pro' },
    { file: 'src/services/ClipboardURLMonitor.ts', name: 'Clipboard URL Monitor' }
  ];
  
  services.forEach(({ file, name }) => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for premium subscription checks
      const hasPremiumCheck = content.includes('isPremium') || content.includes('isPremiumUser');
      const hasSubscriptionStore = content.includes('useSubscriptionStore');
      
      if (hasPremiumCheck && hasSubscriptionStore) {
        testResults.premiumFeatures.push({
          service: name,
          file: file,
          status: 'Properly Gated',
          details: 'Premium subscription checks implemented'
        });
        console.log(`✅ ${name}: Properly gated with premium checks`);
      } else if (hasPremiumCheck) {
        testResults.warnings.push({
          category: 'Premium Gating',
          issue: `${name} has premium checks but unclear store integration`,
          recommendation: 'Verify subscription store usage'
        });
        console.log(`⚠️  ${name}: Has premium checks but store integration unclear`);
      } else {
        testResults.errors.push({
          category: 'Premium Gating',
          issue: `${name} lacks premium subscription checks`,
          impact: 'Service may be accessible to free users'
        });
        console.log(`❌ ${name}: Missing premium subscription checks`);
      }
      
    } catch (error) {
      testResults.errors.push({
        category: 'File Access',
        issue: `Cannot read ${file}`,
        error: error.message
      });
    }
  });
}

// 3. Check Dashboard Feature Differentiation
function checkDashboardFeatureDifferentiation() {
  console.log('\n📊 Checking Dashboard Feature Differentiation...');
  
  try {
    const dashboardContent = fs.readFileSync('src/screens/DashboardScreen.tsx', 'utf8');
    
    // Check for isPremium usage
    const premiumChecks = dashboardContent.match(/isPremium/g);
    if (premiumChecks && premiumChecks.length > 0) {
      console.log(`✅ Dashboard uses ${premiumChecks.length} premium subscription checks`);
    } else {
      testResults.errors.push({
        category: 'Dashboard',
        issue: 'No premium subscription checks found',
        impact: 'All features may be accessible to free users'
      });
    }
    
    // Check for premium upgrade prompts
    if (dashboardContent.includes('showPremiumUpgrade')) {
      console.log('✅ Premium upgrade prompts implemented');
    } else {
      testResults.warnings.push({
        category: 'Dashboard',
        issue: 'Premium upgrade prompts may be missing',
        recommendation: 'Add upgrade prompts when premium features are accessed'
      });
    }
    
    // Check for feature-specific handling
    const featureHandlers = [
      'handleFileScan',
      'handleLinkCheck', 
      'handleAppMonitor',
      'handleFileWatchdog',
      'handleOTPInsight'
    ];
    
    featureHandlers.forEach(handler => {
      if (dashboardContent.includes(handler)) {
        console.log(`✅ ${handler}: Feature handler implemented`);
      } else {
        testResults.warnings.push({
          category: 'Dashboard',
          issue: `${handler} handler may be missing`,
          recommendation: 'Verify all feature handlers are implemented'
        });
      }
    });
    
  } catch (error) {
    testResults.errors.push({
      category: 'Dashboard Analysis',
      issue: 'Cannot analyze dashboard screen',
      error: error.message
    });
  }
}

// 4. Verify Premium Upgrade Component
function verifyPremiumUpgradeComponent() {
  console.log('\n💎 Verifying Premium Upgrade Component...');
  
  try {
    const premiumUpgradeContent = fs.readFileSync('src/components/PremiumUpgrade.tsx', 'utf8');
    
    // Check for feature comparison
    if (premiumUpgradeContent.includes('comparisonRow')) {
      console.log('✅ Feature comparison table implemented');
    } else {
      testResults.warnings.push({
        category: 'Premium Upgrade',
        issue: 'Feature comparison may be missing',
        recommendation: 'Add clear free vs premium feature comparison'
      });
    }
    
    // Check for upgrade functionality
    if (premiumUpgradeContent.includes('upgradeToPremium')) {
      console.log('✅ Upgrade functionality implemented');
    } else {
      testResults.errors.push({
        category: 'Premium Upgrade',  
        issue: 'Upgrade functionality missing',
        impact: 'Users cannot upgrade to premium'
      });
    }
    
    // Check for compelling features list
    if (premiumUpgradeContent.includes('premiumFeatures')) {
      console.log('✅ Premium features list implemented');
    } else {
      testResults.warnings.push({
        category: 'Premium Upgrade',
        issue: 'Premium features list may be missing',
        recommendation: 'Add compelling premium features showcase'
      });
    }
    
  } catch (error) {
    testResults.errors.push({
      category: 'Premium Upgrade Analysis',
      issue: 'Cannot analyze premium upgrade component',
      error: error.message
    });
  }
}

// 5. Check for Universal Services Compatibility
function checkUniversalServicesCompatibility() {
  console.log('\n🌐 Checking Universal Services Compatibility...');
  
  try {
    const universalServicesContent = fs.readFileSync('src/lib/UniversalServices.ts', 'utf8');
    
    // Check for build environment detection
    if (universalServicesContent.includes('isExpoGo') || universalServicesContent.includes('Platform.OS')) {
      console.log('✅ Build environment detection implemented');
    } else {
      testResults.warnings.push({
        category: 'Universal Services',
        issue: 'Build environment detection unclear',
        recommendation: 'Ensure proper runtime detection for EAS vs Expo Go'
      });
    }
    
    // Check for service fallbacks
    const services = ['FileSystemService', 'NotificationService', 'ShareIntentService', 'GoogleAuthService'];
    services.forEach(service => {
      if (universalServicesContent.includes(service)) {
        console.log(`✅ ${service}: Universal service implementation found`);
      } else {
        testResults.warnings.push({
          category: 'Universal Services',
          issue: `${service} implementation unclear`,
          recommendation: 'Verify service compatibility across build types'
        });
      }
    });
    
  } catch (error) {
    testResults.errors.push({
      category: 'Universal Services Analysis',
      issue: 'Cannot analyze universal services',
      error: error.message
    });
  }
}

// 6. Generate Feature Matrix
function generateFeatureMatrix() {
  console.log('\n📋 Generating Feature Access Matrix...');
  
  const featureMatrix = {
    free: {
      'URL Scanning': 'Manual only',
      'File Scanning': 'Manual only', 
      'Message Analysis': 'Basic only',
      'App Monitoring': 'Manual scan only',
      'File Protection': 'Manual scan only',
      'Browser Protection': 'Basic only',
      'Authentication': 'Full access',
      'Dashboard': 'Full access',
      'Settings': 'Full access'
    },
    premium: {
      'URL Scanning': 'Manual + Automatic (Clipboard)',
      'File Scanning': 'Manual + Real-time Watchdog',
      'Message Analysis': 'Basic + AI-powered ML Detection',
      'App Monitoring': 'Manual + Automatic Privacy Guard',
      'File Protection': 'Manual + Background Protection',
      'Browser Protection': 'Basic + Advanced Threat Detection',
      'Authentication': 'Full access',
      'Dashboard': 'Full access + Premium widgets',
      'Settings': 'Full access + Premium controls',
      'ML Features': 'AI fraud detection, Context rules',
      'Background Services': 'Real-time monitoring',
      'Advanced Reporting': 'Detailed analytics',
      'Bulk Operations': 'Mass scanning capabilities'
    }
  };
  
  console.log('\n🆓 FREE TIER FEATURES:');
  Object.entries(featureMatrix.free).forEach(([feature, access]) => {
    console.log(`  • ${feature}: ${access}`);
  });
  
  console.log('\n🔒 PREMIUM TIER FEATURES:');
  Object.entries(featureMatrix.premium).forEach(([feature, access]) => {
    console.log(`  • ${feature}: ${access}`);
  });
  
  return featureMatrix;
}

// 7. Generate Test Summary Report
function generateTestSummary() {
  console.log('\n📊 Test Summary Report...');
  
  const totalTests = testResults.freeFeatures.length + testResults.premiumFeatures.length;
  const totalIssues = testResults.warnings.length + testResults.errors.length;
  
  console.log(`
════════════════════════════════════════════════════════════════
📋 SUBSCRIPTION BEHAVIOR TEST RESULTS
════════════════════════════════════════════════════════════════

📊 SUMMARY:
  • Total Premium Features Analyzed: ${testResults.premiumFeatures.length}
  • Total Warnings: ${testResults.warnings.length}
  • Total Errors: ${testResults.errors.length}
  • Overall Health: ${totalIssues === 0 ? '🟢 Excellent' : totalIssues <= 3 ? '🟡 Good' : '🔴 Needs Attention'}

🔒 PREMIUM FEATURES STATUS:
${testResults.premiumFeatures.map(feature => 
  `  ✅ ${feature.service}: ${feature.status}`
).join('\n')}

⚠️  WARNINGS (${testResults.warnings.length}):
${testResults.warnings.map(warning => 
  `  • [${warning.category}] ${warning.issue}
    💡 ${warning.recommendation || 'Review implementation'}`
).join('\n')}

❌ ERRORS (${testResults.errors.length}):
${testResults.errors.map(error => 
  `  • [${error.category}] ${error.issue}
    ⚠️  Impact: ${error.impact || 'Unknown impact'}`
).join('\n')}

🎯 RECOMMENDATIONS:

FOR FREE USERS:
  ✅ Ensure all manual features work without restrictions
  ✅ Show clear upgrade prompts for premium features  
  ✅ Provide alternative manual workflows

FOR PREMIUM USERS:
  ✅ Verify all automatic services initialize properly
  ✅ Test ML models and AI features are available
  ✅ Confirm background monitoring works correctly

TECHNICAL:
  ${totalIssues === 0 ? '✅ All systems appear to be working correctly!' : 
    `⚠️  Address ${totalIssues} issues identified above`}
  ✅ Consider setting isPremium: false as default for production
  ✅ Test actual subscription flow with payment system
  ✅ Verify database sync works with Supabase

════════════════════════════════════════════════════════════════
  `);
}

// Main execution
async function runSubscriptionBehaviorTest() {
  try {
    checkSubscriptionDefaults();
    analyzeServicePremiumGating();
    checkDashboardFeatureDifferentiation();
    verifyPremiumUpgradeComponent();
    checkUniversalServicesCompatibility();
    generateFeatureMatrix();
    generateTestSummary();
    
    // Save detailed results to file
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        premiumFeatures: testResults.premiumFeatures.length,
        warnings: testResults.warnings.length,
        errors: testResults.errors.length
      },
      premiumFeatures: testResults.premiumFeatures,
      warnings: testResults.warnings,
      errors: testResults.errors
    };
    
    fs.writeFileSync('subscription-behavior-test-results.json', JSON.stringify(report, null, 2));
    console.log('\n📁 Detailed results saved to: subscription-behavior-test-results.json');
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  }
}

// Execute tests
if (require.main === module) {
  runSubscriptionBehaviorTest();
}

module.exports = { runSubscriptionBehaviorTest, testResults }; 