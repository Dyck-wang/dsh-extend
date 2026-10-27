/** 清单与结果的纯文本排版。 */
import type { SessionEntry } from './types.ts'

/**
 * 人类可读的字节数。
 * @param bytes 字节数。
 * @returns 例如 `812 B`、`21.3 KB`、`1.2 MB`。
 */
export function formatBytes(bytes: number): string {
  const value = Number.isFinite(bytes) && bytes > 0 ? bytes : 0
  if (value < 1024) return `${Math.round(value)} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/**
 * 本地时间 `MM-DD HH:mm`。
 * @param epochMs 毫秒时间戳。
 * @returns 固定宽度的本地时间文本。
 */
export function formatTime(epochMs: number): string {
  const date = new Date(epochMs)
  if (Number.isNaN(date.getTime())) return '??-?? ??:??'
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * 按码点截断，避免把代理对切坏。
 * @param text 原文。
 * @param max 最大码点数。
 * @returns 截断后的文本（超出时带省略号）。
 */
export function truncate(text: string, max: number): string {
  const points = Array.from(text.replace(/\s+/gu, ' ').trim())
  if (points.length <= max) return points.join('')
  return `${points.slice(0, Math.max(0, max - 1)).join('')}…`
}

/** 清单排版参数。 */
export interface InventoryOptions {
  /** 最多显示条数；0 表示不限。 */
  readonly limit: number
  /** 全部会话数（含未显示）。 */
  readonly totalCount: number
  /** 全部会话字节数。 */
  readonly totalBytes: number
  /** 使用中的会话数。 */
  readonly liveCount: number
  /** 因截断而未显示的条数（仅用于页脚提示）。 */
  readonly hiddenCount?: number
}

/** 清单排版结果。 */
export interface InventoryResult {
  readonly text: string
  /** 与序号一一对应的会话（按展示顺序）。 */
  readonly displayed: readonly SessionEntry[]
}

/**
 * 渲染带序号的会话清单，并按展示顺序返回序号映射。
 * @param entries 会话条目（未排序）。
 * @param options 排版参数。
 * @returns 文本与序号映射。
 */
export function formatInventory(entries: readonly SessionEntry[], options: InventoryOptions): InventoryResult {
  const sorted = [...entries].sort((left, right) => right.lastActivity - left.lastActivity)
  const limited = options.limit > 0 ? sorted.slice(0, options.limit) : sorted
  const groups = new Map<string, SessionEntry[]>()
  for (const entry of limited) {
    const key = entry.cwd ?? ''
    const bucket = groups.get(key)
    if (bucket === undefined) groups.set(key, [entry])
    else bucket.push(entry)
  }

  const header = [
    'DSH 功能扩展 · 历史会话',
    `共 ${options.totalCount} 个 · ${formatBytes(options.totalBytes)}`
      + (options.liveCount > 0 ? ` · 使用中 ${options.liveCount} 个（不会被删除）` : ''),
  ]
  const lines: string[] = [...header]

  if (options.totalCount === 0) {
    lines.push('', '没有历史会话。')
    return { text: lines.join('\n'), displayed: [] }
  }

  const width = Math.max(2, String(limited.length).length)
  const displayed: SessionEntry[] = []
  let index = 0
  for (const [cwd, group] of groups) {
    lines.push('')
    lines.push(`▌${cwd === '' ? '无工作目录' : truncate(cwd, 72)} · ${group.length} 个`)
    for (const entry of group) {
      index += 1
      displayed.push(entry)
      const title = truncate(entry.title ?? '(无标题)', 56)
      lines.push(
        `${String(index).padStart(width)}  ${formatTime(entry.lastActivity)}  ${formatBytes(entry.bytes).padStart(9)}  `
        + `${title}${entry.live ? '  [使用中]' : ''}`,
      )
    }
  }

  lines.push('')
  if ((options.hiddenCount ?? 0) > 0) {
    lines.push(`仅显示前 ${limited.length} 条（共 ${options.totalCount} 条）；/clean list --limit 0 查看全部`)
  }
  lines.push('删除指定会话：/clean 1 3 5（永久删除，不可恢复）')
  lines.push('批量删除：/clean --older-than 30d 先预览，确认后加 --yes')
  return { text: lines.join('\n'), displayed }
}

/**
 * 渲染删除结果。
 * @param deleted 已删除条目。
 * @param bytes 释放的字节数。
 * @param failed 失败条目与原因。
 * @returns 结果文本。
 */
export function formatDeleteReport(
  deleted: readonly SessionEntry[],
  bytes: number,
  failed: readonly { readonly entry: SessionEntry; readonly reason: string }[],
): string {
  const lines: string[] = []
  if (deleted.length > 0) {
    lines.push(`已永久删除 ${deleted.length} 个会话，释放 ${formatBytes(bytes)}`)
    const show = deleted.slice(0, 10)
    for (const entry of show) {
      lines.push(`  - ${truncate(entry.title ?? '(无标题)', 48)}（${truncate(entry.cwd ?? '无工作目录', 60)}）`)
    }
    if (deleted.length > show.length) lines.push(`  …以及另外 ${deleted.length - show.length} 个`)
  } else {
    lines.push('没有删除任何会话。')
  }
  if (failed.length > 0) {
    lines.push('', `失败 ${failed.length} 个：`)
    for (const failure of failed.slice(0, 10)) {
      lines.push(`  - ${failure.entry.id}：${failure.reason}`)
    }
    if (failed.length > 10) lines.push(`  …以及另外 ${failed.length - 10} 个`)
  }
  return lines.join('\n')
}

/**
 * 渲染批量删除的预览。
 * @param entries 命中的会话。
 * @param olderThanText 时间范围的原始写法（可缺省）。
 * @param emptyOnly 是否为空会话模式。
 * @returns 预览文本。
 */
export function formatPreview(
  entries: readonly SessionEntry[],
  olderThanText: string | undefined,
  emptyOnly: boolean,
): string {
  const bytes = entries.reduce((sum, entry) => sum + entry.bytes, 0)
  const lines = [
    `将永久删除 ${entries.length} 个会话，释放 ${formatBytes(bytes)}`
      + (olderThanText === undefined ? '' : `（条件：${olderThanText} 之前）`)
      + (emptyOnly ? '（条件：无用户消息）' : ''),
    '',
  ]
  for (const entry of entries.slice(0, 15)) {
    lines.push(`  - ${truncate(entry.title ?? '(无标题)', 48)}  ${formatTime(entry.lastActivity)}  ${formatBytes(entry.bytes)}`)
  }
  if (entries.length > 15) lines.push(`  …以及另外 ${entries.length - 15} 个`)
  lines.push('', '以上会话不会被立即删除。确认后重新执行并加上 --yes：')
  const condition = emptyOnly ? '--empty' : olderThanText === undefined ? '--all' : `--older-than ${olderThanText}`
  lines.push(`  /clean ${condition} --yes`)
  return lines.join('\n')
}
