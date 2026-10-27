import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { buildSessionScope, isCleanScope } from '../src/clean/scope.ts'
import { createFakeContext, createFakeServices, createSessionFixture, isolateDshHome, withTempRoot } from './helpers.ts'

const restoreHome = await isolateDshHome()
after(() => restoreHome())

const NOW = Date.now()
const DAY = 86_400_000

test('isCleanScope 只接受已知范围', () => {
  for (const scope of ['all', 'archived', '30d', '90d', 'empty']) assert.equal(isCleanScope(scope), true)
  for (const scope of ['1d', '7d', '', 'ALL']) assert.equal(isCleanScope(scope), false)
})

test('scope=all 列出全部顶层会话，使用中不可勾选', async () => {
  const { root, cleanup } = await withTempRoot()
  try {
    const fresh = await createSessionFixture(root, { id: 'fresh', title: '新', mtime: NOW })
    const old = await createSessionFixture(root, { id: 'old', title: '旧', mtime: NOW - 40 * DAY })
    const live = await createSessionFixture(root, { id: 'live', title: '在用', mtime: NOW - 40 * DAY })
    const child = await createSessionFixture(root, {
      id: 'child', parentSession: 'fresh', origin: 'subagent', mtime: NOW - 40 * DAY,
    })
    const services = createFakeServices([fresh, old, live, child], ['live'])
    const ctx = createFakeContext(services)

    const payload = await buildSessionScope(ctx, { scope: 'all', preselect: 'suggested' })
    assert.equal(payload.totals.count, 3)
    assert.equal(payload.totals.live, 1)
    assert.deepEqual(payload.rows.map(row => row.id).sort(), ['fresh', 'live', 'old'])
    assert.equal(payload.rows.find(row => row.id === 'live')?.suggested, false)
    assert.equal(payload.rows.find(row => row.id === 'old')?.suggested, true)
    assert.equal(payload.rows.find(row => row.id === 'fresh')?.title, '新')
  } finally {
    await cleanup()
  }
})

test('scope=archived 只列出已归档且不在使用中的会话，并标记空会话', async () => {
  const { root, cleanup } = await withTempRoot()
  try {
    const archived = await createSessionFixture(root, { id: 'archived-1', title: '归档一', mtime: NOW, events: [{ type: 'user/message', seq: 0 }] })
    const archivedOld = await createSessionFixture(root, { id: 'archived-2', title: '归档二', mtime: NOW - 10 * DAY })
    const plain = await createSessionFixture(root, { id: 'plain', title: '普通', mtime: NOW })
    const archivedLive = await createSessionFixture(root, { id: 'archived-live', mtime: NOW - 10 * DAY })
    const services = createFakeServices(
      [archived, archivedOld, plain, archivedLive],
      ['archived-live'],
      { archived: ['archived-1', 'archived-2', 'archived-live', 'gone-9999'] },
    )
    const ctx = createFakeContext(services)

    const payload = await buildSessionScope(ctx, { scope: 'archived', preselect: 'suggested' })
    assert.deepEqual(payload.rows.map(row => row.id).sort(), ['archived-1', 'archived-2'])
    assert.equal(payload.rows.every(row => row.suggested), true)
    assert.equal(payload.rows.find(row => row.id === 'archived-2')?.blank, true)
    assert.equal(payload.rows.find(row => row.id === 'archived-1')?.blank, false)
  } finally {
    await cleanup()
  }
})

test('scope=empty 只列出没有任何用户消息的会话', async () => {
  const { root, cleanup } = await withTempRoot()
  try {
    const blank = await createSessionFixture(root, { id: 'blank', mtime: NOW })
    const used = await createSessionFixture(root, { id: 'used', mtime: NOW, events: [{ type: 'user/message', seq: 0 }] })
    const services = createFakeServices([blank, used])
    const ctx = createFakeContext(services)

    const payload = await buildSessionScope(ctx, { scope: 'empty', preselect: 'suggested' })
    assert.deepEqual(payload.rows.map(row => row.id), ['blank'])
    assert.equal(payload.rows[0]?.blank, true)
  } finally {
    await cleanup()
  }
})

test('preselect=none 时全部不预选', async () => {
  const { root, cleanup } = await withTempRoot()
  try {
    const one = await createSessionFixture(root, { id: 'one', mtime: NOW })
    const two = await createSessionFixture(root, { id: 'two', mtime: NOW - 1000 })
    const services = createFakeServices([one, two])
    const ctx = createFakeContext(services)

    const payload = await buildSessionScope(ctx, { scope: 'all', preselect: 'none' })
    assert.equal(payload.rows.length, 2)
    assert.equal(payload.rows.every(row => !row.suggested), true)
  } finally {
    await cleanup()
  }
})
