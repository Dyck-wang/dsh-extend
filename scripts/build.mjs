/**
 * 构建两端产物：
 * - lib/index.js：宿主半，ESM，除 @deepseek-ai/* 外全部内联（本插件不 import 任何运行时依赖）；
 * - lib/client.js：浏览器半，classic script，用 window.__ModuleLoader__.load 注册工厂；
 * - lib/relaunch.mjs：重启守护进程入口，随产物一起发布。
 */
import { build } from 'esbuild'
import { cp, mkdir, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const lib = join(root, 'lib')

await rm(lib, { recursive: true, force: true })
await mkdir(lib, { recursive: true })

/** 宿主半：Node 22+ ESM。 */
await build({
  absWorkingDir: root,
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  legalComments: 'none',
  sourcemap: false,
  external: ['@deepseek-ai/*'],
  banner: { js: '/* dsh-extend: DSH desktop feature extensions (host half) */' },
  logLevel: 'warning',
})

/**
 * 浏览器半：classic script。工厂闭包里由 DSH 的模块加载器注入 require；
 * 本插件不在运行时 require 任何模块（全部能力经 cordis ctx 取得）。
 */
await build({
  absWorkingDir: root,
  entryPoints: ['src/client/index.ts'],
  outfile: 'lib/client.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'chrome110',
  legalComments: 'none',
  sourcemap: false,
  external: ['@deepseek-ai/*', 'react', 'react/*', 'react-dom', 'react-dom/*'],
  banner: {
    js: 'window.__ModuleLoader__.load({\n'
      + '  id: "dsh-extend",\n'
      + '  factory: (require) => {\n'
      + '    var module = { exports: {} };\n'
      + '    var exports = module.exports;\n',
  },
  footer: { js: '\n    return module.exports;\n  },\n});\n' },
  logLevel: 'warning',
})

await cp(join(root, 'src/reboot/relaunch.mjs'), join(lib, 'relaunch.mjs'))
console.log('[dsh-extend] built lib/index.js, lib/client.js, lib/relaunch.mjs')


