import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as React from "react";

// Stateful fake BE: compatibility is evaluated here, never in the FE modules.
const catalog = [
  { id: 1, name: "VEGAN", compatibleRestaurantDietTypeIds: [1] },
  { id: 2, name: "LACTO_VEGETARIAN", compatibleRestaurantDietTypeIds: [1, 2] },
  { id: 3, name: "OVO_VEGETARIAN", compatibleRestaurantDietTypeIds: [1, 3] },
  { id: 4, name: "LACTO_OVO_VEGETARIAN", compatibleRestaurantDietTypeIds: [1, 2, 3, 4] },
];
let profile = { dietTypeId: 1 }, restaurants = [], fail = false, notifications = 0;
const requests = [];
const modules = {
  "@/lib/auth-session": { readSessionToken: () => "test-token" },
  "./auth-session": { readSessionToken: () => "test-token" },
  "@/lib/personalized-data": { invalidatePersonalizedData: () => notifications++ },
  "@/lib/location-data": { fallbackAreas: () => [], vietnamProvinces: [] },
};
function load(name) {
  if (modules[name]) return modules[name];
  const exports = {};
  const source = readFileSync(`src/${name.slice(2)}.ts`, "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, require: load, window: {}, process: { env: {} }, Headers, FormData, URLSearchParams, AbortSignal, fetch: fakeFetch });
  return modules[name] = exports;
}
async function fakeFetch(url, options) {
  assert.equal(options.headers.get("Authorization"), "Bearer test-token");
  requests.push({ url, options });
  if (fail) return Response.json({ message: "Save rejected" }, { status: 400 });
  const path = new URL(url).pathname;
  const body = options.body ? JSON.parse(options.body) : undefined;
  if (path === "/api/diet-types") return Response.json(catalog);
  if (path === "/api/users/me/profile") { profile = { ...body }; return Response.json(profile); }
  if (path === "/api/users/me") return Response.json(profile);
  if (path.startsWith("/api/admin/restaurants")) {
    assert.ok(Array.isArray(body.dietTypeIds));
    assert.equal(body.dietTypeId, undefined);
    const restaurantId = options.method === "POST" ? restaurants.length + 1 : Number(path.split("/").at(-1));
    const item = { ...body, restaurantId, latitude: 10, longitude: 106, ingredientNames: [] };
    restaurants = [...restaurants.filter(row => row.restaurantId !== restaurantId), item];
    return Response.json(item, { status: options.method === "POST" ? 201 : 200 });
  }
  if (path === "/api/restaurants") return Response.json(restaurants);
  if (path === "/api/restaurants/nearby") {
    const params = new URL(url).searchParams;
    assert.equal(params.has("dietTypeId"), false);
    assert.equal(params.get("radius"), "5");
    const allowed = catalog.find(type => type.id === profile.dietTypeId).compatibleRestaurantDietTypeIds;
    return Response.json(restaurants.filter(row => row.dietTypeIds.some(id => allowed.includes(id))));
  }
  throw new Error(`Unexpected URL: ${url}`);
}

const admin = load("@/lib/admin-catalog-api"), user = load("@/lib/profile-api"), nearby = load("@/lib/location-api").locationApi;
assert.deepEqual(JSON.parse(JSON.stringify(await user.getDietTypes())).map(type => type.compatibleRestaurantDietTypeIds), catalog.map(type => type.compatibleRestaurantDietTypeIds));
const payload = { name: "Mixed menu", address: "Test address", imageUrl: null, dietTypeIds: [1, 4], foods: [], ingredientIds: [] };
await admin.createRestaurant(payload);
await admin.createRestaurant({ ...payload, name: "Milk dishes", dietTypeIds: [2] });
await admin.createRestaurant({ ...payload, name: "Egg dishes", dietTypeIds: [3] });
assert.equal(notifications, 3);
assert.deepEqual((await admin.listRestaurants())[0].dietTypeIds, [1, 4]);
for (const [dietTypeId, expected] of [[1, [1]], [2, [1, 2]], [3, [1, 3]], [4, [1, 2, 3]]]) {
  await user.updateProfile({ fullName: "Test user", dietTypeId, latitude: 10, longitude: 106 });
  assert.equal((await user.getProfile()).dietTypeId, dietTypeId);
  const rows = await nearby.restaurants("test", "all", 10, 106);
  assert.deepEqual(Array.from(rows, row => Number(row.id)), expected);
  assert.equal(rows[0].category, "VEGAN, LACTO_OVO_VEGETARIAN");
}
await admin.updateRestaurant(1, { ...payload, dietTypeIds: [2, 3] });
assert.deepEqual((await admin.listRestaurants())[2].dietTypeIds, [2, 3]);
await user.updateProfile({ fullName: "Test user", dietTypeId: 1 });
assert.equal((await nearby.restaurants("test", "all", 10, 106)).length, 0);
const beforeFailure = notifications;
fail = true;
await assert.rejects(admin.updateRestaurant(1, payload), /Save rejected/);
await assert.rejects(user.updateProfile({ dietTypeId: 4 }), /Save rejected/);
assert.equal(notifications, beforeFailure);
assert.ok(requests.filter(request => !request.options.method).every(request => request.options.cache === "no-store"));
modules.react = React;
modules["@/context/LanguageContext"] = {};
modules["@/context/AuthContext"] = {};
modules["@/lib/living-location"] = {};
const { displayPlaceCategory } = load("@/hooks/useNearbyPlaces");
assert.equal(displayPlaceCategory("VEGAN, OVO_VEGETARIAN", en => en), "Offers: Vegan, Ovo-vegetarian");
assert.equal(displayPlaceCategory("VEGAN, OVO_VEGETARIAN", (_, vi) => vi), "Có phục vụ: Thuần chay, Chay có trứng");
console.log("PASS mocked BE: authenticated catalog, multi-tag create/edit/reload, four profile diets, all returned tags, successful-save invalidation, failed saves");
