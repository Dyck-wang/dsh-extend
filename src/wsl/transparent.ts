/**
 * 全局 `tools/execute` 拦截：`write` / `edit` 的 WSL 9P 目标直接写。
 *
 * 桌面端把全局 `tool-fs` 禁用了，`write` / `edit` 由 agent preset 在 agent scope
 * 注册，因此无法用同名 scoped 工具 shadow。这里改为在 `tools/execute` waterfall
 * 里拦截：命中 9P 就执行直接写并返回成功结果，其余调用 `next()` 走原工具。
 *
 * 注意：9P 分支直接 `fs.writeFile`，不经过 `ctx.fs` 的沙箱后端；这是已知取舍。
 */
import { readFile } from 'node:fs/promises'
import type { FileSystemLike, HostContext, ToolContentBlockLike } from '../types.ts'
import { service } from '../types.ts'
import {
  applyLiteralEdit,
  detectLineEndings,
  isWslTarget,
  normalizeLineEndings,
  parseEditArgs,
  parseWriteArgs,
  pathExists,
  restoreLineEndings,
  writeTargetFile,
} from './tools.ts'

/** `tools/execute` 看到的调用（只列本插件使用的字段）。 */
interface ToolExecutionLike {
  readonly name: string
  readonly arguments: unknown
  readonly agent?: unknown
  readonly signal?: AbortSignal
}

/** `tools/execute` wrapper 返回的成功结果。 */
interface ToolResultLike {
  readonly isError: false
  readonly value: unknown
  readonly content: readonly ToolContentBlockLike[]
}

/** `tools/execute` 监听器。 */
type ExecuteListener = (
  exec: ToolExecutionLike,
  next: () => Promise<ToolResultLike>,
) => Promise<ToolResultLike>

/** 带 `on` 的宿主上下文。 */
interface ExecuteHookContext extends HostContext {
  on?(event: 'tools/execute', listener: ExecuteListener): () => void
}

/** agent 作用域上挂着的 fs 服务。 */
interface AgentWithFsLike {
  readonly ctx?: HostContext
}

/** agent 的会话（只用于取 cwd 兜底）。 */
interface AgentWithSessionLike {
  readonly session?: { readonly header?: { readonly cwd?: string } }
}

/** 会话工作目录服务。 */
interface WorkingDirectoryLike {
  ensure(agent: unknown, signal?: AbortSignal): Promise<string | undefined>
}

/**
 * 取这次调用所属 agent 的 fs 服务；根调用才回退到根 fs。
 * 用 service(agentCtx, 'fs')（内部走 ctx.get），与 write/edit 使用同一个服务。
 */
function fsFor(exec: ToolExecutionLike, ctx: HostContext): FileSystemLike | undefined {
  const agentCtx = (exec.agent as AgentWithFsLike | undefined)?.ctx
  const scoped = agentCtx === undefined ? undefined : service<FileSystemLike>(agentCtx, 'fs')
  return scoped ?? service<FileSystemLike>(ctx, 'fs')
}

/**
 * 取这次调用的会话工作目录，供相对路径解析使用。
 * 与内置 `write` / `edit` 的 `sessionResolveOptions()` 一致：优先
 * `workingDirectory.ensure(agent)`，取不到时回退会话头的 cwd。
 */
async function cwdFor(exec: ToolExecutionLike, ctx: HostContext): Promise<string | undefined> {
  const agentCtx = (exec.agent as AgentWithFsLike | undefined)?.ctx
  const workingDirectory = (agentCtx === undefined
    ? undefined
    : service<WorkingDirectoryLike>(agentCtx, 'workingDirectory'))
    ?? service<WorkingDirectoryLike>(ctx, 'workingDirectory')
  if (workingDirectory !== undefined && typeof workingDirectory.ensure === 'function') {
    try {
      const cwd = await workingDirectory.ensure(exec.agent, exec.signal)
      if (cwd !== undefined && cwd !== '') return cwd
    } catch {
      // 取不到会话 cwd 时继续用会话头兜底。
    }
  }
  return (exec.agent as AgentWithSessionLike | undefined)?.session?.header?.cwd
}

/** 读取文件文本；失败时返回 null（只用于 diff 基准，不阻断写入）。 */
async function readTextOrNull(targetKey: string): Promise<string | null> {
  try {
    return await readFile(targetKey, 'utf8')
  } catch {
    return null
  }
}

/** 解析参数；失败时返回 undefined，交给原工具报错。 */
function tryParse<T>(parse: () => T): T | undefined {
  try {
    return parse()
  } catch {
    return undefined
  }
}

/**
 * 为 `write` 生成直接写的成功值。
 * @returns 非 9P / 参数无效时为 undefined（调用方应走原工具）。
 */
async function writeValue(
  exec: ToolExecutionLike,
  fs: FileSystemLike,
  accept: (targetKey: string) => boolean,
  cwd: string | undefined,
): Promise<unknown | undefined> {
  const input = tryParse(() => parseWriteArgs(exec.arguments))
  if (input === undefined) return undefined
  const target = await fs.resolve(input.filePath, {
    ...(cwd === undefined ? {} : { cwd }),
    ...(exec.signal === undefined ? {} : { signal: exec.signal }),
  }).catch(() => undefined)
  if (target === undefined || !accept(target.targetKey)) return undefined
  const existed = await pathExists(target.targetKey)
  const before = existed ? await readTextOrNull(target.targetKey) : null
  await writeTargetFile(target.targetKey, input.content, exec.signal)
  return {
    path: target.displayPath,
    operation: existed ? 'update' : 'create',
    before,
    after: normalizeLineEndings(input.content),
  }
}

/**
 * 为 `edit` 生成直接替换的成功值。
 * @returns 非 9P / 参数无效时为 undefined（调用方应走原工具）。
 */
async function editValue(
  exec: ToolExecutionLike,
  fs: FileSystemLike,
  accept: (targetKey: string) => boolean,
  cwd: string | undefined,
): Promise<unknown | undefined> {
  const input = tryParse(() => parseEditArgs(exec.arguments))
  if (input === undefined) return undefined
  const target = await fs.resolve(input.filePath, {
    ...(cwd === undefined ? {} : { cwd }),
    ...(exec.signal === undefined ? {} : { signal: exec.signal }),
  }).catch(() => undefined)
  if (target === undefined || !accept(target.targetKey)) return undefined
  exec.signal?.throwIfAborted()
  const raw = await readFile(target.targetKey, 'utf8')
  const before = normalizeLineEndings(raw)
  const after = applyLiteralEdit(
    before,
    input.oldString,
    input.newString,
    input.replaceAll,
    target.displayPath,
  )
  await writeTargetFile(target.targetKey, restoreLineEndings(after, detectLineEndings(raw)), exec.signal)
  return { path: target.displayPath, before, after }
}

/**
 * 注册 `tools/execute` 拦截。
 * @param ctx 宿主上下文。
 * @param accept 目标判定（测试可注入）。
 */
export function installWslExecuteHook(
  ctx: HostContext,
  accept: (targetKey: string) => boolean = isWslTarget,
): void {
  const host = ctx as ExecuteHookContext
  const on = host.on
  if (typeof on !== 'function') return
  ctx.effect(() => on.call(host, 'tools/execute', async (exec, next) => {
    if (exec.name !== 'write' && exec.name !== 'edit') return next()
    const fs = fsFor(exec, ctx)
    if (fs === undefined) return next()
    const cwd = await cwdFor(exec, ctx)
    const value = exec.name === 'write'
      ? await writeValue(exec, fs, accept, cwd)
      : await editValue(exec, fs, accept, cwd)
    if (value === undefined) return next()
    // normalizeDispatchResult 会用工具自己的 output 重新渲染 value。
    return { isError: false, value, content: [] }
  }), 'dsh-extend: wsl execute hook')
}
