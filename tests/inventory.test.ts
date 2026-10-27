import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  expandDescendants,
  matchesProjectKeyword,
  selectBatch,
} from '../src/clean/inventory.ts'
import { dirFromLocation, encodeSegment, locateSessionDir, projectKey } from '../src/clean/layout.ts'
import { collectEntries } from '../src/clean/inventory.ts'
import { createFakeContext, createFakeServices, createSessionFixture, withTempRoot } from './helpers.ts'
import type { SessionEntry } from '../src/clean/types.ts'

function entry(overrides: Partial<SessionEntry> & { id: string }): SessionEntry {
  return {
    createdAt: 0,
    lastActivity: 0,
    bytes: 0,
    live: false,
    subagent: false,
    ...overrides,
  }
}

test('dirFromLocation 只接受当前 JSONL 后端布局', () => {
  assert.equal(
    dirFromLocation('D:\\home\\sessions\\--D-WorkSpace-demo--\\a\\session.v4.jsonl.zstd'),
    'D:\\home\\sessions\\--D-WorkSpace-demo--\\a',
  )
  assert.equal(
    dirFromLocation('/home/sessions/_no-cwd/b/session.v4.jsonl.zstd'),
    '/home/sessions/_no-cwd/b',
  )
  assert.equal(dirFromLocation('/tmp/sessions/c/log.jsonl'), undefined)
})

test('projectKey 与 encodeSegment 复刻后端规则', () => {
  assert.equal(projectKey('D:\\WorkSpace\\dsh'), '--D-WorkSpace-dsh--')
  assert.equal(
    projectKey('C:\\Users\\84983\\Documents\\deepseek-harness\\默认工作区'),
    '--C-Users-84983-Documents-deepseek-harness-~9ED8~8BA4~5DE5~4F5C~533A--',
  )
  assert.equal(encodeSegment('session-33c61313-ddd9-422e'), 'session-33c61313-ddd9-422e')
  assert.equal(encodeSegment('a~b'), 'a~007Eb')
  assert.equal(encodeSegment('..'), '~002E~002E')
})

test('locateSessionDir 优先按 cwd 命中，失配时按 id 搜索', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-extend-layout-'))
  try {
    const directDir = join(root, '--D-WorkSpace-demo--', 'session-aaa')
    await mkdir(directDir, { recursive: true })
    await writeFile(join(directDir, 'session.v4.jsonl.zstd'), 'x')

    const direct = await locateSessionDir(root, {
      id: 'session-aaa', createdAt: 0, isSeeded: false, cwd: 'D:\\WorkSpace\\demo',
    })
    assert.equal(direct?.dir, directDir)
    assert.equal(direct?.size, 1)

    const movedDir = join(root, '--D-Other--', 'session-bbb')
    await mkdir(movedDir, { recursive: true })
    await writeFile(join(movedDir, 'session.v3.jsonl.zstd'), 'yy')

    const moved = await locateSessionDir(root, {
      id: 'session-bbb', createdAt: 0, isSeeded: false, cwd: 'D:\\WorkSpace\\demo',
    })
    assert.equal(moved?.dir, movedDir)
    assert.equal(moved?.size, 2)

    const missing = await locateSessionDir(root, {
      id: 'session-ccc', createdAt: 0, isSeeded: false, cwd: 'D:\\WorkSpace\\demo',
    })
    assert.equal(missing, undefined)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('selectBatch 排除 live 与子代理，并支持时间/项目', () => {
  const now = 1_000_000_000_000
  const entries = [
    entry({ id: 'old', lastActivity: now - 40 * 86_400_000 }),
    entry({ id: 'new', lastActivity: now - 86_400_000 }),
    entry({ id: 'live', lastActivity: now - 40 * 86_400_000, live: true }),
    entry({ id: 'sub', lastActivity: now - 40 * 86_400_000, subagent: true }),
    entry({ id: 'other', lastActivity: now - 40 * 86_400_000, cwd: 'D:\\Other' }),
  ]
  const older = selectBatch(entries, { olderThanMs: 30 * 86_400_000 }, now)
  assert.deepEqual(older.map(item => item.id), ['old', 'other'])

  const filtered = selectBatch(entries, { olderThanMs: 30 * 86_400_000, project: 'other' }, now)
  assert.deepEqual(filtered.map(item => item.id), ['other'])

  const empty = selectBatch([
    entry({ id: 'blank', blank: true }),
    entry({ id: 'used', blank: false }),
  ], { empty: true }, now)
  assert.deepEqual(empty.map(item => item.id), ['blank'])
})

test('matchesProjectKeyword 忽略大小写与斜杠差异', () => {
  const item = entry({ id: 'a', cwd: 'D:\\WorkSpace\\DSH' })
  assert.equal(matchesProjectKeyword(item, 'workspace/dsh'), true)
  assert.equal(matchesProjectKeyword(item, 'Nowhere'), false)
  assert.equal(matchesProjectKeyword(entry({ id: 'b' }), 'workspace'), false)
})

test('expandDescendants 递归带上子代理', () => {
  const entries = [
    entry({ id: 'p' }),
    entry({ id: 'c1', parentId: 'p', subagent: true }),
    entry({ id: 'c2', parentId: 'c1', subagent: true }),
    entry({ id: 'x' }),
  ]
  const expanded = expandDescendants([entries[0] as SessionEntry], entries)
  assert.deepEqual(expanded.map(item => item.id).sort(), ['c1', 'c2', 'p'])
})


test('后端不返回 location 时按目录规则定位（桌面端构建）', async () => {
  const { root, cleanup } = await withTempRoot()
  try {
    const fixture = await createSessionFixture(root, {
      id: 'session-locate-1', cwd: 'D:\\WorkSpace\\demo', mtime: Date.now() - 86_400_000, size: 321,
    })
    const services = createFakeServices([fixture], [], { root, includeLocation: false })
    const ctx = createFakeContext(services)
    const entries = await collectEntries(ctx)
    assert.equal(entries.length, 1)
    assert.equal(entries[0]?.dir, fixture.dir)
    assert.equal(entries[0]?.bytes, 321)
    assert.ok((entries[0]?.lastActivity ?? 0) > 0)
  } finally {
    await cleanup()
  }
})
