/**
 * dsh-extend 的统一配置。
 *
 * 所有插件配置都落在 `<DSH_HOME>/.dsh-extend/config.json`，后续新增配置项直接扩展
 * 这个对象；读取失败时回退默认值，写入时保留未知字段。
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

/** 认证 cookie 防护配置。 */
export interface AuthGuardConfig {
  readonly enabled: boolean
}

/** 插件配置。 */
export interface DshExtendConfig {
  readonly version: 1
  readonly authGuard: AuthGuardConfig
  readonly [key: string]: unknown
}

/** DSH home：优先环境变量，其次用户目录。 */
function dshHome(): string {
  return process.env.DSH_HOME ?? join(process.env.USERPROFILE ?? process.env.HOME ?? '.', '.dsh')
}

/** 统一配置文件路径。 */
export function configPath(): string {
  return join(dshHome(), '.dsh-extend', 'config.json')
}

/** 把未知输入收窄成配置对象。 */
function normalize(value: unknown): DshExtendConfig {
  const raw = typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
  const authGuard = typeof raw.authGuard === 'object' && raw.authGuard !== null && !Array.isArray(raw.authGuard)
    ? raw.authGuard as Record<string, unknown>
    : {}
  const enabled = typeof authGuard.enabled === 'boolean' ? authGuard.enabled : true
  return {
    ...raw,
    version: 1,
    authGuard: { ...authGuard, enabled },
  }
}

/**
 * 读取配置；文件缺失或损坏时返回默认值。
 * @returns 当前配置。
 */
export function loadConfigSync(): DshExtendConfig {
  try {
    return normalize(JSON.parse(readFileSync(configPath(), 'utf8')))
  } catch {
    return normalize(undefined)
  }
}

/**
 * 写入配置；保留调用方传入的未知字段。
 * @param config 完整配置。
 */
export function saveConfigSync(config: DshExtendConfig): void {
  const target = configPath()
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, `${JSON.stringify(config, null, 2)}\n`, 'utf8')
}

/**
 * 认证防护是否启用。
 * @returns `authGuard.enabled` 的值。
 */
export function authGuardEnabled(): boolean {
  return loadConfigSync().authGuard.enabled
}

/**
 * 修改认证防护开关并写回统一配置。
 * @param enabled 目标状态。
 * @returns 写入后的配置。
 */
export function setAuthGuardEnabled(enabled: boolean): DshExtendConfig {
  const current = loadConfigSync()
  const next: DshExtendConfig = {
    ...current,
    version: 1,
    authGuard: { ...current.authGuard, enabled },
  }
  saveConfigSync(next)
  return next
}
