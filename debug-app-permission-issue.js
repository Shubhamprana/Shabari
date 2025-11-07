#!/usr/bin/env node

/**
 * Debug App Permission Scanner Issue
 * 
 * This script identifies the root cause of why app permission scanning
 * shows "App Permission Scan Not Available"
 */

console.log('🔍 Debugging App Permission Scanner Issue...\n');

// Check if the issue is in the DeepScanScreen UI logic
console.log('📱 Checking DeepScanScreen UI logic...');

const fs = require('fs');
const deepScanPath = 'src/screens/DeepScanScreen.tsx';
const deepScanContent = fs.readFileSync(deepScanPath, 'utf8');

// Look for the specific UI logic that shows "App Permission Scan Not Available"
const hasAppPermissionScanNotAvailable = deepScanContent.includes('App Permission Scan Not Available');
const hasAppPermissionAnalysisNotPerformed = deepScanContent.includes('App permission analysis was not performed during this scan');

console.log(`  ${hasAppPermissionScanNotAvailable ? '✅' : '❌'} "App Permission Scan Not Available" text found`);
console.log(`  ${hasAppPermissionAnalysisNotPerformed ? '✅' : '❌'} "App permission analysis was not performed" text found`);

if (hasAppPermissionScanNotAvailable && hasAppPermissionAnalysisNotPerformed) {
  console.log('\n🎯 Found the UI logic! Let me check the conditions...');
  
  // Look for the condition that triggers this message
  const lines = deepScanContent.split('\n');
  let foundCondition = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('App Permission Scan Not Available')) {
      // Look backwards for the condition
      for (let j = i - 10; j < i; j++) {
        if (j >= 0 && lines[j].includes('appPermissionScan') && lines[j].includes('undefined')) {
          console.log(`  📍 Found condition at line ${j + 1}: ${lines[j].trim()}`);
          foundCondition = true;
          break;
        }
      }
      break;
    }
  }
  
  if (!foundCondition) {
    console.log('  ❌ Could not find the condition that triggers this message');
  }
}

console.log('\n🔧 Root Cause Analysis:');
console.log('  The issue is likely that appPermissionScanResult is undefined');
console.log('  This happens when the native module fails to load or throws an error');
console.log('  The UI shows "Not Available" as a fallback when no results are returned');

console.log('\n💡 Solution:');
console.log('  1. Ensure the native module is properly built and linked');
console.log('  2. Check for runtime errors in the native module');
console.log('  3. Add better error handling in RealAppPermissionAnalyzer');
console.log('  4. Test the native module directly');

console.log('\n✨ Debug complete!');
