const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Building REAL YARA Engine AAR with Native Code...');

const yaraModulePath = path.join(__dirname, 'react-native-yara-engine');
const distDir = path.join(yaraModulePath, 'dist');

if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Clean previous builds
if (fs.existsSync(path.join(yaraModulePath, 'android', 'build'))) {
    console.log('🧹 Cleaning previous builds...');
    fs.rmSync(path.join(yaraModulePath, 'android', 'build'), { recursive: true, force: true });
}

// Build the actual YARA engine
console.log('🔨 Building YARA engine native code...');
try {
    process.chdir(path.join(yaraModulePath, 'android'));
    
    // Clean and build the YARA engine
    console.log('  - Running Gradle clean...');
    if (process.platform === 'win32') {
        execSync('gradlew.bat clean', { stdio: 'inherit' });
    } else {
        execSync('./gradlew clean', { stdio: 'inherit' });
    }
    
    console.log('  - Building YARA engine AAR...');
    if (process.platform === 'win32') {
        execSync('gradlew.bat assembleRelease', { stdio: 'inherit' });
    } else {
        execSync('./gradlew assembleRelease', { stdio: 'inherit' });
    }
    
    // Find the generated AAR file
    const aarPath = path.join(yaraModulePath, 'android', 'build', 'outputs', 'aar', 'react-native-yara-engine-release.aar');
    
    if (fs.existsSync(aarPath)) {
        // Copy to dist directory with correct name
        const targetAarPath = path.join(distDir, 'react-native-yara-engine-1.0.0.aar');
        fs.copyFileSync(aarPath, targetAarPath);
        
        const stats = fs.statSync(targetAarPath);
        console.log('✅ Real YARA Engine AAR built successfully!');
        console.log(`📦 AAR size: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log('🎯 Contains real native YARA engine code');
        
        // Copy to app libs directory
        const appLibsPath = path.join(__dirname, 'android', 'app', 'libs');
        if (!fs.existsSync(appLibsPath)) {
            fs.mkdirSync(appLibsPath, { recursive: true });
        }
        fs.copyFileSync(targetAarPath, path.join(appLibsPath, 'react-native-yara-engine-1.0.0.aar'));
        console.log('📁 Copied to android/app/libs/');
        
    } else {
        console.error('❌ AAR file not found after build');
        console.log('Expected location:', aarPath);
    }
    
} catch (error) {
    console.error('❌ Build failed:', error.message);
    console.log('💡 This might be due to missing Android NDK or CMake');
    console.log('💡 Make sure Android Studio and NDK are properly installed');
}

process.chdir(__dirname);
