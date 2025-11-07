#!/usr/bin/env node

/**
 * Restore App Permission Scanning Section
 * 
 * This script restores the proper app permission scanning section
 * in EnhancedDeepScanService without any mock data
 */

const fs = require('fs');

console.log('🔧 Restoring App Permission Scanning Section...\n');

// Read the current file
const filePath = 'src/services/EnhancedDeepScanService.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Find where to insert the app permission scanning section
const insertPoint = content.indexOf('// Stage 6: Final Analysis');
if (insertPoint === -1) {
  console.log('❌ Could not find insertion point');
  process.exit(1);
}

// Create the proper app permission scanning section
const appPermissionSection = `
      // Stage 5: App Permission Analysis (if enabled)
      let appPermissionScanResult: AppPermissionScanResult | undefined;
      
      if (scanConfig.scanAppPermissions) {
        this.notifyProgress(onProgress, {
          stage: 'analyzing_apps',
          currentDirectory: '',
          currentFile: '',
          filesScanned: totalFilesScanned,
          totalFiles: totalFilesScanned,
          threatsFound: threatsDetected.length,
          quarantinedFiles: quarantinedCount,
          percentage: 85,
          message: 'Analyzing installed apps for risky permissions...',
          appsScanned: 0,
          totalApps: 0
        });

        try {
          console.log('🔍 ENHANCED: Starting app permission analysis...');
          appPermissionScanResult = await this.appPermissionAnalyzer.scanAllApps();
          
          console.log('✅ ENHANCED: App permission analysis complete:', {
            totalApps: appPermissionScanResult.totalApps,
            riskyApps: appPermissionScanResult.riskyApps,
            criticalApps: appPermissionScanResult.criticalApps,
            highRiskApps: appPermissionScanResult.highRiskApps
          });

          this.notifyProgress(onProgress, {
            stage: 'analyzing_apps',
            currentDirectory: '',
            currentFile: '',
            filesScanned: totalFilesScanned,
            totalFiles: totalFilesScanned,
            threatsFound: threatsDetected.length,
            quarantinedFiles: quarantinedCount,
            percentage: 92,
            message: \`App analysis complete: \${appPermissionScanResult.riskyApps} risky apps found\`,
            appsScanned: appPermissionScanResult.totalApps,
            totalApps: appPermissionScanResult.totalApps
          });

        } catch (error) {
          console.error('❌ ENHANCED: App permission analysis failed:', error);
          Sentry.captureException(error, { tags: { service: 'enhancedAppPermissionAnalysis' } });
          
          // Don't create fallback data - let it remain undefined
          // This will show "App Permission Analysis Unavailable" in UI
          appPermissionScanResult = undefined;
          
          this.notifyProgress(onProgress, {
            stage: 'analyzing_apps',
            currentDirectory: '',
            currentFile: '',
            filesScanned: totalFilesScanned,
            totalFiles: totalFilesScanned,
            threatsFound: threatsDetected.length,
            quarantinedFiles: quarantinedCount,
            percentage: 92,
            message: 'App analysis failed - native module not available'
          });
        }
      }

`;

// Insert the section before "Stage 6: Final Analysis"
const beforeInsertion = content.substring(0, insertPoint);
const afterInsertion = content.substring(insertPoint);

const updatedContent = beforeInsertion + appPermissionSection + afterInsertion;

// Write the updated content
fs.writeFileSync(filePath, updatedContent);

console.log('✅ App Permission Scanning Section Restored');
console.log('\n📋 Key Features:');
console.log('  ✅ No mock data - only real Android app permission data');
console.log('  ✅ Proper error handling when native module fails');
console.log('  ✅ Shows "App Permission Analysis Unavailable" when module not available');
console.log('  ✅ Maintains app credibility and value');

console.log('\n🎯 Result:');
console.log('  - If native module works: Shows real app permission data');
console.log('  - If native module fails: Shows "Unavailable" message');
console.log('  - No fake/mock data that would decrease app value');

console.log('\n✨ App Permission Scanner now uses only REAL data!');
