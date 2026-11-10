import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const recipe = {
  postId: 42, title: "Canh nấm", content: "Nấu canh nấm", recipeName: "Canh nấm",
  videoUrl: "https://example.test/video.mp4", imageUrl: null, servings: 2,
  prepMinutes: 10, cookMinutes: 15, caloriesPerServing: 200,
  categories: [{ id: 3 }], ingredients: [{ ingredientName: "Nấm", amount: "200 g", dietaryGroup: "PLANT", allergenId: null }],
  steps: [{ stepNumber: 1, instruction: "Nấu canh" }],
};
const imageUrl = "https://example.test/cover.webp";
const json = (value, status = 200) => new Response(JSON.stringify(value), { status });
const file = () => new File(["test image"], "cover.webp", { type: "image/webp" });
function setup(respond, getToken = () => "jwt") {
  const calls = [];
  const exports = {};
  const source = readFileSync(new URL("../src/lib/image-api.ts", import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, {
    exports, Response, FormData,
    require(name) {
      if (name === "@/lib/auth") return { getStoredToken: getToken };
      if (name === "@/lib/api") return { apiFetch: async (path, options = {}) => {
        calls.push({ path, ...options });
        return respond(path, options, calls.length);
      } };
      throw new Error(`Unexpected import ${name}`);
    },
  });
  return { api: exports, calls };
}

test("cover upload uses image multipart then preserves recipe fields and accepts 204", async () => {
  const { api, calls } = setup((path, options) => options.method === "POST" ? json({ imageUrl }) : options.method === "PUT" ? new Response(null, { status: 204 }) : json(recipe));
  const result = await api.uploadPostImage(42, file());
  assert.equal(result.imageUrl, imageUrl);
  assert.equal(calls.length, 3);
  assert.equal(calls[1].path, "/api/media/images?purpose=recipes");
  assert.ok(calls[1].body.get("image") instanceof File);
  assert.equal(calls[1].body.get("file"), null);
  assert.equal(calls[1].headers, undefined, "browser supplies multipart boundary");
  const saved = JSON.parse(calls[2].body);
  assert.equal(calls[2].path, "/api/recipes/42");
  assert.equal(saved.imageUrl, imageUrl);
  for (const key of ["title", "content", "recipeName", "videoUrl", "servings", "prepMinutes", "cookMinutes", "caloriesPerServing", "ingredients", "steps"]) assert.deepEqual(saved[key], recipe[key]);
  assert.deepEqual(saved.categoryIds, [3]);
});

test("failed recipe save retries same post and reuses uploaded cover", async () => {
  let saves = 0;
  const { api, calls } = setup((path, options) => {
    if (options.method === "POST") return json({ imageUrl });
    if (options.method === "PUT") return ++saves === 1 ? json({ message: "Unavailable" }, 503) : new Response(null, { status: 204 });
    return json(recipe);
  });
  const selected = file();
  await assert.rejects(api.uploadPostImage(42, selected), error => error.status === 503);
  await api.uploadPostImage(42, selected);
  assert.equal(calls.filter(call => call.method === "POST").length, 1);
  assert.equal(calls.filter(call => call.method === "PUT").length, 2);
  assert.ok(calls.every(call => call.path.includes("42") || call.path.includes("media/images")));
});

test("upload failure keeps existing recipe untouched", async () => {
  const { api, calls } = setup((path, options) => options.method === "POST" ? json({ message: "Image too large" }, 413) : json(recipe));
  await assert.rejects(api.uploadPostImage(42, file()), error => error.status === 413);
  assert.equal(calls.some(call => call.method === "PUT"), false);
});

test("removing cover saves null while retaining video for thumbnail fallback", async () => {
  const { api, calls } = setup((path, options) => options.method === "PUT" ? new Response(null, { status: 204 }) : json(recipe));
  const result = await api.deletePostImage(42);
  assert.equal(result.imageUrl, null);
  const saved = JSON.parse(calls[1].body);
  assert.equal(saved.imageUrl, null);
  assert.equal(saved.videoUrl, recipe.videoUrl);
  assert.equal(calls.length, 2);
});

test("missing login and invalid file are rejected before any request", async () => {
  const loggedOut = setup(() => { throw new Error("must not request"); }, () => null);
  await assert.rejects(loggedOut.api.uploadPostImage(42, file()), error => error.status === 401);
  const loggedIn = setup(() => { throw new Error("must not request"); });
  await assert.rejects(loggedIn.api.uploadPostImage(42, new File(["text"], "a.txt", { type: "text/plain" })), error => error.status === 415);
});

test("session change after media upload never saves under another user", async () => {
  let token = "first";
  const { api, calls } = setup((path, options) => {
    if (options.method === "POST") { token = "second"; return json({ imageUrl }); }
    return json(recipe);
  }, () => token);
  await assert.rejects(api.uploadPostImage(42, file()), error => error.status === 401);
  assert.equal(calls.some(call => call.method === "PUT"), false);
});
