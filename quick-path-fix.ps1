# Quick Path Fix for Windows Build Issues
Write-Host "🔧 Quick Path Fix for Shabari App Build" -ForegroundColor Green
Write-Host ""

# Try to use Windows short names
Write-Host "🔍 Checking Windows short names..." -ForegroundColor Yellow

# Get short name for current path
$currentPath = Get-Location
$shortPath = ""

try {
    # Try to get 8.3 short name
    $fso = New-Object -ComObject Scripting.FileSystemObject
    $shortPath = $fso.GetFolder($currentPath.Path).ShortPath
    Write-Host "Short path available: $shortPath" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not get short path: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Set environment variables to use shorter paths
Write-Host ""
Write-Host "🔧 Setting environment variables for build..." -ForegroundColor Yellow

# Try to set GRADLE_USER_HOME to a shorter path
$env:GRADLE_USER_HOME = "C:\gradle"
if (-not (Test-Path "C:\gradle")) {
    New-Item -ItemType Directory -Path "C:\gradle" -Force
}
Write-Host "✅ Set GRADLE_USER_HOME to C:\gradle" -ForegroundColor Green

# Set Android build cache to shorter path
$env:ANDROID_USER_HOME = "C:\android"
if (-not (Test-Path "C:\android")) {
    New-Item -ItemType Directory -Path "C:\android" -Force
}
Write-Host "✅ Set ANDROID_USER_HOME to C:\android" -ForegroundColor Green

# Set temp directory to shorter path
$env:TEMP = "C:\temp"
$env:TMP = "C:\temp"
if (-not (Test-Path "C:\temp")) {
    New-Item -ItemType Directory -Path "C:\temp" -Force
}
Write-Host "✅ Set TEMP/TMP to C:\temp" -ForegroundColor Green

# Set NODE_ENV
$env:NODE_ENV = "development"
Write-Host "✅ Set NODE_ENV to development" -ForegroundColor Green

Write-Host ""
Write-Host "🎯 Trying alternative build approach..." -ForegroundColor Cyan

# Create a symbolic link approach
Write-Host "Attempting to create symbolic link workaround..." -ForegroundColor Yellow

$linkPath = "C:\ShabariLink"
if (Test-Path $linkPath) {
    Remove-Item $linkPath -Force -Recurse -ErrorAction SilentlyContinue
}

try {
    # Try to create a symbolic link to the current directory
    New-Item -ItemType SymbolicLink -Path $linkPath -Target $currentPath.Path -Force
    Write-Host "✅ Created symbolic link: $linkPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 You can now try building from the shorter path:" -ForegroundColor Green
    Write-Host "1. cd $linkPath" -ForegroundColor White
    Write-Host "2. cd android" -ForegroundColor White
    Write-Host "3. .\gradlew assembleDebug" -ForegroundColor White
} catch {
    Write-Host "❌ Could not create symbolic link: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   You may need to run PowerShell as Administrator" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 Additional CMake workarounds..." -ForegroundColor Yellow

# Try to set CMAKE variables to use shorter paths
$env:CMAKE_BUILD_DIR = "C:\build"
if (-not (Test-Path "C:\build")) {
    New-Item -ItemType Directory -Path "C:\build" -Force
}

Write-Host ""
Write-Host "📋 Summary of applied fixes:" -ForegroundColor Cyan
Write-Host "• GRADLE_USER_HOME = C:\gradle" -ForegroundColor White
Write-Host "• ANDROID_USER_HOME = C:\android" -ForegroundColor White
Write-Host "• TEMP/TMP = C:\temp" -ForegroundColor White
Write-Host "• NODE_ENV = development" -ForegroundColor White
if (Test-Path $linkPath) {
    Write-Host "• Symbolic link created: $linkPath" -ForegroundColor White
}

Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Green
if (Test-Path $linkPath) {
    Write-Host "Option 1 - Use symbolic link:" -ForegroundColor Cyan
    Write-Host "  cd $linkPath" -ForegroundColor White
    Write-Host "  cd android" -ForegroundColor White
    Write-Host "  .\gradlew assembleDebug" -ForegroundColor White
    Write-Host ""
}
Write-Host "Option 2 - Try EAS build (cloud):" -ForegroundColor Cyan
Write-Host "  eas build --platform android --profile development" -ForegroundColor White
Write-Host ""
Write-Host "Option 3 - Move project (recommended):" -ForegroundColor Cyan
Write-Host "  Run: .\fix-path-issues.ps1" -ForegroundColor White