/**
 * WSL 9P 路径辅助：路径判定、直接写/替换与换行处理。
 *
 * WSL 的 `\\wsl.localhost\...` / `\\wsl$\...` 映射是 9P 文件系统：不支持硬链接，
 * 也不支持 Windows 安全描述符。DSH 内置的 `write` / `edit` 走原子写（临时文件 +
 * `link`）并复制目标 DACL，在这类路径上会失败；透明覆盖在确认目标后，用普通
 * `writeFile` 直接写。
 */
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

/** WSL 9P 的 UNC 前缀（大小写不敏感）。 */
const WSL_UNC = /^\\\\wsl(?:\.localhost|\$)\\/iu

/**
 * 判断目标是否是 WSL 的 9P UNC 路径。
 * @param targetKey `ctx.fs.resolve()` 返回的真实目标。
 * @returns 是 WSL 映射时为 true。
 */
export function isWslTarget(targetKey: string): boolean {
  const normalized = targetKey.startsWith('\\\\?\\UNC\\') ? `\\\\${targetKey.slice(8)}` : targetKey
  return WSL_UNC.test(normalized)
}

/** 统计子串出现次数（不用正则，避免特殊字符）。 */
function countOccurrences(content: string, needle: string): number {
  let count = 0
  let index = 0
  while (true) {
    const found = content.indexOf(needle, index)
    if (found === -1) return count
    count += 1
    index = found + needle.length
  }
}

/** 目标是否已存在；只有 ENOENT 视为不存在。 */
export async function pathExists(targetKey: string): Promise<boolean> {
  try {
    await stat(targetKey)
    return true
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 'ENOENT') {
      return false
    }
    throw error
  }
}

/** 写入前检查取消信号。 */
function throwIfAborted(signal: AbortSignal | undefined): void {
  signal?.throwIfAborted()
}

/** 把 CRLF 折叠成 LF（与内置工具的 diff 基准一致）。 */
export function normalizeLineEndings(content: string): string {
  return content.replaceAll('\r\n', '\n')
}

/** 检测文件原来的换行风格。 */
export function detectLineEndings(raw: string): 'LF' | 'CRLF' {
  const sample = raw.slice(0, 4096)
  const crlfCount = sample.split('\r\n').length - 1
  const lfCount = sample.split('\n').length - 1 - crlfCount
  return crlfCount > lfCount ? 'CRLF' : 'LF'
}

/** 按原换行风格写回（LF 原样返回）。 */
export function restoreLineEndings(content: string, lineEndings: 'LF' | 'CRLF'): string {
  return lineEndings === 'LF' ? content : normalizeLineEndings(content).split('\n').join('\r\n')
}

/**
 * 对 LF 文本做字面替换；空、缺失或多重匹配（且不允许全替换）时抛错。
 * @param content LF 文本。
 * @param oldString 要替换的原文。
 * @param newString 替换后的文本。
 * @param replaceAll 是否替换全部匹配。
 * @param displayPath 错误信息里显示的路径。
 * @returns 替换后的文本。
 */
export function applyLiteralEdit(
  content: string,
  oldString: string,
  newString: string,
  replaceAll: boolean,
  displayPath: string,
): string {
  if (oldString.length === 0) throw new Error('old_string must be a non-empty string')
  const count = countOccurrences(content, oldString)
  if (count === 0) throw new Error(`old_string was not found in "${displayPath}"`)
  if (!replaceAll && count > 1) {
    throw new Error(`old_string occurs ${count} times in "${displayPath}"; pass replace_all=true or use a unique string`)
  }
  const index = content.indexOf(oldString)
  return replaceAll
    ? content.split(oldString).join(newString)
    : content.slice(0, index) + newString + content.slice(index + oldString.length)
}

/**
 * 直接写入一个 9P 文件（不经过 link / DACL）。
 * @param targetKey 真实目标路径。
 * @param content UTF-8 文本。
 * @param signal 取消信号。
 * @returns 写入的 UTF-8 字节数。
 */
export async function writeTargetFile(targetKey: string, content: string, signal?: AbortSignal): Promise<number> {
  throwIfAborted(signal)
  await mkdir(dirname(targetKey), { recursive: true })
  await writeFile(targetKey, content, { encoding: 'utf8', ...(signal === undefined ? {} : { signal }) })
  return Buffer.byteLength(content, 'utf8')
}

/**
 * 读取、做字面替换、再直接写回。
 * @param targetKey 真实目标路径。
 * @param oldString 要替换的原文（不能为空）。
 * @param newString 替换后的文本。
 * @param replaceAll 是否替换全部匹配。
 * @param signal 取消信号。
 * @returns 替换次数与写回后的字节数。
 */
export async function editTargetFile(
  targetKey: string,
  oldString: string,
  newString: string,
  replaceAll: boolean,
  signal?: AbortSignal,
): Promise<{ replacements: number; bytes: number }> {
  if (oldString.length === 0) throw new Error('old_string must be a non-empty string')
  throwIfAborted(signal)
  const content = await readFile(targetKey, 'utf8')
  const count = countOccurrences(content, oldString)
  const next = applyLiteralEdit(content, oldString, newString, replaceAll, targetKey)
  await writeFile(targetKey, next, { encoding: 'utf8', ...(signal === undefined ? {} : { signal }) })
  return { replacements: replaceAll ? count : 1, bytes: Buffer.byteLength(next, 'utf8') }
}

/** 把参数收窄成对象。 */
function asRecord(args: unknown): Record<string, unknown> {
  if (typeof args !== 'object' || args === null || Array.isArray(args)) {
    throw new Error('tool arguments must be an object')
  }
  return args as Record<string, unknown>
}

/** 读取必填字符串参数。 */
function requiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key]
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${key} must be a non-empty string`)
  }
  return value
}

/** 解析 `write` 参数。 */
export function parseWriteArgs(args: unknown): { filePath: string; content: string } {
  const record = asRecord(args)
  const filePath = requiredString(record, 'file_path')
  const content = record.content
  if (typeof content !== 'string') throw new Error('content must be a string')
  return { filePath, content }
}

/** 解析 `edit` 参数。 */
export function parseEditArgs(args: unknown): {
  filePath: string
  oldString: string
  newString: string
  replaceAll: boolean
} {
  const record = asRecord(args)
  const oldString = record.old_string
  const newString = record.new_string
  if (typeof oldString !== 'string') throw new Error('old_string must be a string')
  if (typeof newString !== 'string') throw new Error('new_string must be a string')
  if (oldString.length === 0) throw new Error('old_string must be a non-empty string')
  const replaceAll = record.replace_all
  if (replaceAll !== undefined && typeof replaceAll !== 'boolean') {
    throw new Error('replace_all must be a boolean')
  }
  return {
    filePath: requiredString(record, 'file_path'),
    oldString,
    newString,
    replaceAll: replaceAll === true,
  }
}
