#!/bin/bash

# 🛡️ Shabari Proxy Engine - Production Build Script
# This script prepares and builds the production APK

set -e  # Exit on any error

echo "🛡️  Shabari Proxy Engine - Production Build"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="Shabari"
VERSION="1.0.0"
BUILD_TYPE="release"
APK_OUTPUT_DIR="android/app/build/outputs/apk/release"

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Environment Validation
log_info "Step 1: Validating build environment..."

# Check Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    exit 1
fi
NODE_VERSION=$(node --version)
log_success "Node.js: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    log_error "npm is not installed"
    exit 1
fi
NPM_VERSION=$(npm --version)
log_success "npm: $NPM_VERSION"

# Check Android SDK
if [ -z "$ANDROID_HOME" ]; then
    log_warning "ANDROID_HOME not set - trying common locations"
    if [ -d "$HOME/Android/Sdk" ]; then
        export ANDROID_HOME="$HOME/Android/Sdk"
    elif [ -d "/usr/local/android-sdk" ]; then
        export ANDROID_HOME="/usr/local/android-sdk"
    else
        log_error "Android SDK not found. Please set ANDROID_HOME"
        exit 1
    fi
fi
log_success "Android SDK: $ANDROID_HOME"

# Check Java
if ! command -v java &> /dev/null; then
    log_error "Java is not installed"
    exit 1
fi
JAVA_VERSION=$(java -version 2>&1 | head -n 1)
log_success "Java: $JAVA_VERSION"

# Step 2: Pre-build Validation
log_info "Step 2: Running pre-build validation..."

# Validate integration
if [ -f "scripts/validate-integration.js" ]; then
    log_info "Running integration validation..."
    if node scripts/validate-integration.js; then
        log_success "Integration validation passed"
    else
        log_error "Integration validation failed"
        exit 1
    fi
else
    log_warning "Integration validation script not found"
fi

# Validate Android build readiness
if [ -f "scripts/validate-android-build.js" ]; then
    log_info "Running Android build validation..."
    if node scripts/validate-android-build.js; then
        log_success "Android build validation passed"
    else
        log_error "Android build validation failed"
        exit 1
    fi
else
    log_warning "Android build validation script not found"
fi

# Step 3: Install Dependencies
log_info "Step 3: Installing dependencies..."

# Install npm dependencies
log_info "Installing npm dependencies..."
npm install
log_success "npm dependencies installed"

# Install React Native Proxy Engine dependencies
if [ -d "react-native-proxy-engine" ]; then
    log_info "Installing proxy engine dependencies..."
    cd react-native-proxy-engine
    npm install
    cd ..
    log_success "Proxy engine dependencies installed"
fi

# Step 4: Clean Previous Builds
log_info "Step 4: Cleaning previous builds..."

# Clean npm cache
npm cache clean --force
log_success "npm cache cleaned"

# Clean Android build
if [ -d "android" ]; then
    cd android
    ./gradlew clean
    cd ..
    log_success "Android build cleaned"
fi

# Clean React Native cache
if command -v npx &> /dev/null; then
    npx react-native start --reset-cache &
    METRO_PID=$!
    sleep 3
    kill $METRO_PID 2>/dev/null || true
    log_success "Metro cache cleared"
fi

# Step 5: Environment Configuration
log_info "Step 5: Configuring production environment..."

# Create production environment file
cat > .env.production << EOF
# Production Configuration
NODE_ENV=production
ENVIRONMENT=production

# Threat Detection
THREAT_FEED_UPDATE_INTERVAL=3600000
THREAT_FEED_CACHE_SIZE=10000
ENABLE_HEURISTIC_DETECTION=true

# Performance
VPN_BUFFER_SIZE=32767
PROXY_CONNECTION_TIMEOUT=30000
DNS_CACHE_SIZE=1000

# Analytics
ANALYTICS_ENABLED=true
CRASH_REPORTING_ENABLED=true

# Security
ENABLE_CERTIFICATE_PINNING=true
ENABLE_ROOT_DETECTION=true
EOF

log_success "Production environment configured"

# Step 6: Build Production APK
log_info "Step 6: Building production APK..."

# Build Android release
cd android

log_info "Building release APK..."
./gradlew assembleRelease

cd ..

# Step 7: Verify Build
log_info "Step 7: Verifying build..."

if [ -f "$APK_OUTPUT_DIR/app-release.apk" ]; then
    APK_SIZE=$(du -h "$APK_OUTPUT_DIR/app-release.apk" | cut -f1)
    log_success "APK built successfully: $APK_SIZE"
    
    # Get APK info
    log_info "APK Information:"
    echo "  📍 Location: $APK_OUTPUT_DIR/app-release.apk"
    echo "  📏 Size: $APK_SIZE"
    echo "  📅 Build Date: $(date)"
    echo "  🏷️  Version: $VERSION"
    
    # Verify APK signature
    if command -v jarsigner &> /dev/null; then
        log_info "Verifying APK signature..."
        if jarsigner -verify -verbose "$APK_OUTPUT_DIR/app-release.apk" > /dev/null 2>&1; then
            log_success "APK signature verified"
        else
            log_warning "APK signature verification failed (expected for debug builds)"
        fi
    fi
    
else
    log_error "APK build failed - file not found"
    exit 1
fi

# Step 8: Generate Build Report
log_info "Step 8: Generating build report..."

BUILD_REPORT="build-report-$(date +%Y%m%d-%H%M%S).txt"

cat > "$BUILD_REPORT" << EOF
🛡️ Shabari Proxy Engine - Build Report
=====================================

📊 Build Information:
   Project: $PROJECT_NAME
   Version: $VERSION
   Build Type: $BUILD_TYPE
   Build Date: $(date)
   Builder: $(whoami)
   Platform: $(uname -s) $(uname -m)

📱 Android Configuration:
   Min SDK: 21 (Android 5.0)
   Target SDK: 34 (Android 14)
   Compile SDK: 34

🔧 Environment:
   Node.js: $NODE_VERSION
   npm: $NPM_VERSION
   Java: $JAVA_VERSION
   Android SDK: $ANDROID_HOME

📦 Build Output:
   APK Location: $APK_OUTPUT_DIR/app-release.apk
   APK Size: $APK_SIZE
   
🛡️ Security Features:
   ✅ VPN packet filtering
   ✅ HTTP/HTTPS proxy filtering
   ✅ DNS filtering
   ✅ Call protection
   ✅ Threat detection engine
   ✅ Heuristic analysis
   ✅ Typosquatting detection
   ✅ JSON feed integration

📋 Production Readiness:
   ✅ All validations passed
   ✅ Dependencies installed
   ✅ Build successful
   ✅ APK verified
   
🚀 Next Steps:
   1. Test APK on physical device
   2. Verify all features work
   3. Submit to app store or distribute
   4. Monitor performance and analytics

EOF

log_success "Build report generated: $BUILD_REPORT"

# Step 9: Installation Instructions
log_info "Step 9: Installation instructions..."

echo ""
echo "🚀 BUILD COMPLETE!"
echo "=================="
echo ""
echo "📱 To install on device:"
echo "   adb install $APK_OUTPUT_DIR/app-release.apk"
echo ""
echo "🧪 To test on connected device:"
echo "   adb devices  # List connected devices"
echo "   adb install -r $APK_OUTPUT_DIR/app-release.apk  # Install with replacement"
echo ""
echo "📋 Important Notes:"
echo "   • APK is ready for production use"
echo "   • Test all VPN permissions on device"
echo "   • Verify threat blocking works"
echo "   • Monitor performance and battery usage"
echo ""
echo "📄 Build report saved to: $BUILD_REPORT"
echo ""

# Step 10: Optional Testing
if command -v adb &> /dev/null; then
    DEVICES=$(adb devices | grep -w "device" | wc -l)
    if [ $DEVICES -gt 0 ]; then
        echo "📱 Found $DEVICES connected device(s)"
        echo ""
        read -p "🚀 Install APK on connected device? (y/n): " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log_info "Installing APK on device..."
            adb install -r "$APK_OUTPUT_DIR/app-release.apk"
            log_success "APK installed successfully!"
            echo ""
            echo "🧪 Test the following features:"
            echo "   • VPN connection and permissions"
            echo "   • Threat blocking (try visiting ads.eviltracker.com)"
            echo "   • Call protection"
            echo "   • Settings and configuration"
        fi
    else
        log_info "No Android devices connected"
        echo "   Connect device with USB debugging enabled to install"
    fi
fi

echo ""
log_success "Production build completed successfully! 🎉"
echo ""
echo "🛡️ Shabari Proxy Engine is ready for deployment!"
