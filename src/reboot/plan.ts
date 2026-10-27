/** `/reboot` 的参数解析与可行性判定（纯函数）。 */

/** 判定所需的运行环境快照。 */
export interface RebootEnvironment {
  readonly platform: string
  readonly pid: number
  readonly ppid: number
  /** `process.env.DSH_DESKTOP_NODE_EXECUTABLE`（桌面端注入）。 */
  readonly desktopExecutable?: string | undefined
  /** `process.execPath`。 */
  readonly execPath: string
  readonly runAsNode: boolean
}

/** 判定结果。 */
export type RebootPlan =
  | { readonly ok: true; readonly mainPid: number; readonly exeHint: string }
  | { readonly ok: false; readonly reason: string }

/**
 * 判断当前进程能否重启桌面端。
 *
 * 只看能在当前进程内确证的事实：Windows + Electron Node 模式（桌面端注入
 * `ELECTRON_RUN_AS_NODE=1`）+ 一个不同于自身的父进程 PID。可执行文件路径只作为
 * 提示，真正的路径由守护脚本在杀进程前从父进程读取，避免版本差异。
 * @param env 环境快照。
 * @returns 判定结果。
 */
export function planReboot(env: RebootEnvironment): RebootPlan {
  if (env.platform !== 'win32') {
    return { ok: false, reason: '目前只支持 Windows 桌面端' }
  }
  if (!env.runAsNode) {
    return { ok: false, reason: '当前不是在 DSH 桌面端进程内运行（/reboot 只在桌面端可用）' }
  }
  const mainPid = env.ppid
  if (!Number.isInteger(mainPid) || mainPid <= 1) {
    return { ok: false, reason: '无法确定 Electron 主进程 PID' }
  }
  if (mainPid === env.pid) {
    return { ok: false, reason: '父进程与当前进程相同，已拒绝重启' }
  }
  const hint = (env.desktopExecutable ?? '').trim() !== '' ? env.desktopExecutable as string : env.execPath
  return { ok: true, mainPid, exeHint: hint }
}

/** `/reboot` 参数。 */
export interface RebootArgs {
  readonly mode: 'status' | 'check' | 'run' | 'help'
  readonly force: boolean
  readonly errors: readonly string[]
}

/**
 * 解析 `/reboot` 的原始输入。
 * @param rawInput 命令名之后的文本。
 * @returns 调用意图。
 */
export function parseRebootInput(rawInput: string): RebootArgs {
  const errors: string[] = []
  let yes = false
  let check = false
  let force = false
  let help = false
  for (const token of rawInput.trim().split(/\s+/u).filter(Boolean)) {
    switch (token.toLowerCase()) {
      case '--yes':
      case '-y':
        yes = true
        break
      case '--check':
        check = true
        break
      case '--force':
        force = true
        break
      case 'help':
      case '--help':
      case '-h':
        help = true
        break
      default:
        errors.push(`未知参数：${token}`)
    }
  }
  if (check && yes) errors.push('--check 与 --yes 不能同时使用')
  if (force && !yes) errors.push('--force 只能与 --yes 一起使用')
  const mode = help ? 'help' : check ? 'check' : yes ? 'run' : 'status'
  return { mode, force, errors }
}

/** `/reboot` 用法说明。 */
export const REBOOT_USAGE = [
  '/reboot 用法',
  '  /reboot            查看当前是否可重启（不执行）',
  '  /reboot --check    自检：解析主进程 PID/可执行文件并启动守护脚本（不杀进程）',
  '  /reboot --yes      立即重启 DSH 桌面端',
  '  /reboot --yes --force  有任务在运行时也强制重启',
  '',
  '说明：重启会结束当前桌面进程后自动拉起；未发送的输入框草稿会丢失。',
].join('\n')
