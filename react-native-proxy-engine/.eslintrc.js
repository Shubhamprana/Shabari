module.exports = {
  root: true,
  extends: [
    '@react-native-community',
    'eslint:recommended',
  ],
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    babelOptions: {
      presets: ['@babel/preset-react'],
    },
  },
  rules: {
    'prettier/prettier': 'error',
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'warn',
    'react-native/no-raw-text': 'off',
  },
  env: {
    'react-native/react-native': true,
    jest: true,
    node: true,
  },
  globals: {
    __DEV__: 'readonly',
  },
};

