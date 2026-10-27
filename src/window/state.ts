/** 桌面窗口位置/大小状态的读写与校验。 */
import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

/** 窗口恢复矩形（物理像素）。 */
export interface WindowState {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
  readonly maximized: boolean
  readonly savedAt?: string
}

/** 与窗口创建时的最小尺寸保持一致。 */
export const MIN_WINDOW_WIDTH = 520
export const MIN_WINDOW_HEIGHT = 600
const MAX_WINDOW_SIZE = 16_384

/**
 * 状态文件路径：默认 `<DSH_HOME>/.dsh-extend/window.json`。
 * @param env 环境变量（测试用）。
 * @returns 绝对路径。
 */
export function windowStatePath(env: NodeJS.ProcessEnv = process.env): string {
  const home = env.DSH_HOME !== undefined && env.DSH_HOME !== '' ? env.DSH_HOME : join(homedir(), '.dsh')
  return join(home, '.dsh-extend', 'window.json')
}

/**
 * 解析并校验窗口状态；任何字段缺失或越界都返回 undefined。
 * @param text 文件内容。
 * @returns 合法状态或 undefined。
 */
export function parseWindowState(text: string): WindowState | undefined {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return undefined
  }
  if (typeof value !== 'object' || value === null) return undefined
  const record = value as Record<string, unknown>
  const number = (key: string): number | undefined => {
    const candidate = record[key]
    return typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : undefined
  }
  const left = number('left')
  const top = number('top')
  const width = number('width')
  const height = number('height')
  if (left === undefined || top === undefined || width === undefined || height === undefined) return undefined
  if (width < MIN_WINDOW_WIDTH || height < MIN_WINDOW_HEIGHT) return undefined
  if (width > MAX_WINDOW_SIZE || height > MAX_WINDOW_SIZE) return undefined
  if (Math.abs(left) > MAX_WINDOW_SIZE || Math.abs(top) > MAX_WINDOW_SIZE) return undefined
  return {
    left: Math.round(left),
    top: Math.round(top),
    width: Math.round(width),
    height: Math.round(height),
    maximized: record.maximized === true,
    ...(typeof record.savedAt === 'string' ? { savedAt: record.savedAt } : {}),
  }
}

/**
 * 读取状态文件；不存在或无效时返回 undefined。
 * @param path 状态文件路径。
 * @returns 合法状态或 undefined。
 */
export async function readWindowState(path: string = windowStatePath()): Promise<WindowState | undefined> {
  try {
    return parseWindowState(await readFile(path, 'utf8'))
  } catch {
    return undefined
  }
}
