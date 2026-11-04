import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

function load(path, dependencies = {}, globals = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: name => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected import: ${name}`);
    return dependencies[name];
  }, ...globals });
  return exports;
}

test("a transient API error is typed and the next replacement can succeed", async () => {
  const paths = [];
  const api = load("src/lib/meal-plan-api.ts", { "@/lib/api": { apiFetch: async (path, options) => {
    paths.push({ path, method: options.method });
    return paths.length === 1
      ? new Response(JSON.stringify({ message: "Please retry later." }), { status: 429 })
      : new Response(JSON.stringify({ mealPlanId: 24, meals: [] }), { status: 200 });
  } } });
  await assert.rejects(api.replaceMeal(24, 413), error => error.status === 429);
  assert.equal((await api.replaceMeal(24, 413)).mealPlanId, 24);
  assert.deepEqual(paths, [
    { path: "/api/meal-plans/24/meals/413/replace", method: "PUT" },
    { path: "/api/meal-plans/24/meals/413/replace", method: "PUT" },
  ]);
});

async function setup({ failFirst = false } = {}) {
  const slots = [], effects = [];
  let cursor = 0, firstRender = true, calls = 0;
  const plan = { mealPlanId: 24, startDate: "2026-10-24", bmi: null, bmiCategory: null,
    meals: [{ mealPlanMealId: 413, dayNumber: 1, mealType: "BREAKFAST", recipeId: 10, recipeName: "Tofu" }] };
  const imports = {
    react: {
      useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial;
        return [slots[i], value => { slots[i] = typeof value === "function" ? value(slots[i]) : value; }]; },
      useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
      useMemo: callback => callback(),
      useEffect: callback => { if (firstRender) effects.push(callback); },
    },
    "@/context/AuthContext": { useAuth: () => ({ user: { uid: "user-1" }, loading: false }) },
    "@/context/LanguageContext": { useLanguage: () => ({ t: english => english, language: "en", locale: "en-US" }) },
    "@/lib/api": { getMediaUrl: value => value || "" },
    "@/lib/meal-plan-api": {
      getMealPlans: async () => [plan],
      replaceMeal: async () => { calls++; if (failFirst && calls === 1) throw Object.assign(new Error("Retry later"), { status: 429 }); return plan; },
    },
    "@/lib/profile-api": { getProfile: async () => ({ fullName: "Test" }), getDietTypes: async () => [], getAllAllergens: async () => [], getUserAllergens: async () => [] },
    "@/lib/post-api": { getBookmarks: async () => [] },
    "@/lib/recipe-api": { getRecipeById: async () => ({ postId: 10, recipeName: "Tofu", content: "Recipe", ingredients: [], steps: [] }) },
    "@/lib/diet-type-display": { formatDietTypeName: value => value },
    "@/lib/localized-content": { localizeAmount: value => value, localizeIngredient: value => value, localizeRecipeTitle: value => value, localizeText: value => value },
    "@/lib/meal-plan-dates": load("src/lib/meal-plan-dates.ts"),
  };
  const hook = load("src/components/meal-planner/useMealPlanner.ts", imports, { setTimeout, clearTimeout });
  function render() { cursor = 0; return hook.useMealPlanner(); }
  render(); firstRender = false; effects.forEach(effect => effect()); await new Promise(setImmediate);
  return { render, getCalls: () => calls };
}

test("the real planner hook permits more than five replacements", async () => {
  const { render, getCalls } = await setup();
  for (let i = 0; i < 8; i++) await render().handleReplaceMeal(0, "413", "BREAKFAST");
  assert.equal(getCalls(), 8);
  assert.equal(render().isRegenerating, false);
});

test("a failed replacement displays an error but does not permanently lock the next attempt", async () => {
  const { render, getCalls } = await setup({ failFirst: true });
  await render().handleReplaceMeal(0, "413", "BREAKFAST");
  assert.equal(render().error, "Retry later");
  await render().handleReplaceMeal(0, "413", "BREAKFAST");
  assert.equal(getCalls(), 2);
  assert.equal(render().error, "");
});
