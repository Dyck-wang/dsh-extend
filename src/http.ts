/** 宿主路由共用的 HTTP 工具（回环校验、JSON 响应/请求体）。 */
import type { HttpRequestLike, HttpResponseLike } from './types.ts'

/** 带请求体读取能力的请求（Node IncomingMessage 的最小面）。 */
export interface BodyRequestLike extends HttpRequestLike {
  on?(event: 'data', listener: (chunk: unknown) => void): void
  on?(event: 'end', listener: () => void): void
  on?(event: 'error', listener: (error: unknown) => void): void
}

/** 请求体上限（2 MB）。 */
export const MAX_BODY_BYTES = 2 * 1024 * 1024

/**
 * 只接受本机回环请求（桌面端页面经自定义协议转发，来源是 127.0.0.1）。
 * @param req 请求。
 * @returns 是否来自本机。
 */
export function isLoopback(req: HttpRequestLike): boolean {
  const address = req.socket?.remoteAddress ?? ''
  return address === '127.0.0.1'
    || address === '::1'
    || address === '::ffff:127.0.0.1'
    || address.startsWith('127.')
}

/**
 * 写 JSON 响应。
 * @param res 响应。
 * @param status HTTP 状态码。
 * @param value 响应体。
 */
export function writeJson(res: HttpResponseLike, status: number, value: unknown): void {
  if (res.writableEnded === true) return
  const body = JSON.stringify(value)
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.setHeader('x-content-type-options', 'nosniff')
  res.end(body)
}

/**
 * 只读 GET 路由的公共校验。
 * @param req 请求。
 * @param res 响应。
 * @returns 通过时返回 URL 查询参数，否则已写响应并返回 undefined。
 */
export function admitGet(req: HttpRequestLike, res: HttpResponseLike): URLSearchParams | undefined {
  if (req.method !== undefined && req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('allow', 'GET, HEAD')
    writeJson(res, 405, { ok: false, error: 'method not allowed' })
    return undefined
  }
  if (!isLoopback(req)) {
    writeJson(res, 403, { ok: false, error: 'loopback only' })
    return undefined
  }
  return new URL(req.url ?? '/', 'http://localhost').searchParams
}

/**
 * POST 路由的公共校验（方法 + 回环）。
 * @param req 请求。
 * @param res 响应。
 * @returns 是否通过；未通过时已写响应。
 */
export function admitPost(req: HttpRequestLike, res: HttpResponseLike): boolean {
  if (req.method !== 'POST') {
    res.setHeader('allow', 'POST')
    writeJson(res, 405, { ok: false, error: 'method not allowed' })
    return false
  }
  if (!isLoopback(req)) {
    writeJson(res, 403, { ok: false, error: 'loopback only' })
    return false
  }
  return true
}

/**
 * 读取并解析 JSON 请求体。
 * @param req 请求。
 * @param limit 字节上限。
 * @returns 解析后的 JSON；空请求体返回 undefined。
 */
export async function readJsonBody(req: BodyRequestLike, limit = MAX_BODY_BYTES): Promise<unknown> {
  if (typeof req.on !== 'function') throw new Error('request body is not readable')
  const chunks: Buffer[] = []
  let size = 0
  await new Promise<void>((resolve, reject) => {
    req.on?.('data', (chunk: unknown) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))
      size += buffer.length
      if (size > limit) {
        reject(new Error('request body too large'))
        return
      }
      chunks.push(buffer)
    })
    req.on?.('end', () => resolve())
    req.on?.('error', (error: unknown) => {
      reject(error instanceof Error ? error : new Error(String(error)))
    })
  })
  if (size === 0) return undefined
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}
