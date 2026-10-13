@echo off
rem Uninstall Plant HMI: finds the installed copy in Windows' app list and runs its uninstaller.
rem Works wherever it was installed. Your projects in %APPDATA%\Plant HMI\projects are kept.
title Uninstall Plant HMI
echo Looking for an installed Plant HMI...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$keys = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*','HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*','HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*';" ^
  "$app = Get-ItemProperty $keys -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -like 'Plant HMI*' -and $_.UninstallString } | Select-Object -First 1;" ^
  "if (-not $app) { Write-Host 'Plant HMI is not installed on this PC.'; exit 1 }" ^
  "Write-Host ('Found ' + $app.DisplayName + '. Starting the uninstaller...');" ^
  "Start-Process -FilePath 'cmd.exe' -ArgumentList ('/c \"' + $app.UninstallString + '\"') -Wait"
if errorlevel 1 (
  echo.
  pause
  exit /b 1
)
echo Done.
"%SystemRoot%\System32\timeout.exe" /t 3 >nul
