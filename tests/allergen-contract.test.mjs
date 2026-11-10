import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import * as runtime from 'react/jsx-runtime';

const compile = path => ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;

test('API contract: direct history, wrapped saved selection, pending proposal and business errors', async () => {
  let response; const calls = [];
  const exports = {};
  const api = { apiFetch: async (path, options) => { calls.push({ path, options }); return response; }, apiGet: async () => ({ userId: 7, allergens: [{ id: 2, name: 'Soy', type: 'PLANT' }] }) };
  vm.runInNewContext(compile('src/lib/profile-api.ts'), { exports, require: () => api });
  response = new Response(JSON.stringify({ id: 42, status: 'PENDING' }), { status: 200 });
  assert.equal((await exports.createCustomAllergen('Chia')).status, 'PENDING');
  assert.equal(calls[0].path, '/api/users/me/allergens/custom');
  assert.equal(calls[0].options.body, JSON.stringify({ name: 'Chia' }));
  assert.equal((await exports.getUserAllergens())[0].allergenId, 2);
  response = new Response(JSON.stringify([{ id: 42, status: 'REJECTED', rejectionReason: 'Reason' }]));
  assert.equal((await exports.getAllergenSubmissions())[0].rejectionReason, 'Reason');
  for (const status of [400, 401, 403, 404, 409, 422, 503]) {
    response = new Response(JSON.stringify({ success: false, message: `BE ${status}`, errors: [] }), { status });
    await assert.rejects(exports.createCustomAllergen('Chia'), new RegExp(`BE ${status}`));
  }
  response = new Response(JSON.stringify({ success: false, message: 'Save conflict', errors: [] }), { status: 409 });
  await assert.rejects(exports.updateUserAllergens([2]), /Save conflict/);
});

async function admin() {
  const slots = [], effects = [], calls = []; let cursor = 0, first = true;
  let queue = [{ id: 42, userId: 7, name: 'Chia', submittedName: 'chia', status: 'PENDING', createdAt: '2026-11-09T03:00:00Z' }];
  let catalog = []; const exports = {};
  const imports = {
    react: {
      useState(value) { const i = cursor++; if (!(i in slots)) slots[i] = value; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }]; },
      useRef(value) { const i = cursor++; if (!(i in slots)) slots[i] = { current: value }; return slots[i]; },
      useCallback: fn => fn, useEffect: fn => { if (first) effects.push(fn); },
    },
    'react/jsx-runtime': runtime,
    'lucide-react': {},
    '@/context/LanguageContext': { useLanguage: () => ({ t: en => en, locale: 'en-US' }) },
    '@/components/content/ContentDialog': { default: 'dialog' }, '@/components/ui/ConfirmDialog': { default: 'confirm' },
    '@/lib/api': {
      apiGet: async path => { calls.push(path); return path.includes('allergen-requests') ? queue.filter(row => path.includes(row.status)) : []; },
      apiFetch: async (path, options) => {
        calls.push({ path, options });
        const approved = path.endsWith('/approve');
        queue = [{ ...queue[0], status: approved ? 'APPROVED' : 'REJECTED', rejectionReason: approved ? null : JSON.parse(options.body).reason }];
        if (approved) catalog = [{ id: 9, name: 'Chia', type: 'PLANT' }];
        return new Response(JSON.stringify(queue[0]), { status: 200 });
      },
    },
    '@/lib/admin-catalog-api': { listAllergens: async () => catalog },
  };
  vm.runInNewContext(compile('src/app/admin/allergens/page.tsx'), { exports, require: key => imports[key], window: { setInterval() {}, clearInterval() {}, addEventListener() {}, removeEventListener() {} }, document: { hidden: false, addEventListener() {}, removeEventListener() {} } });
  function render() { cursor = 0; const tree = exports.default(); first = false; return tree; }
  let tree = render(); effects.forEach(fn => fn()); await new Promise(setImmediate); tree = render();
  const nodes = value => Array.isArray(value) ? value.flatMap(nodes) : value?.props ? [value, ...nodes(value.props.children)] : [];
  const text = value => Array.isArray(value) ? value.map(text).join(' ') : value?.props ? text(value.props.children) : typeof value === 'string' ? value : '';
  return {
    calls, text: () => text(tree),
    async click(label) { await nodes(tree).find(node => node.type === 'button' && text(node) === label).props.onClick(); await new Promise(setImmediate); tree = render(); },
    reason(value) { nodes(tree).find(node => node.type === 'textarea').props.onChange({ target: { value } }); tree = render(); },
    async reject() { await nodes(tree).find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }); await new Promise(setImmediate); tree = render(); },
  };
}

test('admin approve HTTP 200 removes the pending request and reloads catalog', async () => {
  const ui = await admin(); await ui.click('Approve request');
  assert.doesNotMatch(ui.text(), /Approve request/);
  assert.match(ui.text(), /Chia/);
  assert.ok(ui.calls.some(call => call.path?.endsWith('/42/approve') && !call.options.body));
  assert.ok(ui.calls.filter(call => typeof call === 'string').every(call => !call.includes('status=ALL')));
});

test('admin reject HTTP 200 sends a trimmed reason and leaves the pending queue', async () => {
  const ui = await admin(); await ui.click('Reject'); ui.reason('  Insufficient detail  '); await ui.reject();
  assert.doesNotMatch(ui.text(), /Approve request/);
  const call = ui.calls.find(call => call.path?.endsWith('/42/reject'));
  assert.equal(JSON.parse(call.options.body).reason, 'Insufficient detail');
});
