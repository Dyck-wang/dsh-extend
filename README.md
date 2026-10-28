# dsh-extend（功能扩展）

[English](README.en.md) | 中文

DSH 桌面端的功能扩展插件：**历史会话清理**（`/clean`）、**一键重启**（`/reboot`）、**生成 AGENTS.md**（`/init`）与**窗口位置记忆**。

- 包名 / bundle id：`dsh-extend`
- 插件页显示名：**功能扩展**
- 兼容：DSH `>=0.2.1-rc.3 <0.3.0`（Windows 桌面端）

## 功能

### `/clean`：清理历史会话（永久删除）

桌面端直接输入 `/clean` 会打开**勾选面板**：**已归档会话（排第一）**、按时间（30 / 90 天）、全部会话、空会话
列出会话，每条显示标题、项目、最后活动时间与体积；可以逐条勾选/取消，确认后只删除勾选中的那些。
使用中的会话会列出来但不可勾选。「全部会话」打开时不预勾选，想全删时在面板里点「全选」。

面板底部需要勾选「我已了解删除后不可恢复」才会启用删除按钮；面板里也支持搜索、全选、清空。

命令行形式（适合脚本或快速操作）：

```
/clean                        列出清单并生成序号（默认前 40 条）
/clean list --limit 0         列出全部
/clean list --project dsh     只看某个项目
/clean 3 5 7                  删除清单中序号为 3、5、7 的会话
/clean <session-id 前缀>      按 id 前缀删除（前缀必须唯一）
/clean --older-than 30d       预览：删除 30 天前的会话
/clean --older-than 30d --yes 确认执行
/clean --empty --yes          删除没有任何用户消息的会话
/clean --all --yes            删除全部非活跃会话
```

面板删除等价于执行 `/clean --ids <勾选的 id> --yes`，因此会话日志里仍有 `command/run` / `command/done`
记录；每次删除还会向 `<DSH_HOME>/.dsh-extend/audit.log` 追加一条审计记录。

安全规则：

- **永久删除、不可恢复**；
- 当前会话、任何使用中（live）的会话、有运行中任务的会话永远不会被删除；
- 只删除当前 JSONL 后端布局下的会话目录（`<root>/--<cwd>--/<id>/`），符号链接一律拒绝；
- 子代理会话随其父会话一起删除；
- 删除前先 `flush` 持久化，删除后从 workspace 记录摘除并广播事件，侧栏即时消失。

### `/reboot`：一键重启桌面端

```
/reboot            立即重启（默认就等同 --yes，不再弹确认）
/reboot --check    自检：解析主进程 PID / 可执行文件，并启动守护进程（不杀进程）
/reboot --force    有任务在运行时也强制重启
/reboot --yes      兼容旧写法，与直接 /reboot 相同
```

实现方式：先把会话刷盘，再由独立的 Node 守护进程（用桌面端自带的 Electron Node 模式启动）结束 Electron 主进程；Host 在 IPC 断开后优雅收尾，守护进程等它退出后重新拉起同一个可执行文件。之所以不用 PowerShell：实测 Windows 下 detached 启动 powershell.exe 会立即退出、不执行脚本。由于 DSH 没有对外的重启 API，这是唯一的自动化路径。**重启会丢失输入框里未发送的草稿，并中断正在运行的回合。**

### `/init`：生成或更新 AGENTS.md

在仓库里输入 `/init`（可跟一句补充说明）。插件会先扫描仓库（目录树、README、package.json、配置文件、现有 AGENTS.md），
再把一份带绝对路径的任务消息交给当前智能体；智能体会按需询问，然后写入仓库根目录的 `AGENTS.md`。
提示词与独立插件 `dsh-init-plugin` 保持一致；合并后不再需要那个插件（两者不能同时启用，命令重名会导致注册失败）。

### `/prompt`：管理系统提示词

```
/prompt                     打开管理面板（已组装段 + 自定义项）
/prompt list                列出已组装段与自定义项
/prompt show <name>         查看某段当前全文
/prompt set <name> <text>   覆盖已组装段文本（留空则还原该段）
/prompt disable <name>      禁用已组装段
/prompt enable <name>       重新启用已组装段
/prompt reset <name|--all>  还原某段 / 全部已组装段
/prompt add <title> <text>  新增自定义提示词
/prompt remove <id>         删除自定义提示词
/prompt on|off <id>         启用/停用自定义提示词
```

- 「已组装提示词」是 DSH 在运行时从**内核、桌面端与已安装插件**收集并排序的段（如 `harness:identity`、
  `mcp:board-deploy`、`ui:deliverable-file-references`），并非只含 DSH 官方内置内容；
  面板只按段覆盖/禁用，不改安装文件，“还原”即回到当前组合的默认结果。
- 自定义提示词追加在系统提示词末尾，可随时启用/停用。
- 修改在下一轮模型请求生效；Agent 预设若使用固定完整提示词（`complete` 段），不参与覆盖。
- 覆盖状态保存在 `<DSH_HOME>/.dsh-extend/prompts.json`（写入前保留 `.bak`）。

### 多语言

- 插件文案已备好 DSH 的 8 种语言字典：中文、English、日本語、Español、Français、Deutsch、Русский、Português，插件页也有对应的 `locale/*.json`；
- **不改动 DSH 的语言列表**：实际可选语言由桌面端构建决定。当前构建只注册中文/English，官方包也只带中英字典，切到其他语言会回落英文；
- 桌面端后续支持这些语言后，插件文案会自动跟随，无需改代码；
- 宿主的命令说明与结果文本仍是中文（DSH 的 locale 服务只覆盖浏览器半）。

### 窗口位置记忆
桌面端退出时记住主窗口的位置、大小与最大化状态（`<DSH_HOME>/.dsh-extend/window.json`），下次启动自动恢复；
`/reboot` 前也会保存一次。保存的窗口若落在已断开的显示器上，会自动夹回当前屏幕范围。仅 Windows 桌面端生效。

## 安装（插件页「添加插件」）

1. 构建产物（或用仓库里已提交的 `lib/`）：

   ```powershell
   npm install
   npm run build
   npm pack          # 生成 dsh-extend-<version>.tgz
   ```

2. 打开 DSH 桌面端 → **插件** → **添加插件**；
3. 在输入框粘贴 `dsh-extend-<version>.tgz` 的**绝对路径**（或本目录的绝对路径，二者都支持）；
4. 选择**安装** → **立即启用**；
5. 首次安装后插件尚未加载，用安装目录里的重启脚本重启一次：

   ```text
   C:\Users\<你>\.dsh\profiles\desktop\node_modules\dsh-extend\tools\restart-dsh.cmd
   ```

   （也可以从托盘退出后重新打开。）之后就可以直接用 `/reboot` 了。

卸载：插件页停用后删除。

## 验证

```powershell
npm test        # 106 项：参数解析、清单、范围统计、勾选面板、删除、空会话、重启判定、`/init` 扫描与提示词、窗口状态、客户端 bundle、重启守护进程
npm run smoke   # 用桌面端自带 Host + 临时 DSH_HOME 启动，校验插件加载、客户端进启动图、统计/列表/结果路由
```

`npm run smoke` 默认把真实 `~/.dsh/sessions` 复制到临时目录再启动，不会触碰正在运行的桌面端或真实数据；
`node scripts/smoke-load.mjs --empty-home` 可跳过复制。


## 开发

```powershell
npm install
npm run typecheck   # 仅类型检查（不含 @deepseek-ai/* 运行时依赖）
npm test            # node --test（含客户端 bundle、重启守护进程与窗口状态测试）
npm run build       # esbuild 构建 lib/ + 产物校验
```

代码结构：

| 路径 | 职责 |
|---|---|
| `src/index.ts` | 宿主入口：注册四个命令、只读统计路由与窗口记忆 |
| `src/clean/` | 清单、目录定位、筛选、序号快照、删除执行、统计 |
| `src/reboot/` | 重启判定、守护进程启动、`relaunch.mjs` |
| `src/init/` | `/init` 仓库扫描、提示词与 user message 构造 |
| `src/prompt/` | `/prompt` 系统提示词覆盖、状态持久化、面板路由 |
| `src/window/` | 窗口状态读写、`save.ps1` / `restore.ps1` |
| `src/client/` | 浏览器半：`/clean` 勾选面板、`/prompt` 管理面板、`/reboot` 直接执行 action |
| `scripts/` | 构建与产物校验 |

宿主半不 import 任何 `@deepseek-ai/*` 运行时值（只用类型声明），浏览器半是零 external 的 classic script，因此安装到 profile 后不依赖构建期环境。


























