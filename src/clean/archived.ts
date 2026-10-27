/** 读取 workspace 注册表里的“已归档会话”集合。 */
import { service, type HostContext, type WorkspaceRegistry } from '../types.ts'

/**
 * 取当前已归档的会话 id 集合。
 * @param ctx 宿主上下文。
 * @returns 不可变集合；workspace 服务缺失时为空集。
 */
export function archivedSessionIds(ctx: HostContext): ReadonlySet<string> {
  const registry = service<WorkspaceRegistry>(ctx, 'workspaceRegistry')
  if (registry === undefined) return new Set()
  try {
    return new Set(registry.archivedSessionIds.map(String))
  } catch {
    return new Set()
  }
}
