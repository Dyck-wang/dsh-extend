import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import { JSDOM } from 'jsdom'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

interface PromptAction {
  name: string
  ui: { kind: string; run: (session: { sessionId: string }) => void }
}

const listPayload = {
  ok: true,
  assembled: [
    { name: 'harness:identity', size: 48, overridden: false, disabled: false, text: 'You are an AI agent.' },
    { name: 'app:web-surface', size: 1002, overridden: true, disabled: false, text: 'Web surface text' },
  ],
  custom: [{ id: 'c1', title: '称呼规则', text: '用中文回答', enabled: true }],
  tools: 2,
  contexts: 5,
}

/**
 * 等待条件成立。
 * @param check 条件。
 * @param timeout 上限毫秒。
 */
async function waitFor(check: () => boolean, timeout = 3000): Promise<void> {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (check()) return
    await new Promise(resolve => setTimeout(resolve, 20))
  }
  throw new Error('等待超时')
}

/**
 * 在 jsdom 里加载客户端 bundle 并打开 /prompt 面板。
 * @returns 测试观测面。
 */
async function openHarness(): Promise<{
  document: Document
  window: Window
  saves: unknown[]
  close: () => void
}> {
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url: 'http://127.0.0.1:9999/' })
  const document = dom.window.document
  const saves: unknown[] = []
  const response = (payload: unknown, status = 200): { ok: boolean; status: number; json: () => Promise<unknown> } => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  })
  const fetchImpl = async (input: unknown, init?: { body?: string }): Promise<unknown> => {
    const url = typeof input === 'string' ? input : String((input as { url?: string })?.url ?? input)
    if (url.includes('/api/dsh-extend/prompts/text')) return response({ ok: true, text: 'DEFAULT' })
    if (url.includes('/api/dsh-extend/prompts/save')) {
      saves.push(JSON.parse(init?.body ?? '{}'))
      return response({ ok: true })
    }
    if (url.includes('/api/dsh-extend/prompts')) return response(listPayload)
    return response({ ok: false }, 404)
  }

  const code = await readFile(join(root, 'lib/client.js'), 'utf8')
  let registration: { id: string; factory: (require: (name: string) => unknown) => unknown } | undefined
  const windowWithLoader = dom.window as unknown as { __ModuleLoader__?: { load: (value: typeof registration) => void } }
  windowWithLoader.__ModuleLoader__ = { load: (value) => { registration = value } }

  const sandbox = {
    window: dom.window,
    document,
    console,
    URL,
    setTimeout,
    clearTimeout,
    AbortController,
    AbortSignal,
    TextEncoder,
    HTMLInputElement: dom.window.HTMLInputElement,
    fetch: fetchImpl,
    crypto: { randomUUID: () => 'fixedtoken1234567890' },
  }
  runInNewContext(code, sandbox)
  assert.ok(registration !== undefined)

  const decorations: PromptAction[] = []
  const dictionaries: Record<string, Record<string, string>> = {}
  const ctx = {
    effect: (fn: () => (() => void) | void): (() => void) => {
      const disposer = fn()
      return typeof disposer === 'function' ? disposer : () => {}
    },
    locale: {
      register: (_ns: string, value: Record<string, Record<string, string>>): (() => void) => {
        Object.assign(dictionaries, value)
        return () => {}
      },
      bind: () => (key: string, params?: Record<string, unknown>): string => {
        let text = dictionaries.zh?.[key] ?? key
        if (params !== undefined) {
          for (const [name, value] of Object.entries(params)) text = text.replaceAll(`{${name}}`, String(value))
        }
        return text
      },
    },
    commandUi: {
      decorate: (decoration: PromptAction): (() => void) => {
        decorations.push(decoration)
        return () => {}
      },
    },
    sessions: { binding: () => undefined },
  }
  ;(registration.factory(() => undefined) as { apply: (scope: unknown) => void }).apply(ctx)

  const prompt = decorations.find(item => item.name === 'prompt')
  assert.ok(prompt !== undefined)
  assert.equal(prompt.ui.kind, 'action')
  prompt.ui.run({ sessionId: 's1' })
  await waitFor(() => document.querySelectorAll('.dxp-row').length === 2)
  return { document, window: dom.window as unknown as Window, saves, close: () => { dom.window.close() } }
}

/**
 * 找到指定类名下文本匹配的按钮。
 * @param root 根节点。
 * @param selector 选择器。
 * @param text 文本。
 * @returns 按钮。
 */
function buttonByText(root: ParentNode, selector: string, text: string): HTMLButtonElement {
  const found = [...root.querySelectorAll<HTMLButtonElement>(selector)].find(item => item.textContent === text)
  assert.ok(found !== undefined, `找不到按钮：${text}`)
  return found
}

test('/prompt 面板列出已组装段并保存覆盖', async () => {
  const harness = await openHarness()
  try {
    const { document, saves } = harness
    const rows = [...document.querySelectorAll<HTMLElement>('.dxp-row')]
    assert.equal(rows.length, 2)
    assert.match(rows[0]?.textContent ?? '', /harness:identity/u)
    assert.match(rows[1]?.textContent ?? '', /已修改/u)
    assert.equal(rows[0]?.querySelector('.dxp-prompt-text')?.textContent, 'You are an AI agent.')
    assert.match(document.querySelector('.dxp-status')?.textContent ?? '', /工具/u)
    const editorLayer = harness.document.querySelector<HTMLElement>('.dxp-editor')
    assert.equal(editorLayer?.hidden, true)
    assert.equal(harness.window.getComputedStyle(editorLayer as Element).display, 'none')

    buttonByText(rows[0] as HTMLElement, '.dxp-link', '编辑').click()
    await waitFor(() => document.querySelector<HTMLTextAreaElement>('.dxp-textarea') !== null)
    const area = document.querySelector<HTMLTextAreaElement>('.dxp-textarea')
    assert.equal(area?.value, 'DEFAULT')
    if (area !== null) area.value = 'NEW TEXT'
    buttonByText(document, '.dxp-btn', '保存').click()
    await waitFor(() => saves.length === 1)
    assert.deepEqual(saves[0], { action: 'set', name: 'harness:identity', text: 'NEW TEXT' })
  } finally {
    harness.close()
  }
})

test('/prompt 面板可新增自定义提示词并切换页签', async () => {
  const harness = await openHarness()
  try {
    const { document, saves } = harness
    buttonByText(document, '.dxp-tab', '自定义提示词').click()
    await waitFor(() => document.querySelectorAll('.dxp-row').length === 1)
    const customRow = document.querySelector<HTMLElement>('.dxp-row')
    assert.match(customRow?.textContent ?? '', /称呼规则/u)

    buttonByText(document, '.dxp-btn', '新增自定义').click()
    await waitFor(() => document.querySelector('.dxp-textarea') !== null)
    const input = document.querySelector<HTMLInputElement>('.dxp-editor-head input')
    const area = document.querySelector<HTMLTextAreaElement>('.dxp-textarea')
    assert.ok(input !== null && area !== null)
    if (input !== null) input.value = '新标题'
    if (area !== null) area.value = '新正文'
    buttonByText(document.querySelector('.dxp-editor-foot') ?? document, '.dxp-btn', '新增自定义').click()
    await waitFor(() => saves.length === 1)
    assert.deepEqual(saves[0], { action: 'add', title: '新标题', text: '新正文' })
  } finally {
    harness.close()
  }
})




