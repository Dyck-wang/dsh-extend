/** 浏览器半用到的客户端服务契约（仅类型）。 */

/** 弹窗选项（与 ui-commands 的 SelectOption 同形）。 */
export interface SelectOption {
  readonly id: string
  readonly label: string
  readonly detail?: string
  readonly badge?: string
  readonly group?: { readonly name: string; readonly label: string }
  readonly confirmation?: {
    readonly title: string
    readonly description: string
    readonly acknowledgeLabel: string
    readonly cancelLabel: string
    readonly confirmLabel: string
  }
}

/** 客户端命令装饰。 */
export interface CommandDecoration {
  readonly name: string
  readonly available: (session: ClientSession) => boolean
  readonly ui:
    | {
      readonly kind: 'popupSelect'
      readonly searchMode?: 'substring' | 'fuzzy-label'
      readonly searchLabels?: () => { readonly placeholder: string; readonly empty: string; readonly noResults: string }
      readonly options: (session: ClientSession, signal: AbortSignal) => Promise<readonly SelectOption[]>
      readonly onSelect: (option: SelectOption, session: ClientSession) => void | Promise<void>
    }
    | { readonly kind: 'action'; readonly run: (session: ClientSession) => void }
}

/** 命令弹窗携带的会话身份。 */
export interface ClientSession {
  readonly sessionId: string
}

/** 客户端会话绑定：会话面 + 所属 agent 上下文。 */
export interface ClientSessionBinding {
  readonly session: {
    command(line: string): Promise<
      | { readonly ok: true; readonly value: { readonly matched: boolean } }
      | { readonly ok: false; readonly error: { readonly code?: string; readonly message?: string } }
    >
  }
  readonly ctx: {
    get<T = unknown>(name: string): T | undefined
  }
}

/** 客户端会话服务（执行宿主命令用）。 */
export interface ClientSessions {
  binding(sessionId: string): ClientSessionBinding | undefined
}

/** 客户端 cordis 上下文最小面。 */
export interface ClientContext {
  effect(fn: () => (() => void) | void, label?: string): () => void
  readonly locale: {
    register(ns: string, dictionaries: Record<string, Record<string, string>>): () => void
    bind(ns: string): (key: string, params?: Record<string, unknown>) => string
  }
  readonly commandUi: { decorate(decoration: CommandDecoration): () => void }
  readonly sessions: ClientSessions
}
