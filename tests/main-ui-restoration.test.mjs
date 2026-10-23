import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import React from "react";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const defaultExport = component => ({ __esModule: true, default: component });
const ui = {
  ...defaultExport(({ text }) => text), useUiText: () => text => text,
};
const language = { useLanguage: () => ({ language: "vi", locale: "vi-VN", t: (_en, vi) => vi }) };
const common = {
  react: React, "react/jsx-runtime": jsx,
  "next/link": defaultExport(({ children, href, ...props }) => React.createElement("a", { ...props, href }, children)),
  "next/image": defaultExport(({ src, alt, className }) => React.createElement("img", { src, alt, className })),
  "@/components/UiText": ui, "@/context/LanguageContext": language,
};
function load(path, dependencies) {
  const code = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => {
    const modules = { ...common, ...dependencies };
    assert.ok(Object.hasOwn(modules, name), `Unexpected import: ${name}`);
    return modules[name];
  } });
  return exports.default;
}

test("main category page renders all three tabs, rather than redirecting away", () => {
  const Component = load("src/app/admin/categories/page.tsx", {
    "@/context/AuthContext": { useAuth: () => ({ user: { fullName: "Administrator" } }) },
    "next/navigation": { useRouter: () => ({ push() {} }) },
    "@/lib/recipe-api": {}, "@/lib/api": {},
    "@/lib/recipe-categories": { CATEGORY_TYPES: ["CUISINE"], categoryTypeLabels: { CUISINE: ["Cuisine", "Ẩm thực"] } },
    "@/components/recipe/CategoryRecipeAssignments": defaultExport(() => null),
    "@/lib/bmi-api": {},
  });
  const html = renderToStaticMarkup(React.createElement(Component));
  assert.match(html, /Nhóm nguyên liệu/);
  assert.match(html, /Lọc kết hợp và món ăn/);
  assert.match(html, /Danh mục mới|Thêm danh mục|Tạo danh mục/);
  assert.doesNotMatch(html, /Phở nấm chay|520|Japanese Washoku/);
});

test("restored main meal cards and recipe modal render API-backed view data, not design fixtures", () => {
  const meal = { id: "900", recipeId: 77, slot: "BREAKFAST", title: "Actual recipe", description: "Actual description", image: "/images/hero_slide.png", durationCalories: "15 mins", ingredients: ["100g tofu"], steps: ["Cook tofu"] };
  const noop = () => {};
  const Component = load("src/components/meal-planner/MealPlannerView.tsx", {
    "./useMealPlanner": { useMealPlanner: () => ({
      days: Array.from({ length: 7 }, (_, day) => ({
        dayName: `Weekday ${day + 1}`, theme: `Day ${day + 1} - ${19 + day}/10/26`, totalPrep: "3 meals",
        meals: ["BREAKFAST", "LUNCH", "DINNER"].map((slot, index) => ({
          ...meal, id: `${day}-${index}`, slot, title: `Actual recipe ${day + 1}-${index + 1}`,
        })),
      })),
      allergens: [], pantryIngredients: ["tofu"], newAllergen: "", newPantryItem: "", selectedMealForView: meal,
      toastMessage: null, isRegenerating: false, loading: false, error: "", startDate: "19/10/26",
      profileName: "Actual user", bmi: 22, bmiCategory: "Normal", dietName: "Vegan", savedCount: 2,
      setNewAllergen: noop, setShowAddAllergen: noop, setNewPantryItem: noop, setSelectedMealForView: noop,
      handleRemoveAllergen: noop, handleAddAllergen: noop, handleRemovePantry: noop, handleAddPantry: noop,
      handleReplaceMeal: noop, handleRegenerate: noop, viewMeal: noop, setStartDate: noop,
    }) },
  });
  const html = renderToStaticMarkup(React.createElement(Component));
  assert.match(html, /Actual user/);
  assert.match(html, /Actual recipe/);
  assert.match(html, /100g tofu/);
  assert.match(html, /Cook tofu/);
  assert.doesNotMatch(html, /Larder &amp; Fresh Bin|Available ingredients/);
  assert.match(html, /placeholder="dd\/mm\/yy"/);
  assert.match(html, /value="19\/10\/26"/);
  assert.doesNotMatch(html, /type="date"/);
  for (let day = 1; day <= 7; day++) {
    assert.match(html, new RegExp(`Weekday ${day}`));
    assert.match(html, new RegExp(`Day ${day} - ${18 + day}/10/26`));
    for (let meal = 1; meal <= 3; meal++) assert.match(html, new RegExp(`Actual recipe ${day}-${meal}`));
  }
  assert.equal((html.match(/>Xem công thức</g) || []).length, 21);
  assert.equal((html.match(/>Thay món</g) || []).length, 21);
  assert.doesNotMatch(html, /Remaining days/);
  assert.doesNotMatch(html, /kcal|Minh Tran|Warm Tofu &amp; Vegetable Congee|84%/);
});

test("restored main place-card design uses live places and does not fall back to fake restaurants", () => {
  const Component = load("src/components/CuratedVeganPlaces.tsx", {
    "@/hooks/useNearbyPlaces": {
      useNearbyPlaces: () => ({ places: [{ id: "osm-1", name: "Actual OSM place", category: "vegetarian", address: "Actual address", areaCode: "all", latitude: 10, longitude: 106, rating: 0, reviewCount: 0, distanceKm: 1.2 }], loading: false, message: "Nearby places" }),
      displayPlaceCategory: () => "Vegetarian",
    },
  });
  const html = renderToStaticMarkup(React.createElement(Component));
  assert.match(html, /Actual OSM place/);
  assert.match(html, /Actual address/);
  assert.match(html, /Ảnh minh họa/);
  assert.match(html, /Chưa có điểm/);
  assert.doesNotMatch(html, /Green Garden Vegetarian|Loving Leaf Vegan|4\.8|4\.9/);
});
