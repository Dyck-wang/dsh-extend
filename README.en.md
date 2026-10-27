# dsh-extend (Feature Extensions)

[中文](README.md) | English

Feature extensions for the DSH desktop app: **history-session cleanup** (`/clean`), **one-click restart** (`/reboot`), **AGENTS.md generation** (`/init`), and **window position memory**.

- Package / bundle id: `dsh-extend`
- Plugins page name: **功能扩展** (Feature Extensions)
- Compatibility: DSH `>=0.2.1-rc.3 <0.3.0` (Windows desktop)

## Features

### `/clean`: clean history sessions (permanent deletion)

Type `/clean` in the composer to open a **selection panel**: **archived sessions (first)**, by age (30 / 90 days), all sessions, and empty sessions.
Each row shows title, project, last activity and size; check or uncheck rows, and only the checked sessions are deleted.
Sessions in use are listed but cannot be checked. "All sessions" opens with nothing selected; use "Select all" inside the panel to delete everything.

The delete button stays disabled until you tick "I understand this cannot be undone"; the panel also supports search, select all and clear.

Command-line forms (handy for scripts or quick actions):

```
/clean                        list sessions with sequence numbers (first 40 by default)
/clean list --limit 0         list everything
/clean list --project dsh     only one project
/clean 3 5 7                  delete rows 3, 5 and 7 from that list
/clean <session-id prefix>    delete by id prefix (the prefix must be unique)
/clean --older-than 30d       preview: delete sessions older than 30 days
/clean --older-than 30d --yes execute
/clean --empty --yes          delete sessions without any user message
/clean --all --yes            delete every inactive session
```

Panel deletion is equivalent to `/clean --ids <checked ids> --yes`, so the session log still records
`command/run` / `command/done`; every deletion also appends an audit record to `<DSH_HOME>/.dsh-extend/audit.log`.

Safety rules:

- **Permanent deletion, no recovery**;
- the current session, any live session, and any session with running tasks are never deleted;
- only sessions under the current JSONL backend layout (`<root>/--<cwd>--/<id>/`) are deleted; symlinks are always refused;
- subagent sessions are deleted together with their parent;
- persistence is flushed before deletion; afterwards the session is detached from workspace records and an event is broadcast so the sidebar updates immediately.

### `/reboot`: one-click restart

```
/reboot            restart immediately (the default equals --yes; no confirmation)
/reboot --check    self-check: resolve the main PID / executable and start the helper (kills nothing)
/reboot --force    restart even when tasks are running
/reboot --yes      legacy spelling, same as plain /reboot
```

How it works: sessions are flushed, then a standalone Node helper (started in the desktop's bundled Electron Node mode) ends the Electron main process. The Host exits gracefully after the IPC disconnect, and the helper waits for it before relaunching the same executable. PowerShell is not used because, on Windows, a detached `powershell.exe` exits immediately without running the script. DSH exposes no restart API, so this is the only automated path. **Restarting drops unsent composer drafts and interrupts running turns.**

### `/init`: generate or update AGENTS.md

Type `/init` in a repository (optionally followed by a short note). The plugin scans the repository (tree, README, package.json, configs, existing AGENTS.md) and hands a task message with absolute paths to the current agent; the agent asks when needed and writes `AGENTS.md` at the repository root. The prompt matches the standalone `dsh-init-plugin`; after the merge that plugin is no longer needed (do not enable both — duplicate command names fail registration).

### Window position memory

On exit the plugin remembers the main window's position, size and maximized state (`<DSH_HOME>/.dsh-extend/window.json`) and restores it on the next start; `/reboot` also saves before restarting. A saved rect that falls on a disconnected display is clamped back into the current screen. Windows desktop only.

## Install (Plugins → Add plugin)

1. Build the artifacts (or use the committed `lib/`):

   ```powershell
   npm install
   npm run build
   npm pack          # produces dsh-extend-0.2.2.tgz
   ```

2. Open the DSH desktop app → **Plugins** → **Add plugin**;
3. Paste the **absolute path** of `dsh-extend-0.2.2.tgz` (a directory path also works);
4. Choose **Install** → **Enable now**;
5. The plugin is not loaded until the app restarts; use the restart script inside the installed package:

   ```text
   C:\Users\<you>\.dsh\profiles\desktop\node_modules\dsh-extend\tools\restart-dsh.cmd
   ```

   (or quit from the tray and reopen). After that `/reboot` is available.

Uninstall: disable it on the Plugins page, then delete it.

## Verification

```powershell
npm test        # 85 tests: parsing, inventory, scopes, picker, deletion, empty sessions, reboot planning, /init scan & prompt, window state, client bundle, restart helper
npm run smoke   # boots the real desktop Host with a temp DSH_HOME; checks plugin loading, client entry, summary/list/result routes
```

`npm run smoke` copies the real `~/.dsh/sessions` into a temp directory by default; it never touches the running app or real data.
`node scripts/smoke-load.mjs --empty-home` skips the copy.

## Development

```powershell
npm install
npm run typecheck   # types only (no @deepseek-ai/* runtime dependencies)
npm test            # node --test (including client bundle and restart-helper tests)
npm run build       # esbuild builds lib/ + artifact verification
```

Code layout:

| Path | Responsibility |
|---|---|
| `src/index.ts` | host entry: three commands, read-only routes and window memory |
| `src/clean/` | inventory, directory location, filters, sequence snapshots, deletion, statistics |
| `src/reboot/` | reboot planning, helper launch, `relaunch.mjs` |
| `src/init/` | `/init` repository scan, prompt and user-message construction |
| `src/window/` | window state read/write, `save.ps1` / `restore.ps1` |
| `src/client/` | browser half: the `/clean` picker and the direct `/reboot` action |
| `scripts/` | build and artifact verification |

The host half never imports `@deepseek-ai/*` runtime values (types only), and the browser half is a zero-external classic script, so an installed profile needs no build-time environment.
