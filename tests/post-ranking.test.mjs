import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as jsx from "react/jsx-runtime";

function load(path, imports = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { exports, require: key => { assert.ok(key in imports, `Unexpected import: ${key}`); return imports[key]; }, ...globals });
  return exports;
}
const ranking = load("src/lib/post-ranking.ts");
const post = (id, score, count = 1, date = "2026-11-01") => ({ postId: id, averageRating: score, ratingCount: count, updatedAt: date, status: "PUBLISHED", postType: "RECIPE", title: `Recipe ${id}`, authorName: "Author", thumbnailUrl: null, commentCount: 0 });
const ids = posts => Array.from(posts, p => p.postId);

test("rating precedes vote count, then recency and ID; API input is not mutated", () => {
  const posts = [post(1, 4, 100), post(2, 5, 1), post(3, 5, 20), post(4, 5, 20, "2026-11-02"), post(5, 5, 20, "2026-11-02")];
  const before = ids(posts);
  assert.deepEqual(ids(ranking.rankPostsByRating(posts)), [5, 4, 3, 2, 1]);
  assert.deepEqual(ids(posts), before);
});

test("unrated or missing/invalid averages cannot outrank actual ratings", () => {
  const posts = [post(1, 5, 0), post(2, NaN, 3), post(3, undefined, 1), post(4, 1, 1)];
  assert.equal(ranking.rankPostsByRating(posts)[0].postId, 4);
  assert.deepEqual(ids(ranking.rankPostsByRating([])), []);
});

test("homepage requests BE rating order before limit and refreshes when an outside recipe gains votes", async () => {
  const states = [], effects = [];
  let cursor = 0;
  const handlers = new Map();
  const requests = [];
  const dataset = [post(1, 4), post(2, 3), post(3, 2), post(4, 1), post(5, 5), { ...post(6, 5, 100), status: "REMOVED" }];
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof initial === "function" ? initial() : initial;
      return [states[index], value => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
    },
    useEffect: callback => { effects.push(callback); },
  };
  const fake = () => null;
  const screen = load("src/components/PopularRecipes.tsx", {
    react, "react/jsx-runtime": jsx,
    "@/lib/post-ranking": ranking,
    "@/hooks/usePersonalizedRevision": { usePersonalizedRevision: () => 0 },
    "@/context/AuthContext": { useAuth: () => ({ user: { uid: "member" }, loading: false }) },
    "@/components/content/ContentIcon": { default: fake },
    "@/components/ui/CardSkeleton": { default: fake },
    "@/components/ui/FeedImage": { default: fake },
    "next/link": { default: "a" },
    "@/lib/community-api": {
      listPosts: async params => { requests.push(params); const eligible = dataset.filter(p => p.status === "PUBLISHED"); const sorted = params.sort === "rating" ? ranking.rankPostsByRating(eligible) : eligible; return params.limit ? sorted.slice(0, params.limit) : sorted; },
      createCommunityEventSource: () => ({ addEventListener: (type, callback) => handlers.set(type, callback), close() {} }),
    },
    "@/context/LanguageContext": { useLanguage: () => ({ language: "vi", locale: "vi-VN", t: (_en, vi) => vi }) },
    "@/lib/localized-content": { localizeRecipeTitle: title => title },
    "@/lib/api": { getMediaUrl: value => value },
  }, { window: { addEventListener() {}, removeEventListener() {} } });
  screen.default();
  const cleanup = effects[0]();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(requests[0].sort, "rating");
  assert.equal(requests[0].limit, 4);
  const links = node => {
    if (!node || typeof node !== "object") return [];
    if (Array.isArray(node)) return node.flatMap(links);
    return node.type === "a" ? [node.props.href] : links(node.props?.children);
  };
  cursor = 0;
  assert.deepEqual(Array.from(links(screen.default())), ["/view-detail/5", "/view-detail/1", "/view-detail/2", "/view-detail/3"]);
  dataset[3] = post(4, 5, 10);
  handlers.get("ratingUpdated")({ data: JSON.stringify({ postId: 4, averageRating: 5, ratingCount: 10 }) });
  await new Promise(resolve => setImmediate(resolve));
  cursor = 0;
  assert.deepEqual(Array.from(links(screen.default())), ["/view-detail/4", "/view-detail/5", "/view-detail/1", "/view-detail/2"]);
  cleanup();
});
