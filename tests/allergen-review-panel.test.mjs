import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as jsxRuntime from "react/jsx-runtime";

async function setup({ submissionError = null } = {}) {
  const slots = [], effects = [], timers = [], catalogUpdates = [], writes = [];
  const events = {}; const documentState = { hidden: false, addEventListener: (name, callback) => { events[name] = callback; }, removeEventListener() {} };
  let cursor = 0, initial = true, history = [], catalog = [], vietnamese = false;
  const onCatalogChange = items => catalogUpdates.push(items);
  const imports = {
    react: {
      useState(value) { const index = cursor++; if (!(index in slots)) slots[index] = value; return [slots[index], update => { slots[index] = typeof update === "function" ? update(slots[index]) : update; }]; },
      useRef(value) { const index = cursor++; if (!(index in slots)) slots[index] = { current: value }; return slots[index]; },
      useCallback: callback => callback,
      useEffect: callback => { if (initial) effects.push(callback); },
    },
    "react/jsx-runtime": jsxRuntime,
    "lucide-react": { Clock3: () => null, RefreshCw: () => null, Send: () => null },
    "@/context/LanguageContext": { useLanguage: () => ({ t: (en, vi) => vietnamese ? vi : en, locale: vietnamese ? "vi-VN" : "en-US" }) },
    "@/lib/profile-api": {
      getAllergenSubmissions: async () => history,
      getAllAllergens: async () => catalog,
      createCustomAllergen: async name => {
        writes.push(name);
        if (submissionError) throw new Error(submissionError);
        const item = { id: 1, name, submittedName: name, status: "PENDING", createdAt: "2026-11-09T00:00:00Z", rejectionReason: null };
        history = [item]; return item;
      },
    },
  };
  const source = readFileSync("src/components/profile/AllergenRequestsPanel.tsx", "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const testModule = { exports: {} };
  vm.runInNewContext(compiled, { exports: testModule.exports, module: testModule, require: key => { if (!(key in imports)) throw new Error(`Unexpected import: ${key}`); return imports[key]; }, window: { setInterval: callback => timers.push(callback), clearInterval() {}, addEventListener() {}, removeEventListener() {} }, document: documentState, console, Error });
  function render() { cursor = 0; const result = testModule.exports.default({ onCatalogChange }); initial = false; return result; }
  let tree = render(); effects.forEach(effect => effect());
  const flush = () => new Promise(resolve => setImmediate(resolve));
  await flush(); tree = render();
  function nodes(value) {
    if (Array.isArray(value)) return value.flatMap(item => nodes(item));
    if (!value || typeof value !== "object") return [];
    return [value, ...nodes(value.props?.children)];
  }
  function text(value) {
    if (Array.isArray(value)) return value.map(item => text(item)).join(" ");
    if (typeof value === "string" || typeof value === "number") return String(value);
    return value?.props ? text(value.props.children) : "";
  }
  return {
    writes, catalogUpdates,
    async visibility(hidden, nextHistory) { documentState.hidden = hidden; history = nextHistory; events.visibilitychange(); await flush(); tree = render(); },
    text: () => text(tree),
    type(name) { nodes(tree).find(item => item.type === "input").props.onChange({ target: { value: name } }); tree = render(); },
    async submit() { await nodes(tree).find(item => item.type === "form").props.onSubmit({ preventDefault() {} }); await flush(); tree = render(); },
    async poll(nextHistory, nextCatalog) { history = nextHistory; catalog = nextCatalog; timers[0](); await flush(); tree = render(); },
    language(vi) { vietnamese = vi; tree = render(); },
    input: () => nodes(tree).find(item => item.type === "input").props.value,
  };
}

test("accepted proposal is pending, refreshes history, and does not select on behalf of the user", async () => {
  const ui = await setup();
  ui.type("Hạt chia"); await ui.submit();
  assert.deepEqual(ui.writes, ["Hạt chia"]);
  assert.match(ui.text(), /Pending review/);
  assert.equal(ui.input(), "");
  await ui.poll([{ id: 1, name: "Hạt chia", status: "APPROVED", createdAt: "2026-11-09T00:00:00Z" }], [{ allergenId: 12, name: "Hạt chia" }]);
  assert.match(ui.text(), /available to select/);
  assert.equal(ui.catalogUpdates.at(-1)[0].allergenId, 12);
  assert.match(ui.text(), /save your profile/);
});

test("duplicate errors retain the name and do not show false success", async () => {
  const ui = await setup({ submissionError: "Dị ứng đã tồn tại." });
  ui.type("Mè"); await ui.submit();
  assert.match(ui.text(), /Dị ứng đã tồn tại/);
  assert.doesNotMatch(ui.text(), /Request saved and awaiting review/);
  assert.equal(ui.input(), "Mè");
});

test("rejection reason survives refresh and switching language preserves unsent input", async () => {
  const ui = await setup();
  ui.type("Tên đang nhập");
  await ui.poll([{ id: 2, name: "Ví dụ", status: "REJECTED", rejectionReason: "Không phù hợp với món chay.", createdAt: "2026-11-09T00:00:00Z" }], []);
  assert.match(ui.text(), /Rejected/);
  assert.match(ui.text(), /Không phù hợp với món chay/);
  ui.language(true);
  assert.match(ui.text(), /Đã từ chối/);
  assert.equal(ui.input(), "Tên đang nhập");
});

for (const status of [400, 401, 403, 404, 409, 422, 503]) {
  test(`HTTP ${status} business errors preserve the proposal and never show success`, async () => {
    const ui = await setup({ submissionError: `BE message ${status}` });
    ui.type("Chia"); await ui.submit();
    assert.equal(ui.input(), "Chia");
    assert.match(ui.text(), new RegExp(`BE message ${status}`));
    assert.doesNotMatch(ui.text(), /Request saved and awaiting review/);
  });
}

test("returning to a visible tab refreshes history while a hidden tab stays idle", async () => {
  const ui = await setup();
  const history = [{ id: 8, name: "Chia", status: "REJECTED", rejectionReason: "Review reason", createdAt: "2026-11-09T00:00:00Z" }];
  await ui.visibility(true, history);
  assert.doesNotMatch(ui.text(), /Review reason/);
  await ui.visibility(false, history);
  assert.match(ui.text(), /Review reason/);
});
