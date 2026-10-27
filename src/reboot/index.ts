/** `/reboot`：flush 会话 → 守护进程结束主进程 → 自动拉起。 */
import { spawn } from 'node:child_process'
import { access, mkdir, readFile, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  service,
  type Agents,
  type CommandInvocation,
  type CommandResult,
  type HostContext,
  type Jobs,
  type SessionPersistence,
  type SessionStore,
} from '../types.ts'
import { shortId } from '../util.ts'
import { saveWindowStateSync } from '../window/index.ts'
import { parseRebootInput, planReboot, REBOOT_USAGE, type RebootPlan } from './plan.ts'

/** 守护进程入口（构建时复制到 lib/ 与本文件同目录）。 */
const HELPER_PATH = fileURLToPath(new URL('./relaunch.mjs', import.meta.url))

const READY_TIMEOUT_MS = 10_000
const RESULT_TIMEOUT_MS = 3_000
const RESOLVE_TIMEOUT_MS = 4_000

/** 活跃任务概况。 */
interface TaskSnapshot {
  readonly active: boolean
  readonly runningAgents: number
  readonly activeJobs: number
}

/**
 * 统计会因重启而中断的工作（与会话归档/退出检查同口径）。
 * @param ctx 宿主上下文。
 * @returns 任务概况。
 */
function inspectTasks(ctx: HostContext): TaskSnapshot {
  const agents = service<Agents>(ctx, 'agents')
  const jobs = service<Jobs>(ctx, 'jobs')
  const roster = agents?.list() ?? []
  const runningAgents = roster.filter(agent => agent.status === 'running'
    || (agent.inbox?.nextTurn?.length ?? 0) > 0
    || (agent.inbox?.nextStep?.length ?? 0) > 0).length

  let activeJobs = 0
  if (jobs !== undefined) {
    const count = (list: readonly { status?: string }[]): number =>
      list.filter(job => job.status === 'running' || job.status === 'stopping').length
    try {
      activeJobs += count(jobs.list())
    } catch { /* 任务服务暂时不可用按 0 处理 */ }
    for (const agent of roster) {
      try {
        activeJobs += count(jobs.list(agent.id))
      } catch { /* 同上 */ }
    }
  }
  return { active: runningAgents > 0 || activeJobs > 0, runningAgents, activeJobs }
}

/**
 * 把内存会话与持久化队列刷到磁盘（失败不阻塞重启）。
 * @param ctx 宿主上下文。
 */
async function flushSessions(ctx: HostContext): Promise<void> {
  const persistence = service<SessionPersistence>(ctx, 'sessionPersistence')
  const store = service<SessionStore>(ctx, 'sessions')
  const tasks: Promise<unknown>[] = []
  if (persistence !== undefined) tasks.push(persistence.flush())
  if (store !== undefined) {
    for (const session of store.list()) tasks.push(store.flush(session))
  }
  await Promise.allSettled(tasks)
}

/** 文件是否存在。 */
async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

/** 轮询等待文件出现。 */
async function waitForFile(path: string, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await exists(path)) return true
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  return false
}

/** 读取文本（不存在或为空时返回 undefined）。 */
async function readText(path: string): Promise<string | undefined> {
  try {
    const text = (await readFile(path, 'utf8')).trim()
    return text === '' ? undefined : text
  } catch {
    return undefined
  }
}

/**
 * 解析 Electron 主进程的可执行文件路径。
 * 优先问 PowerShell（能读进程真实路径）；失败时退回执行文件提示（桌面端注入的
 * 路径通常就是应用 exe）。
 * @param mainPid 主进程 PID。
 * @param fallback 回退路径。
 * @returns 存在的可执行文件路径。
 */
async function resolveExecutable(mainPid: number, fallback: string): Promise<string> {
  if (process.platform !== 'win32') return fallback
  const resolved = await new Promise<string | undefined>((resolve) => {
    let settled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const finish = (value: string | undefined): void => {
      if (settled) return
      settled = true
      if (timer !== undefined) clearTimeout(timer)
      try { child.kill() } catch { /* 已退出 */ }
      resolve(value)
    }
    const child = spawn('powershell.exe', [
      '-NoLogo', '-NoProfile', '-NonInteractive',
      '-Command', `(Get-Process -Id ${mainPid} -ErrorAction Stop).Path`,
    ], { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] })
    let output = ''
    child.stdout?.setEncoding('utf8')
    child.stdout?.on('data', (chunk: string) => { output += chunk })
    child.on('error', () => finish(undefined))
    child.on('exit', () => {
      const path = output.trim()
      finish(path !== '' && existsSync(path) ? path : undefined)
    })
    timer = setTimeout(() => finish(undefined), RESOLVE_TIMEOUT_MS)
  })
  return resolved ?? fallback
}

/**
 * 启动守护进程并等待它就绪。
 * @param options 主进程 PID、可执行文件、是否只自检。
 * @returns 是否就绪与脚本报告。
 */
async function runHelper(options: {
  readonly mainPid: number
  readonly exePath: string
  readonly dryRun: boolean
}): Promise<{ readonly ready: boolean; readonly detail: string }> {
  const workDir = join(tmpdir(), `dsh-extend-${process.pid}-${shortId()}`)
  await mkdir(workDir, { recursive: true })
  const readyFile = join(workDir, 'ready.txt')
  const resultFile = join(workDir, 'result.txt')
  const request = JSON.stringify({
    mainPid: options.mainPid,
    hostPid: process.pid,
    exePath: options.exePath,
    readyFile,
    resultFile,
    workDir,
    delayMs: 1500,
    dryRun: options.dryRun,
  })

  // Electron 在 node 模式下就是 Node：用应用自己的可执行文件跑守护脚本，
  // 不依赖 powershell.exe 是否被策略/安全软件拦截。
  const environment: NodeJS.ProcessEnv = { ...process.env, ELECTRON_RUN_AS_NODE: '1' }

  let child
  try {
    child = spawn(process.execPath, [HELPER_PATH, request], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      env: environment,
    })
  } catch (cause) {
    return { ready: false, detail: `无法启动守护进程：${cause instanceof Error ? cause.message : String(cause)}` }
  }
  child.on('error', () => { /* 由就绪超时统一报告 */ })
  child.unref()

  const ready = await waitForFile(readyFile, READY_TIMEOUT_MS)
  const detail = await waitForFile(resultFile, RESULT_TIMEOUT_MS) ? await readText(resultFile) : undefined
  if (!ready) {
    try { child.kill() } catch { /* 已退出 */ }
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined)
    return { ready: false, detail: detail ?? '守护进程未在时限内就绪' }
  }
  if (options.dryRun) {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined)
  }
  return { ready: true, detail: detail ?? '' }
}

/**
 * 执行一次 `/reboot` 调用。
 * @param ctx 宿主上下文。
 * @param invocation 命令调用。
 * @returns 命令结果。
 */
export async function runRebootCommand(ctx: HostContext, invocation: CommandInvocation): Promise<CommandResult> {
  const args = parseRebootInput(invocation.rawInput)
  if (args.errors.length > 0) {
    return { kind: 'error', text: `${args.errors.join('\n')}\n\n${REBOOT_USAGE}` }
  }
  if (args.mode === 'help') return { kind: 'success', text: REBOOT_USAGE }

  const plan = planReboot({
    platform: process.platform,
    pid: process.pid,
    ppid: process.ppid,
    desktopExecutable: process.env.DSH_DESKTOP_NODE_EXECUTABLE,
    execPath: process.execPath,
    runAsNode: process.env.ELECTRON_RUN_AS_NODE === '1',
  })
  if (!plan.ok) return { kind: 'error', text: `${plan.reason}\n\n${REBOOT_USAGE}` }

  if (!await exists(HELPER_PATH)) {
    return { kind: 'error', text: `守护进程入口缺失：${HELPER_PATH}` }
  }

  const exePath = await resolveExecutable(plan.mainPid, plan.exeHint)
  if (!existsSync(exePath)) {
    return { kind: 'error', text: `找不到桌面端可执行文件：${exePath}` }
  }

  const tasks = inspectTasks(ctx)

  if (args.mode === 'check') {
    const result = await runHelper({ mainPid: plan.mainPid, exePath, dryRun: true })
    if (!result.ready) return { kind: 'error', text: `/reboot 自检失败：${result.detail}` }
    return {
      kind: 'success',
      text: [
        '/reboot 自检通过（未结束任何进程）',
        `- ${result.detail}`,
        `- 活跃任务：${tasks.active ? `${tasks.runningAgents} 个会话在运行、${tasks.activeJobs} 个后台任务未结束` : '无'}`,
      ].join('\n'),
    }
  }

  if (tasks.active && !args.force) {
    return {
      kind: 'error',
      text: `当前有任务在运行（${tasks.runningAgents} 个会话、${tasks.activeJobs} 个后台任务）。`
        + '如果确认要中断它们并重启，请执行 /reboot --force。',
    }
  }

  await flushSessions(ctx)
  // 重启前记下窗口位置：守护进程会直接结束主进程，Host 未必能走到清理回调。
  saveWindowStateSync()
  const result = await runHelper({ mainPid: plan.mainPid, exePath, dryRun: false })
  if (!result.ready) return { kind: 'error', text: `重启失败：${result.detail}` }
  return {
    kind: 'success',
    text: `正在重启 DSH 桌面端…\n- ${result.detail}\n- 窗口会在 1-3 秒后重新出现。`,
  }
}

