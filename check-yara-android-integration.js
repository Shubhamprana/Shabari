const fs = require('fs');
const path = require('path');

console.log('🔍 Checking YARA Engine Android Integration...\n');

// Check if native module exists
const nativeModulePath = path.join(__dirname, 'react-native-yara-engine');
const moduleExists = fs.existsSync(nativeModulePath);
console.log(`1️⃣ Native Module Directory: ${moduleExists ? '✅ Found' : '❌ Not Found'}`);

// Check Android source files
const androidPath = path.join(nativeModulePath, 'android');
const androidFiles = {
  'build.gradle': path.join(androidPath, 'build.gradle'),
  'YaraModule.java': path.join(androidPath, 'src/main/java/com/shabari/yara/YaraModule.java'),
  'YaraPackage.java': path.join(androidPath, 'src/main/java/com/shabari/yara/YaraPackage.java'),
  'CMakeLists.txt': path.join(androidPath, 'src/main/cpp/CMakeLists.txt'),
  'yara-engine.cpp': path.join(androidPath, 'src/main/cpp/yara-engine.cpp')
};

console.log('\n2️⃣ Android Source Files:');
Object.entries(androidFiles).forEach(([name, filePath]) => {
  const exists = fs.existsSync(filePath);
  console.log(`   ${name}: ${exists ? '✅ Found' : '❌ Not Found'}`);
});

// Check if YaraPackage is registered in MainApplication
const mainAppPaths = [
  path.join(__dirname, 'android/app/src/main/java/com/shabari/MainApplication.java'),
  path.join(__dirname, 'android/app/src/main/java/com/shabari/MainApplication.kt')
];

console.log('\n3️⃣ MainApplication Integration:');
let mainAppFound = false;
let yaraPackageRegistered = false;

for (const mainAppPath of mainAppPaths) {
  if (fs.existsSync(mainAppPath)) {
    mainAppFound = true;
    const content = fs.readFileSync(mainAppPath, 'utf8');
    if (content.includes('YaraPackage') || content.includes('react-native-yara-engine')) {
      yaraPackageRegistered = true;
    }
    console.log(`   MainApplication: ✅ Found (${path.basename(mainAppPath)})`);
    console.log(`   YaraPackage Registration: ${yaraPackageRegistered ? '✅ Registered' : '❌ Not Registered'}`);
    break;
  }
}

if (!mainAppFound) {
  console.log('   MainApplication: ❌ Not Found');
}

// Check settings.gradle
const settingsPath = path.join(__dirname, 'android/settings.gradle');
if (fs.existsSync(settingsPath)) {
  const settingsContent = fs.readFileSync(settingsPath, 'utf8');
  const hasYaraModule = settingsContent.includes('react-native-yara-engine') || 
                        settingsContent.includes(':react-native-yara-engine');
  console.log(`\n4️⃣ settings.gradle:`);
  console.log(`   File exists: ✅`);
  console.log(`   YARA module included: ${hasYaraModule ? '✅ Yes' : '❌ No'}`);
}

// Check if package.json has the dependency
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const hasYaraDep = packageJson.dependencies && 
                     packageJson.dependencies['react-native-yara-engine'];
  console.log(`\n5️⃣ package.json:`);
  console.log(`   YARA dependency: ${hasYaraDep ? '✅ Listed' : '❌ Not Listed'}`);
  if (hasYaraDep) {
    console.log(`   Version: ${packageJson.dependencies['react-native-yara-engine']}`);
  }
}

// Analysis
console.log('\n📊 ANALYSIS:');
console.log('===========');

if (!yaraPackageRegistered && mainAppFound) {
  console.log('\n⚠️  ISSUE FOUND: YaraPackage is not registered in MainApplication!');
  console.log('\n💡 TO FIX:');
  console.log('1. Open android/app/src/main/java/com/shabari/MainApplication.java');
  console.log('2. Add import: import com.shabari.yara.YaraPackage;');
  console.log('3. Add to getPackages(): new YaraPackage()');
  console.log('\n📝 Example:');
  console.log(`
  @Override
  protected List<ReactPackage> getPackages() {
    List<ReactPackage> packages = new PackageList(this).getPackages();
    packages.add(new YaraPackage()); // Add this line
    return packages;
  }
  `);
}

if (!moduleExists) {
  console.log('\n⚠️  ISSUE: Native module directory not found!');
}

console.log('\n🎯 CONCLUSION:');
if (yaraPackageRegistered && moduleExists) {
  console.log('✅ YARA Engine appears to be properly integrated for Android builds.');
  console.log('The native engine will be active when you build an APK.');
} else {
  console.log('❌ YARA Engine is NOT properly integrated for Android builds.');
  console.log('The app will fall back to the mock engine even in production builds.');
}

console.log('\n💡 Note: The native YARA engine only works in:');
console.log('   - Production APK/AAB builds');
console.log('   - Development builds (expo run:android)');
console.log('   - NOT in Expo Go app');
