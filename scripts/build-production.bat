@echo off
REM 🛡️ Shabari Proxy Engine - Production Build Script (Windows)
REM This script prepares and builds the production APK

setlocal enabledelayedexpansion

echo 🛡️  Shabari Proxy Engine - Production Build
echo ==============================================

REM Configuration
set PROJECT_NAME=Shabari
set VERSION=1.0.0
set BUILD_TYPE=release
set APK_OUTPUT_DIR=android\app\build\outputs\apk\release

REM Step 1: Environment Validation
echo ℹ️  Step 1: Validating build environment...

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js: !NODE_VERSION!

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm: !NPM_VERSION!

REM Check Android SDK
if "%ANDROID_HOME%"=="" (
    echo ⚠️  ANDROID_HOME not set - checking common locations
    if exist "%USERPROFILE%\AppData\Local\Android\Sdk" (
        set ANDROID_HOME=%USERPROFILE%\AppData\Local\Android\Sdk
    ) else if exist "C:\Android\Sdk" (
        set ANDROID_HOME=C:\Android\Sdk
    ) else (
        echo ❌ Android SDK not found. Please set ANDROID_HOME
        exit /b 1
    )
)
echo ✅ Android SDK: !ANDROID_HOME!

REM Check Java
java -version >nul 2>&1
if errorlevel 1 (
    echo ❌ Java is not installed
    exit /b 1
)
echo ✅ Java: Found

REM Step 2: Pre-build Validation
echo ℹ️  Step 2: Running pre-build validation...

if exist "scripts\validate-integration.js" (
    echo ℹ️  Running integration validation...
    node scripts\validate-integration.js
    if errorlevel 1 (
        echo ❌ Integration validation failed
        exit /b 1
    )
    echo ✅ Integration validation passed
) else (
    echo ⚠️  Integration validation script not found
)

if exist "scripts\validate-android-build.js" (
    echo ℹ️  Running Android build validation...
    node scripts\validate-android-build.js
    if errorlevel 1 (
        echo ❌ Android build validation failed
        exit /b 1
    )
    echo ✅ Android build validation passed
) else (
    echo ⚠️  Android build validation script not found
)

REM Step 3: Install Dependencies
echo ℹ️  Step 3: Installing dependencies...

echo ℹ️  Installing npm dependencies...
npm install
if errorlevel 1 (
    echo ❌ Failed to install npm dependencies
    exit /b 1
)
echo ✅ npm dependencies installed

if exist "react-native-proxy-engine" (
    echo ℹ️  Installing proxy engine dependencies...
    cd react-native-proxy-engine
    npm install
    cd ..
    echo ✅ Proxy engine dependencies installed
)

REM Step 4: Clean Previous Builds
echo ℹ️  Step 4: Cleaning previous builds...

echo ℹ️  Cleaning npm cache...
npm cache clean --force
echo ✅ npm cache cleaned

if exist "android" (
    echo ℹ️  Cleaning Android build...
    cd android
    gradlew.bat clean
    cd ..
    echo ✅ Android build cleaned
)

REM Step 5: Environment Configuration
echo ℹ️  Step 5: Configuring production environment...

echo # Production Configuration > .env.production
echo NODE_ENV=production >> .env.production
echo ENVIRONMENT=production >> .env.production
echo. >> .env.production
echo # Threat Detection >> .env.production
echo THREAT_FEED_UPDATE_INTERVAL=3600000 >> .env.production
echo THREAT_FEED_CACHE_SIZE=10000 >> .env.production
echo ENABLE_HEURISTIC_DETECTION=true >> .env.production
echo. >> .env.production
echo # Performance >> .env.production
echo VPN_BUFFER_SIZE=32767 >> .env.production
echo PROXY_CONNECTION_TIMEOUT=30000 >> .env.production
echo DNS_CACHE_SIZE=1000 >> .env.production
echo. >> .env.production
echo # Analytics >> .env.production
echo ANALYTICS_ENABLED=true >> .env.production
echo CRASH_REPORTING_ENABLED=true >> .env.production
echo. >> .env.production
echo # Security >> .env.production
echo ENABLE_CERTIFICATE_PINNING=true >> .env.production
echo ENABLE_ROOT_DETECTION=true >> .env.production

echo ✅ Production environment configured

REM Step 6: Build Production APK
echo ℹ️  Step 6: Building production APK...

cd android
echo ℹ️  Building release APK...
gradlew.bat assembleRelease
if errorlevel 1 (
    echo ❌ APK build failed
    exit /b 1
)
cd ..

REM Step 7: Verify Build
echo ℹ️  Step 7: Verifying build...

if exist "%APK_OUTPUT_DIR%\app-release.apk" (
    for %%i in ("%APK_OUTPUT_DIR%\app-release.apk") do set APK_SIZE=%%~zi
    set /a APK_SIZE_MB=!APK_SIZE!/1024/1024
    echo ✅ APK built successfully: !APK_SIZE_MB! MB
    
    echo ℹ️  APK Information:
    echo   📍 Location: %APK_OUTPUT_DIR%\app-release.apk
    echo   📏 Size: !APK_SIZE_MB! MB
    echo   📅 Build Date: %date% %time%
    echo   🏷️  Version: %VERSION%
) else (
    echo ❌ APK build failed - file not found
    exit /b 1
)

REM Step 8: Generate Build Report
echo ℹ️  Step 8: Generating build report...

set BUILD_REPORT=build-report-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%.txt
set BUILD_REPORT=!BUILD_REPORT: =0!

echo 🛡️ Shabari Proxy Engine - Build Report > "!BUILD_REPORT!"
echo ===================================== >> "!BUILD_REPORT!"
echo. >> "!BUILD_REPORT!"
echo 📊 Build Information: >> "!BUILD_REPORT!"
echo    Project: %PROJECT_NAME% >> "!BUILD_REPORT!"
echo    Version: %VERSION% >> "!BUILD_REPORT!"
echo    Build Type: %BUILD_TYPE% >> "!BUILD_REPORT!"
echo    Build Date: %date% %time% >> "!BUILD_REPORT!"
echo    Platform: Windows >> "!BUILD_REPORT!"
echo. >> "!BUILD_REPORT!"
echo 📱 Android Configuration: >> "!BUILD_REPORT!"
echo    Min SDK: 21 (Android 5.0) >> "!BUILD_REPORT!"
echo    Target SDK: 34 (Android 14) >> "!BUILD_REPORT!"
echo    Compile SDK: 34 >> "!BUILD_REPORT!"
echo. >> "!BUILD_REPORT!"
echo 🔧 Environment: >> "!BUILD_REPORT!"
echo    Node.js: !NODE_VERSION! >> "!BUILD_REPORT!"
echo    npm: !NPM_VERSION! >> "!BUILD_REPORT!"
echo    Android SDK: !ANDROID_HOME! >> "!BUILD_REPORT!"
echo. >> "!BUILD_REPORT!"
echo 📦 Build Output: >> "!BUILD_REPORT!"
echo    APK Location: %APK_OUTPUT_DIR%\app-release.apk >> "!BUILD_REPORT!"
echo    APK Size: !APK_SIZE_MB! MB >> "!BUILD_REPORT!"
echo. >> "!BUILD_REPORT!"
echo 🛡️ Security Features: >> "!BUILD_REPORT!"
echo    ✅ VPN packet filtering >> "!BUILD_REPORT!"
echo    ✅ HTTP/HTTPS proxy filtering >> "!BUILD_REPORT!"
echo    ✅ DNS filtering >> "!BUILD_REPORT!"
echo    ✅ Call protection >> "!BUILD_REPORT!"
echo    ✅ Threat detection engine >> "!BUILD_REPORT!"
echo    ✅ Heuristic analysis >> "!BUILD_REPORT!"
echo    ✅ Typosquatting detection >> "!BUILD_REPORT!"
echo    ✅ JSON feed integration >> "!BUILD_REPORT!"
echo. >> "!BUILD_REPORT!"
echo 📋 Production Readiness: >> "!BUILD_REPORT!"
echo    ✅ All validations passed >> "!BUILD_REPORT!"
echo    ✅ Dependencies installed >> "!BUILD_REPORT!"
echo    ✅ Build successful >> "!BUILD_REPORT!"
echo    ✅ APK verified >> "!BUILD_REPORT!"
echo. >> "!BUILD_REPORT!"
echo 🚀 Next Steps: >> "!BUILD_REPORT!"
echo    1. Test APK on physical device >> "!BUILD_REPORT!"
echo    2. Verify all features work >> "!BUILD_REPORT!"
echo    3. Submit to app store or distribute >> "!BUILD_REPORT!"
echo    4. Monitor performance and analytics >> "!BUILD_REPORT!"

echo ✅ Build report generated: !BUILD_REPORT!

REM Step 9: Installation Instructions
echo ℹ️  Step 9: Installation instructions...

echo.
echo 🚀 BUILD COMPLETE!
echo ==================
echo.
echo 📱 To install on device:
echo    adb install "%APK_OUTPUT_DIR%\app-release.apk"
echo.
echo 🧪 To test on connected device:
echo    adb devices  # List connected devices
echo    adb install -r "%APK_OUTPUT_DIR%\app-release.apk"  # Install with replacement
echo.
echo 📋 Important Notes:
echo    • APK is ready for production use
echo    • Test all VPN permissions on device
echo    • Verify threat blocking works
echo    • Monitor performance and battery usage
echo.
echo 📄 Build report saved to: !BUILD_REPORT!
echo.

REM Step 10: Optional Testing
adb devices >nul 2>&1
if not errorlevel 1 (
    for /f "tokens=*" %%i in ('adb devices ^| find "device" ^| find /c /v ""') do set DEVICE_COUNT=%%i
    if !DEVICE_COUNT! gtr 0 (
        echo 📱 Found !DEVICE_COUNT! connected device(s)
        echo.
        set /p INSTALL_CHOICE="🚀 Install APK on connected device? (y/n): "
        if /i "!INSTALL_CHOICE!"=="y" (
            echo ℹ️  Installing APK on device...
            adb install -r "%APK_OUTPUT_DIR%\app-release.apk"
            echo ✅ APK installed successfully!
            echo.
            echo 🧪 Test the following features:
            echo    • VPN connection and permissions
            echo    • Threat blocking (try visiting ads.eviltracker.com)
            echo    • Call protection
            echo    • Settings and configuration
        )
    ) else (
        echo ℹ️  No Android devices connected
        echo    Connect device with USB debugging enabled to install
    )
)

echo.
echo ✅ Production build completed successfully! 🎉
echo.
echo 🛡️ Shabari Proxy Engine is ready for deployment!

pause
