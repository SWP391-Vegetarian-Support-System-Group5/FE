import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const url = "https://res.cloudinary.com/test/image/upload/avatars/1/new.png";
function setup(body, status = 200, changeSession = false) {
  const calls = []; let token = "avatar-test-session";
  const exports = {};
  const code = ts.transpileModule(readFileSync("src/lib/image-api.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, FormData, Error, require: name => {
    if (name === "@/lib/auth") return { getStoredToken: () => token };
    if (name === "@/lib/api") return { apiFetch: async (path, options) => {
      calls.push({ path, ...options }); if (changeSession) token = "other-user";
      return new Response(JSON.stringify(body), { status });
    } };
    throw new Error(`Unexpected import ${name}`);
  } });
  return { api: exports, calls };
}
const file = () => new File(["image fixture"], "avatar.png", { type: "image/png" });

test("avatar PUT sends multipart file and consumes the BE image response", async () => {
  const { api, calls } = setup({ imageUrl: url, isGenerated: false, previousImageDeleted: true });
  const result = await api.uploadAvatar(file());
  assert.equal(calls[0].path, "/api/users/me/avatar"); assert.equal(calls[0].method, "PUT");
  assert.ok(calls[0].body.get("file") instanceof File); assert.equal(calls[0].body.get("image"), null);
  assert.equal(calls[0].headers, undefined); assert.equal(result.imageUrl, url); assert.equal(result.previousImageDeleted, true);
});
test("avatar DELETE accepts a confirmed null image URL", async () => {
  const { api, calls } = setup({ imageUrl: null, isGenerated: false, previousImageDeleted: true });
  const result = await api.deleteAvatar();
  assert.equal(calls[0].method, "DELETE"); assert.equal(result.imageUrl, null);
});
for (const body of [null, {}, { avatarUrl: url }, { imageUrl: url }, { imageUrl: "blob:preview", isGenerated: false, previousImageDeleted: true }, { imageUrl: null, isGenerated: false, previousImageDeleted: true }]) {
  test(`malformed upload success cannot replace the current avatar: ${JSON.stringify(body)}`, async () => {
    const { api } = setup(body); await assert.rejects(api.uploadAvatar(file()), error => error.status === 502);
  });
}
test("provider failure remains a failure and does not produce a fake image result", async () => {
  const { api } = setup({ message: "Storage unavailable" }, 503);
  await assert.rejects(api.uploadAvatar(file()), error => error.status === 503 && error.message === "Storage unavailable");
});
test("an old account's upload response is discarded after a login change", async () => {
  const { api } = setup({ imageUrl: url, isGenerated: false, previousImageDeleted: true }, 200, true);
  await assert.rejects(api.uploadAvatar(file()), error => error.status === 401);
});
