import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatBytes, formatDeleteReport, formatInventory, formatPreview, truncate } from '../src/clean/format.ts'
import type { SessionEntry } from '../src/clean/types.ts'

function entry(overrides: Partial<SessionEntry> & { id: string }): SessionEntry {
  return {
    createdAt: 0,
    lastActivity: 0,
    bytes: 1024,
    live: false,
    subagent: false,
    ...overrides,
  }
}

test('formatBytes', () => {
  assert.equal(formatBytes(0), '0 B')
  assert.equal(formatBytes(512), '512 B')
  assert.equal(formatBytes(2048), '2.0 KB')
  assert.equal(formatBytes(2 * 1024 * 1024), '2.0 MB')
})

test('truncate 按码点截断', () => {
  assert.equal(truncate('abcdef', 4), 'abc…')
  assert.equal(truncate('中文中文', 3), '中文…')
  assert.equal(truncate('短', 10), '短')
})

test('清单按项目分组并连续编号', () => {
  const entries = [
    entry({ id: 'a', cwd: 'D:\\A', lastActivity: 3000, title: 'A1' }),
    entry({ id: 'b', cwd: 'D:\\A', lastActivity: 2000, title: 'A2' }),
    entry({ id: 'c', cwd: 'D:\\B', lastActivity: 1000, title: 'B1' }),
  ]
  const result = formatInventory(entries, { limit: 0, totalCount: 3, totalBytes: 3072, liveCount: 0 })
  assert.equal(result.displayed.length, 3)
  assert.deepEqual(result.displayed.map(item => item.id), ['a', 'b', 'c'])
  assert.match(result.text, /共 3 个 · 3\.0 KB/u)
  assert.match(result.text, /▌D:\\A · 2 个/u)
  assert.match(result.text, /1 {2}.*A1/u)
  assert.match(result.text, /3 {2}.*B1/u)
})

test('清单截断时页脚提示', () => {
  const entries = [entry({ id: 'a', lastActivity: 2 }), entry({ id: 'b', lastActivity: 1 })]
  const result = formatInventory(entries, {
    limit: 0, totalCount: 5, totalBytes: 2048, liveCount: 1, hiddenCount: 3,
  })
  assert.match(result.text, /仅显示前 2 条（共 5 条）/u)
  assert.match(result.text, /使用中 1 个/u)
})

test('使用中标记', () => {
  const result = formatInventory([entry({ id: 'a', live: true })], {
    limit: 0, totalCount: 1, totalBytes: 1024, liveCount: 1,
  })
  assert.match(result.text, /\[使用中\]/u)
})

test('空清单', () => {
  const result = formatInventory([], { limit: 0, totalCount: 0, totalBytes: 0, liveCount: 0 })
  assert.match(result.text, /没有历史会话/u)
  assert.deepEqual(result.displayed, [])
})

test('删除报告与预览', () => {
  const deleted = [entry({ id: 'a', title: '标题一' }), entry({ id: 'b' })]
  const report = formatDeleteReport(deleted, 2048, [{ entry: entry({ id: 'c' }), reason: '占用中' }])
  assert.match(report, /已永久删除 2 个会话，释放 2\.0 KB/u)
  assert.match(report, /失败 1 个/u)

  const preview = formatPreview([entry({ id: 'a', title: '旧会话' })], '30d', false)
  assert.match(preview, /将永久删除 1 个会话/u)
  assert.match(preview, /--older-than 30d --yes/u)
})
