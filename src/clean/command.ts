/** `/clean` 命令：清单、按序号/id 删除、批量删除。 */
import type { CommandInvocation, CommandResult, HostContext } from '../types.ts'
import { deleteSessions } from './delete.ts'
import { formatDeleteReport, formatInventory, formatPreview } from './format.ts'
import {
  attachTitles,
  collectEntries,
  markBlank,
  matchesProjectKeyword,
  selectBatch,
} from './inventory.ts'
import { CLEAN_USAGE, parseCleanInput } from './parse.ts'
import { resetSummaryCache } from './summary.ts'
import type { ResultStore } from './results.ts'
import type { DeleteOutcome, SessionEntry } from './types.ts'

/** 序号快照有效期。 */
const SNAPSHOT_TTL_MS = 15 * 60_000

/** 每个会话各自的清单序号快照。 */
export class SnapshotStore {
  private readonly snapshots = new Map<string, { readonly at: number; readonly ids: readonly string[] }>()

  /**
   * 记录一次清单展示的序号顺序。
   * @param agentId 接收命令的 agent（会话）id。
   * @param ids 按序号排列的会话 id。
   */
  save(agentId: string, ids: readonly string[]): void {
    this.snapshots.set(agentId, { at: Date.now(), ids: [...ids] })
  }

  /**
   * 取回未过期的序号快照。
   * @param agentId agent id。
   * @returns 快照，或 undefined（未生成/已过期）。
   */
  resolve(agentId: string): { readonly at: number; readonly ids: readonly string[] } | undefined {
    const snapshot = this.snapshots.get(agentId)
    if (snapshot === undefined) return undefined
    if (Date.now() - snapshot.at > SNAPSHOT_TTL_MS) {
      this.snapshots.delete(agentId)
      return undefined
    }
    return snapshot
  }

  /** 删除后让旧序号失效。 */
  clear(agentId: string): void {
    this.snapshots.delete(agentId)
  }
}

function error(text: string): CommandResult {
  return { kind: 'error', text }
}

/**
 * 执行一次 `/clean` 调用。
 * @param ctx 宿主上下文。
 * @param snapshots 序号快照存储。
 * @param results 面板结果登记。
 * @param invocation 命令调用。
 * @returns 命令结果。
 */
export async function runCleanCommand(
  ctx: HostContext,
  snapshots: SnapshotStore,
  results: ResultStore,
  invocation: CommandInvocation,
): Promise<CommandResult> {
  const args = parseCleanInput(invocation.rawInput)
  if (args.errors.length > 0) return error(`${args.errors.join('\n')}\n\n${CLEAN_USAGE}`)
  if (args.mode === 'help') return { kind: 'success', text: CLEAN_USAGE }
  if (invocation.signal.aborted) return error('已取消。')

  const agentId = String(invocation.agent.id)
  let entries: readonly SessionEntry[]
  try {
    entries = await collectEntries(ctx, { signal: invocation.signal })
  } catch (cause) {
    return error(cause instanceof Error ? cause.message : String(cause))
  }

  if (args.mode === 'list') {
    const keyword = args.project
    const filtered = keyword === undefined ? entries : entries.filter(entry => matchesProjectKeyword(entry, keyword))
    const sorted = [...filtered].sort((left, right) => right.lastActivity - left.lastActivity)
    const limit = args.limit ?? 40
    const limited = limit > 0 ? sorted.slice(0, limit) : sorted
    await attachTitles(ctx, [...limited], invocation.signal)
    const inventory = formatInventory(limited, {
      limit: 0,
      totalCount: filtered.length,
      totalBytes: filtered.reduce((sum, entry) => sum + entry.bytes, 0),
      liveCount: filtered.filter(entry => entry.live).length,
      hiddenCount: filtered.length - limited.length,
    })
    snapshots.save(agentId, inventory.displayed.map(entry => entry.id))
    return { kind: 'success', text: inventory.text }
  }

  if (args.mode === 'select') {
    const selected = new Set<string>()
    if (args.indices.length > 0) {
      const snapshot = snapshots.resolve(agentId)
      if (snapshot === undefined) {
        return error('没有可用的清单快照（可能已过期）。请先执行 /clean list，再按清单里的序号删除。')
      }
      const outOfRange = args.indices.filter(index => !Number.isInteger(index) || index < 1 || index > snapshot.ids.length)
      if (outOfRange.length > 0) {
        return error(`序号超出范围：${outOfRange.join(', ')}（当前清单共 ${snapshot.ids.length} 条）`)
      }
      for (const index of args.indices) {
        const id = snapshot.ids[index - 1]
        if (id !== undefined) selected.add(id)
      }
    }
    const missing: string[] = []
    for (const raw of args.ids) {
      const exact = entries.find(entry => entry.id === raw)
      if (exact !== undefined) { selected.add(exact.id); continue }
      const matches = entries.filter(entry => entry.id.startsWith(raw))
      if (matches.length === 0) { missing.push(raw); continue }
      if (matches.length > 1) {
        const sample = matches.slice(0, 5).map(entry => entry.id).join('\n  ')
        return error(`id 前缀 ${raw} 匹配到 ${matches.length} 个会话，请输入更长前缀：\n  ${sample}`)
      }
      const match = matches[0]
      if (match !== undefined) selected.add(match.id)
    }
    if (args.viaIds) {
      if (selected.size === 0) return error(`选中的会话都不存在了：${missing.join(', ')}`)
    } else if (missing.length > 0) {
      return error(`找不到这些会话：${missing.join(', ')}（可能已被删除）`)
    }

    const targets = entries.filter(entry => selected.has(entry.id))
    if (targets.length === 0) return error('没有可删除的会话。')
    await attachTitles(ctx, targets, invocation.signal)
    const outcome = await deleteSessions(ctx, entries, targets, { via: 'command' })
    snapshots.clear(agentId)
    resetSummaryCache()
    if (args.requestToken !== undefined) rememberResult(results, args.requestToken, outcome)
    const missingNote = missing.length > 0 ? `\n另外 ${missing.length} 个会话已不存在，已跳过。` : ''
    const text = withWarnings(formatDeleteReport(outcome.deleted, outcome.bytes, outcome.failed), outcome.warnings) + missingNote
    return outcome.deleted.length > 0 ? { kind: 'success', text } : error(text)
  }

  // batch
  const deletablePool = entries.filter(entry => !entry.live && !entry.subagent)
  if (args.empty === true) {
    try {
      await markBlank(ctx, deletablePool, invocation.signal)
    } catch (cause) {
      return error(cause instanceof Error ? cause.message : String(cause))
    }
  }
  const matched = selectBatch(entries, {
    ...(args.olderThanMs === undefined ? {} : { olderThanMs: args.olderThanMs }),
    ...(args.empty ? { empty: true } : {}),
    ...(args.all ? { all: true } : {}),
    ...(args.project === undefined ? {} : { project: args.project }),
  }, Date.now())
  if (matched.length === 0) return { kind: 'success', text: '没有符合条件的会话。' }
  await attachTitles(ctx, [...matched], invocation.signal)

  if (args.yes !== true) {
    return { kind: 'success', text: formatPreview(matched, args.olderThanText, args.empty) }
  }

  const outcome = await deleteSessions(ctx, entries, matched, { via: 'command' })
  snapshots.clear(agentId)
  resetSummaryCache()
  if (args.requestToken !== undefined) rememberResult(results, args.requestToken, outcome)
  const text = withWarnings(formatDeleteReport(outcome.deleted, outcome.bytes, outcome.failed), outcome.warnings)
  return outcome.deleted.length > 0 ? { kind: 'success', text } : error(text)
}

/**
 * 把删除结果登记到面板可取的存储。
 * @param results 结果登记。
 * @param token 请求标记。
 * @param outcome 删除结果。
 */
function rememberResult(results: ResultStore, token: string, outcome: DeleteOutcome): void {
  results.remember(token, {
    deleted: outcome.deleted.map(entry => ({
      id: entry.id,
      title: entry.title ?? null,
      cwd: entry.cwd ?? null,
    })),
    failed: outcome.failed.map(item => ({ id: item.entry.id, reason: item.reason })),
    bytes: outcome.bytes,
  })
}

/**
 * 把删除告警附加到结果文本。
 * @param text 结果正文。
 * @param warnings 告警列表。
 * @returns 合并后的文本。
 */
function withWarnings(text: string, warnings: readonly string[]): string {
  if (warnings.length === 0) return text
  return `${text}\n\n注意：${warnings.join('；')}`
}
