import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import {
  createCustomPrompt,
  EMPTY_PROMPT_STATE,
  loadPromptStateSync,
  parsePromptState,
  promptStatePath,
  readPromptState,
  writePromptState,
} from '../src/prompt/state.ts'

test('promptStatePath 落在 DSH_HOME/.dsh-extend/prompts.json', () => {
  assert.equal(
    promptStatePath({ DSH_HOME: 'C:\\Users\\demo\\.dsh' }),
    join('C:\\Users\\demo\\.dsh', '.dsh-extend', 'prompts.json'),
  )
})

test('parsePromptState 接受合法状态', () => {
  const state = parsePromptState(JSON.stringify({
    version: 1,
    disabled: ['a', 'a'],
    replacements: { b: 'text' },
    custom: [{ id: 'c1', title: '标题', text: '正文', enabled: false }],
  }))
  assert.deepEqual(state, {
    version: 1,
    disabled: ['a'],
    replacements: { b: 'text' },
    custom: [{ id: 'c1', title: '标题', text: '正文', enabled: false }],
  })
})

test('parsePromptState 拒绝坏版本、坏字段与重复 id', () => {
  assert.equal(parsePromptState('not json'), undefined)
  assert.equal(parsePromptState('{"version":2}'), undefined)
  assert.equal(parsePromptState('{"version":1,"disabled":"a"}'), undefined)
  assert.equal(parsePromptState('{"version":1,"replacements":{"a":1}}'), undefined)
  assert.equal(parsePromptState(JSON.stringify({
    version: 1,
    custom: [
      { id: 'dup', title: 'a', text: 'x' },
      { id: 'dup', title: 'b', text: 'y' },
    ],
  })), undefined)
})

test('createCustomPrompt 生成短 id 并兜底标题', () => {
  const item = createCustomPrompt('  ', '正文')
  assert.equal(item.title, '未命名')
  assert.equal(item.enabled, true)
  assert.match(item.id, /^[0-9a-f]{8}$/u)
})

test('读写状态文件并生成 .bak', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-extend-prompt-'))
  try {
    const file = join(root, 'prompts.json')
    const first = { ...EMPTY_PROMPT_STATE, replacements: { a: 'one' } }
    await writePromptState(first, file)
    assert.deepEqual(await readPromptState(file), first)
    const second = { ...first, replacements: { a: 'two' } }
    await writePromptState(second, file)
    assert.deepEqual(await readPromptState(file), second)
    assert.equal(await readFile(`${file}.bak`, 'utf8').then(text => text.includes('one')), true)
    assert.deepEqual(loadPromptStateSync(file), second)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('读取缺失或损坏文件时回落空状态', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-extend-prompt-'))
  try {
    assert.deepEqual(await readPromptState(join(root, 'missing.json')), EMPTY_PROMPT_STATE)
    const bad = join(root, 'bad.json')
    await writePromptState({ ...EMPTY_PROMPT_STATE }, bad)
    await rm(bad)
    assert.deepEqual(loadPromptStateSync(bad), EMPTY_PROMPT_STATE)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
