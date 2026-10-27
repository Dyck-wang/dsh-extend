/**
 * 重启守护进程（由宿主用 Electron 的 Node 模式 detached 启动）。
 *
 * 为什么不用 PowerShell：实测 Windows 下以 detached 方式启动 powershell.exe 会
 * 立即退出且不执行 `-File` 脚本，导致 `/reboot` 永远等不到就绪信号。Node 进程
 * 在 detached 下工作正常，且被杀父进程后仍可存活。
 *
 * 流程：写就绪标记 → 等待 1.5s（让界面渲染命令结果）→ 结束 Electron 主进程 →
 * 等主进程与旧 Host 退出 → 用干净环境重新拉起应用。
 */
import { spawn } from 'node:child_process'
import { existsSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

/**
 * 写文件（失败不抛：标记文件只用于握手）。
 * @param {string} file 目标路径。
 * @param {string} text 内容。
 */
function writeText(file, text) {
  try { writeFileSync(file, text, 'utf8') } catch { /* 尽力而为 */ }
}

/**
 * 进程是否仍然存在。
 * @param {number} pid 进程 id。
 * @returns {boolean}
 */
function isAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

/**
 * 等待。
 * @param {number} ms 毫秒。
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const request = JSON.parse(process.argv[2] ?? '{}')
const mainPid = Number(request.mainPid)
const hostPid = Number(request.hostPid)
const exePath = typeof request.exePath === 'string' ? request.exePath : ''
const readyFile = typeof request.readyFile === 'string' ? request.readyFile : ''
const resultFile = typeof request.resultFile === 'string' ? request.resultFile : ''
const workDir = typeof request.workDir === 'string' ? request.workDir : ''
const delayMs = Number.isFinite(request.delayMs) ? Number(request.delayMs) : 1500
const dryRun = request.dryRun === true

try {
  if (!Number.isInteger(mainPid) || mainPid <= 1) throw new Error('invalid main pid')
  if (exePath === '' || !existsSync(exePath)) throw new Error(`executable not found: ${exePath}`)

  const summary = `mainPid=${mainPid}; hostPid=${hostPid}; exe=${exePath}; dryRun=${String(dryRun)}`
  writeText(resultFile, summary)
  writeText(readyFile, 'ready')
  if (dryRun) process.exit(0)

  // 让宿主先把命令结果渲染出来，再结束应用。
  await sleep(delayMs)
  process.kill(mainPid)

  // 主进程退出后 Host 会因 IPC 断开而优雅收尾；等它退出再拉起，避免两个 Host 同时写会话。
  const deadline = Date.now() + 25_000
  while (Date.now() < deadline) {
    if (!isAlive(mainPid) && !isAlive(hostPid)) break
    await sleep(200)
  }
  await sleep(600)

  const environment = { ...process.env }
  delete environment.ELECTRON_RUN_AS_NODE
  delete environment.DSH_DESKTOP_NODE_EXECUTABLE
  const relaunched = spawn(exePath, [], {
    detached: true,
    stdio: 'ignore',
    cwd: dirname(exePath),
    env: environment,
    windowsHide: false,
  })
  relaunched.unref()
  writeText(resultFile, `${summary}; relaunched`)
} catch (error) {
  writeText(resultFile, `error: ${error instanceof Error ? error.message : String(error)}`)
  writeText(readyFile, 'failed')
  process.exitCode = 1
} finally {
  if (!dryRun) {
    await sleep(300)
    if (workDir !== '') {
      try { rmSync(workDir, { recursive: true, force: true }) } catch { /* 尽力而为 */ }
    }
  }
}
