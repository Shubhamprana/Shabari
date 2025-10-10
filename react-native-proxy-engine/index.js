// index.js

import { NativeModules } from 'react-native';

const { ReactNativeProxyEngine } = NativeModules;

if (!ReactNativeProxyEngine) {
  throw new Error('ReactNativeProxyEngine native module is not available. Make sure you have properly linked the library.');
}

export default {
  /**
   * Start the proxy server with the given configuration
   * @param {Object} config - Proxy configuration
   * @param {string} config.host - Proxy host (default: '127.0.0.1')
   * @param {number} config.port - Proxy port (default: 8080)
   * @param {string} [config.username] - Username for authentication
   * @param {string} [config.password] - Password for authentication
   * @param {string} [config.type] - Proxy type: 'HTTP', 'HTTPS', 'SOCKS4', 'SOCKS5' (default: 'HTTP')
   * @returns {Promise<Object>} Response object with success status and data
   */
  startProxy: (config) => ReactNativeProxyEngine.startProxy(config),

  /**
   * Stop the proxy server
   * @returns {Promise<Object>} Response object with success status
   */
  stopProxy: () => ReactNativeProxyEngine.stopProxy(),

  /**
   * Get the current proxy status
   * @returns {Promise<Object>} Response object with proxy status data
   */
  getProxyStatus: () => ReactNativeProxyEngine.getProxyStatus(),

  /**
   * Set proxy configuration
   * @param {Object} config - Proxy configuration
   * @returns {Promise<Object>} Response object with success status
   */
  setProxyConfig: (config) => ReactNativeProxyEngine.setProxyConfig(config),

  /**
   * Make a request through the proxy
   * @param {string} url - Request URL
   * @param {Object} [options] - Request options
   * @param {string} [options.method] - HTTP method (default: 'GET')
   * @param {Object} [options.headers] - Request headers
   * @param {string} [options.body] - Request body
   * @returns {Promise<Object>} Response object with request result
   */
  makeProxyRequest: (url, options) => ReactNativeProxyEngine.makeProxyRequest(url, options),

  /**
   * Get proxy statistics
   * @returns {Promise<Object>} Response object with proxy statistics
   */
  getProxyStats: () => ReactNativeProxyEngine.getProxyStats(),
};


