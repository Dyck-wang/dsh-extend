import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseCleanInput, parseDuration } from '../src/clean/parse.ts'

test('parseDuration 接受天/时/分与裸数字', () => {
  assert.equal(parseDuration('30d'), 30 * 86_400_000)
  assert.equal(parseDuration('12h'), 12 * 3_600_000)
  assert.equal(parseDuration('90m'), 90 * 60_000)
  assert.equal(parseDuration('7'), 7 * 86_400_000)
  assert.equal(parseDuration('abc'), undefined)
  assert.equal(parseDuration('0d'), undefined)
  assert.equal(parseDuration('-3d'), undefined)
})

test('空输入是清单模式', () => {
  const args = parseCleanInput('')
  assert.equal(args.mode, 'list')
  assert.deepEqual(args.errors, [])
})

test('序号与 id 都是选择模式', () => {
  const byIndex = parseCleanInput('3 5,7')
  assert.equal(byIndex.mode, 'select')
  assert.deepEqual(byIndex.indices, [3, 5, 7])
  assert.deepEqual(byIndex.errors, [])

  const byId = parseCleanInput('0f3a9c1b-1111-2222')
  assert.equal(byId.mode, 'select')
  assert.deepEqual(byId.ids, ['0f3a9c1b-1111-2222'])
})

test('--yes 只属于批量模式', () => {
  const batch = parseCleanInput('--older-than 30d --yes')
  assert.equal(batch.mode, 'batch')
  assert.equal(batch.yes, true)
  assert.equal(batch.olderThanMs, 30 * 86_400_000)

  const misuse = parseCleanInput('--yes')
  assert.equal(misuse.errors.length, 1)
  assert.match(misuse.errors[0] ?? '', /--yes 只用于批量清理/u)
})

test('批量条件互斥且不能与序号混用', () => {
  assert.ok(parseCleanInput('--all --empty').errors.length > 0)
  assert.ok(parseCleanInput('--all 3').errors.length > 0)
  assert.ok(parseCleanInput('--limit 5 3').errors.length > 0)
  assert.ok(parseCleanInput('--unknown').errors.length > 0)
})

test('清单参数', () => {
  const args = parseCleanInput('list --limit 0 --project dsh')
  assert.equal(args.mode, 'list')
  assert.equal(args.limit, 0)
  assert.equal(args.project, 'dsh')
  assert.deepEqual(args.errors, [])
})

test('内联等号写法', () => {
  const args = parseCleanInput('--older-than=7d --project=D:/Work')
  assert.equal(args.olderThanMs, 7 * 86_400_000)
  assert.equal(args.project, 'D:/Work')
  assert.deepEqual(args.errors, [])
})

test('help', () => {
  assert.equal(parseCleanInput('--help').mode, 'help')
  assert.equal(parseCleanInput('help').mode, 'help')
})

test('逗号分隔的序号', () => {
  const args = parseCleanInput('3,5 7')
  assert.equal(args.mode, 'select')
  assert.deepEqual(args.indices, [3, 5, 7])
  assert.deepEqual(args.errors, [])
})

test('--ids 精确集合与 --request', () => {
  const args = parseCleanInput('--ids alpha-1,beta-2 --yes --request token12345678')
  assert.equal(args.mode, 'select')
  assert.deepEqual(args.ids, ['alpha-1', 'beta-2'])
  assert.equal(args.viaIds, true)
  assert.equal(args.yes, true)
  assert.equal(args.requestToken, 'token12345678')
  assert.deepEqual(args.errors, [])
})

test('--ids 的参数校验', () => {
  assert.ok(parseCleanInput('--ids').errors.length > 0)
  assert.ok(parseCleanInput('--request token12345678').errors.length > 0)
  assert.ok(parseCleanInput('--ids a --request bad').errors.length > 0)
  assert.deepEqual(parseCleanInput('--ids a,b').errors, [])
})

test('缺少值的 flag 不会吞掉下一个 flag', () => {
  const args = parseCleanInput('--ids --yes')
  assert.equal(args.yes, true)
  assert.ok(args.errors.length > 0)
})
