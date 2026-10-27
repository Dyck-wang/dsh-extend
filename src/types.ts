/**
 * 本插件使用的 DSH 宿主服务契约（仅类型）。
 *
 * 这里刻意不 `import` 任何 `@deepseek-ai/*` 运行时值：第三方插件安装在 profile
 * 目录下，运行时解析由 DSH 的 runtime resolution 负责，为了把耦合与版本风险降到
 * 最低，宿主半只通过 cordis 的 `ctx` 取服务，把所有契约以最小接口形式声明在本文件。
 */

/** 会话头（只列本插件读取的字段）。 */
export interface SessionHeader {
  readonly id: string
  readonly createdAt: number
  readonly cwd?: string
  /** 直接创建者（子代理会话才有）。 */
  readonly parentSession?: string
  /** 子代理会话分类标记。 */
  readonly origin?: 'subagent'
  readonly isSeeded?: boolean
}

/** 持久化后端给出的物理位置。 */
export interface SessionLocation {
  readonly kind: string
  readonly path: string
}

/** `sessionPersistence.list()` 的轻量快照。 */
export interface SessionSnapshot {
  readonly header: SessionHeader
  readonly sizeBytes?: number
  readonly eventCount?: number
  readonly location?: SessionLocation
}

/** 会话事件的最小形状。 */
export interface SessionEventLike {
  readonly type: string
  readonly seq: number
  readonly data?: unknown
}

/** `sessionQuery.readSession()` 的返回值。 */
export interface SessionLogSnapshot {
  readonly session: SessionHeader
  readonly inheritedEventCount: number
  readonly events: readonly SessionEventLike[]
}

/** `sessionQuery.readTitleSnapshots()` 的单条结果。 */
export type SessionTitleResult =
  | {
    readonly sessionId: string
    readonly status: 'fulfilled'
    readonly value: { readonly session: SessionHeader; readonly title?: { readonly title: string } }
  }
  | { readonly sessionId: string; readonly status: 'rejected'; readonly reason?: unknown }

/** `sessionQuery.listSessions()` 的记录（只列本插件读取的字段）。 */
export interface SessionRecord {
  readonly header: SessionHeader
  readonly live: boolean
  readonly persisted: boolean
}

/** 会话持久化 seam。 */
export interface SessionPersistence {
  list(options?: { signal?: AbortSignal }): Promise<readonly SessionSnapshot[]>
  stat(id: string, options?: { signal?: AbortSignal }): Promise<SessionSnapshot | undefined>
  flush(): Promise<void>
}

/** 会话查询 seam（桌面默认组合中由 session-query-sqlite 提供）。 */
export interface SessionQuery {
  listSessions(signal?: AbortSignal): Promise<readonly SessionRecord[]>
  readTitleSnapshots(ids: readonly string[], signal?: AbortSignal): Promise<readonly SessionTitleResult[]>
  readSession(id: string): Promise<SessionLogSnapshot>
}

/** 内存会话存储。 */
export interface SessionStore {
  list(): readonly { readonly id: string }[]
  get(id: string): unknown
  flush(session: unknown): Promise<boolean>
}

/** workspace 实体（宿主侧方法）。 */
export interface WorkspaceEntity {
  readonly id: string
  readonly sessionIds: readonly string[]
  detachSession(sessionId: string): Promise<void>
}

/** workspace 注册表。 */
export interface WorkspaceRegistry {
  list(): readonly WorkspaceEntity[]
  readonly archivedSessionIds: readonly string[]
  readonly pinnedSessionIds: readonly string[]
  unarchiveSession?(sessionId: string): Promise<void>
  unpinSession?(sessionId: string): Promise<void>
}

/** agent 注册表（只用于判断是否有活跃任务）。 */
export interface AgentLike {
  readonly id: string
  readonly status?: string
  readonly inbox?: {
    readonly nextTurn?: readonly unknown[]
    readonly nextStep?: readonly unknown[]
  }
}
export interface Agents {
  list(): readonly AgentLike[]
}

/** 后台任务注册表（只用于判断是否有活跃任务）。 */
export interface JobLike {
  readonly status?: string
}
export interface Jobs {
  list(agentId?: string): readonly JobLike[]
}

/** 注册 HTTP 路由所需的最小请求/响应形状。 */
export interface HttpRequestLike {
  readonly method?: string
  readonly url?: string
  readonly headers: Record<string, string | string[] | undefined>
  readonly socket?: { readonly remoteAddress?: string }
}
export interface HttpResponseLike {
  statusCode: number
  setHeader(name: string, value: string | number): void
  end(chunk?: string): void
  readonly writableEnded?: boolean
}

/** Web 服务器路由注册面。 */
export interface WebRoute {
  readonly kind: 'exact' | 'prefix'
  readonly path: string
  readonly handler: (req: HttpRequestLike, res: HttpResponseLike) => void | Promise<void>
}
export interface WebServer {
  register(route: WebRoute): () => void
}

/** 命令定义（宿主注册表）。 */
export interface CommandInvocation {
  readonly agent: AgentLike
  readonly rawInput: string
  readonly signal: AbortSignal
}
export type CommandResult =
  | { readonly kind: 'success'; readonly text?: string }
  | { readonly kind: 'error'; readonly text: string }

export interface CommandDefinition {
  readonly name: string
  readonly description: string
  readonly input?: { readonly hint: string }
  readonly handler: (invocation: CommandInvocation) => CommandResult | Promise<CommandResult>
}
export interface CommandRuntime {
  register(definition: CommandDefinition): () => void
}

/** 宿主 cordis 上下文的最小面。 */
export interface HostContext {
  readonly root?: HostContext
  effect(fn: () => (() => void) | void | Iterable<() => void>, label?: string): () => void
  inject(names: readonly string[], callback: (scope: HostContext) => void): void
  get<T = unknown>(name: string): T | undefined
  emit(name: string, ...args: unknown[]): void
  readonly commands?: CommandRuntime
  readonly sessionPersistence?: SessionPersistence
  readonly sessionQuery?: SessionQuery
  readonly sessions?: SessionStore
  readonly workspaceRegistry?: WorkspaceRegistry
  readonly webServer?: WebServer
}

/** 安全读取可选服务（未组合时返回 undefined，而不是抛错）。 */
export function service<T>(ctx: HostContext, name: string): T | undefined {
  try {
    return ctx.get<T>(name)
  } catch {
    return undefined
  }
}
