import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

function load(path, imports = {}, globals = {}) {
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports, process: { env: {} }, Response, atob,
    require(name) { assert.ok(Object.hasOwn(imports, name), `Unexpected import: ${name}`); return imports[name]; },
    ...globals,
  });
  return exports;
}

function storage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
}
const jwt = expiry => `header.${Buffer.from(JSON.stringify({ exp: expiry })).toString("base64url")}.signature`;
const account = { userId: 7, email: "user@example.test", fullName: "Người dùng", role: "MEMBER", isActive: true };

test("session snapshots restore once, stay stable, and notify on login, profile update and logout", () => {
  const sessionStorage = storage();
  const localStorage = storage();
  const token = jwt(Math.floor(Date.now() / 1000) + 3600);
  sessionStorage.setItem("veggiemate_auth_session", JSON.stringify({ epoch: "current-build", token, user: account }));
  localStorage.setItem("token", "legacy-token");
  const session = load("src/lib/auth-session.ts", {}, { window: {}, sessionStorage, localStorage });
  const first = session.readSessionUser();
  assert.equal(first.userId, 7);
  assert.equal(session.readSessionUser(), first);
  assert.equal(session.readSessionToken(), token);
  assert.equal(localStorage.getItem("token"), null);
  let notifications = 0;
  const unsubscribe = session.subscribeSession(() => { notifications++; });
  session.setSession(token, account);
  assert.equal(notifications, 1);
  const updated = { ...account, latitude: 10.5, longitude: 106.5 };
  session.setSessionUser(updated);
  assert.equal(session.readSessionUser(), updated);
  assert.equal(notifications, 2);
  session.clearSession();
  assert.equal(session.readSessionUser(), null);
  assert.equal(sessionStorage.getItem("veggiemate_auth_session"), null);
  assert.equal(notifications, 3);
  unsubscribe();
  session.setSession(token, account);
  assert.equal(notifications, 3);
});

test("expired sessions are rejected without publishing during a React snapshot read", () => {
  const sessionStorage = storage();
  const session = load("src/lib/auth-session.ts", {}, { window: {}, sessionStorage, localStorage: storage() });
  session.setSession(jwt(1), account);
  let notifications = 0;
  session.subscribeSession(() => { notifications++; });
  assert.equal(session.readSessionUser(), null);
  assert.equal(session.readSessionToken(), null);
  assert.equal(notifications, 0);
  assert.equal(sessionStorage.getItem("veggiemate_auth_session"), null);
});

function authWithResponse(response) {
  return load("src/lib/auth.ts", {
    "@/lib/api": { apiFetch: async () => response },
    "./auth-session": { readSessionToken: () => "session-token" },
  });
}

test("authentication preserves structured API errors and handles plain-text or empty errors", async () => {
  for (const [body, expected] of [
    ['{"message":"Email đã tồn tại."}', "Email đã tồn tại."],
    ['{"error":"Tài khoản đã bị khóa."}', "Tài khoản đã bị khóa."],
    ['{"title":"Dữ liệu không hợp lệ."}', "Dữ liệu không hợp lệ."],
    ["Máy chủ tạm thời không khả dụng.", "Máy chủ tạm thời không khả dụng."],
    ["null", "null"],
    ["", "Đăng ký thất bại. Vui lòng thử lại."],
  ]) {
    const auth = authWithResponse(new Response(body, { status: 400 }));
    await assert.rejects(auth.registerWithApi("Tên", "user@example.test", "password"), error => {
      assert.ok(error instanceof auth.ApiError);
      assert.equal(error.status, 400);
      assert.equal(error.message, expected);
      if (body.startsWith('{"message"')) assert.equal(error.data.message, expected);
      return true;
    });
  }
});
