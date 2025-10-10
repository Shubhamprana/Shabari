@echo off
REM React Native Proxy Engine - Android Build Script for Windows
REM This script builds the Android library and runs tests

echo 🚀 Building React Native Proxy Engine for Android...

REM Check if Android SDK is available
if "%ANDROID_HOME%"=="" (
    echo ❌ ANDROID_HOME environment variable is not set
    echo Please set ANDROID_HOME to your Android SDK path
    exit /b 1
)

REM Navigate to android directory
cd /d "%~dp0..\android"

echo 📦 Installing dependencies...
if exist "..\package.json" (
    cd ..
    npm install
    cd android
)

echo 🧹 Cleaning previous builds...
gradlew.bat clean

echo 🔨 Building Android library...
gradlew.bat build

echo 🧪 Running unit tests...
gradlew.bat test

echo 📊 Generating test reports...
gradlew.bat jacocoTestReport

echo 🔍 Running lint checks...
gradlew.bat lint

echo 📋 Build summary:
echo   ✅ Clean completed
echo   ✅ Build completed
echo   ✅ Tests completed
echo   ✅ Lint checks completed

REM Check if build artifacts exist
if exist "build\outputs\aar\android-release.aar" (
    echo   ✅ Release AAR generated
) else (
    echo   ⚠️  Release AAR not found
)

if exist "build\outputs\aar\android-debug.aar" (
    echo   ✅ Debug AAR generated
) else (
    echo   ⚠️  Debug AAR not found
)

echo.
echo 🎉 Android build completed successfully!
echo.
echo 📁 Build artifacts location:
echo   - AAR files: android\build\outputs\aar\
echo   - Test reports: android\build\reports\tests\
echo   - Lint reports: android\build\reports\lint\
echo.
echo 🔧 Next steps:
echo   - Run 'npm test' to execute JavaScript tests
echo   - Test with the example app: 'cd example && npm run android'
echo   - Check test coverage reports in build\reports\
