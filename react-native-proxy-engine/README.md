# React Native Proxy Engine

A powerful, Kotlin-based proxy server engine for React Native applications that provides HTTP, HTTPS, SOCKS4, and SOCKS5 proxy functionality with comprehensive networking capabilities.

## Features

- **Multi-Protocol Support**: HTTP, HTTPS, SOCKS4, and SOCKS5 proxy protocols
- **High Performance**: Built with Kotlin and OkHttp for optimal performance
- **Asynchronous Operations**: Non-blocking proxy operations using Kotlin coroutines
- **Real-time Statistics**: Monitor proxy usage, request counts, and data transfer
- **Expo Compatible**: Includes Expo plugin for managed workflow support
- **TypeScript Support**: Full TypeScript definitions included
- **Cross-Platform**: Android support with iOS coming soon
- **Easy Integration**: Simple JavaScript API for React Native applications

## Installation

### React Native CLI

```bash
npm install react-native-proxy-engine
```

For React Native 0.60+, the library will be automatically linked. For older versions:

```bash
react-native link react-native-proxy-engine
```

### Expo Managed Workflow

```bash
npm install react-native-proxy-engine
```

Add the plugin to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": ["react-native-proxy-engine"]
  }
}
```

## Quick Start

```javascript
import ReactNativeProxyEngine from 'react-native-proxy-engine';

// Start a proxy server
const startProxy = async () => {
  try {
    const result = await ReactNativeProxyEngine.startProxy({
      host: '127.0.0.1',
      port: 8080,
      type: 'HTTP'
    });
    
    if (result.success) {
      console.log('Proxy started successfully:', result.data);
    }
  } catch (error) {
    console.error('Failed to start proxy:', error);
  }
};

// Make a request through the proxy
const makeRequest = async () => {
  try {
    const result = await ReactNativeProxyEngine.makeProxyRequest(
      'https://api.example.com/data',
      {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer token'
        }
      }
    );
    
    if (result.success) {
      console.log('Response:', result.data);
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
};
```

## API Reference

### Configuration Types

#### ProxyConfig

```typescript
interface ProxyConfig {
  host: string;          // Proxy server host (default: '127.0.0.1')
  port: number;          // Proxy server port (default: 8080)
  username?: string;     // Optional authentication username
  password?: string;     // Optional authentication password
  type?: 'HTTP' | 'HTTPS' | 'SOCKS4' | 'SOCKS5'; // Proxy type (default: 'HTTP')
}
```

#### ProxyResponse

```typescript
interface ProxyResponse {
  success: boolean;      // Operation success status
  message?: string;      // Optional status message
  data?: any;           // Optional response data
}
```

### Methods

#### startProxy(config: ProxyConfig): Promise<ProxyResponse>

Starts the proxy server with the specified configuration.

**Parameters:**
- `config`: Proxy configuration object

**Returns:**
- Promise resolving to ProxyResponse with startup status

**Example:**
```javascript
const result = await ReactNativeProxyEngine.startProxy({
  host: '0.0.0.0',
  port: 8080,
  type: 'HTTP'
});
```

#### stopProxy(): Promise<ProxyResponse>

Stops the currently running proxy server.

**Returns:**
- Promise resolving to ProxyResponse with shutdown status

**Example:**
```javascript
const result = await ReactNativeProxyEngine.stopProxy();
```

#### getProxyStatus(): Promise<ProxyResponse>

Retrieves the current status of the proxy server.

**Returns:**
- Promise resolving to ProxyResponse with status data

**Example:**
```javascript
const result = await ReactNativeProxyEngine.getProxyStatus();
if (result.success) {
  console.log('Is running:', result.data.isRunning);
  console.log('Request count:', result.data.requestCount);
}
```

#### setProxyConfig(config: ProxyConfig): Promise<ProxyResponse>

Updates the proxy configuration without restarting the server.

**Parameters:**
- `config`: New proxy configuration

**Returns:**
- Promise resolving to ProxyResponse with update status

**Example:**
```javascript
const result = await ReactNativeProxyEngine.setProxyConfig({
  host: '192.168.1.100',
  port: 9090,
  type: 'SOCKS5'
});
```

#### makeProxyRequest(url: string, options?: RequestOptions): Promise<ProxyResponse>

Makes an HTTP request through the proxy server.

**Parameters:**
- `url`: Target URL for the request
- `options`: Optional request configuration

**RequestOptions:**
```typescript
interface RequestOptions {
  method?: string;                    // HTTP method (default: 'GET')
  headers?: { [key: string]: string }; // Request headers
  body?: string;                      // Request body for POST/PUT
}
```

**Returns:**
- Promise resolving to ProxyResponse with request result

**Example:**
```javascript
const result = await ReactNativeProxyEngine.makeProxyRequest(
  'https://httpbin.org/post',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ key: 'value' })
  }
);
```

#### getProxyStats(): Promise<ProxyResponse>

Retrieves detailed statistics about proxy usage.

**Returns:**
- Promise resolving to ProxyResponse with statistics data

**Example:**
```javascript
const result = await ReactNativeProxyEngine.getProxyStats();
if (result.success) {
  console.log('Total requests:', result.data.requestCount);
  console.log('Bytes transferred:', result.data.bytesTransferred);
  console.log('Current config:', result.data.config);
}
```

## Proxy Types

### HTTP Proxy

Standard HTTP proxy for web traffic. Supports both HTTP and HTTPS connections through CONNECT tunneling.

```javascript
await ReactNativeProxyEngine.startProxy({
  host: '127.0.0.1',
  port: 8080,
  type: 'HTTP'
});
```

### HTTPS Proxy

Secure HTTP proxy with SSL/TLS support for encrypted connections.

```javascript
await ReactNativeProxyEngine.startProxy({
  host: '127.0.0.1',
  port: 8443,
  type: 'HTTPS'
});
```

### SOCKS4 Proxy

SOCKS version 4 proxy for TCP connections. Lightweight and fast.

```javascript
await ReactNativeProxyEngine.startProxy({
  host: '127.0.0.1',
  port: 1080,
  type: 'SOCKS4'
});
```

### SOCKS5 Proxy

SOCKS version 5 proxy with authentication support and enhanced features.

```javascript
await ReactNativeProxyEngine.startProxy({
  host: '127.0.0.1',
  port: 1080,
  type: 'SOCKS5',
  username: 'user',
  password: 'pass'
});
```

## Advanced Usage

### Authentication

For SOCKS5 proxies, you can enable authentication:

```javascript
const config = {
  host: '127.0.0.1',
  port: 1080,
  type: 'SOCKS5',
  username: 'myuser',
  password: 'mypassword'
};

await ReactNativeProxyEngine.startProxy(config);
```

### Monitoring Proxy Activity

Monitor proxy usage in real-time:

```javascript
const monitorProxy = async () => {
  const stats = await ReactNativeProxyEngine.getProxyStats();
  
  if (stats.success) {
    console.log(`Requests processed: ${stats.data.requestCount}`);
    console.log(`Data transferred: ${stats.data.bytesTransferred} bytes`);
    console.log(`Proxy running: ${stats.data.isRunning}`);
  }
};

// Monitor every 5 seconds
setInterval(monitorProxy, 5000);
```

### Error Handling

Always implement proper error handling:

```javascript
const safeProxyOperation = async () => {
  try {
    const result = await ReactNativeProxyEngine.startProxy({
      host: '127.0.0.1',
      port: 8080,
      type: 'HTTP'
    });
    
    if (!result.success) {
      console.error('Proxy start failed:', result.message);
      return;
    }
    
    console.log('Proxy started successfully');
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
};
```

## Platform Support

### Android

- **Minimum SDK**: 21 (Android 5.0)
- **Target SDK**: 34 (Android 14)
- **Kotlin Version**: 1.9.0
- **Dependencies**: OkHttp 4.11.0, Kotlinx Coroutines 1.7.3

### iOS

iOS support is planned for future releases. The current version supports Android only.

## Performance Considerations

### Memory Usage

The proxy engine is designed to be memory-efficient:

- Uses streaming for large file transfers
- Implements connection pooling
- Automatic cleanup of idle connections

### Concurrency

- Supports multiple simultaneous connections
- Non-blocking I/O operations
- Configurable connection limits

### Network Optimization

- Built-in request/response compression
- Connection keep-alive support
- Efficient buffer management

## Security

### Best Practices

1. **Bind to localhost**: For security, bind the proxy to `127.0.0.1` unless external access is required
2. **Use authentication**: Enable SOCKS5 authentication for production use
3. **Monitor traffic**: Regularly check proxy statistics for unusual activity
4. **Limit access**: Implement IP whitelisting if needed

### Permissions

The library requires the following Android permissions:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

These are automatically added by the Expo plugin.

## Troubleshooting

### Common Issues

#### Proxy Won't Start

```javascript
// Check if port is already in use
const result = await ReactNativeProxyEngine.startProxy({
  host: '127.0.0.1',
  port: 8080,
  type: 'HTTP'
});

if (!result.success) {
  console.log('Error:', result.message);
  // Try a different port
}
```

#### Connection Refused

Ensure the proxy is running and the correct host/port are specified:

```javascript
const status = await ReactNativeProxyEngine.getProxyStatus();
console.log('Proxy running:', status.data?.isRunning);
```

#### Performance Issues

Monitor proxy statistics to identify bottlenecks:

```javascript
const stats = await ReactNativeProxyEngine.getProxyStats();
console.log('Request count:', stats.data?.requestCount);
console.log('Bytes transferred:', stats.data?.bytesTransferred);
```

### Debug Mode

Enable debug logging in development:

```javascript
// Add to your app's initialization
if (__DEV__) {
  console.log('Proxy engine debug mode enabled');
}
```

## Examples

See the `example/` directory for a complete React Native application demonstrating all features of the proxy engine.

To run the example:

```bash
cd example
npm install
npx react-native run-android
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Build Android: `npm run build`

### Testing

Run the test suite:

```bash
npm test
```

For Android integration tests:

```bash
cd android && ./gradlew test
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [GitHub Wiki](https://github.com/shabari-security/react-native-proxy-engine/wiki)
- **Issues**: [GitHub Issues](https://github.com/shabari-security/react-native-proxy-engine/issues)
- **Discussions**: [GitHub Discussions](https://github.com/shabari-security/react-native-proxy-engine/discussions)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

---

**Author**: Shabari Security Team  
**Version**: 1.0.0  
**License**: MIT

