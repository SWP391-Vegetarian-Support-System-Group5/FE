import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { button, defaultExport, hookHarness, loadModule, nodes, text } from "./helpers/ui-harness.mjs";

const language = { useLanguage: () => ({ language: "vi", locale: "vi-VN", t: (_en, vi) => vi }) };
const uiText = value => value;
const common = {
  "next/link": defaultExport(({ children, href, ...props }) => React.createElement("a", { ...props, href }, children)),
  "next/image": defaultExport(({ src, alt, className }) => React.createElement("img", { src, alt, className })),
  "@/components/UiText": { ...defaultExport(({ text }) => text), useUiText: () => uiText },
  "@/context/LanguageContext": language,
  "@/components/content/ContentIcon": loadModule("src/components/content/ContentIcon.tsx"),
};
const html = tree => renderToStaticMarkup(tree);

function categoryScreen({ fail = false } = {}) {
  const state = hookHarness(), calls = [];
  const Component = loadModule("src/app/admin/categories/page.tsx", {
    ...common, react: state.react,
    "@/lib/recipe-api": {
      getIngredientCategories: async () => [{ id: 2, name: "Actual ingredient group", code: "PLANT", dietaryGroup: "PLANT" }],
      getIngredients: async () => [{ id: 5, name: "Actual ingredient", ingredientCategoryId: 2 }],
    },
    "@/lib/recipe-categories": {
      getRecipeCategories: async includeInactive => {
        calls.push(includeInactive); if (fail) throw new Error("Offline");
        return [{ id: 4, name: "Actual recipe category", isActive: true, createdAt: "2026-11-23" }];
      }, categoryName: category => category.name,
    },
    "@/lib/api": { apiGet: async path => {
      assert.equal(path, "/api/recipes/search");
      return [{ postId: 77, recipeName: "Actual dish", categories: [{ id: 4 }] }];
    } },
    "@/lib/localized-content": { localizeIngredient: value => value, localizeIngredientCategory: (_code, name) => name },
    "@/components/recipe/CategoryRecipeAssignments": defaultExport(() => null),
    "@/components/ui/AdminLeafLoading": defaultExport(({ text }) => React.createElement("span", { role: "status" }, text)),
    "@/components/ui/AdminSelect": defaultExport(() => null),
  }).default;
  return { ...state, render: () => state.render(Component), calls };
}

test("admin categories loads current recipe and ingredient tabs with API-backed counts", async () => {
  const screen = categoryScreen();
  assert.match(html(screen.render()), /role="status"/);
  await screen.flushEffects();
  let tree = screen.render();
  assert.deepEqual(screen.calls, [true]);
  assert.match(html(tree), /Danh mục công thức.*\(1\)/s);
  assert.match(html(tree), /Nhóm nguyên liệu.*\(1\)/s);
  assert.match(html(tree), /Actual recipe category/);
  assert.doesNotMatch(html(tree), /Actual ingredient group|Phở nấm chay|Japanese Washoku/);
  button(tree, "Nhóm nguyên liệu (1)").props.onClick();
  tree = screen.render();
  assert.match(html(tree), /Actual ingredient group/);
  assert.doesNotMatch(html(tree), /Actual recipe category/);
  button(tree, "Danh mục công thức (1)").props.onClick();
  tree = screen.render();
  button(tree, "Thêm danh mục").props.onClick();
  assert.ok(nodes(screen.render()).some(node => node.type === "form"));
  screen.cleanup();
});

test("admin categories reports a failed catalog request without fabricating rows", async () => {
  const screen = categoryScreen({ fail: true }); screen.render();
  await screen.flushEffects();
  const markup = html(screen.render());
  assert.match(markup, /Could not load categories/);
  assert.doesNotMatch(markup, /Actual recipe category|Actual ingredient group/);
  screen.cleanup();
});

const dates = loadModule("src/lib/meal-plan-dates.ts");
const timeline = loadModule("src/components/meal-planner/MealWeekTimeline.tsx", { ...common, "@/lib/meal-plan-dates": dates });
function plannerScreen() {
  const state = hookHarness();
  const meal = { id: "900", recipeId: 77, slot: "BREAKFAST", title: "Actual recipe detail", description: "Actual description", image: "/real-recipe.jpg", durationCalories: "15 mins", ingredients: ["100g tofu"], steps: ["Cook tofu"] };
  const noop = () => {};
  const view = {
    days: Array.from({ length: 7 }, (_, day) => ({
      dayNumber: day + 1, dayName: `Weekday ${day + 1}`, theme: `Day ${day + 1} - ${19 + day}/10/26`, totalPrep: "3 meals",
      meals: ["BREAKFAST", "LUNCH", "DINNER"].map((slot, index) => ({ ...meal, id: `${day}-${index}`, slot, title: `Actual recipe ${day + 1}-${index + 1}` })),
    })),
    allergens: [], availableAllergens: [], allergenStatus: "ready", allergenError: null,
    pantryIngredients: ["tofu"], newAllergen: "", newPantryItem: "", selectedMealForView: meal,
    inputProblems: [], profileProblems: [], toastMessage: null, isRegenerating: false, loading: false, error: "", startDate: "19/10/26",
    profileName: "Actual user", bmi: 22, bmiCategory: "Normal", dietName: "Vegan", savedCount: 2,
    savedStartDate: "2026-10-19", planId: 24, savedWeekRange: "19/10/2026 – 25/10/2026",
    setNewAllergen: noop, setShowAddAllergen: noop, setNewPantryItem: noop, setSelectedMealForView: noop,
    handleRemoveAllergen: noop, handleAddAllergen: noop, handleRemovePantry: noop, handleAddPantry: noop,
    handleReplaceMeal: noop, handleRegenerate: noop, viewMeal: noop, setStartDate: noop,
  };
  const Component = loadModule("src/components/meal-planner/MealPlannerView.tsx", {
    ...common, react: state.react, "./useMealPlanner": { useMealPlanner: () => view },
    "./MealGoalDialog": defaultExport(() => null), "./MealWeekTimeline": timeline,
    "./WeeklyWeightCheckIn": defaultExport(() => null),
    "./MealImageStatus": loadModule("src/components/meal-planner/MealImageStatus.tsx"),
    "@/components/ui/ImageManager": defaultExport(() => null),
    "@/lib/image-api": {}, "@/lib/meal-plan-api": {}, "@/lib/meal-plan-goals": {},
  }).default;
  return { ...state, render: () => state.render(Component), view };
}

test("planner shows all seven days, real meal details and available replacement actions without a five-use limit", () => {
  const screen = plannerScreen(); const tree = screen.render(), markup = html(tree);
  for (const content of ["Actual user", "Actual recipe detail", "100g tofu", "Cook tofu", "Nguyên liệu sẵn có"]) assert.ok(markup.includes(content));
  const calendar = nodes(tree).find(node => node.type === timeline.default);
  assert.equal(calendar.props.draftStartDate, "19/10/26");
  assert.equal(calendar.props.savedStartDate, "2026-10-19");
  assert.match(markup, /Xem thực đơn ngày 19\/10\/2026/);
  assert.match(markup, /Xem thực đơn ngày 25\/10\/2026/);
  assert.match(markup, /aria-label="Lịch thực đơn 7 ngày"/);
  for (let day = 1; day <= 7; day++) {
    assert.ok(markup.includes(`Weekday ${day}`));
    assert.ok(markup.includes(`Day ${day} - ${18 + day}/10/26`));
    for (let meal = 1; meal <= 3; meal++) assert.ok(markup.includes(`Actual recipe ${day}-${meal}`));
  }
  const replacements = nodes(tree).filter(node => node.type === "button" && text(node).trim() === "Thay món");
  assert.equal(replacements.length, 21);
  assert.ok(replacements.every(node => node.props.disabled === false));
  assert.equal(nodes(tree).filter(node => node.type === "button" && text(node).trim() === "Xem công thức").length, 21);
  assert.doesNotMatch(markup, /Giới hạn đổi món|hết 5 lượt|Minh Tran|Warm Tofu &amp; Vegetable Congee|84%/);
  screen.view.isRegenerating = true;
  assert.ok(nodes(screen.render()).filter(node => node.type === "button" && text(node).trim() === "Thay món").every(node => node.props.disabled));
});

test("planner switches between one selected day and all seven days while keeping the calendar", () => {
  const screen = plannerScreen(); let tree = screen.render();
  nodes(tree).find(node => node.type === timeline.default).props.onSelectDay(3);
  tree = screen.render(); let markup = html(tree);
  assert.match(markup, /Actual recipe 3-1/);
  assert.doesNotMatch(markup, /Actual recipe 1-1|Actual recipe 2-1|Actual recipe 4-1/);
  assert.match(markup, /aria-label="Lịch thực đơn 7 ngày"/);
  button(tree, "Cả tuần").props.onClick();
  tree = screen.render(); markup = html(tree);
  assert.match(markup, /Actual recipe 1-1/); assert.match(markup, /Actual recipe 7-3/);
});

function placesScreen(places) {
  const state = hookHarness();
  const Component = loadModule("src/components/CuratedVeganPlaces.tsx", {
    ...common, react: state.react,
    "@/lib/api": { getMediaUrl: value => `https://media.example.test${value}` },
    "@/components/RestaurantDetailsModal": defaultExport(({ restaurant }) => React.createElement("div", { role: "dialog" }, restaurant.name)),
    "@/hooks/useNearbyPlaces": {
      useNearbyPlaces: () => ({ places, loading: false, message: "Nearby places", origin: { lat: 10, lng: 106 } }),
      displayPlaceCategory: () => "Vegetarian",
    },
  }).default;
  return { ...state, render: () => state.render(Component) };
}
test("homepage place cards display live restaurant data and open the corresponding details", () => {
  const screen = placesScreen([{ id: "restaurant-1", name: "Admin restaurant", category: "vegetarian", address: "Actual address", areaCode: "all", latitude: 10, longitude: 106, rating: 0, reviewCount: 0, distanceKm: 1.2 }]);
  const tree = screen.render(), markup = html(tree);
  for (const value of ["Admin restaurant", "Actual address", "Ảnh minh họa", "1.2 km"]) assert.ok(markup.includes(value));
  assert.doesNotMatch(markup, /Not rated|reviews|Green Garden Vegetarian|Loving Leaf Vegan|4\.8|4\.9/);
  nodes(tree).find(node => node.props?.onClick && text(node).includes("Admin restaurant")).props.onClick();
  assert.match(html(screen.render()), /role="dialog">Admin restaurant/);
});
test("empty nearby-place results stay empty without sample restaurants", () => {
  const screen = placesScreen([]); const markup = html(screen.render());
  assert.match(markup, /Nearby places/);
  assert.doesNotMatch(markup, /Admin restaurant|Green Garden Vegetarian|Loving Leaf Vegan|<img/);
});
