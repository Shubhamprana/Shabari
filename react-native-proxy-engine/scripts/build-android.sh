#!/bin/bash

# React Native Proxy Engine - Android Build Script
# This script builds the Android library and runs tests

set -e

echo "🚀 Building React Native Proxy Engine for Android..."

# Check if Android SDK is available
if [ -z "$ANDROID_HOME" ]; then
    echo "❌ ANDROID_HOME environment variable is not set"
    echo "Please set ANDROID_HOME to your Android SDK path"
    exit 1
fi

# Navigate to android directory
cd "$(dirname "$0")/../android"

echo "📦 Installing dependencies..."
if [ -f "../package.json" ]; then
    cd ..
    npm install
    cd android
fi

echo "🧹 Cleaning previous builds..."
./gradlew clean

echo "🔨 Building Android library..."
./gradlew build

echo "🧪 Running unit tests..."
./gradlew test

echo "📊 Generating test reports..."
./gradlew jacocoTestReport

echo "🔍 Running lint checks..."
./gradlew lint

echo "📋 Build summary:"
echo "  ✅ Clean completed"
echo "  ✅ Build completed"
echo "  ✅ Tests completed"
echo "  ✅ Lint checks completed"

# Check if build artifacts exist
if [ -f "build/outputs/aar/android-release.aar" ]; then
    echo "  ✅ Release AAR generated"
else
    echo "  ⚠️  Release AAR not found"
fi

if [ -f "build/outputs/aar/android-debug.aar" ]; then
    echo "  ✅ Debug AAR generated"
else
    echo "  ⚠️  Debug AAR not found"
fi

echo ""
echo "🎉 Android build completed successfully!"
echo ""
echo "📁 Build artifacts location:"
echo "  - AAR files: android/build/outputs/aar/"
echo "  - Test reports: android/build/reports/tests/"
echo "  - Lint reports: android/build/reports/lint/"
echo ""
echo "🔧 Next steps:"
echo "  - Run 'npm test' to execute JavaScript tests"
echo "  - Test with the example app: 'cd example && npm run android'"
echo "  - Check test coverage reports in build/reports/"

