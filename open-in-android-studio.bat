@echo off
echo 🚀 Opening Shabari Project in Android Studio...
echo.

REM Set Java environment to JDK 17
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.15.6-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"

REM Set Android SDK path
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin;%ANDROID_HOME%\platform-tools;%PATH%"

echo ✅ Java Environment:
java -version
echo.

echo ✅ Android SDK: %ANDROID_HOME%
echo.

echo 📂 Project Path: %~dp0android
echo.

REM Try to find Android Studio in common locations
set "STUDIO_PATH="
if exist "C:\Program Files\Android\Android Studio\bin\studio64.exe" (
    set "STUDIO_PATH=C:\Program Files\Android\Android Studio\bin\studio64.exe"
) else if exist "C:\Users\%USERNAME%\AppData\Local\Android Studio\bin\studio64.exe" (
    set "STUDIO_PATH=C:\Users\%USERNAME%\AppData\Local\Android Studio\bin\studio64.exe"
) else (
    echo ❌ Android Studio not found in standard locations.
    echo Please install Android Studio or update the path in this script.
    echo.
    echo Expected locations:
    echo - C:\Program Files\Android\Android Studio\bin\studio64.exe
    echo - C:\Users\%USERNAME%\AppData\Local\Android Studio\bin\studio64.exe
    pause
    exit /b 1
)

echo 🎯 Found Android Studio: %STUDIO_PATH%
echo.

echo 🔄 Opening project in Android Studio...
echo Please wait for Android Studio to load...
echo.

REM Open Android Studio with the android folder
start "" "%STUDIO_PATH%" "%~dp0android"

echo ✅ Android Studio launched!
echo.
echo 📋 Next Steps:
echo 1. Wait for Gradle sync to complete
echo 2. Click Build ^> Build Bundle(s) / APK(s) ^> Build APK(s)
echo 3. Or click the Run button to install on device/emulator
echo.
echo 💡 If you encounter issues, check the guide in: open-android-studio.md
echo.
pause 

