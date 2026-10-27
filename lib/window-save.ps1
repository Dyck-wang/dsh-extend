param(
  [Parameter(Mandatory = $true)][int]$MainPid,
  [Parameter(Mandatory = $true)][string]$StateFile
)
# Save the DSH main window's restore rectangle and maximized flag.
$ErrorActionPreference = 'Stop'
Add-Type -Namespace DshExtend -Name Window -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool GetWindowPlacement(IntPtr hWnd, ref WINDOWPLACEMENT lpwndpl);
[DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(IntPtr value);
public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
public struct POINT { public int X; public int Y; }
public struct WINDOWPLACEMENT { public int length; public int flags; public int showCmd; public POINT ptMinPosition; public POINT ptMaxPosition; public RECT rcNormalPosition; }
'@
[void][DshExtend.Window]::SetProcessDpiAwarenessContext([IntPtr](-4))
$process = Get-Process -Id $MainPid -ErrorAction Stop
$handle = $process.MainWindowHandle
if ($handle -eq [IntPtr]::Zero) { exit 2 }
$placement = New-Object DshExtend.Window+WINDOWPLACEMENT
$placement.length = [System.Runtime.InteropServices.Marshal]::SizeOf($placement)
if (-not [DshExtend.Window]::GetWindowPlacement($handle, [ref]$placement)) { exit 3 }
$rect = $placement.rcNormalPosition
$state = [ordered]@{
  left = $rect.Left
  top = $rect.Top
  width = $rect.Right - $rect.Left
  height = $rect.Bottom - $rect.Top
  maximized = ($placement.showCmd -eq 3)
  savedAt = [DateTime]::UtcNow.ToString('o')
}
$directory = Split-Path -Parent $StateFile
if (-not (Test-Path -LiteralPath $directory)) { New-Item -ItemType Directory -Force -Path $directory | Out-Null }
$temp = "$StateFile.tmp"
$state | ConvertTo-Json -Compress | Set-Content -LiteralPath $temp -Encoding ASCII
Move-Item -LiteralPath $temp -Destination $StateFile -Force
