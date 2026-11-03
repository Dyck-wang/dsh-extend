/**
 * 桌面端认证 cookie 的防护。
 *
 * 1. 在 303（token 换 cookie）响应里吊销本次没有重新签发的旧 `dsh-auth-*`，
 *    避免 cookie jar 随端口数量持续累积。
 * 2. 启动一个 detached 清理器，等 Electron 主进程退出后再删除 Cookies 库里的
 *    `dsh-auth-%` 行，作为已超限、303 拦不到时的兜底。
 */
import { ServerResponse } from 'node:http'
import { spawn } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { HostContext } from '../types.ts'
import {
  authGuardEnabled,
  setAuthGuardEnabled as saveAuthGuardEnabled,
} from '../config/state.ts'
import {
  deletionCookie,
  responseAuthCookieName,
  staleAuthCookieNames,
} from './cookies.ts'

export { authGuardEnabled }

/** 详情页开关使用的 Host 路由。 */
export const AUTH_GUARD_PATH = '/api/dsh-extend/auth-guard'

/** 原始 writeHead 的标记，避免重复包装。 */
const PATCH_MARKER: unique symbol = Symbol.for('dsh-extend.auth-cookie-guard')

type WriteHead = typeof ServerResponse.prototype.writeHead

interface HeadersLike {
  [key: string]: unknown
}

/** 是否是 writeHead 的 headers 参数。 */
function isHeaders(value: unknown): value is HeadersLike {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** 把 header 值规范成字符串数组。 */
function stringArray(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  return []
}

/** 找到 writeHead 参数里的 headers 对象及其下标。 */
function findHeaders(args: unknown[]): { index: number; headers: HeadersLike } | undefined {
  if (args.length === 1 && isHeaders(args[0])) return { index: 0, headers: args[0] }
  if (args.length === 2 && typeof args[0] === 'string' && isHeaders(args[1])) {
    return { index: 1, headers: args[1] }
  }
  return undefined
}

/**
 * 包装 `ServerResponse.prototype.writeHead`：只在 303 且本次签发认证 cookie 时，
 * 给旧 cookie 追加 `Max-Age=0`。任何异常都原样放行，绝不阻断响应。
 * @returns 恢复原始 writeHead 的 disposer。
 */
export function installWriteHeadGuard(): () => void {
  const proto = ServerResponse.prototype as ServerResponse & { [PATCH_MARKER]?: WriteHead }
  if (proto[PATCH_MARKER] !== undefined) return () => {}
  const original = proto.writeHead
  proto[PATCH_MARKER] = original
  proto.writeHead = function writeHeadWithAuthCookiePrune(
    this: ServerResponse,
    statusCode: number,
    ...args: unknown[]
  ): ServerResponse {
    const forwarded: unknown[] = [statusCode, ...args]
    try {
      if (statusCode === 303) {
        const found = findHeaders(args)
        if (found !== undefined) {
          const key = Object.keys(found.headers).find(name => name.toLowerCase() === 'set-cookie')
          const values = stringArray(key === undefined ? undefined : found.headers[key])
          if (values.some(value => responseAuthCookieName(value) !== undefined)) {
            const stale = staleAuthCookieNames(this.req?.headers.cookie, values)
            if (stale.length > 0) {
              const next = { ...found.headers }
              next[key ?? 'set-cookie'] = [...values, ...stale.map(deletionCookie)]
              args[found.index] = next
              forwarded[found.index + 1] = next
            }
          }
        }
      }
    } catch {
      // 清理逻辑失败时必须保持原始响应，避免影响登录/启动。
    }
    return original.apply(this, forwarded as Parameters<WriteHead>)
  } as WriteHead
  return () => {
    if (proto[PATCH_MARKER] === original) {
      proto.writeHead = original
      delete proto[PATCH_MARKER]
    }
  }
}

/** DSH home：优先环境变量，其次 Windows 用户目录。 */
function dshHome(): string {
  return process.env.DSH_HOME ?? join(process.env.USERPROFILE ?? process.env.HOME ?? '.', '.dsh')
}

let patchDispose: (() => void) | undefined

/**
 * 开关认证防护。启用时立即安装 303 补丁并补启动清理器；禁用时立即恢复
 * writeHead，并让已启动的清理器在退出时读取配置后跳过。
 * @param enabled 目标状态。
 */
export function setAuthGuardEnabled(enabled: boolean): void {
  saveAuthGuardEnabled(enabled)
  if (enabled) {
    if (patchDispose === undefined) patchDispose = installWriteHeadGuard()
    spawnCleanup()
    return
  }
  patchDispose?.()
  patchDispose = undefined
}

/** 追加兜底清理日志；失败不影响主流程。 */
function appendLog(message: string): void {
  try {
    const directory = join(dshHome(), '.dsh-extend')
    mkdirSync(directory, { recursive: true })
    appendFileSync(join(directory, 'auth-cleanup.log'), `${new Date().toISOString()} ${message}\n`)
  } catch {
    // 日志失败不改变清理结果。
  }
}

let cleanupSpawned = false

/**
 * 启动 detached 清理器：等待 Electron 主进程退出后删除 `dsh-auth-%`。
 * 只在 Windows 桌面端、且 Cookies 库存在时启动；失败仅记日志。
 */
function spawnCleanup(): void {
  if (cleanupSpawned || process.platform !== 'win32') return
  if (process.env.ELECTRON_RUN_AS_NODE !== '1') return
  // smoke 使用临时 DSH_HOME，不能让它退出时清理真实桌面 cookie 库。
  const home = process.env.DSH_HOME
  if (home !== undefined && home !== '') {
    const defaultHome = join(process.env.USERPROFILE ?? process.env.HOME ?? '', '.dsh')
    if (resolve(home) !== resolve(defaultHome)) return
  }
  const appData = process.env.APPDATA
  if (appData === undefined || appData === '') return
  const dbPath = join(appData, '@deepseek-ai', 'dsh-desktop', 'Network', 'Cookies')
  if (!existsSync(dbPath)) return
  if (!Number.isInteger(process.ppid) || process.ppid <= 0) return
  const helper = fileURLToPath(new URL('./cleanup.mjs', import.meta.url))
  if (!existsSync(helper)) return
  try {
    const child = spawn(process.execPath, [
      helper,
      String(process.ppid),
      dbPath,
      join(dshHome(), '.dsh-extend', 'auth-cleanup.log'),
    ], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    })
    child.unref()
    cleanupSpawned = true
  } catch (error) {
    appendLog(`spawn failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * 安装认证 cookie 防护。
 * @param ctx 宿主上下文。
 * @param options 测试可关闭兜底清理。
 */
export function installAuthCookieGuard(
  ctx: HostContext,
  options: { cleanup?: boolean } = {},
): void {
  if (!authGuardEnabled()) return
  try {
    patchDispose = installWriteHeadGuard()
    ctx.effect(() => () => {
      patchDispose?.()
      patchDispose = undefined
    }, 'dsh-extend: auth cookie 303 prune')
  } catch (error) {
    appendLog(`install failed: ${error instanceof Error ? error.message : String(error)}`)
    return
  }
  if (options.cleanup !== false) spawnCleanup()
}
