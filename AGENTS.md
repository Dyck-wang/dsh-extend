# AGENTS.md — dsh-extend（功能扩展）

## 项目概述

- DSH 桌面端的第三方插件，同一个 npm 包同时提供宿主半与浏览器半。
- 提供 `/clean`（勾选式历史会话永久删除）与 `/reboot`（一键重启桌面端）两个命令。
- 通过 profile 的 `dsh.profile.bundles` + 本包 `cordis.patch.yml` 加载；兼容 `engines.dsh` 声明的 DSH 版本范围。

## 常用命令

- `npm install` — 安装开发依赖（esbuild、typescript、jsdom、@types/*）。esbuild 的 postinstall 可能被 npm 拦截，实测不影响构建。
- `npm run typecheck` — `tsc -p tsconfig.json --noEmit`，覆盖 `src/` 与 `tests/`。
- `npm test` — `node --test "tests/**/*.test.ts"`；Node 直接跑 TS，无需先构建。
- `npm run build` — esbuild 产出 `lib/index.js`、`lib/client.js`，复制 `lib/relaunch.mjs`，随后执行 `scripts/verify.mjs`（产物校验）。
- `npm run smoke` — 用桌面端真实 Host 启动临时 profile 与临时 `DSH_HOME`，校验插件加载、客户端进启动图、三个只读路由。
- `node scripts/smoke-load.mjs --empty-home` — 同上，但不复制真实会话与 workspace 状态。
- `npm pack` — 生成 `dsh-extend-<version>.tgz`；`*.tgz` 已在 `.gitignore` 中。

## 代码风格

- TypeScript + ESM；2 空格缩进、单引号、行尾无分号、多行结构保留行尾逗号。
- 相对导入必须带 `.ts` 扩展名；类型导入一律 `import type`（`verbatimModuleSyntax`）。
- 开启 `strict` 与 `noUncheckedIndexedAccess`；避免 `any` 与 `!`，必要时用局部断言。
- 注释与 JSDoc 用中文；导出的函数标注 `@param` / `@returns`。
- 宿主半禁止 import 任何 `@deepseek-ai/*` 运行时值，只能用 `import type`（`scripts/verify.mjs` 会拒绝）。
- 浏览器半禁止出现 ESM 语法；`lib/client.js` 必须是 classic script，并以 `window.__ModuleLoader__.load({ id: "dsh-extend", ... })` 注册。
- 客户端 DOM 用 `createElement` + `textContent`，禁止把会话标题等用户数据拼进 `innerHTML`。
- 客户端样式只注入一次（`style[data-plugin-css="dsh-extend/dialog"]`），颜色用 `--dsw-alias-*` 变量并带兜底值。
- 测试用 `node:test` + `node:assert/strict`，文件名 `*.test.ts`；共享脚手架在 `tests/helpers.ts`。
- 会写盘的测试必须用 `isolateDshHome()` 把 `DSH_HOME` 指到临时目录，避免污染真实审计日志。

## 架构说明

- `src/index.ts` — 宿主入口：`ctx.inject` 注册两个命令，并注册 `summary` / `sessions` / `result` 三个只读路由。
- `src/types.ts` — 本地声明的最小 DSH 服务契约（`HostContext`、`SessionPersistence`、`SessionQuery`、`WorkspaceRegistry` 等），不含运行时依赖。
- `src/clean/`：
  - `parse.ts` 参数解析；`format.ts` 文本排版；`types.ts` 共享类型。
  - `inventory.ts` 收集条目（`collectEntries`）、批量取标题（`attachTitles`，3s 超时）、空会话判定（`markBlank`）。
  - `layout.ts` 会话目录定位：复刻 `projectKey` / `encodeSegment`，不依赖快照的 `location`。
  - `archived.ts` 读取 workspace 注册表的归档 id；`scope.ts` 面板范围数据；`summary.ts` 带 30s 缓存的统计。
  - `delete.ts` 永久删除编排（flush → workspace 摘除 → rm → `api-session/removed` → 审计日志）。
  - `results.ts` 面板删除结果的内存登记；`command.ts` 命令编排、序号快照与结果回传。
- `src/reboot/`：`plan.ts` 环境与参数判定；`index.ts` 解析主进程 exe、启动守护进程；`relaunch.mjs` 守护进程（等待 → 结束主进程 → 拉起应用）。
- `src/client/`：`index.ts` 两个 `popupSelect` 装饰；`dialog.ts` 勾选面板（纯 DOM）；`locales.ts` zh/en 文案；`types.ts` 客户端契约。
- `scripts/`：`build.mjs`（构建）、`verify.mjs`（产物门禁）、`smoke-load.mjs`（开发用冒烟，不随包发布）。
- 发布产物：`lib/index.js`（宿主 ESM）、`lib/client.js`（classic script）、`lib/relaunch.mjs`；`files` 白名单之外的文件不会进包。
- 插件页文案来自 `locale/zh.json` / `locale/en.json`，详细介绍来自 `docs/DETAIL*.md`。

## 重要注意事项

- 桌面端内嵌的 DSH 构建里，`sessionPersistence.list()/stat()` 的快照**不含 `location`**；不要依赖它，目录定位必须走 `src/clean/layout.ts`。
- 会话根目录取持久化实例的运行时 `root`（回退 `config.root`、`DSH_HOME/sessions`），不要写死路径。
- 删除只处理 `live=false`、非符号链接、且目录内确有 `session*.jsonl*` 的会话；当前会话与使用中会话永不删除。
- 子代理会话随父会话一起删除；删除前必须 `persistence.flush()`。
- 删除后要 `ctx.emit('api-session/removed', id)`，侧栏才会即时刷新。
- `--ids` / `--request` 是面板内部参数，`--yes` 可与 `--ids` 同用；改语法时同步 `CLEAN_USAGE` 与相关测试。
- `/reboot` 的守护进程必须用 Node（桌面端 exe + `ELECTRON_RUN_AS_NODE=1`）启动；**不要改回 detached PowerShell**——实测它会以退出码 0 立即退出且不执行脚本。
- 拉起新实例前必须从环境变量里删除 `ELECTRON_RUN_AS_NODE` 与 `DSH_DESKTOP_NODE_EXECUTABLE`。
- `/reboot` 先 flush 会话；有运行中任务时默认拒绝，只有 `--force` 才继续。
- 弹窗动作会主动清空 composer 草稿（`clearComposerDraft`），避免草稿跨重启残留。
- 改动宿主或客户端代码后必须**重启桌面端**才生效（无 HMR）；本仓库以 `link:` 安装时只需 `npm run build` + 重启，不必重装。
- 首次安装后插件尚未加载，用 `tools/restart-dsh.cmd` 重启；该脚本是独立 PowerShell（交互运行，非 detached），与插件内的 Node 守护进程是两套实现。
- `npm run build` 会先 `rm -rf lib` 再构建；构建期间不要触发 `/reboot`（会读不到 `lib/relaunch.mjs`）。
- 新增运行时文件时同步更新 `package.json` 的 `files` 与 `scripts/verify.mjs` 的必需文件清单。
- `engines.dsh` 是安装时的兼容性门禁；DSH 版本升级时同步更新该范围。
- 删除不可恢复；审计记录写入 `<DSH_HOME>/.dsh-extend/audit.log`。
- 提交前至少跑通 `npm run typecheck`、`npm test`、`npm run build`；未经用户要求不要 commit 或 push。
