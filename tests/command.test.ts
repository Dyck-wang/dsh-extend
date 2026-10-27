import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { after, test } from 'node:test'
import { runCleanCommand, SnapshotStore } from '../src/clean/command.ts'
import { ResultStore } from '../src/clean/results.ts'
import type { CommandInvocation, CommandResult } from '../src/types.ts'
import { createFakeContext, createFakeServices, createSessionFixture, isolateDshHome, withTempRoot } from './helpers.ts'

const restoreHome = await isolateDshHome()
after(() => restoreHome())

const NOW = Date.now()
const DAY = 86_400_000
const results = new ResultStore()

function invocation(rawInput: string, agentId = 'agent-1'): CommandInvocation {
  return { agent: { id: agentId, steer: () => {} }, rawInput, signal: new AbortController().signal }
}

function textOf(result: CommandResult): string {
  return result.text ?? ''
}

test('清单 → 按序号删除', async () => {
  const { root, cleanup } = await withTempRoot()
  try {
    const newest = await createSessionFixture(root, {
      id: 'newest', title: '最新会话', mtime: NOW - 1000, size: 2048,
    })
    const older = await createSessionFixture(root, {
      id: 'older', title: '旧会话', mtime: NOW - 10 * DAY, size: 1024,
    })
    const services = createFakeServices([older, newest])
    const ctx = createFakeContext(services)
    const snapshots = new SnapshotStore()

    const list = await runCleanCommand(ctx, snapshots, results, invocation(''))
    assert.equal(list.kind, 'success')
    assert.match(textOf(list), /历史会话/u)
    assert.match(textOf(list), /共 2 个/u)
    assert.match(textOf(list), /最新会话/u)

    const removed = await runCleanCommand(ctx, snapshots, results, invocation('1'))
    assert.equal(removed.kind, 'success')
    assert.match(textOf(removed), /已永久删除 1 个会话/u)
    assert.equal(existsSync(newest.dir), false)
    assert.equal(existsSync(older.dir), true)
  } finally {
    await cleanup()
  }
})

test('序号超出范围与无快照都报错', async () => {
  const { root, cleanup } = await withTempRoot()
  try {
    const one = await createSessionFixture(root, { id: 'one', mtime: NOW })
    const services = createFakeServices([one])
    const ctx = createFakeContext(services)
    const snapshots = new SnapshotStore()

    const noSnapshot = await runCleanCommand(ctx, snapshots, results, invocation('1'))
    assert.equal(noSnapshot.kind, 'error')
    assert.match(textOf(noSnapshot), /清单快照/u)

    await runCleanCommand(ctx, snapshots, results, invocation('list'))
    const outOfRange = await runCleanCommand(ctx, snapshots, results, invocation('9'))
    assert.equal(outOfRange.kind, 'error')
    assert.match(textOf(outOfRange), /超出范围/u)
  } finally {
    await cleanup()
  }
})

test('使用中的会话不能被序号删除', async () => {
  const { root, cleanup } = await withTempRoot()
  try {
    const live = await createSessionFixture(root, { id: 'live', mtime: NOW })
    const services = createFakeServices([live], ['live'])
    const ctx = createFakeContext(services)
    const snapshots = new SnapshotStore()

    await runCleanCommand(ctx, snapshots, results, invocation('list'))
    const result = await runCleanCommand(ctx, snapshots, results, invocation('1'))
    assert.equal(result.kind, 'error')
    assert.match(textOf(result), /使用中/u)
    assert.equal(existsSync(live.dir), true)
  } finally {
    await cleanup()
  }
})

test('批量：先预览，再 --yes 删除', async () => {
  const { root, cleanup } = await withTempRoot()
  try {
    const oldOne = await createSessionFixture(root, {
      id: 'old-one', title: '旧一', mtime: NOW - 40 * DAY, cwd: 'D:\\Old',
    })
    const fresh = await createSessionFixture(root, {
      id: 'fresh', title: '新', mtime: NOW - 1 * DAY, cwd: 'D:\\Fresh',
    })
    const services = createFakeServices([oldOne, fresh])
    const ctx = createFakeContext(services)
    const snapshots = new SnapshotStore()

    const preview = await runCleanCommand(ctx, snapshots, results, invocation('--older-than 30d'))
    assert.equal(preview.kind, 'success')
    assert.match(textOf(preview), /将永久删除 1 个会话/u)
    assert.match(textOf(preview), /--older-than 30d --yes/u)
    assert.equal(existsSync(oldOne.dir), true)

    const execute = await runCleanCommand(ctx, snapshots, results, invocation('--older-than 30d --yes'))
    assert.equal(execute.kind, 'success')
    assert.match(textOf(execute), /已永久删除 1 个会话/u)
    assert.equal(existsSync(oldOne.dir), false)
    assert.equal(existsSync(fresh.dir), true)
  } finally {
    await cleanup()
  }
})

test('批量：空会话只删没有用户消息的', async () => {
  const { root, cleanup } = await withTempRoot()
  try {
    const blank = await createSessionFixture(root, { id: 'blank', mtime: NOW, events: [] })
    const used = await createSessionFixture(root, {
      id: 'used', mtime: NOW - 1000, events: [{ type: 'turn/start', seq: 0 }],
    })
    const services = createFakeServices([blank, used])
    const ctx = createFakeContext(services)
    const snapshots = new SnapshotStore()

    const preview = await runCleanCommand(ctx, snapshots, results, invocation('--empty'))
    assert.match(textOf(preview), /将永久删除 1 个会话/u)

    const execute = await runCleanCommand(ctx, snapshots, results, invocation('--empty --yes'))
    assert.equal(execute.kind, 'success')
    assert.equal(existsSync(blank.dir), false)
    assert.equal(existsSync(used.dir), true)
  } finally {
    await cleanup()
  }
})

test('项目关键字过滤与 id 前缀删除', async () => {
  const { root, cleanup } = await withTempRoot()
  try {
    const work = await createSessionFixture(root, {
      id: 'abc12345-0000-4000-8000-000000000001', cwd: 'D:\\WorkSpace\\dsh', mtime: NOW,
    })
    const other = await createSessionFixture(root, {
      id: 'abc99999-0000-4000-8000-000000000002', cwd: 'D:\\Other', mtime: NOW - 1000,
    })
    const services = createFakeServices([work, other])
    const ctx = createFakeContext(services)
    const snapshots = new SnapshotStore()

    const filtered = await runCleanCommand(ctx, snapshots, results, invocation('list --project dsh'))
    assert.match(textOf(filtered), /共 1 个/u)
    assert.match(textOf(filtered), /D:\\WorkSpace\\dsh/u)

    const byPrefix = await runCleanCommand(ctx, snapshots, results, invocation('abc12345'))
    assert.equal(byPrefix.kind, 'success')
    assert.equal(existsSync(work.dir), false)
    assert.equal(existsSync(other.dir), true)
  } finally {
    await cleanup()
  }
})

test('id 前缀歧义时报错', async () => {
  const { root, cleanup } = await withTempRoot()
  try {
    const first = await createSessionFixture(root, { id: 'abcdef00-0000-4000-8000-000000000001' })
    const second = await createSessionFixture(root, { id: 'abcdef11-0000-4000-8000-000000000002' })
    const services = createFakeServices([first, second])
    const ctx = createFakeContext(services)
    const snapshots = new SnapshotStore()

    const result = await runCleanCommand(ctx, snapshots, results, invocation('abcdef'))
    assert.equal(result.kind, 'error')
    assert.match(textOf(result), /匹配到 2 个会话/u)
    assert.equal(existsSync(first.dir), true)
  } finally {
    await cleanup()
  }
})

test('--ids 精确删除并登记面板结果', async () => {
  const { root, cleanup } = await withTempRoot()
  try {
    const first = await createSessionFixture(root, { id: 'alpha-0001', title: '甲', mtime: NOW })
    const second = await createSessionFixture(root, { id: 'beta-0002', title: '乙', mtime: NOW - 1000 })
    const keep = await createSessionFixture(root, { id: 'gamma-0003', title: '丙', mtime: NOW - 2000 })
    const services = createFakeServices([first, second, keep])
    const ctx = createFakeContext(services)
    const snapshots = new SnapshotStore()
    const token = `token${Date.now().toString(36)}`

    const result = await runCleanCommand(
      ctx,
      snapshots,
      results,
      invocation(`--ids ${first.id},${second.id} --yes --request ${token}`),
    )
    assert.equal(result.kind, 'success')
    assert.equal(existsSync(first.dir), false)
    assert.equal(existsSync(second.dir), false)
    assert.equal(existsSync(keep.dir), true)

    const summary = results.get(token)
    assert.ok(summary !== undefined)
    assert.equal(summary?.deleted.length, 2)
    assert.equal(summary?.failed.length, 0)
    assert.equal(summary?.bytes, 2048)
  } finally {
    await cleanup()
  }
})

test('--ids 中已不存在的会话被跳过并记录', async () => {
  const { root, cleanup } = await withTempRoot()
  try {
    const only = await createSessionFixture(root, { id: 'only-0001', title: '唯一' })
    const services = createFakeServices([only])
    const ctx = createFakeContext(services)
    const snapshots = new SnapshotStore()
    const token = `token${Date.now().toString(36)}x`

    const result = await runCleanCommand(
      ctx,
      snapshots,
      results,
      invocation(`--ids ${only.id},gone-9999 --yes --request ${token}`),
    )
    assert.equal(result.kind, 'success')
    assert.match(textOf(result), /已永久删除 1 个会话/u)
    assert.match(textOf(result), /已不存在/u)
    assert.equal(existsSync(only.dir), false)
  } finally {
    await cleanup()
  }
})



