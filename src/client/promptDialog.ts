/**
 * `/prompt` 的系统提示词管理面板（纯 DOM，无 React / 无运行时 import）。
 *
 * 已组装段从宿主只读路由读取（名称/大小/覆盖状态），编辑时再取全文；
 * 自定义项随列表一起返回。所有写操作走统一保存路由。
 */

/** 已组装段摘要。 */
export interface PromptAssembledSection {
  readonly name: string
  readonly size: number
  readonly overridden: boolean
  readonly disabled: boolean
  readonly text: string
}

/** 自定义提示词。 */
export interface PromptCustomEntry {
  readonly id: string
  readonly title: string
  readonly text: string
  readonly enabled: boolean
}

/** 列表响应。 */
interface PromptListPayload {
  readonly ok: true
  readonly assembled: readonly PromptAssembledSection[]
  readonly custom: readonly PromptCustomEntry[]
  readonly tools: number
  readonly contexts: number
}

/** 打开面板所需依赖。 */
export interface PromptDialogOptions {
  readonly t: (key: string, params?: Record<string, unknown>) => string
}

/** 面板句柄。 */
export interface PromptDialogHandle {
  close(): void
}

const LIST_ENDPOINT = '/api/dsh-extend/prompts'
const TEXT_ENDPOINT = '/api/dsh-extend/prompts/text'
const SAVE_ENDPOINT = '/api/dsh-extend/prompts/save'

let active: PromptDialogHandle | undefined

/** 注入一次样式。 */
function ensureStyles(): void {
  if (typeof document === 'undefined') return
  if (document.querySelector('style[data-plugin-css="dsh-extend/prompt"]') !== null) return
  const style = document.createElement('style')
  style.dataset.pluginCss = 'dsh-extend/prompt'
  style.textContent = [
    '.dxp-backdrop{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--dsw-alias-bg-mask-1,rgba(0,0,0,.5));backdrop-filter:var(--dsw-mask-blur,none)}',
    '.dxp-panel [hidden]{display:none!important}',
    '.dxp-panel{position:relative;display:flex;flex-direction:column;width:min(760px,94vw);height:min(86vh,820px);border-radius:var(--dsw-radius-panel,16px);overflow:hidden;font:inherit;background:var(--dsw-alias-bg-layer-2,#2c2c2e);color:var(--dsw-alias-label-primary,#f2f3f5);box-shadow:var(--dsw-elevation-prominent,0 24px 64px rgba(0,0,0,.5))}',
    '.dxp-head{display:flex;align-items:center;gap:12px;padding:16px 18px 10px}',
    '.dxp-title{flex:1;font-size:16px;font-weight:600;line-height:24px}',
    '.dxp-close{width:28px;height:28px;border:none;border-radius:var(--dsw-radius-sm,6px);background:transparent;color:var(--dsw-alias-label-primary,#f2f3f5);font-size:16px;line-height:1;cursor:pointer}',
    '.dxp-close:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}',
    '.dxp-tabs{display:flex;gap:6px;padding:0 18px 8px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.06))}',
    '.dxp-tab{border:none;background:transparent;color:var(--dsw-alias-label-secondary,#a9adb8);font:inherit;font-size:13px;padding:7px 12px;border-radius:var(--dsw-radius-md,8px) var(--dsw-radius-md,8px) 0 0;cursor:pointer}',
    '.dxp-tab.active{color:var(--dsw-alias-label-primary,#f2f3f5);background:var(--dsw-alias-interactive-bg-active,rgba(255,255,255,.14))}',
    '.dxp-hint{padding:10px 18px 4px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#a9adb8)}',
    '.dxp-body{flex:1;min-height:160px;overflow:auto;padding:4px 10px 12px}',
    '.dxp-row{display:flex;flex-direction:column;gap:6px;padding:9px 10px;border-radius:var(--dsw-radius-md,8px)}',
    '.dxp-row-head{display:flex;align-items:center;gap:12px}',
    '.dxp-prompt-text{margin:0;padding:8px 10px;border-radius:var(--dsw-radius-md,8px);background:var(--dsw-alias-bg-layer-1,#232325);font:12px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap;word-break:break-word;max-height:220px;overflow:auto;color:var(--dsw-alias-label-secondary,#a9adb8)}',
    '.dxp-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}',
    '.dxp-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}',
    '.dxp-name{font-size:13px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--dsw-alias-label-primary,#f2f3f5)}',
    '.dxp-meta{font-size:11.5px;color:var(--dsw-alias-label-secondary,#a9adb8)}',
    '.dxp-actions{display:flex;gap:4px;flex-shrink:0}',
    '.dxp-link{border:none;background:none;padding:4px 7px;border-radius:var(--dsw-radius-sm,6px);color:var(--dsw-alias-label-primary,#f2f3f5);font:inherit;font-size:12px;cursor:pointer}',
    '.dxp-link:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}',
    '.dxp-link.danger{color:var(--dsw-alias-state-error-primary,#ef6b6b)}',
    '.dxp-badge{display:inline-block;margin-left:6px;padding:0 6px;border-radius:var(--dsw-radius-sm,6px);font-size:10.5px;background:var(--dsw-alias-bg-layer-1,#232325);color:var(--dsw-alias-label-secondary,#a9adb8)}',
    '.dxp-foot{display:flex;align-items:center;gap:8px;padding:10px 16px 14px;border-top:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.06))}',
    '.dxp-status{flex:1;font-size:12px;color:var(--dsw-alias-label-secondary,#a9adb8);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.dxp-status.error{color:var(--dsw-alias-state-error-primary,#ef6b6b)}',
    '.dxp-btn{height:32px;padding:0 14px;border-radius:var(--dsw-radius-md,8px);border:none;box-shadow:inset 0 0 0 .5px var(--dsw-alias-border-l3,rgba(255,255,255,.16));background:transparent;color:var(--dsw-alias-label-primary,#f2f3f5);font:inherit;font-size:12.5px;cursor:pointer}',
    '.dxp-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}',
    '.dxp-btn.primary{background:var(--dsw-alias-button-primary-fill,#f2f3f5);box-shadow:none;color:var(--dsw-alias-label-primary-foreground,#0f1115)}',
    '.dxp-btn.primary:hover{background:var(--dsw-alias-button-primary-hover,#e5e6e8)}',
    '.dxp-confirm{display:flex;align-items:center;gap:8px;margin:0 16px 8px;padding:8px 10px;border-radius:var(--dsw-radius-md,8px);background:var(--dsw-alias-bg-layer-1,#232325);border:1px solid var(--dsw-alias-border-l3,rgba(255,255,255,.16));font-size:12px}',
    '.dxp-confirm span{flex:1}',
    '.dxp-editor{position:absolute;inset:0;display:flex;flex-direction:column;background:var(--dsw-alias-bg-layer-2,#2c2c2e)}',
    '.dxp-editor-head{display:flex;align-items:center;gap:10px;padding:16px 18px 10px}',
    '.dxp-editor-name{flex:1;font-size:13px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.dxp-field{display:flex;flex-direction:column;gap:6px;padding:4px 18px 8px}',
    '.dxp-label{font-size:12px;color:var(--dsw-alias-label-secondary,#a9adb8)}',
    '.dxp-input{height:32px;padding:0 10px;border-radius:var(--dsw-radius-md,8px);border:.5px solid var(--dsw-alias-border-l4,rgba(255,255,255,.2));background:var(--dsw-alias-bg-layer-1,#232325);color:var(--dsw-alias-label-primary,#f2f3f5);font:inherit;font-size:13px;outline:none}',
    '.dxp-input:focus{border-color:var(--dsw-alias-state-business-primary,#4d6bfe)}',
    '.dxp-textarea{flex:1;min-height:260px;margin:0 18px 10px;padding:10px 12px;border-radius:var(--dsw-radius-md,8px);border:.5px solid var(--dsw-alias-border-l4,rgba(255,255,255,.2));background:var(--dsw-alias-bg-layer-1,#232325);color:var(--dsw-alias-label-primary,#f2f3f5);font:12.5px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;outline:none;resize:none;white-space:pre-wrap}',
    '.dxp-textarea:focus{border-color:var(--dsw-alias-state-business-primary,#4d6bfe)}',
    '.dxp-editor-foot{display:flex;gap:8px;padding:10px 18px 16px;border-top:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.06))}',
    '.dxp-grow{flex:1}',
  ].join('\n')
  document.head.append(style)
}

/** 创建元素。 */
function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/** 请求 JSON 并抛出业务错误。 */
async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...init })
  const payload = await response.json() as { ok?: boolean; error?: string } & T
  if (!response.ok || payload.ok === false) throw new Error(payload.error ?? `HTTP ${response.status}`)
  return payload
}

/**
 * 打开系统提示词管理面板。
 * @param options 翻译函数。
 * @returns 面板句柄。
 */
export function openPromptDialog(options: PromptDialogOptions): PromptDialogHandle {
  if (typeof document === 'undefined') return { close: () => {} }
  active?.close()
  ensureStyles()
  const { t } = options
  const backdrop = el('div', 'dxp-backdrop')
  const panel = el('div', 'dxp-panel')
  backdrop.append(panel)

  let list: PromptListPayload | undefined
  let tab: 'assembled' | 'custom' = 'assembled'
  let editor: { mode: 'assembled' | 'custom' | 'add'; name?: string; id?: string; title?: string; text: string } | undefined
  let busy = false
  let closed = false
  let status = ''
  let statusError = false
  let editorConfirm = false
  let confirm: { message: string; run: () => void } | undefined = undefined

  const head = el('div', 'dxp-head')
  head.append(el('span', 'dxp-title', t('prompt.title')))
  const closeButton = el('button', 'dxp-close', '×')
  closeButton.type = 'button'
  closeButton.addEventListener('click', () => { handle.close() })
  head.append(closeButton)
  panel.append(head)

  const tabs = el('div', 'dxp-tabs')
  const assembledTab = el('button', 'dxp-tab', t('prompt.assembled'))
  const customTab = el('button', 'dxp-tab', t('prompt.custom'))
  assembledTab.type = 'button'
  customTab.type = 'button'
  assembledTab.addEventListener('click', () => { if (editor !== undefined) return; tab = 'assembled'; render() })
  customTab.addEventListener('click', () => { if (editor !== undefined) return; tab = 'custom'; render() })
  tabs.append(assembledTab, customTab)
  panel.append(tabs)

  const hint = el('div', 'dxp-hint', t('prompt.hint'))
  panel.append(hint)

  const body = el('div', 'dxp-body')
  panel.append(body)

  const confirmBar = el('div', 'dxp-confirm')
  confirmBar.hidden = true
  panel.append(confirmBar)

  const foot = el('div', 'dxp-foot')
  const statusLabel = el('span', 'dxp-status')
  const resetAllButton = el('button', 'dxp-btn', t('prompt.resetAll'))
  const addButton = el('button', 'dxp-btn primary', t('prompt.add'))
  resetAllButton.type = 'button'
  addButton.type = 'button'
  foot.append(statusLabel, resetAllButton, addButton)
  panel.append(foot)

  const editorLayer = el('div', 'dxp-editor')
  editorLayer.hidden = true
  panel.append(editorLayer)

  const setStatus = (message: string, isError = false): void => {
    status = message
    statusError = isError
    statusLabel.textContent = message
    statusLabel.classList.toggle('error', isError)
  }

  const defaultStatus = (): string => (list === undefined
    ? ''
    : t('prompt.toolsContexts', { tools: list.tools, contexts: list.contexts }))

  const applyList = (payload: PromptListPayload): void => {
    list = payload
    if (!busy) setStatus(defaultStatus())
    render()
  }

  const refresh = async (): Promise<void> => {
    try {
      const payload = await requestJson<PromptListPayload>(LIST_ENDPOINT)
      if (closed) return
      applyList(payload)
    } catch (error) {
      if (!closed) setStatus(error instanceof Error ? error.message : String(error), true)
    }
  }

  const save = async (change: Record<string, unknown>): Promise<boolean> => {
    setStatus(t('prompt.loading'))
    try {
      await requestJson(SAVE_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(change),
      })
      if (closed) return false
      setStatus(t('prompt.saved'))
      await refresh()
      return true
    } catch (error) {
      if (!closed) setStatus(error instanceof Error ? error.message : String(error), true)
      return false
    }
  }

  const requestConfirm = (message: string, run: () => void): void => {
    confirm = { message, run }
    render()
  }

  const openAssembledEditor = async (section: PromptAssembledSection): Promise<void> => {
    setStatus(t('prompt.loading'))
    try {
      const payload = await requestJson<{ text: string }>(`${TEXT_ENDPOINT}?name=${encodeURIComponent(section.name)}`)
      if (closed) return
      editorConfirm = false
      editor = { mode: 'assembled', name: section.name, text: payload.text }
      setStatus(defaultStatus())
      render()
    } catch (error) {
      if (!closed) setStatus(error instanceof Error ? error.message : String(error), true)
    }
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const renderAssembledRow = (section: PromptAssembledSection): HTMLElement => {
    const row = el('div', 'dxp-row')
    const main = el('div', 'dxp-main')
    const name = el('span', 'dxp-name', section.name)
    const meta = el('span', 'dxp-meta', formatSize(section.size))
    if (section.overridden) meta.append(el('span', 'dxp-badge', t('prompt.modified')))
    if (section.disabled) meta.append(el('span', 'dxp-badge', t('prompt.disabled')))
    main.append(name, meta)
    const actions = el('div', 'dxp-actions')
    const edit = el('button', 'dxp-link', t('prompt.edit'))
    edit.type = 'button'
    edit.disabled = busy
    edit.addEventListener('click', () => { void openAssembledEditor(section) })
    actions.append(edit)
    const toggle = el('button', 'dxp-link', section.disabled ? t('prompt.enable') : t('prompt.disable'))
    toggle.type = 'button'
    toggle.disabled = busy
    toggle.addEventListener('click', () => {
      void save({ action: section.disabled ? 'enable' : 'disable', name: section.name })
    })
    actions.append(toggle)
    if (section.overridden || section.disabled) {
      const restore = el('button', 'dxp-link', t('prompt.restore'))
      restore.type = 'button'
      restore.disabled = busy
      restore.addEventListener('click', () => {
        requestConfirm(t('prompt.confirmRestore', { name: section.name }), () => {
          void save({ action: 'reset', name: section.name })
        })
      })
      actions.append(restore)
    }
    const head = el('div', 'dxp-row-head')
    head.append(main, actions)
    row.append(head)
    if (section.text !== '') row.append(el('pre', 'dxp-prompt-text', section.text))
    return row
  }

  const renderCustomRow = (item: PromptCustomEntry): HTMLElement => {
    const row = el('div', 'dxp-row')
    const main = el('div', 'dxp-main')
    const title = el('span', 'dxp-name', item.title)
    const meta = el('span', 'dxp-meta', `${formatSize(new TextEncoder().encode(item.text).length)} · ${item.id}`)
    if (!item.enabled) meta.append(el('span', 'dxp-badge', t('prompt.disabled')))
    main.append(title, meta)
    const actions = el('div', 'dxp-actions')
    const edit = el('button', 'dxp-link', t('prompt.edit'))
    edit.type = 'button'
    edit.disabled = busy
    edit.addEventListener('click', () => {
      editorConfirm = false
      editor = { mode: 'custom', id: item.id, title: item.title, text: item.text }
      render()
    })
    const toggle = el('button', 'dxp-link', item.enabled ? t('prompt.disable') : t('prompt.enable'))
    toggle.type = 'button'
    toggle.disabled = busy
    toggle.addEventListener('click', () => {
      void save({ action: 'toggle', id: item.id, enabled: !item.enabled })
    })
    const remove = el('button', 'dxp-link danger', t('prompt.delete'))
    remove.type = 'button'
    remove.disabled = busy
    remove.addEventListener('click', () => {
      requestConfirm(t('prompt.confirmDelete', { title: item.title }), () => {
        void save({ action: 'remove', id: item.id })
      })
    })
    actions.append(edit, toggle, remove)
    const head = el('div', 'dxp-row-head')
    head.append(main, actions)
    row.append(head)
    if (item.text !== '') row.append(el('pre', 'dxp-prompt-text', item.text))
    return row
  }

  const renderEditor = (): void => {
    editorLayer.replaceChildren()
    if (editor === undefined) {
      editorLayer.hidden = true
      return
    }
    editorLayer.hidden = false
    const headRow = el('div', 'dxp-editor-head')
    const title = editor.mode === 'assembled'
      ? el('span', 'dxp-editor-name', editor.name ?? '')
      : el('input', 'dxp-input')
    if (title instanceof HTMLInputElement) {
      title.value = editor.title ?? ''
      title.placeholder = t('prompt.titlePlaceholder')
      title.maxLength = 200
      headRow.append(title)
    } else {
      headRow.append(title)
    }
    const close = el('button', 'dxp-close', '×')
    close.type = 'button'
    close.addEventListener('click', () => { editorConfirm = false; editor = undefined; setStatus(defaultStatus()); render() })
    headRow.append(close)
    editorLayer.append(headRow)
    const area = el('textarea', 'dxp-textarea')
    area.value = editor.text
    area.placeholder = t('prompt.textPlaceholder')
    area.spellcheck = false
    editorLayer.append(area)
    const footRow = el('div', 'dxp-editor-foot')
    const saveButton = el('button', 'dxp-btn primary', editor.mode === 'add' ? t('prompt.add') : t('prompt.save'))
    saveButton.type = 'button'
    saveButton.disabled = busy
    saveButton.addEventListener('click', () => {
      if (editor === undefined) return
      const text = area.value
      const current = editor
      busy = true
      void (async () => {
        let change: Record<string, unknown> | undefined
        if (current.mode === 'assembled') change = { action: 'set', name: current.name, text }
        else if (current.mode === 'add') change = { action: 'add', title: title instanceof HTMLInputElement ? title.value : '', text }
        else change = { action: 'update', id: current.id, ...(title instanceof HTMLInputElement ? { title: title.value } : {}), text }
        const ok = change === undefined ? false : await save(change)
        busy = false
        if (ok) { editor = undefined; setStatus(defaultStatus()); render() }
      })()
    })
    footRow.append(saveButton)
    if (editor.mode === 'assembled') {
      const restore = el('button', 'dxp-btn', t('prompt.restore'))
      restore.type = 'button'
      restore.disabled = busy
      restore.addEventListener('click', () => { editorConfirm = true; render() })
      footRow.append(restore)
    }
    const cancel = el('button', 'dxp-btn', t('prompt.cancel'))
    cancel.type = 'button'
    cancel.addEventListener('click', () => { editorConfirm = false; editor = undefined; setStatus(defaultStatus()); render() })
    const spacer = el('span', 'dxp-grow')
    footRow.append(spacer, cancel)
    editorLayer.append(footRow)
    if (editorConfirm) {
      const bar = el('div', 'dxp-confirm')
      bar.append(el('span', '', t('prompt.confirmRestore', { name: editor.name ?? '' })))
      const ok = el('button', 'dxp-btn', t('prompt.confirm'))
      ok.type = 'button'
      ok.addEventListener('click', () => {
        const name = editor?.name
        if (name === undefined) return
        editorConfirm = false
        editor = undefined
        render()
        void save({ action: 'reset', name })
      })
      const cancel = el('button', 'dxp-btn', t('prompt.cancel'))
      cancel.type = 'button'
      cancel.addEventListener('click', () => { editorConfirm = false; render() })
      bar.append(ok, cancel)
      editorLayer.append(bar)
    }
  }

  const render = (): void => {
    if (closed) return
    assembledTab.classList.toggle('active', tab === 'assembled')
    customTab.classList.toggle('active', tab === 'custom')
    resetAllButton.hidden = tab !== 'assembled'
    addButton.hidden = tab !== 'custom'
    resetAllButton.disabled = busy
    addButton.disabled = busy
    body.replaceChildren()
    if (list === undefined) {
      body.append(el('div', 'dxp-meta', t('prompt.loading')))
    } else if (tab === 'assembled') {
      if (list.assembled.length === 0) body.append(el('div', 'dxp-meta', t('prompt.assembledEmpty')))
      for (const section of list.assembled) body.append(renderAssembledRow(section))
    } else {
      if (list.custom.length === 0) body.append(el('div', 'dxp-meta', t('prompt.customEmpty')))
      for (const item of list.custom) body.append(renderCustomRow(item))
    }
    confirmBar.replaceChildren()
    if (confirm !== undefined) {
      confirmBar.hidden = false
      const message = el('span', '', confirm.message)
      const ok = el('button', 'dxp-btn', t('prompt.confirm'))
      ok.type = 'button'
      const cancel = el('button', 'dxp-btn', t('prompt.cancel'))
      cancel.type = 'button'
      ok.addEventListener('click', () => {
        const run = confirm?.run
        confirm = undefined
        if (run !== undefined) run()
        render()
      })
      cancel.addEventListener('click', () => { confirm = undefined; render() })
      confirmBar.append(message, ok, cancel)
    } else {
      confirmBar.hidden = true
    }
    renderEditor()
    statusLabel.textContent = status
    statusLabel.classList.toggle('error', statusError)
  }

  resetAllButton.addEventListener('click', () => {
    requestConfirm(t('prompt.confirmResetAll'), () => {
      void save({ action: 'reset-all' })
    })
  })
  addButton.addEventListener('click', () => {
    editorConfirm = false
    editor = { mode: 'add', title: '', text: '' }
    render()
  })
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) handle.close()
  })
  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && editor === undefined && confirm === undefined) handle.close()
  }
  document.addEventListener('keydown', onKey)

  const handle: PromptDialogHandle = {
    close: () => {
      if (closed) return
      closed = true
      document.removeEventListener('keydown', onKey)
      backdrop.remove()
      if (active === handle) active = undefined
    },
  }
  active = handle
  document.body.append(backdrop)
  render()
  void refresh()
  return handle
}

/**
 * 关闭当前打开的系统提示词面板。
 */
export function closePromptDialog(): void {
  active?.close()
  active = undefined
}







