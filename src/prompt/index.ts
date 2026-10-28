/**
 * 系统提示词管理：覆盖已组装段、追加自定义段，并提供命令与面板路由。
 *
 * 已组装段来自 `systemPrompt.assemble()`，本插件不改 DSH 安装文件，只在
 * `system-prompt/assemble` waterfall 里按 name 过滤/替换，实现增删改与还原。
 */
import { formatBytes, truncate } from '../clean/format.ts'
import { admitGet, admitPost, readJsonBody, writeJson } from '../http.ts'
import type { CommandInvocation, CommandResult, HostContext } from '../types.ts'
import { service } from '../types.ts'
import {
  applyPromptOverrides,
  currentSectionText,
  summarizeAssembled,
  type AssembledSectionSummary,
  type PromptPresentationLike,
} from './apply.ts'
import {
  createCustomPrompt,
  loadPromptStateSync,
  MAX_CUSTOM_PROMPTS,
  MAX_PROMPT_TEXT,
  MAX_PROMPT_TITLE,
  promptStatePath,
  writePromptState,
  type CustomPrompt,
  type PromptState,
} from './state.ts'

/** 面板列表路由。 */
export const PROMPTS_PATH = '/api/dsh-extend/prompts'
/** 单段全文路由。 */
export const PROMPTS_TEXT_PATH = '/api/dsh-extend/prompts/text'
/** 保存路由（POST）。 */
export const PROMPTS_SAVE_PATH = '/api/dsh-extend/prompts/save'

/** 组装结果（最小面）。 */
export interface PromptAssemblyLike extends PromptPresentationLike {
  readonly contexts?: readonly unknown[]
  readonly tools?: readonly unknown[]
  readonly variables?: Record<string, string | undefined>
}

/** 系统提示词服务（最小面）。 */
export interface SystemPromptLike {
  assemble(context?: { signal?: AbortSignal }): Promise<PromptAssemblyLike>
}

/** 瀑布上下文（最小面）。 */
interface AssembleContextLike {
  readonly signal?: AbortSignal
}

/** 瀑布监听器。 */
type AssembleListener = (
  presentation: PromptPresentationLike,
  context: AssembleContextLike | undefined,
  next: () => Promise<unknown>,
) => Promise<unknown>

/** 带事件注册面的宿主上下文。 */
interface PromptHostContext extends HostContext {
  on?(event: 'system-prompt/assemble', listener: AssembleListener): () => void
}

/** 覆盖状态的可变持有者。 */
interface PromptStore {
  current: PromptState
}

/** 列表响应。 */
export interface PromptListPayload {
  readonly ok: true
  readonly assembled: readonly AssembledSectionSummary[]
  readonly custom: readonly CustomPrompt[]
  readonly tools: number
  readonly contexts: number
}

/** 变更请求。 */
export type PromptChange =
  | { readonly action: 'set'; readonly name: string; readonly text: string }
  | { readonly action: 'disable' | 'enable' | 'reset'; readonly name: string }
  | { readonly action: 'reset-all' }
  | { readonly action: 'add'; readonly title: string; readonly text: string }
  | { readonly action: 'update'; readonly id: string; readonly title?: string; readonly text?: string }
  | { readonly action: 'remove'; readonly id: string }
  | { readonly action: 'toggle'; readonly id: string; readonly enabled: boolean }

/**
 * 计算一次变更后的新状态。
 * @param state 当前状态。
 * @param change 变更。
 * @returns 新状态或错误信息。
 */
export function applyPromptChange(state: PromptState, change: PromptChange): { readonly state: PromptState } | { readonly error: string } {
  switch (change.action) {
    case 'set': {
      const name = change.name.trim()
      if (name === '') return { error: '缺少段名' }
      if (change.text.length > MAX_PROMPT_TEXT) return { error: '文本过长' }
      const replacements = { ...state.replacements }
      if (change.text.trim() === '') delete replacements[name]
      else replacements[name] = change.text
      return { state: { ...state, replacements } }
    }
    case 'disable': {
      const name = change.name.trim()
      if (name === '') return { error: '缺少段名' }
      const disabled = state.disabled.includes(name) ? state.disabled : [...state.disabled, name]
      return { state: { ...state, disabled } }
    }
    case 'enable': {
      const disabled = state.disabled.filter(name => name !== change.name.trim())
      return { state: { ...state, disabled } }
    }
    case 'reset': {
      const name = change.name.trim()
      const replacements = { ...state.replacements }
      delete replacements[name]
      return {
        state: {
          ...state,
          replacements,
          disabled: state.disabled.filter(item => item !== name),
        },
      }
    }
    case 'reset-all':
      return { state: { ...state, disabled: [], replacements: {} } }
    case 'add': {
      if (state.custom.length >= MAX_CUSTOM_PROMPTS) return { error: `自定义提示词最多 ${MAX_CUSTOM_PROMPTS} 条` }
      if (change.text.trim() === '') return { error: '文本不能为空' }
      if (change.text.length > MAX_PROMPT_TEXT) return { error: '文本过长' }
      if (change.title.length > MAX_PROMPT_TITLE) return { error: '标题过长' }
      return { state: { ...state, custom: [...state.custom, createCustomPrompt(change.title, change.text)] } }
    }
    case 'update': {
      const target = state.custom.find(item => item.id === change.id)
      if (target === undefined) return { error: '找不到该自定义提示词' }
      if (change.text !== undefined && change.text.trim() === '') return { error: '文本不能为空' }
      if (change.text !== undefined && change.text.length > MAX_PROMPT_TEXT) return { error: '文本过长' }
      if (change.title !== undefined && change.title.length > MAX_PROMPT_TITLE) return { error: '标题过长' }
      const custom = state.custom.map(item => item.id === change.id
        ? {
          ...item,
          ...(change.title === undefined ? {} : { title: change.title.trim() === '' ? '未命名' : change.title.trim() }),
          ...(change.text === undefined ? {} : { text: change.text }),
        }
        : item)
      return { state: { ...state, custom } }
    }
    case 'remove': {
      if (!state.custom.some(item => item.id === change.id)) return { error: '找不到该自定义提示词' }
      return { state: { ...state, custom: state.custom.filter(item => item.id !== change.id) } }
    }
    case 'toggle': {
      if (!state.custom.some(item => item.id === change.id)) return { error: '找不到该自定义提示词' }
      return {
        state: {
          ...state,
          custom: state.custom.map(item => item.id === change.id ? { ...item, enabled: change.enabled } : item),
        },
      }
    }
  }
}

/**
 * 读取默认已组装段并生成列表响应。
 * @param ctx 宿主上下文。
 * @param store 状态。
 * @param probeSignal 列表探针信号（绕过自身覆盖）。
 * @returns 列表结果或错误。
 */
async function buildList(ctx: HostContext, store: PromptStore, probeSignal: AbortSignal): Promise<{ readonly ok: true; readonly payload: PromptListPayload } | { readonly ok: false; readonly error: string }> {
  const systemPrompt = service<SystemPromptLike>(ctx, 'systemPrompt')
  if (systemPrompt === undefined) return { ok: false, error: 'systemPrompt 服务不可用' }
  try {
    const assembly = await systemPrompt.assemble({ signal: probeSignal })
    return {
      ok: true,
      payload: {
        ok: true,
        assembled: summarizeAssembled(assembly.sections, store.current),
        custom: store.current.custom,
        tools: assembly.tools?.length ?? 0,
        contexts: assembly.contexts?.length ?? 0,
      },
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * 保存一次变更（写盘后更新内存状态）。
 * @param store 状态。
 * @param change 变更。
 * @returns 错误信息（成功时为 undefined）。
 */
async function saveChange(store: PromptStore, change: PromptChange): Promise<string | undefined> {
  const result = applyPromptChange(store.current, change)
  if ('error' in result) return result.error
  try {
    await writePromptState(result.state, promptStatePath())
  } catch (error) {
    return `保存失败：${error instanceof Error ? error.message : String(error)}`
  }
  store.current = result.state
  return undefined
}

/**
 * 读取某段的当前文本。
 * @param ctx 宿主上下文。
 * @param store 状态。
 * @param probeSignal 列表探针信号。
 * @param name 段名。
 * @returns 文本或错误。
 */
async function readSectionText(ctx: HostContext, store: PromptStore, probeSignal: AbortSignal, name: string): Promise<{ readonly text: string; readonly overridden: boolean; readonly disabled: boolean } | { readonly error: string }> {
  const systemPrompt = service<SystemPromptLike>(ctx, 'systemPrompt')
  if (systemPrompt === undefined) return { error: 'systemPrompt 服务不可用' }
  try {
    const assembly = await systemPrompt.assemble({ signal: probeSignal })
    const section = assembly.sections.find(item => item.name === name)
    if (section === undefined) return { error: `找不到段：${name}` }
    return {
      text: currentSectionText(name, section.text, store.current),
      overridden: Object.hasOwn(store.current.replacements, name),
      disabled: store.current.disabled.includes(name),
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * 注册系统提示词管理（waterfall + 路由 + `/prompt` 命令）。
 * @param ctx 宿主上下文。
 */
export function installPromptManager(ctx: HostContext): void {
  const store: PromptStore = { current: loadPromptStateSync() }
  const probeSignal = new AbortController().signal
  const promptCtx = ctx as PromptHostContext

  // 全局覆盖：列表探针信号会跳过自身，避免把覆盖算进“默认值”。
  ctx.effect(() => {
    const listener: AssembleListener = async (presentation, context, next) => {
      if (context?.signal !== probeSignal) applyPromptOverrides(presentation, store.current)
      return next()
    }
    const dispose = promptCtx.on?.('system-prompt/assemble', listener)
    return () => { dispose?.() }
  }, 'dsh-extend: prompt overrides')

  ctx.inject(['webServer'], (scope) => {
    const webServer = scope.webServer
    if (webServer === undefined) return

    scope.effect(() => webServer.register({
      kind: 'exact',
      path: PROMPTS_PATH,
      handler: (req, res) => {
        if (admitGet(req, res) === undefined) return
        void buildList(ctx, store, probeSignal)
          .then((result) => {
            if (!result.ok) writeJson(res, 503, { ok: false, error: result.error })
            else writeJson(res, 200, result.payload)
          })
          .catch((cause: unknown) => {
            writeJson(res, 503, { ok: false, error: cause instanceof Error ? cause.message : String(cause) })
          })
      },
    }), 'dsh-extend: prompt list route')

    scope.effect(() => webServer.register({
      kind: 'exact',
      path: PROMPTS_TEXT_PATH,
      handler: (req, res) => {
        const params = admitGet(req, res)
        if (params === undefined) return
        const name = params.get('name') ?? ''
        if (name === '') {
          writeJson(res, 400, { ok: false, error: '缺少 name' })
          return
        }
        void readSectionText(ctx, store, probeSignal, name)
          .then((result) => {
            if ('error' in result) writeJson(res, 404, { ok: false, error: result.error })
            else writeJson(res, 200, { ok: true, name, ...result })
          })
          .catch((cause: unknown) => {
            writeJson(res, 503, { ok: false, error: cause instanceof Error ? cause.message : String(cause) })
          })
      },
    }), 'dsh-extend: prompt text route')

    scope.effect(() => webServer.register({
      kind: 'exact',
      path: PROMPTS_SAVE_PATH,
      handler: (req, res) => {
        if (!admitPost(req, res)) return
        void readJsonBody(req)
          .then(async (body) => {
            if (typeof body !== 'object' || body === null) {
              writeJson(res, 400, { ok: false, error: '无效的请求体' })
              return
            }
            const change = parseChange(body as Record<string, unknown>)
            if (typeof change === 'string') {
              writeJson(res, 400, { ok: false, error: change })
              return
            }
            const failure = await saveChange(store, change)
            if (failure !== undefined) {
              writeJson(res, 400, { ok: false, error: failure })
              return
            }
            writeJson(res, 200, { ok: true })
          })
          .catch((cause: unknown) => {
            writeJson(res, 400, { ok: false, error: cause instanceof Error ? cause.message : String(cause) })
          })
      },
    }), 'dsh-extend: prompt save route')
  })

  ctx.inject(['commands'], (scope) => {
    const commands = scope.commands
    if (commands === undefined) return
    scope.effect(() => commands.register({
      name: 'prompt',
      description: '管理系统提示词（已组装段覆盖/禁用/还原，自定义段增删改）',
      input: { hint: 'list | show <name> | set <name> <text> | disable <name> | reset --all | add <title> <text>' },
      handler: (invocation: CommandInvocation) => runPromptCommand(ctx, store, probeSignal, invocation),
    }), 'dsh-extend: /prompt command')
  })
}

/**
 * 解析保存请求体。
 * @param body 请求体。
 * @returns 变更或错误信息。
 */
export function parseChange(body: Record<string, unknown>): PromptChange | string {
  const action = typeof body.action === 'string' ? body.action : ''
  const name = typeof body.name === 'string' ? body.name : ''
  const text = typeof body.text === 'string' ? body.text : undefined
  const title = typeof body.title === 'string' ? body.title : undefined
  const id = typeof body.id === 'string' ? body.id : ''
  switch (action) {
    case 'set':
      if (text === undefined) return '缺少 text'
      return { action, name, text }
    case 'disable':
    case 'enable':
    case 'reset':
      if (name === '') return '缺少 name'
      return { action, name }
    case 'reset-all':
      return { action }
    case 'add':
      if (text === undefined) return '缺少 text'
      return { action, title: title ?? '', text }
    case 'update':
      if (id === '') return '缺少 id'
      return { action, id, ...(title === undefined ? {} : { title }), ...(text === undefined ? {} : { text }) }
    case 'remove':
      if (id === '') return '缺少 id'
      return { action, id }
    case 'toggle':
      if (id === '') return '缺少 id'
      return { action, id, enabled: body.enabled === true }
    default:
      return `未知操作：${action}`
  }
}

/** `/prompt` 子命令解析结果。 */
export interface PromptCommandArgs {
  readonly action: 'help' | 'list' | 'show' | 'set' | 'disable' | 'enable' | 'reset' | 'add' | 'remove' | 'on' | 'off'
  readonly name?: string
  readonly text?: string
  readonly id?: string
  readonly errors: readonly string[]
}

/**
 * 解析 `/prompt` 的原始输入。
 * @param rawInput 命令名之后的文本。
 * @returns 子命令参数。
 */
export function parsePromptCommand(rawInput: string): PromptCommandArgs {
  const tokens = rawInput.trim().split(/\s+/u).filter(Boolean)
  const action = (tokens[0] ?? 'list').toLowerCase()
  const rest = tokens.slice(1)
  switch (action) {
    case 'help':
      return { action: 'help', errors: [] }
    case 'list':
      return { action: 'list', errors: [] }
    case 'show':
      if (rest.length === 0) return { action: 'show', errors: ['用法：/prompt show <name>'] }
      return { action: 'show', name: rest.join(' '), errors: [] }
    case 'set': {
      if (rest.length < 2) return { action: 'set', errors: ['用法：/prompt set <name> <text>'] }
      return { action: 'set', name: rest[0], text: rest.slice(1).join(' '), errors: [] }
    }
    case 'disable':
    case 'enable':
      if (rest.length === 0) return { action, errors: [`用法：/prompt ${action} <name>`] }
      return { action, name: rest[0], errors: [] }
    case 'reset': {
      if (rest.length === 0) return { action: 'reset', errors: ['用法：/prompt reset <name|--all>'] }
      return { action: 'reset', name: rest[0], errors: [] }
    }
    case 'add': {
      if (rest.length < 2) return { action: 'add', errors: ['用法：/prompt add <title> <text>'] }
      return { action: 'add', name: rest[0], text: rest.slice(1).join(' '), errors: [] }
    }
    case 'remove':
      if (rest.length === 0) return { action: 'remove', errors: ['用法：/prompt remove <id>'] }
      return { action: 'remove', id: rest[0], errors: [] }
    case 'on':
    case 'off':
      if (rest.length === 0) return { action: 'on', errors: [`用法：/prompt ${action} <id>`] }
      return { action, id: rest[0], errors: [] }
    default:
      return { action: 'help', errors: [`未知子命令：${action}`] }
  }
}

/** 用法说明。 */
export const PROMPT_USAGE = [
  '/prompt 用法',
  '  /prompt                     打开管理面板（无界面时列出清单）',
  '  /prompt list                列出已组装段与自定义项',
  '  /prompt show <name>         查看某段当前文本',
  '  /prompt set <name> <text>   覆盖已组装段文本（留空则还原该段）',
  '  /prompt disable <name>      禁用已组装段',
  '  /prompt enable <name>       重新启用已组装段',
  '  /prompt reset <name|--all>  还原某段 / 全部已组装段',
  '  /prompt add <title> <text>  新增自定义提示词',
  '  /prompt remove <id>         删除自定义提示词',
  '  /prompt on|off <id>         启用/停用自定义提示词',
].join('\n')

/**
 * 执行 `/prompt` 命令。
 * @param ctx 宿主上下文。
 * @param store 状态。
 * @param probeSignal 列表探针信号。
 * @param invocation 命令调用。
 * @returns 命令结果。
 */
async function runPromptCommand(
  ctx: HostContext,
  store: PromptStore,
  probeSignal: AbortSignal,
  invocation: CommandInvocation,
): Promise<CommandResult> {
  const args = parsePromptCommand(invocation.rawInput)
  if (args.errors.length > 0) return { kind: 'error', text: `${args.errors.join('\n')}\n\n${PROMPT_USAGE}` }
  if (args.action === 'help') return { kind: 'success', text: PROMPT_USAGE }
  if (invocation.signal.aborted) return { kind: 'error', text: '已取消。' }

  if (args.action === 'list') {
    const result = await buildList(ctx, store, probeSignal)
    if (!result.ok) return { kind: 'error', text: result.error }
    return { kind: 'success', text: formatPromptList(result.payload) }
  }

  if (args.action === 'show') {
    const name = args.name ?? ''
    const result = await readSectionText(ctx, store, probeSignal, name)
    if ('error' in result) return { kind: 'error', text: result.error }
    const body = truncate(result.text, 4000)
    return {
      kind: 'success',
      text: [
        `${name} · ${formatBytes(Buffer.byteLength(result.text, 'utf8'))}${result.overridden ? ' · 已修改' : ''}${result.disabled ? ' · 已禁用' : ''}`,
        '',
        body,
      ].join('\n'),
    }
  }

  if (args.action === 'set') {
    const change: PromptChange = { action: 'set', name: args.name ?? '', text: args.text ?? '' }
    const failure = await saveChange(store, change)
    return failure === undefined
      ? { kind: 'success', text: '已保存。修改会在下一轮模型请求生效。' }
      : { kind: 'error', text: failure }
  }

  if (args.action === 'disable' || args.action === 'enable') {
    const failure = await saveChange(store, { action: args.action, name: args.name ?? '' })
    return failure === undefined
      ? { kind: 'success', text: args.action === 'disable' ? '已禁用该段。' : '已重新启用该段。' }
      : { kind: 'error', text: failure }
  }

  if (args.action === 'reset') {
    if (args.name === '--all') {
      const failure = await saveChange(store, { action: 'reset-all' })
      return failure === undefined
        ? { kind: 'success', text: '已还原全部已组装段（自定义项保留）。' }
        : { kind: 'error', text: failure }
    }
    const failure = await saveChange(store, { action: 'reset', name: args.name ?? '' })
    return failure === undefined ? { kind: 'success', text: '已还原该段。' } : { kind: 'error', text: failure }
  }

  if (args.action === 'add') {
    const failure = await saveChange(store, { action: 'add', title: args.name ?? '', text: args.text ?? '' })
    return failure === undefined
      ? { kind: 'success', text: '已新增自定义提示词（追加在系统提示词末尾）。' }
      : { kind: 'error', text: failure }
  }

  if (args.action === 'remove') {
    const failure = await saveChange(store, { action: 'remove', id: args.id ?? '' })
    return failure === undefined ? { kind: 'success', text: '已删除。' } : { kind: 'error', text: failure }
  }

  const failure = await saveChange(store, { action: 'toggle', id: args.id ?? '', enabled: args.action === 'on' })
  return failure === undefined
    ? { kind: 'success', text: args.action === 'on' ? '已启用。' : '已停用。' }
    : { kind: 'error', text: failure }
}

/**
 * 把列表格式化成命令文本。
 * @param payload 列表。
 * @returns 文本。
 */
export function formatPromptList(payload: PromptListPayload): string {
  const lines = [
    `系统提示词：已组装 ${payload.assembled.length} 段 · 自定义 ${payload.custom.length} 条 · 工具 ${payload.tools} 个 · 运行时上下文 ${payload.contexts} 条`,
  ]
  for (const section of payload.assembled) {
    const flags = `${section.overridden ? ' · 已修改' : ''}${section.disabled ? ' · 已禁用' : ''}`
    lines.push(`- ${section.name} · ${formatBytes(section.size)}${flags}`)
  }
  if (payload.custom.length > 0) {
    lines.push('', '自定义：')
    for (const item of payload.custom) {
      lines.push(`- ${item.title} (${item.id}) · ${formatBytes(Buffer.byteLength(item.text, 'utf8'))}${item.enabled ? '' : ' · 停用'}`)
    }
  }
  lines.push('', '提示：编辑推荐用 /prompt 打开面板；修改在下一轮模型请求生效。')
  return lines.join('\n')
}



