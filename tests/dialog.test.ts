import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'
import { JSDOM } from 'jsdom'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

interface Option {
  id: string
  label: string
}

interface Decoration {
  name: string
  ui: {
    options: (session: { sessionId: string }, signal: AbortSignal) => Promise<Option[]>
    onSelect: (option: Option, session: { sessionId: string }) => void | Promise<void>
  }
}

/** 面板数据桩。 */
const scopePayload = {
  ok: true,
  scope: 'archived',
  preselect: 'suggested',
  generatedAt: 1,
  totals: { count: 3, bytes: 3072, live: 1 },
  rows: [
    { id: 'aaa', title: '会话 A', cwd: 'D:\\Work\\a', createdAt: 1, lastActivity: 2, bytes: 1024, live: false, suggested: true },
    { id: 'bbb', title: '会话 B', cwd: 'D:\\Work\\b', createdAt: 1, lastActivity: 3, bytes: 1024, live: false, suggested: true },
    { id: 'live', title: '在用会话', cwd: 'D:\\Work\\live', createdAt: 1, lastActivity: 4, bytes: 1024, live: true, suggested: false },
  ],
}

/** 删除结果桩。 */
const deleteSummary = {
  deleted: [
    { id: 'aaa', title: '会话 A', cwd: 'D:\\Work\\a' },
    { id: 'bbb', title: '会话 B', cwd: 'D:\\Work\\b' },
  ],
  failed: [],
  bytes: 2048,
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
 * 在 jsdom 里加载客户端 bundle 并打开 /clean 面板。
 * @returns 测试观测面。
 */
async function openHarness(options: { failSessionsOnce?: boolean } = {}): Promise<{
  document: Document
  commands: string[]
  requests: string[]
  close: () => void
}> {
  const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', { url: 'http://127.0.0.1:9999/' })
  const document = dom.window.document
  const commands: string[] = []
  const requests: string[] = []
  let sessionFailures = 0

  const response = (payload: unknown, status = 200): { ok: boolean; status: number; json: () => Promise<unknown> } => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  })
  const fetchImpl = async (input: unknown): Promise<unknown> => {
    const url = typeof input === 'string' ? input : String((input as { url?: string })?.url ?? input)
    requests.push(url)
    if (url.includes('/clean/sessions')) {
      if (options.failSessionsOnce === true && sessionFailures === 0) {
        sessionFailures += 1
        throw new Error('boom')
      }
      return response(scopePayload)
    }
    if (url.includes('/clean/result')) return response({ ok: true, found: true, result: deleteSummary })
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
    fetch: fetchImpl,
    crypto: { randomUUID: () => 'fixedtoken1234567890' },
  }
  runInNewContext(code, sandbox)
  assert.ok(registration !== undefined)

  const decorations: Decoration[] = []
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
      decorate: (decoration: Decoration): (() => void) => {
        decorations.push(decoration)
        return () => {}
      },
    },
    sessions: {
      binding: () => ({
        session: {
          command: async (line: string): Promise<unknown> => {
            commands.push(line)
            return { ok: true, value: { matched: true } }
          },
        },
      }),
    },
  }
  ;(registration.factory(() => undefined) as { apply: (scope: unknown) => void }).apply(ctx)

  const clean = decorations.find(item => item.name === 'clean')
  assert.ok(clean !== undefined)
  clean.ui.onSelect({ id: 'dialog:archived', label: '7d' }, { sessionId: 's1' })
  await waitFor(() => document.querySelectorAll('.dx-row').length === 3 || document.querySelector('.dx-error') !== null)

  return { document, commands, requests, close: () => { dom.window.close() } }
}

/**
 * 找到指定类名下文本匹配的按钮。
 * @param document 文档。
 * @param selector 选择器。
 * @param text 文本。
 * @returns 按钮。
 */
function buttonByText(document: Document, selector: string, text: string): HTMLButtonElement {
  const found = [...document.querySelectorAll<HTMLButtonElement>(selector)].find(item => item.textContent === text)
  assert.ok(found !== undefined, `找不到按钮：${text}`)
  return found
}

test('面板列出范围内会话、逐条勾选并回传精确 id', async () => {
  const harness = await openHarness()
  try {
    const { document } = harness
    const rows = [...document.querySelectorAll<HTMLElement>('.dx-row')]
    assert.equal(rows.length, 3)
    assert.match(document.querySelector('.dx-sub')?.textContent ?? '', /共 3 个/u)
    assert.match(document.querySelector('.dx-sub')?.textContent ?? '', /使用中 1 个/u)

    const inputs = rows.map(row => row.querySelector<HTMLInputElement>('input'))
    assert.equal(inputs[0]?.checked, true)
    assert.equal(inputs[1]?.checked, true)
    assert.equal(inputs[2]?.disabled, true)
    assert.equal(inputs[2]?.checked, false)

    const count = (): string => document.querySelector('.dx-count')?.textContent ?? ''
    assert.match(count(), /2/u)

    buttonByText(document, '.dx-link', '清空').click()
    assert.equal(inputs[0]?.checked, false)
    assert.match(count(), /0/u)
    assert.equal(buttonByText(document, '.dx-btn', '永久删除').disabled, true)

    buttonByText(document, '.dx-link', '全选').click()
    assert.equal(inputs[0]?.checked, true)
    assert.equal(inputs[1]?.checked, true)
    assert.equal(inputs[2]?.checked, false)

    rows[1]?.click()
    assert.equal(inputs[1]?.checked, false)
    rows[1]?.click()
    assert.equal(inputs[1]?.checked, true)

    const ack = document.querySelector<HTMLInputElement>('.dx-ack input')
    assert.ok(ack !== null)
    ack.click()
    const remove = buttonByText(document, '.dx-btn', '永久删除')
    assert.equal(remove.disabled, false)

    remove.click()
    await waitFor(() => document.querySelector('.dx-result') !== null)

    assert.equal(harness.commands.length, 1)
    const command = harness.commands[0] ?? ''
    assert.match(command, /^\/clean --ids /u)
    assert.match(command, /--yes/u)
    assert.match(command, /--request fixedtoken1234567890/u)
    assert.match(command, /aaa/u)
    assert.match(command, /bbb/u)
    assert.match(document.querySelector('.dx-result-title')?.textContent ?? '', /已删除 2 个会话/u)
  } finally {
    harness.close()
  }
})

test('面板支持搜索过滤与 Escape 关闭', async () => {
  const harness = await openHarness()
  try {
    const { document } = harness
    const search = document.querySelector<HTMLInputElement>('.dx-search')
    assert.ok(search !== null)
    search.value = '会话 B'
    search.dispatchEvent(new harness.document.defaultView!.Event('input', { bubbles: true }))
    const rows = [...document.querySelectorAll<HTMLElement>('.dx-row')]
    assert.equal(rows[0]?.hidden, true)
    assert.equal(rows[1]?.hidden, false)
    assert.equal(rows[2]?.hidden, true)

    document.dispatchEvent(new harness.document.defaultView!.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await waitFor(() => document.querySelector('.dx-backdrop') === null)
  } finally {
    harness.close()
  }
})

test('读取失败时显示错误并可重试', async () => {
  const harness = await openHarness({ failSessionsOnce: true })
  try {
    const { document } = harness
    const errorBox = document.querySelector('.dx-error')
    assert.ok(errorBox !== null)
    assert.match(errorBox.textContent ?? '', /读取失败/u)

    buttonByText(document, '.dx-link', '重试').click()
    await waitFor(() => document.querySelectorAll('.dx-row').length === 3)
    assert.equal(document.querySelector('.dx-error'), null)
  } finally {
    harness.close()
  }
})

