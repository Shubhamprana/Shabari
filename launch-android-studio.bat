@echo off
echo Opening Android Studio...
start "" "C:\Program Files\Android\Android Studio\bin\studio64.exe" "%~dp0\android"
echo Please install NDK 25.1.8937393 using the SDK Manager in Android Studio:
echo 1. Open Tools -^> SDK Manager
echo 2. Go to SDK Tools tab
echo 3. Check "NDK (Side by side)" and select version 25.1.8937393
echo 4. Click Apply and wait for installation to complete
pause 