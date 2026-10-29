param(
  [Parameter(Mandatory = $true)][int]$MainPid,
  [Parameter(Mandatory = $true)][string]$StateFile
)
# Save the DSH main window's restore rectangle and maximized flag.
# The main process hides the window before the backend shuts down, and
# Process.MainWindowHandle ignores hidden windows, so enumerate the
# process's top-level windows instead.
$ErrorActionPreference = 'Stop'
Add-Type -Namespace DshExtend -Name Window -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool GetWindowPlacement(IntPtr hWnd, ref WINDOWPLACEMENT lpwndpl);
[DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(IntPtr value);
public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
public struct POINT { public int X; public int Y; }
public struct WINDOWPLACEMENT { public int length; public int flags; public int showCmd; public POINT ptMinPosition; public POINT ptMaxPosition; public RECT rcNormalPosition; }
'@
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class DshWindowFinder {
  private delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

  [DllImport("user32.dll")] private static extern bool EnumWindows(EnumWindowsProc callback, IntPtr lParam);
  [DllImport("user32.dll")] private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
  [DllImport("user32.dll")] private static extern IntPtr GetWindow(IntPtr hWnd, uint command);
  [DllImport("user32.dll")] private static extern int GetWindowLong(IntPtr hWnd, int index);
  [DllImport("user32.dll")] private static extern int GetWindowTextLength(IntPtr hWnd);
  [DllImport("user32.dll")] private static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);

  [StructLayout(LayoutKind.Sequential)]
  private struct RECT { public int Left; public int Top; public int Right; public int Bottom; }

  // Largest unowned top-level window of the process, hidden or not.
  public static IntPtr Find(uint targetProcessId, bool requireTitle) {
    IntPtr best = IntPtr.Zero;
    long bestArea = -1;
    EnumWindows(delegate(IntPtr hWnd, IntPtr lParam) {
      uint processId;
      GetWindowThreadProcessId(hWnd, out processId);
      if (processId != targetProcessId) return true;
      if (GetWindow(hWnd, 4) != IntPtr.Zero) return true;
      if ((GetWindowLong(hWnd, -20) & 0x80) != 0) return true;
      if (requireTitle && GetWindowTextLength(hWnd) == 0) return true;
      RECT rect;
      if (!GetWindowRect(hWnd, out rect)) return true;
      long area = (long)(rect.Right - rect.Left) * (rect.Bottom - rect.Top);
      if (area > bestArea) {
        bestArea = area;
        best = hWnd;
      }
      return true;
    }, IntPtr.Zero);
    return best;
  }
}
'@
[void][DshExtend.Window]::SetProcessDpiAwarenessContext([IntPtr](-4))
$process = Get-Process -Id $MainPid -ErrorAction Stop
$handle = [DshWindowFinder]::Find([uint32]$MainPid, $true)
if ($handle -eq [IntPtr]::Zero) {
  $handle = [DshWindowFinder]::Find([uint32]$MainPid, $false)
}
if ($handle -eq [IntPtr]::Zero) {
  $handle = $process.MainWindowHandle
}
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
