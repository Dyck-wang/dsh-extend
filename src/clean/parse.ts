/** `/clean` 参数解析（纯函数，便于单测）。 */

/** 解析后的 `/clean` 调用意图。 */
export interface CleanArgs {
  readonly mode: 'list' | 'select' | 'batch' | 'help'
  readonly indices: readonly number[]
  readonly ids: readonly string[]
  /** id 来自 `--ids`（客户端面板传入的精确集合）。 */
  readonly viaIds: boolean
  readonly yes: boolean
  readonly all: boolean
  readonly empty: boolean
  readonly olderThanMs?: number
  readonly olderThanText?: string
  readonly project?: string
  readonly limit?: number
  /** 客户端面板用于取回删除结果的请求标记。 */
  readonly requestToken?: string
  readonly errors: readonly string[]
}

const LIST_WORDS = new Set(['list', 'ls', '清单'])
const HELP_WORDS = new Set(['help', '--help', '-h', '?'])
const REQUEST_TOKEN = /^[A-Za-z0-9_-]{8,64}$/u

/**
 * 解析人类可读的时长（`30d`、`12h`、`90m`、`7`＝7 天）。
 * @param input 原始文本。
 * @returns 毫秒数；非法或非正数返回 undefined。
 */
export function parseDuration(input: string): number | undefined {
  const match = /^(\d+(?:\.\d+)?)\s*([dhms]?)$/iu.exec(input.trim())
  if (match === null) return undefined
  const amount = Number(match[1])
  if (!Number.isFinite(amount) || amount <= 0) return undefined
  const rawUnit = match[2] ?? ''
  const unit = rawUnit === '' ? 'd' : rawUnit.toLowerCase()
  const factor = unit === 'd' ? 86_400_000 : unit === 'h' ? 3_600_000 : unit === 'm' ? 60_000 : 1_000
  return Math.round(amount * factor)
}

/**
 * 解析 `/clean` 的原始输入。
 * @param rawInput 命令名之后的全部文本。
 * @returns 调用意图；语法问题收集在 `errors` 中（调用方决定如何呈现）。
 */
export function parseCleanInput(rawInput: string): CleanArgs {
  const errors: string[] = []
  const indices: number[] = []
  const ids: string[] = []
  let viaIds = false
  let yes = false
  let all = false
  let empty = false
  let olderThanMs: number | undefined
  let olderThanText: string | undefined
  let project: string | undefined
  let limit: number | undefined
  let requestToken: string | undefined
  let listIntent = false
  let help = false

  const tokens = rawInput.trim().split(/\s+/u).filter(token => token !== '')
  const flagValue = (token: string, flag: string, index: number): { value?: string; consumed: boolean } => {
    if (token !== flag) return { value: token.slice(token.indexOf('=') + 1), consumed: false }
    const next = tokens[index + 1]
    if (next === undefined || next.startsWith('--')) {
      errors.push(`${flag} 需要一个值`)
      return { consumed: false }
    }
    return { value: next, consumed: true }
  }

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index] as string
    if (HELP_WORDS.has(token.toLowerCase())) { help = true; continue }
    if (LIST_WORDS.has(token.toLowerCase())) { listIntent = true; continue }
    if (token === '--yes' || token === '-y') { yes = true; continue }
    if (token === '--all') { all = true; continue }
    if (token === '--empty') { empty = true; continue }
    if (token === '--older-than' || token.startsWith('--older-than=')) {
      const parsed = flagValue(token, '--older-than', index)
      if (parsed.consumed) index += 1
      if (parsed.value === undefined) continue
      const duration = parseDuration(parsed.value)
      if (duration === undefined) errors.push(`无法识别的时间范围：${parsed.value}（示例：30d、12h、90m）`)
      else { olderThanMs = duration; olderThanText = parsed.value }
      continue
    }
    if (token === '--ids' || token.startsWith('--ids=')) {
      const parsed = flagValue(token, '--ids', index)
      if (parsed.consumed) index += 1
      if (parsed.value === undefined) continue
      const parts = parsed.value.split(',').map(part => part.trim()).filter(Boolean)
      if (parts.length === 0) errors.push('--ids 需要一个或多个会话 id')
      else { ids.push(...parts); viaIds = true }
      continue
    }
    if (token === '--request' || token.startsWith('--request=')) {
      const parsed = flagValue(token, '--request', index)
      if (parsed.consumed) index += 1
      if (parsed.value === undefined) continue
      if (!REQUEST_TOKEN.test(parsed.value)) errors.push('无效的请求标记')
      else requestToken = parsed.value
      continue
    }
    if (token === '--project' || token.startsWith('--project=')) {
      const parsed = flagValue(token, '--project', index)
      if (parsed.consumed) index += 1
      if (parsed.value !== undefined) project = parsed.value
      continue
    }
    if (token === '--limit' || token.startsWith('--limit=')) {
      const parsed = flagValue(token, '--limit', index)
      if (parsed.consumed) index += 1
      if (parsed.value === undefined) continue
      if (!/^\d+$/u.test(parsed.value)) errors.push(`--limit 需要非负整数，收到：${parsed.value}`)
      else limit = Number(parsed.value)
      continue
    }
    if (token.startsWith('--')) { errors.push(`未知参数：${token}`); continue }
    for (const part of token.split(',').filter(Boolean)) {
      if (part.startsWith('#')) {
        const value = part.slice(1)
        if (/^\d+$/u.test(value)) indices.push(Number(value))
        else errors.push(`无法识别的序号：${part}`)
        continue
      }
      if (/^\d+$/u.test(part)) { indices.push(Number(part)); continue }
      ids.push(part)
    }
  }

  if (help) {
    return { mode: 'help', indices: [], ids: [], viaIds: false, yes, all, empty, errors }
  }

  if (indices.length > 0 && ids.length > 0) errors.push('序号与会话 id 不能混用')
  const batchRequested = all || empty || olderThanMs !== undefined
  const selectors = [all, empty, olderThanMs !== undefined].filter(Boolean).length
  if (selectors > 1) errors.push('--all、--empty、--older-than 只能选一个')
  if (batchRequested && (indices.length > 0 || ids.length > 0)) errors.push('批量条件不能与序号/id 同时使用')
  if (batchRequested && listIntent) errors.push('list 不能与批量条件同时使用')
  if (listIntent && (indices.length > 0 || ids.length > 0)) errors.push('list 不能与序号/id 同时使用')
  if (yes && !batchRequested && !viaIds) errors.push('--yes 只用于批量清理或 --ids')
  if (requestToken !== undefined && !viaIds) errors.push('--request 只能与 --ids 一起使用')

  const mode = indices.length > 0 || ids.length > 0
    ? 'select'
    : batchRequested ? 'batch' : 'list'

  if (limit !== undefined && mode !== 'list') errors.push('--limit 仅用于清单')
  if (project !== undefined && mode === 'select') errors.push('--project 不能与序号/id 同时使用')

  return {
    mode,
    indices,
    ids,
    viaIds,
    yes,
    all,
    empty,
    ...(olderThanMs === undefined ? {} : { olderThanMs }),
    ...(olderThanText === undefined ? {} : { olderThanText }),
    ...(project === undefined ? {} : { project }),
    ...(limit === undefined ? {} : { limit }),
    ...(requestToken === undefined ? {} : { requestToken }),
    errors,
  }
}

/** `/clean` 用法说明。 */
export const CLEAN_USAGE = [
  '/clean 用法',
  '  /clean [list] [--limit N] [--project 关键字]   列出历史会话（默认前 40 条；--limit 0 为全部）',
  '  /clean 3 5 7                                  永久删除清单中序号为 3、5、7 的会话',
  '  /clean <id 前缀>                              按会话 id 前缀删除',
  '  /clean --older-than 30d [--yes]               删除 30 天前的会话（不带 --yes 只预览）',
  '  /clean --empty [--yes]                        删除没有任何用户消息的会话',
  '  /clean --all [--yes]                          删除全部非活跃会话',
  '',
  '桌面端直接输入 /clean 会打开可视化的勾选面板。',
  '注意：删除不可恢复；正在使用中的会话永远不会被删除。',
].join('\n')

