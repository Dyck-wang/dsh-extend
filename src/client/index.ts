/**
 * 浏览器半：把 `/clean` 的裸调用替换为勾选面板。
 *
 * `/reboot` 不做界面装饰，直接由宿主命令执行（默认即重启）。删除仍通过宿主
 * `/clean --ids … --yes` 命令执行，生命周期记在会话日志里，面板再按请求标记
 * 取回精确结果。
 */
import { en, zh } from './locales.ts'
import { clearRebootDrafts } from './drafts.ts'
import { closeCleanDialog, openCleanDialog, type CleanScope, type DeleteSummary } from './dialog.ts'
import type { ClientContext, ClientSession, SelectOption } from './types.ts'

/** 文案命名空间。 */
const NS = 'dsh-extend'
/** 宿主只读统计路由。 */
const SUMMARY_ENDPOINT = '/api/dsh-extend/clean/summary'
/** 删除结果路由。 */
const RESULT_ENDPOINT = '/api/dsh-extend/clean/result'

type Translate = (key: string, params?: Record<string, unknown>) => string

/** 宿主统计响应。 */
interface SummaryPayload {
  readonly ok: true
  readonly totals: { readonly sessions: number; readonly bytes: number; readonly live: number }
  readonly archived: { readonly count: number; readonly bytes: number }
  readonly buckets: readonly { readonly days: number; readonly count: number; readonly bytes: number }[]
  readonly all: { readonly count: number; readonly bytes: number }
}

/**
 * 客户端字节格式化。
 * @param bytes 字节数。
 * @returns 展示文本。
 */
function formatBytes(bytes: number): string {
  const value = Number.isFinite(bytes) && bytes > 0 ? bytes : 0
  if (value < 1024) return `${Math.round(value)} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/**
 * 读取宿主统计。
 * @param signal 弹窗关闭时取消。
 * @returns 统计响应。
 */
async function fetchSummary(signal: AbortSignal): Promise<SummaryPayload> {
  const response = await fetch(SUMMARY_ENDPOINT, {
    signal,
    cache: 'no-store',
    headers: { accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const payload: unknown = await response.json()
  if (typeof payload !== 'object' || payload === null || (payload as { ok?: unknown }).ok !== true) {
    throw new Error('invalid summary response')
  }
  return payload as SummaryPayload
}

/**
 * 生成一次删除请求的标记。
 * @returns 32 位十六进制标记。
 */
function requestToken(): string {
  const crypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  const uuid = crypto?.randomUUID?.()
  if (typeof uuid === 'string') return uuid.replace(/-/gu, '')
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
}

/**
 * 取回一次删除的结果。
 * @param token 请求标记。
 * @returns 删除结果；取不到时为 undefined。
 */
async function fetchResult(token: string): Promise<DeleteSummary | undefined> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`${RESULT_ENDPOINT}?request=${encodeURIComponent(token)}`, {
        cache: 'no-store',
        headers: { accept: 'application/json' },
      })
      const payload: unknown = await response.json()
      if (payload !== null && typeof payload === 'object'
        && (payload as { found?: unknown }).found === true
        && (payload as { result?: unknown }).result !== undefined) {
        return (payload as { result: DeleteSummary }).result
      }
    } catch {
      // 结果路由偶尔晚于命令结算，短暂重试。
    }
    await new Promise(resolve => setTimeout(resolve, 120))
  }
  return undefined
}

/** 会话输入面（清空草稿、发送通知用）。 */
interface ConversationInputFace {
  readonly input: {
    for(actx: unknown): {
      setDraft(text: string): void
      notify?(level: 'error' | 'info', text: string): void
    }
  }
}

/**
 * 在会话输入区显示一条错误通知。
 * @param ctx 客户端上下文。
 * @param session 会话。
 * @param message 文案。
 */
function notifyError(ctx: ClientContext, session: ClientSession, message: string): void {
  try {
    const binding = ctx.sessions.binding(session.sessionId)
    if (binding === undefined) return
    const conversation = binding.ctx.get<ConversationInputFace>('conversation')
    conversation?.input.for(binding.ctx).notify?.('error', message)
  } catch {
    // 会话已销毁时忽略。
  }
}

/**
 * 清空指定会话的输入框草稿。
 * @param ctx 客户端上下文。
 * @param sessionId 会话 id。
 */
function clearDraftFor(ctx: ClientContext, sessionId: string): void {
  try {
    const binding = ctx.sessions.binding(sessionId)
    if (binding === undefined) return
    const conversation = binding.ctx.get<ConversationInputFace>('conversation')
    conversation?.input.for(binding.ctx).setDraft('')
  } catch {
    // 外壳接口缺失或会话已销毁时保持原样，不影响命令本身。
  }
}

/**
 * 主动清空触发命令的草稿。
 *
 * 带参数的行（如 `/reboot --yes`）在选择弹窗时，外壳的 consume-token 可能只吃掉
 * 命令 token 或直接失配，草稿会留在输入框里并被持久化；这里兜底清一次。
 * @param ctx 客户端上下文。
 * @param session 触发命令的会话。
 */
function clearComposerDraft(ctx: ClientContext, session: ClientSession): void {
  clearDraftFor(ctx, session.sessionId)
}

/**
 * 清理重启后残留的 `/reboot` 草稿。
 *
 * 强制重启会直接结束主进程，Chromium 可能来不及把“已清空”的草稿落盘；
 * 下次启动会把旧命令行恢复出来，这里在启动时兜底清一次。
 * @param ctx 客户端上下文。
 */
function sweepStaleRebootDrafts(ctx: ClientContext): void {
  try {
    for (const sessionId of clearRebootDrafts(window.localStorage)) clearDraftFor(ctx, sessionId)
  } catch {
    // localStorage 不可用或内容损坏时跳过。
  }
}

/**
 * 把选中的命令行交回宿主执行（并校验命令存在）。
 * @param ctx 客户端上下文。
 * @param session 触发命令的会话。
 * @param line 完整命令行。
 * @param t 翻译函数。
 */
async function submit(ctx: ClientContext, session: ClientSession, line: string, t: Translate): Promise<void> {
  const live = ctx.sessions.binding(session.sessionId)?.session
  if (live === undefined) throw new Error(t('session.missing'))
  const result = await live.command(line)
  if (!result.ok) throw new Error(result.error.message ?? t('command.failed'))
  if (!result.value.matched) throw new Error(t('command.unavailable'))
}

/**
 * 执行“删除勾选会话”并取回结果。
 * @param ctx 客户端上下文。
 * @param session 触发命令的会话。
 * @param ids 勾选的会话 id。
 * @param t 翻译函数。
 * @returns 删除结果；结果路由不可用时返回 undefined。
 */
async function deleteSelected(
  ctx: ClientContext,
  session: ClientSession,
  ids: readonly string[],
  t: Translate,
): Promise<DeleteSummary | undefined> {
  if (ids.length === 0) return undefined
  const token = requestToken()
  await submit(ctx, session, `/clean --ids ${ids.join(',')} --yes --request ${token}`, t)
  return fetchResult(token)
}

/**
 * 把统计结果转成弹窗选项（每项打开勾选面板）。
 *
 * “已归档会话”固定第一位；其余按时间/工具分组。“全部会话”是手动挑选入口，
 * 打开时默认不勾选（想全删时在面板里点“全选”）。
 * @param summary 统计（缺省时只给“全部会话”）。
 * @param t 翻译函数。
 * @returns 选项列表。
 */
function cleanOptions(summary: SummaryPayload | undefined, t: Translate): readonly SelectOption[] {
  const allOption: SelectOption = {
    id: 'dialog:all:none',
    label: t('all.label'),
    detail: summary === undefined
      ? t('all.hint')
      : t('all.detail', { count: summary.all.count, size: formatBytes(summary.all.bytes) }),
    group: { name: 'tools', label: t('group.tools') },
  }
  if (summary === undefined) return [allOption]
  if (summary.totals.sessions === 0) {
    return [{ ...allOption, detail: t('all.hint') }]
  }

  // “已归档会话”固定排第一，且不受数量为 0 影响。
  const options: SelectOption[] = [{
    id: 'dialog:archived',
    label: t('archived.label'),
    detail: t('archived.detail', { count: summary.archived.count, size: formatBytes(summary.archived.bytes) }),
  }]
  for (const bucket of summary.buckets) {
    if (bucket.count <= 0) continue
    options.push({
      id: `dialog:${bucket.days}d`,
      label: t('bucket.label', { days: bucket.days }),
      detail: t('bucket.detail', { count: bucket.count, size: formatBytes(bucket.bytes) }),
      group: { name: 'time', label: t('group.time') },
    })
  }
  options.push(allOption)
  options.push({
    id: 'dialog:empty',
    label: t('empty.label'),
    detail: t('empty.detail'),
    group: { name: 'tools', label: t('group.tools') },
  })
  return options
}

/** 必需服务。 */
export const inject = ['commandUi', 'sessions', 'locale']

/**
 * 挂载浏览器半。
 * @param ctx 客户端上下文。
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-extend: dictionaries')
  const t: Translate = ctx.locale.bind(NS)

  // 强制重启可能来不及把清空后的草稿落盘，启动时先清一次，再补一次（等会话加载完）。
  sweepStaleRebootDrafts(ctx)
  ctx.effect(() => {
    if (typeof setTimeout !== 'function') return () => {}
    const timer = setTimeout(() => { sweepStaleRebootDrafts(ctx) }, 1_500)
    return () => { clearTimeout(timer) }
  }, 'dsh-extend: stale reboot draft sweep')

  ctx.effect(() => () => { closeCleanDialog() }, 'dsh-extend: dialog cleanup')

  ctx.effect(() => ctx.commandUi.decorate({
    name: 'clean',
    available: () => true,
    ui: {
      kind: 'popupSelect',
      searchLabels: () => ({
        placeholder: t('search.placeholder'),
        empty: t('search.empty'),
        noResults: t('search.noResults'),
      }),
      options: async (_session, signal) => {
        let summary: SummaryPayload | undefined
        try {
          summary = await fetchSummary(signal)
        } catch {
          summary = undefined
        }
        return cleanOptions(summary, t)
      },
      onSelect: (option, session) => {
        if (!option.id.startsWith('dialog:')) return
        clearComposerDraft(ctx, session)
        const [, scope, preselect] = option.id.split(':')
        openCleanDialog({
          scope: (scope ?? 'all') as CleanScope,
          preselect: preselect === 'none' ? 'none' : 'suggested',
          t,
          deleteSelected: ids => deleteSelected(ctx, session, ids, t),
        })
      },
    },
  }), 'dsh-extend: /clean decoration')

  // 裸调用 `/reboot` 直接执行（默认即重启），不弹选择器；带参数时仍走宿主命令。
  ctx.effect(() => ctx.commandUi.decorate({
    name: 'reboot',
    available: () => true,
    ui: {
      kind: 'action',
      run: (session) => {
        clearComposerDraft(ctx, session)
        void submit(ctx, session, '/reboot', t).catch((error: unknown) => {
          notifyError(ctx, session, error instanceof Error ? error.message : String(error))
        })
      },
    },
  }), 'dsh-extend: /reboot action')
}





