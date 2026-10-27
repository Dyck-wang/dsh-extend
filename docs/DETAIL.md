# Feature Extensions (dsh-extend)

Three everyday operations for the DSH desktop app: **history-session cleanup**, **one-click restart**,
**AGENTS.md generation**, plus **window position memory**.

## Clean history sessions: `/clean`

- Type `/clean` in the composer to open a **selection panel**. It lists sessions for the chosen scope
  (archived sessions first, then 30 / 90 days, all sessions, empty sessions) with title, project, last
  activity and size. Check or uncheck rows; only the checked sessions are deleted. "All sessions" opens
  with nothing checked; use "Select all" inside the panel to delete everything.
- Sessions in use (including the one you are talking in) are listed but cannot be checked. Subagent
  sessions are deleted together with their parent.
- The panel supports search, select all and clear. The delete button stays disabled until you tick
  "I understand this cannot be undone". After deletion the panel reports the exact count, freed space
  and any failure reasons.
- Command forms:

  ```text
  /clean                         # numbered list (first 40 rows)
  /clean list --limit 0          # all rows
  /clean 3 5 7                   # delete rows 3, 5, 7 from that list
  /clean --older-than 30d        # preview
  /clean --older-than 30d --yes  # execute
  /clean --empty --yes           # sessions without any user message
  /clean --all --yes             # delete every inactive session
  ```

- Deletion is **permanent**; there is no trash. Every deletion appends an audit record to
  `<DSH_HOME>/.dsh-extend/audit.log`.
- Before deleting, the plugin flushes persistence, detaches the sessions from workspace records,
  and notifies the UI so the sidebar updates immediately.

## One-click restart: `/reboot`

- Type `/reboot` to restart immediately (the default now equals `--yes`; no confirmation popup).
  The window is back in 1-3 seconds.
- Self-check `/reboot --check`; force while tasks run `/reboot --force`; `/reboot --yes` stays compatible.
- Restarting interrupts running turns and drops unsent composer drafts.

## Generate AGENTS.md: `/init`

- Type `/init` in a repository (optionally followed by a note). The plugin scans the repository
  (tree, README, package.json, configs, existing AGENTS.md) and hands a task message with the
  absolute target path to the current agent; the agent asks when needed and writes the root `AGENTS.md`.
- Behavior matches the standalone `dsh-init-plugin`; do not enable both plugins at once — the
  duplicate command name fails registration.

## Window position memory

- On a normal quit the plugin remembers the main window's position, size and maximized state, and
  restores them on the next start.
- `/reboot` also saves before restarting; a forced kill keeps the last saved state.
- A saved rect that falls on a disconnected display is clamped back into the current screen.

## Install

Open **Plugins → Add plugin** and paste the absolute path of this package (a directory or a
`.tgz` both work), then choose **Enable now**. The plugin is not loaded until the app restarts:
run `tools\restart-dsh.cmd` once after the first install. After that `/reboot` is available.

