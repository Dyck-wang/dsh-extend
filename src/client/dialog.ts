/**
 * `/clean` 的可视化勾选面板（纯 DOM，无 React / 无运行时 import）。
 *
 * 面板从宿主的只读路由读取某个范围（7/30/90 天、全部、空会话）的会话，
 * 逐条列出并允许取消勾选；确认后通过宿主命令删除，再从结果路由取回精确结果。
 */

/** 面板范围。 */
export type CleanScope = 'all' | 'archived' | '30d' | '90d' | 'empty'

/** 一行会话。 */
export interface ScopeRow {
  readonly id: string
  readonly title?: string
  readonly cwd?: string
  readonly createdAt: number
  readonly lastActivity: number
  readonly bytes: number
  readonly live: boolean
  readonly blank?: boolean
  readonly suggested: boolean
}

/** 会话列表响应。 */
interface ScopePayload {
  readonly ok: true
  readonly scope: CleanScope
  readonly totals: { readonly count: number; readonly bytes: number; readonly live: number }
  readonly truncated?: boolean
  readonly rows: readonly ScopeRow[]
}

/** 删除结果。 */
export interface DeleteSummary {
  readonly deleted: readonly { readonly id: string; readonly title: string | null; readonly cwd: string | null }[]
  readonly failed: readonly { readonly id: string; readonly reason: string }[]
  readonly bytes: number
}

/** 打开面板所需依赖。 */
export interface DialogOptions {
  readonly scope: CleanScope
  readonly preselect: 'suggested' | 'none'
  readonly t: (key: string, params?: Record<string, unknown>) => string
  readonly deleteSelected: (ids: readonly string[]) => Promise<DeleteSummary | undefined>
}

/** 面板句柄。 */
export interface DialogHandle {
  close(): void
}

let active: DialogHandle | undefined

/** 注入一次样式。 */
function ensureStyles(): void {
  if (typeof document === 'undefined') return
  if (document.querySelector('style[data-plugin-css="dsh-extend/dialog"]') !== null) return
  const style = document.createElement('style')
  style.dataset.plugin = 'dsh-extend'
  style.dataset.pluginCss = 'dsh-extend/dialog'
  style.textContent = `
.dx-backdrop{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.5)}
.dx-dialog{width:min(680px,94vw);max-height:min(82vh,760px);display:flex;flex-direction:column;border-radius:14px;overflow:hidden;font:inherit;background:var(--dsw-alias-bg-overlay,#26262b);color:var(--dsw-alias-label-primary,#f2f3f5);border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.12));box-shadow:0 24px 64px rgba(0,0,0,.5)}
.dx-head{display:flex;align-items:center;gap:12px;padding:18px 20px 8px}
.dx-head h2{margin:0;flex:1;font-size:16px;font-weight:600;line-height:24px}
.dx-close{width:28px;height:28px;border:none;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary,#a9adb8);font-size:16px;line-height:1;cursor:pointer}
.dx-close:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}
.dx-sub{padding:0 20px 10px;font-size:12.5px;line-height:18px;color:var(--dsw-alias-label-secondary,#a9adb8)}
.dx-body{display:flex;flex-direction:column;flex:1;min-height:0}
.dx-toolbar{display:flex;align-items:center;gap:8px;padding:0 20px 10px}
.dx-search{flex:1;height:32px;padding:0 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));background:transparent;color:inherit;font:inherit;font-size:13px;outline:none}
.dx-search:focus{border-color:var(--dsw-alias-brand-primary,#4b7dff)}
.dx-link{border:none;background:none;padding:4px 6px;border-radius:6px;color:var(--dsw-alias-brand-primary,#6f97ff);font:inherit;font-size:12.5px;cursor:pointer}
.dx-link:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}
.dx-list{flex:1;min-height:120px;overflow:auto;margin:0 12px;padding:4px;border-top:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.1));border-bottom:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.1))}
.dx-row{display:flex;align-items:flex-start;gap:10px;padding:9px 10px;border-radius:8px;cursor:pointer}
.dx-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.07))}
.dx-row[data-live=true]{cursor:default;opacity:.6}
.dx-row[data-live=true]:hover{background:transparent}
.dx-row[hidden]{display:none}
.dx-check{margin:2px 0 0;width:15px;height:15px;accent-color:var(--dsw-alias-brand-primary,#4b7dff);flex:none;cursor:inherit}
.dx-main{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.dx-title{font-size:13.5px;line-height:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dx-meta{font-size:11.5px;line-height:16px;color:var(--dsw-alias-label-secondary,#9aa0ad);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dx-badge{flex:none;margin-top:2px;padding:1px 7px;border-radius:999px;font-size:11px;line-height:16px;background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.1));color:var(--dsw-alias-label-secondary,#a9adb8)}
.dx-empty{padding:36px 16px;text-align:center;font-size:13px;color:var(--dsw-alias-label-secondary,#9aa0ad)}
.dx-foot{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 20px 16px}
.dx-ack{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--dsw-alias-label-secondary,#a9adb8);cursor:pointer;user-select:none}
.dx-count{font-size:12.5px;color:var(--dsw-alias-label-secondary,#a9adb8)}
.dx-actions{margin-left:auto;display:flex;gap:8px}
.dx-btn{height:34px;padding:0 16px;border-radius:9px;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.18));background:transparent;color:inherit;font:inherit;font-size:13px;cursor:pointer}
.dx-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}
.dx-btn.primary{background:#2f6fed;border-color:#2f6fed;color:#fff}
.dx-btn.danger{background:#d93025;border-color:#d93025;color:#fff}
.dx-btn:disabled{opacity:.45;cursor:not-allowed}
.dx-error{margin:0 20px 12px;padding:10px 12px;border-radius:8px;font-size:12.5px;line-height:18px;color:var(--dsw-alias-state-error-primary,#ff7b7b);background:rgba(229,72,77,.12);white-space:pre-wrap}
.dx-result{padding:28px 24px;display:flex;flex-direction:column;gap:10px}
.dx-result-title{font-size:15px;font-weight:600}
.dx-result-detail{font-size:12.5px;line-height:19px;color:var(--dsw-alias-label-secondary,#a9adb8);white-space:pre-wrap;max-height:180px;overflow:auto}
.dx-result .dx-actions{margin-left:0;justify-content:flex-end}
`
  document.head.appendChild(style)
}

/**
 * 创建元素。
 * @param tag 标签名。
 * @param className 类名。
 * @param text 文本（按纯文本写入）。
 * @returns 元素。
 */
function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  if (className !== undefined && className !== '') node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/**
 * 人类可读的字节数。
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
 * 本地时间 `MM-DD HH:mm`。
 * @param epochMs 时间戳。
 * @returns 展示文本。
 */
function formatTime(epochMs: number): string {
  const date = new Date(epochMs)
  if (Number.isNaN(date.getTime())) return '--'
  const pad = (value: number): string => String(value).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * 读取某个范围的会话。
 * @param scope 范围。
 * @param preselect 默认勾选策略。
 * @param signal 取消信号。
 * @returns 列表响应。
 */
async function fetchScope(scope: CleanScope, preselect: 'suggested' | 'none', signal: AbortSignal): Promise<ScopePayload> {
  const response = await fetch(
    `/api/dsh-extend/clean/sessions?scope=${encodeURIComponent(scope)}&preselect=${preselect}`,
    { signal, cache: 'no-store', headers: { accept: 'application/json' } },
  )
  const payload: unknown = await response.json().catch(() => undefined)
  if (!response.ok || payload === null || typeof payload !== 'object' || (payload as { ok?: unknown }).ok !== true) {
    const message = (payload as { error?: string } | undefined)?.error
    throw new Error(message ?? `HTTP ${response.status}`)
  }
  return payload as ScopePayload
}

/**
 * 打开清洗面板。
 * @param options 范围、文案与删除回调。
 * @returns 面板句柄。
 */
export function openCleanDialog(options: DialogOptions): DialogHandle {
  if (typeof document === 'undefined') {
    return { close: () => {} }
  }
  active?.close()
  ensureStyles()

  const { t } = options
  const controller = new AbortController()
  const selected = new Set<string>()
  let rows: ScopeRow[] = []
  let busy = false
  let closed = false
  let ack = false

  const backdrop = el('div', 'dx-backdrop')
  const panel = el('div', 'dx-dialog')
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-modal', 'true')

  const headingId = `dx-title-${Math.random().toString(36).slice(2, 8)}`
  panel.setAttribute('aria-labelledby', headingId)

  const head = el('div', 'dx-head')
  const heading = el('h2', '', t('dialog.title'))
  heading.id = headingId
  const closeButton = el('button', 'dx-close', '✕')
  closeButton.type = 'button'
  closeButton.setAttribute('aria-label', t('dialog.cancel'))
  head.append(heading, closeButton)

  const body = el('div', 'dx-body')
  const subtitle = el('div', 'dx-sub', t('dialog.loading'))
  const toolbar = el('div', 'dx-toolbar')
  const search = el('input', 'dx-search')
  search.type = 'search'
  search.placeholder = t('dialog.search')
  const selectAll = el('button', 'dx-link', t('dialog.all'))
  selectAll.type = 'button'
  const selectNone = el('button', 'dx-link', t('dialog.none'))
  selectNone.type = 'button'
  toolbar.append(search, selectAll, selectNone)

  const list = el('div', 'dx-list')
  const errorBox = el('div', 'dx-error')

  body.append(subtitle, toolbar, list)
  const foot = el('div', 'dx-foot')
  const ackLabel = el('label', 'dx-ack')
  const ackInput = el('input', 'dx-check')
  ackInput.type = 'checkbox'
  ackLabel.append(ackInput, document.createTextNode(t('dialog.ack')))
  const count = el('span', 'dx-count', t('dialog.selected', { count: 0 }))
  const actions = el('div', 'dx-actions')
  const cancel = el('button', 'dx-btn', t('dialog.cancel'))
  cancel.type = 'button'
  const remove = el('button', 'dx-btn danger', t('dialog.delete'))
  remove.type = 'button'
  remove.disabled = true
  actions.append(cancel, remove)
  foot.append(ackLabel, count, actions)

  panel.append(head, body, foot)
  backdrop.append(panel)
  document.body.append(backdrop)

  const close = (): void => {
    if (closed) return
    closed = true
    controller.abort()
    backdrop.remove()
    document.removeEventListener('keydown', onKeyDown, true)
    if (active === handle) active = undefined
  }
  const handle: DialogHandle = { close }

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && !busy) {
      event.stopPropagation()
      close()
    }
  }
  document.addEventListener('keydown', onKeyDown, true)

  backdrop.addEventListener('mousedown', (event) => {
    if (event.target === backdrop && !busy) close()
  })
  closeButton.addEventListener('click', () => { if (!busy) close() })
  cancel.addEventListener('click', () => { if (!busy) close() })

  const visibleRows = (): ScopeRow[] =>
    rows.filter(row => !(list.querySelector<HTMLElement>(`[data-id="${row.id}"]`)?.hidden ?? false))

  const updateFooter = (): void => {
    const picked = selected.size
    count.textContent = t('dialog.selected', { count: picked })
    remove.disabled = busy || picked === 0 || !ack
    remove.textContent = busy ? t('dialog.deleting') : t('dialog.delete')
    ackInput.disabled = busy
    search.disabled = busy
    selectAll.disabled = busy
    selectNone.disabled = busy
  }

  const setRowChecked = (row: ScopeRow, checked: boolean, input: HTMLInputElement): void => {
    input.checked = checked
    if (checked) selected.add(row.id)
    else selected.delete(row.id)
    updateFooter()
  }

  const renderRows = (): void => {
    list.textContent = ''
    selected.clear()
    if (rows.length === 0) {
      list.append(el('div', 'dx-empty', t('dialog.empty')))
      updateFooter()
      return
    }
    const fragment = document.createDocumentFragment()
    for (const row of rows) {
      const rowEl = el('div', 'dx-row')
      rowEl.dataset.id = row.id
      rowEl.dataset.live = String(row.live)
      const input = el('input', 'dx-check')
      input.type = 'checkbox'
      input.checked = row.suggested && !row.live
      if (row.live) input.disabled = true
      if (input.checked) selected.add(row.id)
      const main = el('span', 'dx-main')
      const title = el('span', 'dx-title', row.title ?? t('dialog.noTitle'))
      title.title = row.title ?? row.id
      const shortId = row.id.startsWith('session-') ? row.id.slice(8, 16) : row.id.slice(0, 8)
      const metaParts = [row.cwd ?? t('dialog.noCwd'), formatTime(row.lastActivity), formatBytes(row.bytes)]
      if (row.title === undefined) metaParts.unshift(shortId)
      const meta = el('span', 'dx-meta', metaParts.join(' · '))
      meta.title = row.cwd ?? ''
      main.append(title, meta)
      rowEl.append(input, main)
      if (row.live) rowEl.append(el('span', 'dx-badge', t('dialog.live')))
      else if (row.blank === true) rowEl.append(el('span', 'dx-badge', t('dialog.blank')))
      if (!row.live) {
        rowEl.addEventListener('click', (event) => {
          if (busy) return
          if (event.target === input) return
          setRowChecked(row, !input.checked, input)
        })
        input.addEventListener('change', () => { if (!busy) setRowChecked(row, input.checked, input) })
      }
      fragment.append(rowEl)
    }
    list.append(fragment)
    updateFooter()
  }

  const showError = (message: string, retry?: () => void): void => {
    errorBox.remove()
    errorBox.textContent = message
    if (retry !== undefined) {
      const button = el('button', 'dx-link', t('dialog.retry'))
      button.type = 'button'
      button.addEventListener('click', () => { errorBox.remove(); retry() })
      errorBox.append(document.createTextNode(' '), button)
    }
    body.append(errorBox)
  }

  const load = (): void => {
    subtitle.textContent = t('dialog.loading')
    list.textContent = ''
    void fetchScope(options.scope, options.preselect, controller.signal)
      .then((payload) => {
        if (closed) return
        rows = [...payload.rows]
        const summary = t('dialog.summary', {
          count: payload.totals.count,
          size: formatBytes(payload.totals.bytes),
        })
        const liveNote = payload.totals.live > 0 ? ` · ${t('dialog.liveCount', { count: payload.totals.live })}` : ''
        const truncated = payload.truncated === true
          ? ` · ${t('dialog.truncated', { count: rows.length, total: payload.totals.count })}`
          : ''
        subtitle.textContent = summary + liveNote + truncated
        renderRows()
      })
      .catch((cause: unknown) => {
        if (closed) return
        subtitle.textContent = ''
        showError(t('dialog.loadFailed', { error: cause instanceof Error ? cause.message : String(cause) }), load)
      })
  }

  const showResult = (summary: DeleteSummary | undefined, requested: number): void => {
    const resultBox = el('div', 'dx-result')
    const title = el('div', 'dx-result-title')
    const detail = el('div', 'dx-result-detail')
    if (summary === undefined) {
      title.textContent = t('dialog.resultUnknown', { count: requested })
    } else {
      title.textContent = summary.failed.length === 0
        ? t('dialog.result', { count: summary.deleted.length, size: formatBytes(summary.bytes) })
        : t('dialog.resultPartial', { count: summary.deleted.length, failed: summary.failed.length })
      if (summary.failed.length > 0) {
        detail.textContent = `${t('dialog.failedList')}\n${summary.failed.slice(0, 10).map(item => `${item.id}：${item.reason}`).join('\n')}`
      }
    }
    const actionsRow = el('div', 'dx-actions')
    const done = el('button', 'dx-btn primary', t('dialog.done'))
    done.type = 'button'
    done.addEventListener('click', close)
    actionsRow.append(done)
    resultBox.append(title, detail, actionsRow)
    body.replaceChildren(resultBox)
    foot.replaceChildren()
    updateFooter()
  }

  const confirmDelete = async (): Promise<void> => {
    if (busy || selected.size === 0) return
    busy = true
    updateFooter()
    try {
      const summary = await options.deleteSelected([...selected])
      showResult(summary, selected.size)
    } catch (cause) {
      busy = false
      updateFooter()
      showError(t('dialog.deleteFailed', { error: cause instanceof Error ? cause.message : String(cause) }))
    }
  }

  search.addEventListener('input', () => {
    const query = search.value.trim().toLowerCase()
    for (const row of rows) {
      const rowEl = list.querySelector<HTMLElement>(`[data-id="${row.id}"]`)
      if (rowEl === null) continue
      const haystack = `${row.title ?? ''} ${row.cwd ?? ''}`.toLowerCase()
      rowEl.hidden = query !== '' && !haystack.includes(query)
    }
  })
  selectAll.addEventListener('click', () => {
    if (busy) return
    for (const row of visibleRows()) {
      if (row.live) continue
      const rowEl = list.querySelector<HTMLElement>(`[data-id="${row.id}"]`)
      const input = rowEl?.querySelector<HTMLInputElement>('input')
      if (input !== null && input !== undefined) setRowChecked(row, true, input)
    }
  })
  selectNone.addEventListener('click', () => {
    if (busy) return
    for (const row of visibleRows()) {
      const rowEl = list.querySelector<HTMLElement>(`[data-id="${row.id}"]`)
      const input = rowEl?.querySelector<HTMLInputElement>('input')
      if (input !== null && input !== undefined) setRowChecked(row, false, input)
    }
  })
  ackInput.addEventListener('change', () => {
    ack = ackInput.checked
    updateFooter()
  })
  remove.addEventListener('click', () => { void confirmDelete() })

  active = handle
  load()
  search.focus()
  return handle
}

/** 关闭当前面板（插件卸载时使用）。 */
export function closeCleanDialog(): void {
  active?.close()
  active = undefined
}


