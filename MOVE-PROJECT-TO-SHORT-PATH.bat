@echo off
echo ========================================
echo Path Too Long - Moving Project
echo ========================================
echo.
echo Current path is TOO LONG for Windows builds:
echo %cd%
echo.
echo We'll copy your project to: C:\Shabari
echo This will fix the build errors!
echo.
pause

echo.
echo Creating C:\Shabari directory...
if not exist "C:\Shabari" mkdir "C:\Shabari"

echo.
echo Copying project files (this may take 2-3 minutes)...
xcopy /E /I /H /Y "%cd%" "C:\Shabari" >nul 2>&1

if exist "C:\Shabari\package.json" (
    echo.
    echo ✅ Project copied successfully!
    echo.
    echo Now run these commands:
    echo.
    echo   cd C:\Shabari\android
    echo   gradlew.bat assembleRelease
    echo.
    echo The APK will be at: C:\Shabari\android\app\build\outputs\apk\release\app-release.apk
    echo.
    echo.
    echo Do you want to open the new project folder now? (Y/N)
    set /p OPEN=
    if /i "%OPEN%"=="Y" start explorer "C:\Shabari"
) else (
    echo.
    echo ❌ Copy failed. Please manually copy the project to C:\Shabari
)

pause

