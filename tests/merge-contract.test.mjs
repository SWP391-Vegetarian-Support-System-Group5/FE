import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Exercise merged clients without contacting the database or external AI services.
function loadModule(path, imports, globals = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, process: { env: {} }, Response, Headers, FormData, DOMException, URLSearchParams,
    require(name) {
      assert.ok(Object.hasOwn(imports, name), `Unexpected dependency: ${name}`);
      return imports[name];
    },
    ...globals,
  }, { filename: path });
  return exports;
}

test("JSON requests and video uploads use the same session token", async () => {
  const requests = [];
  class Upload {
    static current;
    headers = {};
    upload = {};
    status = 202;
    statusText = "Accepted";
    responseText = '{"status":"PENDING"}';
    constructor() { Upload.current = this; }
    open(method, url) { this.method = method; this.url = url; }
    setRequestHeader(name, value) { this.headers[name] = value; }
    getResponseHeader() { return "application/json"; }
    send(body) { this.body = body; }
    abort() { this.onabort(); }
  }
  const api = loadModule("src/lib/api.ts", {
    "./auth-session": { readSessionToken: () => "session-token" },
  }, {
    window: {}, XMLHttpRequest: Upload,
    fetch: async (url, options) => { requests.push({ url, options }); return new Response("{}"); },
  });
  await api.apiFetch("/api/posts");
  assert.equal(requests[0].options.headers.get("Authorization"), "Bearer session-token");
  const progress = [];
  const body = new FormData();
  const upload = api.apiUpload("/api/video-recipe-drafts", body, { onProgress: value => progress.push(value) });
  const xhr = Upload.current;
  assert.equal(xhr.headers.Authorization, "Bearer session-token");
  assert.equal(xhr.headers["Content-Type"], undefined);
  assert.equal(xhr.body, body);
  xhr.upload.onprogress({ lengthComputable: true, loaded: 25, total: 100 });
  xhr.upload.onload();
  xhr.onload();
  assert.deepEqual(progress, [25, 100]);
  assert.equal((await upload).status, 202);
  const controller = new AbortController();
  const cancelled = api.apiUpload("/api/video-recipe-drafts", body, { signal: controller.signal });
  const rejected = assert.rejects(cancelled, { name: "AbortError" });
  controller.abort();
  await rejected;
});

function postClient(token) {
  const requests = [];
  const api = loadModule("src/lib/post-api.ts", {
    "@/lib/auth": { getStoredToken: () => token },
    "@/lib/api": { apiFetch: async (path, options) => {
      requests.push({ path, ...options });
      return options.method === "GET"
        ? new Response("[]")
        : new Response(JSON.stringify({ postId: 77, title: "A post", status: "PUBLISHED" }), { status: 201 });
    } },
  });
  return { api, requests };
}

test("guests can read posts but cannot mutate or read private bookmarks", async () => {
  const { api, requests } = postClient(null);
  await api.getPosts({ keyword: "tofu", postType: "BLOG" });
  assert.equal(requests[0].path, "/api/posts?keyword=tofu&postType=BLOG");
  await assert.rejects(api.addComment(77, "Hello"), error => error.status === 401);
  await assert.rejects(api.getBookmarks(), error => error.status === 401);
  assert.equal(requests.length, 1);
});

test("existing ratings use PUT, new ratings use POST", async () => {
  const { api, requests } = postClient("session-token");
  await api.ratePost(77, 4);
  await api.ratePost(77, 5, true);
  assert.deepEqual(requests.map(request => request.method), ["POST", "PUT"]);
  assert.ok(requests.every(request => request.path === "/api/posts/77/rating"));
});

test("post publication and editing do not depend on removed categories or tags", async () => {
  const { api, requests } = postClient("session-token");
  const payload = { title: "A post", content: "Content", postType: "BLOG", videoUrl: null };
  const result = await api.createPost(payload);
  await api.updatePost(77, payload);
  assert.equal(result.postId, 77);
  assert.deepEqual(JSON.parse(requests[0].body), payload);
  assert.deepEqual(JSON.parse(requests[1].body), { ...payload, status: null });
});

test("both branch conventions for detail URLs resolve, invalid IDs do not", async () => {
  const NumericDetail = () => {};
  const CommunityDetail = () => {};
  const page = loadModule("src/app/view-detail/[slug]/page.tsx", {
    "react/jsx-runtime": { jsx: (type, props) => ({ type, props }) },
    "next/navigation": { notFound: () => { throw new Error("NOT_FOUND"); } },
    "@/components/content/ContentDetailScreen": { __esModule: true, default: NumericDetail },
    "@/components/content/CommunityPostDetail": { __esModule: true, default: CommunityDetail },
    "@/lib/content-detail-data": { getDetailRecipe: () => null },
  });
  for (const [slug, component] of [["77", NumericDetail], ["post-77", CommunityDetail]]) {
    const result = await page.default({ params: Promise.resolve({ slug }) });
    assert.equal(result.type, component);
    assert.equal(result.props.postId, 77);
  }
  for (const slug of ["0", "post-0", "-1", "post-nope", "9007199254740992"]) {
    await assert.rejects(page.default({ params: Promise.resolve({ slug }) }), /NOT_FOUND/);
  }
});
