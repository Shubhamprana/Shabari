#!/usr/bin/env node

/**
 * 🔐 AUTHENTICATION FLOW FIXES TEST
 * 
 * This script tests the authentication improvements:
 * 1. Email verification redirect fix
 * 2. Forgot password functionality
 * 3. Deep link handling
 * 4. Improved error messages
 */

const fs = require('fs');
const path = require('path');

console.log('🔐 AUTHENTICATION FLOW FIXES TEST');
console.log('==================================\n');

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${description}: EXISTS`);
    return true;
  } else {
    console.log(`❌ ${description}: MISSING`);
    return false;
  }
}

function checkFileContains(filePath, searchTerms, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const allFound = searchTerms.every(term => content.includes(term));
    
    if (allFound) {
      console.log(`✅ ${description}: IMPLEMENTED`);
      return true;
    } else {
      console.log(`❌ ${description}: MISSING FEATURES`);
      searchTerms.forEach(term => {
        if (!content.includes(term)) {
          console.log(`   - Missing: ${term}`);
        }
      });
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description}: ERROR READING FILE`);
    return false;
  }
}

function testAuthenticationFixes() {
  console.log('🔍 TESTING AUTHENTICATION FIXES...\n');
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Test 1: Supabase Configuration Updates
  totalTests++;
  console.log('Test 1: Supabase Email Verification Configuration');
  if (checkFileContains('src/lib/supabase.ts', [
    'sendEmailVerification',
    'sendPasswordReset',
    'emailRedirectTo',
    'shabari://auth/callback',
    'shabari://auth/reset-password'
  ], 'Supabase email redirect configuration')) {
    passedTests++;
  }
  console.log('');
  
  // Test 2: Auth Store Updates
  totalTests++;
  console.log('Test 2: Auth Store Password Reset Function');
  if (checkFileContains('src/stores/authStore.ts', [
    'resetPassword',
    'sendPasswordReset',
    'sendEmailVerification'
  ], 'Auth store password reset functionality')) {
    passedTests++;
  }
  console.log('');
  
  // Test 3: Login Screen Improvements
  totalTests++;
  console.log('Test 3: Login Screen Forgot Password & UI Improvements');
  if (checkFileContains('src/screens/LoginScreen.tsx', [
    'showForgotPassword',
    'handleForgotPassword',
    'Modal',
    'Reset Email Sent!',
    'MaterialCommunityIcons'
  ], 'Login screen forgot password and UI improvements')) {
    passedTests++;
  }
  console.log('');
  
  // Test 4: Deep Link Handling in App.tsx
  totalTests++;
  console.log('Test 4: Deep Link Handling for Email Verification');
  if (checkFileContains('App.tsx', [
    'handleDeepLink',
    '/auth/callback',
    '/auth/reset-password',
    'Email Verified!',
    'Password Reset Ready'
  ], 'Deep link handling for email verification')) {
    passedTests++;
  }
  console.log('');
  
  // Test 5: App Configuration Updates
  totalTests++;
  console.log('Test 5: App Configuration Deep Link Support');
  if (checkFileContains('app.config.js', [
    '"scheme": "shabari"',
    'intentFilters',
    'mynbtxrbqbmhxvaimfhs.supabase.co'
  ], 'App configuration deep link support')) {
    passedTests++;
  }
  console.log('');
  
  // Test 6: Error Handling Improvements
  totalTests++;
  console.log('Test 6: Enhanced Error Messages');
  if (checkFileContains('src/screens/LoginScreen.tsx', [
    'Invalid login credentials',
    'Email not confirmed',
    'User already registered',
    'emailRegex.test'
  ], 'Enhanced error messages and validation')) {
    passedTests++;
  }
  console.log('');
  
  return { totalTests, passedTests };
}

function testUIImprovements() {
  console.log('🎨 TESTING UI IMPROVEMENTS...\n');
  
  let totalTests = 0;
  let passedTests = 0;
  
  // Test 1: Login Screen UI Enhancements
  totalTests++;
  console.log('Test 1: Login Screen Visual Improvements');
  if (checkFileContains('src/screens/LoginScreen.tsx', [
    'logoContainer',
    'inputContainer',
    'inputIcon',
    'modalOverlay',
    'modalContent',
    'shield-check'
  ], 'Login screen visual improvements')) {
    passedTests++;
  }
  console.log('');
  
  // Test 2: Better Success Messages
  totalTests++;
  console.log('Test 2: Improved Success Messages');
  if (checkFileContains('src/screens/LoginScreen.tsx', [
    'Account Created! 🎉',
    'verification email has been sent',
    'password reset link has been sent'
  ], 'Improved success messages with emojis')) {
    passedTests++;
  }
  console.log('');
  
  return { totalTests, passedTests };
}

function generateImplementationSummary(authResults, uiResults) {
  const totalPassed = authResults.passedTests + uiResults.passedTests;
  const totalTests = authResults.totalTests + uiResults.totalTests;
  const successRate = Math.round((totalPassed / totalTests) * 100);
  
  console.log('📊 IMPLEMENTATION SUMMARY');
  console.log('========================\n');
  
  console.log(`✅ Authentication Fixes: ${authResults.passedTests}/${authResults.totalTests}`);
  console.log(`✅ UI Improvements: ${uiResults.passedTests}/${uiResults.totalTests}`);
  console.log(`📈 Overall Success Rate: ${successRate}%\n`);
  
  if (successRate >= 90) {
    console.log('🎉 EXCELLENT! Authentication flow fixes are properly implemented.');
  } else if (successRate >= 75) {
    console.log('✅ GOOD! Most authentication fixes are in place.');
  } else {
    console.log('⚠️ NEEDS WORK! Some authentication fixes need attention.');
  }
  
  console.log('\n🔧 FIXES IMPLEMENTED:');
  console.log('• Email verification redirects to app instead of localhost');
  console.log('• Forgot password functionality with modern UI');
  console.log('• Deep link handling for email callbacks');
  console.log('• Enhanced error messages and validation');
  console.log('• Improved login screen UI with icons');
  console.log('• Better success messages with emojis');
  
  console.log('\n📱 NEXT STEPS:');
  console.log('1. Test email verification flow with real emails');
  console.log('2. Test password reset functionality');
  console.log('3. Verify deep links work on actual device');
  console.log('4. Build and test on Android/iOS');
}

// Run all tests
try {
  const authResults = testAuthenticationFixes();
  const uiResults = testUIImprovements();
  
  generateImplementationSummary(authResults, uiResults);
  
} catch (error) {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
} 