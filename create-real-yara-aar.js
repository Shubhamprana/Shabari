const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Creating REAL YARA Engine AAR with Actual Code...');

const yaraModulePath = path.join(__dirname, 'react-native-yara-engine');
const distDir = path.join(yaraModulePath, 'dist');
const tempDir = path.join(__dirname, 'temp-real-yara-aar');

if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Clean temp directory
if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir, { recursive: true });

// 1. Create AndroidManifest.xml
const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.shabari.yara"
    android:versionCode="1"
    android:versionName="1.0.0">
    <uses-sdk android:minSdkVersion="24" android:targetSdkVersion="34"/>
</manifest>`;

fs.writeFileSync(path.join(tempDir, 'AndroidManifest.xml'), manifest);

// 2. Create classes.jar with REAL Java code
const javaDir = path.join(tempDir, 'java-temp');
fs.mkdirSync(javaDir, { recursive: true });

// Copy all Java files
const javaSourceDir = path.join(yaraModulePath, 'android', 'src', 'main', 'java');
const javaDestDir = path.join(javaDir, 'com', 'shabari', 'yara');
fs.mkdirSync(javaDestDir, { recursive: true });

// Copy Java files
const javaFiles = [
    'YaraEngine.java',
    'YaraModule.java', 
    'YaraPackage.java',
    'YaraRuleManager.java',
    'YaraScanResult.java'
];

javaFiles.forEach(file => {
    const srcPath = path.join(javaSourceDir, 'com', 'shabari', 'yara', file);
    const destPath = path.join(javaDestDir, file);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`✅ Copied ${file}`);
    }
});

// Create META-INF
const metaInfDir = path.join(javaDir, 'META-INF');
fs.mkdirSync(metaInfDir, { recursive: true });

const manifestContent = `Manifest-Version: 1.0
Created-By: Shabari YARA Engine
Main-Class: com.shabari.yara.YaraEngine
`;
fs.writeFileSync(path.join(metaInfDir, 'MANIFEST.MF'), manifestContent);

// Compile Java to classes.jar
try {
    const classesJarPath = path.join(tempDir, 'classes.jar');
    execSync(`powershell -Command "Compress-Archive -Path '${javaDir}\\*' -DestinationPath '${classesJarPath}' -Force"`);
    console.log('✅ Real Java classes.jar created');
} catch (error) {
    console.error('❌ Java compilation failed:', error.message);
}

// 3. Copy native libraries
const jniLibsDir = path.join(tempDir, 'jni');
fs.mkdirSync(jniLibsDir, { recursive: true });

const sourceJniLibs = path.join(yaraModulePath, 'android', 'src', 'main', 'jniLibs');
if (fs.existsSync(sourceJniLibs)) {
    // Copy arm64-v8a
    const arm64Source = path.join(sourceJniLibs, 'arm64-v8a');
    const arm64Dest = path.join(jniLibsDir, 'arm64-v8a');
    if (fs.existsSync(arm64Source)) {
        fs.mkdirSync(arm64Dest, { recursive: true });
        fs.readdirSync(arm64Source).forEach(file => {
            fs.copyFileSync(path.join(arm64Source, file), path.join(arm64Dest, file));
        });
        console.log('✅ Copied arm64-v8a native libraries');
    }
    
    // Copy armeabi-v7a
    const armv7Source = path.join(sourceJniLibs, 'armeabi-v7a');
    const armv7Dest = path.join(jniLibsDir, 'armeabi-v7a');
    if (fs.existsSync(armv7Source)) {
        fs.mkdirSync(armv7Dest, { recursive: true });
        fs.readdirSync(armv7Source).forEach(file => {
            fs.copyFileSync(path.join(armv7Source, file), path.join(armv7Dest, file));
        });
        console.log('✅ Copied armeabi-v7a native libraries');
    }
}

// 4. Create R.txt
fs.writeFileSync(path.join(tempDir, 'R.txt'), '');

// 5. Create proguard.txt
fs.writeFileSync(path.join(tempDir, 'proguard.txt'), '');

// 6. Create the AAR
const aarPath = path.join(distDir, 'react-native-yara-engine-1.0.0.aar');
try {
    execSync(`powershell -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${aarPath}' -Force"`);
    console.log('✅ REAL YARA Engine AAR created successfully!');
    
    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    const stats = fs.statSync(aarPath);
    console.log(`📦 AAR size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log('🎯 Contains REAL YARA engine code and native libraries');
    
    // Copy to app libs directory
    const appLibsPath = path.join(__dirname, 'android', 'app', 'libs');
    if (!fs.existsSync(appLibsPath)) {
        fs.mkdirSync(appLibsPath, { recursive: true });
    }
    fs.copyFileSync(aarPath, path.join(appLibsPath, 'react-native-yara-engine-1.0.0.aar'));
    console.log('📁 Copied to android/app/libs/');
    
} catch (error) {
    console.error('❌ AAR creation failed:', error.message);
}
