/** 通用小工具。 */

/**
 * 以固定并发跑一批异步任务。
 * @param items 输入项。
 * @param limit 并发上限（至少 1）。
 * @param worker 每项的处理函数。
 * @returns 与输入同序的 Promise（失败由 worker 自己捕获）。
 */
export async function mapPool<T>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  const size = Math.max(1, Math.floor(limit))
  let cursor = 0
  const runners = Array.from({ length: Math.min(size, Math.max(items.length, 1)) }, async () => {
    for (;;) {
      const index = cursor
      cursor += 1
      const item = items[index]
      if (item === undefined || index >= items.length) return
      await worker(item, index)
    }
  })
  await Promise.all(runners)
}

/**
 * 生成稳定的短随机标记。
 * @returns 12 位十六进制字符串。
 */
export function shortId(): string {
  return Math.random().toString(16).slice(2, 14).padEnd(12, '0')
}
