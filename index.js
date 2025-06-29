import { registerRootComponent } from 'expo';
import App from './App';

// Sentry initialization is handled by the Sentry plugin in app.config.js,
// but you can still use the Sentry object for custom reporting.

// Polyfill for setImmediate for web compatibility
if (typeof setImmediate === 'undefined') {
  global.setImmediate = (callback, ...args) => {
    return setTimeout(callback, 0, ...args);
  };
}

if (typeof clearImmediate === 'undefined') {
  global.clearImmediate = (id) => {
    clearTimeout(id);
  };
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

