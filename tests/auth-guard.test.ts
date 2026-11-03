/** 303 认证 cookie 清理与退出后兜底清理器。 */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { createServer, request } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { installWriteHeadGuard } from '../src/auth/guard.ts'

/** 临时目录 + 清理。 */
async function withTemp(): Promise<{ root: string; cleanup: () => Promise<void> }> {
  const root = await mkdtemp(join(tmpdir(), 'dsh-extend-auth-'))
  return { root, cleanup: async () => { await rm(root, { recursive: true, force: true }) } }
}

/** 对本地测试服务器发一个带 Cookie 的 GET，返回 set-cookie 列表。 */
async function requestSetCookies(port: number, cookie: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, path: '/', headers: { cookie } }, (res) => {
      const value = res.headers['set-cookie']
      res.resume()
      res.on('end', () => {
        resolve(Array.isArray(value) ? value : value === undefined ? [] : [value])
      })
    })
    req.on('error', reject)
    req.end()
  })
}

/** 启动一个固定 303 响应的测试服务器。 */
async function withServer(setCookie: string, run: (port: number) => Promise<void>): Promise<void> {
  const server = createServer((_req, res) => {
    res.writeHead(303, { 'set-cookie': setCookie })
    res.end()
  })
  await new Promise<void>((resolve) => { server.listen(0, '127.0.0.1', resolve) })
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('no port')
  try {
    await run(address.port)
  } finally {
    await new Promise<void>((resolve) => { server.close(() => resolve()) })
  }
}

test('303 响应会删除旧认证 cookie，保留本次签发', async () => {
  const restore = installWriteHeadGuard()
  try {
    await withServer('dsh-auth-new=abc; Path=/', async (port) => {
      const setCookies = await requestSetCookies(
        port,
        'dsh-auth-old1=1; dsh-auth-old2=2; dsh-auth-new=abc',
      )
      assert.ok(setCookies.some(value => value.startsWith('dsh-auth-old1=; Max-Age=0')))
      assert.ok(setCookies.some(value => value.startsWith('dsh-auth-old2=; Max-Age=0')))
      assert.ok(setCookies.some(value => value.startsWith('dsh-auth-new=abc')))
      assert.ok(!setCookies.some(value => value.startsWith('dsh-auth-new=;')))
    })
  } finally {
    restore()
  }
})

test('非认证 cookie 的 303 响应保持不变', async () => {
  const restore = installWriteHeadGuard()
  try {
    await withServer('other=1; Path=/', async (port) => {
      const setCookies = await requestSetCookies(port, 'dsh-auth-old=1')
      assert.deepEqual(setCookies, ['other=1; Path=/'])
    })
  } finally {
    restore()
  }
})

test('cleanup.mjs 只删除 dsh-auth-% 行', async () => {
  const { root, cleanup } = await withTemp()
  try {
    const dbPath = join(root, '@deepseek-ai', 'dsh-desktop', 'Network', 'Cookies')
    await mkdir(join(root, '@deepseek-ai', 'dsh-desktop', 'Network'), { recursive: true })
    const database = new DatabaseSync(dbPath)
    database.exec('CREATE TABLE cookies (name TEXT, value TEXT)')
    database.exec("INSERT INTO cookies (name, value) VALUES ('dsh-auth-old', '1'), ('dsh-auth-new', '2'), ('other', '3')")
    database.close()

    const logPath = join(root, 'auth-cleanup.log')
    const helper = join(process.cwd(), 'src', 'auth', 'cleanup.mjs')
    const child = spawn(process.execPath, [helper, '0', dbPath, logPath], {
      stdio: 'ignore',
      env: { ...process.env, DSH_HOME: root },
    })
    const code = await new Promise<number | null>((resolve) => { child.once('exit', resolve) })
    assert.equal(code, 0)

    const check = new DatabaseSync(dbPath)
    const rows = check.prepare('SELECT name FROM cookies ORDER BY name').all() as { name: string }[]
    check.close()
    assert.deepEqual(rows.map(row => row.name), ['other'])
    assert.match(await readFile(logPath, 'utf8'), /deleted 2 auth cookies/u)
  } finally {
    await cleanup()
  }
})
