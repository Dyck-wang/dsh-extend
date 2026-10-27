/** 从 DSH 服务收集历史会话条目。 */
import { stat } from 'node:fs/promises'
import {
  service,
  type HostContext,
  type SessionPersistence,
  type SessionQuery,
  type SessionStore,
  type SessionTitleResult,
} from '../types.ts'
import { mapPool } from '../util.ts'
import { dirFromLocation, locateSessionDir, sessionRootOf } from './layout.ts'
import type { SessionEntry } from './types.ts'

/** 读取文件 stat（失败时返回 undefined）。 */
async function statOf(path: string | undefined): Promise<{ mtimeMs: number; size: number } | undefined> {
  if (path === undefined) return undefined
  try {
    const info = await stat(path)
    return { mtimeMs: info.mtimeMs, size: info.size }
  } catch {
    return undefined
  }
}

/**
 * 收集全部历史会话（含 live / 子代理标记）。
 *
 * 有的 DSH 构建在持久化快照里不返回 `location`，此时按后端目录规则推导会话目录，
 * 并做磁盘校验；两条路都走不通的会话无法删除（但可正常展示）。
 * @param ctx 宿主上下文。
 * @param options `titles` 为 true 时顺带读取标题。
 * @returns 会话条目（未排序）。
 */
export async function collectEntries(
  ctx: HostContext,
  options: { readonly titles?: boolean; readonly signal?: AbortSignal } = {},
): Promise<readonly SessionEntry[]> {
  const persistence = service<SessionPersistence>(ctx, 'sessionPersistence')
  if (persistence === undefined) {
    throw new Error('当前 Host 未提供会话持久化服务（sessionPersistence），无法读取历史会话')
  }
  const snapshots = await persistence.list(options.signal === undefined ? {} : { signal: options.signal })
  const store = service<SessionStore>(ctx, 'sessions')
  const live = new Set((store?.list() ?? []).map(session => String(session.id)))
  const root = sessionRootOf(persistence)

  const entries: SessionEntry[] = []
  for (const snapshot of snapshots) {
    const header = snapshot.header
    const file = snapshot.location?.path
    const info = await statOf(file)
    let directory = file === undefined ? undefined : dirFromLocation(file)
    let located: { mtimeMs: number; size: number } | undefined
    if (directory === undefined && root !== undefined) {
      const found = await locateSessionDir(root, header)
      if (found !== undefined) {
        directory = found.dir
        located = found
      }
    }
    entries.push({
      id: String(header.id),
      ...(header.cwd === undefined ? {} : { cwd: header.cwd }),
      createdAt: header.createdAt,
      lastActivity: info?.mtimeMs ?? located?.mtimeMs ?? header.createdAt,
      bytes: snapshot.sizeBytes ?? info?.size ?? located?.size ?? 0,
      live: live.has(String(header.id)),
      subagent: header.origin === 'subagent',
      ...(header.parentSession === undefined ? {} : { parentId: String(header.parentSession) }),
      ...(directory === undefined ? {} : { dir: directory }),
    })
  }
  if (options.titles === true) await attachTitles(ctx, entries, options.signal)
  return entries
}

/**
 * 批量补标题（失败时保持无标题，不影响删除）。
 * @param ctx 宿主上下文。
 * @param entries 待补标题的条目。
 * @param signal 取消信号。
 */
export async function attachTitles(
  ctx: HostContext,
  entries: SessionEntry[],
  signal?: AbortSignal,
): Promise<void> {
  const query = service<SessionQuery>(ctx, 'sessionQuery')
  if (query === undefined || entries.length === 0) return
  const ids = entries.map(entry => entry.id)
  const titles = new Map<string, string>()
  const chunk = 64
  for (let index = 0; index < ids.length; index += chunk) {
    try {
      const results = await withTimeout(
        query.readTitleSnapshots(ids.slice(index, index + chunk), signal),
        3_000,
      )
      if (results === undefined) break
      for (const result of results as readonly SessionTitleResult[]) {
        if (result.status !== 'fulfilled') continue
        const title = result.value.title?.title
        if (typeof title === 'string' && title.trim() !== '') titles.set(String(result.sessionId), title.trim())
      }
    } catch {
      // 标题只影响展示；读取失败时保留 (无标题)。
    }
  }
  for (const entry of entries) {
    const title = titles.get(entry.id)
    if (title !== undefined) entry.title = title
  }
}

/**
 * 给一次异步读取加上限时，避免标题读取拖住整个命令。
 * @param promise 目标 Promise。
 * @param ms 上限毫秒数。
 * @returns 结果，或超时时的 undefined。
 */
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<undefined>((resolve) => {
        timer = setTimeout(() => { resolve(undefined) }, ms)
        timer.unref?.()
      }),
    ])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

/**
 * 计算哪些会话没有任何用户消息（用于 `--empty`）。
 * 需要 session-query 服务；失败一律按“非空”处理，避免误删。
 * @param ctx 宿主上下文。
 * @param entries 待判定的条目（会就地写入 `blank`）。
 * @param signal 取消信号。
 */
export async function markBlank(
  ctx: HostContext,
  entries: readonly SessionEntry[],
  signal?: AbortSignal,
): Promise<void> {
  const query = service<SessionQuery>(ctx, 'sessionQuery')
  if (query === undefined) {
    throw new Error('当前 Host 未提供会话查询服务（sessionQuery），无法计算空会话；请改用 --older-than 或指定序号')
  }
  await mapPool(entries, 4, async (entry) => {
    if (signal?.aborted === true) return
    try {
      const log = await query.readSession(entry.id)
      const start = Math.max(0, log.inheritedEventCount)
      const hasUserTurn = log.events
        .slice(start)
        .some(event => event.type === 'turn/start' || event.type === 'user/message')
      entry.blank = !hasUserTurn
    } catch {
      entry.blank = false
    }
  })
}

/**
 * 项目关键字匹配（大小写无关，斜杠统一）。
 * @param entry 会话条目。
 * @param keyword 关键字。
 * @returns 是否匹配。
 */
export function matchesProjectKeyword(entry: SessionEntry, keyword: string): boolean {
  if (entry.cwd === undefined) return false
  const normalize = (value: string): string => value.replace(/\\/gu, '/').toLowerCase()
  return normalize(entry.cwd).includes(normalize(keyword))
}

/** 批量条件。 */
export interface BatchFilter {
  readonly olderThanMs?: number
  readonly empty?: boolean
  readonly all?: boolean
  readonly project?: string
}

/**
 * 按批量条件筛选可删除的顶层会话（排除 live 与子代理）。
 * @param entries 全部条目。
 * @param filter 条件。
 * @param now 当前时间。
 * @returns 命中的条目（按最后活动倒序）。
 */
export function selectBatch(
  entries: readonly SessionEntry[],
  filter: BatchFilter,
  now: number,
): readonly SessionEntry[] {
  return entries
    .filter(entry => !entry.live && !entry.subagent)
    .filter(entry => (filter.project === undefined ? true : matchesProjectKeyword(entry, filter.project)))
    .filter((entry) => {
      if (filter.empty === true) return entry.blank === true
      if (filter.olderThanMs !== undefined) return now - entry.lastActivity >= filter.olderThanMs
      return true
    })
    .sort((left, right) => right.lastActivity - left.lastActivity)
}

/**
 * 展开目标会话的全部子代理后代。
 * @param targets 直接选中的会话。
 * @param all 全部条目。
 * @returns 含后代的目标集合（按输入顺序）。
 */
export function expandDescendants(
  targets: readonly SessionEntry[],
  all: readonly SessionEntry[],
): readonly SessionEntry[] {
  const selected = new Set(targets.map(entry => entry.id))
  let changed = true
  while (changed) {
    changed = false
    for (const entry of all) {
      if (selected.has(entry.id)) continue
      if (entry.parentId !== undefined && selected.has(entry.parentId)) {
        selected.add(entry.id)
        changed = true
      }
    }
  }
  return all.filter(entry => selected.has(entry.id))
}
