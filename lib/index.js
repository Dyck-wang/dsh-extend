/* dsh-extend: DSH desktop feature extensions (host half) */

// src/clean/delete.ts
import { appendFile, lstat as lstat2, mkdir, rm } from "node:fs/promises";
import { homedir as homedir2 } from "node:os";
import { join as join2 } from "node:path";

// src/types.ts
function service(ctx, name2) {
  try {
    return ctx.get(name2);
  } catch {
    return void 0;
  }
}

// src/clean/inventory.ts
import { stat } from "node:fs/promises";

// src/util.ts
async function mapPool(items, limit, worker) {
  const size = Math.max(1, Math.floor(limit));
  let cursor = 0;
  const runners = Array.from({ length: Math.min(size, Math.max(items.length, 1)) }, async () => {
    for (; ; ) {
      const index = cursor;
      cursor += 1;
      const item = items[index];
      if (item === void 0 || index >= items.length) return;
      await worker(item, index);
    }
  });
  await Promise.all(runners);
}
function shortId() {
  return Math.random().toString(16).slice(2, 14).padEnd(12, "0");
}

// src/clean/layout.ts
import { lstat, readdir } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, dirname, join } from "node:path";
var SESSION_FILE = /^session(?:\.[vV]\d+)?\.jsonl(?:\.zstd)?$/u;
function encodeSegment(raw) {
  if (raw.length === 0) throw new Error("cannot encode an empty path segment");
  if (raw === ".") return "~002E";
  if (raw === "..") return "~002E~002E";
  let out = "";
  for (let index = 0; index < raw.length; index += 1) {
    const code = raw.charCodeAt(index);
    const ch = String.fromCharCode(code);
    if (ch !== "~" && /^[A-Za-z0-9._-]$/u.test(ch)) out += ch;
    else out += `~${code.toString(16).toUpperCase().padStart(4, "0")}`;
  }
  return out;
}
function projectKey(cwd) {
  let readable = "";
  let separatorRun = false;
  for (let index = 0; index < cwd.length; index += 1) {
    const code = cwd.charCodeAt(index);
    const ch = String.fromCharCode(code);
    if (ch === "/" || ch === "\\" || ch === ":") {
      if (!separatorRun) readable += "-";
      separatorRun = true;
    } else if (ch !== "~" && /^[A-Za-z0-9._-]$/u.test(ch)) {
      readable += ch;
      separatorRun = false;
    } else {
      readable += `~${code.toString(16).toUpperCase().padStart(4, "0")}`;
      separatorRun = false;
    }
  }
  const slug = readable.replace(/^-+/u, "") || "root";
  return `--${slug.slice(0, 251)}--`;
}
function sessionRootOf(persistence) {
  const raw = persistence;
  if (typeof raw.root === "string" && raw.root !== "") return raw.root;
  if (typeof raw.config === "object" && raw.config !== null && typeof raw.config.root === "string" && raw.config.root !== "") return raw.config.root;
  const home = process.env.DSH_HOME?.trim();
  const base = home === void 0 || home === "" ? join(homedir(), ".dsh") : home;
  return join(base, "sessions");
}
async function inspectSessionDir(directory) {
  try {
    const info = await lstat(directory);
    if (!info.isDirectory() || info.isSymbolicLink()) return void 0;
    const entries = await readdir(directory, { withFileTypes: true });
    let mtimeMs = 0;
    let size = 0;
    let found = false;
    for (const entry of entries) {
      if (!entry.isFile() || !SESSION_FILE.test(entry.name)) continue;
      const fileInfo = await lstat(join(directory, entry.name));
      found = true;
      mtimeMs = Math.max(mtimeMs, fileInfo.mtimeMs);
      size += fileInfo.size;
    }
    return found ? { dir: directory, mtimeMs, size } : void 0;
  } catch {
    return void 0;
  }
}
async function locateSessionDir(root, header) {
  const segment = encodeSegment(String(header.id));
  const direct = header.cwd === void 0 ? join(root, "_no-cwd", segment) : join(root, projectKey(header.cwd), segment);
  const hit = await inspectSessionDir(direct);
  if (hit !== void 0) return hit;
  let projects;
  try {
    projects = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch {
    return void 0;
  }
  for (const project of projects) {
    if (!(project.startsWith("--") || project === "_no-cwd")) continue;
    const candidate = join(root, project, segment);
    if (candidate === direct) continue;
    const found = await inspectSessionDir(candidate);
    if (found !== void 0) return found;
  }
  return void 0;
}
function dirFromLocation(path) {
  const directory = dirname(path);
  const project = dirname(directory);
  const projectName = basename(project);
  if (!(projectName.startsWith("--") || projectName === "_no-cwd")) return void 0;
  if (directory === project || basename(directory) === "") return void 0;
  return directory;
}

// src/clean/inventory.ts
async function statOf(path) {
  if (path === void 0) return void 0;
  try {
    const info = await stat(path);
    return { mtimeMs: info.mtimeMs, size: info.size };
  } catch {
    return void 0;
  }
}
async function collectEntries(ctx, options = {}) {
  const persistence = service(ctx, "sessionPersistence");
  if (persistence === void 0) {
    throw new Error("\u5F53\u524D Host \u672A\u63D0\u4F9B\u4F1A\u8BDD\u6301\u4E45\u5316\u670D\u52A1\uFF08sessionPersistence\uFF09\uFF0C\u65E0\u6CD5\u8BFB\u53D6\u5386\u53F2\u4F1A\u8BDD");
  }
  const snapshots = await persistence.list(options.signal === void 0 ? {} : { signal: options.signal });
  const store = service(ctx, "sessions");
  const live = new Set((store?.list() ?? []).map((session) => String(session.id)));
  const root = sessionRootOf(persistence);
  const entries = [];
  for (const snapshot of snapshots) {
    const header = snapshot.header;
    const file = snapshot.location?.path;
    const info = await statOf(file);
    let directory = file === void 0 ? void 0 : dirFromLocation(file);
    let located;
    if (directory === void 0 && root !== void 0) {
      const found = await locateSessionDir(root, header);
      if (found !== void 0) {
        directory = found.dir;
        located = found;
      }
    }
    entries.push({
      id: String(header.id),
      ...header.cwd === void 0 ? {} : { cwd: header.cwd },
      createdAt: header.createdAt,
      lastActivity: info?.mtimeMs ?? located?.mtimeMs ?? header.createdAt,
      bytes: snapshot.sizeBytes ?? info?.size ?? located?.size ?? 0,
      live: live.has(String(header.id)),
      subagent: header.origin === "subagent",
      ...header.parentSession === void 0 ? {} : { parentId: String(header.parentSession) },
      ...directory === void 0 ? {} : { dir: directory }
    });
  }
  if (options.titles === true) await attachTitles(ctx, entries, options.signal);
  return entries;
}
async function attachTitles(ctx, entries, signal) {
  const query = service(ctx, "sessionQuery");
  if (query === void 0 || entries.length === 0) return;
  const ids = entries.map((entry) => entry.id);
  const titles = /* @__PURE__ */ new Map();
  const chunk = 64;
  for (let index = 0; index < ids.length; index += chunk) {
    try {
      const results = await withTimeout(
        query.readTitleSnapshots(ids.slice(index, index + chunk), signal),
        3e3
      );
      if (results === void 0) break;
      for (const result of results) {
        if (result.status !== "fulfilled") continue;
        const title = result.value.title?.title;
        if (typeof title === "string" && title.trim() !== "") titles.set(String(result.sessionId), title.trim());
      }
    } catch {
    }
  }
  for (const entry of entries) {
    const title = titles.get(entry.id);
    if (title !== void 0) entry.title = title;
  }
}
async function withTimeout(promise, ms) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((resolve2) => {
        timer = setTimeout(() => {
          resolve2(void 0);
        }, ms);
        timer.unref?.();
      })
    ]);
  } finally {
    if (timer !== void 0) clearTimeout(timer);
  }
}
async function markBlank(ctx, entries, signal) {
  const query = service(ctx, "sessionQuery");
  if (query === void 0) {
    throw new Error("\u5F53\u524D Host \u672A\u63D0\u4F9B\u4F1A\u8BDD\u67E5\u8BE2\u670D\u52A1\uFF08sessionQuery\uFF09\uFF0C\u65E0\u6CD5\u8BA1\u7B97\u7A7A\u4F1A\u8BDD\uFF1B\u8BF7\u6539\u7528 --older-than \u6216\u6307\u5B9A\u5E8F\u53F7");
  }
  await mapPool(entries, 4, async (entry) => {
    if (signal?.aborted === true) return;
    try {
      const log = await query.readSession(entry.id);
      const start = Math.max(0, log.inheritedEventCount);
      const hasUserTurn = log.events.slice(start).some((event) => event.type === "turn/start" || event.type === "user/message");
      entry.blank = !hasUserTurn;
    } catch {
      entry.blank = false;
    }
  });
}
function matchesProjectKeyword(entry, keyword) {
  if (entry.cwd === void 0) return false;
  const normalize = (value) => value.replace(/\\/gu, "/").toLowerCase();
  return normalize(entry.cwd).includes(normalize(keyword));
}
function selectBatch(entries, filter, now) {
  return entries.filter((entry) => !entry.live && !entry.subagent).filter((entry) => filter.project === void 0 ? true : matchesProjectKeyword(entry, filter.project)).filter((entry) => {
    if (filter.empty === true) return entry.blank === true;
    if (filter.olderThanMs !== void 0) return now - entry.lastActivity >= filter.olderThanMs;
    return true;
  }).sort((left, right) => right.lastActivity - left.lastActivity);
}
function expandDescendants(targets, all) {
  const selected = new Set(targets.map((entry) => entry.id));
  let changed = true;
  while (changed) {
    changed = false;
    for (const entry of all) {
      if (selected.has(entry.id)) continue;
      if (entry.parentId !== void 0 && selected.has(entry.parentId)) {
        selected.add(entry.id);
        changed = true;
      }
    }
  }
  return all.filter((entry) => selected.has(entry.id));
}

// src/clean/delete.ts
async function appendAudit(record) {
  try {
    const home = process.env.DSH_HOME?.trim() || join2(homedir2(), ".dsh");
    const directory = join2(home, ".dsh-extend");
    await mkdir(directory, { recursive: true });
    await appendFile(join2(directory, "audit.log"), `${JSON.stringify(record)}
`, "utf8");
  } catch {
  }
}
async function detachFromWorkspaces(ctx, sessionId) {
  const registry = service(ctx, "workspaceRegistry");
  if (registry === void 0) return;
  let workspaces = [];
  try {
    workspaces = registry.list();
  } catch {
    return;
  }
  for (const workspace of workspaces) {
    if (!workspace.sessionIds.includes(sessionId)) continue;
    try {
      await workspace.detachSession(sessionId);
    } catch {
    }
  }
  try {
    if (registry.archivedSessionIds.includes(sessionId)) await registry.unarchiveSession?.(sessionId);
  } catch {
  }
  try {
    if (registry.pinnedSessionIds.includes(sessionId)) await registry.unpinSession?.(sessionId);
  } catch {
  }
}
async function deleteSessions(ctx, all, targets, options = {}) {
  const warnings = [];
  const persistence = service(ctx, "sessionPersistence");
  if (persistence !== void 0) {
    try {
      await persistence.flush();
    } catch (error2) {
      warnings.push(`\u6301\u4E45\u5316 flush \u5931\u8D25\uFF1A${error2 instanceof Error ? error2.message : String(error2)}`);
    }
  }
  const chain = expandDescendants(targets, all);
  const deleted = [];
  const failed = [];
  let bytes = 0;
  for (const entry of chain) {
    if (entry.live) {
      failed.push({ entry, reason: "\u4F1A\u8BDD\u6B63\u5728\u4F7F\u7528\u4E2D\uFF0C\u5DF2\u8DF3\u8FC7" });
      continue;
    }
    if (entry.dir === void 0 || entry.dir === "") {
      failed.push({ entry, reason: "\u65E0\u6CD5\u5B89\u5168\u5B9A\u4F4D\u4F1A\u8BDD\u76EE\u5F55\uFF08\u4E0D\u662F\u5F53\u524D JSONL \u540E\u7AEF\u5E03\u5C40\uFF09\uFF0C\u5DF2\u8DF3\u8FC7" });
      continue;
    }
    try {
      const info = await lstat2(entry.dir);
      if (info.isSymbolicLink()) throw new Error("\u4F1A\u8BDD\u76EE\u5F55\u662F\u7B26\u53F7\u94FE\u63A5\uFF0C\u62D2\u7EDD\u5220\u9664");
      if (!info.isDirectory()) throw new Error("\u4F1A\u8BDD\u8DEF\u5F84\u4E0D\u662F\u76EE\u5F55");
      await detachFromWorkspaces(ctx, entry.id);
      await rm(entry.dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 120 });
    } catch (error2) {
      failed.push({ entry, reason: error2 instanceof Error ? error2.message : String(error2) });
      continue;
    }
    deleted.push(entry);
    bytes += entry.bytes;
    try {
      ctx.emit("api-session/removed", entry.id);
    } catch {
    }
  }
  await appendAudit({
    at: (/* @__PURE__ */ new Date()).toISOString(),
    via: options.via ?? "unknown",
    deleted: deleted.map((entry) => ({ id: entry.id, title: entry.title ?? null, cwd: entry.cwd ?? null, bytes: entry.bytes })),
    failed: failed.map((item) => ({ id: item.entry.id, reason: item.reason })),
    bytes
  });
  return { deleted, failed, bytes, warnings };
}

// src/clean/format.ts
function formatBytes(bytes) {
  const value = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  if (value < 1024) return `${Math.round(value)} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
function formatTime(epochMs) {
  const date = new Date(epochMs);
  if (Number.isNaN(date.getTime())) return "??-?? ??:??";
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function truncate(text, max) {
  const points = Array.from(text.replace(/\s+/gu, " ").trim());
  if (points.length <= max) return points.join("");
  return `${points.slice(0, Math.max(0, max - 1)).join("")}\u2026`;
}
function formatInventory(entries, options) {
  const sorted = [...entries].sort((left, right) => right.lastActivity - left.lastActivity);
  const limited = options.limit > 0 ? sorted.slice(0, options.limit) : sorted;
  const groups = /* @__PURE__ */ new Map();
  for (const entry of limited) {
    const key = entry.cwd ?? "";
    const bucket = groups.get(key);
    if (bucket === void 0) groups.set(key, [entry]);
    else bucket.push(entry);
  }
  const header = [
    "DSH \u529F\u80FD\u6269\u5C55 \xB7 \u5386\u53F2\u4F1A\u8BDD",
    `\u5171 ${options.totalCount} \u4E2A \xB7 ${formatBytes(options.totalBytes)}` + (options.liveCount > 0 ? ` \xB7 \u4F7F\u7528\u4E2D ${options.liveCount} \u4E2A\uFF08\u4E0D\u4F1A\u88AB\u5220\u9664\uFF09` : "")
  ];
  const lines = [...header];
  if (options.totalCount === 0) {
    lines.push("", "\u6CA1\u6709\u5386\u53F2\u4F1A\u8BDD\u3002");
    return { text: lines.join("\n"), displayed: [] };
  }
  const width = Math.max(2, String(limited.length).length);
  const displayed = [];
  let index = 0;
  for (const [cwd, group] of groups) {
    lines.push("");
    lines.push(`\u258C${cwd === "" ? "\u65E0\u5DE5\u4F5C\u76EE\u5F55" : truncate(cwd, 72)} \xB7 ${group.length} \u4E2A`);
    for (const entry of group) {
      index += 1;
      displayed.push(entry);
      const title = truncate(entry.title ?? "(\u65E0\u6807\u9898)", 56);
      lines.push(
        `${String(index).padStart(width)}  ${formatTime(entry.lastActivity)}  ${formatBytes(entry.bytes).padStart(9)}  ${title}${entry.live ? "  [\u4F7F\u7528\u4E2D]" : ""}`
      );
    }
  }
  lines.push("");
  if ((options.hiddenCount ?? 0) > 0) {
    lines.push(`\u4EC5\u663E\u793A\u524D ${limited.length} \u6761\uFF08\u5171 ${options.totalCount} \u6761\uFF09\uFF1B/clean list --limit 0 \u67E5\u770B\u5168\u90E8`);
  }
  lines.push("\u5220\u9664\u6307\u5B9A\u4F1A\u8BDD\uFF1A/clean 1 3 5\uFF08\u6C38\u4E45\u5220\u9664\uFF0C\u4E0D\u53EF\u6062\u590D\uFF09");
  lines.push("\u6279\u91CF\u5220\u9664\uFF1A/clean --older-than 30d \u5148\u9884\u89C8\uFF0C\u786E\u8BA4\u540E\u52A0 --yes");
  return { text: lines.join("\n"), displayed };
}
function formatDeleteReport(deleted, bytes, failed) {
  const lines = [];
  if (deleted.length > 0) {
    lines.push(`\u5DF2\u6C38\u4E45\u5220\u9664 ${deleted.length} \u4E2A\u4F1A\u8BDD\uFF0C\u91CA\u653E ${formatBytes(bytes)}`);
    const show = deleted.slice(0, 10);
    for (const entry of show) {
      lines.push(`  - ${truncate(entry.title ?? "(\u65E0\u6807\u9898)", 48)}\uFF08${truncate(entry.cwd ?? "\u65E0\u5DE5\u4F5C\u76EE\u5F55", 60)}\uFF09`);
    }
    if (deleted.length > show.length) lines.push(`  \u2026\u4EE5\u53CA\u53E6\u5916 ${deleted.length - show.length} \u4E2A`);
  } else {
    lines.push("\u6CA1\u6709\u5220\u9664\u4EFB\u4F55\u4F1A\u8BDD\u3002");
  }
  if (failed.length > 0) {
    lines.push("", `\u5931\u8D25 ${failed.length} \u4E2A\uFF1A`);
    for (const failure of failed.slice(0, 10)) {
      lines.push(`  - ${failure.entry.id}\uFF1A${failure.reason}`);
    }
    if (failed.length > 10) lines.push(`  \u2026\u4EE5\u53CA\u53E6\u5916 ${failed.length - 10} \u4E2A`);
  }
  return lines.join("\n");
}
function formatPreview(entries, olderThanText, emptyOnly) {
  const bytes = entries.reduce((sum, entry) => sum + entry.bytes, 0);
  const lines = [
    `\u5C06\u6C38\u4E45\u5220\u9664 ${entries.length} \u4E2A\u4F1A\u8BDD\uFF0C\u91CA\u653E ${formatBytes(bytes)}` + (olderThanText === void 0 ? "" : `\uFF08\u6761\u4EF6\uFF1A${olderThanText} \u4E4B\u524D\uFF09`) + (emptyOnly ? "\uFF08\u6761\u4EF6\uFF1A\u65E0\u7528\u6237\u6D88\u606F\uFF09" : ""),
    ""
  ];
  for (const entry of entries.slice(0, 15)) {
    lines.push(`  - ${truncate(entry.title ?? "(\u65E0\u6807\u9898)", 48)}  ${formatTime(entry.lastActivity)}  ${formatBytes(entry.bytes)}`);
  }
  if (entries.length > 15) lines.push(`  \u2026\u4EE5\u53CA\u53E6\u5916 ${entries.length - 15} \u4E2A`);
  lines.push("", "\u4EE5\u4E0A\u4F1A\u8BDD\u4E0D\u4F1A\u88AB\u7ACB\u5373\u5220\u9664\u3002\u786E\u8BA4\u540E\u91CD\u65B0\u6267\u884C\u5E76\u52A0\u4E0A --yes\uFF1A");
  const condition = emptyOnly ? "--empty" : olderThanText === void 0 ? "--all" : `--older-than ${olderThanText}`;
  lines.push(`  /clean ${condition} --yes`);
  return lines.join("\n");
}

// src/clean/parse.ts
var LIST_WORDS = /* @__PURE__ */ new Set(["list", "ls", "\u6E05\u5355"]);
var HELP_WORDS = /* @__PURE__ */ new Set(["help", "--help", "-h", "?"]);
var REQUEST_TOKEN = /^[A-Za-z0-9_-]{8,64}$/u;
function parseDuration(input) {
  const match = /^(\d+(?:\.\d+)?)\s*([dhms]?)$/iu.exec(input.trim());
  if (match === null) return void 0;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return void 0;
  const rawUnit = match[2] ?? "";
  const unit = rawUnit === "" ? "d" : rawUnit.toLowerCase();
  const factor = unit === "d" ? 864e5 : unit === "h" ? 36e5 : unit === "m" ? 6e4 : 1e3;
  return Math.round(amount * factor);
}
function parseCleanInput(rawInput) {
  const errors = [];
  const indices = [];
  const ids = [];
  let viaIds = false;
  let yes = false;
  let all = false;
  let empty = false;
  let olderThanMs;
  let olderThanText;
  let project;
  let limit;
  let requestToken;
  let listIntent = false;
  let help = false;
  const tokens = rawInput.trim().split(/\s+/u).filter((token) => token !== "");
  const flagValue = (token, flag, index) => {
    if (token !== flag) return { value: token.slice(token.indexOf("=") + 1), consumed: false };
    const next = tokens[index + 1];
    if (next === void 0 || next.startsWith("--")) {
      errors.push(`${flag} \u9700\u8981\u4E00\u4E2A\u503C`);
      return { consumed: false };
    }
    return { value: next, consumed: true };
  };
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (HELP_WORDS.has(token.toLowerCase())) {
      help = true;
      continue;
    }
    if (LIST_WORDS.has(token.toLowerCase())) {
      listIntent = true;
      continue;
    }
    if (token === "--yes" || token === "-y") {
      yes = true;
      continue;
    }
    if (token === "--all") {
      all = true;
      continue;
    }
    if (token === "--empty") {
      empty = true;
      continue;
    }
    if (token === "--older-than" || token.startsWith("--older-than=")) {
      const parsed = flagValue(token, "--older-than", index);
      if (parsed.consumed) index += 1;
      if (parsed.value === void 0) continue;
      const duration = parseDuration(parsed.value);
      if (duration === void 0) errors.push(`\u65E0\u6CD5\u8BC6\u522B\u7684\u65F6\u95F4\u8303\u56F4\uFF1A${parsed.value}\uFF08\u793A\u4F8B\uFF1A30d\u300112h\u300190m\uFF09`);
      else {
        olderThanMs = duration;
        olderThanText = parsed.value;
      }
      continue;
    }
    if (token === "--ids" || token.startsWith("--ids=")) {
      const parsed = flagValue(token, "--ids", index);
      if (parsed.consumed) index += 1;
      if (parsed.value === void 0) continue;
      const parts = parsed.value.split(",").map((part) => part.trim()).filter(Boolean);
      if (parts.length === 0) errors.push("--ids \u9700\u8981\u4E00\u4E2A\u6216\u591A\u4E2A\u4F1A\u8BDD id");
      else {
        ids.push(...parts);
        viaIds = true;
      }
      continue;
    }
    if (token === "--request" || token.startsWith("--request=")) {
      const parsed = flagValue(token, "--request", index);
      if (parsed.consumed) index += 1;
      if (parsed.value === void 0) continue;
      if (!REQUEST_TOKEN.test(parsed.value)) errors.push("\u65E0\u6548\u7684\u8BF7\u6C42\u6807\u8BB0");
      else requestToken = parsed.value;
      continue;
    }
    if (token === "--project" || token.startsWith("--project=")) {
      const parsed = flagValue(token, "--project", index);
      if (parsed.consumed) index += 1;
      if (parsed.value !== void 0) project = parsed.value;
      continue;
    }
    if (token === "--limit" || token.startsWith("--limit=")) {
      const parsed = flagValue(token, "--limit", index);
      if (parsed.consumed) index += 1;
      if (parsed.value === void 0) continue;
      if (!/^\d+$/u.test(parsed.value)) errors.push(`--limit \u9700\u8981\u975E\u8D1F\u6574\u6570\uFF0C\u6536\u5230\uFF1A${parsed.value}`);
      else limit = Number(parsed.value);
      continue;
    }
    if (token.startsWith("--")) {
      errors.push(`\u672A\u77E5\u53C2\u6570\uFF1A${token}`);
      continue;
    }
    for (const part of token.split(",").filter(Boolean)) {
      if (part.startsWith("#")) {
        const value = part.slice(1);
        if (/^\d+$/u.test(value)) indices.push(Number(value));
        else errors.push(`\u65E0\u6CD5\u8BC6\u522B\u7684\u5E8F\u53F7\uFF1A${part}`);
        continue;
      }
      if (/^\d+$/u.test(part)) {
        indices.push(Number(part));
        continue;
      }
      ids.push(part);
    }
  }
  if (help) {
    return { mode: "help", indices: [], ids: [], viaIds: false, yes, all, empty, errors };
  }
  if (indices.length > 0 && ids.length > 0) errors.push("\u5E8F\u53F7\u4E0E\u4F1A\u8BDD id \u4E0D\u80FD\u6DF7\u7528");
  const batchRequested = all || empty || olderThanMs !== void 0;
  const selectors = [all, empty, olderThanMs !== void 0].filter(Boolean).length;
  if (selectors > 1) errors.push("--all\u3001--empty\u3001--older-than \u53EA\u80FD\u9009\u4E00\u4E2A");
  if (batchRequested && (indices.length > 0 || ids.length > 0)) errors.push("\u6279\u91CF\u6761\u4EF6\u4E0D\u80FD\u4E0E\u5E8F\u53F7/id \u540C\u65F6\u4F7F\u7528");
  if (batchRequested && listIntent) errors.push("list \u4E0D\u80FD\u4E0E\u6279\u91CF\u6761\u4EF6\u540C\u65F6\u4F7F\u7528");
  if (listIntent && (indices.length > 0 || ids.length > 0)) errors.push("list \u4E0D\u80FD\u4E0E\u5E8F\u53F7/id \u540C\u65F6\u4F7F\u7528");
  if (yes && !batchRequested && !viaIds) errors.push("--yes \u53EA\u7528\u4E8E\u6279\u91CF\u6E05\u7406\u6216 --ids");
  if (requestToken !== void 0 && !viaIds) errors.push("--request \u53EA\u80FD\u4E0E --ids \u4E00\u8D77\u4F7F\u7528");
  const mode = indices.length > 0 || ids.length > 0 ? "select" : batchRequested ? "batch" : "list";
  if (limit !== void 0 && mode !== "list") errors.push("--limit \u4EC5\u7528\u4E8E\u6E05\u5355");
  if (project !== void 0 && mode === "select") errors.push("--project \u4E0D\u80FD\u4E0E\u5E8F\u53F7/id \u540C\u65F6\u4F7F\u7528");
  return {
    mode,
    indices,
    ids,
    viaIds,
    yes,
    all,
    empty,
    ...olderThanMs === void 0 ? {} : { olderThanMs },
    ...olderThanText === void 0 ? {} : { olderThanText },
    ...project === void 0 ? {} : { project },
    ...limit === void 0 ? {} : { limit },
    ...requestToken === void 0 ? {} : { requestToken },
    errors
  };
}
var CLEAN_USAGE = [
  "/clean \u7528\u6CD5",
  "  /clean [list] [--limit N] [--project \u5173\u952E\u5B57]   \u5217\u51FA\u5386\u53F2\u4F1A\u8BDD\uFF08\u9ED8\u8BA4\u524D 40 \u6761\uFF1B--limit 0 \u4E3A\u5168\u90E8\uFF09",
  "  /clean 3 5 7                                  \u6C38\u4E45\u5220\u9664\u6E05\u5355\u4E2D\u5E8F\u53F7\u4E3A 3\u30015\u30017 \u7684\u4F1A\u8BDD",
  "  /clean <id \u524D\u7F00>                              \u6309\u4F1A\u8BDD id \u524D\u7F00\u5220\u9664",
  "  /clean --older-than 30d [--yes]               \u5220\u9664 30 \u5929\u524D\u7684\u4F1A\u8BDD\uFF08\u4E0D\u5E26 --yes \u53EA\u9884\u89C8\uFF09",
  "  /clean --empty [--yes]                        \u5220\u9664\u6CA1\u6709\u4EFB\u4F55\u7528\u6237\u6D88\u606F\u7684\u4F1A\u8BDD",
  "  /clean --all [--yes]                          \u5220\u9664\u5168\u90E8\u975E\u6D3B\u8DC3\u4F1A\u8BDD",
  "",
  "\u684C\u9762\u7AEF\u76F4\u63A5\u8F93\u5165 /clean \u4F1A\u6253\u5F00\u53EF\u89C6\u5316\u7684\u52FE\u9009\u9762\u677F\u3002",
  "\u6CE8\u610F\uFF1A\u5220\u9664\u4E0D\u53EF\u6062\u590D\uFF1B\u6B63\u5728\u4F7F\u7528\u4E2D\u7684\u4F1A\u8BDD\u6C38\u8FDC\u4E0D\u4F1A\u88AB\u5220\u9664\u3002"
].join("\n");

// src/clean/archived.ts
function archivedSessionIds(ctx) {
  const registry = service(ctx, "workspaceRegistry");
  if (registry === void 0) return /* @__PURE__ */ new Set();
  try {
    return new Set(registry.archivedSessionIds.map(String));
  } catch {
    return /* @__PURE__ */ new Set();
  }
}

// src/clean/summary.ts
var CACHE_TTL_MS = 3e4;
var BUCKET_DAYS = [30, 90];
var cache;
async function buildSummary(ctx, options = {}) {
  const cached = cache;
  if (options.fresh !== true && cached !== void 0 && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;
  const entries = await collectEntries(ctx);
  const top = entries.filter((entry) => !entry.subagent);
  const deletable = top.filter((entry) => !entry.live);
  const archived = archivedSessionIds(ctx);
  const archivedEntries = deletable.filter((entry) => archived.has(entry.id));
  const now = Date.now();
  const total = (items) => items.reduce((sum, item) => sum + item.bytes, 0);
  const value = {
    ok: true,
    generatedAt: now,
    totals: {
      sessions: top.length,
      bytes: total(top),
      live: top.length - deletable.length
    },
    archived: { count: archivedEntries.length, bytes: total(archivedEntries) },
    buckets: BUCKET_DAYS.map((days) => {
      const matched = deletable.filter((entry) => now - entry.lastActivity >= days * 864e5);
      return { days, count: matched.length, bytes: total(matched) };
    }),
    all: { count: deletable.length, bytes: total(deletable) }
  };
  cache = { at: now, value };
  return value;
}
function resetSummaryCache() {
  cache = void 0;
}

// src/clean/command.ts
var SNAPSHOT_TTL_MS = 15 * 6e4;
var SnapshotStore = class {
  snapshots = /* @__PURE__ */ new Map();
  /**
   * 记录一次清单展示的序号顺序。
   * @param agentId 接收命令的 agent（会话）id。
   * @param ids 按序号排列的会话 id。
   */
  save(agentId, ids) {
    this.snapshots.set(agentId, { at: Date.now(), ids: [...ids] });
  }
  /**
   * 取回未过期的序号快照。
   * @param agentId agent id。
   * @returns 快照，或 undefined（未生成/已过期）。
   */
  resolve(agentId) {
    const snapshot = this.snapshots.get(agentId);
    if (snapshot === void 0) return void 0;
    if (Date.now() - snapshot.at > SNAPSHOT_TTL_MS) {
      this.snapshots.delete(agentId);
      return void 0;
    }
    return snapshot;
  }
  /** 删除后让旧序号失效。 */
  clear(agentId) {
    this.snapshots.delete(agentId);
  }
};
function error(text) {
  return { kind: "error", text };
}
async function runCleanCommand(ctx, snapshots, results, invocation) {
  const args = parseCleanInput(invocation.rawInput);
  if (args.errors.length > 0) return error(`${args.errors.join("\n")}

${CLEAN_USAGE}`);
  if (args.mode === "help") return { kind: "success", text: CLEAN_USAGE };
  if (invocation.signal.aborted) return error("\u5DF2\u53D6\u6D88\u3002");
  const agentId = String(invocation.agent.id);
  let entries;
  try {
    entries = await collectEntries(ctx, { signal: invocation.signal });
  } catch (cause) {
    return error(cause instanceof Error ? cause.message : String(cause));
  }
  if (args.mode === "list") {
    const keyword = args.project;
    const filtered = keyword === void 0 ? entries : entries.filter((entry) => matchesProjectKeyword(entry, keyword));
    const sorted = [...filtered].sort((left, right) => right.lastActivity - left.lastActivity);
    const limit = args.limit ?? 40;
    const limited = limit > 0 ? sorted.slice(0, limit) : sorted;
    await attachTitles(ctx, [...limited], invocation.signal);
    const inventory = formatInventory(limited, {
      limit: 0,
      totalCount: filtered.length,
      totalBytes: filtered.reduce((sum, entry) => sum + entry.bytes, 0),
      liveCount: filtered.filter((entry) => entry.live).length,
      hiddenCount: filtered.length - limited.length
    });
    snapshots.save(agentId, inventory.displayed.map((entry) => entry.id));
    return { kind: "success", text: inventory.text };
  }
  if (args.mode === "select") {
    const selected = /* @__PURE__ */ new Set();
    if (args.indices.length > 0) {
      const snapshot = snapshots.resolve(agentId);
      if (snapshot === void 0) {
        return error("\u6CA1\u6709\u53EF\u7528\u7684\u6E05\u5355\u5FEB\u7167\uFF08\u53EF\u80FD\u5DF2\u8FC7\u671F\uFF09\u3002\u8BF7\u5148\u6267\u884C /clean list\uFF0C\u518D\u6309\u6E05\u5355\u91CC\u7684\u5E8F\u53F7\u5220\u9664\u3002");
      }
      const outOfRange = args.indices.filter((index) => !Number.isInteger(index) || index < 1 || index > snapshot.ids.length);
      if (outOfRange.length > 0) {
        return error(`\u5E8F\u53F7\u8D85\u51FA\u8303\u56F4\uFF1A${outOfRange.join(", ")}\uFF08\u5F53\u524D\u6E05\u5355\u5171 ${snapshot.ids.length} \u6761\uFF09`);
      }
      for (const index of args.indices) {
        const id = snapshot.ids[index - 1];
        if (id !== void 0) selected.add(id);
      }
    }
    const missing = [];
    for (const raw of args.ids) {
      const exact = entries.find((entry) => entry.id === raw);
      if (exact !== void 0) {
        selected.add(exact.id);
        continue;
      }
      const matches = entries.filter((entry) => entry.id.startsWith(raw));
      if (matches.length === 0) {
        missing.push(raw);
        continue;
      }
      if (matches.length > 1) {
        const sample = matches.slice(0, 5).map((entry) => entry.id).join("\n  ");
        return error(`id \u524D\u7F00 ${raw} \u5339\u914D\u5230 ${matches.length} \u4E2A\u4F1A\u8BDD\uFF0C\u8BF7\u8F93\u5165\u66F4\u957F\u524D\u7F00\uFF1A
  ${sample}`);
      }
      const match = matches[0];
      if (match !== void 0) selected.add(match.id);
    }
    if (args.viaIds) {
      if (selected.size === 0) return error(`\u9009\u4E2D\u7684\u4F1A\u8BDD\u90FD\u4E0D\u5B58\u5728\u4E86\uFF1A${missing.join(", ")}`);
    } else if (missing.length > 0) {
      return error(`\u627E\u4E0D\u5230\u8FD9\u4E9B\u4F1A\u8BDD\uFF1A${missing.join(", ")}\uFF08\u53EF\u80FD\u5DF2\u88AB\u5220\u9664\uFF09`);
    }
    const targets = entries.filter((entry) => selected.has(entry.id));
    if (targets.length === 0) return error("\u6CA1\u6709\u53EF\u5220\u9664\u7684\u4F1A\u8BDD\u3002");
    await attachTitles(ctx, targets, invocation.signal);
    const outcome2 = await deleteSessions(ctx, entries, targets, { via: "command" });
    snapshots.clear(agentId);
    resetSummaryCache();
    if (args.requestToken !== void 0) rememberResult(results, args.requestToken, outcome2);
    const missingNote = missing.length > 0 ? `
\u53E6\u5916 ${missing.length} \u4E2A\u4F1A\u8BDD\u5DF2\u4E0D\u5B58\u5728\uFF0C\u5DF2\u8DF3\u8FC7\u3002` : "";
    const text2 = withWarnings(formatDeleteReport(outcome2.deleted, outcome2.bytes, outcome2.failed), outcome2.warnings) + missingNote;
    return outcome2.deleted.length > 0 ? { kind: "success", text: text2 } : error(text2);
  }
  const deletablePool = entries.filter((entry) => !entry.live && !entry.subagent);
  if (args.empty === true) {
    try {
      await markBlank(ctx, deletablePool, invocation.signal);
    } catch (cause) {
      return error(cause instanceof Error ? cause.message : String(cause));
    }
  }
  const matched = selectBatch(entries, {
    ...args.olderThanMs === void 0 ? {} : { olderThanMs: args.olderThanMs },
    ...args.empty ? { empty: true } : {},
    ...args.all ? { all: true } : {},
    ...args.project === void 0 ? {} : { project: args.project }
  }, Date.now());
  if (matched.length === 0) return { kind: "success", text: "\u6CA1\u6709\u7B26\u5408\u6761\u4EF6\u7684\u4F1A\u8BDD\u3002" };
  await attachTitles(ctx, [...matched], invocation.signal);
  if (args.yes !== true) {
    return { kind: "success", text: formatPreview(matched, args.olderThanText, args.empty) };
  }
  const outcome = await deleteSessions(ctx, entries, matched, { via: "command" });
  snapshots.clear(agentId);
  resetSummaryCache();
  if (args.requestToken !== void 0) rememberResult(results, args.requestToken, outcome);
  const text = withWarnings(formatDeleteReport(outcome.deleted, outcome.bytes, outcome.failed), outcome.warnings);
  return outcome.deleted.length > 0 ? { kind: "success", text } : error(text);
}
function rememberResult(results, token, outcome) {
  results.remember(token, {
    deleted: outcome.deleted.map((entry) => ({
      id: entry.id,
      title: entry.title ?? null,
      cwd: entry.cwd ?? null
    })),
    failed: outcome.failed.map((item) => ({ id: item.entry.id, reason: item.reason })),
    bytes: outcome.bytes
  });
}
function withWarnings(text, warnings) {
  if (warnings.length === 0) return text;
  return `${text}

\u6CE8\u610F\uFF1A${warnings.join("\uFF1B")}`;
}

// src/clean/results.ts
var TTL_MS = 5 * 6e4;
var MAX_ENTRIES = 50;
var ResultStore = class {
  entries = /* @__PURE__ */ new Map();
  /**
   * 登记一次删除结果。
   * @param token 客户端请求标记。
   * @param value 删除结果。
   */
  remember(token, value) {
    this.entries.set(token, { at: Date.now(), value });
    while (this.entries.size > MAX_ENTRIES) {
      const oldest = this.entries.keys().next().value;
      if (oldest === void 0) break;
      this.entries.delete(oldest);
    }
  }
  /**
   * 取回删除结果（过期返回 undefined）。
   * @param token 客户端请求标记。
   * @returns 删除结果。
   */
  get(token) {
    const entry = this.entries.get(token);
    if (entry === void 0) return void 0;
    if (Date.now() - entry.at > TTL_MS) {
      this.entries.delete(token);
      return void 0;
    }
    return entry.value;
  }
};

// src/clean/scope.ts
var MAX_ROWS = 500;
var DAY = 864e5;
var SCOPE_DAYS = { "30d": 30, "90d": 90 };
function isCleanScope(value) {
  return value === "all" || value === "archived" || value === "30d" || value === "90d" || value === "empty";
}
async function buildSessionScope(ctx, options, signal) {
  const entries = await collectEntries(ctx, { signal });
  const top = entries.filter((entry) => !entry.subagent);
  const now = Date.now();
  let base;
  if (options.scope === "all") {
    base = top;
  } else if (options.scope === "archived") {
    const archived = archivedSessionIds(ctx);
    base = top.filter((entry) => !entry.live && archived.has(entry.id));
    try {
      await markBlank(ctx, base, signal);
    } catch {
    }
  } else if (options.scope === "empty") {
    const candidates = top.filter((entry) => !entry.live);
    await markBlank(ctx, candidates, signal);
    base = candidates.filter((entry) => entry.blank === true);
  } else {
    const days = SCOPE_DAYS[options.scope];
    base = top.filter((entry) => !entry.live && now - entry.lastActivity >= days * DAY);
  }
  await attachTitles(ctx, base, signal);
  const sorted = [...base].sort((left, right) => right.lastActivity - left.lastActivity);
  const limited = sorted.slice(0, MAX_ROWS);
  const totalBytes = sorted.reduce((sum, entry) => sum + entry.bytes, 0);
  const live = sorted.filter((entry) => entry.live).length;
  return {
    ok: true,
    scope: options.scope,
    preselect: options.preselect,
    generatedAt: now,
    totals: { count: sorted.length, bytes: totalBytes, live },
    ...sorted.length > limited.length ? { truncated: true } : {},
    rows: limited.map((entry) => ({
      id: entry.id,
      ...entry.title === void 0 ? {} : { title: entry.title },
      ...entry.cwd === void 0 ? {} : { cwd: entry.cwd },
      createdAt: entry.createdAt,
      lastActivity: entry.lastActivity,
      bytes: entry.bytes,
      live: entry.live,
      ...entry.blank === void 0 ? {} : { blank: entry.blank },
      suggested: options.preselect === "suggested" && !entry.live
    }))
  };
}

// src/init/index.ts
import { resolve } from "node:path";

// src/init/prompt.ts
import { join as join3 } from "node:path";

// src/init/message.ts
import { randomUUID } from "node:crypto";
function deepFreeze(value) {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}
function freezeMessage(message) {
  return deepFreeze(structuredClone(message));
}
function createUserMessage(input) {
  return freezeMessage({
    ...input,
    id: randomUUID(),
    role: "user"
  });
}

// src/init/prompt.ts
function buildInitTaskText(scan, userInput) {
  const extra = userInput.trim();
  const target = join3(scan.root, "AGENTS.md");
  return [
    "# Task: generate or update AGENTS.md for this repository",
    "",
    "Create or update the repository-root `AGENTS.md`. AGENTS.md is dsh's native",
    "project instruction file: it is loaded into the agent context every session,",
    "subject to byte-budget truncation, so it must stay concise and factual.",
    "",
    `The repository root for this task is this exact absolute directory: ${scan.root}`,
    `The file to create or update is at this exact absolute path: ${target}`,
    "Write only to that path. Never place AGENTS.md in a subdirectory or in a nested",
    "Git repository \u2014 the scanned root above is authoritative.",
    "",
    "Cover the sections that apply to this repository (skip what does not):",
    "1. **Project overview** \u2014 what this repository is, two or three sentences.",
    "2. **Common commands** \u2014 install, build, test, lint, run, using the exact",
    "   scripts declared in package.json.",
    "3. **Code style conventions** \u2014 formatting, language, naming, import rules,",
    "   enforcement tools.",
    "4. **Architecture notes** \u2014 layout, key modules and how they relate, known",
    "   extension points or seams.",
    "5. **Important cautions** \u2014 invariants, secrets, required gates or build",
    "   steps that must not be skipped.",
    "",
    "Process:",
    "- Read the scan summary below, then read key files yourself (README,",
    "  package.json, configs) to verify or extend it.",
    "- If an AGENTS.md already exists, ask the user first how to proceed",
    "  (overwrite / merge / append / skip) and wait for the answer.",
    "- Ask the user one to three short questions about anything ambiguous before",
    "  writing (language, audience, missing sections).",
    "- Write the file with your normal file tools. Keep it under ~200 lines, one",
    "  fact per line, no project history narration.",
    "- After writing, summarize what you produced and offer refinements; the user",
    "  can keep asking for changes.",
    "",
    extra === "" ? "" : `User's extra request: ${extra}`,
    "",
    "--- Repository scan summary ---",
    scan.summary
  ].filter((line) => line !== "").join("\n");
}
function buildInitMessage(scan, userInput) {
  return createUserMessage({
    content: [{ type: "text", text: buildInitTaskText(scan, userInput) }],
    source: {
      kind: "dsh-extend",
      form: "notice",
      summary: "Generate or update the repository AGENTS.md (init)."
    }
  });
}

// src/init/scan.ts
import { readdir as readdir2, readFile } from "node:fs/promises";
import { join as join4 } from "node:path";
var DEFAULT_IGNORES = [
  ".git",
  "node_modules",
  ".dsh-shots",
  ".pnpm-store",
  ".npm-cache",
  ".cache",
  ".turbo",
  ".next",
  "dist",
  "build",
  "out",
  "coverage",
  "lib",
  "tmp",
  ".scratch"
];
var CONFIG_CANDIDATES = [
  "tsconfig.json",
  "tsconfig.base.json",
  "tsconfig.host.json",
  "tsconfig.client.json",
  "pnpm-workspace.yaml",
  "eslint.config.js",
  "eslint.config.mjs",
  "eslint.config.ts",
  ".eslintrc.json",
  ".gitignore",
  ".prettierrc.json",
  "vitest.config.ts",
  "vitest.shared.ts",
  "CONTRIBUTING.md",
  "SAFETY.md",
  "lefthook.yml"
];
var README_CANDIDATES = ["README.md", "README.zh.md", "readme.md"];
function byteLength(text) {
  return Buffer.byteLength(text, "utf8");
}
function sliceToBytes(text, budget) {
  if (byteLength(text) <= budget) return text;
  let bytes = 0;
  let end = 0;
  for (; end < text.length; end++) {
    const code = text.charCodeAt(end);
    const size = code < 128 ? 1 : code < 2048 ? 2 : code < 55296 || code >= 57344 ? 3 : 4;
    if (bytes + size > budget) break;
    bytes += size;
  }
  const last = charCodeAtSafe(text, end - 1);
  if (last >= 55296 && last < 56320) end--;
  return text.slice(0, end);
}
function charCodeAtSafe(text, index) {
  return index < 0 ? -1 : text.charCodeAt(index);
}
function cutToBytes(text, budget, label) {
  if (byteLength(text) <= budget) return { text, cut: false };
  const comment = `
\u2026 (${label} truncated at ${budget} bytes)`;
  const contentBudget = Math.max(0, budget - byteLength(comment));
  return { text: sliceToBytes(text, contentBudget) + comment, cut: true };
}
var COLLAPSE_AT = 40;
async function renderTree(root, ignores, maxTreeEntries, maxDepth, maxTreeBytes) {
  const lines = [];
  let truncated = false;
  let bytes = 0;
  async function walk(dir, depth, prefix) {
    if (depth > maxDepth || lines.length >= maxTreeEntries) {
      truncated = true;
      return;
    }
    let entries;
    try {
      entries = (await readdir2(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
    } catch {
      return;
    }
    for (const entry of entries) {
      if (lines.length >= maxTreeEntries) {
        truncated = true;
        return;
      }
      if (entry.isDirectory() && ignores.has(entry.name)) continue;
      const childPrefix = `${prefix}${entry.name}/`;
      if (entry.isDirectory()) {
        let childCount;
        try {
          if (depth <= 1) {
            childCount = (await readdir2(join4(dir, entry.name), { withFileTypes: true })).length;
          }
        } catch {
          childCount = void 0;
        }
        const line2 = childCount !== void 0 && childCount > COLLAPSE_AT ? `${childPrefix} (collapsed, ${childCount} entries)` : childPrefix;
        const lineBytes2 = byteLength(line2) + 1;
        if (bytes + lineBytes2 > maxTreeBytes) {
          truncated = true;
          return;
        }
        bytes += lineBytes2;
        lines.push(line2);
        if (childCount === void 0 || childCount <= COLLAPSE_AT) {
          await walk(join4(dir, entry.name), depth + 1, childPrefix);
        }
        continue;
      }
      const line = `${prefix}${entry.name}`;
      const lineBytes = byteLength(line) + 1;
      if (bytes + lineBytes > maxTreeBytes) {
        truncated = true;
        return;
      }
      bytes += lineBytes;
      lines.push(line);
    }
  }
  await walk(root, 0, "");
  if (lines.length >= maxTreeEntries) truncated = true;
  return { tree: lines.join("\n"), truncated };
}
async function readFirst(root, candidates) {
  for (const name2 of candidates) {
    try {
      return await readFile(join4(root, name2), "utf8");
    } catch {
    }
  }
  return null;
}
function packageJsonDigest(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return raw.slice(0, 4e3);
  }
  if (typeof parsed !== "object" || parsed === null) return "";
  const record = parsed;
  const pick = (keys) => {
    const out = {};
    for (const key of keys) {
      if (record[key] !== void 0) out[key] = record[key];
    }
    return out;
  };
  const digest = pick(["name", "description", "version", "type", "engines", "private", "workspaces"]);
  const scripts = record.scripts;
  const deps = record.dependencies;
  const devDeps = record.devDependencies;
  return JSON.stringify({ ...digest, scripts, dependencies: deps, devDependencies: devDeps }, null, 2);
}
async function scanProject(root, options = {}) {
  const ignores = new Set(options.ignore ?? DEFAULT_IGNORES);
  const maxTreeEntries = options.maxTreeEntries ?? 1200;
  const maxDepth = options.maxDepth ?? 6;
  const maxTreeBytes = options.maxTreeBytes ?? 6e3;
  const maxSummaryBytes = options.maxSummaryBytes ?? 24e3;
  const maxReadmeBytes = options.maxReadmeBytes ?? 8e3;
  const maxAgentsBytes = options.maxAgentsBytes ?? 12e3;
  const maxConfigBytes = options.maxConfigBytes ?? 4e3;
  let truncated = false;
  const { tree: rawTree, truncated: treeTruncated } = await renderTree(
    root,
    ignores,
    maxTreeEntries,
    maxDepth,
    maxTreeBytes
  );
  truncated ||= treeTruncated;
  const { text: tree, cut: treeCut } = cutToBytes(rawTree, maxTreeBytes, "tree");
  truncated ||= treeCut;
  let readme = "";
  {
    const raw = await readFirst(root, README_CANDIDATES);
    if (raw !== null) {
      const { text: text2, cut: cut2 } = cutToBytes(raw, maxReadmeBytes, "README");
      readme = text2;
      truncated ||= cut2;
    }
  }
  let packageJson = "";
  {
    try {
      const raw = await readFile(join4(root, "package.json"), "utf8");
      packageJson = packageJsonDigest(raw);
    } catch {
      packageJson = "";
    }
  }
  let configs = "";
  for (const name2 of CONFIG_CANDIDATES) {
    try {
      const raw = await readFile(join4(root, name2), "utf8");
      const { text: text2, cut: cut2 } = cutToBytes(raw, maxConfigBytes, name2);
      configs += `### ${name2}

${text2}

`;
      truncated ||= cut2;
    } catch {
    }
  }
  let existingAgents = "";
  {
    const raw = await readFirst(root, ["AGENTS.md"]);
    if (raw !== null) {
      const { text: text2, cut: cut2 } = cutToBytes(raw, maxAgentsBytes, "AGENTS.md");
      existingAgents = text2;
      truncated ||= cut2;
    }
  }
  const parts = [
    `## Repository scan summary (${root})`,
    ""
  ];
  if (packageJson !== "") {
    parts.push("### package.json", "", "```json", packageJson, "```", "");
  }
  if (configs !== "") {
    parts.push("### Selected config files", "", configs);
  }
  if (existingAgents !== "") {
    parts.push("### Existing AGENTS.md", "", existingAgents, "");
  }
  if (readme !== "") {
    parts.push("### README excerpt", "", readme, "");
  }
  parts.push("### Directory tree", "", "```text", tree, "```", "");
  let summary = parts.join("\n");
  const { text, cut } = cutToBytes(summary, maxSummaryBytes, "summary");
  summary = text;
  truncated ||= cut;
  return {
    root,
    tree,
    readme,
    packageJson,
    configs,
    existingAgents,
    summary,
    truncated
  };
}

// src/init/index.ts
function resolveScanRoot(configRoot, sessionCwd, policyRoot, cwd) {
  return resolve(configRoot ?? sessionCwd ?? policyRoot ?? cwd);
}
function sandboxPolicyRoot(ctx) {
  return service(ctx, "sandboxPolicy")?.workspaceRoot;
}
function registerInit(ctx) {
  ctx.inject(["commands"], (scope) => {
    const commands = scope.commands;
    if (commands === void 0) return;
    scope.effect(() => commands.register({
      name: "init",
      description: "\u751F\u6210\u6216\u66F4\u65B0\u4ED3\u5E93\u6839\u76EE\u5F55\u7684 AGENTS.md\uFF08Claude Code /init \u98CE\u683C\uFF09",
      input: { hint: "[\u53EF\u9009\u8BF4\u660E]" },
      handler: async ({ agent, rawInput, signal }) => {
        if (signal.aborted) return { kind: "error", text: "\u5DF2\u53D6\u6D88\u3002" };
        const scanRoot = resolveScanRoot(void 0, agent.session?.header?.cwd, sandboxPolicyRoot(ctx), process.cwd());
        let scan;
        try {
          scan = await scanProject(scanRoot);
        } catch (error2) {
          return {
            kind: "error",
            text: `\u626B\u63CF\u4ED3\u5E93\u5931\u8D25\uFF1A${error2 instanceof Error ? error2.message : String(error2)}`
          };
        }
        try {
          agent.steer(buildInitMessage(scan, rawInput));
        } catch (error2) {
          return {
            kind: "error",
            text: `\u65E0\u6CD5\u628A\u4EFB\u52A1\u4EA4\u529E\u7ED9\u5F53\u524D\u4F1A\u8BDD\uFF1A${error2 instanceof Error ? error2.message : String(error2)}`
          };
        }
        return {
          kind: "success",
          text: "\u5DF2\u5F00\u59CB\u751F\u6210 AGENTS.md\uFF1A\u667A\u80FD\u4F53\u4F1A\u5148\u8BFB\u53D6\u4ED3\u5E93\u6458\u8981\uFF0C\u518D\u6309\u9700\u8BE2\u95EE\u5E76\u5199\u5165\u6587\u4EF6\u3002"
        };
      }
    }), "dsh-extend: /init command");
  });
}

// src/reboot/index.ts
import { spawn as spawn2 } from "node:child_process";
import { access, mkdir as mkdir2, readFile as readFile2, rm as rm2 } from "node:fs/promises";
import { existsSync as existsSync2 } from "node:fs";
import { tmpdir } from "node:os";
import { join as join7 } from "node:path";
import { fileURLToPath as fileURLToPath2 } from "node:url";

// src/window/index.ts
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname as dirname2, join as join6 } from "node:path";
import { fileURLToPath } from "node:url";

// src/window/state.ts
import { homedir as homedir3 } from "node:os";
import { join as join5 } from "node:path";
function windowStatePath(env = process.env) {
  const home = env.DSH_HOME !== void 0 && env.DSH_HOME !== "" ? env.DSH_HOME : join5(homedir3(), ".dsh");
  return join5(home, ".dsh-extend", "window.json");
}

// src/window/index.ts
var SAVE_SCRIPT = fileURLToPath(new URL("./window-save.ps1", import.meta.url));
var RESTORE_SCRIPT = fileURLToPath(new URL("./window-restore.ps1", import.meta.url));
var SAVE_TIMEOUT_MS = 5e3;
function isDesktop() {
  if (process.platform !== "win32" || process.env.ELECTRON_RUN_AS_NODE !== "1") return false;
  const appRoot = dirname2(process.execPath);
  return existsSync(join6(appRoot, "resources", "app.asar")) || existsSync(join6(appRoot, "resources", "app"));
}
function saveWindowStateSync() {
  if (!isDesktop()) return;
  const mainPid = process.ppid;
  if (!Number.isInteger(mainPid) || mainPid <= 1) return;
  try {
    spawnSync("powershell.exe", [
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      SAVE_SCRIPT,
      "-MainPid",
      String(mainPid),
      "-StateFile",
      windowStatePath()
    ], { windowsHide: true, stdio: "ignore", timeout: SAVE_TIMEOUT_MS });
  } catch {
  }
}
function restoreWindowState() {
  if (!isDesktop()) return;
  const mainPid = process.ppid;
  if (!Number.isInteger(mainPid) || mainPid <= 1) return;
  try {
    const child = spawn("powershell.exe", [
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      RESTORE_SCRIPT,
      "-MainPid",
      String(mainPid),
      "-StateFile",
      windowStatePath()
    ], { stdio: "ignore", windowsHide: true });
    child.on("error", () => {
    });
    child.unref();
  } catch {
  }
}
function installWindowState(ctx) {
  if (!isDesktop()) return;
  ctx.effect(() => {
    restoreWindowState();
    return () => {
      saveWindowStateSync();
    };
  }, "dsh-extend: window state");
}

// src/reboot/plan.ts
function planReboot(env) {
  if (env.platform !== "win32") {
    return { ok: false, reason: "\u76EE\u524D\u53EA\u652F\u6301 Windows \u684C\u9762\u7AEF" };
  }
  if (!env.runAsNode) {
    return { ok: false, reason: "\u5F53\u524D\u4E0D\u662F\u5728 DSH \u684C\u9762\u7AEF\u8FDB\u7A0B\u5185\u8FD0\u884C\uFF08/reboot \u53EA\u5728\u684C\u9762\u7AEF\u53EF\u7528\uFF09" };
  }
  const mainPid = env.ppid;
  if (!Number.isInteger(mainPid) || mainPid <= 1) {
    return { ok: false, reason: "\u65E0\u6CD5\u786E\u5B9A Electron \u4E3B\u8FDB\u7A0B PID" };
  }
  if (mainPid === env.pid) {
    return { ok: false, reason: "\u7236\u8FDB\u7A0B\u4E0E\u5F53\u524D\u8FDB\u7A0B\u76F8\u540C\uFF0C\u5DF2\u62D2\u7EDD\u91CD\u542F" };
  }
  const hint = (env.desktopExecutable ?? "").trim() !== "" ? env.desktopExecutable : env.execPath;
  return { ok: true, mainPid, exeHint: hint };
}
function parseRebootInput(rawInput) {
  const errors = [];
  let yes = false;
  let check = false;
  let force = false;
  let help = false;
  for (const token of rawInput.trim().split(/\s+/u).filter(Boolean)) {
    switch (token.toLowerCase()) {
      case "--yes":
      case "-y":
        yes = true;
        break;
      case "--check":
        check = true;
        break;
      case "--force":
        force = true;
        break;
      case "help":
      case "--help":
      case "-h":
        help = true;
        break;
      default:
        errors.push(`\u672A\u77E5\u53C2\u6570\uFF1A${token}`);
    }
  }
  if (check && yes) errors.push("--check \u4E0E --yes \u4E0D\u80FD\u540C\u65F6\u4F7F\u7528");
  if (check && force) errors.push("--check \u4E0E --force \u4E0D\u80FD\u540C\u65F6\u4F7F\u7528");
  const mode = help ? "help" : check ? "check" : "run";
  return { mode, force, errors };
}
var REBOOT_USAGE = [
  "/reboot \u7528\u6CD5",
  "  /reboot            \u7ACB\u5373\u91CD\u542F DSH \u684C\u9762\u7AEF\uFF08\u9ED8\u8BA4\u7B49\u540C --yes\uFF09",
  "  /reboot --check    \u81EA\u68C0\uFF1A\u89E3\u6790\u4E3B\u8FDB\u7A0B PID/\u53EF\u6267\u884C\u6587\u4EF6\u5E76\u542F\u52A8\u5B88\u62A4\u811A\u672C\uFF08\u4E0D\u6740\u8FDB\u7A0B\uFF09",
  "  /reboot --force    \u6709\u4EFB\u52A1\u5728\u8FD0\u884C\u65F6\u4E5F\u5F3A\u5236\u91CD\u542F",
  "  /reboot --yes      \u4E0E\u76F4\u63A5 /reboot \u76F8\u540C\uFF08\u517C\u5BB9\u65E7\u5199\u6CD5\uFF09",
  "",
  "\u8BF4\u660E\uFF1A\u91CD\u542F\u4F1A\u7ED3\u675F\u5F53\u524D\u684C\u9762\u8FDB\u7A0B\u540E\u81EA\u52A8\u62C9\u8D77\uFF1B\u672A\u53D1\u9001\u7684\u8F93\u5165\u6846\u8349\u7A3F\u4F1A\u4E22\u5931\u3002"
].join("\n");

// src/reboot/index.ts
var HELPER_PATH = fileURLToPath2(new URL("./relaunch.mjs", import.meta.url));
var READY_TIMEOUT_MS = 1e4;
var RESULT_TIMEOUT_MS = 3e3;
var RESOLVE_TIMEOUT_MS = 4e3;
function inspectTasks(ctx) {
  const agents = service(ctx, "agents");
  const jobs = service(ctx, "jobs");
  const roster = agents?.list() ?? [];
  const runningAgents = roster.filter((agent) => agent.status === "running" || (agent.inbox?.nextTurn?.length ?? 0) > 0 || (agent.inbox?.nextStep?.length ?? 0) > 0).length;
  let activeJobs = 0;
  if (jobs !== void 0) {
    const count = (list) => list.filter((job) => job.status === "running" || job.status === "stopping").length;
    try {
      activeJobs += count(jobs.list());
    } catch {
    }
    for (const agent of roster) {
      try {
        activeJobs += count(jobs.list(agent.id));
      } catch {
      }
    }
  }
  return { active: runningAgents > 0 || activeJobs > 0, runningAgents, activeJobs };
}
async function flushSessions(ctx) {
  const persistence = service(ctx, "sessionPersistence");
  const store = service(ctx, "sessions");
  const tasks = [];
  if (persistence !== void 0) tasks.push(persistence.flush());
  if (store !== void 0) {
    for (const session of store.list()) tasks.push(store.flush(session));
  }
  await Promise.allSettled(tasks);
}
async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
async function waitForFile(path, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await exists(path)) return true;
    await new Promise((resolve2) => setTimeout(resolve2, 100));
  }
  return false;
}
async function readText(path) {
  try {
    const text = (await readFile2(path, "utf8")).trim();
    return text === "" ? void 0 : text;
  } catch {
    return void 0;
  }
}
async function resolveExecutable(mainPid, fallback) {
  if (process.platform !== "win32") return fallback;
  const resolved = await new Promise((resolve2) => {
    let settled = false;
    let timer;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      if (timer !== void 0) clearTimeout(timer);
      try {
        child.kill();
      } catch {
      }
      resolve2(value);
    };
    const child = spawn2("powershell.exe", [
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      `(Get-Process -Id ${mainPid} -ErrorAction Stop).Path`
    ], { windowsHide: true, stdio: ["ignore", "pipe", "ignore"] });
    let output = "";
    child.stdout?.setEncoding("utf8");
    child.stdout?.on("data", (chunk) => {
      output += chunk;
    });
    child.on("error", () => finish(void 0));
    child.on("exit", () => {
      const path = output.trim();
      finish(path !== "" && existsSync2(path) ? path : void 0);
    });
    timer = setTimeout(() => finish(void 0), RESOLVE_TIMEOUT_MS);
  });
  return resolved ?? fallback;
}
async function runHelper(options) {
  const workDir = join7(tmpdir(), `dsh-extend-${process.pid}-${shortId()}`);
  await mkdir2(workDir, { recursive: true });
  const readyFile = join7(workDir, "ready.txt");
  const resultFile = join7(workDir, "result.txt");
  const request = JSON.stringify({
    mainPid: options.mainPid,
    hostPid: process.pid,
    exePath: options.exePath,
    readyFile,
    resultFile,
    workDir,
    delayMs: 1500,
    dryRun: options.dryRun
  });
  const environment = { ...process.env, ELECTRON_RUN_AS_NODE: "1" };
  let child;
  try {
    child = spawn2(process.execPath, [HELPER_PATH, request], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
      env: environment
    });
  } catch (cause) {
    return { ready: false, detail: `\u65E0\u6CD5\u542F\u52A8\u5B88\u62A4\u8FDB\u7A0B\uFF1A${cause instanceof Error ? cause.message : String(cause)}` };
  }
  child.on("error", () => {
  });
  child.unref();
  const ready = await waitForFile(readyFile, READY_TIMEOUT_MS);
  const detail = await waitForFile(resultFile, RESULT_TIMEOUT_MS) ? await readText(resultFile) : void 0;
  if (!ready) {
    try {
      child.kill();
    } catch {
    }
    await rm2(workDir, { recursive: true, force: true }).catch(() => void 0);
    return { ready: false, detail: detail ?? "\u5B88\u62A4\u8FDB\u7A0B\u672A\u5728\u65F6\u9650\u5185\u5C31\u7EEA" };
  }
  if (options.dryRun) {
    await rm2(workDir, { recursive: true, force: true }).catch(() => void 0);
  }
  return { ready: true, detail: detail ?? "" };
}
async function runRebootCommand(ctx, invocation) {
  const args = parseRebootInput(invocation.rawInput);
  if (args.errors.length > 0) {
    return { kind: "error", text: `${args.errors.join("\n")}

${REBOOT_USAGE}` };
  }
  if (args.mode === "help") return { kind: "success", text: REBOOT_USAGE };
  const plan = planReboot({
    platform: process.platform,
    pid: process.pid,
    ppid: process.ppid,
    desktopExecutable: process.env.DSH_DESKTOP_NODE_EXECUTABLE,
    execPath: process.execPath,
    runAsNode: process.env.ELECTRON_RUN_AS_NODE === "1"
  });
  if (!plan.ok) return { kind: "error", text: `${plan.reason}

${REBOOT_USAGE}` };
  if (!await exists(HELPER_PATH)) {
    return { kind: "error", text: `\u5B88\u62A4\u8FDB\u7A0B\u5165\u53E3\u7F3A\u5931\uFF1A${HELPER_PATH}` };
  }
  const exePath = await resolveExecutable(plan.mainPid, plan.exeHint);
  if (!existsSync2(exePath)) {
    return { kind: "error", text: `\u627E\u4E0D\u5230\u684C\u9762\u7AEF\u53EF\u6267\u884C\u6587\u4EF6\uFF1A${exePath}` };
  }
  const tasks = inspectTasks(ctx);
  if (args.mode === "check") {
    const result2 = await runHelper({ mainPid: plan.mainPid, exePath, dryRun: true });
    if (!result2.ready) return { kind: "error", text: `/reboot \u81EA\u68C0\u5931\u8D25\uFF1A${result2.detail}` };
    return {
      kind: "success",
      text: [
        "/reboot \u81EA\u68C0\u901A\u8FC7\uFF08\u672A\u7ED3\u675F\u4EFB\u4F55\u8FDB\u7A0B\uFF09",
        `- ${result2.detail}`,
        `- \u6D3B\u8DC3\u4EFB\u52A1\uFF1A${tasks.active ? `${tasks.runningAgents} \u4E2A\u4F1A\u8BDD\u5728\u8FD0\u884C\u3001${tasks.activeJobs} \u4E2A\u540E\u53F0\u4EFB\u52A1\u672A\u7ED3\u675F` : "\u65E0"}`
      ].join("\n")
    };
  }
  if (tasks.active && !args.force) {
    return {
      kind: "error",
      text: `\u5F53\u524D\u6709\u4EFB\u52A1\u5728\u8FD0\u884C\uFF08${tasks.runningAgents} \u4E2A\u4F1A\u8BDD\u3001${tasks.activeJobs} \u4E2A\u540E\u53F0\u4EFB\u52A1\uFF09\u3002\u5982\u679C\u786E\u8BA4\u8981\u4E2D\u65AD\u5B83\u4EEC\u5E76\u91CD\u542F\uFF0C\u8BF7\u6267\u884C /reboot --force\u3002`
    };
  }
  await flushSessions(ctx);
  saveWindowStateSync();
  const result = await runHelper({ mainPid: plan.mainPid, exePath, dryRun: false });
  if (!result.ready) return { kind: "error", text: `\u91CD\u542F\u5931\u8D25\uFF1A${result.detail}` };
  return {
    kind: "success",
    text: `\u6B63\u5728\u91CD\u542F DSH \u684C\u9762\u7AEF\u2026
- ${result.detail}
- \u7A97\u53E3\u4F1A\u5728 1-3 \u79D2\u540E\u91CD\u65B0\u51FA\u73B0\u3002`
  };
}

// src/index.ts
var name = "dsh-extend";
var SUMMARY_PATH = "/api/dsh-extend/clean/summary";
var SESSIONS_PATH = "/api/dsh-extend/clean/sessions";
var RESULT_PATH = "/api/dsh-extend/clean/result";
function isLoopback(req) {
  const address = req.socket?.remoteAddress ?? "";
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1" || address.startsWith("127.");
}
function writeJson(res, status, value) {
  if (res.writableEnded === true) return;
  const body = JSON.stringify(value);
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.setHeader("x-content-type-options", "nosniff");
  res.end(body);
}
function admitGet(req, res) {
  if (req.method !== void 0 && req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("allow", "GET, HEAD");
    writeJson(res, 405, { ok: false, error: "method not allowed" });
    return void 0;
  }
  if (!isLoopback(req)) {
    writeJson(res, 403, { ok: false, error: "loopback only" });
    return void 0;
  }
  return new URL(req.url ?? "/", "http://localhost").searchParams;
}
function apply(ctx) {
  installWindowState(ctx);
  const snapshots = new SnapshotStore();
  const results = new ResultStore();
  ctx.inject(["commands", "sessionPersistence"], (scope) => {
    const commands = scope.commands;
    if (commands === void 0) return;
    scope.effect(() => commands.register({
      name: "clean",
      description: "\u6E05\u7406\u5386\u53F2\u4F1A\u8BDD\uFF08\u6C38\u4E45\u5220\u9664\uFF1B\u652F\u6301\u52FE\u9009\u9762\u677F / \u5E8F\u53F7 / \u65F6\u95F4\u8303\u56F4\uFF09",
      input: { hint: "3 5 7 | --older-than 30d | list" },
      handler: (invocation) => runCleanCommand(ctx, snapshots, results, invocation)
    }), "dsh-extend: /clean command");
    scope.effect(() => commands.register({
      name: "reboot",
      description: "\u91CD\u542F DSH \u684C\u9762\u7AEF\uFF08\u5148\u843D\u76D8\u4F1A\u8BDD\uFF0C\u518D\u81EA\u52A8\u62C9\u8D77\uFF09",
      input: { hint: "--yes | --check" },
      handler: (invocation) => runRebootCommand(ctx, invocation)
    }), "dsh-extend: /reboot command");
  });
  registerInit(ctx);
  ctx.inject(["webServer"], (scope) => {
    const webServer = scope.webServer;
    if (webServer === void 0) return;
    scope.effect(() => webServer.register({
      kind: "exact",
      path: SUMMARY_PATH,
      handler: (req, res) => {
        if (admitGet(req, res) === void 0) return;
        const fresh = (req.url ?? "").includes("fresh=1");
        void buildSummary(ctx, { fresh }).then((summary) => writeJson(res, 200, summary)).catch((cause) => {
          writeJson(res, 503, { ok: false, error: cause instanceof Error ? cause.message : String(cause) });
        });
      }
    }), "dsh-extend: clean summary route");
    scope.effect(() => webServer.register({
      kind: "exact",
      path: SESSIONS_PATH,
      handler: (req, res) => {
        const params = admitGet(req, res);
        if (params === void 0) return;
        const scopeParam = params.get("scope") ?? "all";
        const preselect = params.get("preselect") === "none" ? "none" : "suggested";
        if (!isCleanScope(scopeParam)) {
          writeJson(res, 400, { ok: false, error: `\u672A\u77E5\u8303\u56F4\uFF1A${scopeParam}` });
          return;
        }
        void buildSessionScope(ctx, { scope: scopeParam, preselect }).then((payload) => writeJson(res, 200, payload)).catch((cause) => {
          writeJson(res, 503, { ok: false, error: cause instanceof Error ? cause.message : String(cause) });
        });
      }
    }), "dsh-extend: clean sessions route");
    scope.effect(() => webServer.register({
      kind: "exact",
      path: RESULT_PATH,
      handler: (req, res) => {
        const params = admitGet(req, res);
        if (params === void 0) return;
        const token = params.get("request") ?? "";
        const result = token === "" ? void 0 : results.get(token);
        writeJson(res, 200, result === void 0 ? { ok: true, found: false } : { ok: true, found: true, result });
      }
    }), "dsh-extend: clean result route");
  });
}
export {
  RESULT_PATH,
  SESSIONS_PATH,
  SUMMARY_PATH,
  apply,
  name
};
