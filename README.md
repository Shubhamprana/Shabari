# Shabari (शबरी) - Cybersecurity App

## Overview
Shabari is a comprehensive cybersecurity application inspired by the devotion of Shabari, who ensured every fruit was safe. The app acts as a global digital guardian, meticulously inspecting every link, file, and app permission to ensure only safe and trustworthy content reaches users.

## Features Implemented

### 🔐 Authentication System
- **Email/Password Authentication**: Secure sign-up and sign-in functionality
- **Google OAuth Integration**: One-click sign-in with Google
- **Supabase Backend**: Robust user management and data storage
- **Session Management**: Persistent login state across app restarts

### 📱 Core Screens
1. **Onboarding Screen**: 3-slide introduction with custom illustrations
2. **Login Screen**: Authentication with multiple options
3. **Dashboard Screen**: Central hub with protection status and quick actions
4. **Secure Browser Screen**: Protected web browsing with real-time scanning
5. **Scan Result Screen**: Detailed threat analysis results
6. **Settings Screen**: Account management and app configuration

### 🛡️ Security Features
- **File Scanner**: Integration with VirusTotal API for comprehensive threat detection
- **Link Scanner**: Google Safe Browsing API for malicious URL detection
- **Real-time Protection**: Automatic scanning of downloads and links
- **Threat Database**: Local and cloud-based threat intelligence

### 💎 Premium Features
- **Subscription Management**: Free vs Premium tier functionality
- **Automatic Protection**: 24/7 background monitoring
- **Advanced Scanning**: Enhanced threat detection capabilities
- **Priority Support**: Premium user support system

### 🎨 Design & UX
- **Dark Theme**: Modern cybersecurity-focused design
- **Responsive Layout**: Optimized for various screen sizes
- **Custom Components**: Reusable UI components with consistent styling
- **Smooth Navigation**: React Navigation with stack-based routing

## Technical Architecture

### Frontend
- **React Native**: Cross-platform mobile development
- **Expo**: Development and build platform
- **TypeScript**: Type-safe development
- **React Navigation**: Screen navigation and routing
- **Zustand**: Lightweight state management

### Backend & Services
- **Supabase**: Authentication, database, and real-time features
- **VirusTotal API**: File and URL threat scanning
- **Google Safe Browsing API**: Malicious website detection
- **Environment Variables**: Secure API key management

### State Management
- **Auth Store**: User authentication state
- **Subscription Store**: Premium status management
- **Navigation State**: Screen routing and parameters

## Project Structure
```
Shabari/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Header.tsx
│   │   ├── ActionGrid.tsx
│   │   └── StatsDisplay.tsx
│   ├── screens/            # Application screens
│   │   ├── OnboardingScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── SecureBrowserScreen.tsx
│   │   ├── ScanResultScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── navigation/         # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── stores/            # State management
│   │   ├── authStore.ts
│   │   └── subscriptionStore.ts
│   ├── services/          # API integrations
│   │   └── ScannerService.ts
│   ├── lib/              # Utilities and configurations
│   │   └── supabase.ts
│   └── theme/            # Design system
│       └── index.ts
├── assets/               # Images and static files
├── App.tsx              # Main application component
├── index.js             # Entry point
└── package.json         # Dependencies and scripts
```

## API Integrations

### Supabase Configuration
- **URL**: https://mynbtxrbqbmhxvaimfhs.supabase.co
- **Features**: Authentication, user profiles, scan history
- **Tables**: users, scan_results
- **Real-time**: Subscription status updates

### Security APIs
- **VirusTotal**: File hash scanning and threat detection
- **Google Safe Browsing**: URL reputation checking
- **Rate Limiting**: Implemented to respect API quotas

## Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Development Setup
```bash
# Clone the repository
cd Shabari

# Install dependencies
npm install

# Start development server
npm run web          # Web development
npm run android      # Android development
npm run ios          # iOS development (macOS only)
```

### Environment Variables
Create a `.env` file with:
```
SUPABASE_URL=https://mynbtxrbqbmhxvaimfhs.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_SAFE_BROWSING_API_KEY=your_google_api_key
VIRUSTOTAL_API_KEY=your_virustotal_api_key
```

## Deployment Options

### Expo Application Services (EAS)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure project
eas build:configure

# Build for production
eas build --platform all
```

### Manual Build
```bash
# Generate native code
npx expo run:android
npx expo run:ios
```

## Security Considerations

### Data Protection
- **Encryption**: All sensitive data encrypted in transit and at rest
- **API Keys**: Stored securely in environment variables
- **User Privacy**: Minimal data collection, GDPR compliant
- **Session Security**: Secure token management with automatic expiration

### Threat Detection
- **Multi-layered Scanning**: Combined local and cloud-based detection
- **Real-time Updates**: Continuous threat intelligence updates
- **False Positive Handling**: User feedback system for accuracy improvement

## Future Enhancements

### Planned Features
- **VPN Integration**: Built-in secure browsing tunnel
- **App Permission Monitor**: Real-time app behavior analysis
- **Family Protection**: Multi-user account management
- **Threat Intelligence**: Community-driven threat sharing

### Technical Improvements
- **Offline Mode**: Local threat database for offline scanning
- **Performance Optimization**: Faster scanning algorithms
- **Machine Learning**: AI-powered threat detection
- **Cross-platform Sync**: Multi-device protection status

## Support & Documentation

### User Support
- **In-app Help**: Contextual help and tutorials
- **Email Support**: support@shabari.app
- **Knowledge Base**: Comprehensive user guides
- **Community Forum**: User discussion and feedback

### Developer Resources
- **API Documentation**: Complete API reference
- **SDK Integration**: Third-party integration guides
- **Security Guidelines**: Best practices for security apps
- **Contributing**: Open source contribution guidelines

## License & Legal

### Privacy Policy
- **Data Collection**: Transparent data usage policies
- **User Rights**: GDPR and CCPA compliance
- **Third-party Services**: Clear disclosure of external integrations
- **Data Retention**: Automatic data cleanup policies

### Terms of Service
- **Usage Guidelines**: Acceptable use policies
- **Liability**: Service limitations and disclaimers
- **Subscription Terms**: Premium service conditions
- **Intellectual Property**: Copyright and trademark notices

---

**Shabari (शबरी)** - Your Digital Guardian
*Protecting you with the same devotion Shabari showed in ensuring every fruit was safe.*

