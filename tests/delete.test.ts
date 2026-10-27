import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { after, test } from 'node:test'
import { deleteSessions } from '../src/clean/delete.ts'
import { collectEntries } from '../src/clean/inventory.ts'
import type { SessionEntry } from '../src/clean/types.ts'
import { createFakeContext, createFakeServices, createSessionFixture, isolateDshHome, withTempRoot } from './helpers.ts'

const restoreHome = await isolateDshHome()
after(() => restoreHome())

test('删除目录、摘除 workspace、广播 removed 并 flush', async () => {
  const { root, cleanup } = await withTempRoot()
  try {
    const alpha = await createSessionFixture(root, { id: 'alpha', title: '甲' })
    const beta = await createSessionFixture(root, { id: 'beta', title: '乙' })
    const services = createFakeServices([alpha, beta], ['beta'])
    const ctx = createFakeContext(services)
    const entries = await collectEntries(ctx)
    const target = entries.find(entry => entry.id === 'alpha')
    assert.ok(target !== undefined)

    const outcome = await deleteSessions(ctx, entries, [target])
    assert.equal(outcome.deleted.length, 1)
    assert.equal(outcome.bytes, 1024)
    assert.equal(existsSync(alpha.dir), false)
    assert.equal(existsSync(beta.dir), true)
    assert.deepEqual(services.detached, ['alpha'])
    assert.deepEqual(services.emitted.map(item => item.name), ['api-session/removed'])
    assert.deepEqual(services.emitted[0]?.args, ['alpha'])
    assert.equal(services.flushed.count, 1)
  } finally {
    await cleanup()
  }
})

test('使用中的会话被跳过', async () => {
  const { root, cleanup } = await withTempRoot()
  try {
    const alpha = await createSessionFixture(root, { id: 'alpha' })
    const services = createFakeServices([alpha], ['alpha'])
    const ctx = createFakeContext(services)
    const entries = await collectEntries(ctx)
    const target = entries[0] as SessionEntry

    const outcome = await deleteSessions(ctx, entries, [target])
    assert.equal(outcome.deleted.length, 0)
    assert.equal(outcome.failed.length, 1)
    assert.match(outcome.failed[0]?.reason ?? '', /使用中/u)
    assert.equal(existsSync(alpha.dir), true)
  } finally {
    await cleanup()
  }
})

test('子代理会话随父会话一起删除', async () => {
  const { root, cleanup } = await withTempRoot()
  try {
    const parent = await createSessionFixture(root, { id: 'parent' })
    const child = await createSessionFixture(root, {
      id: 'child', origin: 'subagent', parentSession: 'parent',
    })
    const services = createFakeServices([parent, child])
    const ctx = createFakeContext(services)
    const entries = await collectEntries(ctx)
    const target = entries.find(entry => entry.id === 'parent')
    assert.ok(target !== undefined)

    const outcome = await deleteSessions(ctx, entries, [target])
    assert.equal(outcome.deleted.length, 2)
    assert.equal(existsSync(parent.dir), false)
    assert.equal(existsSync(child.dir), false)
    assert.equal(services.emitted.length, 2)
  } finally {
    await cleanup()
  }
})

test('无法安全定位目录的条目被拒绝', async () => {
  const { root, cleanup } = await withTempRoot()
  try {
    const alpha = await createSessionFixture(root, { id: 'alpha' })
    const services = createFakeServices([alpha])
    const ctx = createFakeContext(services)
    const unsafe: SessionEntry = {
      id: 'unsafe',
      createdAt: 0,
      lastActivity: 0,
      bytes: 10,
      live: false,
      subagent: false,
    }
    const outcome = await deleteSessions(ctx, [unsafe], [unsafe])
    assert.equal(outcome.deleted.length, 0)
    assert.match(outcome.failed[0]?.reason ?? '', /无法安全定位/u)
  } finally {
    await cleanup()
  }
})

test('后端不返回 location 时仍能删除（桌面端构建）', async () => {
  const { root, cleanup } = await withTempRoot()
  try {
    const alpha = await createSessionFixture(root, { id: 'session-alpha-1', cwd: 'D:\\WorkSpace\\demo' })
    const services = createFakeServices([alpha], [], { root, includeLocation: false })
    const ctx = createFakeContext(services)
    const entries = await collectEntries(ctx)
    assert.equal(entries[0]?.dir, alpha.dir)
    const outcome = await deleteSessions(ctx, entries, [entries[0] as SessionEntry])
    assert.equal(outcome.deleted.length, 1)
    assert.equal(existsSync(alpha.dir), false)
  } finally {
    await cleanup()
  }
})
