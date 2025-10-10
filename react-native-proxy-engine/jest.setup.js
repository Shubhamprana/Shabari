// Mock React Native modules
jest.mock('react-native', () => ({
  NativeModules: {
    ReactNativeProxyEngine: {
      startProxy: jest.fn(),
      stopProxy: jest.fn(),
      getProxyStatus: jest.fn(),
      setProxyConfig: jest.fn(),
      makeProxyRequest: jest.fn(),
      getProxyStats: jest.fn(),
    },
  },
}));

