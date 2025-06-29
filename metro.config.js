// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 1. Watchman configuration
config.watchFolders = [__dirname];

// 2. Blacklist any macOS specific directories from the watch list
config.resolver.blacklistRE = /.*resolver-binding-darwin-arm64.*/;

// 3. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  require('path').resolve(__dirname, 'node_modules'),
];

// Configure for AndroidX compatibility
config.resolver.platforms = ['android', 'native', 'web'];

// Add resolver for legacy support libraries
config.resolver.alias = {
  'android.support.v4': 'androidx.legacy',
  'android.support.annotation': 'androidx.annotation',
  'android.support.compat': 'androidx.core'
};

// Add TypeScript support
config.resolver.sourceExts.push('ts', 'tsx');

module.exports = config;
