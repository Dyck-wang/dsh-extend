/**
 * 运行时冒烟测试（开发用，不随包发布）：
 * 用桌面端自带的 Host 启动一个临时 profile，验证：
 * 1) 插件宿主半能被 Loader 加载（ready 不报错）；
 * 2) 客户端半出现在启动图注入里（dsh-extend/client.js）；
 * 3) 只读统计路由能返回真实会话统计。
 *
 * 默认把真实 `~/.dsh/sessions` 复制到临时 DSH_HOME 再启动，既验证真实日志
 * 读取，又不触碰正在运行的桌面端与真实数据。传 `--empty-home` 可跳过复制。
 */
import { spawn } from 'node:child_process'
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'

const APP = 'D:\\Software\\dsh-desktop\\DeepSeek Harness.exe'
const RUNTIME = 'D:\\Software\\dsh-desktop\\resources\\app.asar\\dsh'
const PRIMARY = 'D:\\Software\\dsh-desktop\\resources\\runtime\\primary-runtime'
const DESKTOP_HOST = join(RUNTIME, 'node_modules', '@deepseek-ai', 'dsh-desktop-host', 'lib', 'index.js')
const PLUGIN = 'D:\\WorkSpace\\dsh\\dsh-extend'
const REAL_SESSIONS = join(homedir(), '.dsh', 'sessions')

const emptyHome = process.argv.includes('--empty-home')
const home = await mkdtemp(join(tmpdir(), 'dsh-extend-smoke-'))
const profile = join(home, 'profile')
await mkdir(join(profile, 'node_modules'), { recursive: true })
await writeFile(join(profile, 'package.json'), JSON.stringify({
  name: 'dsh-extend-smoke-profile',
  private: true,
  dependencies: { 'dsh-extend': `link:${PLUGIN.replace(/\\/gu, '/')}` },
  dsh: { profile: { bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', 'dsh-extend'] } },
}, null, 2))
await writeFile(join(profile, 'cordis.yml'), '[]\n')
await writeFile(join(profile, 'cordis.patch.yml'), '[]\n')
await symlink(PLUGIN, join(profile, 'node_modules', 'dsh-extend'), 'junction')
if (!emptyHome) {
  await cp(REAL_SESSIONS, join(home, 'sessions'), { recursive: true })
  // 复制 workspace 状态，让“已归档会话”范围能取到真实归档 id。
  const realWorkspace = join(homedir(), '.dsh', 'storages', 'workspace.json')
  try {
    await cp(realWorkspace, join(home, 'storages', 'workspace.json'))
  } catch {
    // 没有 workspace 状态时归档计数为 0，不影响其余校验。
  }
}

const environment = { ...process.env, ELECTRON_RUN_AS_NODE: '1', DSH_HOME: home }
const child = spawn(APP, ['--expose-internals', DESKTOP_HOST, RUNTIME, profile, PRIMARY], {
  stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  env: environment,
  windowsHide: true,
})

let stderr = ''
child.stderr.setEncoding('utf8')
child.stderr.on('data', (chunk) => { stderr = (stderr + chunk).slice(-20_000) })
let stdout = ''
child.stdout.setEncoding('utf8')
child.stdout.on('data', (chunk) => { stdout = (stdout + chunk).slice(-8_000) })
child.on('exit', () => { /* 由 finally 统一处理 */ })

const timeout = (ms, label) => new Promise((_, reject) => {
  setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms).unref()
})

let success = false
try {
  const ready = await Promise.race([
    new Promise((resolve, reject) => {
      child.on('message', (message) => {
        if (message?.type === 'ready') resolve(message)
        if (message?.type === 'fatal') reject(new Error(`host fatal: ${message.message}`))
      })
    }),
    timeout(120_000, 'ready'),
  ])

  const origin = new URL(ready.url).origin
  const injectionText = JSON.stringify(ready.injections ?? [])
  const hasClientEntry = injectionText.includes('dsh-extend')
  const entrySnippet = (() => {
    const index = injectionText.indexOf('dsh-extend')
    return index < 0 ? undefined : injectionText.slice(Math.max(0, index - 120), index + 160)
  })()
  const bootEntry = (() => {
    const match = /"id":"dsh-extend","url":"([^"]+)","rev":"([^"]+)"(?:,"inject":(\[[^\]]*\]))?/u.exec(injectionText)
    return match === null ? undefined : { url: match[1], rev: match[2], inject: match[3] }
  })()

  const summaryResponse = await fetch(`${origin}/api/dsh-extend/clean/summary`)
  const summaryText = await summaryResponse.text()
  let summary
  try { summary = JSON.parse(summaryText) } catch { summary = undefined }

  const scopeResponse = await fetch(`${origin}/api/dsh-extend/clean/sessions?scope=archived&preselect=suggested`)
  const scopeText = await scopeResponse.text()
  let scope
  try { scope = JSON.parse(scopeText) } catch { scope = undefined }

  const listResponse = await fetch(`${origin}/api/dsh-extend/clean/sessions?scope=all&preselect=none`)
  const list = await listResponse.json().catch(() => undefined)

  const resultResponse = await fetch(`${origin}/api/dsh-extend/clean/result?request=smoketest0001`)
  const resultPayload = await resultResponse.json().catch(() => undefined)

  const promptsResponse = await fetch(`${origin}/api/dsh-extend/prompts`)
  const prompts = await promptsResponse.json().catch(() => undefined)
  const promptTextResponse = await fetch(`${origin}/api/dsh-extend/prompts/text?name=harness:identity`)
  const promptText = await promptTextResponse.json().catch(() => undefined)
  const promptAddResponse = await fetch(`${origin}/api/dsh-extend/prompts/save`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'add', title: 'smoke', text: 'SMOKE_PROMPT' }),
  })
  const promptAdd = await promptAddResponse.json().catch(() => undefined)
  const promptsAfter = await (await fetch(`${origin}/api/dsh-extend/prompts`)).json().catch(() => undefined)

  console.log(JSON.stringify({
    ready: true,
    hasClientEntry,
    bootEntry,
    injects: ready.injections?.length ?? 0,
    summaryStatus: summaryResponse.status,
    summary,
    scopeStatus: scopeResponse.status,
    scope: scope === undefined ? undefined : {
      total: scope.totals?.count,
      rows: scope.rows?.length,
      allSuggested: scope.rows?.every(row => row.suggested === true),
      firstTitle: scope.rows?.[0]?.title,
      blankRows: scope.rows?.filter(row => row.blank === true).length,
    },
    listRows: list?.rows?.length,
    listSuggested: list?.rows?.some(row => row.suggested === true),
    resultStatus: resultResponse.status,
    resultFound: resultPayload?.found,
    promptsStatus: promptsResponse.status,
    promptSections: prompts?.assembled?.length,
    promptHasIdentity: prompts?.assembled?.some(section => section.name === 'harness:identity') === true,
    promptTextStatus: promptTextResponse.status,
    promptTextSize: typeof promptText?.text === 'string' ? promptText.text.length : 0,
    promptAddStatus: promptAddResponse.status,
    promptAddOk: promptAdd?.ok === true,
    promptCustomCount: promptsAfter?.custom?.length,
  }, null, 2))

  success = hasClientEntry
    && summaryResponse.status === 200
    && summary?.ok === true
    && typeof summary?.archived?.count === 'number'
    && scopeResponse.status === 200
    && scope?.ok === true
    && listResponse.status === 200
    && list?.ok === true
    && list?.rows?.every(row => row.suggested === false) === true
    && resultResponse.status === 200
    && resultPayload?.found === false
    && promptsResponse.status === 200
    && prompts?.assembled?.some(section => section.name === 'harness:identity') === true
    && promptTextResponse.status === 200
    && typeof promptText?.text === 'string'
    && promptText.text.length > 0
    && promptAddResponse.status === 200
    && promptsAfter?.custom?.some(item => item.title === 'smoke') === true
    && (emptyHome || summary.totals.sessions > 0)
  if (!success) console.error('冒烟校验未通过')
} catch (error) {
  console.error('冒烟失败：', error instanceof Error ? error.message : error)
  console.error('--- stderr tail ---')
  console.error(stderr)
  console.error('--- stdout tail ---')
  console.error(stdout)
} finally {
  try { child.kill() } catch { /* already gone */ }
  await new Promise(resolve => setTimeout(resolve, 500))
  await rm(home, { recursive: true, force: true }).catch(() => undefined)
  process.exit(success ? 0 : 1)
}



