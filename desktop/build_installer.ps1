$env:PATH = "$HOME\.cargo\bin;" + $env:PATH
Set-Location "d:\MONVEX\desktop"
Write-Output "Building MONVEX Windows Executable & Installer..."
& npx tauri build
Write-Output "Build Completed."
