# Contributing to React Native Proxy Engine

We welcome contributions from the community! This guide will help you get started with contributing to the React Native Proxy Engine project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)
- [Release Process](#release-process)

## Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to help us maintain a welcoming and inclusive community.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 16 or higher)
- **npm** or **yarn**
- **Android Studio** with Android SDK
- **Java Development Kit (JDK)** 11 or higher
- **Git**

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/react-native-proxy-engine.git
cd react-native-proxy-engine
```

3. Add the upstream repository:

```bash
git remote add upstream https://github.com/shabari-security/react-native-proxy-engine.git
```

## Development Setup

### Install Dependencies

```bash
npm install
```

### Set Up Android Development

1. Open Android Studio
2. Install the required SDK platforms and build tools
3. Set up environment variables:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Build the Project

```bash
# Build Android library
cd android
./gradlew build

# Run tests
cd ..
npm test
```

## Project Structure

```
react-native-proxy-engine/
├── android/                          # Android native code
│   ├── src/main/java/com/reactnativeproxyengine/
│   │   ├── ProxyServer.kt            # Core proxy server implementation
│   │   ├── ProxyManager.kt           # Proxy management logic
│   │   ├── ReactNativeProxyEngineModule.kt  # React Native bridge
│   │   └── ReactNativeProxyEnginePackage.kt # Package registration
│   ├── build.gradle                  # Android build configuration
│   └── gradle.properties             # Gradle properties
├── example/                          # Example React Native app
│   ├── App.js                        # Example implementation
│   └── package.json                  # Example dependencies
├── __tests__/                        # Test files
│   └── index.test.js                 # Unit tests
├── index.js                          # Main JavaScript entry point
├── index.d.ts                        # TypeScript definitions
├── app.plugin.js                     # Expo plugin configuration
├── react-native.config.js            # React Native configuration
├── package.json                      # Package configuration
├── README.md                         # Project documentation
├── CHANGELOG.md                      # Version history
└── CONTRIBUTING.md                   # This file
```

## Making Changes

### Branching Strategy

We use a simple branching strategy:

- `main`: Stable release branch
- `develop`: Development branch for new features
- `feature/feature-name`: Feature branches
- `bugfix/bug-description`: Bug fix branches
- `hotfix/critical-fix`: Critical fixes for production

### Creating a Feature Branch

```bash
git checkout develop
git pull upstream develop
git checkout -b feature/your-feature-name
```

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(proxy): add SOCKS5 authentication support
fix(android): resolve memory leak in connection handling
docs(readme): update installation instructions
test(proxy): add unit tests for HTTP proxy
```

## Testing

### Running Tests

```bash
# Run JavaScript tests
npm test

# Run tests with coverage
npm run test:coverage

# Run Android unit tests
cd android
./gradlew test

# Run Android instrumentation tests
./gradlew connectedAndroidTest
```

### Writing Tests

#### JavaScript Tests

Create test files in the `__tests__` directory:

```javascript
// __tests__/new-feature.test.js
import ReactNativeProxyEngine from '../index';

describe('New Feature', () => {
  it('should work correctly', async () => {
    // Test implementation
  });
});
```

#### Android Tests

Create test files in `android/src/test/java/`:

```kotlin
// android/src/test/java/com/reactnativeproxyengine/ProxyServerTest.kt
import org.junit.Test
import org.junit.Assert.*

class ProxyServerTest {
    @Test
    fun testProxyServer() {
        // Test implementation
    }
}
```

### Test Coverage

Maintain high test coverage:
- Aim for at least 80% code coverage
- Test both success and error scenarios
- Include integration tests for critical paths

## Submitting Changes

### Before Submitting

1. **Run all tests**: Ensure all tests pass
2. **Check code style**: Follow the coding standards
3. **Update documentation**: Update README, CHANGELOG, etc.
4. **Test the example**: Verify the example app works

### Pull Request Process

1. **Update your branch**:
```bash
git checkout develop
git pull upstream develop
git checkout your-feature-branch
git rebase develop
```

2. **Push your changes**:
```bash
git push origin your-feature-branch
```

3. **Create a Pull Request**:
   - Go to GitHub and create a PR from your branch to `develop`
   - Fill out the PR template completely
   - Link any related issues
   - Add appropriate labels

4. **Address feedback**:
   - Respond to code review comments
   - Make requested changes
   - Update tests if needed

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Coding Standards

### JavaScript/TypeScript

- Use **ESLint** configuration provided
- Follow **Prettier** formatting
- Use **TypeScript** for type safety
- Write clear, descriptive variable names
- Add JSDoc comments for public APIs

### Kotlin

- Follow **Kotlin coding conventions**
- Use **ktlint** for formatting
- Write clear, descriptive function names
- Add KDoc comments for public APIs
- Use coroutines for asynchronous operations

### General Guidelines

- **Keep functions small** and focused
- **Write self-documenting code**
- **Handle errors gracefully**
- **Use meaningful commit messages**
- **Update documentation** with changes

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps

1. **Update version** in `package.json`
2. **Update CHANGELOG.md** with new version
3. **Create release branch**: `release/vX.Y.Z`
4. **Test thoroughly** on release branch
5. **Merge to main** and tag release
6. **Publish to npm**
7. **Create GitHub release** with notes

### Pre-release Testing

Before releasing:
- [ ] All tests pass
- [ ] Example app works correctly
- [ ] Documentation is up to date
- [ ] Breaking changes are documented
- [ ] Migration guide is provided (if needed)

## Getting Help

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and discussions
- **Email**: security@shabari.com for security issues

### Documentation

- **README.md**: Basic usage and API reference
- **Wiki**: Detailed guides and tutorials
- **Example App**: Working implementation reference

### Reporting Issues

When reporting bugs:
1. **Search existing issues** first
2. **Use the issue template**
3. **Provide minimal reproduction case**
4. **Include environment details**
5. **Add relevant logs/screenshots**

### Suggesting Features

When suggesting features:
1. **Check existing feature requests**
2. **Describe the use case**
3. **Explain the expected behavior**
4. **Consider implementation complexity**
5. **Discuss alternatives**

## Recognition

Contributors will be recognized in:
- **CONTRIBUTORS.md** file
- **GitHub contributors** section
- **Release notes** for significant contributions
- **Special thanks** in documentation

Thank you for contributing to React Native Proxy Engine! Your efforts help make this project better for everyone.

