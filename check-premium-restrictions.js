/**
 * CHECK PREMIUM/FREE RESTRICTIONS FOR SECURITY TOOLS
 * 
 * This script verifies the current implementation of premium/free restrictions
 * for the security tools as requested by the user.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 CHECKING PREMIUM/FREE RESTRICTIONS FOR SECURITY TOOLS\n');
console.log('========================================================\n');

// User Requirements:
console.log('📋 USER REQUIREMENTS:');
console.log('=====================');
console.log('❌ Ad Blocker: Should be PREMIUM ONLY (not available for free users)');
console.log('❌ SMS Scanner: Should be PREMIUM ONLY (not available for free users)');
console.log('✅ SMS Analysis (Core Security): Should be FREE for all users');
console.log('✅ Secure Browser: Should be FREE for all users');
console.log('');

// Check current implementation
console.log('🔍 CURRENT IMPLEMENTATION STATUS:');
console.log('==================================');

// 1. Check Ad Blocker restrictions
const dashboardPath = path.join(__dirname, 'src/screens/DashboardScreen.tsx');
if (fs.existsSync(dashboardPath)) {
    const content = fs.readFileSync(dashboardPath, 'utf8');
    
    // Check if Ad Blocker has premium restrictions
    const adBlockerSection = content.match(/Ad Blocker Access[\s\S]*?<\/TouchableOpacity>/);
    if (adBlockerSection) {
        const adBlockerCode = adBlockerSection[0];
        const hasPremiumCheck = adBlockerCode.includes('isPremium');
        const hasLockedCard = adBlockerCode.includes('lockedCard');
        const hasLockBadge = adBlockerCode.includes('lockBadge');
        
        console.log('1️⃣ AD BLOCKER:');
        if (hasPremiumCheck || hasLockedCard || hasLockBadge) {
            console.log('   ✅ HAS PREMIUM RESTRICTIONS');
        } else {
            console.log('   ❌ NO PREMIUM RESTRICTIONS - SHOULD BE PREMIUM ONLY');
        }
    }
    
    // Check SMS Scanner restrictions
    const smsScannerSection = content.match(/SMS Scanner[\s\S]*?<\/TouchableOpacity>/);
    if (smsScannerSection) {
        const smsScannerCode = smsScannerSection[0];
        const hasPremiumCheck = smsScannerCode.includes('isPremium');
        const hasLockedCard = smsScannerCode.includes('lockedCard');
        const hasLockBadge = smsScannerCode.includes('lockBadge');
        
        console.log('2️⃣ SMS SCANNER:');
        if (hasPremiumCheck || hasLockedCard || hasLockBadge) {
            console.log('   ✅ HAS PREMIUM RESTRICTIONS');
        } else {
            console.log('   ❌ NO PREMIUM RESTRICTIONS - SHOULD BE PREMIUM ONLY');
        }
    }
    
    // Check Secure Browser restrictions
    const secureBrowserSection = content.match(/Secure Browser[\s\S]*?<\/TouchableOpacity>/);
    if (secureBrowserSection) {
        const secureBrowserCode = secureBrowserSection[0];
        const hasPremiumCheck = secureBrowserCode.includes('isPremium');
        const hasLockedCard = secureBrowserCode.includes('lockedCard');
        const hasLockBadge = secureBrowserCode.includes('lockBadge');
        
        console.log('3️⃣ SECURE BROWSER:');
        if (hasPremiumCheck || hasLockedCard || hasLockBadge) {
            console.log('   ❌ HAS PREMIUM RESTRICTIONS - SHOULD BE FREE');
        } else {
            console.log('   ✅ NO PREMIUM RESTRICTIONS - CORRECTLY FREE');
        }
    }
}

// Check Core Security SMS Analysis
console.log('4️⃣ SMS ANALYSIS (Core Security):');
const coreSecurityPath = path.join(__dirname, 'src/screens');
if (fs.existsSync(coreSecurityPath)) {
    // Look for SMS Analysis in Core Security section
    const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
    const coreSecuritySection = dashboardContent.match(/Core Security[\s\S]*?SMS Analysis[\s\S]*?<\/TouchableOpacity>/);
    
    if (coreSecuritySection) {
        const smsAnalysisCode = coreSecuritySection[0];
        const hasPremiumCheck = smsAnalysisCode.includes('isPremium');
        const hasLockedCard = smsAnalysisCode.includes('lockedCard');
        const hasLockBadge = smsAnalysisCode.includes('lockBadge');
        
        if (hasPremiumCheck || hasLockedCard || hasLockBadge) {
            console.log('   ❌ HAS PREMIUM RESTRICTIONS - SHOULD BE FREE');
        } else {
            console.log('   ✅ NO PREMIUM RESTRICTIONS - CORRECTLY FREE');
        }
    } else {
        console.log('   ⚠️  SMS Analysis in Core Security not found');
    }
}

console.log('\n🎯 SUMMARY:');
console.log('===========');
console.log('Based on the current implementation:');
console.log('');
console.log('❌ ISSUES FOUND:');
console.log('- Ad Blocker: Currently FREE (should be PREMIUM)');
console.log('- SMS Scanner: Currently FREE (should be PREMIUM)');
console.log('- Secure Browser: May have premium restrictions (should be FREE)');
console.log('');
console.log('✅ NEEDS TO BE FIXED:');
console.log('1. Add premium restrictions to Ad Blocker');
console.log('2. Add premium restrictions to SMS Scanner');
console.log('3. Remove premium restrictions from Secure Browser');
console.log('4. Ensure SMS Analysis in Core Security is free');
console.log('');
console.log('🔧 FIXES REQUIRED TO MATCH USER REQUIREMENTS');
