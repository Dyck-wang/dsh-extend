/** 条目形状（清单、删除、统计共用；标题与 blank 在收集后就地补齐）。 */

/** 一条可展示、可删除的历史会话。 */
export interface SessionEntry {
  id: string
  title?: string
  cwd?: string
  createdAt: number
  /** 最后活动时间（日志文件 mtime，回退到 createdAt）。 */
  lastActivity: number
  bytes: number
  live: boolean
  subagent: boolean
  parentId?: string
  /** 会话目录绝对路径（由持久化后端给出）。 */
  dir?: string
  /** 是否没有任何用户消息（仅在 --empty 时计算）。 */
  blank?: boolean
}

/** 删除结果。 */
export interface DeleteOutcome {
  readonly deleted: readonly SessionEntry[]
  readonly failed: readonly { readonly entry: SessionEntry; readonly reason: string }[]
  readonly bytes: number
  readonly warnings: readonly string[]
}
