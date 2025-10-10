declare module 'react-native-proxy-engine' {
  export interface ProxyConfig {
    host: string;
    port: number;
    username?: string;
    password?: string;
    type?: 'HTTP' | 'HTTPS' | 'SOCKS4' | 'SOCKS5';
  }

  export interface ProxyResponse {
    success: boolean;
    message?: string;
    data?: any;
  }

  export interface ReactNativeProxyEngine {
    /**
     * Start the proxy server with the given configuration
     */
    startProxy(config: ProxyConfig): Promise<ProxyResponse>;

    /**
     * Stop the proxy server
     */
    stopProxy(): Promise<ProxyResponse>;

    /**
     * Get the current proxy status
     */
    getProxyStatus(): Promise<ProxyResponse>;

    /**
     * Set proxy configuration
     */
    setProxyConfig(config: ProxyConfig): Promise<ProxyResponse>;

    /**
     * Make a request through the proxy
     */
    makeProxyRequest(url: string, options?: RequestInit): Promise<ProxyResponse>;

    /**
     * Get proxy statistics
     */
    getProxyStats(): Promise<ProxyResponse>;
  }

  const ReactNativeProxyEngine: ReactNativeProxyEngine;
  export default ReactNativeProxyEngine;
}

