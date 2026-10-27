/** 删除结果（供客户端面板取回）。 */

/** 一条被删除会话的摘要。 */
export interface DeletedSummary {
  readonly id: string
  readonly title: string | null
  readonly cwd: string | null
}

/** 删除结果摘要。 */
export interface DeleteSummary {
  readonly deleted: readonly DeletedSummary[]
  readonly failed: readonly { readonly id: string; readonly reason: string }[]
  readonly bytes: number
}

const TTL_MS = 5 * 60_000
const MAX_ENTRIES = 50

/** 一次删除结果的内存登记（按客户端请求标记取回）。 */
export class ResultStore {
  private readonly entries = new Map<string, { readonly at: number; readonly value: DeleteSummary }>()

  /**
   * 登记一次删除结果。
   * @param token 客户端请求标记。
   * @param value 删除结果。
   */
  remember(token: string, value: DeleteSummary): void {
    this.entries.set(token, { at: Date.now(), value })
    while (this.entries.size > MAX_ENTRIES) {
      const oldest = this.entries.keys().next().value
      if (oldest === undefined) break
      this.entries.delete(oldest)
    }
  }

  /**
   * 取回删除结果（过期返回 undefined）。
   * @param token 客户端请求标记。
   * @returns 删除结果。
   */
  get(token: string): DeleteSummary | undefined {
    const entry = this.entries.get(token)
    if (entry === undefined) return undefined
    if (Date.now() - entry.at > TTL_MS) {
      this.entries.delete(token)
      return undefined
    }
    return entry.value
  }
}
