/**
 * Scanner unit tests — runnable with Node's native TypeScript support:
 * `node --test tests/` (Node >= 22.19 with type stripping).
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { scanProject } from '../src/init/scan.ts'

/** Build a small fixture repository and return its root. */
async function fixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'dsh-init-'))
  await mkdir(join(root, 'src', 'nested'), { recursive: true })
  await mkdir(join(root, 'node_modules', 'pkg'), { recursive: true })
  await mkdir(join(root, '.git'), { recursive: true })
  await mkdir(join(root, '.npm-cache', 'ab', 'cd'), { recursive: true })
  await writeFile(join(root, 'README.md'), '# Demo\n\nA demo repository for the scanner test.\n')
  await writeFile(join(root, 'package.json'), JSON.stringify({
    name: 'demo',
    description: 'demo package',
    scripts: { build: 'tsc', test: 'vitest run' },
    dependencies: { demo: '^1.0.0' },
  }, null, 2))
  await writeFile(join(root, 'tsconfig.json'), JSON.stringify({ compilerOptions: { strict: true } }))
  await writeFile(join(root, 'AGENTS.md'), 'existing rules\n')
  await writeFile(join(root, 'src', 'index.ts'), 'export const x = 1\n')
  await writeFile(join(root, 'src', 'nested', 'deep.ts'), 'export const y = 2\n')
  await writeFile(join(root, 'node_modules', 'pkg', 'index.js'), 'ignored\n')
  await writeFile(join(root, '.git', 'config'), 'ignored\n')
  await writeFile(join(root, '.npm-cache', 'ab', 'cd', 'hash'), 'ignored\n')
  return root
}

test('tree ignores heavy/vendored directories and keeps source paths', async () => {
  const root = await fixture()
  const result = await scanProject(root)
  assert.ok(result.tree.includes('src/'))
  assert.ok(result.tree.includes('nested/'))
  assert.ok(!result.tree.includes('node_modules'))
  assert.ok(!result.tree.includes('.git'))
  assert.ok(!result.tree.includes('.npm-cache'))
})

test('collects README, package.json digest, configs, and existing AGENTS.md', async () => {
  const root = await fixture()
  const result = await scanProject(root)
  assert.match(result.readme, /# Demo/)
  assert.match(result.packageJson, /"name": "demo"/)
  assert.match(result.packageJson, /"build": "tsc"/)
  assert.match(result.configs, /### tsconfig\.json/)
  assert.match(result.existingAgents, /existing rules/)
  assert.match(result.summary, /Repository scan summary/)
})

test('custom ignore list wins over defaults', async () => {
  const root = await fixture()
  const result = await scanProject(root, { ignore: ['src'] })
  assert.ok(!result.tree.includes('src/'))
})

test('summary honors the byte budget and reports truncation', async () => {
  const root = await fixture()
  const result = await scanProject(root, { maxSummaryBytes: 400 })
  assert.equal(result.truncated, true)
  assert.ok(Buffer.byteLength(result.summary, 'utf8') <= 400)
})

test('multibyte README truncation stays valid UTF-8 and fits the budget', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-init-'))
  await writeFile(join(root, 'README.md'), '# 演示\n\n'.repeat(2000))
  const result = await scanProject(root, { maxReadmeBytes: 1000 })
  assert.equal(result.truncated, true)
  assert.ok(Buffer.byteLength(result.readme, 'utf8') <= 1000)
  assert.doesNotThrow(() => Buffer.from(result.readme, 'utf8').toString('utf8'))
})

test('missing README and AGENTS.md produce empty sections, not errors', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsh-init-'))
  await writeFile(join(root, 'package.json'), '{}\n')
  const result = await scanProject(root)
  assert.equal(result.readme, '')
  assert.equal(result.existingAgents, '')
  assert.ok(result.summary.includes('Directory tree'))
})

