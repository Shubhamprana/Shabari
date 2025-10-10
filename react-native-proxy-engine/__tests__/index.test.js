import { NativeModules } from 'react-native';
import ReactNativeProxyEngine from '../index';

const { ReactNativeProxyEngine: MockNativeModule } = NativeModules;

describe('ReactNativeProxyEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startProxy', () => {
    it('should call native startProxy method with config', async () => {
      const config = {
        host: '127.0.0.1',
        port: 8080,
        type: 'HTTP',
      };

      const mockResponse = {
        success: true,
        message: 'Proxy started successfully',
        data: config,
      };

      MockNativeModule.startProxy.mockResolvedValue(mockResponse);

      const result = await ReactNativeProxyEngine.startProxy(config);

      expect(MockNativeModule.startProxy).toHaveBeenCalledWith(config);
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors when starting proxy', async () => {
      const config = { host: '127.0.0.1', port: 8080 };
      const error = new Error('Failed to start proxy');

      MockNativeModule.startProxy.mockRejectedValue(error);

      await expect(ReactNativeProxyEngine.startProxy(config)).rejects.toThrow('Failed to start proxy');
    });
  });

  describe('stopProxy', () => {
    it('should call native stopProxy method', async () => {
      const mockResponse = {
        success: true,
        message: 'Proxy stopped successfully',
      };

      MockNativeModule.stopProxy.mockResolvedValue(mockResponse);

      const result = await ReactNativeProxyEngine.stopProxy();

      expect(MockNativeModule.stopProxy).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getProxyStatus', () => {
    it('should call native getProxyStatus method', async () => {
      const mockResponse = {
        success: true,
        data: {
          isRunning: true,
          requestCount: 10,
          bytesTransferred: 1024,
        },
      };

      MockNativeModule.getProxyStatus.mockResolvedValue(mockResponse);

      const result = await ReactNativeProxyEngine.getProxyStatus();

      expect(MockNativeModule.getProxyStatus).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('setProxyConfig', () => {
    it('should call native setProxyConfig method with config', async () => {
      const config = {
        host: '192.168.1.1',
        port: 9090,
        type: 'SOCKS5',
      };

      const mockResponse = {
        success: true,
        message: 'Config updated successfully',
        data: config,
      };

      MockNativeModule.setProxyConfig.mockResolvedValue(mockResponse);

      const result = await ReactNativeProxyEngine.setProxyConfig(config);

      expect(MockNativeModule.setProxyConfig).toHaveBeenCalledWith(config);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('makeProxyRequest', () => {
    it('should call native makeProxyRequest method with url and options', async () => {
      const url = 'https://api.example.com/data';
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      };

      const mockResponse = {
        success: true,
        data: {
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          body: '{"result": "success"}',
        },
      };

      MockNativeModule.makeProxyRequest.mockResolvedValue(mockResponse);

      const result = await ReactNativeProxyEngine.makeProxyRequest(url, options);

      expect(MockNativeModule.makeProxyRequest).toHaveBeenCalledWith(url, options);
      expect(result).toEqual(mockResponse);
    });

    it('should work with just url parameter', async () => {
      const url = 'https://api.example.com/data';

      const mockResponse = {
        success: true,
        data: {
          status: 200,
          statusText: 'OK',
          body: '{"result": "success"}',
        },
      };

      MockNativeModule.makeProxyRequest.mockResolvedValue(mockResponse);

      const result = await ReactNativeProxyEngine.makeProxyRequest(url);

      expect(MockNativeModule.makeProxyRequest).toHaveBeenCalledWith(url, undefined);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getProxyStats', () => {
    it('should call native getProxyStats method', async () => {
      const mockResponse = {
        success: true,
        data: {
          isRunning: true,
          requestCount: 25,
          bytesTransferred: 2048,
          config: {
            host: '127.0.0.1',
            port: 8080,
            type: 'HTTP',
          },
        },
      };

      MockNativeModule.getProxyStats.mockResolvedValue(mockResponse);

      const result = await ReactNativeProxyEngine.getProxyStats();

      expect(MockNativeModule.getProxyStats).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });
});

