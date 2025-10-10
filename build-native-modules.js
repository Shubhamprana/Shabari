#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building native modules for EAS...');

try {
  // Build YARA Engine
  console.log('📦 Building YARA Engine...');
  const yaraEnginePath = path.join(__dirname, 'react-native-yara-engine', 'android');
  
  if (fs.existsSync(yaraEnginePath)) {
    execSync('cd react-native-yara-engine\\android && gradlew.bat assembleRelease', { 
      stdio: 'inherit',
      cwd: __dirname,
      shell: true
    });
    
    // Copy AAR to dist folder
    const aarSource = path.join(yaraEnginePath, 'build', 'outputs', 'aar', 'android-release.aar');
    const aarDest = path.join(__dirname, 'react-native-yara-engine', 'dist', 'react-native-yara-engine-1.0.0.aar');
    
    if (fs.existsSync(aarSource)) {
      fs.copyFileSync(aarSource, aarDest);
      console.log('✅ YARA Engine AAR copied to dist/');
    } else {
      console.log('⚠️ YARA Engine AAR not found, but continuing...');
    }
  } else {
    console.log('⚠️ YARA Engine Android folder not found');
  }

  // Build Proxy Engine
  console.log('📦 Building Proxy Engine...');
  const proxyEnginePath = path.join(__dirname, 'react-native-proxy-engine', 'android');
  
  if (fs.existsSync(proxyEnginePath)) {
    execSync('cd react-native-proxy-engine\\android && gradlew.bat assembleRelease', { 
      stdio: 'inherit',
      cwd: __dirname,
      shell: true
    });
    console.log('✅ Proxy Engine built successfully');
  } else {
    console.log('⚠️ Proxy Engine Android folder not found');
  }

  console.log('🎉 Native modules build completed!');
  console.log('📱 You can now run: npx eas build -p android --profile production');

} catch (error) {
  console.error('❌ Error building native modules:', error.message);
  process.exit(1);
}
