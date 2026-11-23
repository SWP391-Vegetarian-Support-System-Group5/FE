import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Exercise the hook's real loaders and mutation callbacks with isolated API responses.
async function setup({ bookmarksFail = false, selectedFail = false, saveFail = false, plansConflict = false, initialPlans = [], generation, revision = { value: 0 }, replacementConflict = false } = {}) {
  const slots = [];
  const effects = [];
  const writes = [];
  const mealRequests = [];
  let cursor = 0;
  let firstRender = true;
  const catalog = [{ allergenId: 7, name: "Peanut" }, { allergenId: 12, name: "Soy" }];
  class MealPlanRequestError extends Error { constructor(message, status) { super(message); this.status = status; } }
  const imports = {
    "@/hooks/usePersonalizedRevision": { usePersonalizedRevision: () => revision.value },
    "@/lib/personalized-data": { getPersonalizedRevision: () => revision.value },
    "@/lib/save-allergen-selection": { saveAllergenSelection: async ids => {
      writes.push(Array.from(ids)); if (saveFail) throw new Error("Network failed");
      return { items: catalog.filter(item => ids.includes(item.allergenId)), listsRefreshed: true };
    } },
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
      useCallback: callback => callback,
      useEffect: callback => { if (firstRender) effects.push(callback); },
    },
    "@/context/AuthContext": { useAuth: () => ({ user: { uid: "user-1" }, loading: false }) },
    "@/context/LanguageContext": { useLanguage: () => ({ t: english => english, language: "en", locale: "en-US" }) },
    "@/lib/api": { getMediaUrl: value => value },
    "@/lib/auth": { getStoredToken: () => "isolated-test-session" },
    "./useMealImagePolling": { useMealImagePolling: () => ({ imagePollingNotice: null, resumeImagePolling() {} }), hasPendingImages: () => false },
    "@/lib/meal-plan-goals": {
      planningProfile: profile => ({ missing: [], age: 26, bmi: 22, energy: { tdee: 2200 }, profile }),
      goalAllowed: () => true,
      goalLimits: () => ({ maxAdjustment: 1000, tdee: 2200, minimumIntake: 1200 }),
      normalizeGoal: () => ({ nutritionGoal: "MAINTAIN", calorieAdjustment: null }),
    },
    "@/lib/meal-plan-api": {
      MealPlanRequestError,
      getMealPlans: async () => { if (plansConflict) throw new MealPlanRequestError("Profile changed", 409); return initialPlans; },
      generateMealPlan: async request => { mealRequests.push(request); return generation ? generation() : { mealPlanId: 0, meals: [] }; },
      replaceMeal: async () => { if (replacementConflict) throw new MealPlanRequestError("Profile changed", 409); return initialPlans[0]; },
    },
    "@/lib/profile-api": {
      getProfile: async () => ({ fullName: "Test User" }),
      getDietTypes: async () => [],
      getAllAllergens: async () => catalog,
      getUserAllergens: async () => { if (selectedFail) throw new Error("Unauthorized"); return [catalog[0]]; },
      updateUserAllergens: async ids => { writes.push(Array.from(ids)); if (saveFail) throw new Error("Network failed"); },
    },
    "@/lib/post-api": { getBookmarks: async () => { if (bookmarksFail) throw new Error("Bookmarks failed"); return []; } },
    "@/lib/recipe-api": { getRecipeById: async id => ({ postId: id, ingredients: [], steps: [] }) },
    "@/lib/diet-type-display": { formatDietTypeName: () => "" },
    "@/lib/localized-content": { localizeText: value => value, localizeRecipeTitle: value => value },
    "@/lib/meal-plan-dates": { initialMealPlanDate: () => "09/11/2026", parseMealPlanDate: () => new Date("2026-11-09T00:00:00Z"), mealPlanWeekRange: () => "", mealPlanDay: () => "" },
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
  return { render, writes, mealRequests };
}

test("entered pantry ingredients are sent when creating a meal plan", async () => {
  const { render, mealRequests } = await setup();
  render().setNewPantryItem("tofu");
  render().handleAddPantry({ preventDefault() {} });
  await render().handleRegenerate();
  await render().confirmGeneration("MAINTAIN", 0);
  assert.equal(mealRequests[0].availableIngredients, "tofu");
});

test("a failed bookmarks API does not discard the allergen catalog or saved allergies", async () => {
  const { render } = await setup({ bookmarksFail: true });
  const view = render();
  assert.equal(view.allergenStatus, "ready");
  assert.equal(view.error, "");
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

const validPlan = { mealPlanId: 17, startDate: "2026-11-23", meals: [{ mealPlanMealId: 8, dayNumber: 1, mealType: "BREAKFAST", recipeId: 4, recipeName: "Soup" }] };

test("a successful empty generation shows an empty state without a success toast or usable plan ID", async () => {
  const { render } = await setup();
  render().setNewPantryItem("carrot"); render().handleAddPantry({ preventDefault() {} });
  await render().handleRegenerate(); await render().confirmGeneration("MAINTAIN", 0);
  assert.equal(render().emptyPlan, true);
  assert.equal(render().planId, undefined);
  assert.equal(render().days.length, 0);
  assert.equal(render().toastMessage, null);
  assert.equal(await render().handleDeletePlan(), false);
});

test("HTTP 409 while loading an old plan asks for rebuilding without showing meals", async () => {
  const { render } = await setup({ plansConflict: true });
  assert.equal(render().needsRebuild, true);
  assert.equal(render().loading, false);
  assert.equal(render().planId, undefined);
  assert.equal(render().days.length, 0);
});

test("HTTP 409 on replacement clears the old plan and its actions", async () => {
  const { render } = await setup({ initialPlans: [validPlan], replacementConflict: true });
  assert.equal(render().planId, 17);
  await render().handleReplaceMeal(0, "8", "BREAKFAST", 6);
  assert.equal(render().needsRebuild, true);
  assert.equal(render().planId, undefined);
  assert.equal(render().days.length, 0);
});

test("a profile revision hides old meals immediately before refetch completes", async () => {
  const revision = { value: 0 };
  const { render } = await setup({ initialPlans: [validPlan], revision });
  assert.equal(render().days.length, 1);
  revision.value++;
  assert.equal(render().planId, undefined);
  assert.equal(render().days.length, 0);
  assert.equal(render().goalContext, null);
  assert.equal(render().savedCount, 0);
  assert.equal(render().loading, true);
});

test("a late generation cannot restore meals after the profile has changed", async () => {
  const revision = { value: 0 }; let finish;
  const { render } = await setup({ revision, generation: () => new Promise(resolve => { finish = resolve; }) });
  render().setNewPantryItem("carrot"); render().handleAddPantry({ preventDefault() {} });
  await render().handleRegenerate();
  const pending = render().confirmGeneration("MAINTAIN", 0);
  await new Promise(setImmediate);
  revision.value++;
  finish(validPlan); await pending;
  assert.equal(render().planId, undefined);
  assert.equal(render().toastMessage, null);
});
