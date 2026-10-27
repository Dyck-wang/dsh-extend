/**
 * Task-message and scan-root resolution tests — runnable with Node's native
 * TypeScript support: `node --test tests/`, or directly `node tests/prompt.spec.ts`.
 *
 * Regression targets:
 * - The steered task message must pin the absolute AGENTS.md target to the
 *   scanned root (the agent used to infer "repository root" itself and wrote
 *   into a nested Git repository / subdirectory).
 * - The scan root must default to the session workspace root, not
 *   `process.cwd()` (the dsh process start directory may be a subdirectory).
 * - The steered message must carry a producer-owned source kind: session
 *   format V4 rejects the retired `{ kind: 'plugin', plugin: '<name>' }`
 *   wrapper at message admission, which failed the whole turn.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { resolveScanRoot } from '../src/init/index.ts'
import { buildInitMessage, buildInitTaskText } from '../src/init/prompt.ts'
import type { ScanResult } from '../src/init/scan.ts'

/** Minimal scan result carrying only the fields the task builder needs. */
function scanOf(root: string): ScanResult {
  return {
    root,
    tree: '',
    readme: '',
    packageJson: '',
    configs: '',
    existingAgents: '',
    summary: '--- summary ---',
    truncated: false,
  }
}

test('task text pins the absolute AGENTS.md target at the scanned root', () => {
  const root = resolve(tmpdir(), 'dsh-init-target-root')
  const text = buildInitTaskText(scanOf(root), '')
  assert.ok(text.includes(join(root, 'AGENTS.md')), 'task text must name the exact target file path')
  assert.match(text, /never/i, 'task text must forbid writing to a subdirectory')
  assert.match(text, /subdirectory|nested git/i)
})

test('task text keeps a nested Git repository out of the target', () => {
  const workspace = resolve(tmpdir(), 'dsh-init-ws')
  const nested = join(workspace, 'deepseek-harness')
  const text = buildInitTaskText(scanOf(workspace), '')
  assert.ok(text.includes(join(workspace, 'AGENTS.md')))
  assert.ok(!text.includes(join(nested, 'AGENTS.md')))
})

test('scan root prefers config.root over the session workspace root', () => {
  const root = resolve(tmpdir(), 'dsh-init-cfg-root')
  assert.equal(resolveScanRoot(root, resolve('/session'), resolve('/service'), resolve('/cwd')), root)
})

test('scan root uses the session workspace root when config.root is absent', () => {
  const sessionRoot = resolve(tmpdir(), 'dsh-init-session-root')
  assert.equal(resolveScanRoot(undefined, sessionRoot, resolve('/service'), resolve('/cwd')), sessionRoot)
})

test('scan root falls back from session cwd to the sandbox-policy workspace root', () => {
  const serviceRoot = resolve(tmpdir(), 'dsh-init-service-root')
  assert.equal(resolveScanRoot(undefined, undefined, serviceRoot, resolve('/cwd')), serviceRoot)
})

test('scan root falls back to process.cwd() only as the last resort', () => {
  const cwd = resolve(process.cwd())
  assert.equal(resolveScanRoot(undefined, undefined, undefined, cwd), cwd)
})

test('steered message carries a producer-owned source kind', () => {
  const message = buildInitMessage(scanOf(resolve(tmpdir(), 'dsh-init-source')), '')
  assert.equal(message.role, 'user')
  assert.equal(message.source.kind, 'dsh-extend')
  assert.equal(message.source.form, 'notice')
  assert.ok(message.source.summary.length > 0, 'a notice form requires its one-line account')
  assert.ok(message.source.summary.length <= 120, 'the harness bounds notice summaries to 120 characters')
  assert.equal(Object.hasOwn(message.source, 'plugin'), false, 'the retired plugin wrapper must not come back')
})

test('steered message source passes the session format V4 admission predicates', () => {
  const { kind } = buildInitMessage(scanOf(resolve(tmpdir(), 'dsh-init-admission')), '').source
  // Mirrors assertV4MessageSources: a nonempty kind that is not the retired 'plugin' wrapper.
  assert.equal(typeof kind, 'string')
  assert.ok(kind.length > 0)
  assert.notEqual(kind, 'plugin')
})

test('the steered message is a frozen snapshot with a fresh identity', () => {
  const first = buildInitMessage(scanOf(resolve(tmpdir(), 'dsh-init-freeze')), '')
  const second = buildInitMessage(scanOf(resolve(tmpdir(), 'dsh-init-freeze')), '')
  assert.ok(Object.isFrozen(first), 'a published message must be immutable')
  assert.ok(Object.isFrozen(first.source), 'the source must be immutable too')
  assert.notEqual(first.id, second.id, 'each message needs its own identity')
})

