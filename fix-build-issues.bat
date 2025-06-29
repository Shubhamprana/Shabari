@echo off
echo 🔧 Fixing Shabari App build issues...
echo.

REM Run the PowerShell script to fix build environment
powershell -ExecutionPolicy Bypass -File "fix-build-environment.ps1"

echo.
echo ✅ Build fixes applied!
echo.
pause 