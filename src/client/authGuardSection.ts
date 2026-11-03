/**
 * 插件详情页的认证 cookie 清理开关。
 *
 * 通过 `plugins.detail.section` 插槽渲染在 dsh-extend 自己的详情页上；开关状态由
 * Host 的 `/api/dsh-extend/auth-guard` 读写，修改立即生效。
 */
import type { ClientContext, PluginDetailSubjectLike } from './types.ts'

/** Host 开关路由。 */
const ENDPOINT = '/api/dsh-extend/auth-guard'

type Translate = (key: string, params?: Record<string, unknown>) => string

/** 最小 React 面（只用到 createElement 与两个 hook）。 */
interface ReactLike {
  createElement(type: unknown, props?: Record<string, unknown> | null, ...children: unknown[]): unknown
  useState<T>(initial: T | (() => T)): [T, (next: T | ((previous: T) => T)) => void]
  useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void
}

/** 读取开关状态。 */
async function readEnabled(): Promise<boolean> {
  const response = await fetch(ENDPOINT, {
    cache: 'no-store',
    headers: { accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const payload: unknown = await response.json()
  const enabled = typeof payload === 'object' && payload !== null
    ? (payload as { enabled?: unknown }).enabled
    : undefined
  if (typeof enabled !== 'boolean') throw new Error('invalid auth guard response')
  return enabled
}

/** 写入开关状态。 */
async function writeEnabled(enabled: boolean): Promise<boolean> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ enabled }),
  })
  const payload: unknown = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = typeof payload === 'object' && payload !== null
      ? (payload as { error?: unknown }).error
      : undefined
    throw new Error(typeof message === 'string' ? message : `HTTP ${response.status}`)
  }
  const next = typeof payload === 'object' && payload !== null
    ? (payload as { enabled?: unknown }).enabled
    : undefined
  if (typeof next !== 'boolean') throw new Error('invalid auth guard response')
  return next
}

/** 把异常转成可展示文本。 */
function messageOf(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause)
}

const styles = {
  section: {
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid var(--dsw-alias-border-l2, #3a3a3a)',
  },
  heading: {
    margin: '0 0 8px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--dsw-alias-label-primary, #e6e6e6)',
  },
  description: {
    margin: '0 0 12px',
    fontSize: '13px',
    lineHeight: '1.6',
    color: 'var(--dsw-alias-label-secondary, #a0a0a0)',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '0 0 8px',
    fontSize: '13px',
    color: 'var(--dsw-alias-label-primary, #e6e6e6)',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    accentColor: 'var(--dsw-alias-state-business-primary, #4c8dff)',
  },
  hint: {
    margin: 0,
    fontSize: '12px',
    lineHeight: '1.5',
    color: 'var(--dsw-alias-label-secondary, #a0a0a0)',
  },
  error: {
    margin: '8px 0 0',
    fontSize: '12px',
    lineHeight: '1.5',
    color: 'var(--dsw-alias-state-error-primary, #ff6b6b)',
  },
} as const

/** 实际带 hook 的面板；只在 dsh-extend 的 bundle 页面挂载。 */
function AuthGuardPanel(props: { t: Translate }): unknown {
  const React = require('react') as ReactLike
  const [enabled, setEnabled] = React.useState<boolean | undefined>(undefined)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | undefined>(undefined)

  React.useEffect(() => {
    let alive = true
    void readEnabled()
      .then((value) => { if (alive) setEnabled(value) })
      .catch((cause: unknown) => { if (alive) setError(messageOf(cause)) })
    return () => { alive = false }
  }, [])

  const toggle = (): void => {
    if (busy || enabled === undefined) return
    setBusy(true)
    setError(undefined)
    void writeEnabled(!enabled)
      .then((next) => { setEnabled(next) })
      .catch((cause: unknown) => { setError(messageOf(cause)) })
      .finally(() => { setBusy(false) })
  }

  return React.createElement(
    'section',
    { style: styles.section },
    React.createElement('h4', { style: styles.heading }, props.t('authGuard.title')),
    React.createElement('p', { style: styles.description }, props.t('authGuard.description')),
    React.createElement(
      'label',
      { style: styles.row },
      React.createElement('input', {
        type: 'checkbox',
        style: styles.checkbox,
        checked: enabled === true,
        disabled: busy || enabled === undefined,
        onChange: toggle,
      }),
      React.createElement(
        'span',
        null,
        enabled === undefined
          ? props.t('authGuard.loading')
          : enabled ? props.t('authGuard.enabled') : props.t('authGuard.disabled'),
      ),
    ),
    React.createElement('p', { style: styles.hint }, props.t('authGuard.hint')),
    error === undefined
      ? null
      : React.createElement('p', { style: styles.error }, props.t('authGuard.failed', { error })),
  )
}

/**
 * 注册详情页区块。
 * @param ctx 客户端上下文。
 * @param t 文案函数。
 */
export function installAuthGuardSection(ctx: ClientContext, t: Translate): void {
  const slots = ctx.slots
  if (slots === undefined) return
  const Section = (props: { subject: PluginDetailSubjectLike }): unknown => {
    if (props.subject?.kind !== 'bundle' || props.subject.pkg?.name !== 'dsh-extend') return null
    const React = require('react') as ReactLike
    return React.createElement(AuthGuardPanel, { t })
  }
  ctx.effect(() => slots.inject('plugins.detail.section', () => slots.register({
    name: 'plugins.detail.section',
    id: 'dsh-extend-auth-guard',
    locale: 'dsh-extend',
  }, Section)), 'dsh-extend: auth guard section')
}
