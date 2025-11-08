@echo off
echo ========================================
echo Building Shabari APK from Short Path
echo ========================================
echo.

cd /d C:\Shabari\android

if not exist "gradlew.bat" (
    echo ERROR: gradlew.bat not found!
    echo Please ensure project was copied to C:\Shabari correctly.
    pause
    exit /b 1
)

echo Current directory: %cd%
echo.
echo Starting build (this will take 8-10 minutes)...
echo.

call gradlew.bat clean
call gradlew.bat assembleRelease

echo.
echo ========================================
echo Checking build result...
echo ========================================

if exist "app\build\outputs\apk\release\app-release.apk" (
    echo.
    echo ✅ SUCCESS! APK built successfully!
    echo.
    echo APK Location:
    echo %cd%\app\build\outputs\apk\release\app-release.apk
    echo.
    echo File Info:
    dir app\build\outputs\apk\release\app-release.apk
    echo.
    echo Copying to Desktop for easy access...
    copy "app\build\outputs\apk\release\app-release.apk" "%USERPROFILE%\Desktop\Shabari-App.apk"
    echo.
    echo ✅ APK copied to Desktop as Shabari-App.apk
    echo.
) else (
    echo.
    echo ❌ BUILD FAILED - APK not found
    echo Please check the error messages above.
    echo.
)

pause

