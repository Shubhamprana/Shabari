/**
 * QUARANTINE FUNCTIONALITY TEST
 * Comprehensive test to check if quarantine folder is working properly
 */

const fs = require('fs');
const path = require('path');

async function testQuarantineFunctionality() {
  console.log('🔍 QUARANTINE FUNCTIONALITY ANALYSIS');
  console.log('=====================================\n');

  // 1. Check if quarantine directory exists
  console.log('1. 📁 Checking Quarantine Directory Structure');
  console.log('----------------------------------------------');

  const possiblePaths = [
    './src/services/FileWatchdogService.tsx',
    './src/screens/QuarantineScreen.tsx',
    './src/screens/DeepScanScreen.tsx',
    './src/services/ScannerService.ts'
  ];

  let quarantinePaths = [];
  let inconsistencies = [];

  for (const filePath of possiblePaths) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // Find quarantine directory paths
      const matches = content.match(/quarantine.*directory|quarantine.*path|`[^`]*quarantine[^`]*`|'[^']*quarantine[^']*'/g);
      if (matches) {
        matches.forEach(match => {
          if (match.includes('documentDirectory') || match.includes('quarantine')) {
            quarantinePaths.push({ file: filePath, path: match.trim() });
          }
        });
      }

      // Check for file system inconsistencies
      if (content.includes('react-native-fs') && content.includes('expo-file-system')) {
        inconsistencies.push(`${filePath}: Uses both RNFS and Expo FileSystem`);
      }

    } catch (error) {
      console.warn(`⚠️ Could not read ${filePath}:`, error.message);
    }
  }

  // 2. Analyze quarantine paths
  console.log('\n2. 📍 Quarantine Path Analysis');
  console.log('------------------------------');

  const pathGroups = {};
  quarantinePaths.forEach(({ file, path }) => {
    const cleanPath = path.replace(/[`']/g, '').replace(/quarantine.*directory|quarantine.*path/, 'QUARANTINE_PATH');
    if (!pathGroups[cleanPath]) {
      pathGroups[cleanPath] = [];
    }
    pathGroups[cleanPath].push(file);
  });

  Object.entries(pathGroups).forEach(([path, files]) => {
    console.log(`📂 Path: ${path}`);
    console.log(`   Used in: ${files.length} files`);
    files.forEach(file => console.log(`   - ${file}`));
    console.log('');
  });

  // 3. Check for file system inconsistencies
  console.log('\n3. 🔧 File System Consistency Check');
  console.log('----------------------------------');

  inconsistencies.forEach(inconsistency => {
    console.log(`⚠️ ${inconsistency}`);
  });

  if (inconsistencies.length === 0) {
    console.log('✅ No file system inconsistencies found');
  }

  // 4. Check if RNFS is properly configured
  console.log('\n4. 📦 React Native FS Configuration');
  console.log('----------------------------------');

  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (dependencies['react-native-fs']) {
      console.log(`✅ react-native-fs version: ${dependencies['react-native-fs']}`);
    } else {
      console.log('❌ react-native-fs not found in dependencies');
    }

    if (dependencies['expo-file-system']) {
      console.log(`✅ expo-file-system version: ${dependencies['expo-file-system']}`);
    } else {
      console.log('❌ expo-file-system not found in dependencies');
    }

  } catch (error) {
    console.error('❌ Could not read package.json:', error.message);
  }

  // 5. Check for potential issues
  console.log('\n5. 🚨 Potential Issues Found');
  console.log('---------------------------');

  if (Object.keys(pathGroups).length > 1) {
    console.log('⚠️ Multiple different quarantine path patterns detected');
    Object.entries(pathGroups).forEach(([path, files]) => {
      console.log(`   - ${path} (${files.length} files)`);
    });
  }

  if (inconsistencies.length > 0) {
    console.log('⚠️ File system inconsistencies detected');
  }

  // 6. Recommendations
  console.log('\n6. 💡 Recommendations');
  console.log('-------------------');

  if (Object.keys(pathGroups).length > 1) {
    console.log('🔧 Standardize quarantine paths across all services');
  }

  if (inconsistencies.length > 0) {
    console.log('🔧 Use consistent file system library (recommend RNFS for all operations)');
  }

  console.log('🔧 Create a unified QuarantineService to handle all quarantine operations');
  console.log('🔧 Add comprehensive error handling and logging');
  console.log('🔧 Add unit tests for quarantine functionality');

  console.log('\n✅ QUARANTINE ANALYSIS COMPLETE');
}

// Run the test
testQuarantineFunctionality().catch(console.error);
