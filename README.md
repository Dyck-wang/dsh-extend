# dsh-extend（功能扩展）

DSH 桌面端的功能扩展插件：**历史会话清理**（`/clean`）与**一键重启**（`/reboot`）。

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
/reboot            查看是否可重启（不执行）
/reboot --check    自检：解析主进程 PID / 可执行文件，并启动守护脚本（不杀进程）
/reboot --yes      立即重启
/reboot --yes --force  有任务在运行时也强制重启
```

实现方式：先把会话刷盘，再由独立的 Node 守护进程（用桌面端自带的 Electron Node 模式启动）结束 Electron 主进程；Host 在 IPC 断开后优雅收尾，守护进程等它退出后重新拉起同一个可执行文件。之所以不用 PowerShell：实测 Windows 下 detached 启动 powershell.exe 会立即退出、不执行脚本。由于 DSH 没有对外的重启 API，这是唯一的自动化路径。**重启会丢失输入框里未发送的草稿，并中断正在运行的回合。**

## 安装（插件页「添加插件」）

1. 构建产物（或用仓库里已提交的 `lib/`）：

   ```powershell
   npm install
   npm run build
   npm pack          # 生成 dsh-extend-0.1.7.tgz
   ```

2. 打开 DSH 桌面端 → **插件** → **添加插件**；
3. 在输入框粘贴 `dsh-extend-0.1.7.tgz` 的**绝对路径**（或本目录的绝对路径，二者都支持）；
4. 选择**安装** → **立即启用**；
5. 首次安装后插件尚未加载，用安装目录里的重启脚本重启一次：

   ```text
   C:\Users\<你>\.dsh\profiles\desktop\node_modules\dsh-extend\tools\restart-dsh.cmd
   ```

   （也可以从托盘退出后重新打开。）之后就可以直接用 `/reboot` 了。

卸载：插件页停用后删除。

## 验证

```powershell
npm test        # 57 项：参数解析、清单、范围统计、勾选面板、删除、空会话、重启判定、客户端 bundle、PowerShell 守护脚本
npm run smoke   # 用桌面端自带 Host + 临时 DSH_HOME 启动，校验插件加载、客户端进启动图、统计/列表/结果路由
```

`npm run smoke` 默认把真实 `~/.dsh/sessions` 复制到临时目录再启动，不会触碰正在运行的桌面端或真实数据；
`node scripts/smoke-load.mjs --empty-home` 可跳过复制。


## 开发

```powershell
npm install
npm run typecheck   # 仅类型检查（不含 @deepseek-ai/* 运行时依赖）
npm test            # node --test（含客户端 bundle 与 PowerShell 守护脚本测试）
npm run build       # esbuild 构建 lib/ + 产物校验
```

代码结构：

| 路径 | 职责 |
|---|---|
| `src/index.ts` | 宿主入口：注册两个命令与只读统计路由 |
| `src/clean/` | 清单、目录定位、筛选、序号快照、删除执行、统计 |
| `src/reboot/` | 重启判定、守护进程启动、`relaunch.mjs` |
| `src/client/` | 浏览器半：`/clean` 的勾选面板、`/reboot` 的选择器 |
| `scripts/` | 构建与产物校验 |

宿主半不 import 任何 `@deepseek-ai/*` 运行时值（只用类型声明），浏览器半是零 external 的 classic script，因此安装到 profile 后不依赖构建期环境。







