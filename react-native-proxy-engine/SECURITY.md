# Security Policy

## Supported Versions

We actively support the following versions of React Native Proxy Engine with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

The Shabari Security Team takes security vulnerabilities seriously. We appreciate your efforts to responsibly disclose your findings.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **security@shabari.com**

Include the following information in your report:

- **Description**: A clear description of the vulnerability
- **Impact**: The potential impact and severity of the issue
- **Reproduction**: Step-by-step instructions to reproduce the vulnerability
- **Environment**: Affected versions, platforms, and configurations
- **Proof of Concept**: If applicable, include a minimal proof of concept
- **Suggested Fix**: If you have ideas for how to fix the issue

### What to Expect

1. **Acknowledgment**: We will acknowledge receipt of your report within 48 hours
2. **Initial Assessment**: We will provide an initial assessment within 5 business days
3. **Investigation**: We will investigate and work on a fix
4. **Resolution**: We will notify you when the vulnerability is resolved
5. **Disclosure**: We will coordinate with you on public disclosure timing

### Security Best Practices

When using React Native Proxy Engine, please follow these security best practices:

#### Network Security

- **Bind to localhost**: Unless external access is required, bind the proxy to `127.0.0.1`
- **Use authentication**: Enable SOCKS5 authentication for production deployments
- **Monitor traffic**: Regularly review proxy logs and statistics for unusual activity
- **Limit access**: Implement IP whitelisting or firewall rules as needed

#### Application Security

- **Validate inputs**: Always validate and sanitize proxy configuration inputs
- **Handle errors**: Implement proper error handling to prevent information disclosure
- **Update regularly**: Keep the library updated to the latest version
- **Review permissions**: Ensure your app only requests necessary Android permissions

#### Data Protection

- **No logging**: The proxy engine does not log request data by design
- **Memory safety**: The engine automatically cleans up connections and buffers
- **Encryption**: Use HTTPS proxies for sensitive data transmission

### Known Security Considerations

#### Android Permissions

The library requires these Android permissions:
- `android.permission.INTERNET`: Required for network operations
- `android.permission.ACCESS_NETWORK_STATE`: Required for network status checks

#### Network Exposure

- The proxy server can potentially expose your device to network attacks if bound to external interfaces
- Always use appropriate firewall rules and network security measures
- Consider using VPN or other network isolation techniques in production

#### Memory Management

- The proxy engine uses streaming to handle large transfers safely
- Connection pooling is implemented to prevent resource exhaustion
- Automatic cleanup prevents memory leaks

### Vulnerability Disclosure Policy

We follow responsible disclosure practices:

1. **Private Disclosure**: Security issues are first reported privately
2. **Investigation Period**: We investigate and develop fixes before public disclosure
3. **Coordinated Disclosure**: We work with reporters to coordinate public disclosure
4. **Credit**: We provide credit to security researchers who report valid vulnerabilities
5. **Timeline**: We aim to resolve critical vulnerabilities within 30 days

### Security Updates

Security updates are released as patch versions and include:

- **CVE Assignment**: Critical vulnerabilities receive CVE identifiers
- **Security Advisories**: Published on GitHub Security Advisories
- **Release Notes**: Detailed information about security fixes
- **Migration Guides**: Instructions for updating affected applications

### Contact Information

- **Security Email**: security@shabari.com
- **PGP Key**: Available upon request
- **Response Time**: Within 48 hours for acknowledgment

### Bug Bounty

We currently do not offer a formal bug bounty program, but we greatly appreciate security research and will acknowledge contributors in our security advisories.

### Legal

We will not pursue legal action against security researchers who:

- Make a good faith effort to avoid privacy violations and data destruction
- Report vulnerabilities promptly and responsibly
- Do not access or modify data beyond what is necessary to demonstrate the vulnerability
- Do not perform testing on production systems without permission

Thank you for helping keep React Native Proxy Engine and our users safe!

