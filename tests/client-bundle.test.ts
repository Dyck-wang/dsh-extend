import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { runInNewContext } from 'node:vm'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

/** 弹窗选项（最小形状）。 */
interface Option {
  id: string
  label: string
  detail?: string
  group?: { name: string; label: string }
  confirmation?: unknown
}

interface Decoration {
  name: string
  available: (session: { sessionId: string }) => boolean
  ui: {
    kind: string
    options: (session: { sessionId: string }, signal: AbortSignal) => Promise<Option[]>
    onSelect: (option: Option, session: { sessionId: string }) => Promise<void> | void
  }
}

const summary = {
  ok: true,
  generatedAt: Date.now(),
  totals: { sessions: 10, bytes: 100, live: 1 },
  archived: { count: 2, bytes: 200 },
  buckets: [
    { days: 30, count: 1, bytes: 100 },
    { days: 90, count: 0, bytes: 0 },
  ],
  all: { count: 9, bytes: 900 },
}

interface Harness {
  readonly decorations: Decoration[]
  readonly registered: { ns: string; dictionaries: Record<string, Record<string, string>> }[]
  readonly commands: string[]
  readonly drafts: string[]
  readonly module: { inject: string[]; apply: (ctx: unknown) => void }
  readonly loadId: string
}

/**
 * 在隔离上下文里执行 lib/client.js，并接到最小客户端上下文上。
 * @param fetchImpl 统计接口的 fetch 实现。
 * @returns 观测数据。
 */
async function loadClient(fetchImpl: () => Promise<unknown>): Promise<Harness> {
  const code = await readFile(join(root, 'lib/client.js'), 'utf8')
  let registration: { id: string; factory: (require: (name: string) => unknown) => unknown } | undefined
  const sandbox = {
    window: {
      __ModuleLoader__: {
        load: (value: typeof registration): void => { registration = value },
      },
    },
    fetch: fetchImpl,
    console,
    setTimeout,
    clearTimeout,
    URL,
  }
  runInNewContext(code, sandbox)
  assert.ok(registration !== undefined, 'client bundle 没有注册工厂')

  const decorations: Decoration[] = []
  const registered: { ns: string; dictionaries: Record<string, Record<string, string>> }[] = []
  const commands: string[] = []
  const drafts: string[] = []
  const ctx = {
    effect: (fn: () => (() => void) | void): (() => void) => {
      const disposer = fn()
      return typeof disposer === 'function' ? disposer : () => {}
    },
    locale: {
      register: (ns: string, dictionaries: Record<string, Record<string, string>>) => {
        registered.push({ ns, dictionaries })
        return () => {}
      },
      bind: (ns: string) => (key: string, params?: Record<string, unknown>) => {
        const dictionary = registered.find(item => item.ns === ns)?.dictionaries.zh ?? {}
        let text = dictionary[key] ?? key
        if (params !== undefined) {
          for (const [name, value] of Object.entries(params)) text = text.replaceAll(`{${name}}`, String(value))
        }
        return text
      },
    },
    commandUi: {
      decorate: (decoration: Decoration) => {
        decorations.push(decoration)
        return () => {}
      },
    },
    sessions: {
      binding: () => ({
        session: {
          command: async (line: string) => {
            commands.push(line)
            return { ok: true as const, value: { matched: true } }
          },
        },
        ctx: {
          get: (name: string) => name === 'conversation'
            ? { input: { for: () => ({ setDraft: (text: string) => { drafts.push(text) } }) } }
            : undefined,
        },
      }),
    },
  }

  const exported = registration.factory(() => { throw new Error('client bundle should not require modules') }) as {
    inject: string[]
    apply: (scope: unknown) => void
  }
  exported.apply(ctx)
  return { decorations, registered, commands, drafts, module: exported, loadId: registration.id }
}

test('client bundle 以 dsh-extend 注册并导出 apply/inject', async () => {
  const harness = await loadClient(async () => ({ ok: true, json: async () => summary }))
  assert.equal(harness.loadId, 'dsh-extend')
  assert.deepEqual([...harness.module.inject], ['commandUi', 'sessions', 'locale'])
  assert.equal(harness.registered.length, 1)
  assert.equal(harness.registered[0]?.ns, 'dsh-extend')
  assert.ok(harness.registered[0]?.dictionaries.zh !== undefined)
  assert.ok(harness.registered[0]?.dictionaries.en !== undefined)
  assert.deepEqual(harness.decorations.map(item => item.name).sort(), ['clean', 'reboot'])
})

test('/clean 弹窗按统计生成勾选面板入口', async () => {
  const harness = await loadClient(async () => ({ ok: true, json: async () => summary }))
  const clean = harness.decorations.find(item => item.name === 'clean')
  assert.ok(clean !== undefined)
  const options = await clean.ui.options({ sessionId: 'sdk' }, new AbortController().signal)
  const ids = options.map(option => option.id)
  assert.equal(ids.join('|'), [
    'dialog:archived',
    'dialog:30d',
    'dialog:all:none',
    'dialog:empty',
  ].join('|'))
  assert.match(options[2]?.detail ?? '', /9 个/u)
  assert.match(options[2]?.detail ?? '', /900 B/u)
})

test('/clean 统计不可用时只给“全部会话”', async () => {
  const harness = await loadClient(async () => { throw new Error('network down') })
  const clean = harness.decorations.find(item => item.name === 'clean')
  assert.ok(clean !== undefined)
  const options = await clean.ui.options({ sessionId: 'sdk' }, new AbortController().signal)
  assert.equal(options.map(option => option.id).join('|'), 'dialog:all:none')
})

test('没有会话时只给“全部会话”', async () => {
  const empty = {
    ...summary,
    totals: { sessions: 0, bytes: 0, live: 0 },
    archived: { count: 0, bytes: 0 },
    buckets: summary.buckets.map(bucket => ({ ...bucket, count: 0, bytes: 0 })),
    all: { count: 0, bytes: 0 },
  }
  const harness = await loadClient(async () => ({ ok: true, json: async () => empty }))
  const clean = harness.decorations.find(item => item.name === 'clean')
  assert.ok(clean !== undefined)
  const options = await clean.ui.options({ sessionId: 'sdk' }, new AbortController().signal)
  assert.equal(options.map(option => option.id).join('|'), 'dialog:all:none')
})

test('/reboot 弹窗提供重启与取消，确认后提交 --yes', async () => {
  const harness = await loadClient(async () => ({ ok: true, json: async () => summary }))
  const reboot = harness.decorations.find(item => item.name === 'reboot')
  assert.ok(reboot !== undefined)
  const options = await reboot.ui.options({ sessionId: 'sdk' }, new AbortController().signal)
  assert.equal(options.map(option => option.id).join('|'), '/reboot --yes|')
  assert.ok(options[0]?.confirmation !== undefined)

  await reboot.ui.onSelect(options[0] as Option, { sessionId: 'sdk' })
  await reboot.ui.onSelect(options[1] as Option, { sessionId: 'sdk' })
  assert.deepEqual(harness.commands, ['/reboot --yes'])
  assert.deepEqual(harness.drafts, [''])
})

test('会话未就绪时重启提交抛错', async () => {
  const code = await readFile(join(root, 'lib/client.js'), 'utf8')
  let registration: { factory: (require: (name: string) => unknown) => unknown } | undefined
  runInNewContext(code, {
    window: { __ModuleLoader__: { load: (value: typeof registration): void => { registration = value } } },
    console,
    URL,
  })
  assert.ok(registration !== undefined)
  const decorations: Decoration[] = []
  const ctx = {
    effect: (fn: () => (() => void) | void): (() => void) => {
      const disposer = fn()
      return typeof disposer === 'function' ? disposer : () => {}
    },
    locale: {
      register: () => () => {},
      bind: () => (key: string) => `[${key}]`,
    },
    commandUi: {
      decorate: (decoration: Decoration) => {
        decorations.push(decoration)
        return () => {}
      },
    },
    sessions: { binding: () => undefined },
  }
  ;(registration.factory(() => undefined) as { apply: (scope: unknown) => void }).apply(ctx)
  const reboot = decorations.find(item => item.name === 'reboot')
  assert.ok(reboot !== undefined)
  await assert.rejects(async () => {
    await reboot.ui.onSelect({ id: '/reboot --yes', label: 'restart' }, { sessionId: 'missing' })
  }, /session.missing/u)
})


