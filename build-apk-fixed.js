const { exec } = require('child_process');
const fs = require('fs');

console.log('🔧 Building APK with fixes...');
console.log('📱 Features included:');
console.log('   ✅ File scanner initialization fix');
console.log('   ✅ Popup removal'); 
console.log('   ✅ Share intent improvements');
console.log('');

// Temporarily update the EAS config to avoid TS issues
const easConfig = {
  "cli": {
    "version": ">= 3.13.3",
    "appVersionSource": "remote"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "env": {
          "NODE_ENV": "production"
        }
      }
    }
  }
};

fs.writeFileSync('eas-temp.json', JSON.stringify(easConfig, null, 2));

console.log('🚀 Starting EAS build...');

const buildCommand = 'npx eas-cli build -p android --profile preview --config eas-temp.json';

exec(buildCommand, (error, stdout, stderr) => {
  // Clean up temp file
  if (fs.existsSync('eas-temp.json')) {
    fs.unlinkSync('eas-temp.json');
  }

  if (error) {
    console.error('❌ Build failed:', error.message);
    console.log('📋 Please check the EAS dashboard for detailed logs');
    return;
  }

  if (stderr) {
    console.log('⚠️ Build warnings:', stderr);
  }

  console.log('✅ Build output:', stdout);
}); 