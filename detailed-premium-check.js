/**
 * DETAILED PREMIUM RESTRICTIONS CHECK
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DETAILED PREMIUM RESTRICTIONS CHECK\n');

const dashboardPath = path.join(__dirname, 'src/screens/DashboardScreen.tsx');
if (fs.existsSync(dashboardPath)) {
    const content = fs.readFileSync(dashboardPath, 'utf8');
    
    // Find all SMS Scanner sections
    const smsScannerMatches = content.match(/SMS Scanner[\s\S]*?<\/TouchableOpacity>/g);
    
    console.log(`Found ${smsScannerMatches ? smsScannerMatches.length : 0} SMS Scanner sections`);
    
    if (smsScannerMatches) {
        smsScannerMatches.forEach((match, index) => {
            console.log(`\nSMS Scanner Section ${index + 1}:`);
            console.log('=====================================');
            
            const hasPremiumCheck = match.includes('isPremium');
            const hasLockedCard = match.includes('lockedCard');
            const hasLockBadge = match.includes('lockBadge');
            const hasUpgradePrompt = match.includes('showPremiumUpgrade');
            const hasPremiumOnly = match.includes('Premium only');
            
            console.log(`  Premium Check: ${hasPremiumCheck ? '✅' : '❌'}`);
            console.log(`  Locked Card: ${hasLockedCard ? '✅' : '❌'}`);
            console.log(`  Lock Badge: ${hasLockBadge ? '✅' : '❌'}`);
            console.log(`  Upgrade Prompt: ${hasUpgradePrompt ? '✅' : '❌'}`);
            console.log(`  Premium Only Text: ${hasPremiumOnly ? '✅' : '❌'}`);
            
            if (hasPremiumCheck && hasLockedCard && hasLockBadge && hasUpgradePrompt && hasPremiumOnly) {
                console.log(`  Status: ✅ PROPERLY RESTRICTED`);
            } else {
                console.log(`  Status: ❌ NOT PROPERLY RESTRICTED`);
            }
        });
    }
}
