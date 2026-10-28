import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { en, zh } from '../src/client/locales.ts'
import { de, es, fr, ja, pt, ru } from '../src/client/locales-more.ts'

/** 与 DSH 对齐的 8 种语言字典。 */
const dictionaries: Record<string, Record<string, string>> = { zh, en, ja, es, fr, de, ru, pt }
const base = Object.keys(zh).sort()
const root = dirname(dirname(fileURLToPath(import.meta.url)))

test('8 种语言字典的键集合一致', () => {
  for (const [id, dictionary] of Object.entries(dictionaries)) {
    assert.deepEqual(Object.keys(dictionary).sort(), base, `${id} 的键与中文不一致`)
  }
})

test('每种语言保留相同的占位符', () => {
  const placeholders = (value: string): string[] =>
    [...value.matchAll(/\{([a-zA-Z]+)\}/gu)].map(match => match[1] ?? '').sort()
  for (const key of base) {
    const expected = placeholders(zh[key] ?? '')
    for (const [id, dictionary] of Object.entries(dictionaries)) {
      assert.deepEqual(placeholders(dictionary[key] ?? ''), expected, `${id} 的 ${key} 占位符不一致`)
    }
  }
})

test('所有语言文案均非空', () => {
  for (const [id, dictionary] of Object.entries(dictionaries)) {
    for (const key of base) {
      assert.notEqual((dictionary[key] ?? '').trim(), '', `${id} 的 ${key} 为空`)
    }
  }
})

test('插件页 locale 文件齐全且可解析', async () => {
  for (const id of ['zh', 'en', 'ja', 'es', 'fr', 'de', 'ru', 'pt']) {
    const raw = await readFile(join(root, 'locale', `${id}.json`), 'utf8')
    const parsed = JSON.parse(raw) as { meta?: { title?: string; description?: string } }
    assert.ok(parsed.meta?.title, `${id}.json 缺少 title`)
    assert.ok(parsed.meta?.description, `${id}.json 缺少 description`)
  }
})
