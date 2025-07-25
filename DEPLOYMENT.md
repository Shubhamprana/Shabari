# Deployment Guide for Shabari App

## Quick Start Deployment

### Option 1: Expo Application Services (EAS) - Recommended
```bash
# Install EAS CLI globally
npm install -g @expo/eas-cli

# Login to Expo account
eas login

# Configure the project for EAS
eas build:configure

# Build for both platforms
eas build --platform all

# Submit to app stores
eas submit --platform all
```

### Option 2: Local Development Build
```bash
# For Android
npx expo run:android

# For iOS (macOS only)
npx expo run:ios

# For Web
npm run web
```

## Production Environment Setup

### 1. Environment Variables
Ensure all production API keys are configured:
```bash
# Production .env file
SUPABASE_URL=https://mynbtxrbqbmhxvaimfhs.supabase.co
SUPABASE_ANON_KEY=your_production_supabase_key
GOOGLE_SAFE_BROWSING_API_KEY=your_production_google_key
VIRUSTOTAL_API_KEY=your_production_virustotal_key
```

### 2. Supabase Production Setup
- Configure Row Level Security (RLS) policies
- Set up production database tables
- Configure authentication providers
- Enable real-time subscriptions

### 3. API Rate Limiting
- Monitor VirusTotal API usage (500 requests/day free tier)
- Monitor Google Safe Browsing API usage
- Implement client-side caching for repeated requests

## Platform-Specific Deployment

### Android Deployment
```bash
# Generate Android App Bundle
eas build --platform android --profile production

# Or generate APK for testing
eas build --platform android --profile preview
```

### iOS Deployment
```bash
# Generate iOS build
eas build --platform ios --profile production

# Requires Apple Developer Account
# Configure provisioning profiles in eas.json
```

### Web Deployment
```bash
# Build for web
npx expo export:web

# Deploy to hosting service (Vercel, Netlify, etc.)
# The web build will be in the web-build/ directory
```

## App Store Submission

### Google Play Store
1. Create Google Play Console account
2. Upload AAB file generated by EAS
3. Configure app listing and screenshots
4. Submit for review

### Apple App Store
1. Create Apple Developer account
2. Use EAS Submit or manually upload via App Store Connect
3. Configure app metadata and screenshots
4. Submit for review

## Monitoring & Analytics

### Performance Monitoring
- Integrate Expo Analytics for crash reporting
- Monitor API response times
- Track user engagement metrics

### Security Monitoring
- Monitor failed authentication attempts
- Track malware detection rates
- Monitor API key usage and potential abuse

## Maintenance & Updates

### Over-the-Air Updates
```bash
# Publish updates without app store review
eas update --branch production --message "Bug fixes and improvements"
```

### Database Migrations
- Use Supabase migrations for schema changes
- Test migrations in staging environment first
- Backup production data before major changes

## Troubleshooting Common Issues

### Build Failures
- Check Node.js version compatibility
- Clear Metro cache: `npx expo start --clear`
- Verify all dependencies are compatible

### API Integration Issues
- Verify API keys are correctly configured
- Check API rate limits and quotas
- Test API endpoints in development environment

### Authentication Problems
- Verify Supabase configuration
- Check redirect URLs for OAuth providers
- Ensure proper error handling for network issues

## Security Checklist

### Pre-deployment Security
- [ ] All API keys stored securely
- [ ] No hardcoded secrets in source code
- [ ] HTTPS enforced for all API calls
- [ ] Input validation implemented
- [ ] Error messages don't expose sensitive information

### Post-deployment Security
- [ ] Monitor for security vulnerabilities
- [ ] Regular dependency updates
- [ ] API key rotation schedule
- [ ] User data encryption verified
- [ ] Backup and recovery procedures tested

## Support & Maintenance

### User Support
- Set up support email: support@shabari.app
- Create knowledge base for common issues
- Implement in-app feedback system

### Technical Maintenance
- Regular dependency updates
- Security patch management
- Performance optimization
- Feature enhancement planning

---

For additional support or questions about deployment, please refer to the main README.md or contact the development team.

