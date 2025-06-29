@echo off
echo 🚀 Quick Project Copy to Fix Path Issues
echo.

REM Create target directory
if not exist "C:\Shabari" (
    mkdir "C:\Shabari"
    echo ✅ Created C:\Shabari directory
)

echo 📁 Copying project files (excluding build artifacts)...
echo This may take a few minutes...

REM Copy all files except build artifacts
robocopy "%~dp0" "C:\Shabari" /E /XD node_modules android\build android\.gradle .expo android\app\build android\app\.cxx /XF *.log

echo.
echo ✅ Project copied to C:\Shabari
echo.
echo 🎯 Next steps:
echo 1. cd C:\Shabari
echo 2. npm install
echo 3. .\set-java-env.ps1
echo 4. node fix-reanimated-cpp-linking.js
echo 5. cd android
echo 6. .\gradlew assembleDebug
echo.
pause 