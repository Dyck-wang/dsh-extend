@echo off
rem Restart the DSH desktop app without needing the plugin to be loaded yet.
rem Double-click this file (or run it from a terminal). It is safe to run when
rem no desktop instance is running: it then reports that nothing was found.
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0restart-dsh.ps1"
echo.
pause
