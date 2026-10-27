window.__ModuleLoader__.load({
  id: "dsh-extend",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;

"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/locales.ts
var zh = {
  "search.placeholder": "\u641C\u7D22\u6E05\u7406\u65B9\u5F0F\u2026",
  "search.empty": "\u6CA1\u6709\u53EF\u6E05\u7406\u7684\u4F1A\u8BDD",
  "search.noResults": "\u6CA1\u6709\u5339\u914D\u7684\u6E05\u7406\u65B9\u5F0F",
  "group.time": "\u6309\u65F6\u95F4",
  "group.tools": "\u5DE5\u5177",
  "archived.label": "\u5DF2\u5F52\u6863\u4F1A\u8BDD",
  "archived.detail": "{count} \u4E2A \xB7 {size}",
  "bucket.label": "{days} \u5929\u524D\u7684\u4F1A\u8BDD",
  "bucket.detail": "{count} \u4E2A \xB7 {size}",
  "all.label": "\u5168\u90E8\u4F1A\u8BDD",
  "all.detail": "{count} \u4E2A \xB7 {size}",
  "all.hint": "\u6253\u5F00\u540E\u624B\u52A8\u52FE\u9009\u8981\u5220\u9664\u7684\u4F1A\u8BDD",
  "empty.label": "\u7A7A\u4F1A\u8BDD",
  "empty.detail": "\u6CA1\u6709\u4EFB\u4F55\u7528\u6237\u6D88\u606F\u7684\u4F1A\u8BDD",
  "dialog.title": "\u6E05\u7406\u5386\u53F2\u4F1A\u8BDD",
  "dialog.search": "\u641C\u7D22\u6807\u9898\u6216\u9879\u76EE\u2026",
  "dialog.all": "\u5168\u9009",
  "dialog.none": "\u6E05\u7A7A",
  "dialog.selected": "\u5DF2\u9009 {count} \u4E2A",
  "dialog.ack": "\u6211\u5DF2\u4E86\u89E3\u5220\u9664\u540E\u4E0D\u53EF\u6062\u590D",
  "dialog.cancel": "\u53D6\u6D88",
  "dialog.delete": "\u6C38\u4E45\u5220\u9664",
  "dialog.deleting": "\u5220\u9664\u4E2D\u2026",
  "dialog.empty": "\u8FD9\u4E2A\u8303\u56F4\u5185\u6CA1\u6709\u53EF\u5220\u9664\u7684\u4F1A\u8BDD",
  "dialog.live": "\u4F7F\u7528\u4E2D",
  "dialog.liveCount": "\u4F7F\u7528\u4E2D {count} \u4E2A\uFF08\u4E0D\u53EF\u9009\uFF09",
  "dialog.loading": "\u6B63\u5728\u8BFB\u53D6\u4F1A\u8BDD\u2026",
  "dialog.summary": "\u5171 {count} \u4E2A \xB7 {size}",
  "dialog.truncated": "\u4EC5\u663E\u793A\u524D {count} \u4E2A\uFF08\u5171 {total} \u4E2A\uFF09",
  "dialog.noTitle": "\u672A\u547D\u540D\u4F1A\u8BDD",
  "dialog.blank": "\u7A7A\u4F1A\u8BDD",
  "dialog.noCwd": "\u65E0\u5DE5\u4F5C\u76EE\u5F55",
  "dialog.loadFailed": "\u8BFB\u53D6\u5931\u8D25\uFF1A{error}",
  "dialog.retry": "\u91CD\u8BD5",
  "dialog.result": "\u5DF2\u5220\u9664 {count} \u4E2A\u4F1A\u8BDD\uFF0C\u91CA\u653E {size}",
  "dialog.resultPartial": "\u5DF2\u5220\u9664 {count} \u4E2A\uFF0C{failed} \u4E2A\u672A\u80FD\u5220\u9664",
  "dialog.resultUnknown": "\u5DF2\u6267\u884C\u5220\u9664 {count} \u4E2A\u4F1A\u8BDD\uFF1B\u7ED3\u679C\u672A\u53D6\u56DE\uFF0C\u8BF7\u5728\u5BF9\u8BDD\u4E2D\u67E5\u770B\u3002",
  "dialog.deleteFailed": "\u5220\u9664\u5931\u8D25\uFF1A{error}",
  "dialog.failedList": "\u672A\u80FD\u5220\u9664\uFF1A",
  "dialog.done": "\u5B8C\u6210",
  "session.missing": "\u5F53\u524D\u4F1A\u8BDD\u5C1A\u672A\u5C31\u7EEA\uFF0C\u6682\u65F6\u65E0\u6CD5\u6267\u884C\u3002",
  "command.failed": "\u547D\u4EE4\u6267\u884C\u5931\u8D25\u3002",
  "command.unavailable": "\u5F53\u524D Host \u6CA1\u6709\u63D0\u4F9B\u8BE5\u547D\u4EE4\u3002"
};
var en = {
  "search.placeholder": "Search cleanup actions\u2026",
  "search.empty": "No sessions to clean",
  "search.noResults": "No matching cleanup action",
  "group.time": "By age",
  "group.tools": "Tools",
  "archived.label": "Archived sessions",
  "archived.detail": "{count} sessions \xB7 {size}",
  "bucket.label": "Sessions older than {days} days",
  "bucket.detail": "{count} sessions \xB7 {size}",
  "all.label": "All sessions",
  "all.detail": "{count} sessions \xB7 {size}",
  "all.hint": "Open the list and choose sessions manually",
  "empty.label": "Empty sessions",
  "empty.detail": "Sessions without any user message",
  "dialog.title": "Clean history sessions",
  "dialog.search": "Search title or project\u2026",
  "dialog.all": "Select all",
  "dialog.none": "Clear",
  "dialog.selected": "{count} selected",
  "dialog.ack": "I understand this cannot be undone",
  "dialog.cancel": "Cancel",
  "dialog.delete": "Delete permanently",
  "dialog.deleting": "Deleting\u2026",
  "dialog.empty": "Nothing to delete in this scope",
  "dialog.live": "In use",
  "dialog.liveCount": "{count} in use (not selectable)",
  "dialog.loading": "Loading sessions\u2026",
  "dialog.summary": "{count} sessions \xB7 {size}",
  "dialog.truncated": "Showing the first {count} of {total}",
  "dialog.noTitle": "Untitled session",
  "dialog.blank": "Empty session",
  "dialog.noCwd": "No working directory",
  "dialog.loadFailed": "Failed to load: {error}",
  "dialog.retry": "Retry",
  "dialog.result": "Deleted {count} sessions, freed {size}",
  "dialog.resultPartial": "Deleted {count}, {failed} could not be deleted",
  "dialog.resultUnknown": "Deletion of {count} sessions was requested; the result could not be fetched \u2014 see the chat.",
  "dialog.deleteFailed": "Delete failed: {error}",
  "dialog.failedList": "Not deleted:",
  "dialog.done": "Done",
  "session.missing": "This session is not ready yet.",
  "command.failed": "The command failed.",
  "command.unavailable": "This host does not provide the command."
};

// src/client/drafts.ts
var DRAFT_KEY_PREFIX = "dsh.conversation.";
function isRebootDraft(text) {
  return /^\/reboot(?:\s|$)/u.test(text.trim());
}
function clearRebootDrafts(storage) {
  const keys = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key !== null && key.startsWith(DRAFT_KEY_PREFIX)) keys.push(key);
  }
  const cleared = [];
  for (const key of keys) {
    let snapshot;
    try {
      const raw = storage.getItem(key);
      if (raw === null) continue;
      const parsed = JSON.parse(raw);
      snapshot = parsed !== null && typeof parsed === "object" ? parsed.draft : void 0;
    } catch {
      continue;
    }
    const text = typeof snapshot === "string" ? snapshot : snapshot?.text;
    if (typeof text !== "string" || !isRebootDraft(text)) continue;
    storage.removeItem(key);
    cleared.push(key.slice(DRAFT_KEY_PREFIX.length));
  }
  return cleared;
}

// src/client/dialog.ts
var active;
function ensureStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-plugin-css="dsh-extend/dialog"]') !== null) return;
  const style = document.createElement("style");
  style.dataset.plugin = "dsh-extend";
  style.dataset.pluginCss = "dsh-extend/dialog";
  style.textContent = `
.dx-backdrop{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.5)}
.dx-dialog{width:min(680px,94vw);max-height:min(82vh,760px);display:flex;flex-direction:column;border-radius:14px;overflow:hidden;font:inherit;background:var(--dsw-alias-bg-overlay,#26262b);color:var(--dsw-alias-label-primary,#f2f3f5);border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.12));box-shadow:0 24px 64px rgba(0,0,0,.5)}
.dx-head{display:flex;align-items:center;gap:12px;padding:18px 20px 8px}
.dx-head h2{margin:0;flex:1;font-size:16px;font-weight:600;line-height:24px}
.dx-close{width:28px;height:28px;border:none;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary,#a9adb8);font-size:16px;line-height:1;cursor:pointer}
.dx-close:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}
.dx-sub{padding:0 20px 10px;font-size:12.5px;line-height:18px;color:var(--dsw-alias-label-secondary,#a9adb8)}
.dx-body{display:flex;flex-direction:column;flex:1;min-height:0}
.dx-toolbar{display:flex;align-items:center;gap:8px;padding:0 20px 10px}
.dx-search{flex:1;height:32px;padding:0 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));background:transparent;color:inherit;font:inherit;font-size:13px;outline:none}
.dx-search:focus{border-color:var(--dsw-alias-brand-primary,#4b7dff)}
.dx-link{border:none;background:none;padding:4px 6px;border-radius:6px;color:var(--dsw-alias-brand-primary,#6f97ff);font:inherit;font-size:12.5px;cursor:pointer}
.dx-link:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}
.dx-list{flex:1;min-height:120px;overflow:auto;margin:0 12px;padding:4px;border-top:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.1));border-bottom:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.1))}
.dx-row{display:flex;align-items:flex-start;gap:10px;padding:9px 10px;border-radius:8px;cursor:pointer}
.dx-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.07))}
.dx-row[data-live=true]{cursor:default;opacity:.6}
.dx-row[data-live=true]:hover{background:transparent}
.dx-row[hidden]{display:none}
.dx-check{margin:2px 0 0;width:15px;height:15px;accent-color:var(--dsw-alias-brand-primary,#4b7dff);flex:none;cursor:inherit}
.dx-main{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.dx-title{font-size:13.5px;line-height:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dx-meta{font-size:11.5px;line-height:16px;color:var(--dsw-alias-label-secondary,#9aa0ad);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dx-badge{flex:none;margin-top:2px;padding:1px 7px;border-radius:999px;font-size:11px;line-height:16px;background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.1));color:var(--dsw-alias-label-secondary,#a9adb8)}
.dx-empty{padding:36px 16px;text-align:center;font-size:13px;color:var(--dsw-alias-label-secondary,#9aa0ad)}
.dx-foot{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 20px 16px}
.dx-ack{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--dsw-alias-label-secondary,#a9adb8);cursor:pointer;user-select:none}
.dx-count{font-size:12.5px;color:var(--dsw-alias-label-secondary,#a9adb8)}
.dx-actions{margin-left:auto;display:flex;gap:8px}
.dx-btn{height:34px;padding:0 16px;border-radius:9px;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.18));background:transparent;color:inherit;font:inherit;font-size:13px;cursor:pointer}
.dx-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}
.dx-btn.primary{background:#2f6fed;border-color:#2f6fed;color:#fff}
.dx-btn.danger{background:#d93025;border-color:#d93025;color:#fff}
.dx-btn:disabled{opacity:.45;cursor:not-allowed}
.dx-error{margin:0 20px 12px;padding:10px 12px;border-radius:8px;font-size:12.5px;line-height:18px;color:var(--dsw-alias-state-error-primary,#ff7b7b);background:rgba(229,72,77,.12);white-space:pre-wrap}
.dx-result{padding:28px 24px;display:flex;flex-direction:column;gap:10px}
.dx-result-title{font-size:15px;font-weight:600}
.dx-result-detail{font-size:12.5px;line-height:19px;color:var(--dsw-alias-label-secondary,#a9adb8);white-space:pre-wrap;max-height:180px;overflow:auto}
.dx-result .dx-actions{margin-left:0;justify-content:flex-end}
`;
  document.head.appendChild(style);
}
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className !== void 0 && className !== "") node.className = className;
  if (text !== void 0) node.textContent = text;
  return node;
}
function formatBytes(bytes) {
  const value = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  if (value < 1024) return `${Math.round(value)} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
function formatTime(epochMs) {
  const date = new Date(epochMs);
  if (Number.isNaN(date.getTime())) return "--";
  const pad = (value) => String(value).padStart(2, "0");
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
async function fetchScope(scope, preselect, signal) {
  const response = await fetch(
    `/api/dsh-extend/clean/sessions?scope=${encodeURIComponent(scope)}&preselect=${preselect}`,
    { signal, cache: "no-store", headers: { accept: "application/json" } }
  );
  const payload = await response.json().catch(() => void 0);
  if (!response.ok || payload === null || typeof payload !== "object" || payload.ok !== true) {
    const message = payload?.error;
    throw new Error(message ?? `HTTP ${response.status}`);
  }
  return payload;
}
function openCleanDialog(options) {
  if (typeof document === "undefined") {
    return { close: () => {
    } };
  }
  active?.close();
  ensureStyles();
  const { t } = options;
  const controller = new AbortController();
  const selected = /* @__PURE__ */ new Set();
  let rows = [];
  let busy = false;
  let closed = false;
  let ack = false;
  const backdrop = el("div", "dx-backdrop");
  const panel = el("div", "dx-dialog");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  const headingId = `dx-title-${Math.random().toString(36).slice(2, 8)}`;
  panel.setAttribute("aria-labelledby", headingId);
  const head = el("div", "dx-head");
  const heading = el("h2", "", t("dialog.title"));
  heading.id = headingId;
  const closeButton = el("button", "dx-close", "\u2715");
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", t("dialog.cancel"));
  head.append(heading, closeButton);
  const body = el("div", "dx-body");
  const subtitle = el("div", "dx-sub", t("dialog.loading"));
  const toolbar = el("div", "dx-toolbar");
  const search = el("input", "dx-search");
  search.type = "search";
  search.placeholder = t("dialog.search");
  const selectAll = el("button", "dx-link", t("dialog.all"));
  selectAll.type = "button";
  const selectNone = el("button", "dx-link", t("dialog.none"));
  selectNone.type = "button";
  toolbar.append(search, selectAll, selectNone);
  const list = el("div", "dx-list");
  const errorBox = el("div", "dx-error");
  body.append(subtitle, toolbar, list);
  const foot = el("div", "dx-foot");
  const ackLabel = el("label", "dx-ack");
  const ackInput = el("input", "dx-check");
  ackInput.type = "checkbox";
  ackLabel.append(ackInput, document.createTextNode(t("dialog.ack")));
  const count = el("span", "dx-count", t("dialog.selected", { count: 0 }));
  const actions = el("div", "dx-actions");
  const cancel = el("button", "dx-btn", t("dialog.cancel"));
  cancel.type = "button";
  const remove = el("button", "dx-btn danger", t("dialog.delete"));
  remove.type = "button";
  remove.disabled = true;
  actions.append(cancel, remove);
  foot.append(ackLabel, count, actions);
  panel.append(head, body, foot);
  backdrop.append(panel);
  document.body.append(backdrop);
  const close = () => {
    if (closed) return;
    closed = true;
    controller.abort();
    backdrop.remove();
    document.removeEventListener("keydown", onKeyDown, true);
    if (active === handle) active = void 0;
  };
  const handle = { close };
  const onKeyDown = (event) => {
    if (event.key === "Escape" && !busy) {
      event.stopPropagation();
      close();
    }
  };
  document.addEventListener("keydown", onKeyDown, true);
  backdrop.addEventListener("mousedown", (event) => {
    if (event.target === backdrop && !busy) close();
  });
  closeButton.addEventListener("click", () => {
    if (!busy) close();
  });
  cancel.addEventListener("click", () => {
    if (!busy) close();
  });
  const visibleRows = () => rows.filter((row) => !(list.querySelector(`[data-id="${row.id}"]`)?.hidden ?? false));
  const updateFooter = () => {
    const picked = selected.size;
    count.textContent = t("dialog.selected", { count: picked });
    remove.disabled = busy || picked === 0 || !ack;
    remove.textContent = busy ? t("dialog.deleting") : t("dialog.delete");
    ackInput.disabled = busy;
    search.disabled = busy;
    selectAll.disabled = busy;
    selectNone.disabled = busy;
  };
  const setRowChecked = (row, checked, input) => {
    input.checked = checked;
    if (checked) selected.add(row.id);
    else selected.delete(row.id);
    updateFooter();
  };
  const renderRows = () => {
    list.textContent = "";
    selected.clear();
    if (rows.length === 0) {
      list.append(el("div", "dx-empty", t("dialog.empty")));
      updateFooter();
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const row of rows) {
      const rowEl = el("div", "dx-row");
      rowEl.dataset.id = row.id;
      rowEl.dataset.live = String(row.live);
      const input = el("input", "dx-check");
      input.type = "checkbox";
      input.checked = row.suggested && !row.live;
      if (row.live) input.disabled = true;
      if (input.checked) selected.add(row.id);
      const main = el("span", "dx-main");
      const title = el("span", "dx-title", row.title ?? t("dialog.noTitle"));
      title.title = row.title ?? row.id;
      const shortId = row.id.startsWith("session-") ? row.id.slice(8, 16) : row.id.slice(0, 8);
      const metaParts = [row.cwd ?? t("dialog.noCwd"), formatTime(row.lastActivity), formatBytes(row.bytes)];
      if (row.title === void 0) metaParts.unshift(shortId);
      const meta = el("span", "dx-meta", metaParts.join(" \xB7 "));
      meta.title = row.cwd ?? "";
      main.append(title, meta);
      rowEl.append(input, main);
      if (row.live) rowEl.append(el("span", "dx-badge", t("dialog.live")));
      else if (row.blank === true) rowEl.append(el("span", "dx-badge", t("dialog.blank")));
      if (!row.live) {
        rowEl.addEventListener("click", (event) => {
          if (busy) return;
          if (event.target === input) return;
          setRowChecked(row, !input.checked, input);
        });
        input.addEventListener("change", () => {
          if (!busy) setRowChecked(row, input.checked, input);
        });
      }
      fragment.append(rowEl);
    }
    list.append(fragment);
    updateFooter();
  };
  const showError = (message, retry) => {
    errorBox.remove();
    errorBox.textContent = message;
    if (retry !== void 0) {
      const button = el("button", "dx-link", t("dialog.retry"));
      button.type = "button";
      button.addEventListener("click", () => {
        errorBox.remove();
        retry();
      });
      errorBox.append(document.createTextNode(" "), button);
    }
    body.append(errorBox);
  };
  const load = () => {
    subtitle.textContent = t("dialog.loading");
    list.textContent = "";
    void fetchScope(options.scope, options.preselect, controller.signal).then((payload) => {
      if (closed) return;
      rows = [...payload.rows];
      const summary = t("dialog.summary", {
        count: payload.totals.count,
        size: formatBytes(payload.totals.bytes)
      });
      const liveNote = payload.totals.live > 0 ? ` \xB7 ${t("dialog.liveCount", { count: payload.totals.live })}` : "";
      const truncated = payload.truncated === true ? ` \xB7 ${t("dialog.truncated", { count: rows.length, total: payload.totals.count })}` : "";
      subtitle.textContent = summary + liveNote + truncated;
      renderRows();
    }).catch((cause) => {
      if (closed) return;
      subtitle.textContent = "";
      showError(t("dialog.loadFailed", { error: cause instanceof Error ? cause.message : String(cause) }), load);
    });
  };
  const showResult = (summary, requested) => {
    const resultBox = el("div", "dx-result");
    const title = el("div", "dx-result-title");
    const detail = el("div", "dx-result-detail");
    if (summary === void 0) {
      title.textContent = t("dialog.resultUnknown", { count: requested });
    } else {
      title.textContent = summary.failed.length === 0 ? t("dialog.result", { count: summary.deleted.length, size: formatBytes(summary.bytes) }) : t("dialog.resultPartial", { count: summary.deleted.length, failed: summary.failed.length });
      if (summary.failed.length > 0) {
        detail.textContent = `${t("dialog.failedList")}
${summary.failed.slice(0, 10).map((item) => `${item.id}\uFF1A${item.reason}`).join("\n")}`;
      }
    }
    const actionsRow = el("div", "dx-actions");
    const done = el("button", "dx-btn primary", t("dialog.done"));
    done.type = "button";
    done.addEventListener("click", close);
    actionsRow.append(done);
    resultBox.append(title, detail, actionsRow);
    body.replaceChildren(resultBox);
    foot.replaceChildren();
    updateFooter();
  };
  const confirmDelete = async () => {
    if (busy || selected.size === 0) return;
    busy = true;
    updateFooter();
    try {
      const summary = await options.deleteSelected([...selected]);
      showResult(summary, selected.size);
    } catch (cause) {
      busy = false;
      updateFooter();
      showError(t("dialog.deleteFailed", { error: cause instanceof Error ? cause.message : String(cause) }));
    }
  };
  search.addEventListener("input", () => {
    const query = search.value.trim().toLowerCase();
    for (const row of rows) {
      const rowEl = list.querySelector(`[data-id="${row.id}"]`);
      if (rowEl === null) continue;
      const haystack = `${row.title ?? ""} ${row.cwd ?? ""}`.toLowerCase();
      rowEl.hidden = query !== "" && !haystack.includes(query);
    }
  });
  selectAll.addEventListener("click", () => {
    if (busy) return;
    for (const row of visibleRows()) {
      if (row.live) continue;
      const rowEl = list.querySelector(`[data-id="${row.id}"]`);
      const input = rowEl?.querySelector("input");
      if (input !== null && input !== void 0) setRowChecked(row, true, input);
    }
  });
  selectNone.addEventListener("click", () => {
    if (busy) return;
    for (const row of visibleRows()) {
      const rowEl = list.querySelector(`[data-id="${row.id}"]`);
      const input = rowEl?.querySelector("input");
      if (input !== null && input !== void 0) setRowChecked(row, false, input);
    }
  });
  ackInput.addEventListener("change", () => {
    ack = ackInput.checked;
    updateFooter();
  });
  remove.addEventListener("click", () => {
    void confirmDelete();
  });
  active = handle;
  load();
  search.focus();
  return handle;
}
function closeCleanDialog() {
  active?.close();
  active = void 0;
}

// src/client/index.ts
var NS = "dsh-extend";
var SUMMARY_ENDPOINT = "/api/dsh-extend/clean/summary";
var RESULT_ENDPOINT = "/api/dsh-extend/clean/result";
function formatBytes2(bytes) {
  const value = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  if (value < 1024) return `${Math.round(value)} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
async function fetchSummary(signal) {
  const response = await fetch(SUMMARY_ENDPOINT, {
    signal,
    cache: "no-store",
    headers: { accept: "application/json" }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const payload = await response.json();
  if (typeof payload !== "object" || payload === null || payload.ok !== true) {
    throw new Error("invalid summary response");
  }
  return payload;
}
function requestToken() {
  const crypto = globalThis.crypto;
  const uuid = crypto?.randomUUID?.();
  if (typeof uuid === "string") return uuid.replace(/-/gu, "");
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}
async function fetchResult(token) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`${RESULT_ENDPOINT}?request=${encodeURIComponent(token)}`, {
        cache: "no-store",
        headers: { accept: "application/json" }
      });
      const payload = await response.json();
      if (payload !== null && typeof payload === "object" && payload.found === true && payload.result !== void 0) {
        return payload.result;
      }
    } catch {
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
  return void 0;
}
function notifyError(ctx, session, message) {
  try {
    const binding = ctx.sessions.binding(session.sessionId);
    if (binding === void 0) return;
    const conversation = binding.ctx.get("conversation");
    conversation?.input.for(binding.ctx).notify?.("error", message);
  } catch {
  }
}
function clearDraftFor(ctx, sessionId) {
  try {
    const binding = ctx.sessions.binding(sessionId);
    if (binding === void 0) return;
    const conversation = binding.ctx.get("conversation");
    conversation?.input.for(binding.ctx).setDraft("");
  } catch {
  }
}
function clearComposerDraft(ctx, session) {
  clearDraftFor(ctx, session.sessionId);
}
function sweepStaleRebootDrafts(ctx) {
  try {
    for (const sessionId of clearRebootDrafts(window.localStorage)) clearDraftFor(ctx, sessionId);
  } catch {
  }
}
async function submit(ctx, session, line, t) {
  const live = ctx.sessions.binding(session.sessionId)?.session;
  if (live === void 0) throw new Error(t("session.missing"));
  const result = await live.command(line);
  if (!result.ok) throw new Error(result.error.message ?? t("command.failed"));
  if (!result.value.matched) throw new Error(t("command.unavailable"));
}
async function deleteSelected(ctx, session, ids, t) {
  if (ids.length === 0) return void 0;
  const token = requestToken();
  await submit(ctx, session, `/clean --ids ${ids.join(",")} --yes --request ${token}`, t);
  return fetchResult(token);
}
function cleanOptions(summary, t) {
  const allOption = {
    id: "dialog:all:none",
    label: t("all.label"),
    detail: summary === void 0 ? t("all.hint") : t("all.detail", { count: summary.all.count, size: formatBytes2(summary.all.bytes) }),
    group: { name: "tools", label: t("group.tools") }
  };
  if (summary === void 0) return [allOption];
  if (summary.totals.sessions === 0) {
    return [{ ...allOption, detail: t("all.hint") }];
  }
  const options = [{
    id: "dialog:archived",
    label: t("archived.label"),
    detail: t("archived.detail", { count: summary.archived.count, size: formatBytes2(summary.archived.bytes) })
  }];
  for (const bucket of summary.buckets) {
    if (bucket.count <= 0) continue;
    options.push({
      id: `dialog:${bucket.days}d`,
      label: t("bucket.label", { days: bucket.days }),
      detail: t("bucket.detail", { count: bucket.count, size: formatBytes2(bucket.bytes) }),
      group: { name: "time", label: t("group.time") }
    });
  }
  options.push(allOption);
  options.push({
    id: "dialog:empty",
    label: t("empty.label"),
    detail: t("empty.detail"),
    group: { name: "tools", label: t("group.tools") }
  });
  return options;
}
var inject = ["commandUi", "sessions", "locale"];
function apply(ctx) {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "dsh-extend: dictionaries");
  const t = ctx.locale.bind(NS);
  sweepStaleRebootDrafts(ctx);
  ctx.effect(() => {
    if (typeof setTimeout !== "function") return () => {
    };
    const timer = setTimeout(() => {
      sweepStaleRebootDrafts(ctx);
    }, 1500);
    return () => {
      clearTimeout(timer);
    };
  }, "dsh-extend: stale reboot draft sweep");
  ctx.effect(() => () => {
    closeCleanDialog();
  }, "dsh-extend: dialog cleanup");
  ctx.effect(() => ctx.commandUi.decorate({
    name: "clean",
    available: () => true,
    ui: {
      kind: "popupSelect",
      searchLabels: () => ({
        placeholder: t("search.placeholder"),
        empty: t("search.empty"),
        noResults: t("search.noResults")
      }),
      options: async (_session, signal) => {
        let summary;
        try {
          summary = await fetchSummary(signal);
        } catch {
          summary = void 0;
        }
        return cleanOptions(summary, t);
      },
      onSelect: (option, session) => {
        if (!option.id.startsWith("dialog:")) return;
        clearComposerDraft(ctx, session);
        const [, scope, preselect] = option.id.split(":");
        openCleanDialog({
          scope: scope ?? "all",
          preselect: preselect === "none" ? "none" : "suggested",
          t,
          deleteSelected: (ids) => deleteSelected(ctx, session, ids, t)
        });
      }
    }
  }), "dsh-extend: /clean decoration");
  ctx.effect(() => ctx.commandUi.decorate({
    name: "reboot",
    available: () => true,
    ui: {
      kind: "action",
      run: (session) => {
        clearComposerDraft(ctx, session);
        void submit(ctx, session, "/reboot", t).catch((error) => {
          notifyError(ctx, session, error instanceof Error ? error.message : String(error));
        });
      }
    }
  }), "dsh-extend: /reboot action");
}

    return module.exports;
  },
});

