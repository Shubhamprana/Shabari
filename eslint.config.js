// https://docs.expo.dev/guides/using-eslint/
const globals = require("globals");
const tseslint = require("typescript-eslint");
const eslintReact = require("eslint-plugin-react/configs/recommended");
const expoConfig = require('eslint-config-expo/flat');
const reactNativePlugin = require('@react-native/eslint-plugin');

module.exports = tseslint.config(
  ...expoConfig,
  ...tseslint.configs.recommended,
  {
      ...eslintReact,
      files: ["**/*.{js,jsx,ts,tsx}"],
      languageOptions: {
          ...eslintReact.languageOptions,
          globals: {
              ...globals.browser,
          },
      },
      rules: {
        ...eslintReact.rules,
        // Add custom rules here
      }
  },
  {
    plugins: {
      '@react-native': reactNativePlugin,
    },
    rules: reactNativePlugin.configs.all.rules,
  },
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*'],
  }
);
