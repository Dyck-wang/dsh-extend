/** 构建产物校验：注册 id、无运行时 DSH 依赖、必需文件齐全。 */
import { readFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const failures = []

async function read(rel) {
  try {
    return await readFile(join(root, rel), 'utf8')
  } catch (error) {
    failures.push(`缺少或不可读：${rel}（${error instanceof Error ? error.message : String(error)}）`)
    return ''
  }
}

async function exists(rel) {
  try {
    const info = await stat(join(root, rel))
    return info.isFile()
  } catch {
    failures.push(`缺少文件：${rel}`)
    return false
  }
}

for (const rel of [
  'lib/index.js',
  'lib/client.js',
  'lib/relaunch.mjs',
  'cordis.patch.yml',
  'locale/zh.json',
  'locale/en.json',
  'icon.svg',
  'package.json',
]) await exists(rel)

const client = await read('lib/client.js')
if (!client.startsWith('window.__ModuleLoader__.load({')) {
  failures.push('lib/client.js 未以 window.__ModuleLoader__.load({ 开头（classic script 形态被破坏）')
}
if (!client.includes('id: "dsh-extend"')) {
  failures.push('lib/client.js 的注册 id 不是 dsh-extend')
}
if (!client.includes('factory: (require) =>')) {
  failures.push('lib/client.js 缺少 factory(require) 包装')
}

const host = await read('lib/index.js')
if (/^\s*import\s[^\n]*from\s+["']@deepseek-ai\//mu.test(host)) {
  failures.push('lib/index.js 仍含 @deepseek-ai/* 运行时 import（第三方插件无法解析）')
}
if (/\brequire\(\s*["']@deepseek-ai\//u.test(host)) {
  failures.push('lib/index.js 含 @deepseek-ai/* 的 require')
}

const patch = await read('cordis.patch.yml')
if (!patch.includes("name: 'dsh-extend'")) {
  failures.push('cordis.patch.yml 未插入 dsh-extend 行')
}

if (failures.length > 0) {
  console.error('[dsh-extend] 产物校验失败：')
  for (const failure of failures) console.error(` - ${failure}`)
  process.exit(1)
}
console.log('[dsh-extend] 产物校验通过')

