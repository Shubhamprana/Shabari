# Set Java Environment to JDK 17 for React Native development
Write-Host "Setting up Java environment for React Native..." -ForegroundColor Green

# Set JAVA_HOME to JDK 17
$jdk17Path = "C:\Program Files\Eclipse Adoptium\jdk-17.0.15.6-hotspot"
$jdk17BinPath = "$jdk17Path\bin"

# Set system environment variables
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', $jdk17Path, 'User')

# Get current PATH and remove any existing Java paths
$currentPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
$pathArray = $currentPath -split ';' | Where-Object { $_ -notlike '*jdk*' -and $_ -notlike '*java*' }

# Add JDK 17 bin to the beginning of PATH for priority
$newPath = $jdk17BinPath + ';' + ($pathArray -join ';')
[System.Environment]::SetEnvironmentVariable('Path', $newPath, 'User')

# Set for current session
$env:JAVA_HOME = $jdk17Path
$env:PATH = $jdk17BinPath + ';' + $env:PATH

Write-Host "JAVA_HOME set to: $jdk17Path" -ForegroundColor Yellow
Write-Host "Java bin added to PATH" -ForegroundColor Yellow

# Verify installation
Write-Host "`nVerifying Java installation..." -ForegroundColor Green
try {
    $javaVersion = & "$jdk17BinPath\java.exe" -version 2>&1
    $javacVersion = & "$jdk17BinPath\javac.exe" -version 2>&1
    
    Write-Host "✅ Java version:" -ForegroundColor Green
    Write-Host $javaVersion -ForegroundColor White
    Write-Host "✅ JavaC version:" -ForegroundColor Green  
    Write-Host $javacVersion -ForegroundColor White
} catch {
    Write-Host "❌ Error verifying Java installation: $_" -ForegroundColor Red
}

Write-Host "`n🎉 Java environment setup complete!" -ForegroundColor Green
Write-Host "You may need to restart your terminal/IDE for changes to take full effect." -ForegroundColor Yellow 