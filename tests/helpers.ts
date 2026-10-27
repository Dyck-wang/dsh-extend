/** 测试脚手架：临时会话目录 + 最小假服务。 */
import { mkdir, mkdtemp, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type {
  HostContext,
  SessionHeader,
  SessionPersistence,
  SessionQuery,
  SessionSnapshot,
  SessionStore,
  WorkspaceRegistry,
} from '../src/types.ts'

/** 一个测试用会话。 */
export interface FixtureSession {
  readonly id: string
  readonly cwd: string
  readonly dir: string
  readonly file: string
  readonly header: SessionHeader
  readonly snapshot: SessionSnapshot
  readonly events: readonly { type: string; seq: number }[]
  readonly title?: string
}

/** 会话 fixture 选项。 */
export interface FixtureOptions {
  readonly id: string
  readonly cwd?: string
  readonly createdAt?: number
  readonly mtime?: number
  readonly size?: number
  readonly origin?: 'subagent'
  readonly parentSession?: string
  readonly title?: string
  readonly events?: readonly { type: string; seq: number }[]
}

/**
 * 在临时根下按真实布局创建会话目录。
 * @param root 会话根。
 * @param options 会话参数。
 * @returns fixture。
 */
export async function createSessionFixture(root: string, options: FixtureOptions): Promise<FixtureSession> {
  const cwd = options.cwd ?? 'D:\\WorkSpace\\demo'
  const projectName = cwd === '' ? '_no-cwd' : `--${cwd.replace(/[\\/:]/gu, '-')}--`
  const dir = join(root, projectName, options.id)
  await mkdir(dir, { recursive: true })
  const file = join(dir, 'session.v4.jsonl.zstd')
  await writeFile(file, 'x'.repeat(options.size ?? 1024))
  const createdAt = options.createdAt ?? Date.now()
  if (options.mtime !== undefined) {
    const seconds = options.mtime / 1000
    await utimes(file, seconds, seconds)
  }
  const header: SessionHeader = {
    id: options.id,
    createdAt,
    ...(cwd === '' ? {} : { cwd }),
    isSeeded: false,
    ...(options.origin === undefined ? {} : { origin: options.origin }),
    ...(options.parentSession === undefined ? {} : { parentSession: options.parentSession }),
  }
  const snapshot: SessionSnapshot = {
    header,
    sizeBytes: options.size ?? 1024,
    location: { kind: 'jsonl', path: file },
  }
  return {
    id: options.id,
    cwd,
    dir,
    file,
    header,
    snapshot,
    events: options.events ?? [],
    ...(options.title === undefined ? {} : { title: options.title }),
  }
}

/** 假服务集合。 */
export interface FakeServices {
  readonly persistence: SessionPersistence
  readonly query: SessionQuery
  readonly sessions: SessionStore
  readonly workspaceRegistry: WorkspaceRegistry
  /** 触发的 workspace 摘除记录。 */
  readonly detached: string[]
  /** 触发的宿主事件记录。 */
  readonly emitted: { readonly name: string; readonly args: readonly unknown[] }[]
  /** flush 调用次数。 */
  readonly flushed: { count: number }
  /** 调整哪些会话处于“使用中”。 */
  setLive(ids: readonly string[]): void
}

/**
 * 构造最小假服务。
 * @param fixtures 会话 fixtures（可变列表，测试可在删除后同步）。
 * @param liveIds 处于使用中的会话 id。
 * @param options `root` 模拟后端根目录；`includeLocation=false` 模拟桌面端不返回 location 的构建。
 * @returns 服务集合。
 */
export function createFakeServices(
  fixtures: FixtureSession[],
  liveIds: readonly string[] = [],
  options: { readonly root?: string; readonly includeLocation?: boolean; readonly archived?: readonly string[] } = {},
): FakeServices {
  const detached: string[] = []
  const emitted: { name: string; args: readonly unknown[] }[] = []
  const flushed = { count: 0 }
  let live = new Set(liveIds)
  const byId = (): Map<string, FixtureSession> => new Map(fixtures.map(item => [item.id, item]))
  const snapshotOf = (item: FixtureSession): SessionSnapshot => options.includeLocation === false
    ? { header: item.header, sizeBytes: item.snapshot.sizeBytes }
    : item.snapshot

  const persistence: SessionPersistence = {
    list: async () => fixtures.map(snapshotOf),
    stat: async id => {
      const found = byId().get(id)
      return found === undefined ? undefined : snapshotOf(found)
    },
    flush: async () => { flushed.count += 1 },
  }
  if (options.root !== undefined) {
    Object.defineProperty(persistence, 'root', { value: options.root, enumerable: true })
  }
  const query: SessionQuery = {
    listSessions: async () => fixtures.map(item => ({ header: item.header, live: live.has(item.id), persisted: true })),
    readTitleSnapshots: async ids => ids.map((id) => {
      const found = byId().get(id)
      if (found === undefined) return { sessionId: id, status: 'rejected' as const }
      return {
        sessionId: id,
        status: 'fulfilled' as const,
        value: {
          session: found.header,
          ...(found.title === undefined ? {} : { title: { title: found.title } }),
        },
      }
    }),
    readSession: async (id) => {
      const found = byId().get(id)
      if (found === undefined) throw new Error(`missing ${id}`)
      return { session: found.header, inheritedEventCount: 0, events: found.events }
    },
  }
  const sessions: SessionStore = {
    list: () => [...live].map(id => ({ id })),
    get: id => (live.has(id) ? { id } : undefined),
    flush: async () => true,
  }
  const workspaceRegistry: WorkspaceRegistry = {
    list: () => [{
      id: 'workspace-1',
      sessionIds: fixtures.map(item => item.id),
      detachSession: async (sessionId) => { detached.push(sessionId) },
    }],
    archivedSessionIds: options.archived ?? [],
    pinnedSessionIds: [],
  }

  return {
    persistence,
    query,
    sessions,
    workspaceRegistry,
    detached,
    emitted,
    flushed,
    setLive: (ids) => { live = new Set(ids) },
  }
}

/**
 * 构造假宿主上下文。
 * @param services 服务集合。
 * @returns 最小 HostContext。
 */
export function createFakeContext(services: FakeServices): HostContext {
  const context = {
    get: (name: string): unknown => {
      switch (name) {
        case 'sessionPersistence': return services.persistence
        case 'sessionQuery': return services.query
        case 'sessions': return services.sessions
        case 'workspaceRegistry': return services.workspaceRegistry
        default: return undefined
      }
    },
    emit: (name: string, ...args: unknown[]): void => { services.emitted.push({ name, args }) },
    effect: (fn: () => (() => void) | void): (() => void) => {
      const disposer = fn()
      return typeof disposer === 'function' ? disposer : () => {}
    },
    inject: (_names: readonly string[], callback: (scope: HostContext) => void): void => {
      callback(context as unknown as HostContext)
    },
  }
  return context as unknown as HostContext
}

/**
 * 创建临时目录并返回清理函数。
 * @returns 根目录与清理函数。
 */
export async function withTempRoot(): Promise<{ root: string; cleanup: () => Promise<void> }> {
  const root = await mkdtemp(join(tmpdir(), 'dsh-extend-test-'))
  return {
    root,
    cleanup: async () => { await rm(root, { recursive: true, force: true }) },
  }
}

/**
 * 把测试期间的 DSH_HOME 指向临时目录，避免审计日志写进真实 home。
 * @returns 恢复函数。
 */
export async function isolateDshHome(): Promise<() => Promise<void>> {
  const previous = process.env.DSH_HOME
  const home = await mkdtemp(join(tmpdir(), 'dsh-extend-home-'))
  process.env.DSH_HOME = home
  return async () => {
    if (previous === undefined) delete process.env.DSH_HOME
    else process.env.DSH_HOME = previous
    await rm(home, { recursive: true, force: true })
  }
}

