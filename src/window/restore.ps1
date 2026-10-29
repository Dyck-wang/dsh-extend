param(
  [Parameter(Mandatory = $true)][int]$MainPid,
  [Parameter(Mandatory = $true)][string]$StateFile
)
# Restore the DSH main window's saved rectangle and maximized flag.
$ErrorActionPreference = 'Stop'
Add-Type -Namespace DshExtend -Name Window -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
[DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(IntPtr value);
[DllImport("user32.dll")] public static extern int GetSystemMetrics(int nIndex);
[DllImport("user32.dll")] public static extern IntPtr MonitorFromRect(ref RECT rect, uint flags);
public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
public struct POINT { public int X; public int Y; }
public struct WINDOWPLACEMENT { public int length; public int flags; public int showCmd; public POINT ptMinPosition; public POINT ptMaxPosition; public RECT rcNormalPosition; }
'@
[void][DshExtend.Window]::SetProcessDpiAwarenessContext([IntPtr](-4))
if (-not (Test-Path -LiteralPath $StateFile)) { exit 0 }
$state = Get-Content -LiteralPath $StateFile -Raw | ConvertFrom-Json
$left = [int]$state.left
$top = [int]$state.top
$width = [int]$state.width
$height = [int]$state.height
if ($width -lt 520 -or $height -lt 600) { exit 4 }
$deadline = [DateTime]::Now.AddSeconds(20)
$handle = [IntPtr]::Zero
while ([DateTime]::Now -lt $deadline) {
  $process = Get-Process -Id $MainPid -ErrorAction SilentlyContinue
  if ($null -ne $process) {
    $handle = $process.MainWindowHandle
    if ($handle -ne [IntPtr]::Zero) { break }
  }
  Start-Sleep -Milliseconds 200
}
if ($handle -eq [IntPtr]::Zero) { exit 2 }
$virtualX = [DshExtend.Window]::GetSystemMetrics(76)
$virtualY = [DshExtend.Window]::GetSystemMetrics(77)
$virtualWidth = [DshExtend.Window]::GetSystemMetrics(78)
$virtualHeight = [DshExtend.Window]::GetSystemMetrics(79)

# Keep the saved rect whenever any monitor still exists under it, even if the
# window is partially outside the screen. Only clamp when it is entirely on a
# missing display (e.g. an unplugged monitor).
$saved = New-Object DshExtend.Window+RECT
$saved.Left = $left
$saved.Top = $top
$saved.Right = $left + $width
$saved.Bottom = $top + $height
$monitor = [DshExtend.Window]::MonitorFromRect([ref]$saved, 0)
if ($monitor -eq [IntPtr]::Zero) {
  if ($virtualWidth -gt 0) {
    $width = [Math]::Min($width, $virtualWidth)
    $left = [Math]::Max($virtualX, [Math]::Min($left, $virtualX + $virtualWidth - $width))
  }
  if ($virtualHeight -gt 0) {
    $height = [Math]::Min($height, $virtualHeight)
    $top = [Math]::Max($virtualY, [Math]::Min($top, $virtualY + $virtualHeight - $height))
  }
}
$flags = [uint32](0x0004 -bor 0x0010)
[void][DshExtend.Window]::SetWindowPos($handle, [IntPtr]::Zero, $left, $top, $width, $height, $flags)
if ($state.maximized -eq $true) { [void][DshExtend.Window]::ShowWindow($handle, 3) }
