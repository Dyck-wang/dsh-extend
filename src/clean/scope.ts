/** 客户端面板的会话范围数据。 */
import type { HostContext } from '../types.ts'
import { archivedSessionIds } from './archived.ts'
import { attachTitles, collectEntries, markBlank } from './inventory.ts'
import type { SessionEntry } from './types.ts'

/** 面板可用的范围。 */
export type CleanScope = 'all' | 'archived' | '30d' | '90d' | 'empty'

/** 范围行。 */
export interface ScopeRow {
  readonly id: string
  readonly title?: string
  readonly cwd?: string
  readonly createdAt: number
  readonly lastActivity: number
  readonly bytes: number
  readonly live: boolean
  readonly blank?: boolean
  /** 面板打开时是否默认勾选。 */
  readonly suggested: boolean
}

/** 范围响应。 */
export interface ScopeResponse {
  readonly ok: true
  readonly scope: CleanScope
  readonly preselect: 'suggested' | 'none'
  readonly generatedAt: number
  readonly totals: { readonly count: number; readonly bytes: number; readonly live: number }
  readonly truncated?: boolean
  readonly rows: readonly ScopeRow[]
}

const MAX_ROWS = 500
const DAY = 86_400_000
const SCOPE_DAYS: Record<Exclude<CleanScope, 'all' | 'archived' | 'empty'>, number> = { '30d': 30, '90d': 90 }

/**
 * 判断输入是否是受支持的范围。
 * @param value 查询参数。
 * @returns 范围。
 */
export function isCleanScope(value: string): value is CleanScope {
  return value === 'all' || value === 'archived' || value === '30d' || value === '90d' || value === 'empty'
}

/**
 * 构造面板要展示的会话集合。
 *
 * - `all`：全部顶层会话（含使用中的，默认不勾选使用中的）；
 * - `archived`：已归档且不在使用中的会话；
 * - `30d/90d`：仅超过该时长且不在使用中的会话；
 * - `empty`：没有任何用户消息、且不在使用中的会话。
 *
 * @param ctx 宿主上下文。
 * @param options 范围与默认勾选策略。
 * @param signal 取消信号。
 * @returns 范围响应。
 */
export async function buildSessionScope(
  ctx: HostContext,
  options: { readonly scope: CleanScope; readonly preselect: 'suggested' | 'none' },
  signal?: AbortSignal,
): Promise<ScopeResponse> {
  const entries = await collectEntries(ctx, { signal })
  const top = entries.filter(entry => !entry.subagent)
  const now = Date.now()

  let base: SessionEntry[]
  if (options.scope === 'all') {
    base = top
  } else if (options.scope === 'archived') {
    const archived = archivedSessionIds(ctx)
    base = top.filter(entry => !entry.live && archived.has(entry.id))
    // 标出“空会话”，避免看起来像工作区记录。
    try {
      await markBlank(ctx, base, signal)
    } catch {
      // 没有会话查询服务时只是不显示空会话标记。
    }
  } else if (options.scope === 'empty') {
    const candidates = top.filter(entry => !entry.live)
    await markBlank(ctx, candidates, signal)
    base = candidates.filter(entry => entry.blank === true)
  } else {
    const days = SCOPE_DAYS[options.scope]
    base = top.filter(entry => !entry.live && now - entry.lastActivity >= days * DAY)
  }

  await attachTitles(ctx, base, signal)
  const sorted = [...base].sort((left, right) => right.lastActivity - left.lastActivity)
  const limited = sorted.slice(0, MAX_ROWS)
  const totalBytes = sorted.reduce((sum, entry) => sum + entry.bytes, 0)
  const live = sorted.filter(entry => entry.live).length

  return {
    ok: true,
    scope: options.scope,
    preselect: options.preselect,
    generatedAt: now,
    totals: { count: sorted.length, bytes: totalBytes, live },
    ...(sorted.length > limited.length ? { truncated: true } : {}),
    rows: limited.map((entry) => ({
      id: entry.id,
      ...(entry.title === undefined ? {} : { title: entry.title }),
      ...(entry.cwd === undefined ? {} : { cwd: entry.cwd }),
      createdAt: entry.createdAt,
      lastActivity: entry.lastActivity,
      bytes: entry.bytes,
      live: entry.live,
      ...(entry.blank === undefined ? {} : { blank: entry.blank }),
      suggested: options.preselect === 'suggested' && !entry.live,
    })),
  }
}
