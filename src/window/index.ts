/**
 * 桌面窗口位置/大小记忆。
 *
 * 桌面端主进程没有窗口位置持久化，这里用两个 PowerShell 脚本补上：
 * - `save.ps1`：退出清理时同步读取主窗口的恢复矩形与最大化状态；
 * - `restore.ps1`：启动时等待主窗口出现，再按保存值移动/缩放。
 *
 * 只在 Windows 桌面端生效；失败时静默跳过，不影响其他功能。
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { HostContext } from '../types.ts'
import { windowStatePath } from './state.ts'

const SAVE_SCRIPT = fileURLToPath(new URL('./window-save.ps1', import.meta.url))
const RESTORE_SCRIPT = fileURLToPath(new URL('./window-restore.ps1', import.meta.url))
const SAVE_TIMEOUT_MS = 5_000

/**
 * 是否运行在 Windows 桌面端。
 *
 * 桌面 Host 由主进程以 Node 模式启动，但 `DSH_DESKTOP_NODE_EXECUTABLE` 只传给
 * 包管理器子进程，Host 自己拿不到；这里改用可执行文件旁的 `resources/app.asar`
 * 判定，避免误伤 `dsh web`（node.exe 旁边没有 resources 目录）。
 * @returns 是否启用窗口记忆。
 */
function isDesktop(): boolean {
  if (process.platform !== 'win32' || process.env.ELECTRON_RUN_AS_NODE !== '1') return false
  const appRoot = dirname(process.execPath)
  return existsSync(join(appRoot, 'resources', 'app.asar')) || existsSync(join(appRoot, 'resources', 'app'))
}

/**
 * 同步保存窗口状态（用于退出清理与 `/reboot`）。
 * @returns 无返回值；失败时静默。
 */
export function saveWindowStateSync(): void {
  if (!isDesktop()) return
  const mainPid = process.ppid
  if (!Number.isInteger(mainPid) || mainPid <= 1) return
  try {
    spawnSync('powershell.exe', [
      '-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-File', SAVE_SCRIPT,
      '-MainPid', String(mainPid),
      '-StateFile', windowStatePath(),
    ], { windowsHide: true, stdio: 'ignore', timeout: SAVE_TIMEOUT_MS })
  } catch {
    // 窗口已销毁或 PowerShell 不可用时保持上一次状态。
  }
}

/** 异步启动恢复脚本（不阻塞插件加载）。 */
function restoreWindowState(): void {
  if (!isDesktop()) return
  const mainPid = process.ppid
  if (!Number.isInteger(mainPid) || mainPid <= 1) return
  try {
    const child = spawn('powershell.exe', [
      '-NoLogo', '-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
      '-File', RESTORE_SCRIPT,
      '-MainPid', String(mainPid),
      '-StateFile', windowStatePath(),
    ], { stdio: 'ignore', windowsHide: true })
    child.on('error', () => { /* 静默：恢复失败不影响启动 */ })
    child.unref()
  } catch {
    // 同上。
  }
}

/**
 * 安装窗口位置记忆：启动时恢复，插件销毁（应用退出）时保存。
 * @param ctx 宿主上下文。
 */
export function installWindowState(ctx: HostContext): void {
  if (!isDesktop()) return
  ctx.effect(() => {
    restoreWindowState()
    return () => { saveWindowStateSync() }
  }, 'dsh-extend: window state')
}


