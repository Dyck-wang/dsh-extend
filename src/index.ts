/** 宿主插件入口：注册 `/clean`、`/reboot` 与面板使用的只读数据路由。 */
import { admitGet, writeJson } from './http.ts'
import type { HostContext } from './types.ts'
import { runCleanCommand, SnapshotStore } from './clean/command.ts'
import { ResultStore } from './clean/results.ts'
import { buildSessionScope, isCleanScope } from './clean/scope.ts'
import { buildSummary } from './clean/summary.ts'
import { registerInit } from './init/index.ts'
import { installPromptManager } from './prompt/index.ts'
import { runRebootCommand } from './reboot/index.ts'
import { installWindowState } from './window/index.ts'

/** 插件诊断名。 */
export const name = 'dsh-extend'

/** 客户端弹窗使用的只读统计路由。 */
export const SUMMARY_PATH = '/api/dsh-extend/clean/summary'
/** 勾选面板的会话列表路由。 */
export const SESSIONS_PATH = '/api/dsh-extend/clean/sessions'
/** 勾选面板取回删除结果的路由。 */
export const RESULT_PATH = '/api/dsh-extend/clean/result'

/**
 * 挂载本插件。
 * @param ctx 宿主上下文。
 */
export function apply(ctx: HostContext): void {
  installWindowState(ctx)
  installPromptManager(ctx)

  const snapshots = new SnapshotStore()
  const results = new ResultStore()

  ctx.inject(['commands', 'sessionPersistence'], (scope) => {
    const commands = scope.commands
    if (commands === undefined) return
    scope.effect(() => commands.register({
      name: 'clean',
      description: '清理历史会话（永久删除；支持勾选面板 / 序号 / 时间范围）',
      input: { hint: '3 5 7 | --older-than 30d | list' },
      handler: invocation => runCleanCommand(ctx, snapshots, results, invocation),
    }), 'dsh-extend: /clean command')

    scope.effect(() => commands.register({
      name: 'reboot',
      description: '重启 DSH 桌面端（先落盘会话，再自动拉起）',
      input: { hint: '--yes | --check' },
      handler: invocation => runRebootCommand(ctx, invocation),
    }), 'dsh-extend: /reboot command')
  })

  registerInit(ctx)

  ctx.inject(['webServer'], (scope) => {
    const webServer = scope.webServer
    if (webServer === undefined) return

    scope.effect(() => webServer.register({
      kind: 'exact',
      path: SUMMARY_PATH,
      handler: (req, res) => {
        if (admitGet(req, res) === undefined) return
        const fresh = (req.url ?? '').includes('fresh=1')
        void buildSummary(ctx, { fresh })
          .then(summary => writeJson(res, 200, summary))
          .catch((cause: unknown) => {
            writeJson(res, 503, { ok: false, error: cause instanceof Error ? cause.message : String(cause) })
          })
      },
    }), 'dsh-extend: clean summary route')

    scope.effect(() => webServer.register({
      kind: 'exact',
      path: SESSIONS_PATH,
      handler: (req, res) => {
        const params = admitGet(req, res)
        if (params === undefined) return
        const scopeParam = params.get('scope') ?? 'all'
        const preselect = params.get('preselect') === 'none' ? 'none' : 'suggested'
        if (!isCleanScope(scopeParam)) {
          writeJson(res, 400, { ok: false, error: `未知范围：${scopeParam}` })
          return
        }
        void buildSessionScope(ctx, { scope: scopeParam, preselect })
          .then(payload => writeJson(res, 200, payload))
          .catch((cause: unknown) => {
            writeJson(res, 503, { ok: false, error: cause instanceof Error ? cause.message : String(cause) })
          })
      },
    }), 'dsh-extend: clean sessions route')

    scope.effect(() => webServer.register({
      kind: 'exact',
      path: RESULT_PATH,
      handler: (req, res) => {
        const params = admitGet(req, res)
        if (params === undefined) return
        const token = params.get('request') ?? ''
        const result = token === '' ? undefined : results.get(token)
        writeJson(res, 200, result === undefined ? { ok: true, found: false } : { ok: true, found: true, result })
      },
    }), 'dsh-extend: clean result route')
  })
}





