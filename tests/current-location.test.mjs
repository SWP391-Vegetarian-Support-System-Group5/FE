import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as runtime from "react/jsx-runtime";

function load(path, imports = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  vm.runInNewContext(code, { exports, AbortController, setTimeout, clearTimeout, ...globals,
    require: key => { assert.ok(key in imports, `Unexpected import: ${key}`); return imports[key]; },
  });
  return exports;
}
const { startPositionTracking } = load("src/lib/position-tracker.ts");
const flush = async () => { await new Promise(resolve => setImmediate(resolve)); };

test("location API forwards cancellation signals and reads the actual reverse-geocode response", async () => {
  const calls = [];
  const api = load("src/lib/api.ts", { "./auth-session": { readSessionToken: () => "session" } }, {
    process: { env: {} }, window: {}, Headers, FormData,
    fetch: async (url, options) => {
      calls.push({ url, options });
      return new Response(JSON.stringify(url.includes("reverse-geocode") ? { formattedAddress: "Saved address" } : { userId: 7 }));
    },
  });
  const profile = load("src/lib/profile-api.ts", { "@/lib/api": api });
  const signal = new AbortController().signal;
  assert.equal((await profile.reverseGeocode(10.8, 106.7, signal)).formattedAddress, "Saved address");
  await profile.updateLivingLocation(10.8, 106.7, "Saved address", signal);
  assert.equal(calls[0].options.signal, signal);
  assert.equal(calls[1].options.signal, signal);
  assert.equal(calls[1].options.method, "PUT");
  assert.equal(JSON.parse(calls[1].options.body).livingAddress, "Saved address");
  assert.equal(calls[1].options.headers.get("Authorization"), "Bearer session");
});

function setup({ reverseFailure = false, saveFailure = false, invalidConfirmation = false, reverseResult = null } = {}) {
  const slots = [], effects = [], cleanups = [], dependencies = [], watches = [], cleared = [], events = [], saved = [], writes = [], reverseCalls = [];
  const listeners = new Map(), storage = new Map();
  let cursor = 0, user = { userId: 7 }, token = "session", sessionUserId = 7;
  const geolocation = {
    watchPosition(success, error) { watches.push({ success, error }); return watches.length; },
    clearWatch(id) { cleared.push(id); },
  };
  const provider = load("src/context/CurrentLocationContext.tsx", {
    react: {
      createContext: () => ({ Provider: "provider" }),
      useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], next => { slots[i] = typeof next === "function" ? next(slots[i]) : next; }]; },
      useCallback: fn => fn,
      useEffect(callback, deps) {
        const i = cursor++;
        // useCallback is kept stable by the harness for the provider's disable callback.
        const normalized = deps.map(value => typeof value === "function" ? "callback" : value);
        if (!dependencies[i] || normalized.some((value, index) => value !== dependencies[i][index])) {
          dependencies[i] = normalized;
          effects.push(() => { cleanups[i]?.(); cleanups[i] = callback(); });
        }
      },
    },
    "react/jsx-runtime": runtime,
    "@/context/AuthContext": { useAuth: () => ({ user }) },
    "@/lib/auth-session": { readSessionToken: () => token, readSessionUser: () => sessionUserId == null ? null : { userId: sessionUserId } },
    "@/lib/living-location": { saveLivingLocation: location => saved.push(location) },
    "@/lib/position-tracker": { startPositionTracking },
    "@/lib/profile-api": {
      reverseGeocode: async (lat, lng, signal) => { reverseCalls.push({ lat, lng, signal }); if (reverseFailure) throw new Error("Geocoder failed"); return reverseResult ?? { formattedAddress: "Current address" }; },
      updateLivingLocation: async (lat, lng, address, signal) => {
        writes.push({ lat, lng, address, signal });
        if (saveFailure) throw new Error("Save failed");
        return { userId: invalidConfirmation ? 99 : sessionUserId, latitude: lat, longitude: lng, livingAddress: address };
      },
    },
  }, {
    window: { isSecureContext: true, dispatchEvent: event => events.push(event) },
    document: { visibilityState: "visible", addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) },
    navigator: { geolocation, permissions: { query: async () => ({ state: "prompt" }) } },
    localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
  });
  const render = () => { cursor = 0; const value = provider.CurrentLocationProvider({ children: null }).props.value; while (effects.length) effects.shift()(); return value; };
  const emit = () => watches.at(-1).success({ coords: { latitude: 10.8, longitude: 106.7, accuracy: 20 } });
  const dispose = () => cleanups.forEach(fn => fn?.());
  return { render, emit, dispose, watches, cleared, events, saved, writes, reverseCalls,
    logout() { user = null; token = null; sessionUserId = null; },
  };
}

test("GPS opt-in maps coordinates, saves an address, then publishes confirmed data", async () => {
  const app = setup();
  try {
    let context = app.render();
    assert.equal(app.watches.length, 0);
    assert.equal(context.status, "off");
    context.enable(); context = app.render();
    assert.equal(app.watches.length, 1);
    app.emit(); await flush(); context = app.render();
    assert.equal(app.writes[0].address, "Current address");
    assert.equal(context.status, "synced");
    assert.equal(context.location.address, "Current address");
    assert.equal(app.saved.length, 1);
    assert.equal(app.events[0].type, "vm:profile-location-synced");
    assert.equal(app.events[0].detail.userId, 7);
    context.disable(); context = app.render();
    assert.equal(context.status, "off");
    assert.ok(app.cleared.length > 0);
    assert.equal(app.writes[0].signal.aborted, true);
  } finally { app.dispose(); }
});

test("no address or confirmation means no success event or cached location", async () => {
  for (const options of [{ reverseFailure: true }, { saveFailure: true }, { invalidConfirmation: true }]) {
    const app = setup(options);
    try {
      app.render().enable(); app.render(); app.emit(); await flush();
      assert.equal(app.render().status, "error");
      assert.equal(app.saved.length, 0);
      assert.equal(app.events.length, 0);
      if (options.reverseFailure) assert.equal(app.writes.length, 0);
    } finally { app.dispose(); }
  }
});

test("denied permission does not persist coordinates and retry starts a new watcher", async () => {
  const app = setup();
  try {
    app.render().enable(); app.render();
    app.watches[0].error({ code: 1 });
    let context = app.render();
    assert.equal(context.status, "denied");
    assert.equal(context.enabled, false);
    assert.equal(app.writes.length, 0);
    context.enable(); app.render();
    assert.equal(app.watches.length, 2);
  } finally { app.dispose(); }
});

test("logged-out rendering is null-safe and stale GPS callbacks never save", async () => {
  const app = setup();
  try {
    app.render().enable(); app.render();
    app.logout();
    app.emit(); await flush();
    const context = app.render();
    assert.equal(context.status, "off");
    assert.equal(context.location, null);
    assert.equal(app.writes.length, 0);
    assert.ok(app.cleared.length > 0);
  } finally { app.dispose(); }
});

test("logout aborts an in-flight lookup and ignores its late response", async () => {
  let finish;
  const reverseResult = new Promise(resolve => { finish = resolve; });
  const app = setup({ reverseResult });
  try {
    app.render().enable(); app.render(); app.emit();
    assert.equal(app.reverseCalls.length, 1);
    app.logout(); app.render();
    assert.equal(app.reverseCalls[0].signal.aborted, true);
    finish({ formattedAddress: "Late address" }); await flush();
    assert.equal(app.writes.length, 0);
    assert.equal(app.events.length, 0);
    assert.equal(app.render().location, null);
  } finally { app.dispose(); }
});

test("retry restarts GPS after timeout or unavailable coordinates", () => {
  for (const code of [2, 3]) {
    const app = setup();
    try {
      app.render().enable(); app.render(); app.watches[0].error({ code });
      const context = app.render();
      assert.equal(context.enabled, true);
      context.enable(); app.render();
      assert.equal(app.watches.length, 2);
      assert.equal(app.render().status, "waiting");
    } finally { app.dispose(); }
  }
});
