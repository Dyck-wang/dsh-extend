/** 清理 localStorage 里残留的命令草稿。 */

/** 只读 localStorage 面（测试可注入）。 */
export interface DraftStorage {
  readonly length: number
  key(index: number): string | null
  getItem(key: string): string | null
  removeItem(key: string): void
}

const DRAFT_KEY_PREFIX = 'dsh.conversation.'

/**
 * 判断草稿文本是否是 `/reboot` 命令（含带参数形式）。
 * @param text 草稿文本。
 * @returns 是否是重启命令草稿。
 */
export function isRebootDraft(text: string): boolean {
  return /^\/reboot(?:\s|$)/u.test(text.trim())
}

/**
 * 删除所有以 `/reboot` 开头的会话草稿。
 *
 * 强制重启（结束主进程）时 Chromium 可能来不及把“已清空”的草稿落盘，
 * 于是下次启动又把旧命令行恢复出来；启动时清一次即可。
 * @param storage localStorage 面。
 * @returns 被清理草稿的会话 id。
 */
export function clearRebootDrafts(storage: DraftStorage): string[] {
  const keys: string[] = []
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index)
    if (key !== null && key.startsWith(DRAFT_KEY_PREFIX)) keys.push(key)
  }
  const cleared: string[] = []
  for (const key of keys) {
    let snapshot: unknown
    try {
      const raw = storage.getItem(key)
      if (raw === null) continue
      const parsed: unknown = JSON.parse(raw)
      snapshot = parsed !== null && typeof parsed === 'object' ? (parsed as { draft?: unknown }).draft : undefined
    } catch {
      continue
    }
    const text = typeof snapshot === 'string' ? snapshot : (snapshot as { text?: unknown } | undefined)?.text
    if (typeof text !== 'string' || !isRebootDraft(text)) continue
    storage.removeItem(key)
    cleared.push(key.slice(DRAFT_KEY_PREFIX.length))
  }
  return cleared
}
