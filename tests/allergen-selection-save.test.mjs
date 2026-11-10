import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as runtime from "react/jsx-runtime";

const compile = path => ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const soy = { allergenId: 2, name: "Soy" };
const egg = { allergenId: 7, name: "Egg" };
function service({ readFails = false, writeFails = false, malformed = false, current = [soy, egg], switchSession = false } = {}) {
  const calls = []; let session = "test-session";
  const exports = {};
  const imports = {
    "@/lib/auth": { getStoredToken: () => session },
    "@/lib/profile-api": {
      updateUserAllergens: async ids => {
        calls.push(["PUT", Array.from(ids)]);
        if (writeFails) throw new Error("BE save failed");
        if (switchSession) session = "other-session";
        return malformed ? null : { userId: 1, allergens: ids.map(id => ({ id, name: id === 2 ? "Soy" : "Egg" })) };
      },
      getUserAllergens: async () => { calls.push(["GET"]); if (readFails) throw new Error("Read failed"); return current; },
    },
  };
  vm.runInNewContext(compile("src/lib/save-allergen-selection.ts"), { exports, require: key => { assert.ok(key in imports); return imports[key]; }, Error });
  return { save: exports.saveAllergenSelection, calls };
}

test("PUT uses the complete deduplicated selection then GET confirms persisted values", async () => {
  const api = service(); const result = await api.save([7, 2, 7]);
  assert.deepEqual(api.calls, [["PUT", [2, 7]], ["GET"]]);
  assert.equal(result.refreshed, true); assert.equal(result.matchesRequested, true);
});
test("a failed PUT preserves edits by rejecting and never reports success or reads back", async () => {
  const api = service({ writeFails: true });
  await assert.rejects(api.save([2]), /BE save failed/); assert.equal(api.calls.length, 1);
});
test("read failure after a confirmed PUT is reported separately from save failure", async () => {
  const api = service({ readFails: true }); const result = await api.save([2]);
  assert.equal(result.refreshed, false); assert.equal(result.matchesRequested, true); assert.equal(result.items[0].allergenId, 2);
});
test("an unconfirmed response and failed read do not fabricate successful selections", async () => {
  const api = service({ malformed: true, readFails: true }); await assert.rejects(api.save([2]), /ALLERGEN_SAVE_UNCONFIRMED/);
});
test("a changed server selection is displayed instead of assuming requested IDs were saved", async () => {
  const api = service({ current: [egg] }); const result = await api.save([2]);
  assert.equal(result.matchesRequested, false); assert.equal(result.items[0].allergenId, 7);
});
test("invalid catalog IDs are blocked before sending a request", async () => {
  const api = service(); await assert.rejects(api.save([0]), /ALLERGEN_SELECTION_INVALID/); assert.equal(api.calls.length, 0);
});
test("a changed login session cannot apply the previous account's save result", async () => {
  const api = service({ switchSession: true }); await assert.rejects(api.save([2]), /ALLERGEN_SESSION_CHANGED/); assert.equal(api.calls.length, 1);
});
test("an explicitly empty PUT clears all selections", async () => {
  const api = service({ current: [] }); const result = await api.save([]);
  assert.deepEqual(api.calls[0], ["PUT", []]); assert.equal(result.items.length, 0); assert.equal(result.matchesRequested, true);
});

test("selection UI waits for confirmation, cancel sends nothing, and double confirm sends once", async () => {
  const slots = [], writes = [], busyChanges = []; let cursor = 0, finish;
  const props = { selectedIds: [2], savedIds: [], catalog: [soy], disabled: false,
    onBusyChange: value => busyChanges.push(value), onSaved: items => { props.selectedIds = items.map(item => item.allergenId); props.savedIds = [...props.selectedIds]; } };
  const exports = {};
  const imports = {
    react: {
      useState(value) { const index = cursor++; if (!(index in slots)) slots[index] = value; return [slots[index], next => { slots[index] = typeof next === "function" ? next(slots[index]) : next; }]; },
      useRef(value) { const index = cursor++; if (!(index in slots)) slots[index] = { current: value }; return slots[index]; },
    },
    "react/jsx-runtime": runtime,
    "@/components/content/ContentDialog": { default: "dialog" },
    "@/context/LanguageContext": { useLanguage: () => ({ t: en => en }) },
    "@/lib/save-allergen-selection": { saveAllergenSelection: async ids => { writes.push(Array.from(ids)); await new Promise(resolve => { finish = resolve; }); return { items: [soy], refreshed: true, matchesRequested: true }; } },
  };
  vm.runInNewContext(compile("src/components/profile/AllergenSelectionSave.tsx"), { exports, require: key => { assert.ok(key in imports); return imports[key]; }, Error });
  const render = () => { cursor = 0; return exports.default(props); };
  function nodes(value) { if (Array.isArray(value)) return value.flatMap(nodes); if (!value || typeof value !== "object") return []; return [value, ...nodes(value.props?.children)]; }
  function text(value) { if (Array.isArray(value)) return value.map(text).join(" "); if (typeof value === "string") return value; return value?.props ? text(value.props.children) : ""; }
  const button = (tree, label) => nodes(tree).find(item => item.type === "button" && text(item) === label);
  button(render(), "Save allergens").props.onClick();
  assert.equal(writes.length, 0);
  button(render(), "Cancel").props.onClick(); assert.equal(writes.length, 0);
  button(render(), "Save allergens").props.onClick();
  const confirm = button(render(), "Confirm and save"); confirm.props.onClick(); confirm.props.onClick();
  assert.equal(writes.length, 1); assert.equal(busyChanges[0], true);
  finish(); await new Promise(setImmediate);
  assert.match(text(render()), /saved and reloaded/); assert.equal(busyChanges.at(-1), false);
});
