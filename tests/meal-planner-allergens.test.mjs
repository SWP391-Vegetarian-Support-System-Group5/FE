import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Exercise the hook's real loaders and mutation callbacks with isolated API responses.
async function setup({ bookmarksFail = false, selectedFail = false, saveFail = false } = {}) {
  const slots = [];
  const effects = [];
  const writes = [];
  let cursor = 0;
  let firstRender = true;
  const catalog = [{ allergenId: 7, name: "Peanut" }, { allergenId: 12, name: "Soy" }];
  const imports = {
    react: {
      useState(initial) {
        const index = cursor++;
        if (!(index in slots)) slots[index] = typeof initial === "function" ? initial() : initial;
        return [slots[index], value => { slots[index] = typeof value === "function" ? value(slots[index]) : value; }];
      },
      useRef(initial) {
        const index = cursor++;
        if (!(index in slots)) slots[index] = { current: initial };
        return slots[index];
      },
      useMemo: callback => callback(),
      useEffect: callback => { if (firstRender) effects.push(callback); },
    },
    "@/context/AuthContext": { useAuth: () => ({ user: { uid: "user-1" }, loading: false }) },
    "@/context/LanguageContext": { useLanguage: () => ({ t: english => english, language: "en", locale: "en-US" }) },
    "@/lib/api": { getMediaUrl: value => value },
    "@/lib/meal-plan-api": { getMealPlans: async () => [] },
    "@/lib/profile-api": {
      getProfile: async () => ({ fullName: "Test User" }),
      getDietTypes: async () => [],
      getAllAllergens: async () => catalog,
      getUserAllergens: async () => { if (selectedFail) throw new Error("Unauthorized"); return [catalog[0]]; },
      updateUserAllergens: async ids => { writes.push(Array.from(ids)); if (saveFail) throw new Error("Network failed"); },
    },
    "@/lib/post-api": { getBookmarks: async () => { if (bookmarksFail) throw new Error("Bookmarks failed"); return []; } },
    "@/lib/recipe-api": {},
    "@/lib/diet-type-display": { formatDietTypeName: () => "" },
    "@/lib/localized-content": { localizeText: value => value },
    "@/lib/meal-plan-dates": { initialMealPlanDate: () => "23/10/26" },
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../src/components/meal-planner/useMealPlanner.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require: name => { assert.ok(name in imports, name); return imports[name]; }, setTimeout, clearTimeout });
  function render() { cursor = 0; return exports.useMealPlanner(); }
  render();
  firstRender = false;
  effects.forEach(effect => effect());
  await new Promise(setImmediate);
  return { render, writes };
}

test("a failed bookmarks API does not discard the allergen catalog or saved allergies", async () => {
  const { render } = await setup({ bookmarksFail: true });
  const view = render();
  assert.equal(view.allergenStatus, "ready");
  assert.deepEqual(Array.from(view.allergens), ["Peanut"]);
  assert.deepEqual(Array.from(view.availableAllergens, item => item.allergenId), [12]);
});

test("adding an allergy sends catalog IDs while preserving the user's existing selections", async () => {
  const { render, writes } = await setup();
  render().setNewAllergen("12");
  await render().handleAddAllergen({ preventDefault() {} });
  assert.deepEqual(writes, [[7, 12]]);
  assert.deepEqual(Array.from(render().allergens), ["Peanut", "Soy"]);
});

test("failed user allergy loading blocks writes rather than overwriting unknown saved selections", async () => {
  const { render, writes } = await setup({ selectedFail: true });
  assert.equal(render().allergenStatus, "error");
  render().setNewAllergen("12");
  await render().handleAddAllergen({ preventDefault() {} });
  assert.deepEqual(writes, []);
});

test("a network failure preserves saved allergies and the selected option for retry", async () => {
  const { render } = await setup({ saveFail: true });
  render().setNewAllergen("12");
  await render().handleAddAllergen({ preventDefault() {} });
  assert.deepEqual(Array.from(render().allergens), ["Peanut"]);
  assert.equal(render().newAllergen, "12");
  assert.equal(render().allergenError, "save");
  assert.equal(render().isRegenerating, false);
});
