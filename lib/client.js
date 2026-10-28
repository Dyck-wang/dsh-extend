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
  "prompt.title": "\u7CFB\u7EDF\u63D0\u793A\u8BCD\u7BA1\u7406",
  "prompt.assembled": "\u5DF2\u7EC4\u88C5\u63D0\u793A\u8BCD",
  "prompt.custom": "\u81EA\u5B9A\u4E49\u63D0\u793A\u8BCD",
  "prompt.hint": "\u4FEE\u6539\u5728\u4E0B\u4E00\u8F6E\u6A21\u578B\u8BF7\u6C42\u751F\u6548\uFF1BAgent \u9884\u8BBE\u81EA\u5E26\u7684\u56FA\u5B9A\u63D0\u793A\u8BCD\u4E0D\u5728\u6B64\u5217\u3002",
  "prompt.toolsContexts": "\u5DE5\u5177 {tools} \u4E2A \xB7 \u8FD0\u884C\u65F6\u4E0A\u4E0B\u6587 {contexts} \u6761",
  "prompt.modified": "\u5DF2\u4FEE\u6539",
  "prompt.disabled": "\u5DF2\u7981\u7528",
  "prompt.edit": "\u7F16\u8F91",
  "prompt.enable": "\u542F\u7528",
  "prompt.disable": "\u7981\u7528",
  "prompt.restore": "\u8FD8\u539F",
  "prompt.confirmRestore": "\u786E\u8BA4\u8FD8\u539F\u300C{name}\u300D\uFF1F",
  "prompt.resetAll": "\u8FD8\u539F\u5168\u90E8\u9ED8\u8BA4",
  "prompt.confirmResetAll": "\u786E\u8BA4\u8FD8\u539F\u5168\u90E8\u5DF2\u7EC4\u88C5\u6BB5\uFF1F\u81EA\u5B9A\u4E49\u9879\u4F1A\u4FDD\u7559\u3002",
  "prompt.add": "\u65B0\u589E\u81EA\u5B9A\u4E49",
  "prompt.loading": "\u52A0\u8F7D\u4E2D\u2026",
  "prompt.saved": "\u5DF2\u4FDD\u5B58\uFF0C\u4E0B\u4E00\u8F6E\u5BF9\u8BDD\u751F\u6548\u3002",
  "prompt.delete": "\u5220\u9664",
  "prompt.confirmDelete": "\u786E\u8BA4\u5220\u9664\u300C{title}\u300D\uFF1F",
  "prompt.confirm": "\u786E\u8BA4",
  "prompt.cancel": "\u53D6\u6D88",
  "prompt.save": "\u4FDD\u5B58",
  "prompt.titlePlaceholder": "\u81EA\u5B9A\u4E49\u63D0\u793A\u8BCD\u6807\u9898",
  "prompt.textPlaceholder": "\u63D0\u793A\u8BCD\u5185\u5BB9\u2026",
  "prompt.assembledEmpty": "\u5F53\u524D\u6CA1\u6709\u53EF\u7BA1\u7406\u7684\u63D0\u793A\u8BCD\u6BB5\u3002",
  "prompt.customEmpty": "\u8FD8\u6CA1\u6709\u81EA\u5B9A\u4E49\u63D0\u793A\u8BCD\u3002",
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
  "prompt.title": "System prompt manager",
  "prompt.assembled": "Assembled prompts",
  "prompt.custom": "Custom prompts",
  "prompt.hint": "Changes apply to the next model request; fixed prompts from agent presets are not listed.",
  "prompt.toolsContexts": "{tools} tools \xB7 {contexts} runtime contexts",
  "prompt.modified": "modified",
  "prompt.disabled": "disabled",
  "prompt.edit": "Edit",
  "prompt.enable": "Enable",
  "prompt.disable": "Disable",
  "prompt.restore": "Restore",
  "prompt.confirmRestore": 'Restore "{name}"?',
  "prompt.resetAll": "Restore all defaults",
  "prompt.confirmResetAll": "Restore every assembled section? Custom prompts are kept.",
  "prompt.add": "Add custom",
  "prompt.loading": "Loading\u2026",
  "prompt.saved": "Saved; applies from the next turn.",
  "prompt.delete": "Delete",
  "prompt.confirmDelete": 'Delete "{title}"?',
  "prompt.confirm": "Confirm",
  "prompt.cancel": "Cancel",
  "prompt.save": "Save",
  "prompt.titlePlaceholder": "Custom prompt title",
  "prompt.textPlaceholder": "Prompt text\u2026",
  "prompt.assembledEmpty": "No assembled sections to manage.",
  "prompt.customEmpty": "No custom prompts yet.",
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

// src/client/locales-more.ts
var ja = {
  "search.placeholder": "\u30AF\u30EA\u30FC\u30F3\u30A2\u30C3\u30D7\u65B9\u6CD5\u3092\u691C\u7D22\u2026",
  "search.empty": "\u30AF\u30EA\u30FC\u30F3\u30A2\u30C3\u30D7\u3067\u304D\u308B\u30BB\u30C3\u30B7\u30E7\u30F3\u304C\u3042\u308A\u307E\u305B\u3093",
  "search.noResults": "\u4E00\u81F4\u3059\u308B\u30AF\u30EA\u30FC\u30F3\u30A2\u30C3\u30D7\u65B9\u6CD5\u304C\u3042\u308A\u307E\u305B\u3093",
  "group.time": "\u671F\u9593",
  "group.tools": "\u30C4\u30FC\u30EB",
  "archived.label": "\u30A2\u30FC\u30AB\u30A4\u30D6\u6E08\u307F\u30BB\u30C3\u30B7\u30E7\u30F3",
  "archived.detail": "{count} \u4EF6 \xB7 {size}",
  "bucket.label": "{days} \u65E5\u3088\u308A\u524D\u306E\u30BB\u30C3\u30B7\u30E7\u30F3",
  "bucket.detail": "{count} \u4EF6 \xB7 {size}",
  "all.label": "\u3059\u3079\u3066\u306E\u30BB\u30C3\u30B7\u30E7\u30F3",
  "all.detail": "{count} \u4EF6 \xB7 {size}",
  "all.hint": "\u958B\u3044\u3066\u304B\u3089\u524A\u9664\u3059\u308B\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u624B\u52D5\u3067\u9078\u629E\u3057\u307E\u3059",
  "empty.label": "\u7A7A\u306E\u30BB\u30C3\u30B7\u30E7\u30F3",
  "empty.detail": "\u30E6\u30FC\u30B6\u30FC\u30E1\u30C3\u30BB\u30FC\u30B8\u304C\u4E00\u4EF6\u3082\u306A\u3044\u30BB\u30C3\u30B7\u30E7\u30F3",
  "prompt.title": "\u30B7\u30B9\u30C6\u30E0\u30D7\u30ED\u30F3\u30D7\u30C8\u7BA1\u7406",
  "prompt.assembled": "\u7D44\u307F\u7ACB\u3066\u6E08\u307F\u30D7\u30ED\u30F3\u30D7\u30C8",
  "prompt.custom": "\u30AB\u30B9\u30BF\u30E0\u30D7\u30ED\u30F3\u30D7\u30C8",
  "prompt.hint": "\u5909\u66F4\u306F\u6B21\u56DE\u306E\u30E2\u30C7\u30EB\u30EA\u30AF\u30A8\u30B9\u30C8\u304B\u3089\u53CD\u6620\u3055\u308C\u307E\u3059\u3002Agent \u30D7\u30EA\u30BB\u30C3\u30C8\u306E\u56FA\u5B9A\u30D7\u30ED\u30F3\u30D7\u30C8\u306F\u5BFE\u8C61\u5916\u3067\u3059\u3002",
  "prompt.toolsContexts": "\u30C4\u30FC\u30EB {tools} \u500B \xB7 \u5B9F\u884C\u6642\u30B3\u30F3\u30C6\u30AD\u30B9\u30C8 {contexts} \u4EF6",
  "prompt.modified": "\u5909\u66F4\u6E08\u307F",
  "prompt.disabled": "\u7121\u52B9",
  "prompt.edit": "\u7DE8\u96C6",
  "prompt.enable": "\u6709\u52B9\u5316",
  "prompt.disable": "\u7121\u52B9\u5316",
  "prompt.restore": "\u5FA9\u5143",
  "prompt.confirmRestore": "\u300C{name}\u300D\u3092\u5FA9\u5143\u3057\u307E\u3059\u304B\uFF1F",
  "prompt.resetAll": "\u3059\u3079\u3066\u65E2\u5B9A\u306B\u623B\u3059",
  "prompt.confirmResetAll": "\u7D44\u307F\u7ACB\u3066\u6E08\u307F\u306E\u5168\u30BB\u30AF\u30B7\u30E7\u30F3\u3092\u5FA9\u5143\u3057\u307E\u3059\u304B\uFF1F\u30AB\u30B9\u30BF\u30E0\u9805\u76EE\u306F\u4FDD\u6301\u3055\u308C\u307E\u3059\u3002",
  "prompt.add": "\u30AB\u30B9\u30BF\u30E0\u3092\u8FFD\u52A0",
  "prompt.loading": "\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026",
  "prompt.saved": "\u4FDD\u5B58\u3057\u307E\u3057\u305F\u3002\u6B21\u56DE\u306E\u4F1A\u8A71\u304B\u3089\u53CD\u6620\u3055\u308C\u307E\u3059\u3002",
  "prompt.delete": "\u524A\u9664",
  "prompt.confirmDelete": "\u300C{title}\u300D\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F",
  "prompt.confirm": "\u78BA\u8A8D",
  "prompt.cancel": "\u30AD\u30E3\u30F3\u30BB\u30EB",
  "prompt.save": "\u4FDD\u5B58",
  "prompt.titlePlaceholder": "\u30AB\u30B9\u30BF\u30E0\u30D7\u30ED\u30F3\u30D7\u30C8\u306E\u30BF\u30A4\u30C8\u30EB",
  "prompt.textPlaceholder": "\u30D7\u30ED\u30F3\u30D7\u30C8\u306E\u5185\u5BB9\u2026",
  "prompt.assembledEmpty": "\u7BA1\u7406\u3067\u304D\u308B\u30D7\u30ED\u30F3\u30D7\u30C8\u30BB\u30AF\u30B7\u30E7\u30F3\u304C\u3042\u308A\u307E\u305B\u3093\u3002",
  "prompt.customEmpty": "\u30AB\u30B9\u30BF\u30E0\u30D7\u30ED\u30F3\u30D7\u30C8\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002",
  "dialog.title": "\u5C65\u6B74\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u6574\u7406",
  "dialog.search": "\u30BF\u30A4\u30C8\u30EB\u307E\u305F\u306F\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u3092\u691C\u7D22\u2026",
  "dialog.all": "\u3059\u3079\u3066\u9078\u629E",
  "dialog.none": "\u30AF\u30EA\u30A2",
  "dialog.selected": "{count} \u4EF6\u9078\u629E\u4E2D",
  "dialog.ack": "\u524A\u9664\u3059\u308B\u3068\u5143\u306B\u623B\u305B\u306A\u3044\u3053\u3068\u3092\u7406\u89E3\u3057\u307E\u3057\u305F",
  "dialog.cancel": "\u30AD\u30E3\u30F3\u30BB\u30EB",
  "dialog.delete": "\u5B8C\u5168\u306B\u524A\u9664",
  "dialog.deleting": "\u524A\u9664\u4E2D\u2026",
  "dialog.empty": "\u3053\u306E\u7BC4\u56F2\u306B\u524A\u9664\u3067\u304D\u308B\u30BB\u30C3\u30B7\u30E7\u30F3\u306F\u3042\u308A\u307E\u305B\u3093",
  "dialog.live": "\u4F7F\u7528\u4E2D",
  "dialog.liveCount": "\u4F7F\u7528\u4E2D {count} \u4EF6\uFF08\u9078\u629E\u4E0D\u53EF\uFF09",
  "dialog.loading": "\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026",
  "dialog.summary": "\u5408\u8A08 {count} \u4EF6 \xB7 {size}",
  "dialog.truncated": "\u5148\u982D {count} \u4EF6\u306E\u307F\u8868\u793A\uFF08\u5168 {total} \u4EF6\uFF09",
  "dialog.noTitle": "\u7121\u984C\u306E\u30BB\u30C3\u30B7\u30E7\u30F3",
  "dialog.blank": "\u7A7A\u306E\u30BB\u30C3\u30B7\u30E7\u30F3",
  "dialog.noCwd": "\u4F5C\u696D\u30C7\u30A3\u30EC\u30AF\u30C8\u30EA\u306A\u3057",
  "dialog.loadFailed": "\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F\uFF1A{error}",
  "dialog.retry": "\u518D\u8A66\u884C",
  "dialog.result": "{count} \u4EF6\u306E\u30BB\u30C3\u30B7\u30E7\u30F3\u3092\u524A\u9664\u3057\u3001{size} \u3092\u89E3\u653E\u3057\u307E\u3057\u305F",
  "dialog.resultPartial": "{count} \u4EF6\u3092\u524A\u9664\u3001{failed} \u4EF6\u306F\u524A\u9664\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F",
  "dialog.resultUnknown": "{count} \u4EF6\u306E\u524A\u9664\u3092\u5B9F\u884C\u3057\u307E\u3057\u305F\u3002\u7D50\u679C\u3092\u53D6\u5F97\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u30C1\u30E3\u30C3\u30C8\u3067\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
  "dialog.deleteFailed": "\u524A\u9664\u306B\u5931\u6557\u3057\u307E\u3057\u305F\uFF1A{error}",
  "dialog.failedList": "\u524A\u9664\u3067\u304D\u306A\u304B\u3063\u305F\u3082\u306E\uFF1A",
  "dialog.done": "\u5B8C\u4E86",
  "session.missing": "\u30BB\u30C3\u30B7\u30E7\u30F3\u306E\u6E96\u5099\u304C\u3067\u304D\u3066\u3044\u306A\u3044\u305F\u3081\u5B9F\u884C\u3067\u304D\u307E\u305B\u3093\u3002",
  "command.failed": "\u30B3\u30DE\u30F3\u30C9\u306E\u5B9F\u884C\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002",
  "command.unavailable": "\u3053\u306E Host \u306F\u305D\u306E\u30B3\u30DE\u30F3\u30C9\u3092\u63D0\u4F9B\u3057\u3066\u3044\u307E\u305B\u3093\u3002"
};
var es = {
  "search.placeholder": "Buscar acciones de limpieza\u2026",
  "search.empty": "No hay sesiones para limpiar",
  "search.noResults": "No hay acciones de limpieza coincidentes",
  "group.time": "Por antig\xFCedad",
  "group.tools": "Herramientas",
  "archived.label": "Sesiones archivadas",
  "archived.detail": "{count} sesiones \xB7 {size}",
  "bucket.label": "Sesiones de m\xE1s de {days} d\xEDas",
  "bucket.detail": "{count} sesiones \xB7 {size}",
  "all.label": "Todas las sesiones",
  "all.detail": "{count} sesiones \xB7 {size}",
  "all.hint": "Abre la lista y elige las sesiones manualmente",
  "empty.label": "Sesiones vac\xEDas",
  "empty.detail": "Sesiones sin ning\xFAn mensaje de usuario",
  "prompt.title": "Gestor de prompts del sistema",
  "prompt.assembled": "Prompts ensamblados",
  "prompt.custom": "Prompts personalizados",
  "prompt.hint": "Los cambios se aplican en la pr\xF3xima solicitud al modelo; los prompts fijos de los presets de agente no se incluyen.",
  "prompt.toolsContexts": "{tools} herramientas \xB7 {contexts} contextos de ejecuci\xF3n",
  "prompt.modified": "modificado",
  "prompt.disabled": "deshabilitado",
  "prompt.edit": "Editar",
  "prompt.enable": "Habilitar",
  "prompt.disable": "Deshabilitar",
  "prompt.restore": "Restaurar",
  "prompt.confirmRestore": "\xBFRestaurar \xAB{name}\xBB?",
  "prompt.resetAll": "Restaurar todos los valores",
  "prompt.confirmResetAll": "\xBFRestaurar todas las secciones ensambladas? Los prompts personalizados se conservan.",
  "prompt.add": "A\xF1adir personalizado",
  "prompt.loading": "Cargando\u2026",
  "prompt.saved": "Guardado; se aplica en el pr\xF3ximo turno.",
  "prompt.delete": "Eliminar",
  "prompt.confirmDelete": "\xBFEliminar \xAB{title}\xBB?",
  "prompt.confirm": "Confirmar",
  "prompt.cancel": "Cancelar",
  "prompt.save": "Guardar",
  "prompt.titlePlaceholder": "T\xEDtulo del prompt personalizado",
  "prompt.textPlaceholder": "Texto del prompt\u2026",
  "prompt.assembledEmpty": "No hay secciones ensambladas que gestionar.",
  "prompt.customEmpty": "A\xFAn no hay prompts personalizados.",
  "dialog.title": "Limpiar sesiones del historial",
  "dialog.search": "Buscar t\xEDtulo o proyecto\u2026",
  "dialog.all": "Seleccionar todo",
  "dialog.none": "Limpiar",
  "dialog.selected": "{count} seleccionadas",
  "dialog.ack": "Entiendo que esto no se puede deshacer",
  "dialog.cancel": "Cancelar",
  "dialog.delete": "Eliminar permanentemente",
  "dialog.deleting": "Eliminando\u2026",
  "dialog.empty": "No hay nada que eliminar en este \xE1mbito",
  "dialog.live": "En uso",
  "dialog.liveCount": "{count} en uso (no seleccionables)",
  "dialog.loading": "Cargando sesiones\u2026",
  "dialog.summary": "{count} sesiones \xB7 {size}",
  "dialog.truncated": "Mostrando las primeras {count} de {total}",
  "dialog.noTitle": "Sesi\xF3n sin t\xEDtulo",
  "dialog.blank": "Sesi\xF3n vac\xEDa",
  "dialog.noCwd": "Sin directorio de trabajo",
  "dialog.loadFailed": "Error al cargar: {error}",
  "dialog.retry": "Reintentar",
  "dialog.result": "Se eliminaron {count} sesiones y se liberaron {size}",
  "dialog.resultPartial": "Se eliminaron {count}; {failed} no se pudieron eliminar",
  "dialog.resultUnknown": "Se solicit\xF3 eliminar {count} sesiones; no se pudo obtener el resultado; consulta el chat.",
  "dialog.deleteFailed": "Error al eliminar: {error}",
  "dialog.failedList": "No eliminadas:",
  "dialog.done": "Hecho",
  "session.missing": "La sesi\xF3n a\xFAn no est\xE1 lista.",
  "command.failed": "El comando fall\xF3.",
  "command.unavailable": "Este host no proporciona el comando."
};
var fr = {
  "search.placeholder": "Rechercher des actions de nettoyage\u2026",
  "search.empty": "Aucune session \xE0 nettoyer",
  "search.noResults": "Aucune action de nettoyage correspondante",
  "group.time": "Par anciennet\xE9",
  "group.tools": "Outils",
  "archived.label": "Sessions archiv\xE9es",
  "archived.detail": "{count} sessions \xB7 {size}",
  "bucket.label": "Sessions de plus de {days} jours",
  "bucket.detail": "{count} sessions \xB7 {size}",
  "all.label": "Toutes les sessions",
  "all.detail": "{count} sessions \xB7 {size}",
  "all.hint": "Ouvrez la liste et choisissez les sessions manuellement",
  "empty.label": "Sessions vides",
  "empty.detail": "Sessions sans aucun message d'utilisateur",
  "prompt.title": "Gestion des prompts syst\xE8me",
  "prompt.assembled": "Prompts assembl\xE9s",
  "prompt.custom": "Prompts personnalis\xE9s",
  "prompt.hint": "Les modifications s'appliquent \xE0 la prochaine requ\xEAte au mod\xE8le ; les prompts fixes des pr\xE9r\xE9glages d'agent ne sont pas inclus.",
  "prompt.toolsContexts": "{tools} outils \xB7 {contexts} contextes d\u2019ex\xE9cution",
  "prompt.modified": "modifi\xE9",
  "prompt.disabled": "d\xE9sactiv\xE9",
  "prompt.edit": "Modifier",
  "prompt.enable": "Activer",
  "prompt.disable": "D\xE9sactiver",
  "prompt.restore": "Restaurer",
  "prompt.confirmRestore": "Restaurer \xAB {name} \xBB ?",
  "prompt.resetAll": "Tout restaurer par d\xE9faut",
  "prompt.confirmResetAll": "Restaurer toutes les sections assembl\xE9es ? Les prompts personnalis\xE9s sont conserv\xE9s.",
  "prompt.add": "Ajouter un personnalis\xE9",
  "prompt.loading": "Chargement\u2026",
  "prompt.saved": "Enregistr\xE9 ; s\u2019applique au prochain tour.",
  "prompt.delete": "Supprimer",
  "prompt.confirmDelete": "Supprimer \xAB {title} \xBB ?",
  "prompt.confirm": "Confirmer",
  "prompt.cancel": "Annuler",
  "prompt.save": "Enregistrer",
  "prompt.titlePlaceholder": "Titre du prompt personnalis\xE9",
  "prompt.textPlaceholder": "Texte du prompt\u2026",
  "prompt.assembledEmpty": "Aucune section assembl\xE9e \xE0 g\xE9rer.",
  "prompt.customEmpty": "Aucun prompt personnalis\xE9 pour le moment.",
  "dialog.title": "Nettoyer l'historique des sessions",
  "dialog.search": "Rechercher un titre ou un projet\u2026",
  "dialog.all": "Tout s\xE9lectionner",
  "dialog.none": "Effacer",
  "dialog.selected": "{count} s\xE9lectionn\xE9es",
  "dialog.ack": "Je comprends que cette action est irr\xE9versible",
  "dialog.cancel": "Annuler",
  "dialog.delete": "Supprimer d\xE9finitivement",
  "dialog.deleting": "Suppression\u2026",
  "dialog.empty": "Rien \xE0 supprimer dans cette port\xE9e",
  "dialog.live": "En cours",
  "dialog.liveCount": "{count} en cours (non s\xE9lectionnables)",
  "dialog.loading": "Chargement des sessions\u2026",
  "dialog.summary": "{count} sessions \xB7 {size}",
  "dialog.truncated": "Affichage des {count} premi\xE8res sur {total}",
  "dialog.noTitle": "Session sans titre",
  "dialog.blank": "Session vide",
  "dialog.noCwd": "Aucun r\xE9pertoire de travail",
  "dialog.loadFailed": "\xC9chec du chargement : {error}",
  "dialog.retry": "R\xE9essayer",
  "dialog.result": "{count} sessions supprim\xE9es, {size} lib\xE9r\xE9s",
  "dialog.resultPartial": "{count} supprim\xE9es, {failed} non supprim\xE9es",
  "dialog.resultUnknown": "Suppression de {count} sessions demand\xE9e ; r\xE9sultat indisponible, voir le chat.",
  "dialog.deleteFailed": "\xC9chec de la suppression : {error}",
  "dialog.failedList": "Non supprim\xE9es :",
  "dialog.done": "Termin\xE9",
  "session.missing": "La session n'est pas encore pr\xEAte.",
  "command.failed": "La commande a \xE9chou\xE9.",
  "command.unavailable": "Cet h\xF4te ne fournit pas la commande."
};
var de = {
  "search.placeholder": "Bereinigungsaktionen suchen\u2026",
  "search.empty": "Keine Sitzungen zum Bereinigen",
  "search.noResults": "Keine passende Bereinigungsaktion",
  "group.time": "Nach Alter",
  "group.tools": "Werkzeuge",
  "archived.label": "Archivierte Sitzungen",
  "archived.detail": "{count} Sitzungen \xB7 {size}",
  "bucket.label": "Sitzungen \xE4lter als {days} Tage",
  "bucket.detail": "{count} Sitzungen \xB7 {size}",
  "all.label": "Alle Sitzungen",
  "all.detail": "{count} Sitzungen \xB7 {size}",
  "all.hint": "Liste \xF6ffnen und Sitzungen manuell ausw\xE4hlen",
  "empty.label": "Leere Sitzungen",
  "empty.detail": "Sitzungen ohne Benutzernachricht",
  "prompt.title": "System-Prompt-Verwaltung",
  "prompt.assembled": "Zusammengesetzte Prompts",
  "prompt.custom": "Benutzerdefinierte Prompts",
  "prompt.hint": "\xC4nderungen gelten ab der n\xE4chsten Modellanfrage; feste Prompts von Agent-Presets sind nicht enthalten.",
  "prompt.toolsContexts": "{tools} Werkzeuge \xB7 {contexts} Laufzeitkontexte",
  "prompt.modified": "ge\xE4ndert",
  "prompt.disabled": "deaktiviert",
  "prompt.edit": "Bearbeiten",
  "prompt.enable": "Aktivieren",
  "prompt.disable": "Deaktivieren",
  "prompt.restore": "Zur\xFCcksetzen",
  "prompt.confirmRestore": "\u201E{name}\u201C zur\xFCcksetzen?",
  "prompt.resetAll": "Alle Standardwerte zur\xFCcksetzen",
  "prompt.confirmResetAll": "Alle zusammengesetzten Abschnitte zur\xFCcksetzen? Benutzerdefinierte Prompts bleiben erhalten.",
  "prompt.add": "Benutzerdefiniert hinzuf\xFCgen",
  "prompt.loading": "L\xE4dt\u2026",
  "prompt.saved": "Gespeichert; gilt ab der n\xE4chsten Runde.",
  "prompt.delete": "L\xF6schen",
  "prompt.confirmDelete": "\u201E{title}\u201C l\xF6schen?",
  "prompt.confirm": "Best\xE4tigen",
  "prompt.cancel": "Abbrechen",
  "prompt.save": "Speichern",
  "prompt.titlePlaceholder": "Titel des benutzerdefinierten Prompts",
  "prompt.textPlaceholder": "Prompt-Text\u2026",
  "prompt.assembledEmpty": "Keine zusammengesetzten Abschnitte zur Verwaltung.",
  "prompt.customEmpty": "Noch keine benutzerdefinierten Prompts.",
  "dialog.title": "Verlaufssitzungen bereinigen",
  "dialog.search": "Titel oder Projekt suchen\u2026",
  "dialog.all": "Alle ausw\xE4hlen",
  "dialog.none": "Leeren",
  "dialog.selected": "{count} ausgew\xE4hlt",
  "dialog.ack": "Mir ist bewusst, dass dies nicht r\xFCckg\xE4ngig gemacht werden kann",
  "dialog.cancel": "Abbrechen",
  "dialog.delete": "Endg\xFCltig l\xF6schen",
  "dialog.deleting": "Wird gel\xF6scht\u2026",
  "dialog.empty": "In diesem Bereich gibt es nichts zu l\xF6schen",
  "dialog.live": "In Verwendung",
  "dialog.liveCount": "{count} in Verwendung (nicht ausw\xE4hlbar)",
  "dialog.loading": "Sitzungen werden geladen\u2026",
  "dialog.summary": "{count} Sitzungen \xB7 {size}",
  "dialog.truncated": "Zeige die ersten {count} von {total}",
  "dialog.noTitle": "Unbenannte Sitzung",
  "dialog.blank": "Leere Sitzung",
  "dialog.noCwd": "Kein Arbeitsverzeichnis",
  "dialog.loadFailed": "Laden fehlgeschlagen: {error}",
  "dialog.retry": "Erneut versuchen",
  "dialog.result": "{count} Sitzungen gel\xF6scht, {size} freigegeben",
  "dialog.resultPartial": "{count} gel\xF6scht, {failed} konnten nicht gel\xF6scht werden",
  "dialog.resultUnknown": "L\xF6schen von {count} Sitzungen angefordert; Ergebnis nicht abrufbar, siehe Chat.",
  "dialog.deleteFailed": "L\xF6schen fehlgeschlagen: {error}",
  "dialog.failedList": "Nicht gel\xF6scht:",
  "dialog.done": "Fertig",
  "session.missing": "Die Sitzung ist noch nicht bereit.",
  "command.failed": "Der Befehl ist fehlgeschlagen.",
  "command.unavailable": "Dieser Host stellt den Befehl nicht bereit."
};
var ru = {
  "search.placeholder": "\u041F\u043E\u0438\u0441\u043A \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439 \u043E\u0447\u0438\u0441\u0442\u043A\u0438\u2026",
  "search.empty": "\u041D\u0435\u0442 \u0441\u0435\u0441\u0441\u0438\u0439 \u0434\u043B\u044F \u043E\u0447\u0438\u0441\u0442\u043A\u0438",
  "search.noResults": "\u041D\u0435\u0442 \u043F\u043E\u0434\u0445\u043E\u0434\u044F\u0449\u0438\u0445 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439 \u043E\u0447\u0438\u0441\u0442\u043A\u0438",
  "group.time": "\u041F\u043E \u0432\u043E\u0437\u0440\u0430\u0441\u0442\u0443",
  "group.tools": "\u0418\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u044B",
  "archived.label": "\u0410\u0440\u0445\u0438\u0432\u043D\u044B\u0435 \u0441\u0435\u0441\u0441\u0438\u0438",
  "archived.detail": "{count} \u0441\u0435\u0441\u0441\u0438\u0439 \xB7 {size}",
  "bucket.label": "\u0421\u0435\u0441\u0441\u0438\u0438 \u0441\u0442\u0430\u0440\u0448\u0435 {days} \u0434\u043D\u0435\u0439",
  "bucket.detail": "{count} \u0441\u0435\u0441\u0441\u0438\u0439 \xB7 {size}",
  "all.label": "\u0412\u0441\u0435 \u0441\u0435\u0441\u0441\u0438\u0438",
  "all.detail": "{count} \u0441\u0435\u0441\u0441\u0438\u0439 \xB7 {size}",
  "all.hint": "\u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u0441\u043F\u0438\u0441\u043E\u043A \u0438 \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u0435\u0441\u0441\u0438\u0438 \u0432\u0440\u0443\u0447\u043D\u0443\u044E",
  "empty.label": "\u041F\u0443\u0441\u0442\u044B\u0435 \u0441\u0435\u0441\u0441\u0438\u0438",
  "empty.detail": "\u0421\u0435\u0441\u0441\u0438\u0438 \u0431\u0435\u0437 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F",
  "prompt.title": "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0441\u0438\u0441\u0442\u0435\u043C\u043D\u044B\u043C\u0438 \u043F\u0440\u043E\u043C\u043F\u0442\u0430\u043C\u0438",
  "prompt.assembled": "\u0421\u043E\u0431\u0440\u0430\u043D\u043D\u044B\u0435 \u043F\u0440\u043E\u043C\u043F\u0442\u044B",
  "prompt.custom": "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u0441\u043A\u0438\u0435 \u043F\u0440\u043E\u043C\u043F\u0442\u044B",
  "prompt.hint": "\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u043F\u0440\u0438\u043C\u0435\u043D\u044F\u044E\u0442\u0441\u044F \u0441\u043E \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0433\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u0430 \u043A \u043C\u043E\u0434\u0435\u043B\u0438; \u0444\u0438\u043A\u0441\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0435 \u043F\u0440\u043E\u043C\u043F\u0442\u044B \u043F\u0440\u0435\u0441\u0435\u0442\u043E\u0432 \u0430\u0433\u0435\u043D\u0442\u0430 \u0441\u044E\u0434\u0430 \u043D\u0435 \u0432\u0445\u043E\u0434\u044F\u0442.",
  "prompt.toolsContexts": "\u0418\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u043E\u0432: {tools} \xB7 \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u043E\u0432 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F: {contexts}",
  "prompt.modified": "\u0438\u0437\u043C\u0435\u043D\u0451\u043D",
  "prompt.disabled": "\u043E\u0442\u043A\u043B\u044E\u0447\u0451\u043D",
  "prompt.edit": "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C",
  "prompt.enable": "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u044C",
  "prompt.disable": "\u041E\u0442\u043A\u043B\u044E\u0447\u0438\u0442\u044C",
  "prompt.restore": "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C",
  "prompt.confirmRestore": "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \xAB{name}\xBB?",
  "prompt.resetAll": "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0432\u0441\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F",
  "prompt.confirmResetAll": "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0432\u0441\u0435 \u0441\u043E\u0431\u0440\u0430\u043D\u043D\u044B\u0435 \u0440\u0430\u0437\u0434\u0435\u043B\u044B? \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u0441\u043A\u0438\u0435 \u043F\u0440\u043E\u043C\u043F\u0442\u044B \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0442\u0441\u044F.",
  "prompt.add": "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0441\u0432\u043E\u0439",
  "prompt.loading": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026",
  "prompt.saved": "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E; \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u0441\u044F \u0441\u043E \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0433\u043E \u0445\u043E\u0434\u0430.",
  "prompt.delete": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C",
  "prompt.confirmDelete": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \xAB{title}\xBB?",
  "prompt.confirm": "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C",
  "prompt.cancel": "\u041E\u0442\u043C\u0435\u043D\u0430",
  "prompt.save": "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C",
  "prompt.titlePlaceholder": "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u0441\u043A\u043E\u0433\u043E \u043F\u0440\u043E\u043C\u043F\u0442\u0430",
  "prompt.textPlaceholder": "\u0422\u0435\u043A\u0441\u0442 \u043F\u0440\u043E\u043C\u043F\u0442\u0430\u2026",
  "prompt.assembledEmpty": "\u041D\u0435\u0442 \u0441\u043E\u0431\u0440\u0430\u043D\u043D\u044B\u0445 \u0440\u0430\u0437\u0434\u0435\u043B\u043E\u0432 \u0434\u043B\u044F \u0443\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u044F.",
  "prompt.customEmpty": "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u0441\u043A\u0438\u0445 \u043F\u0440\u043E\u043C\u043F\u0442\u043E\u0432 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442.",
  "dialog.title": "\u041E\u0447\u0438\u0441\u0442\u043A\u0430 \u0438\u0441\u0442\u043E\u0440\u0438\u0438 \u0441\u0435\u0441\u0441\u0438\u0439",
  "dialog.search": "\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044E \u0438\u043B\u0438 \u043F\u0440\u043E\u0435\u043A\u0442\u0443\u2026",
  "dialog.all": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0432\u0441\u0435",
  "dialog.none": "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C",
  "dialog.selected": "\u0412\u044B\u0431\u0440\u0430\u043D\u043E: {count}",
  "dialog.ack": "\u042F \u043F\u043E\u043D\u0438\u043C\u0430\u044E, \u0447\u0442\u043E \u044D\u0442\u043E \u043D\u0435\u043B\u044C\u0437\u044F \u043E\u0442\u043C\u0435\u043D\u0438\u0442\u044C",
  "dialog.cancel": "\u041E\u0442\u043C\u0435\u043D\u0430",
  "dialog.delete": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043D\u0430\u0432\u0441\u0435\u0433\u0434\u0430",
  "dialog.deleting": "\u0423\u0434\u0430\u043B\u0435\u043D\u0438\u0435\u2026",
  "dialog.empty": "\u0412 \u044D\u0442\u043E\u043C \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D\u0435 \u043D\u0435\u0447\u0435\u0433\u043E \u0443\u0434\u0430\u043B\u044F\u0442\u044C",
  "dialog.live": "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F",
  "dialog.liveCount": "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F: {count} (\u043D\u0435\u043B\u044C\u0437\u044F \u0432\u044B\u0431\u0440\u0430\u0442\u044C)",
  "dialog.loading": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0441\u0435\u0441\u0441\u0438\u0439\u2026",
  "dialog.summary": "{count} \u0441\u0435\u0441\u0441\u0438\u0439 \xB7 {size}",
  "dialog.truncated": "\u041F\u043E\u043A\u0430\u0437\u0430\u043D\u044B \u043F\u0435\u0440\u0432\u044B\u0435 {count} \u0438\u0437 {total}",
  "dialog.noTitle": "\u0421\u0435\u0441\u0441\u0438\u044F \u0431\u0435\u0437 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F",
  "dialog.blank": "\u041F\u0443\u0441\u0442\u0430\u044F \u0441\u0435\u0441\u0441\u0438\u044F",
  "dialog.noCwd": "\u041D\u0435\u0442 \u0440\u0430\u0431\u043E\u0447\u0435\u0433\u043E \u043A\u0430\u0442\u0430\u043B\u043E\u0433\u0430",
  "dialog.loadFailed": "\u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438: {error}",
  "dialog.retry": "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C",
  "dialog.result": "\u0423\u0434\u0430\u043B\u0435\u043D\u043E \u0441\u0435\u0441\u0441\u0438\u0439: {count}, \u043E\u0441\u0432\u043E\u0431\u043E\u0436\u0434\u0435\u043D\u043E {size}",
  "dialog.resultPartial": "\u0423\u0434\u0430\u043B\u0435\u043D\u043E {count}, \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0443\u0434\u0430\u043B\u0438\u0442\u044C {failed}",
  "dialog.resultUnknown": "\u0417\u0430\u043F\u0440\u043E\u0448\u0435\u043D\u043E \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0435 {count} \u0441\u0435\u0441\u0441\u0438\u0439; \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D, \u0441\u043C. \u0447\u0430\u0442.",
  "dialog.deleteFailed": "\u041E\u0448\u0438\u0431\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F: {error}",
  "dialog.failedList": "\u041D\u0435 \u0443\u0434\u0430\u043B\u0435\u043D\u043E:",
  "dialog.done": "\u0413\u043E\u0442\u043E\u0432\u043E",
  "session.missing": "\u0421\u0435\u0441\u0441\u0438\u044F \u0435\u0449\u0451 \u043D\u0435 \u0433\u043E\u0442\u043E\u0432\u0430.",
  "command.failed": "\u041A\u043E\u043C\u0430\u043D\u0434\u0430 \u043D\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0430.",
  "command.unavailable": "\u042D\u0442\u043E\u0442 \u0445\u043E\u0441\u0442 \u043D\u0435 \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u0442 \u043A\u043E\u043C\u0430\u043D\u0434\u0443."
};
var pt = {
  "search.placeholder": "Pesquisar a\xE7\xF5es de limpeza\u2026",
  "search.empty": "Nenhuma sess\xE3o para limpar",
  "search.noResults": "Nenhuma a\xE7\xE3o de limpeza correspondente",
  "group.time": "Por idade",
  "group.tools": "Ferramentas",
  "archived.label": "Sess\xF5es arquivadas",
  "archived.detail": "{count} sess\xF5es \xB7 {size}",
  "bucket.label": "Sess\xF5es com mais de {days} dias",
  "bucket.detail": "{count} sess\xF5es \xB7 {size}",
  "all.label": "Todas as sess\xF5es",
  "all.detail": "{count} sess\xF5es \xB7 {size}",
  "all.hint": "Abra a lista e escolha as sess\xF5es manualmente",
  "empty.label": "Sess\xF5es vazias",
  "empty.detail": "Sess\xF5es sem nenhuma mensagem do usu\xE1rio",
  "prompt.title": "Gerenciador de prompts do sistema",
  "prompt.assembled": "Prompts montados",
  "prompt.custom": "Prompts personalizados",
  "prompt.hint": "As altera\xE7\xF5es valem a partir da pr\xF3xima solicita\xE7\xE3o ao modelo; prompts fixos de presets de agente n\xE3o entram aqui.",
  "prompt.toolsContexts": "{tools} ferramentas \xB7 {contexts} contextos de execu\xE7\xE3o",
  "prompt.modified": "modificado",
  "prompt.disabled": "desativado",
  "prompt.edit": "Editar",
  "prompt.enable": "Ativar",
  "prompt.disable": "Desativar",
  "prompt.restore": "Restaurar",
  "prompt.confirmRestore": 'Restaurar "{name}"?',
  "prompt.resetAll": "Restaurar todos os padr\xF5es",
  "prompt.confirmResetAll": "Restaurar todas as se\xE7\xF5es montadas? Os prompts personalizados s\xE3o mantidos.",
  "prompt.add": "Adicionar personalizado",
  "prompt.loading": "Carregando\u2026",
  "prompt.saved": "Salvo; aplica-se no pr\xF3ximo turno.",
  "prompt.delete": "Excluir",
  "prompt.confirmDelete": 'Excluir "{title}"?',
  "prompt.confirm": "Confirmar",
  "prompt.cancel": "Cancelar",
  "prompt.save": "Salvar",
  "prompt.titlePlaceholder": "T\xEDtulo do prompt personalizado",
  "prompt.textPlaceholder": "Texto do prompt\u2026",
  "prompt.assembledEmpty": "Nenhuma se\xE7\xE3o montada para gerenciar.",
  "prompt.customEmpty": "Ainda n\xE3o h\xE1 prompts personalizados.",
  "dialog.title": "Limpar sess\xF5es do hist\xF3rico",
  "dialog.search": "Pesquisar t\xEDtulo ou projeto\u2026",
  "dialog.all": "Selecionar tudo",
  "dialog.none": "Limpar",
  "dialog.selected": "{count} selecionadas",
  "dialog.ack": "Entendo que isto n\xE3o pode ser desfeito",
  "dialog.cancel": "Cancelar",
  "dialog.delete": "Excluir permanentemente",
  "dialog.deleting": "Excluindo\u2026",
  "dialog.empty": "Nada para excluir neste escopo",
  "dialog.live": "Em uso",
  "dialog.liveCount": "{count} em uso (n\xE3o selecion\xE1veis)",
  "dialog.loading": "Carregando sess\xF5es\u2026",
  "dialog.summary": "{count} sess\xF5es \xB7 {size}",
  "dialog.truncated": "Mostrando as primeiras {count} de {total}",
  "dialog.noTitle": "Sess\xE3o sem t\xEDtulo",
  "dialog.blank": "Sess\xE3o vazia",
  "dialog.noCwd": "Sem diret\xF3rio de trabalho",
  "dialog.loadFailed": "Falha ao carregar: {error}",
  "dialog.retry": "Tentar novamente",
  "dialog.result": "{count} sess\xF5es exclu\xEDdas, {size} liberados",
  "dialog.resultPartial": "{count} exclu\xEDdas, {failed} n\xE3o puderam ser exclu\xEDdas",
  "dialog.resultUnknown": "Exclus\xE3o de {count} sess\xF5es solicitada; n\xE3o foi poss\xEDvel obter o resultado \u2014 veja o chat.",
  "dialog.deleteFailed": "Falha ao excluir: {error}",
  "dialog.failedList": "N\xE3o exclu\xEDdas:",
  "dialog.done": "Conclu\xEDdo",
  "session.missing": "A sess\xE3o ainda n\xE3o est\xE1 pronta.",
  "command.failed": "O comando falhou.",
  "command.unavailable": "Este host n\xE3o fornece o comando."
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

// src/client/promptDialog.ts
var LIST_ENDPOINT = "/api/dsh-extend/prompts";
var TEXT_ENDPOINT = "/api/dsh-extend/prompts/text";
var SAVE_ENDPOINT = "/api/dsh-extend/prompts/save";
var active;
function ensureStyles() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-plugin-css="dsh-extend/prompt"]') !== null) return;
  const style = document.createElement("style");
  style.dataset.pluginCss = "dsh-extend/prompt";
  style.textContent = [
    ".dxp-backdrop{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--dsw-alias-bg-mask-1,rgba(0,0,0,.5));backdrop-filter:var(--dsw-mask-blur,none)}",
    ".dxp-panel [hidden]{display:none!important}",
    ".dxp-panel{position:relative;display:flex;flex-direction:column;width:min(760px,94vw);height:min(86vh,820px);border-radius:var(--dsw-radius-panel,16px);overflow:hidden;font:inherit;background:var(--dsw-alias-bg-layer-2,#2c2c2e);color:var(--dsw-alias-label-primary,#f2f3f5);box-shadow:var(--dsw-elevation-prominent,0 24px 64px rgba(0,0,0,.5))}",
    ".dxp-head{display:flex;align-items:center;gap:12px;padding:16px 18px 10px}",
    ".dxp-title{flex:1;font-size:16px;font-weight:600;line-height:24px}",
    ".dxp-close{width:28px;height:28px;border:none;border-radius:var(--dsw-radius-sm,6px);background:transparent;color:var(--dsw-alias-label-primary,#f2f3f5);font-size:16px;line-height:1;cursor:pointer}",
    ".dxp-close:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}",
    ".dxp-tabs{display:flex;gap:6px;padding:0 18px 8px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.06))}",
    ".dxp-tab{border:none;background:transparent;color:var(--dsw-alias-label-secondary,#a9adb8);font:inherit;font-size:13px;padding:7px 12px;border-radius:var(--dsw-radius-md,8px) var(--dsw-radius-md,8px) 0 0;cursor:pointer}",
    ".dxp-tab.active{color:var(--dsw-alias-label-primary,#f2f3f5);background:var(--dsw-alias-interactive-bg-active,rgba(255,255,255,.14))}",
    ".dxp-hint{padding:10px 18px 4px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#a9adb8)}",
    ".dxp-body{flex:1;min-height:160px;overflow:auto;padding:4px 10px 12px}",
    ".dxp-row{display:flex;flex-direction:column;gap:6px;padding:9px 10px;border-radius:var(--dsw-radius-md,8px)}",
    ".dxp-row-head{display:flex;align-items:center;gap:12px}",
    ".dxp-prompt-text{margin:0;padding:8px 10px;border-radius:var(--dsw-radius-md,8px);background:var(--dsw-alias-bg-layer-1,#232325);font:12px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap;word-break:break-word;max-height:220px;overflow:auto;color:var(--dsw-alias-label-secondary,#a9adb8)}",
    ".dxp-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}",
    ".dxp-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}",
    ".dxp-name{font-size:13px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--dsw-alias-label-primary,#f2f3f5)}",
    ".dxp-meta{font-size:11.5px;color:var(--dsw-alias-label-secondary,#a9adb8)}",
    ".dxp-actions{display:flex;gap:4px;flex-shrink:0}",
    ".dxp-link{border:none;background:none;padding:4px 7px;border-radius:var(--dsw-radius-sm,6px);color:var(--dsw-alias-label-primary,#f2f3f5);font:inherit;font-size:12px;cursor:pointer}",
    ".dxp-link:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}",
    ".dxp-link.danger{color:var(--dsw-alias-state-error-primary,#ef6b6b)}",
    ".dxp-badge{display:inline-block;margin-left:6px;padding:0 6px;border-radius:var(--dsw-radius-sm,6px);font-size:10.5px;background:var(--dsw-alias-bg-layer-1,#232325);color:var(--dsw-alias-label-secondary,#a9adb8)}",
    ".dxp-foot{display:flex;align-items:center;gap:8px;padding:10px 16px 14px;border-top:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.06))}",
    ".dxp-status{flex:1;font-size:12px;color:var(--dsw-alias-label-secondary,#a9adb8);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".dxp-status.error{color:var(--dsw-alias-state-error-primary,#ef6b6b)}",
    ".dxp-btn{height:32px;padding:0 14px;border-radius:var(--dsw-radius-md,8px);border:none;box-shadow:inset 0 0 0 .5px var(--dsw-alias-border-l3,rgba(255,255,255,.16));background:transparent;color:var(--dsw-alias-label-primary,#f2f3f5);font:inherit;font-size:12.5px;cursor:pointer}",
    ".dxp-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}",
    ".dxp-btn.primary{background:var(--dsw-alias-button-primary-fill,#f2f3f5);box-shadow:none;color:var(--dsw-alias-label-primary-foreground,#0f1115)}",
    ".dxp-btn.primary:hover{background:var(--dsw-alias-button-primary-hover,#e5e6e8)}",
    ".dxp-confirm{display:flex;align-items:center;gap:8px;margin:0 16px 8px;padding:8px 10px;border-radius:var(--dsw-radius-md,8px);background:var(--dsw-alias-bg-layer-1,#232325);border:1px solid var(--dsw-alias-border-l3,rgba(255,255,255,.16));font-size:12px}",
    ".dxp-confirm span{flex:1}",
    ".dxp-editor{position:absolute;inset:0;display:flex;flex-direction:column;background:var(--dsw-alias-bg-layer-2,#2c2c2e)}",
    ".dxp-editor-head{display:flex;align-items:center;gap:10px;padding:16px 18px 10px}",
    ".dxp-editor-name{flex:1;font-size:13px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".dxp-field{display:flex;flex-direction:column;gap:6px;padding:4px 18px 8px}",
    ".dxp-label{font-size:12px;color:var(--dsw-alias-label-secondary,#a9adb8)}",
    ".dxp-input{height:32px;padding:0 10px;border-radius:var(--dsw-radius-md,8px);border:.5px solid var(--dsw-alias-border-l4,rgba(255,255,255,.2));background:var(--dsw-alias-bg-layer-1,#232325);color:var(--dsw-alias-label-primary,#f2f3f5);font:inherit;font-size:13px;outline:none}",
    ".dxp-input:focus{border-color:var(--dsw-alias-state-business-primary,#4d6bfe)}",
    ".dxp-textarea{flex:1;min-height:260px;margin:0 18px 10px;padding:10px 12px;border-radius:var(--dsw-radius-md,8px);border:.5px solid var(--dsw-alias-border-l4,rgba(255,255,255,.2));background:var(--dsw-alias-bg-layer-1,#232325);color:var(--dsw-alias-label-primary,#f2f3f5);font:12.5px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;outline:none;resize:none;white-space:pre-wrap}",
    ".dxp-textarea:focus{border-color:var(--dsw-alias-state-business-primary,#4d6bfe)}",
    ".dxp-editor-foot{display:flex;gap:8px;padding:10px 18px 16px;border-top:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.06))}",
    ".dxp-grow{flex:1}"
  ].join("\n");
  document.head.append(style);
}
function el(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== void 0) node.textContent = text;
  return node;
}
async function requestJson(url, init) {
  const response = await fetch(url, { cache: "no-store", ...init });
  const payload = await response.json();
  if (!response.ok || payload.ok === false) throw new Error(payload.error ?? `HTTP ${response.status}`);
  return payload;
}
function openPromptDialog(options) {
  if (typeof document === "undefined") return { close: () => {
  } };
  active?.close();
  ensureStyles();
  const { t } = options;
  const backdrop = el("div", "dxp-backdrop");
  const panel = el("div", "dxp-panel");
  backdrop.append(panel);
  let list;
  let tab = "assembled";
  let editor;
  let busy = false;
  let closed = false;
  let status = "";
  let statusError = false;
  let editorConfirm = false;
  let confirm = void 0;
  const head = el("div", "dxp-head");
  head.append(el("span", "dxp-title", t("prompt.title")));
  const closeButton = el("button", "dxp-close", "\xD7");
  closeButton.type = "button";
  closeButton.addEventListener("click", () => {
    handle.close();
  });
  head.append(closeButton);
  panel.append(head);
  const tabs = el("div", "dxp-tabs");
  const assembledTab = el("button", "dxp-tab", t("prompt.assembled"));
  const customTab = el("button", "dxp-tab", t("prompt.custom"));
  assembledTab.type = "button";
  customTab.type = "button";
  assembledTab.addEventListener("click", () => {
    if (editor !== void 0) return;
    tab = "assembled";
    render();
  });
  customTab.addEventListener("click", () => {
    if (editor !== void 0) return;
    tab = "custom";
    render();
  });
  tabs.append(assembledTab, customTab);
  panel.append(tabs);
  const hint = el("div", "dxp-hint", t("prompt.hint"));
  panel.append(hint);
  const body = el("div", "dxp-body");
  panel.append(body);
  const confirmBar = el("div", "dxp-confirm");
  confirmBar.hidden = true;
  panel.append(confirmBar);
  const foot = el("div", "dxp-foot");
  const statusLabel = el("span", "dxp-status");
  const resetAllButton = el("button", "dxp-btn", t("prompt.resetAll"));
  const addButton = el("button", "dxp-btn primary", t("prompt.add"));
  resetAllButton.type = "button";
  addButton.type = "button";
  foot.append(statusLabel, resetAllButton, addButton);
  panel.append(foot);
  const editorLayer = el("div", "dxp-editor");
  editorLayer.hidden = true;
  panel.append(editorLayer);
  const setStatus = (message, isError = false) => {
    status = message;
    statusError = isError;
    statusLabel.textContent = message;
    statusLabel.classList.toggle("error", isError);
  };
  const defaultStatus = () => list === void 0 ? "" : t("prompt.toolsContexts", { tools: list.tools, contexts: list.contexts });
  const applyList = (payload) => {
    list = payload;
    if (!busy) setStatus(defaultStatus());
    render();
  };
  const refresh = async () => {
    try {
      const payload = await requestJson(LIST_ENDPOINT);
      if (closed) return;
      applyList(payload);
    } catch (error) {
      if (!closed) setStatus(error instanceof Error ? error.message : String(error), true);
    }
  };
  const save = async (change) => {
    setStatus(t("prompt.loading"));
    try {
      await requestJson(SAVE_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(change)
      });
      if (closed) return false;
      setStatus(t("prompt.saved"));
      await refresh();
      return true;
    } catch (error) {
      if (!closed) setStatus(error instanceof Error ? error.message : String(error), true);
      return false;
    }
  };
  const requestConfirm = (message, run) => {
    confirm = { message, run };
    render();
  };
  const openAssembledEditor = async (section) => {
    setStatus(t("prompt.loading"));
    try {
      const payload = await requestJson(`${TEXT_ENDPOINT}?name=${encodeURIComponent(section.name)}`);
      if (closed) return;
      editorConfirm = false;
      editor = { mode: "assembled", name: section.name, text: payload.text };
      setStatus(defaultStatus());
      render();
    } catch (error) {
      if (!closed) setStatus(error instanceof Error ? error.message : String(error), true);
    }
  };
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  const renderAssembledRow = (section) => {
    const row = el("div", "dxp-row");
    const main = el("div", "dxp-main");
    const name = el("span", "dxp-name", section.name);
    const meta = el("span", "dxp-meta", formatSize(section.size));
    if (section.overridden) meta.append(el("span", "dxp-badge", t("prompt.modified")));
    if (section.disabled) meta.append(el("span", "dxp-badge", t("prompt.disabled")));
    main.append(name, meta);
    const actions = el("div", "dxp-actions");
    const edit = el("button", "dxp-link", t("prompt.edit"));
    edit.type = "button";
    edit.disabled = busy;
    edit.addEventListener("click", () => {
      void openAssembledEditor(section);
    });
    actions.append(edit);
    const toggle = el("button", "dxp-link", section.disabled ? t("prompt.enable") : t("prompt.disable"));
    toggle.type = "button";
    toggle.disabled = busy;
    toggle.addEventListener("click", () => {
      void save({ action: section.disabled ? "enable" : "disable", name: section.name });
    });
    actions.append(toggle);
    if (section.overridden || section.disabled) {
      const restore = el("button", "dxp-link", t("prompt.restore"));
      restore.type = "button";
      restore.disabled = busy;
      restore.addEventListener("click", () => {
        requestConfirm(t("prompt.confirmRestore", { name: section.name }), () => {
          void save({ action: "reset", name: section.name });
        });
      });
      actions.append(restore);
    }
    const head2 = el("div", "dxp-row-head");
    head2.append(main, actions);
    row.append(head2);
    if (section.text !== "") row.append(el("pre", "dxp-prompt-text", section.text));
    return row;
  };
  const renderCustomRow = (item) => {
    const row = el("div", "dxp-row");
    const main = el("div", "dxp-main");
    const title = el("span", "dxp-name", item.title);
    const meta = el("span", "dxp-meta", `${formatSize(new TextEncoder().encode(item.text).length)} \xB7 ${item.id}`);
    if (!item.enabled) meta.append(el("span", "dxp-badge", t("prompt.disabled")));
    main.append(title, meta);
    const actions = el("div", "dxp-actions");
    const edit = el("button", "dxp-link", t("prompt.edit"));
    edit.type = "button";
    edit.disabled = busy;
    edit.addEventListener("click", () => {
      editorConfirm = false;
      editor = { mode: "custom", id: item.id, title: item.title, text: item.text };
      render();
    });
    const toggle = el("button", "dxp-link", item.enabled ? t("prompt.disable") : t("prompt.enable"));
    toggle.type = "button";
    toggle.disabled = busy;
    toggle.addEventListener("click", () => {
      void save({ action: "toggle", id: item.id, enabled: !item.enabled });
    });
    const remove = el("button", "dxp-link danger", t("prompt.delete"));
    remove.type = "button";
    remove.disabled = busy;
    remove.addEventListener("click", () => {
      requestConfirm(t("prompt.confirmDelete", { title: item.title }), () => {
        void save({ action: "remove", id: item.id });
      });
    });
    actions.append(edit, toggle, remove);
    const head2 = el("div", "dxp-row-head");
    head2.append(main, actions);
    row.append(head2);
    if (item.text !== "") row.append(el("pre", "dxp-prompt-text", item.text));
    return row;
  };
  const renderEditor = () => {
    editorLayer.replaceChildren();
    if (editor === void 0) {
      editorLayer.hidden = true;
      return;
    }
    editorLayer.hidden = false;
    const headRow = el("div", "dxp-editor-head");
    const title = editor.mode === "assembled" ? el("span", "dxp-editor-name", editor.name ?? "") : el("input", "dxp-input");
    if (title instanceof HTMLInputElement) {
      title.value = editor.title ?? "";
      title.placeholder = t("prompt.titlePlaceholder");
      title.maxLength = 200;
      headRow.append(title);
    } else {
      headRow.append(title);
    }
    const close = el("button", "dxp-close", "\xD7");
    close.type = "button";
    close.addEventListener("click", () => {
      editorConfirm = false;
      editor = void 0;
      setStatus(defaultStatus());
      render();
    });
    headRow.append(close);
    editorLayer.append(headRow);
    const area = el("textarea", "dxp-textarea");
    area.value = editor.text;
    area.placeholder = t("prompt.textPlaceholder");
    area.spellcheck = false;
    editorLayer.append(area);
    const footRow = el("div", "dxp-editor-foot");
    const saveButton = el("button", "dxp-btn primary", editor.mode === "add" ? t("prompt.add") : t("prompt.save"));
    saveButton.type = "button";
    saveButton.disabled = busy;
    saveButton.addEventListener("click", () => {
      if (editor === void 0) return;
      const text = area.value;
      const current = editor;
      busy = true;
      void (async () => {
        let change;
        if (current.mode === "assembled") change = { action: "set", name: current.name, text };
        else if (current.mode === "add") change = { action: "add", title: title instanceof HTMLInputElement ? title.value : "", text };
        else change = { action: "update", id: current.id, ...title instanceof HTMLInputElement ? { title: title.value } : {}, text };
        const ok = change === void 0 ? false : await save(change);
        busy = false;
        if (ok) {
          editor = void 0;
          setStatus(defaultStatus());
          render();
        }
      })();
    });
    footRow.append(saveButton);
    if (editor.mode === "assembled") {
      const restore = el("button", "dxp-btn", t("prompt.restore"));
      restore.type = "button";
      restore.disabled = busy;
      restore.addEventListener("click", () => {
        editorConfirm = true;
        render();
      });
      footRow.append(restore);
    }
    const cancel = el("button", "dxp-btn", t("prompt.cancel"));
    cancel.type = "button";
    cancel.addEventListener("click", () => {
      editorConfirm = false;
      editor = void 0;
      setStatus(defaultStatus());
      render();
    });
    const spacer = el("span", "dxp-grow");
    footRow.append(spacer, cancel);
    editorLayer.append(footRow);
    if (editorConfirm) {
      const bar = el("div", "dxp-confirm");
      bar.append(el("span", "", t("prompt.confirmRestore", { name: editor.name ?? "" })));
      const ok = el("button", "dxp-btn", t("prompt.confirm"));
      ok.type = "button";
      ok.addEventListener("click", () => {
        const name = editor?.name;
        if (name === void 0) return;
        editorConfirm = false;
        editor = void 0;
        render();
        void save({ action: "reset", name });
      });
      const cancel2 = el("button", "dxp-btn", t("prompt.cancel"));
      cancel2.type = "button";
      cancel2.addEventListener("click", () => {
        editorConfirm = false;
        render();
      });
      bar.append(ok, cancel2);
      editorLayer.append(bar);
    }
  };
  const render = () => {
    if (closed) return;
    assembledTab.classList.toggle("active", tab === "assembled");
    customTab.classList.toggle("active", tab === "custom");
    resetAllButton.hidden = tab !== "assembled";
    addButton.hidden = tab !== "custom";
    resetAllButton.disabled = busy;
    addButton.disabled = busy;
    body.replaceChildren();
    if (list === void 0) {
      body.append(el("div", "dxp-meta", t("prompt.loading")));
    } else if (tab === "assembled") {
      if (list.assembled.length === 0) body.append(el("div", "dxp-meta", t("prompt.assembledEmpty")));
      for (const section of list.assembled) body.append(renderAssembledRow(section));
    } else {
      if (list.custom.length === 0) body.append(el("div", "dxp-meta", t("prompt.customEmpty")));
      for (const item of list.custom) body.append(renderCustomRow(item));
    }
    confirmBar.replaceChildren();
    if (confirm !== void 0) {
      confirmBar.hidden = false;
      const message = el("span", "", confirm.message);
      const ok = el("button", "dxp-btn", t("prompt.confirm"));
      ok.type = "button";
      const cancel = el("button", "dxp-btn", t("prompt.cancel"));
      cancel.type = "button";
      ok.addEventListener("click", () => {
        const run = confirm?.run;
        confirm = void 0;
        if (run !== void 0) run();
        render();
      });
      cancel.addEventListener("click", () => {
        confirm = void 0;
        render();
      });
      confirmBar.append(message, ok, cancel);
    } else {
      confirmBar.hidden = true;
    }
    renderEditor();
    statusLabel.textContent = status;
    statusLabel.classList.toggle("error", statusError);
  };
  resetAllButton.addEventListener("click", () => {
    requestConfirm(t("prompt.confirmResetAll"), () => {
      void save({ action: "reset-all" });
    });
  });
  addButton.addEventListener("click", () => {
    editorConfirm = false;
    editor = { mode: "add", title: "", text: "" };
    render();
  });
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) handle.close();
  });
  const onKey = (event) => {
    if (event.key === "Escape" && editor === void 0 && confirm === void 0) handle.close();
  };
  document.addEventListener("keydown", onKey);
  const handle = {
    close: () => {
      if (closed) return;
      closed = true;
      document.removeEventListener("keydown", onKey);
      backdrop.remove();
      if (active === handle) active = void 0;
    }
  };
  active = handle;
  document.body.append(backdrop);
  render();
  void refresh();
  return handle;
}
function closePromptDialog() {
  active?.close();
  active = void 0;
}

// src/client/dialog.ts
var active2;
function ensureStyles2() {
  if (typeof document === "undefined") return;
  if (document.querySelector('style[data-plugin-css="dsh-extend/dialog"]') !== null) return;
  const style = document.createElement("style");
  style.dataset.plugin = "dsh-extend";
  style.dataset.pluginCss = "dsh-extend/dialog";
  style.textContent = `
.dx-backdrop{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--dsw-alias-bg-mask-1,rgba(0,0,0,.5));backdrop-filter:var(--dsw-mask-blur,none)}
.dx-dialog{width:min(680px,94vw);max-height:min(82vh,760px);display:flex;flex-direction:column;border-radius:var(--dsw-radius-panel,16px);overflow:hidden;font:inherit;background:var(--dsw-alias-bg-layer-2,#2c2c2e);color:var(--dsw-alias-label-primary,#f2f3f5);box-shadow:var(--dsw-elevation-prominent,0 24px 64px rgba(0,0,0,.5))}
.dx-head{display:flex;align-items:center;gap:12px;padding:18px 20px 8px}
.dx-head h2{margin:0;flex:1;font-size:16px;font-weight:600;line-height:24px}
.dx-close{width:28px;height:28px;border:none;border-radius:var(--dsw-radius-sm,6px);background:transparent;color:var(--dsw-alias-label-primary,#f2f3f5);font-size:16px;line-height:1;cursor:pointer}
.dx-close:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}
.dx-sub{padding:0 20px 10px;font-size:12.5px;line-height:18px;color:var(--dsw-alias-label-secondary,#a9adb8)}
.dx-body{display:flex;flex-direction:column;flex:1;min-height:0}
.dx-toolbar{display:flex;align-items:center;gap:8px;padding:0 20px 10px}
.dx-search{flex:1;height:32px;padding:0 10px;border-radius:var(--dsw-radius-md,8px);border:.5px solid var(--dsw-alias-border-l4,rgba(255,255,255,.2));background:var(--dsw-alias-bg-layer-1,#232325);color:var(--dsw-alias-label-primary,#f2f3f5);font:inherit;font-size:13px;outline:none}
.dx-search:focus{border-color:var(--dsw-alias-state-business-primary,#4d6bfe)}
.dx-link{border:none;background:none;padding:4px 6px;border-radius:var(--dsw-radius-sm,6px);color:var(--dsw-alias-label-primary,#f2f3f5);font:inherit;font-size:12.5px;cursor:pointer}
.dx-link:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}
.dx-list{flex:1;min-height:120px;overflow:auto;margin:0 12px;padding:4px;border-top:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.06));border-bottom:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.06))}
.dx-row{display:flex;align-items:flex-start;gap:10px;padding:9px 10px;border-radius:var(--dsw-radius-md,8px);cursor:pointer}
.dx-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.07))}
.dx-row[data-live=true]{cursor:default;opacity:.6}
.dx-row[data-live=true]:hover{background:transparent}
.dx-row[hidden]{display:none}
.dx-check{margin:2px 0 0;width:15px;height:15px;accent-color:var(--dsw-alias-state-business-primary,#4b7dff);flex:none;cursor:inherit}
.dx-main{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.dx-title{font-size:13.5px;line-height:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--dsw-alias-label-primary,#f2f3f5)}
.dx-meta{font-size:11.5px;line-height:16px;color:var(--dsw-alias-label-secondary,#9aa0ad);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dx-badge{flex:none;margin-top:2px;padding:1px 7px;border-radius:999px;font-size:11px;line-height:16px;background:var(--dsw-alias-bg-layer-1,#232325);color:var(--dsw-alias-label-secondary,#a9adb8)}
.dx-empty{padding:36px 16px;text-align:center;font-size:13px;color:var(--dsw-alias-label-secondary,#9aa0ad)}
.dx-foot{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 20px 16px}
.dx-ack{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--dsw-alias-label-secondary,#a9adb8);cursor:pointer;user-select:none}
.dx-count{font-size:12.5px;color:var(--dsw-alias-label-secondary,#a9adb8)}
.dx-actions{margin-left:auto;display:flex;gap:8px}
.dx-btn{height:32px;padding:0 14px;border-radius:var(--dsw-radius-md,8px);border:none;box-shadow:inset 0 0 0 .5px var(--dsw-alias-border-l3,rgba(255,255,255,.16));background:transparent;color:var(--dsw-alias-label-primary,#f2f3f5);font:inherit;font-size:13px;cursor:pointer}
.dx-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}
.dx-btn.primary{background:var(--dsw-alias-button-primary-fill,#f2f3f5);box-shadow:none;color:var(--dsw-alias-label-primary-foreground,#0f1115)}
.dx-btn.primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,#e5e6e8)}
.dx-btn.danger{background:var(--dsw-alias-state-error-primary,#d93025);box-shadow:none;color:var(--dsw-alias-label-primary-foreground,#fff)}
.dx-btn.danger:hover:not(:disabled){background:var(--dsw-alias-state-error-primary,#d93025);opacity:.9}
.dx-btn:disabled{opacity:.45;cursor:not-allowed}
.dx-error{margin:0 20px 12px;padding:10px 12px;border-radius:var(--dsw-radius-md,8px);font-size:12.5px;line-height:18px;color:var(--dsw-alias-state-error-primary,#ff7b7b);background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#e5484d) 12%,transparent);white-space:pre-wrap}
.dx-result{padding:28px 24px;display:flex;flex-direction:column;gap:10px}
.dx-result-title{font-size:15px;font-weight:600}
.dx-result-detail{font-size:12.5px;line-height:19px;color:var(--dsw-alias-label-secondary,#a9adb8);white-space:pre-wrap;max-height:180px;overflow:auto}
.dx-result .dx-actions{margin-left:0;justify-content:flex-end}
`;
  document.head.appendChild(style);
}
function el2(tag, className, text) {
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
  active2?.close();
  ensureStyles2();
  const { t } = options;
  const controller = new AbortController();
  const selected = /* @__PURE__ */ new Set();
  let rows = [];
  let busy = false;
  let closed = false;
  let ack = false;
  const backdrop = el2("div", "dx-backdrop");
  const panel = el2("div", "dx-dialog");
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  const headingId = `dx-title-${Math.random().toString(36).slice(2, 8)}`;
  panel.setAttribute("aria-labelledby", headingId);
  const head = el2("div", "dx-head");
  const heading = el2("h2", "", t("dialog.title"));
  heading.id = headingId;
  const closeButton = el2("button", "dx-close", "\u2715");
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", t("dialog.cancel"));
  head.append(heading, closeButton);
  const body = el2("div", "dx-body");
  const subtitle = el2("div", "dx-sub", t("dialog.loading"));
  const toolbar = el2("div", "dx-toolbar");
  const search = el2("input", "dx-search");
  search.type = "search";
  search.placeholder = t("dialog.search");
  const selectAll = el2("button", "dx-link", t("dialog.all"));
  selectAll.type = "button";
  const selectNone = el2("button", "dx-link", t("dialog.none"));
  selectNone.type = "button";
  toolbar.append(search, selectAll, selectNone);
  const list = el2("div", "dx-list");
  const errorBox = el2("div", "dx-error");
  body.append(subtitle, toolbar, list);
  const foot = el2("div", "dx-foot");
  const ackLabel = el2("label", "dx-ack");
  const ackInput = el2("input", "dx-check");
  ackInput.type = "checkbox";
  ackLabel.append(ackInput, document.createTextNode(t("dialog.ack")));
  const count = el2("span", "dx-count", t("dialog.selected", { count: 0 }));
  const actions = el2("div", "dx-actions");
  const cancel = el2("button", "dx-btn", t("dialog.cancel"));
  cancel.type = "button";
  const remove = el2("button", "dx-btn danger", t("dialog.delete"));
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
    if (active2 === handle) active2 = void 0;
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
      list.append(el2("div", "dx-empty", t("dialog.empty")));
      updateFooter();
      return;
    }
    const fragment = document.createDocumentFragment();
    for (const row of rows) {
      const rowEl = el2("div", "dx-row");
      rowEl.dataset.id = row.id;
      rowEl.dataset.live = String(row.live);
      const input = el2("input", "dx-check");
      input.type = "checkbox";
      input.checked = row.suggested && !row.live;
      if (row.live) input.disabled = true;
      if (input.checked) selected.add(row.id);
      const main = el2("span", "dx-main");
      const title = el2("span", "dx-title", row.title ?? t("dialog.noTitle"));
      title.title = row.title ?? row.id;
      const shortId = row.id.startsWith("session-") ? row.id.slice(8, 16) : row.id.slice(0, 8);
      const metaParts = [row.cwd ?? t("dialog.noCwd"), formatTime(row.lastActivity), formatBytes(row.bytes)];
      if (row.title === void 0) metaParts.unshift(shortId);
      const meta = el2("span", "dx-meta", metaParts.join(" \xB7 "));
      meta.title = row.cwd ?? "";
      main.append(title, meta);
      rowEl.append(input, main);
      if (row.live) rowEl.append(el2("span", "dx-badge", t("dialog.live")));
      else if (row.blank === true) rowEl.append(el2("span", "dx-badge", t("dialog.blank")));
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
      const button = el2("button", "dx-link", t("dialog.retry"));
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
    const resultBox = el2("div", "dx-result");
    const title = el2("div", "dx-result-title");
    const detail = el2("div", "dx-result-detail");
    if (summary === void 0) {
      title.textContent = t("dialog.resultUnknown", { count: requested });
    } else {
      title.textContent = summary.failed.length === 0 ? t("dialog.result", { count: summary.deleted.length, size: formatBytes(summary.bytes) }) : t("dialog.resultPartial", { count: summary.deleted.length, failed: summary.failed.length });
      if (summary.failed.length > 0) {
        detail.textContent = `${t("dialog.failedList")}
${summary.failed.slice(0, 10).map((item) => `${item.id}\uFF1A${item.reason}`).join("\n")}`;
      }
    }
    const actionsRow = el2("div", "dx-actions");
    const done = el2("button", "dx-btn primary", t("dialog.done"));
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
  active2 = handle;
  load();
  search.focus();
  return handle;
}
function closeCleanDialog() {
  active2?.close();
  active2 = void 0;
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
  ctx.effect(() => ctx.locale.register(NS, { zh, en, ja, es, fr, de, ru, pt }), "dsh-extend: dictionaries");
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
    closePromptDialog();
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
        closePromptDialog();
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
  ctx.effect(() => ctx.commandUi.decorate({
    name: "prompt",
    available: () => true,
    ui: {
      kind: "action",
      run: (session) => {
        clearComposerDraft(ctx, session);
        closeCleanDialog();
        openPromptDialog({ t });
      }
    }
  }), "dsh-extend: /prompt action");
}

    return module.exports;
  },
});

