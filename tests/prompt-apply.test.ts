import assert from 'node:assert/strict'
import { test } from 'node:test'
import { applyPromptOverrides, currentSectionText, summarizeAssembled } from '../src/prompt/apply.ts'
import {
  applyPromptChange,
  formatPromptList,
  parseChange,
  parsePromptCommand,
  type PromptListPayload,
} from '../src/prompt/index.ts'
import { EMPTY_PROMPT_STATE, type PromptState } from '../src/prompt/state.ts'

function presentation() {
  return {
    sections: [
      { name: 'a', text: 'A' },
      { name: 'b', text: 'B', interpolate: true },
    ],
  }
}

test('applyPromptOverrides 过滤禁用段、替换文本并追加自定义段', () => {
  const state: PromptState = {
    version: 1,
    disabled: ['a'],
    replacements: { b: 'B2' },
    custom: [
      { id: 'c1', title: '一', text: 'C1', enabled: true },
      { id: 'c2', title: '二', text: 'C2', enabled: false },
    ],
  }
  const result = applyPromptOverrides(presentation(), state)
  assert.deepEqual(result.sections, [
    { name: 'b', text: 'B2', interpolate: false },
    { name: 'dsh-extend:custom:c1', text: 'C1', interpolate: false },
  ])
})

test('applyPromptOverrides 无覆盖时保持原数组', () => {
  const input = presentation()
  const result = applyPromptOverrides(input, EMPTY_PROMPT_STATE)
  assert.equal(result, input)
  assert.deepEqual(result.sections, input.sections)
})

test('summarizeAssembled 标记覆盖与禁用', () => {
  const state: PromptState = { ...EMPTY_PROMPT_STATE, disabled: ['b'], replacements: { a: 'x' } }
  assert.deepEqual(summarizeAssembled(presentation().sections, state), [
    { name: 'a', size: 1, overridden: true, disabled: false, text: 'x' },
    { name: 'b', size: 1, overridden: false, disabled: true, text: 'B' },
  ])
})

test('currentSectionText 优先覆盖文本', () => {
  const state: PromptState = { ...EMPTY_PROMPT_STATE, replacements: { a: 'new' } }
  assert.equal(currentSectionText('a', 'old', state), 'new')
  assert.equal(currentSectionText('b', 'old', state), 'old')
})

test('applyPromptChange 覆盖、禁用、还原与自定义增删改', () => {
  const base: PromptState = { ...EMPTY_PROMPT_STATE }
  const set = applyPromptChange(base, { action: 'set', name: 'a', text: 'X' })
  assert.ok('state' in set)
  if (!('state' in set)) return
  assert.equal(set.state.replacements.a, 'X')

  const disable = applyPromptChange(set.state, { action: 'disable', name: 'a' })
  assert.ok('state' in disable)
  if (!('state' in disable)) return
  assert.deepEqual(disable.state.disabled, ['a'])

  const reset = applyPromptChange(disable.state, { action: 'reset', name: 'a' })
  assert.ok('state' in reset)
  if (!('state' in reset)) return
  assert.deepEqual(reset.state.replacements, {})
  assert.deepEqual(reset.state.disabled, [])

  const add = applyPromptChange(base, { action: 'add', title: '标题', text: '正文' })
  assert.ok('state' in add)
  if (!('state' in add)) return
  assert.equal(add.state.custom.length, 1)
  const id = add.state.custom[0]?.id ?? ''
  assert.match(id, /^[0-9a-f]{8}$/u)

  const update = applyPromptChange(add.state, { action: 'update', id, title: '新标题', text: '新正文' })
  assert.ok('state' in update)
  if (!('state' in update)) return
  assert.equal(update.state.custom[0]?.title, '新标题')
  assert.equal(update.state.custom[0]?.text, '新正文')

  const toggle = applyPromptChange(update.state, { action: 'toggle', id, enabled: false })
  assert.ok('state' in toggle)
  if (!('state' in toggle)) return
  assert.equal(toggle.state.custom[0]?.enabled, false)

  const remove = applyPromptChange(toggle.state, { action: 'remove', id })
  assert.ok('state' in remove)
  if (!('state' in remove)) return
  assert.equal(remove.state.custom.length, 0)
})

test('applyPromptChange 拒绝空文本与不存在的自定义项', () => {
  assert.ok('error' in applyPromptChange(EMPTY_PROMPT_STATE, { action: 'add', title: 't', text: '  ' }))
  assert.ok('error' in applyPromptChange(EMPTY_PROMPT_STATE, { action: 'update', id: 'nope', text: 'x' }))
  assert.ok('error' in applyPromptChange(EMPTY_PROMPT_STATE, { action: 'remove', id: 'nope' }))
})

test('parsePromptCommand 解析子命令', () => {
  assert.equal(parsePromptCommand('').action, 'list')
  assert.equal(parsePromptCommand('help').action, 'help')
  assert.equal(parsePromptCommand('show a:b').name, 'a:b')
  assert.deepEqual(parsePromptCommand('set a hello world').text, 'hello world')
  assert.equal(parsePromptCommand('disable a').action, 'disable')
  assert.equal(parsePromptCommand('reset --all').name, '--all')
  assert.equal(parsePromptCommand('add 标题 正文').text, '正文')
  assert.equal(parsePromptCommand('remove c1').id, 'c1')
  assert.equal(parsePromptCommand('on c1').action, 'on')
  assert.ok(parsePromptCommand('nope').errors.length > 0)
  assert.ok(parsePromptCommand('set a').errors.length > 0)
})

test('parseChange 解析保存请求', () => {
  assert.deepEqual(parseChange({ action: 'set', name: 'a', text: 'x' }), { action: 'set', name: 'a', text: 'x' })
  assert.deepEqual(parseChange({ action: 'add', title: 't', text: 'x' }), { action: 'add', title: 't', text: 'x' })
  assert.deepEqual(parseChange({ action: 'toggle', id: 'c', enabled: true }), { action: 'toggle', id: 'c', enabled: true })
  assert.equal(typeof parseChange({ action: 'unknown' }), 'string')
  assert.equal(typeof parseChange({ action: 'set', name: 'a' }), 'string')
})

test('formatPromptList 汇总已组装段与自定义项', () => {
  const payload: PromptListPayload = {
    ok: true,
    assembled: [
      { name: 'a', size: 10, overridden: true, disabled: false, text: 'A' },
      { name: 'b', size: 20, overridden: false, disabled: true, text: 'B' },
    ],
    custom: [{ id: 'c1', title: '标题', text: '正文', enabled: false }],
    tools: 3,
    contexts: 2,
  }
  const text = formatPromptList(payload)
  assert.match(text, /已组装 2 段/u)
  assert.match(text, /a · 10 B · 已修改/u)
  assert.match(text, /b · 20 B · 已禁用/u)
  assert.match(text, /标题 \(c1\)/u)
  assert.match(text, /停用/u)
})



