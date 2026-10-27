# Standalone restart script for the DSH desktop app.
# Used once after the first plugin install (before /reboot is available).
# Finds the Electron main process (not a --type=* child, not the --expose-internals
# Host), terminates it, waits for the Host to settle, then relaunches the same exe.

$ErrorActionPreference = 'Stop'

$processName = 'DeepSeek Harness.exe'
$filter = "Name='" + $processName + "'"
$candidates = @(Get-CimInstance Win32_Process -Filter $filter -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -notmatch '--type=' -and $_.CommandLine -notmatch 'expose-internals' })

if ($candidates.Count -eq 0) {
  Write-Host 'DSH desktop is not running.'
  exit 1
}
if ($candidates.Count -gt 1) {
  $candidates = @($candidates | Sort-Object CreationDate | Select-Object -Last 1)
}

$main = $candidates[0]
$mainPid = [int]$main.ProcessId
$exe = $main.ExecutablePath
if ([string]::IsNullOrWhiteSpace($exe)) {
  Write-Host 'Cannot resolve the desktop executable path.'
  exit 1
}

Write-Host ("Restarting DSH desktop: pid=" + $mainPid + " exe=" + $exe)
Stop-Process -Id $mainPid -Force
Start-Sleep -Seconds 3
Start-Process -FilePath $exe -WorkingDirectory (Split-Path -Parent $exe)
Write-Host 'Relaunched.'
