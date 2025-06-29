const fs = require('fs');
const path = require('path');

// Update gradle.properties
const gradlePropertiesPath = path.join(__dirname, 'android', 'gradle.properties');
let gradleProperties = fs.existsSync(gradlePropertiesPath) 
  ? fs.readFileSync(gradlePropertiesPath, 'utf8')
  : '';

// Add or update SDK versions
const propertiesToUpdate = {
  'android.compileSdkVersion': '35',
  'android.targetSdkVersion': '34',
  'android.buildToolsVersion': '35.0.0'
};

Object.entries(propertiesToUpdate).forEach(([key, value]) => {
  if (gradleProperties.includes(key)) {
    gradleProperties = gradleProperties.replace(
      new RegExp(`${key}=.*`),
      `${key}=${value}`
    );
  } else {
    gradleProperties += `\n${key}=${value}`;
  }
});

fs.writeFileSync(gradlePropertiesPath, gradleProperties);

console.log('✅ Updated Android SDK versions successfully');
console.log('Please rebuild your project now.'); 