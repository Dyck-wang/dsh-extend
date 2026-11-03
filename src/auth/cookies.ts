/**
 * 认证 cookie 的纯解析/清理辅助。
 *
 * 桌面端每个回环端口签发一个 `dsh-auth-<hash(host:port)>` cookie，Cookie 的作用域
 * 不区分端口，旧 cookie 会一直累积。这里只识别该前缀，绝不触碰其他 cookie。
 */

/** 桌面端 Host 认证 cookie 前缀。 */
export const AUTH_COOKIE_PREFIX = 'dsh-auth-'

/** 单次响应最多追加的删除条数，避免异常请求撑大响应头。 */
export const MAX_DELETIONS = 200

/**
 * 从 `Cookie` 请求头里取出所有 `dsh-auth-*` 名称。
 * @param header 原始 Cookie 头。
 * @returns 去重后的认证 cookie 名称。
 */
export function requestAuthCookieNames(header: string | undefined): string[] {
  if (header === undefined || header === '') return []
  const names = new Set<string>()
  for (const segment of header.split(';')) {
    const at = segment.indexOf('=')
    const name = (at === -1 ? segment : segment.slice(0, at)).trim()
    if (name.startsWith(AUTH_COOKIE_PREFIX)) names.add(name)
  }
  return [...names]
}

/**
 * 从一个 `Set-Cookie` 值里取出认证 cookie 名称。
 * @param value 单条 Set-Cookie。
 * @returns 认证 cookie 名称；不是认证 cookie 时返回 undefined。
 */
export function responseAuthCookieName(value: string): string | undefined {
  const at = value.indexOf('=')
  if (at <= 0) return undefined
  const name = value.slice(0, at).trim()
  return name.startsWith(AUTH_COOKIE_PREFIX) ? name : undefined
}

/**
 * 生成删除某条 cookie 的 Set-Cookie 值。
 * @param name 认证 cookie 名称。
 * @returns 带 `Max-Age=0` 的删除指令。
 */
export function deletionCookie(name: string): string {
  return `${name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Strict`
}

/**
 * 找出本次 303 没有重新签发、但请求里仍带着的旧认证 cookie。
 * @param requestCookie 请求的 Cookie 头。
 * @param setCookies 本次响应的 Set-Cookie 列表。
 * @returns 需要追加删除的旧名称。
 */
export function staleAuthCookieNames(
  requestCookie: string | undefined,
  setCookies: readonly string[],
): string[] {
  const current = new Set<string>()
  for (const value of setCookies) {
    const name = responseAuthCookieName(value)
    if (name !== undefined) current.add(name)
  }
  // 没有本次签发的新 cookie 时不能删任何东西，否则可能把当前有效 cookie 清掉。
  if (current.size === 0) return []
  const stale: string[] = []
  for (const name of requestAuthCookieNames(requestCookie)) {
    if (current.has(name)) continue
    stale.push(name)
    if (stale.length >= MAX_DELETIONS) break
  }
  return stale
}
