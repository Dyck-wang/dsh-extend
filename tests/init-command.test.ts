import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import type { CommandDefinition, HostContext } from '../src/types.ts'
import { registerInit } from '../src/init/index.ts'

test('/init 扫描仓库并把任务消息交给当前 agent', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-extend-init-'))
  try {
    await writeFile(join(root, 'README.md'), '# Demo\n\nA demo repository.\n')
    await writeFile(join(root, 'package.json'), JSON.stringify({ name: 'demo', scripts: { test: 'node --test' } }))

    let definition: CommandDefinition | undefined
    const scope = {
      commands: {
        register: (value: CommandDefinition) => {
          definition = value
          return () => {}
        },
      },
      effect: (fn: () => (() => void) | void) => {
        const disposer = fn()
        return typeof disposer === 'function' ? disposer : () => {}
      },
    }
    const ctx = {
      inject: (_names: readonly string[], callback: (value: unknown) => void) => { callback(scope) },
      effect: (fn: () => (() => void) | void) => {
        const disposer = fn()
        return typeof disposer === 'function' ? disposer : () => {}
      },
      get: () => undefined,
      emit: () => {},
    } as unknown as HostContext
    registerInit(ctx)
    assert.ok(definition !== undefined)
    assert.equal(definition?.name, 'init')

    const steered: unknown[] = []
    const result = await definition!.handler({
      agent: {
        id: 'agent-1',
        steer: (message: unknown) => { steered.push(message) },
        session: { header: { cwd: root } },
      },
      rawInput: '补充说明',
      signal: new AbortController().signal,
    })
    assert.equal(result.kind, 'success')
    assert.equal(steered.length, 1)
    const message = steered[0] as {
      role: string
      content: readonly { type: string; text: string }[]
      source: { kind: string; form: string }
    }
    assert.equal(message.role, 'user')
    assert.equal(message.source.kind, 'dsh-extend')
    assert.equal(message.source.form, 'notice')
    const text = message.content[0]?.text ?? ''
    assert.ok(text.includes(join(root, 'AGENTS.md')), '任务消息必须给出 AGENTS.md 的绝对路径')
    assert.ok(text.includes('补充说明'), '命令后的补充说明必须进入任务消息')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
