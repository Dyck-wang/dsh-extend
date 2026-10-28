/** 系统提示词覆盖状态：读写、校验与持久化。 */
import { randomUUID } from 'node:crypto'
import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

/** 一条用户自定义提示词。 */
export interface CustomPrompt {
  readonly id: string
  readonly title: string
  readonly text: string
  readonly enabled: boolean
}

/** 覆盖状态（官方段按 name 覆盖/禁用，自定义段追加）。 */
export interface PromptState {
  readonly version: 1
  readonly disabled: readonly string[]
  readonly replacements: Readonly<Record<string, string>>
  readonly custom: readonly CustomPrompt[]
}

/** 空状态。 */
export const EMPTY_PROMPT_STATE: PromptState = { version: 1, disabled: [], replacements: {}, custom: [] }

const MAX_SECTIONS = 200
const MAX_CUSTOM = 100
const MAX_TITLE = 200
const MAX_TEXT = 200_000
const MAX_NAME = 200
const MAX_FILE = 4 * 1024 * 1024

/**
 * 状态文件路径：默认 `<DSH_HOME>/.dsh-extend/prompts.json`。
 * @param env 环境变量（测试用）。
 * @returns 绝对路径。
 */
export function promptStatePath(env: NodeJS.ProcessEnv = process.env): string {
  const home = env.DSH_HOME !== undefined && env.DSH_HOME !== '' ? env.DSH_HOME : join(homedir(), '.dsh')
  return join(home, '.dsh-extend', 'prompts.json')
}

/**
 * 解析并校验状态文件；版本或字段不合法时返回 undefined。
 * @param text 文件内容。
 * @returns 合法状态或 undefined。
 */
export function parsePromptState(text: string): PromptState | undefined {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return undefined
  }
  if (typeof value !== 'object' || value === null) return undefined
  const record = value as Record<string, unknown>
  if (record.version !== 1) return undefined

  const disabledRaw = record.disabled
  const disabled: string[] = []
  if (disabledRaw !== undefined) {
    if (!Array.isArray(disabledRaw) || disabledRaw.length > MAX_SECTIONS) return undefined
    for (const item of disabledRaw) {
      if (typeof item !== 'string' || item === '' || item.length > MAX_NAME) return undefined
      if (!disabled.includes(item)) disabled.push(item)
    }
  }

  const replacementsRaw = record.replacements
  const replacements: Record<string, string> = {}
  if (replacementsRaw !== undefined) {
    if (typeof replacementsRaw !== 'object' || replacementsRaw === null || Array.isArray(replacementsRaw)) return undefined
    const entries = Object.entries(replacementsRaw as Record<string, unknown>)
    if (entries.length > MAX_SECTIONS) return undefined
    for (const [key, item] of entries) {
      if (key === '' || key.length > MAX_NAME) return undefined
      if (typeof item !== 'string' || item.length > MAX_TEXT) return undefined
      replacements[key] = item
    }
  }

  const customRaw = record.custom
  const custom: CustomPrompt[] = []
  if (customRaw !== undefined) {
    if (!Array.isArray(customRaw) || customRaw.length > MAX_CUSTOM) return undefined
    const seen = new Set<string>()
    for (const item of customRaw) {
      if (typeof item !== 'object' || item === null) return undefined
      const entry = item as Record<string, unknown>
      if (typeof entry.id !== 'string' || entry.id === '' || entry.id.length > MAX_NAME) return undefined
      if (seen.has(entry.id)) return undefined
      if (typeof entry.title !== 'string' || entry.title.length > MAX_TITLE) return undefined
      if (typeof entry.text !== 'string' || entry.text.length > MAX_TEXT) return undefined
      seen.add(entry.id)
      custom.push({
        id: entry.id,
        title: entry.title,
        text: entry.text,
        enabled: entry.enabled !== false,
      })
    }
  }

  return { version: 1, disabled, replacements, custom }
}

/**
 * 同步读取状态文件（插件加载时用，失败回落空状态）。
 * @param path 状态文件路径。
 * @returns 状态。
 */
export function loadPromptStateSync(path: string = promptStatePath()): PromptState {
  try {
    if (!existsSync(path)) return EMPTY_PROMPT_STATE
    return parsePromptState(readFileSync(path, 'utf8')) ?? EMPTY_PROMPT_STATE
  } catch {
    return EMPTY_PROMPT_STATE
  }
}

/**
 * 异步读取状态文件（路由用，失败回落空状态）。
 * @param path 状态文件路径。
 * @returns 状态。
 */
export async function readPromptState(path: string = promptStatePath()): Promise<PromptState> {
  try {
    const text = await readFile(path, 'utf8')
    if (text.length > MAX_FILE) return EMPTY_PROMPT_STATE
    return parsePromptState(text) ?? EMPTY_PROMPT_STATE
  } catch {
    return EMPTY_PROMPT_STATE
  }
}

/**
 * 原子写入状态文件；已有文件先留一份 `.bak`。
 * @param state 新状态。
 * @param path 状态文件路径。
 */
export async function writePromptState(state: PromptState, path: string = promptStatePath()): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  if (existsSync(path)) {
    await copyFile(path, `${path}.bak`).catch(() => undefined)
  }
  const temp = `${path}.tmp`
  await writeFile(temp, JSON.stringify(state, null, 2), 'utf8')
  await rename(temp, path)
}

/**
 * 生成一条自定义提示词。
 * @param title 标题（空则“未命名”）。
 * @param text 文本。
 * @returns 新的自定义项。
 */
export function createCustomPrompt(title: string, text: string): CustomPrompt {
  const trimmed = title.trim().slice(0, MAX_TITLE)
  return {
    id: randomUUID().replace(/-/gu, '').slice(0, 8),
    title: trimmed === '' ? '未命名' : trimmed,
    text,
    enabled: true,
  }
}

/** 文本长度上限（路由校验用）。 */
export const MAX_PROMPT_TEXT = MAX_TEXT
/** 标题长度上限（路由校验用）。 */
export const MAX_PROMPT_TITLE = MAX_TITLE
/** 自定义项上限（路由校验用）。 */
export const MAX_CUSTOM_PROMPTS = MAX_CUSTOM
