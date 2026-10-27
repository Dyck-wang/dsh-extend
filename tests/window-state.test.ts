import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { parseWindowState, readWindowState, windowStatePath } from '../src/window/state.ts'

test('windowStatePath 默认落在 DSH_HOME/.dsh-extend/window.json', () => {
  assert.equal(windowStatePath({ DSH_HOME: 'C:\\Users\\demo\\.dsh' }), join('C:\\Users\\demo\\.dsh', '.dsh-extend', 'window.json'))
})

test('parseWindowState 接受合法状态并取整', () => {
  const state = parseWindowState('{"left":179.4,"top":71.6,"width":1603.2,"height":895.8,"maximized":true,"savedAt":"2026-10-27T08:50:03Z"}')
  assert.deepEqual(state, {
    left: 179,
    top: 72,
    width: 1603,
    height: 896,
    maximized: true,
    savedAt: '2026-10-27T08:50:03Z',
  })
})

test('parseWindowState 拒绝无效 JSON 与缺失字段', () => {
  assert.equal(parseWindowState('not json'), undefined)
  assert.equal(parseWindowState('null'), undefined)
  assert.equal(parseWindowState('{"left":1,"top":2,"width":800}'), undefined)
  assert.equal(parseWindowState('{"left":"1","top":2,"width":800,"height":700}'), undefined)
})

test('parseWindowState 拒绝小于窗口最小尺寸或离谱的数值', () => {
  assert.equal(parseWindowState('{"left":0,"top":0,"width":400,"height":700}'), undefined)
  assert.equal(parseWindowState('{"left":0,"top":0,"width":800,"height":500}'), undefined)
  assert.equal(parseWindowState('{"left":0,"top":0,"width":20000,"height":700}'), undefined)
})

test('readWindowState 读取有效文件、忽略缺失文件', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-extend-window-'))
  try {
    const file = join(root, 'window.json')
    await writeFile(file, '{"left":10,"top":20,"width":900,"height":700,"maximized":false}')
    assert.deepEqual(await readWindowState(file), { left: 10, top: 20, width: 900, height: 700, maximized: false })
    assert.equal(await readWindowState(join(root, 'missing.json')), undefined)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
