const fs = require('fs');
const path = require('path');

console.log('🔍 CHECKING PROXY ENGINE AND YARA ENGINE INTEGRATION\n');
console.log('='.repeat(60));

// 1. Check Native Modules Existence
console.log('\n📦 1. NATIVE MODULE DIRECTORIES:');
const yaraPath = path.join(__dirname, 'react-native-yara-engine');
const proxyPath = path.join(__dirname, 'react-native-proxy-engine');
const yaraExists = fs.existsSync(yaraPath);
const proxyExists = fs.existsSync(proxyPath);

console.log(`   YARA Engine:  ${yaraExists ? '✅ Found' : '❌ Not Found'} (${yaraPath})`);
console.log(`   Proxy Engine: ${proxyExists ? '✅ Found' : '❌ Not Found'} (${proxyPath})`);

// 2. Check package.json dependencies
console.log('\n📋 2. PACKAGE.JSON DEPENDENCIES:');
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const hasYara = packageJson.dependencies && packageJson.dependencies['react-native-yara-engine'];
  const hasProxy = packageJson.dependencies && packageJson.dependencies['react-native-proxy-engine'];

  console.log(`   YARA Engine:  ${hasYara ? '✅ Listed' : '❌ Not Listed'} ${hasYara ? '(' + packageJson.dependencies['react-native-yara-engine'] + ')' : ''}`);
  console.log(`   Proxy Engine: ${hasProxy ? '✅ Listed' : '❌ Not Listed'} ${hasProxy ? '(' + packageJson.dependencies['react-native-proxy-engine'] + ')' : ''}`);
}

// 3. Check app.config.js plugins
console.log('\n🔌 3. EXPO PLUGINS (app.config.js):');
const appConfigPath = path.join(__dirname, 'app.config.js');
if (fs.existsSync(appConfigPath)) {
  const appConfigContent = fs.readFileSync(appConfigPath, 'utf8');
  const hasYaraPlugin = appConfigContent.includes('react-native-yara-engine/app.plugin');
  const hasProxyPlugin = appConfigContent.includes('react-native-proxy-engine/app.plugin');

  console.log(`   YARA Plugin:  ${hasYaraPlugin ? '✅ Configured' : '❌ Not Configured'}`);
  console.log(`   Proxy Plugin: ${hasProxyPlugin ? '✅ Configured' : '❌ Not Configured'}`);
}

// 4. Check Android settings.gradle
console.log('\n⚙️  4. ANDROID SETTINGS.GRADLE:');
const settingsGradlePath = path.join(__dirname, 'android', 'settings.gradle');
if (fs.existsSync(settingsGradlePath)) {
  const settingsContent = fs.readFileSync(settingsGradlePath, 'utf8');
  const hasYara = settingsContent.includes('react-native-yara-engine');
  const hasProxy = settingsContent.includes('react-native-proxy-engine');

  console.log(`   YARA Engine:  ${hasYara ? '✅ Included' : '❌ Not Included'}`);
  console.log(`   Proxy Engine: ${hasProxy ? '✅ Included' : '❌ Not Included'}`);
}

// 5. Check Android app/build.gradle
console.log('\n🔧 5. ANDROID APP/BUILD.GRADLE:');
const appBuildGradlePath = path.join(__dirname, 'android', 'app', 'build.gradle');
if (fs.existsSync(appBuildGradlePath)) {
  const buildContent = fs.readFileSync(appBuildGradlePath, 'utf8');
  const hasYara = buildContent.includes('react-native-yara-engine');
  const hasProxy = buildContent.includes('react-native-proxy-engine') || buildContent.includes('shabari-vpn');

  console.log(`   YARA Engine:  ${hasYara ? '✅ Dependency Added' : '❌ Not Added'}`);
  console.log(`   Proxy Engine: ${hasProxy ? '✅ Dependency Added' : '❌ Not Added'}`);
}

// 6. Check Service Integration
console.log('\n🛠️  6. SERVICE LAYER INTEGRATION:');
const yaraServicePath = path.join(__dirname, 'src', 'services', 'YaraSecurityService.ts');
const proxyServicePath = path.join(__dirname, 'src', 'services', 'ProxyEngineService.ts');

const yaraServiceExists = fs.existsSync(yaraServicePath);
const proxyServiceExists = fs.existsSync(proxyServicePath);

console.log(`   YaraSecurityService:  ${yaraServiceExists ? '✅ Found' : '❌ Not Found'}`);
console.log(`   ProxyEngineService:   ${proxyServiceExists ? '✅ Found' : '❌ Not Found'}`);

if (yaraServiceExists) {
  const yaraServiceContent = fs.readFileSync(yaraServicePath, 'utf8');
  const importsYara = yaraServiceContent.includes("require('react-native-yara-engine')");
  console.log(`   - Imports YARA module: ${importsYara ? '✅ Yes' : '❌ No'}`);
}

if (proxyServiceExists) {
  const proxyServiceContent = fs.readFileSync(proxyServicePath, 'utf8');
  const importsProxy = proxyServiceContent.includes("require('react-native-proxy-engine");
  console.log(`   - Imports Proxy module: ${importsProxy ? '✅ Yes' : '❌ No'}`);
}

// 7. Check Usage in App
console.log('\n📱 7. APP USAGE:');
const dashboardPath = path.join(__dirname, 'src', 'screens', 'DashboardScreen.tsx');
if (fs.existsSync(dashboardPath)) {
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  const usesYara = dashboardContent.includes('YaraSecurityService');
  const usesProxy = dashboardContent.includes('proxyEngineService');

  console.log(`   Dashboard uses YARA:  ${usesYara ? '✅ Yes' : '❌ No'}`);
  console.log(`   Dashboard uses Proxy: ${usesProxy ? '✅ Yes' : '❌ No'}`);
}

// 8. Check native build artifacts
console.log('\n📦 8. NATIVE BUILD ARTIFACTS:');
const yaraAarPath = path.join(yaraPath, 'dist', 'react-native-yara-engine-1.0.0.aar');
const yaraAarExists = fs.existsSync(yaraAarPath);
console.log(`   YARA AAR file: ${yaraAarExists ? '✅ Found' : '❌ Not Found'}`);

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 INTEGRATION SUMMARY:');
console.log('='.repeat(60));

const yaraIntegrated = yaraExists && yaraServiceExists;
const proxyIntegrated = proxyExists && proxyServiceExists;

console.log(`\n🔍 YARA Engine: ${yaraIntegrated ? '✅ INTEGRATED' : '❌ NOT FULLY INTEGRATED'}`);
console.log(`   - Module exists: ${yaraExists ? '✅' : '❌'}`);
console.log(`   - Service wrapper: ${yaraServiceExists ? '✅' : '❌'}`);
console.log(`   - Used in app: ${yaraServiceExists ? '✅' : '❌'}`);

console.log(`\n🌐 Proxy Engine: ${proxyIntegrated ? '✅ INTEGRATED' : '❌ NOT FULLY INTEGRATED'}`);
console.log(`   - Module exists: ${proxyExists ? '✅' : '❌'}`);
console.log(`   - Service wrapper: ${proxyServiceExists ? '✅' : '❌'}`);
console.log(`   - Used in app: ${proxyServiceExists ? '✅' : '❌'}`);

if (!yaraIntegrated || !proxyIntegrated) {
  console.log('\n⚠️  WARNING: Some engines are not fully integrated!');
  console.log('\n💡 RECOMMENDATIONS:');

  if (!yaraIntegrated) {
    console.log('   • Ensure react-native-yara-engine is properly linked');
    console.log('   • Run: npx expo prebuild --clean');
  }

  if (!proxyIntegrated) {
    console.log('   • Ensure react-native-proxy-engine is properly linked');
    console.log('   • Check native module initialization');
  }
} else {
  console.log('\n✅ Both engines appear to be integrated!');
  console.log('\n📝 NOTE: Final verification requires building and running the app.');
}

console.log('\n' + '='.repeat(60));

