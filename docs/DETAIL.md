# Feature Extensions (dsh-extend)

Two everyday operations for the DSH desktop app: **history-session cleanup** and **one-click restart**.

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

- Type `/reboot` and choose "restart now". The app ends and relaunches automatically; the window
  is back in 1-3 seconds.
- Command forms: `/reboot --yes`, self-check `/reboot --check`, force while tasks run
  `/reboot --yes --force`.
- Restarting interrupts running turns and drops unsent composer drafts.

## Install

Open **Plugins → Add plugin** and paste the absolute path of this package (a directory or a
`.tgz` both work), then choose **Enable now**. The plugin is not loaded until the app restarts:
run `tools\restart-dsh.cmd` once after the first install. After that `/reboot` is available.

