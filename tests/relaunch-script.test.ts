import assert from 'node:assert/strict'
import { spawn, type ChildProcess } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const helperPath = join(root, 'src', 'reboot', 'relaunch.mjs')
const isWindows = process.platform === 'win32'

/** 启动一个可被安全结束的占位进程。 */
function startDummy(): ChildProcess {
  return spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
    stdio: 'ignore',
    windowsHide: true,
  })
}

/** 轮询等待文件出现。 */
async function waitForFile(path: string, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      await readFile(path)
      return true
    } catch {
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }
  return false
}

/** 等待子进程退出。 */
async function waitForExit(child: ChildProcess, timeoutMs: number): Promise<boolean> {
  if (child.exitCode !== null) return true
  return await new Promise(resolve => {
    const timer = setTimeout(() => resolve(false), timeoutMs)
    child.once('exit', () => {
      clearTimeout(timer)
      resolve(true)
    })
  })
}

/** 以守护进程的方式启动 helper。 */
function startHelper(helper: string, request: Record<string, unknown>): ChildProcess {
  return spawn(process.execPath, [helper, JSON.stringify(request)], {
    stdio: 'ignore',
    windowsHide: true,
  })
}

test('守护进程 dry-run 只解析不结束目标进程', { skip: !isWindows }, async () => {
  const workDir = await mkdtemp(join(tmpdir(), 'dsh-extend-relaunch-'))
  const dummy = startDummy()
  try {
    const ready = join(workDir, 'ready.txt')
    const result = join(workDir, 'result.txt')
    const helper = startHelper(helperPath, {
      mainPid: dummy.pid,
      hostPid: dummy.pid,
      exePath: process.execPath,
      readyFile: ready,
      resultFile: result,
      workDir,
      dryRun: true,
    })

    assert.equal(await waitForFile(ready, 15_000), true, 'dry-run 没有在时限内就绪')
    const summary = await readFile(result, 'utf8')
    assert.match(summary, /mainPid=\d+/u)
    assert.match(summary, /dryRun=true/u)
    assert.equal(dummy.exitCode, null, 'dry-run 不应结束任何进程')
    await waitForExit(helper, 5_000)
  } finally {
    dummy.kill()
    await rm(workDir, { recursive: true, force: true })
  }
})

test('守护进程会结束目标进程并写出 relaunched', { skip: !isWindows }, async () => {
  const workDir = await mkdtemp(join(tmpdir(), 'dsh-extend-relaunch-'))
  const dummy = startDummy()
  try {
    // 测试里把真正的拉起换成空操作，避免在开发机上再起一个进程。
    const original = await readFile(helperPath, 'utf8')
    const patched = original.replace(
      /const relaunched = spawn\(exePath, \[\], \{[\s\S]*?\}\)\r?\n\s*relaunched\.unref\(\)/u,
      'const relaunched = { unref() {} }',
    )
    assert.notEqual(patched, original, '没有找到可替换的拉起调用')
    const patchedPath = join(workDir, 'relaunch-test.mjs')
    await writeFile(patchedPath, patched)

    const ready = join(workDir, 'ready.txt')
    const result = join(workDir, 'result.txt')
    const helper = startHelper(patchedPath, {
      mainPid: dummy.pid,
      hostPid: dummy.pid,
      exePath: process.execPath,
      readyFile: ready,
      resultFile: result,
      workDir: '',
      delayMs: 50,
    })

    assert.equal(await waitForFile(ready, 15_000), true, '守护进程没有在时限内就绪')
    assert.equal(await waitForExit(dummy, 15_000), true, '目标进程没有被结束')
    assert.equal(await waitForExit(helper, 15_000), true, '守护进程没有退出')
    const summary = await readFile(result, 'utf8')
    assert.match(summary, /relaunched/u)
  } finally {
    dummy.kill()
    await rm(workDir, { recursive: true, force: true })
  }
})
