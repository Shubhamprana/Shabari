# Fix Windows Path Issues for Shabari App Build
Write-Host "🔧 Windows Path Issue Fix for Shabari App" -ForegroundColor Green
Write-Host ""

# Check current path
$currentPath = Get-Location
Write-Host "Current path: $currentPath" -ForegroundColor Yellow
Write-Host "Path length: $($currentPath.Path.Length) characters" -ForegroundColor Yellow

# Check for spaces in path
if ($currentPath.Path -match " ") {
    Write-Host "❌ Path contains spaces - this causes build issues!" -ForegroundColor Red
} else {
    Write-Host "✅ Path has no spaces" -ForegroundColor Green
}

# Check path length
if ($currentPath.Path.Length -gt 100) {
    Write-Host "⚠️  Path is quite long - this may cause build issues" -ForegroundColor Yellow
} else {
    Write-Host "✅ Path length is acceptable" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 RECOMMENDED SOLUTIONS:" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. BEST SOLUTION - Move to shorter path:" -ForegroundColor Green
Write-Host "   • Create: C:\Shabari" -ForegroundColor White
Write-Host "   • Copy project there (no spaces, short path)" -ForegroundColor White
Write-Host "   • Run: robocopy `"$currentPath`" `"C:\Shabari`" /E /XD node_modules android\build android\.gradle" -ForegroundColor Cyan
Write-Host ""

Write-Host "2. ALTERNATIVE - Use Windows short names:" -ForegroundColor Yellow
Write-Host "   • Use: C:\Users\SHUBHA~1\Downloads\SHABARI~1\Shabari" -ForegroundColor White
Write-Host "   • This uses 8.3 short file names" -ForegroundColor White
Write-Host ""

Write-Host "3. WORKAROUND - Build with EAS:" -ForegroundColor Blue
Write-Host "   • Use: eas build --platform android --profile development" -ForegroundColor White
Write-Host "   • This builds in the cloud, avoiding local path issues" -ForegroundColor White
Write-Host ""

# Offer to create the recommended directory structure
Write-Host "Would you like me to help move the project to C:\Shabari? (Y/N)" -ForegroundColor Cyan
$response = Read-Host

if ($response -eq "Y" -or $response -eq "y") {
    Write-Host ""
    Write-Host "🚀 Creating C:\Shabari and copying project..." -ForegroundColor Green
    
    # Create target directory
    if (-not (Test-Path "C:\Shabari")) {
        New-Item -ItemType Directory -Path "C:\Shabari" -Force
        Write-Host "✅ Created C:\Shabari directory" -ForegroundColor Green
    }
    
    # Copy project files (excluding build artifacts)
    Write-Host "📁 Copying project files (this may take a moment)..." -ForegroundColor Yellow
    
    $excludeDirs = @("node_modules", "android\build", "android\.gradle", ".expo", "android\app\build", "android\app\.cxx")
    $excludeParam = ($excludeDirs | ForEach-Object { "/XD `"$_`"" }) -join " "
    
    $robocopyCmd = "robocopy `"$currentPath`" `"C:\Shabari`" /E $excludeParam /NFL /NDL /NJH /NJS /nc /ns /np"
    
    try {
        Invoke-Expression $robocopyCmd
        Write-Host "✅ Project copied to C:\Shabari" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎯 Next steps:" -ForegroundColor Cyan
        Write-Host "1. cd C:\Shabari" -ForegroundColor White
        Write-Host "2. npm install" -ForegroundColor White
        Write-Host "3. Set up Java environment: .\set-java-env.ps1" -ForegroundColor White
        Write-Host "4. Apply C++ fixes: node fix-reanimated-cpp-linking.js" -ForegroundColor White
        Write-Host "5. Try building: cd android && .\gradlew assembleDebug" -ForegroundColor White
    } catch {
        Write-Host "❌ Error copying files: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "You may need to copy manually or run as administrator" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "💡 Manual steps to fix path issues:" -ForegroundColor Yellow
    Write-Host "1. Create a new folder: C:\Shabari" -ForegroundColor White
    Write-Host "2. Copy your project there (avoid node_modules, build folders)" -ForegroundColor White
    Write-Host "3. Run npm install in the new location" -ForegroundColor White
    Write-Host "4. Continue building from the shorter path" -ForegroundColor White
}

Write-Host ""
Write-Host "📋 Additional Notes:" -ForegroundColor Cyan
Write-Host "• Windows has a 260 character path limit by default" -ForegroundColor White
Write-Host "• React Native builds create very deep folder structures" -ForegroundColor White
Write-Host "• Spaces in paths cause issues with ninja build system" -ForegroundColor White
Write-Host "• Moving to C:\Shabari solves both issues" -ForegroundColor White 