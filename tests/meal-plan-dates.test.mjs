import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/meal-plan-dates.ts", import.meta.url), "utf8");
const exports = {};
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports });
const { parseMealPlanDate, mealPlanDay, initialMealPlanDate } = exports;

test("date input uses day/month/year and converts to ISO for the API", () => {
  assert.equal(parseMealPlanDate("19/10/26"), "2026-10-19");
  assert.equal(parseMealPlanDate("19/10/2026"), "2026-10-19");
  assert.equal(initialMealPlanDate(new Date(2026, 9, 19)), "19/10/26");
});

test("invalid calendar dates are rejected without silently rolling into another month", () => {
  for (const value of ["31/02/26", "29/02/26", "00/10/26", "19/13/26", "2026-10-19", "10/22/2026", "", "19/10/1999"]) {
    assert.equal(parseMealPlanDate(value), null, value);
  }
  assert.equal(parseMealPlanDate("29/02/28"), "2028-02-29");
});

test("day headers include the actual weekday and date across month and year boundaries", () => {
  assert.equal(mealPlanDay("2026-10-19", 1, "en-US").weekday, "Monday");
  assert.equal(mealPlanDay("2026-10-19", 1, "vi-VN").date, "19/10/26");
  assert.equal(mealPlanDay("2026-10-31", 2, "vi-VN").date, "01/11/26");
  assert.equal(mealPlanDay("2026-12-31", 2, "vi-VN").date, "01/01/27");
  assert.equal(mealPlanDay("2028-02-28", 2, "vi-VN").date, "29/02/28");
});
