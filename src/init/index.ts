/** `/init`：扫描仓库并把生成/更新 AGENTS.md 的任务交给当前智能体。 */
import { resolve } from 'node:path'
import { service, type CommandInvocation, type CommandResult, type HostContext } from '../types.ts'
import { buildInitMessage } from './prompt.ts'
import { scanProject, type ScanResult } from './scan.ts'

/**
 * 计算要扫描的仓库根目录。
 *
 * 优先级：显式配置 > 会话工作目录 > sandbox 策略的工作区根 > 进程 cwd。
 * 最后一项只是兜底：dsh 进程的启动目录不一定是会话工作区。
 * @param configRoot 插件配置的根目录。
 * @param sessionCwd 会话头里的 cwd。
 * @param policyRoot sandbox 策略服务的工作区根。
 * @param cwd 进程工作目录。
 * @returns 绝对路径。
 */
export function resolveScanRoot(
  configRoot: string | undefined,
  sessionCwd: string | undefined,
  policyRoot: string | undefined,
  cwd: string,
): string {
  return resolve(configRoot ?? sessionCwd ?? policyRoot ?? cwd)
}

/**
 * 读取 sandbox 策略的工作区根（服务未组合时返回 undefined）。
 * @param ctx 宿主上下文。
 * @returns 工作区根或 undefined。
 */
function sandboxPolicyRoot(ctx: HostContext): string | undefined {
  return service<{ workspaceRoot?: string }>(ctx, 'sandboxPolicy')?.workspaceRoot
}

/**
 * 注册 `/init` 命令。
 * @param ctx 宿主上下文。
 */
export function registerInit(ctx: HostContext): void {
  ctx.inject(['commands'], (scope) => {
    const commands = scope.commands
    if (commands === undefined) return
    scope.effect(() => commands.register({
      name: 'init',
      description: '生成或更新仓库根目录的 AGENTS.md（Claude Code /init 风格）',
      input: { hint: '[可选说明]' },
      handler: async ({ agent, rawInput, signal }: CommandInvocation): Promise<CommandResult> => {
        if (signal.aborted) return { kind: 'error', text: '已取消。' }
        const scanRoot = resolveScanRoot(undefined, agent.session?.header?.cwd, sandboxPolicyRoot(ctx), process.cwd())
        let scan: ScanResult
        try {
          scan = await scanProject(scanRoot)
        } catch (error) {
          return {
            kind: 'error',
            text: `扫描仓库失败：${error instanceof Error ? error.message : String(error)}`,
          }
        }
        try {
          agent.steer(buildInitMessage(scan, rawInput))
        } catch (error) {
          return {
            kind: 'error',
            text: `无法把任务交办给当前会话：${error instanceof Error ? error.message : String(error)}`,
          }
        }
        return {
          kind: 'success',
          text: '已开始生成 AGENTS.md：智能体会先读取仓库摘要，再按需询问并写入文件。',
        }
      },
    }), 'dsh-extend: /init command')
  })
}
