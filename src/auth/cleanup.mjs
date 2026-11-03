/**
 * DSH 桌面端认证 cookie 的退出后清理器。
 *
 * 由 Host 插件以 detached 方式启动，等待 Electron 主进程退出后再打开 Chromium
 * 的 Cookies SQLite 库，只删除 `dsh-auth-%` 行。不要在应用运行时调用。
 *
 * 参数：<主进程 PID> <Cookies DB 路径> <日志路径>
 */
import { DatabaseSync } from 'node:sqlite'
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const [pidArg, dbPath, logPath] = process.argv.slice(2)
const pid = Number(pidArg)
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/** 写日志；日志失败不能影响清理。 */
function log(message) {
  if (logPath === undefined || logPath === '') return
  try {
    mkdirSync(dirname(logPath), { recursive: true })
    appendFileSync(logPath, `${new Date().toISOString()} ${message}\n`)
  } catch {
    // 日志失败不改变清理结果。
  }
}

/** 进程是否仍存在；EPERM 视为存在（已退出时通常是 ESRCH）。 */
function isAlive(target) {
  if (!Number.isInteger(target) || target <= 0) return false
  try {
    process.kill(target, 0)
    return true
  } catch (error) {
    return error?.code === 'EPERM'
  }
}

/** 等待主进程退出，最多 24 小时；超时后放弃本次清理。 */
async function waitForExit() {
  const deadline = Date.now() + 24 * 60 * 60 * 1000
  while (Date.now() < deadline) {
    if (!isAlive(pid)) return true
    await sleep(500)
  }
  return false
}

/** 只允许清理桌面端 Chromium 的 Cookies 库，避免路径参数误伤其他数据库。 */
function isExpectedDatabase(path) {
  return path.endsWith('Cookies') && path.toLowerCase().includes('dsh-desktop')
}

/** 读取统一配置里的 authGuard.enabled；缺失或损坏时按启用处理。 */
function authGuardEnabled() {
  const home = process.env.DSH_HOME
  if (home === undefined || home === '') return true
  try {
    const config = JSON.parse(readFileSync(join(home, '.dsh-extend', 'config.json'), 'utf8'))
    const enabled = config?.authGuard?.enabled
    if (typeof enabled === 'boolean') return enabled
  } catch {
    // 配置缺失或损坏时按默认启用处理。
  }
  return true
}

async function main() {
  if (dbPath === undefined || !isExpectedDatabase(dbPath)) {
    log(`skip: unexpected database path ${dbPath ?? '(none)'}`)
    return
  }
  if (!existsSync(dbPath)) {
    log(`skip: database not found ${dbPath}`)
    return
  }
  if (!(await waitForExit())) {
    log('skip: main process still alive after timeout')
    return
  }
  // 用户可能在应用运行期间关闭了开关。
  if (!authGuardEnabled()) {
    log('skip: auth guard disabled')
    return
  }
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try {
      const database = new DatabaseSync(dbPath)
      database.exec('PRAGMA busy_timeout = 5000')
      const result = database.prepare("DELETE FROM cookies WHERE name LIKE 'dsh-auth-%'").run()
      database.close()
      log(`deleted ${String(result.changes)} auth cookies on attempt ${String(attempt)}`)
      return
    } catch (error) {
      log(`attempt ${String(attempt)} failed: ${error instanceof Error ? error.message : String(error)}`)
      await sleep(1000)
    }
  }
  log('gave up after 30 attempts')
}

void main()
