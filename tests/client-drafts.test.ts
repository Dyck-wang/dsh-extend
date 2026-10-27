import assert from 'node:assert/strict'
import { test } from 'node:test'
import { clearRebootDrafts, isRebootDraft, type DraftStorage } from '../src/client/drafts.ts'

/** 内存 localStorage 假实现。 */
class FakeStorage implements DraftStorage {
  private readonly map = new Map<string, string>()

  get length(): number {
    return this.map.size
  }

  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null
  }

  getItem(key: string): string | null {
    return this.map.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value)
  }

  removeItem(key: string): void {
    this.map.delete(key)
  }
}

test('isRebootDraft 只匹配 /reboot 命令本身', () => {
  assert.equal(isRebootDraft('/reboot'), true)
  assert.equal(isRebootDraft('/reboot --yes'), true)
  assert.equal(isRebootDraft('  /reboot --check  '), true)
  assert.equal(isRebootDraft('/reboots'), false)
  assert.equal(isRebootDraft('请 /reboot'), false)
  assert.equal(isRebootDraft(''), false)
})

test('clearRebootDrafts 删除 /reboot 草稿并返回会话 id', () => {
  const storage = new FakeStorage()
  storage.setItem('dsh.conversation.session-a', JSON.stringify({ draft: { text: '/reboot --yes', references: [] }, view: null }))
  storage.setItem('dsh.conversation.session-b', JSON.stringify({ draft: { text: '普通草稿' } }))
  storage.setItem('dsh.conversation.session-c', JSON.stringify({ draft: '/reboot' }))
  storage.setItem('unrelated.key', JSON.stringify({ draft: { text: '/reboot' } }))

  const cleared = clearRebootDrafts(storage)
  assert.deepEqual(cleared.sort(), ['session-a', 'session-c'])
  assert.equal(storage.getItem('dsh.conversation.session-a'), null)
  assert.equal(storage.getItem('dsh.conversation.session-c'), null)
  assert.notEqual(storage.getItem('dsh.conversation.session-b'), null)
  assert.notEqual(storage.getItem('unrelated.key'), null)
})

test('clearRebootDrafts 忽略损坏的 JSON 与非草稿形状', () => {
  const storage = new FakeStorage()
  storage.setItem('dsh.conversation.session-broken', '{oops')
  storage.setItem('dsh.conversation.session-empty', JSON.stringify({ draft: { text: '' } }))
  assert.deepEqual(clearRebootDrafts(storage), [])
  assert.notEqual(storage.getItem('dsh.conversation.session-broken'), null)
})
