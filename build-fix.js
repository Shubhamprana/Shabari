#!/usr/bin/env node
console.log('🔧 BUILD OPTIMIZATION & NATIVE MODULE FIXES');
console.log('============================================\n');

const fs = require('fs');
const path = require('path');

// Step 1: Check current package.json
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

console.log('📦 CURRENT REACT VERSIONS:');
console.log(`React: ${packageJson.dependencies.react}`);
console.log(`React DOM: ${packageJson.dependencies['react-dom']}`);
console.log(`React Native: ${packageJson.dependencies['react-native']}`);
console.log(`Expo: ${packageJson.dependencies.expo}\n`);

// Step 2: Create optimized EAS build profile
console.log('🚀 CREATING OPTIMIZED EAS BUILD PROFILES...\n');

const easJson = {
  cli: {
    version: ">= 0.63.0"
  },
  build: {
    // Development build with native modules
    development: {
      android: {
        buildType: "developmentClient",
        gradleCommand: ":app:assembleDebug",
        distribution: "internal",
        cache: {
          disabled: false
        }
      }
    },
    // Preview build optimized for speed
    preview: {
      android: {
        buildType: "apk",
        gradleCommand: ":app:assembleRelease --no-daemon --max-workers=1",
        distribution: "internal",
        cache: {
          disabled: false
        },
        env: {
          EXPO_OPTIMIZE_ENABLED: "1"
        }
      }
    },
    // Production build
    production: {
      android: {
        buildType: "app-bundle",
        gradleCommand: ":app:bundleRelease --no-daemon",
        distribution: "store",
        cache: {
          disabled: false
        }
      }
    },
    // Minimal build without native modules
    minimal: {
      android: {
        buildType: "apk",
        gradleCommand: ":app:assembleDebug --no-daemon --max-workers=1",
        distribution: "internal",
        cache: {
          disabled: true
        },
        env: {
          EXPO_NO_CAPABILITY_SYNC: "1"
        }
      }
    }
  },
  submit: {
    production: {}
  }
};

fs.writeFileSync('./eas.json', JSON.stringify(easJson, null, 2));
console.log('✅ Created optimized eas.json with multiple build profiles\n');

// Step 3: Create metro config optimization
console.log('⚡ OPTIMIZING METRO CONFIG...\n');

const metroConfig = `const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Optimize for faster builds
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Reduce memory usage
config.maxWorkers = 1;

// Cache optimization
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Ignore problematic modules during build
config.resolver.blockList = [
  // Add any problematic native modules here if needed
];

module.exports = config;
`;

fs.writeFileSync('./metro.config.js', metroConfig);
console.log('✅ Optimized metro.config.js for faster builds\n');

// Step 4: Create build script
console.log('📝 CREATING BUILD SCRIPTS...\n');

const buildScript = `#!/usr/bin/env node
console.log('🚀 Starting optimized EAS build...');

const { execSync } = require('child_process');

function runBuild(profile) {
  try {
    console.log(\`Building with profile: \${profile}\`);
    execSync(\`eas build --platform android --profile \${profile} --non-interactive\`, {
      stdio: 'inherit'
    });
    console.log('✅ Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    return false;
  }
  return true;
}

// Try builds in order of success probability
const profiles = ['minimal', 'preview', 'development'];

for (const profile of profiles) {
  console.log(\`\\n🔄 Attempting build with \${profile} profile...\\n\`);
  if (runBuild(profile)) {
    process.exit(0);
  }
  console.log(\`\\n⚠️ \${profile} build failed, trying next profile...\\n\`);
}

console.log('❌ All build profiles failed');
process.exit(1);
`;

fs.writeFileSync('./smart-build.js', buildScript);
fs.chmodSync('./smart-build.js', '755');
console.log('✅ Created smart-build.js script\n');

// Step 5: Show recommendations
console.log('💡 BUILD RECOMMENDATIONS:\n');
console.log('1. FASTEST BUILD (Minimal features):');
console.log('   eas build --platform android --profile minimal\n');

console.log('2. DEVELOPMENT BUILD (All features):');
console.log('   eas build --platform android --profile development\n');

console.log('3. PREVIEW BUILD (Optimized):');
console.log('   eas build --platform android --profile preview\n');

console.log('4. SMART BUILD (Try all profiles):');
console.log('   node smart-build.js\n');

console.log('🔍 POTENTIAL NATIVE MODULE ISSUES:');
const nativeModules = [
  'react-native-fs',
  'react-native-push-notification',
  'react-native-receive-sharing-intent',
  'react-native-sms-retriever'
];

nativeModules.forEach(module => {
  if (packageJson.dependencies[module]) {
    console.log(`⚠️  ${module} - May require custom development build`);
  }
});

console.log('\n✨ OPTIMIZATION SUMMARY:');
console.log('- Reduced build workers to 1 (memory optimization)');
console.log('- Disabled caching for minimal builds');
console.log('- Added Gradle optimization flags');
console.log('- Created fallback build profiles');
console.log('- Optimized Metro config for faster builds\n');

console.log('🎯 NEXT STEPS:');
console.log('1. Test local build: npm run android');
console.log('2. Try minimal EAS build: eas build --platform android --profile minimal');
console.log('3. If successful, try preview build for full features\n'); 