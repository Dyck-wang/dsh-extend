/** 插件详情页开关：统一配置持久化。 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'
import { authGuardEnabled, setAuthGuardEnabled } from '../src/auth/guard.ts'
import { isolateDshHome } from './helpers.ts'

test('auth guard 开关写入统一 config.json', async () => {
  const restore = await isolateDshHome()
  try {
    assert.equal(authGuardEnabled(), true)
    setAuthGuardEnabled(false)
    assert.equal(authGuardEnabled(), false)
    const home = process.env.DSH_HOME
    assert.ok(home !== undefined)
    const configFile = join(home, '.dsh-extend', 'config.json')
    const disabled = JSON.parse(readFileSync(configFile, 'utf8')) as { authGuard: { enabled: boolean } }
    assert.equal(disabled.authGuard.enabled, false)

    setAuthGuardEnabled(true)
    assert.equal(authGuardEnabled(), true)
    const enabled = JSON.parse(readFileSync(configFile, 'utf8')) as { authGuard: { enabled: boolean } }
    assert.equal(enabled.authGuard.enabled, true)
  } finally {
    await restore()
  }
})
