/**
 * SIMPLE PREMIUM TEST
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 SIMPLE PREMIUM TEST\n');

const dashboardPath = path.join(__dirname, 'src/screens/DashboardScreen.tsx');
if (fs.existsSync(dashboardPath)) {
    const content = fs.readFileSync(dashboardPath, 'utf8');
    
    console.log('📋 CHECKING IMPLEMENTATION:');
    console.log('==========================');
    
    // Check if showPremiumUpgrade function exists
    const hasShowPremiumUpgrade = content.includes('const showPremiumUpgrade');
    console.log(`✅ showPremiumUpgrade function: ${hasShowPremiumUpgrade ? 'EXISTS' : 'MISSING'}`);
    
    // Check if lockedCard style exists
    const hasLockedCardStyle = content.includes('lockedCard:');
    console.log(`✅ lockedCard style: ${hasLockedCardStyle ? 'EXISTS' : 'MISSING'}`);
    
    // Check Ad Blocker restrictions
    const adBlockerHasRestrictions = content.includes('Ad Blocker') && 
                                   content.includes('!isPremium') && 
                                   content.includes('showPremiumUpgrade');
    console.log(`✅ Ad Blocker restrictions: ${adBlockerHasRestrictions ? 'IMPLEMENTED' : 'MISSING'}`);
    
    // Check SMS Scanner restrictions
    const smsScannerHasRestrictions = content.includes('SMS Scanner') && 
                                     content.includes('!isPremium') && 
                                     content.includes('showPremiumUpgrade');
    console.log(`✅ SMS Scanner restrictions: ${smsScannerHasRestrictions ? 'IMPLEMENTED' : 'MISSING'}`);
    
    // Check SMS Analysis is free
    const smsAnalysisIsFree = content.includes('SMS Analysis') && 
                             !content.includes('!isPremium') && 
                             !content.includes('showPremiumUpgrade');
    console.log(`✅ SMS Analysis is free: ${smsAnalysisIsFree ? 'YES' : 'NO'}`);
    
    // Check Secure Browser is free
    const secureBrowserIsFree = content.includes('Secure Browser') && 
                               !content.includes('!isPremium') && 
                               !content.includes('showPremiumUpgrade');
    console.log(`✅ Secure Browser is free: ${secureBrowserIsFree ? 'YES' : 'NO'}`);
    
    console.log('\n🎯 SUMMARY:');
    console.log('===========');
    if (hasShowPremiumUpgrade && hasLockedCardStyle && adBlockerHasRestrictions && smsScannerHasRestrictions && smsAnalysisIsFree && secureBrowserIsFree) {
        console.log('✅ ALL PREMIUM RESTRICTIONS CORRECTLY IMPLEMENTED!');
        console.log('✅ Ad Blocker: PREMIUM ONLY');
        console.log('✅ SMS Scanner: PREMIUM ONLY');
        console.log('✅ SMS Analysis: FREE');
        console.log('✅ Secure Browser: FREE');
        console.log('\n🎉 USER REQUIREMENTS FULLY IMPLEMENTED!');
    } else {
        console.log('❌ SOME ISSUES FOUND');
        console.log('❌ Please check the implementation');
    }
}
