# Fix Build Environment for Shabari App
Write-Host "🔧 Setting up build environment for Shabari App..." -ForegroundColor Green

# Set NODE_ENV
$env:NODE_ENV = "development"
Write-Host "✅ Set NODE_ENV to development" -ForegroundColor Green

# Set additional environment variables that might help with the build
$env:REACT_NATIVE_PACKAGER_HOSTNAME = "127.0.0.1"
$env:EXPO_USE_FAST_RESOLVER = "1"

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Run the C++ linking fix
Write-Host "🔧 Applying C++ linking fixes..." -ForegroundColor Yellow
node fix-reanimated-cpp-linking.js

# Clean additional build artifacts
Write-Host "🧹 Cleaning build artifacts..." -ForegroundColor Yellow

$cleanPaths = @(
    "android\.gradle",
    "android\app\build",
    "android\build",
    ".expo",
    "node_modules\.cache"
)

foreach ($cleanPath in $cleanPaths) {
    if (Test-Path $cleanPath) {
        try {
            Remove-Item -Path $cleanPath -Recurse -Force -ErrorAction Stop
            Write-Host "🧹 Cleaned: $cleanPath" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  Could not clean $cleanPath : $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

# Set Java environment using our existing script
Write-Host "☕ Setting up Java environment..." -ForegroundColor Yellow
if (Test-Path "set-java-env.ps1") {
    & .\set-java-env.ps1
} else {
    Write-Host "⚠️  set-java-env.ps1 not found. Please ensure Java 17 is configured." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 Environment setup complete!" -ForegroundColor Green
Write-Host "Environment variables set:" -ForegroundColor Cyan
Write-Host "  NODE_ENV = $env:NODE_ENV" -ForegroundColor White
Write-Host "  JAVA_HOME = $env:JAVA_HOME" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Open Android Studio: .\launch-android-studio.bat" -ForegroundColor White
Write-Host "2. Or try Gradle build: cd android && .\gradlew assembleDebug" -ForegroundColor White
Write-Host ""
Write-Host "💡 If you still get path errors, consider:" -ForegroundColor Yellow
Write-Host "   - Moving project to C:\Shabari (no spaces in path)" -ForegroundColor White
Write-Host "   - Using 8.3 short names in Windows" -ForegroundColor White 