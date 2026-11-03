/** WSL 9P 辅助：路径判定与直接写/替换。 */
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  editTargetFile,
  isWslTarget,
  writeTargetFile,
} from '../src/wsl/tools.ts'

/** 临时目录 + 清理。 */
async function withTemp(): Promise<{ root: string; cleanup: () => Promise<void> }> {
  const root = await mkdtemp(join(tmpdir(), 'dsh-extend-wsl-'))
  return { root, cleanup: async () => { await rm(root, { recursive: true, force: true }) } }
}

test('isWslTarget 识别 WSL 的 9P UNC 路径', () => {
  assert.equal(isWslTarget('\\\\wsl.localhost\\Ubuntu\\home\\user\\ws'), true)
  assert.equal(isWslTarget('\\\\wsl$\\Ubuntu\\home\\user'), true)
  assert.equal(isWslTarget('\\\\WSL.LOCALHOST\\Ubuntu\\home'), true)
  assert.equal(isWslTarget('\\\\?\\UNC\\wsl.localhost\\Ubuntu\\home'), true)
  assert.equal(isWslTarget('C:\\Users\\84983\\file.txt'), false)
  assert.equal(isWslTarget('\\\\server\\share\\file.txt'), false)
  assert.equal(isWslTarget('\\\\wsl.localhost'), false)
})

test('writeTargetFile 直接写入并自动建父目录', async () => {
  const { root, cleanup } = await withTemp()
  try {
    const target = join(root, 'nested', 'a.txt')
    const bytes = await writeTargetFile(target, '中文\n')
    assert.equal(await readFile(target, 'utf8'), '中文\n')
    assert.equal(bytes, Buffer.byteLength('中文\n', 'utf8'))
    await writeTargetFile(target, 'replaced')
    assert.equal(await readFile(target, 'utf8'), 'replaced')
  } finally {
    await cleanup()
  }
})

test('writeTargetFile 响应取消信号', async () => {
  const { root, cleanup } = await withTemp()
  try {
    await assert.rejects(
      writeTargetFile(join(root, 'a.txt'), 'x', AbortSignal.abort()),
      (error: unknown) => (error as { name?: string }).name === 'AbortError',
    )
  } finally {
    await cleanup()
  }
})

test('editTargetFile 替换唯一匹配', async () => {
  const { root, cleanup } = await withTemp()
  try {
    const target = join(root, 'a.txt')
    await writeFile(target, 'hello world', 'utf8')
    const outcome = await editTargetFile(target, 'world', 'WSL', false)
    assert.equal(outcome.replacements, 1)
    assert.equal(await readFile(target, 'utf8'), 'hello WSL')
  } finally {
    await cleanup()
  }
})

test('editTargetFile replace_all 替换全部匹配', async () => {
  const { root, cleanup } = await withTemp()
  try {
    const target = join(root, 'a.txt')
    await writeFile(target, 'a a a', 'utf8')
    const outcome = await editTargetFile(target, 'a', 'b', true)
    assert.equal(outcome.replacements, 3)
    assert.equal(await readFile(target, 'utf8'), 'b b b')
  } finally {
    await cleanup()
  }
})

test('editTargetFile 拒绝空/缺失/多重匹配', async () => {
  const { root, cleanup } = await withTemp()
  try {
    const target = join(root, 'a.txt')
    await writeFile(target, 'x x', 'utf8')
    await assert.rejects(editTargetFile(target, '', 'y', false), /old_string must be a non-empty string/u)
    await assert.rejects(editTargetFile(target, 'missing', 'y', false), /was not found/u)
    await assert.rejects(editTargetFile(target, 'x', 'y', false), /occurs 2 times/u)
  } finally {
    await cleanup()
  }
})

test('editTargetFile 不解释替换文本里的 $', async () => {
  const { root, cleanup } = await withTemp()
  try {
    const target = join(root, 'a.txt')
    await writeFile(target, 'price: a', 'utf8')
    await editTargetFile(target, 'a', '$&', false)
    assert.equal(await readFile(target, 'utf8'), 'price: $&')
  } finally {
    await cleanup()
  }
})
