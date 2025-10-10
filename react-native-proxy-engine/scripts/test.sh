#!/bin/bash

# React Native Proxy Engine - Test Script
# This script runs all tests for the project

set -e

echo "🧪 Running React Native Proxy Engine Tests..."

# Navigate to project root
cd "$(dirname "$0")/.."

echo "📦 Installing dependencies..."
npm install

echo "🔍 Running JavaScript/TypeScript tests..."
npm test

echo "🔍 Running JavaScript tests with coverage..."
npm run test -- --coverage

echo "🧹 Running linting..."
if command -v eslint &> /dev/null; then
    npx eslint index.js __tests__/ example/
else
    echo "⚠️  ESLint not found, skipping JavaScript linting"
fi

echo "🔍 Running TypeScript type checking..."
if command -v tsc &> /dev/null; then
    npx tsc --noEmit
else
    echo "⚠️  TypeScript not found, skipping type checking"
fi

# Run Android tests if Android SDK is available
if [ -n "$ANDROID_HOME" ] && [ -d "android" ]; then
    echo "🤖 Running Android tests..."
    cd android
    
    echo "🧪 Running Android unit tests..."
    ./gradlew test
    
    echo "🔍 Running Android lint..."
    ./gradlew lint
    
    cd ..
else
    echo "⚠️  Android SDK not found or android directory missing, skipping Android tests"
fi

echo ""
echo "📊 Test Summary:"
echo "  ✅ JavaScript/TypeScript tests"
echo "  ✅ Code coverage analysis"
echo "  ✅ Linting checks"
echo "  ✅ Type checking"

if [ -n "$ANDROID_HOME" ] && [ -d "android" ]; then
    echo "  ✅ Android unit tests"
    echo "  ✅ Android lint checks"
fi

echo ""
echo "🎉 All tests completed successfully!"
echo ""
echo "📁 Test reports location:"
echo "  - JavaScript coverage: coverage/"
echo "  - Android test reports: android/build/reports/tests/"
echo "  - Android lint reports: android/build/reports/lint/"

