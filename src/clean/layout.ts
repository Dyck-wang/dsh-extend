/**
 * 会话目录定位。
 *
 * 桌面端内嵌的 DSH 构建在 `sessionPersistence.list()/stat()` 的快照里不返回
 * `location`，因此不能依赖后端给出路径。这里按 JSONL 后端的目录规则复算：
 * `<root>/<projectKey(cwd)>/<encodeSegment(id)>/session.vN.jsonl[.zstd]`，
 * 并在删除前做真实磁盘校验（目录、非符号链接、含会话日志）。
 */
import { lstat, readdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import type { SessionHeader, SessionPersistence } from '../types.ts'

/** 会话日志文件名（各格式代际）。 */
const SESSION_FILE = /^session(?:\.[vV]\d+)?\.jsonl(?:\.zstd)?$/u

/**
 * 复刻后端的单段路径编码（见 format.ts `encodeSegment`）。
 * 安全字符保持原样，其余按 UTF-16 码元写成 `~XXXX`。
 * @param raw 原始字符串（会话 id）。
 * @returns 单个安全路径段。
 */
export function encodeSegment(raw: string): string {
  if (raw.length === 0) throw new Error('cannot encode an empty path segment')
  if (raw === '.') return '~002E'
  if (raw === '..') return '~002E~002E'
  let out = ''
  for (let index = 0; index < raw.length; index += 1) {
    const code = raw.charCodeAt(index)
    const ch = String.fromCharCode(code)
    if (ch !== '~' && /^[A-Za-z0-9._-]$/u.test(ch)) out += ch
    else out += `~${code.toString(16).toUpperCase().padStart(4, '0')}`
  }
  return out
}

/**
 * 复刻后端的项目目录键（见 format.ts `projectKey`）。
 * @param cwd 会话的工作目录。
 * @returns 形如 `--D-WorkSpace-demo--` 的目录名。
 */
export function projectKey(cwd: string): string {
  let readable = ''
  let separatorRun = false
  for (let index = 0; index < cwd.length; index += 1) {
    const code = cwd.charCodeAt(index)
    const ch = String.fromCharCode(code)
    if (ch === '/' || ch === '\\' || ch === ':') {
      if (!separatorRun) readable += '-'
      separatorRun = true
    } else if (ch !== '~' && /^[A-Za-z0-9._-]$/u.test(ch)) {
      readable += ch
      separatorRun = false
    } else {
      readable += `~${code.toString(16).toUpperCase().padStart(4, '0')}`
      separatorRun = false
    }
  }
  const slug = readable.replace(/^-+/u, '') || 'root'
  return `--${slug.slice(0, 251)}--`
}

/**
 * 从持久化实例取出会话根目录（运行时字段，类型面未公开）。
 * 依次尝试实例 `root`、配置 `config.root`、`DSH_HOME/sessions`。
 * @param persistence 持久化服务。
 * @returns 绝对根目录，或 undefined。
 */
export function sessionRootOf(persistence: SessionPersistence): string | undefined {
  const raw = persistence as unknown as {
    readonly root?: unknown
    readonly config?: { readonly root?: unknown }
  }
  if (typeof raw.root === 'string' && raw.root !== '') return raw.root
  if (typeof raw.config === 'object' && raw.config !== null
    && typeof raw.config.root === 'string' && raw.config.root !== '') return raw.config.root
  const home = process.env.DSH_HOME?.trim()
  const base = home === undefined || home === '' ? join(homedir(), '.dsh') : home
  return join(base, 'sessions')
}

/**
 * 检查一个目录是不是会话目录，并返回其日志的最新时间与总大小。
 * @param directory 候选目录。
 * @returns 目录、mtime 与大小；不是会话目录时 undefined。
 */
export async function inspectSessionDir(directory: string): Promise<{ dir: string; mtimeMs: number; size: number } | undefined> {
  try {
    const info = await lstat(directory)
    if (!info.isDirectory() || info.isSymbolicLink()) return undefined
    const entries = await readdir(directory, { withFileTypes: true })
    let mtimeMs = 0
    let size = 0
    let found = false
    for (const entry of entries) {
      if (!entry.isFile() || !SESSION_FILE.test(entry.name)) continue
      const fileInfo = await lstat(join(directory, entry.name))
      found = true
      mtimeMs = Math.max(mtimeMs, fileInfo.mtimeMs)
      size += fileInfo.size
    }
    return found ? { dir: directory, mtimeMs, size } : undefined
  } catch {
    return undefined
  }
}

/**
 * 按后端规则定位一个会话目录；优先用 header 的 cwd 直接命中，失败再按 id 搜索。
 * @param root 会话根目录。
 * @param header 会话头。
 * @returns 会话目录与日志统计，或 undefined。
 */
export async function locateSessionDir(
  root: string,
  header: SessionHeader,
): Promise<{ dir: string; mtimeMs: number; size: number } | undefined> {
  const segment = encodeSegment(String(header.id))
  const direct = header.cwd === undefined
    ? join(root, '_no-cwd', segment)
    : join(root, projectKey(header.cwd), segment)
  const hit = await inspectSessionDir(direct)
  if (hit !== undefined) return hit

  let projects: string[]
  try {
    projects = (await readdir(root, { withFileTypes: true }))
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
  } catch {
    return undefined
  }
  for (const project of projects) {
    if (!(project.startsWith('--') || project === '_no-cwd')) continue
    const candidate = join(root, project, segment)
    if (candidate === direct) continue
    const found = await inspectSessionDir(candidate)
    if (found !== undefined) return found
  }
  return undefined
}

/**
 * 兼容仍返回 `location` 的 DSH 构建：从日志文件路径推出会话目录。
 * @param path 日志文件绝对路径。
 * @returns 会话目录，或 undefined（布局不认得）。
 */
export function dirFromLocation(path: string): string | undefined {
  const directory = dirname(path)
  const project = dirname(directory)
  const projectName = basename(project)
  if (!(projectName.startsWith('--') || projectName === '_no-cwd')) return undefined
  if (directory === project || basename(directory) === '') return undefined
  return directory
}
