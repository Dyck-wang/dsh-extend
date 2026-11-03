/** 全局 tools/execute 拦截：9P 分支直接写、其余回退原工具。 */
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { isAbsolute, join } from 'node:path'
import test from 'node:test'
import type { HostContext, ToolContentBlockLike, ToolDefinitionLike } from '../src/types.ts'
import { installWslExecuteHook } from '../src/wsl/transparent.ts'

/** 临时目录 + 清理。 */
async function withTemp(): Promise<{ root: string; cleanup: () => Promise<void> }> {
  const root = await mkdtemp(join(tmpdir(), 'dsh-extend-hook-'))
  return { root, cleanup: async () => { await rm(root, { recursive: true, force: true }) } }
}

/** 一个最小工具定义。 */
function makeTool(name: string): ToolDefinitionLike {
  return {
    name,
    description: name,
    parameters: { type: 'object' },
    output: { schema: { type: 'object' }, render: () => [] },
    execute: async () => ({}),
  }
}

/** 监听器看到的调用。 */
interface ExecLike {
  readonly name: string
  readonly arguments: unknown
  readonly agent?: unknown
  readonly signal?: AbortSignal
}

/** 监听器返回的结果。 */
interface ResultLike {
  readonly isError: false
  readonly value: unknown
  readonly content: readonly ToolContentBlockLike[]
}

/** `tools/execute` 监听器。 */
type ListenerLike = (exec: ExecLike, next: () => Promise<ResultLike>) => Promise<ResultLike>

/** 构造 fake ctx，并返回捕获到的监听器与 next 调用计数。 */
function createHook(
  accept: (targetKey: string) => boolean,
  workingDirectory?: { ensure: (agent: unknown, signal?: AbortSignal) => Promise<string | undefined> },
): {
  listener: ListenerLike
  nextCalls: () => number
} {
  let listener: ListenerLike | undefined
  let nextCalls = 0
  const tools = {
    get: (name: string) => (name === 'write' ? makeTool('write') : name === 'edit' ? makeTool('edit') : undefined),
  }
  const fs = {
    resolve: async (path: string, options?: { cwd?: string }) => {
      const resolved = options?.cwd !== undefined && !isAbsolute(path) ? join(options.cwd, path) : path
      return { targetKey: resolved, displayPath: resolved }
    },
  }
  const ctx = {
    get: (name: string) => (name === 'tools'
      ? tools
      : name === 'fs'
        ? fs
        : name === 'workingDirectory'
          ? workingDirectory
          : undefined),
    inject: (_names: readonly string[], callback: (scope: HostContext) => void) => {
      callback(ctx as unknown as HostContext)
    },
    effect: (fn: () => (() => void) | void) => {
      const disposer = fn()
      return typeof disposer === 'function' ? disposer : () => {}
    },
    on: (_event: string, handler: ListenerLike) => {
      listener = handler
      return () => {}
    },
    emit: () => {},
  } as unknown as HostContext

  installWslExecuteHook(ctx, accept)
  assert.ok(listener !== undefined)
  return {
    listener,
    nextCalls: () => nextCalls,
  }
}

/** 原工具的成功结果。 */
function nextResult(): ResultLike {
  return { isError: false, value: { original: true }, content: [] }
}

test('write 的 9P 目标直接写并返回原 output 形状', async () => {
  const { root, cleanup } = await withTemp()
  try {
    const target = join(root, 'a.txt')
    const hook = createHook(() => true)
    const next = async (): Promise<ResultLike> => {
      throw new Error('next should not be called')
    }

    const created = await hook.listener(
      { name: 'write', arguments: { file_path: target, content: 'hello\r\nworld' } },
      next,
    )
    assert.deepEqual(created.value, {
      path: target,
      operation: 'create',
      before: null,
      after: 'hello\nworld',
    })
    assert.equal(await readFile(target, 'utf8'), 'hello\r\nworld')

    const updated = await hook.listener(
      { name: 'write', arguments: { file_path: target, content: 'next' } },
      next,
    )
    assert.deepEqual(updated.value, {
      path: target,
      operation: 'update',
      before: 'hello\r\nworld',
      after: 'next',
    })
    assert.equal(hook.nextCalls(), 0)
  } finally {
    await cleanup()
  }
})

test('write 的非 9P 目标调用原工具', async () => {
  const hook = createHook(() => false)
  const next = async (): Promise<ResultLike> => nextResult()
  const result = await hook.listener(
    { name: 'write', arguments: { file_path: 'C:\\a.txt', content: 'x' } },
    next,
  )
  assert.deepEqual(result, nextResult())
})

test('write 相对路径按会话 cwd 解析后再判断 9P', async () => {
  const { root, cleanup } = await withTemp()
  try {
    const hook = createHook(() => true, { ensure: async () => root })
    const next = async (): Promise<ResultLike> => {
      throw new Error('next should not be called')
    }

    const result = await hook.listener(
      { name: 'write', arguments: { file_path: 'x.txt', content: 'relative' } },
      next,
    )
    assert.deepEqual(result.value, {
      path: join(root, 'x.txt'),
      operation: 'create',
      before: null,
      after: 'relative',
    })
    assert.equal(await readFile(join(root, 'x.txt'), 'utf8'), 'relative')
  } finally {
    await cleanup()
  }
})

test('edit 相对路径同样按会话 cwd 解析', async () => {
  const { root, cleanup } = await withTemp()
  try {
    const target = join(root, 'a.txt')
    await writeFile(target, 'old', 'utf8')
    const hook = createHook(() => true, { ensure: async () => root })
    const next = async (): Promise<ResultLike> => {
      throw new Error('next should not be called')
    }

    const result = await hook.listener(
      { name: 'edit', arguments: { file_path: 'a.txt', old_string: 'old', new_string: 'new' } },
      next,
    )
    assert.deepEqual(result.value, { path: target, before: 'old', after: 'new' })
    assert.equal(await readFile(target, 'utf8'), 'new')
  } finally {
    await cleanup()
  }
})

test('非 write/edit、参数无效时调用原工具', async () => {
  const hook = createHook(() => true)
  const next = async (): Promise<ResultLike> => nextResult()

  assert.deepEqual(await hook.listener({ name: 'read', arguments: {} }, next), nextResult())
  assert.deepEqual(await hook.listener({ name: 'write', arguments: {} }, next), nextResult())
  assert.deepEqual(await hook.listener({ name: 'write', arguments: { file_path: '', content: 'x' } }, next), nextResult())
})

test('edit 的 9P 目标直接替换并保留 CRLF', async () => {
  const { root, cleanup } = await withTemp()
  try {
    const target = join(root, 'a.txt')
    await writeFile(target, 'a\r\nb\r\n', 'utf8')
    const hook = createHook(() => true)
    const next = async (): Promise<ResultLike> => {
      throw new Error('next should not be called')
    }

    const result = await hook.listener(
      { name: 'edit', arguments: { file_path: target, old_string: 'a', new_string: 'x' } },
      next,
    )
    assert.deepEqual(result.value, {
      path: target,
      before: 'a\nb\n',
      after: 'x\nb\n',
    })
    assert.equal(await readFile(target, 'utf8'), 'x\r\nb\r\n')
    assert.equal(hook.nextCalls(), 0)
  } finally {
    await cleanup()
  }
})

test('edit 的非 9P 目标与无效参数调用原工具', async () => {
  const hook = createHook(() => false)
  const next = async (): Promise<ResultLike> => nextResult()

  assert.deepEqual(
    await hook.listener({ name: 'edit', arguments: { file_path: 'C:\\a.txt', old_string: 'a', new_string: 'b' } }, next),
    nextResult(),
  )
  assert.deepEqual(await hook.listener({ name: 'edit', arguments: { file_path: 'C:\\a.txt' } }, next), nextResult())
})

test('edit 多重匹配时报错而不是回退', async () => {
  const { root, cleanup } = await withTemp()
  try {
    const target = join(root, 'a.txt')
    await writeFile(target, 'a a', 'utf8')
    const hook = createHook(() => true)
    const next = async (): Promise<ResultLike> => {
      throw new Error('next should not be called')
    }

    await assert.rejects(
      hook.listener({ name: 'edit', arguments: { file_path: target, old_string: 'a', new_string: 'b' } }, next),
      /occurs 2 times/u,
    )
  } finally {
    await cleanup()
  }
})
