const fs = require('fs');
const path = require('path');

// Update build.gradle
const buildGradlePath = path.join(__dirname, 'android', 'build.gradle');
let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

// Update to a stable NDK version
const oldNdkVersion = /ndkVersion = ".*"/;
const newNdkVersion = 'ndkVersion = "25.1.8937393"';

buildGradle = buildGradle.replace(oldNdkVersion, newNdkVersion);

fs.writeFileSync(buildGradlePath, buildGradle);

console.log('✅ Updated NDK version successfully');
console.log('Please make sure to install NDK 25.1.8937393 using Android Studio SDK Manager');
console.log('Then rebuild your project.'); 