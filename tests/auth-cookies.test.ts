/** 认证 cookie 解析与旧 cookie 计算。 */
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  deletionCookie,
  MAX_DELETIONS,
  requestAuthCookieNames,
  responseAuthCookieName,
  staleAuthCookieNames,
} from '../src/auth/cookies.ts'

test('只识别 dsh-auth- 前缀并去重', () => {
  assert.deepEqual(
    requestAuthCookieNames('a=1; dsh-auth-one=x; dsh-auth-two=y; dsh-auth-one=z; other=2'),
    ['dsh-auth-one', 'dsh-auth-two'],
  )
  assert.deepEqual(requestAuthCookieNames(undefined), [])
  assert.equal(responseAuthCookieName('dsh-auth-new=abc; Path=/'), 'dsh-auth-new')
  assert.equal(responseAuthCookieName('other=abc'), undefined)
})

test('保留本次签发，删除其余旧认证 cookie', () => {
  const request = Array.from({ length: 71 }, (_, index) => `dsh-auth-${String(index)}=v`).join('; ')
  const setCookies = ['dsh-auth-new=abc; Max-Age=2592000; Path=/']
  const stale = staleAuthCookieNames(request, setCookies)
  assert.equal(stale.length, 71)
  assert.ok(stale.includes('dsh-auth-0'))
  assert.ok(!stale.includes('dsh-auth-new'))

  const withCurrent = staleAuthCookieNames(`${request}; dsh-auth-new=abc`, setCookies)
  assert.equal(withCurrent.length, 71)
  assert.ok(!withCurrent.includes('dsh-auth-new'))
})

test('没有本次签发时不删除任何 cookie', () => {
  assert.deepEqual(staleAuthCookieNames('dsh-auth-old=x', ['other=y']), [])
  assert.deepEqual(staleAuthCookieNames(undefined, ['dsh-auth-new=x']), [])
})

test('删除条数有上限，删除指令包含 Max-Age=0', () => {
  const request = Array.from({ length: MAX_DELETIONS + 20 }, (_, index) => `dsh-auth-${String(index)}=v`).join('; ')
  assert.equal(staleAuthCookieNames(request, ['dsh-auth-current=x']).length, MAX_DELETIONS)
  assert.equal(
    deletionCookie('dsh-auth-old'),
    'dsh-auth-old=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict',
  )
})
