import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

function load(path, dependencies = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: name => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected import: ${name}`);
    return dependencies[name];
  } });
  return exports;
}

test("replacement quota returns a typed 429 and a Vietnamese message", async () => {
  const paths = [];
  const message = "You have reached the meal replacement limit (5 times/week).";
  const api = load("src/lib/meal-plan-api.ts", {
    "@/lib/api": {
      apiFetch: async (path, options) => {
        paths.push({ path, method: options.method });
        return new Response(JSON.stringify({ message }), { status: 429, headers: { "Content-Type": "application/json" } });
      },
    },
  });
  const localization = load("src/lib/localized-content.ts");

  await assert.rejects(api.replaceMeal(24, 413), error => {
    assert.equal(error.status, 429);
    assert.equal(localization.localizeText(error.message, "vi"), "Bạn đã hết 5 lượt đổi món cho thực đơn này. Vui lòng thử lại sau.");
    return true;
  });
  assert.equal(paths[0].path, "/api/meal-plans/24/meals/413/replace");
  assert.equal(paths[0].method, "PUT");
});
