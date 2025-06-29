module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'react' }]
    ],
    plugins: [
      // Required for Reanimated 3 - this should be last
      'react-native-reanimated/plugin',
    ],
  };
}; 