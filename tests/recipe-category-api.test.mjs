import assert from "node:assert/strict";
import { test } from "node:test";
import { loadModule } from "./helpers/ui-harness.mjs";

function client(status = 204) {
  const requests = [];
  const api = loadModule("src/lib/recipe-api.ts", { "@/lib/api": {
    apiFetch: async (path, options) => { requests.push({ path, ...options }); return new Response(null, { status }); },
  } });
  return { api, requests };
}

test("current recipe category API saves the complete selection and accepts 204", async () => {
  const { api, requests } = client();
  await api.setRecipeCategories(77, [4, 9]);
  assert.equal(requests[0].path, "/api/admin/recipes/77/categories");
  assert.equal(requests[0].method, "PUT");
  assert.deepEqual(JSON.parse(requests[0].body), { categoryIds: [4, 9] });
});
test("an empty category selection clears all assignments", async () => {
  const { api, requests } = client();
  await api.setRecipeCategories(77, []);
  assert.deepEqual(JSON.parse(requests[0].body), { categoryIds: [] });
});
test("category save rejects authentication and server errors instead of reporting success", async () => {
  for (const status of [401, 403, 404, 500]) {
    const { api } = client(status);
    await assert.rejects(api.setRecipeCategories(77, [4]), new RegExp(`CATEGORY_UPDATE_${status}`));
  }
});

const energy = loadModule("src/lib/profile-energy.ts");
const goals = loadModule("src/lib/meal-plan-goals.ts", { "./profile-energy": energy });
test("current planner derives BMI from saved measurements and restricts goal direction at its boundaries", () => {
  const profile = { sex: "MALE", birthYear: 2000, heightCm: 200, weightKg: 74, activityLevel: "LIGHT", dietTypeId: 1 };
  const context = goals.planningProfile(profile, 2026);
  assert.equal(context.bmi, 18.5);
  assert.equal(context.missing.length, 0);
  assert.ok(context.energy.tdee > 0);
  assert.equal(goals.goalAllowed(context.bmi, "LOSE"), true);
  const underweight = goals.planningProfile({ ...profile, weightKg: 73.9 }, 2026);
  assert.equal(goals.suggestedGoal(underweight.bmi), "GAIN");
  assert.equal(goals.goalAllowed(underweight.bmi, "LOSE"), false);
  const high = goals.planningProfile({ ...profile, weightKg: 100 }, 2026);
  assert.equal(high.bmi, 25);
  assert.equal(goals.suggestedGoal(high.bmi), "LOSE");
  assert.equal(goals.goalAllowed(high.bmi, "GAIN"), false);
});
test("missing measurements or profile do not enable a calorie goal", () => {
  for (const profile of [null, { heightCm: 170, weightKg: null }]) {
    const context = goals.planningProfile(profile, 2026);
    assert.equal(context.bmi, null);
    assert.equal(context.energy, null);
    assert.ok(context.missing.length > 0);
    assert.equal(goals.goalAllowed(context.bmi, "LOSE"), false);
  }
});
