import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

test("BMI client reads real catalogs and saves exact multi-selection including clearing", async () => {
  const requests = [];
  const exports = {};
  let status = 204;
  const source = readFileSync(new URL("../src/lib/bmi-api.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(compiled, { exports, require: name => {
    assert.equal(name, "@/lib/api");
    return {
      apiGet: async (path, options) => { requests.push({ path, options }); return []; },
      apiFetch: async (path, options) => { requests.push({ path, options }); return new Response(null, { status }); },
    };
  } });
  const controller = new AbortController();
  await exports.getBmiTypes(controller.signal);
  await exports.getAdminRecipeBmiTypes(controller.signal);
  assert.equal(requests[0].path, "/api/bmi-types");
  assert.equal(requests[1].path, "/api/admin/recipes/bmi-types");
  assert.equal(requests[0].options.signal, controller.signal);
  await exports.setRecipeBmiTypes(77, [1, 3]);
  assert.equal(requests[2].path, "/api/admin/recipes/77/bmi-types");
  assert.equal(requests[2].options.method, "PUT");
  assert.deepEqual(JSON.parse(requests[2].options.body), { bmiTypeIds: [1, 3] });
  await exports.setRecipeBmiTypes(77, []);
  assert.deepEqual(JSON.parse(requests[3].options.body), { bmiTypeIds: [] });
  await exports.setRecipeCategories(77, [4, 9]);
  assert.equal(requests[4].path, "/api/admin/recipes/77/categories");
  assert.equal(requests[4].options.method, "PUT");
  assert.deepEqual(JSON.parse(requests[4].options.body), { categoryIds: [4, 9] });
  status = 403;
  await assert.rejects(exports.setRecipeBmiTypes(77, [2]), /BMI_UPDATE_403/);
});
