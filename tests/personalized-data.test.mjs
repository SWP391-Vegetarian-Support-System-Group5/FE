import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as jsx from "react/jsx-runtime";

function load(path, imports = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports, require: key => { assert.ok(key in imports, key); return imports[key]; }, ...globals });
  return exports;
}

test("profile invalidation notifies this tab and other tabs without storing personal data", () => {
  const events = new Map(), writes = [];
  const data = load("src/lib/personalized-data.ts", {}, {
    window: { addEventListener: (key, fn) => events.set(key, fn), removeEventListener: key => events.delete(key) },
    localStorage: { setItem: (key, value) => writes.push([key, value]) },
  });
  let notifications = 0;
  const unsubscribe = data.subscribePersonalizedData(() => notifications++);
  data.invalidatePersonalizedData();
  assert.equal(notifications, 1);
  assert.equal(data.getPersonalizedRevision(), 1);
  assert.equal(writes.length, 1);
  assert.match(writes[0][1], /^\d+:0\.\d+$/);
  events.get("storage")({ key: writes[0][0] });
  assert.equal(data.getPersonalizedRevision(), 2);
  assert.equal(notifications, 2);
  assert.equal(writes.length, 1); // No cross-tab broadcast loop.
  data.invalidatePersonalizedData(false);
  assert.equal(writes.length, 1);
  unsubscribe(); assert.equal(events.size, 0);
});

test("blocked browser storage still invalidates current-tab results", () => {
  const data = load("src/lib/personalized-data.ts", {}, { window: {}, localStorage: { setItem() { throw new Error("blocked"); } } });
  data.invalidatePersonalizedData(); assert.equal(data.getPersonalizedRevision(), 1);
});

class MealPlanRequestError extends Error { constructor(status) { super("API failure"); this.status = status; } }
function refreshService({ failed, switched = false } = {}) {
  const calls = []; let session = "user-one";
  const request = async name => { calls.push(name); if (switched) session = "user-two"; if (failed === name) throw new Error("Offline"); if (failed === "conflict" && name === "plans") throw new MealPlanRequestError(409); return []; };
  const api = load("src/lib/refresh-personalized-lists.ts", {
    "@/lib/post-api": { getPosts: params => { assert.equal(params.sort, "rating"); return request("posts"); }, getBookmarks: () => request("bookmarks") },
    "@/lib/meal-plan-api": { MealPlanRequestError, getMealPlans: () => request("plans") },
    "@/lib/auth": { getStoredToken: () => session },
  });
  return { refresh: () => api.refreshPersonalizedLists("user-one"), calls };
}

test("saved profile refresh accepts real empty lists and a plan requiring rebuild", async () => {
  for (const failed of [undefined, "conflict"]) {
    const api = refreshService({ failed });
    assert.equal(await api.refresh(), true);
    assert.deepEqual(api.calls, ["posts", "bookmarks", "plans"]);
  }
});
test("a failed list refresh is distinct from a failed save", async () => {
  for (const failed of ["posts", "bookmarks", "plans"]) assert.equal(await refreshService({ failed }).refresh(), false);
});
test("refresh results from a previous login are discarded", async () => {
  await assert.rejects(refreshService({ switched: true }).refresh(), /ALLERGEN_SESSION_CHANGED/);
});

test("meal APIs preserve 409 and 422 instead of treating failures as empty results", async () => {
  const api = load("src/lib/meal-plan-api.ts", { "@/lib/api": { apiFetch: async path => new Response(JSON.stringify({ message: "Profile changed" }), { status: path.endsWith("replace") ? 422 : 409 }) } });
  await assert.rejects(api.getMealPlans(), error => error instanceof api.MealPlanRequestError && error.status === 409);
  await assert.rejects(api.getMealReplacementOptions(1, 2), error => error.status === 409);
  await assert.rejects(api.replaceMeal(1, 2, 3), error => error.status === 422);
});
test("plan ID zero cannot trigger any plan action or network request", async () => {
  let requests = 0;
  const api = load("src/lib/meal-plan-api.ts", { "@/lib/api": { apiFetch: async () => { requests++; } } });
  for (const action of [() => api.getMealPlan(0), () => api.regenerateMealPlan(0, {}), () => api.getMealReplacementOptions(0, 2), () => api.replaceMeal(0, 2), () => api.deleteMealPlan(0)]) {
    await assert.rejects(action(), error => error.status === 400);
  }
  assert.equal(requests, 0);
});

function hooks() {
  const states = [], effects = [];
  let cursor = 0, effectIndex = 0;
  return {
    react: {
      useState(initial) { const index = cursor++; if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial; return [states[index], value => { states[index] = typeof value === "function" ? value(states[index]) : value; }]; },
      useEffect(callback, deps) {
        const index = effectIndex++, old = effects[index];
        if (!old || deps.some((value, i) => value !== old.deps[i])) effects[index] = { callback, deps, cleanup: old?.cleanup, pending: true };
      },
    },
    render(component) { cursor = 0; effectIndex = 0; return component(); },
    flush() { for (const item of effects) if (item.pending) { item.cleanup?.(); item.cleanup = item.callback(); item.pending = false; } },
    cleanup() { effects.forEach(item => item.cleanup?.()); },
  };
}
function nodes(value) { if (Array.isArray(value)) return value.flatMap(nodes); if (!value || typeof value !== "object") return []; return [value, ...nodes(value.props?.children)]; }
function text(value) { if (Array.isArray(value)) return value.map(text).join(" "); if (typeof value === "string") return value; return value?.props ? text(value.props.children) : ""; }

test("hero removes old images immediately on profile changes and preserves BE empty results", async () => {
  const state = hooks(); let revision = 0, response = [{ postId: 1, title: "Recipe", status: "PUBLISHED", imageUrl: "/real.jpg" }];
  const { default: Hero } = load("src/components/HeroRecipeCarousel.tsx", {
    react: state.react, "react/jsx-runtime": jsx,
    "@/context/AuthContext": { useAuth: () => ({ user: { uid: "user-one" }, loading: false }) },
    "@/hooks/usePersonalizedRevision": { usePersonalizedRevision: () => revision },
    "@/context/LanguageContext": { useLanguage: () => ({ t: en => en }) },
    "next/image": { default: "image" }, "next/link": { default: "a" },
    "@/lib/community-api": { listPosts: async () => response }, "@/lib/api": { getMediaUrl: value => value },
  });
  state.render(Hero); state.flush(); await new Promise(setImmediate);
  assert.equal(nodes(state.render(Hero)).filter(node => node.type === "image").length, 1);
  revision++; response = [];
  assert.equal(nodes(state.render(Hero)).filter(node => node.type === "image").length, 0);
  state.flush(); await new Promise(setImmediate);
  assert.match(text(state.render(Hero)), /No recipes match/);
  assert.equal(nodes(state.render(Hero)).filter(node => node.type === "image" || node.type === "a").length, 0);
  state.cleanup();
});

test("recipe search scopes results to user and profile revision, requests no cache, and shows no fallback food", async () => {
  const state = hooks(); let user = "one", revision = 0;
  const calls = [], pending = [];
  const { default: Browser } = load("src/components/recipe/RecipeBrowser.tsx", {
    react: state.react, "react/jsx-runtime": jsx,
    "@/context/AuthContext": { useAuth: () => ({ user: { uid: user }, loading: false }) },
    "@/hooks/usePersonalizedRevision": { usePersonalizedRevision: () => revision },
    "@/context/LanguageContext": { useLanguage: () => ({ t: en => en, language: "en" }) },
    "@/lib/post-ranking": load("src/lib/post-ranking.ts"),
    "@/lib/api": { apiGet: (path, options) => { calls.push([path, options]); return new Promise(resolve => pending.push(resolve)); }, getMediaUrl: value => value },
    "@/lib/recipe-categories": { getRecipeCategories: async () => [], categoryName: value => value.name },
    "@/lib/localized-content": { localizeRecipeTitle: value => value },
    "@/components/ui/CardSkeleton": { default: "skeleton" }, "@/components/ui/FeedImage": { default: "image" }, "next/link": { default: "a" },
  }, { AbortController, URLSearchParams });
  const render = () => state.render(() => Browser({ keyword: "tofu" }));
  render(); state.flush(); pending[0]([{ postId: 1, recipeName: "Tofu" }]); await new Promise(setImmediate);
  assert.equal(nodes(render()).filter(node => node.type === "a").length, 1);
  revision++; assert.equal(nodes(render()).filter(node => node.type === "a").length, 0);
  state.flush();
  user = "two"; render(); state.flush();
  pending[1]([{ postId: 99, recipeName: "Old account result" }]); pending[2]([]); await new Promise(setImmediate);
  assert.equal(calls[0][1].cache, "no-store");
  assert.equal(calls[1][1].signal.aborted, true);
  assert.match(text(render()), /No recipes match/);
  assert.equal(nodes(render()).filter(node => node.type === "a" || node.type === "image").length, 0);
  state.cleanup();
});
