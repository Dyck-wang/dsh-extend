/** 供客户端弹窗使用的只读统计。 */
import type { HostContext } from '../types.ts'
import { archivedSessionIds } from './archived.ts'
import { collectEntries } from './inventory.ts'

/** 统计响应。 */
export interface CleanSummary {
  readonly ok: true
  readonly generatedAt: number
  readonly totals: {
    readonly sessions: number
    readonly bytes: number
    readonly live: number
  }
  /** 已归档（且未在使用中）的会话。 */
  readonly archived: {
    readonly count: number
    readonly bytes: number
  }
  readonly buckets: readonly {
    readonly days: number
    readonly count: number
    readonly bytes: number
  }[]
  readonly all: {
    readonly count: number
    readonly bytes: number
  }
}

const CACHE_TTL_MS = 30_000
const BUCKET_DAYS = [30, 90] as const
let cache: { readonly at: number; readonly value: CleanSummary } | undefined

/**
 * 生成会话统计（只读，不删除任何东西）。
 * @param ctx 宿主上下文。
 * @param options `fresh` 为 true 时忽略缓存。
 * @returns 统计响应。
 */
export async function buildSummary(ctx: HostContext, options: { readonly fresh?: boolean } = {}): Promise<CleanSummary> {
  const cached = cache
  if (options.fresh !== true && cached !== undefined && Date.now() - cached.at < CACHE_TTL_MS) return cached.value

  const entries = await collectEntries(ctx)
  const top = entries.filter(entry => !entry.subagent)
  const deletable = top.filter(entry => !entry.live)
  const archived = archivedSessionIds(ctx)
  const archivedEntries = deletable.filter(entry => archived.has(entry.id))
  const now = Date.now()
  const total = (items: readonly { bytes: number }[]): number => items.reduce((sum, item) => sum + item.bytes, 0)

  const value: CleanSummary = {
    ok: true,
    generatedAt: now,
    totals: {
      sessions: top.length,
      bytes: total(top),
      live: top.length - deletable.length,
    },
    archived: { count: archivedEntries.length, bytes: total(archivedEntries) },
    buckets: BUCKET_DAYS.map((days) => {
      const matched = deletable.filter(entry => now - entry.lastActivity >= days * 86_400_000)
      return { days, count: matched.length, bytes: total(matched) }
    }),
    all: { count: deletable.length, bytes: total(deletable) },
  }
  cache = { at: now, value }
  return value
}

/** 清空统计缓存（删除后调用）。 */
export function resetSummaryCache(): void {
  cache = undefined
}
