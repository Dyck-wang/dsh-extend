/** 永久删除会话目录（不可恢复），并同步 workspace 记录与客户端列表。 */
import { appendFile, lstat, mkdir, rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import {
  service,
  type HostContext,
  type SessionPersistence,
  type WorkspaceRegistry,
} from '../types.ts'
import { expandDescendants } from './inventory.ts'
import type { DeleteOutcome, SessionEntry } from './types.ts'

/** 删除来源，仅用于审计日志。 */
export type DeleteVia = 'command' | 'unknown'

/**
 * 追加一条删除审计记录（失败静默：审计不能影响删除本体）。
 * @param record 审计内容。
 */
async function appendAudit(record: Record<string, unknown>): Promise<void> {
  try {
    const home = process.env.DSH_HOME?.trim() || join(homedir(), '.dsh')
    const directory = join(home, '.dsh-extend')
    await mkdir(directory, { recursive: true })
    await appendFile(join(directory, 'audit.log'), `${JSON.stringify(record)}\n`, 'utf8')
  } catch {
    // 只读文件系统或磁盘满时忽略。
  }
}

/**
 * 从 workspace 记录中摘除会话（失败不阻塞删除）。
 * @param ctx 宿主上下文。
 * @param sessionId 会话 id。
 */
async function detachFromWorkspaces(ctx: HostContext, sessionId: string): Promise<void> {
  const registry = service<WorkspaceRegistry>(ctx, 'workspaceRegistry')
  if (registry === undefined) return
  let workspaces: ReturnType<WorkspaceRegistry['list']> = []
  try {
    workspaces = registry.list()
  } catch {
    return
  }
  for (const workspace of workspaces) {
    if (!workspace.sessionIds.includes(sessionId)) continue
    try {
      await workspace.detachSession(sessionId)
    } catch {
      // 记录层清理失败不影响删除本体；下次启动会按 header 校验成员。
    }
  }
  try {
    if (registry.archivedSessionIds.includes(sessionId)) await registry.unarchiveSession?.(sessionId)
  } catch { /* 悬挂 id 本身无害 */ }
  try {
    if (registry.pinnedSessionIds.includes(sessionId)) await registry.unpinSession?.(sessionId)
  } catch { /* 悬挂 id 本身无害 */ }
}

/**
 * 永久删除给定的会话（连同其子代理后代）。
 *
 * 顺序：flush 持久化 → 摘除 workspace 记录 → 删除目录 → 广播 `api-session/removed`。
 * 正在使用中的会话、无法安全定位目录的会话一律跳过并记录原因。
 * @param ctx 宿主上下文。
 * @param all 当前全部条目（用于展开后代）。
 * @param targets 直接选中的条目。
 * @returns 删除结果。
 */
export async function deleteSessions(
  ctx: HostContext,
  all: readonly SessionEntry[],
  targets: readonly SessionEntry[],
  options: { readonly via?: DeleteVia } = {},
): Promise<DeleteOutcome> {
  const warnings: string[] = []
  const persistence = service<SessionPersistence>(ctx, 'sessionPersistence')
  if (persistence !== undefined) {
    try {
      await persistence.flush()
    } catch (error) {
      warnings.push(`持久化 flush 失败：${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const chain = expandDescendants(targets, all)
  const deleted: SessionEntry[] = []
  const failed: { entry: SessionEntry; reason: string }[] = []
  let bytes = 0

  for (const entry of chain) {
    if (entry.live) {
      failed.push({ entry, reason: '会话正在使用中，已跳过' })
      continue
    }
    if (entry.dir === undefined || entry.dir === '') {
      failed.push({ entry, reason: '无法安全定位会话目录（不是当前 JSONL 后端布局），已跳过' })
      continue
    }
    try {
      const info = await lstat(entry.dir)
      if (info.isSymbolicLink()) throw new Error('会话目录是符号链接，拒绝删除')
      if (!info.isDirectory()) throw new Error('会话路径不是目录')
      await detachFromWorkspaces(ctx, entry.id)
      await rm(entry.dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 120 })
    } catch (error) {
      failed.push({ entry, reason: error instanceof Error ? error.message : String(error) })
      continue
    }
    deleted.push(entry)
    bytes += entry.bytes
    try {
      ctx.emit('api-session/removed', entry.id)
    } catch {
      // 广播失败只影响侧栏即时刷新。
    }
  }

  await appendAudit({
    at: new Date().toISOString(),
    via: options.via ?? 'unknown',
    deleted: deleted.map(entry => ({ id: entry.id, title: entry.title ?? null, cwd: entry.cwd ?? null, bytes: entry.bytes })),
    failed: failed.map(item => ({ id: item.entry.id, reason: item.reason })),
    bytes,
  })

  return { deleted, failed, bytes, warnings }
}
