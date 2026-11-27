import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as runtime from "react/jsx-runtime";

function load(path, imports = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(path, "utf8"), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  vm.runInNewContext(code, { exports, require: key => {
    assert.ok(key in imports, `Unexpected import: ${key}`);
    return imports[key];
  } });
  return exports;
}
const bmi = load("src/types/profile.ts");
const health = load("src/lib/health-profile-validation.ts", { "../types/profile": bmi });
const valid = { heightCm: "170", weightKg: "65", goalWeightKg: "" };
const validate = changes => health.validateHealthProfile({ ...valid, ...changes });

test("strict height and weight boundaries reject endpoints, nonfinite and nonnumeric values", () => {
  for (const heightCm of ["140", "210", "139.9", "210.1", "NaN", "Infinity", "abc", "170cm"]) {
    assert.equal(validate({ heightCm }).heightCm, "heightRange");
  }
  for (const weightKg of ["45", "120", "44.9", "120.1", "NaN", "Infinity", "abc", "65kg"]) {
    assert.equal(validate({ weightKg }).weightKg, "weightRange");
  }
  for (const heightCm of ["140.01", "209.99"]) assert.equal(validate({ heightCm }).heightCm, undefined);
  for (const weightKg of ["45.01", "119.99"]) assert.equal(validate({ weightKg }).weightKg, undefined);
});

test("empty optional fields, required onboarding values and goal dependencies", () => {
  assert.equal(Object.keys(health.validateHealthProfile({ heightCm: "", weightKg: "", goalWeightKg: "" })).length, 0);
  const errors = health.validateHealthProfile({ heightCm: "", weightKg: "", goalWeightKg: "" }, true);
  assert.equal(errors.heightCm, "heightRequired");
  assert.equal(errors.weightKg, "weightRequired");
  for (const goalWeightKg of ["1001", "Infinity", "abc", "0", "-1"]) {
    assert.equal(validate({ goalWeightKg }).goalWeightKg, "goalRange");
  }
  assert.equal(validate({ heightCm: "", goalWeightKg: "60" }).heightCm, "heightRequired");
  assert.equal(validate({ heightCm: "", goalWeightKg: "60" }).goalWeightKg, undefined);
  assert.equal(validate({ weightKg: "120", goalWeightKg: "60" }).goalWeightKg, undefined);
  assert.equal(validate({ goalWeightKg: "  " }).goalWeightKg, undefined);
});

test("BMI uses unrounded thresholds, rejects gain for obesity and loss for underweight", () => {
  const obese = { heightCm: "170", weightKg: "100" };
  assert.equal(validate({ ...obese, goalWeightKg: "101" }).goalWeightKg, "obesityGain");
  assert.equal(validate({ ...obese, goalWeightKg: "100" }).goalWeightKg, "obesityGain");
  for (const goalWeightKg of ["95"]) assert.equal(validate({ ...obese, goalWeightKg }).goalWeightKg, undefined);
  const thin = { heightCm: "180", weightKg: "50" };
  assert.equal(validate({ ...thin, goalWeightKg: "49" }).goalWeightKg, "underweightLoss");
  assert.equal(validate({ ...thin, goalWeightKg: "50" }).goalWeightKg, "underweightLoss");
  for (const goalWeightKg of ["55"]) assert.equal(validate({ ...thin, goalWeightKg }).goalWeightKg, undefined);
  assert.equal(validate({ heightCm: "200", weightKg: "74", goalWeightKg: "73" }).goalWeightKg, "goalBmiRange"); // exactly 18.5
  assert.equal(validate({ heightCm: "200", weightKg: "73.99", goalWeightKg: "73" }).goalWeightKg, "underweightLoss");
  assert.equal(validate({ heightCm: "150", weightKg: "67.5", goalWeightKg: "68" }).goalWeightKg, "obesityGain"); // exactly 30
  assert.equal(validate({ heightCm: "150", weightKg: "67.49", goalWeightKg: "68" }).goalWeightKg, "overweightGain");
});

test("measurement errors stop target validation until both measurements are valid", () => {
  for (const goalWeightKg of ["1001", "abc", "110"]) {
    const errors = validate({ heightCm: "140", weightKg: "120", goalWeightKg });
    assert.equal(errors.heightCm, "heightRange");
    assert.equal(errors.weightKg, "weightRange");
    assert.equal(errors.goalWeightKg, undefined);
  }
  assert.equal(validate({ heightCm: "170", weightKg: "110", goalWeightKg: "111" }).goalWeightKg, "obesityGain");
  for (const goalWeightKg of ["100"]) {
    assert.equal(Object.keys(validate({ heightCm: "170", weightKg: "110", goalWeightKg })).length, 0);
  }
  assert.equal(Object.keys(validate({ heightCm: "180", weightKg: "50", goalWeightKg: "55" })).length, 0);
});

test("known backend health validation messages render in Vietnamese", () => {
  const { translateUi } = load("src/lib/ui-translations.ts");
  const oldRange = "Target weight must stay within the healthy BMI range for your height (56.7-76.3 kg).";
  const text = translateUi(oldRange, "vi");
  assert.ok(text.includes("Máy chủ") && text.includes("56,7") && text.includes("Hồ sơ chưa được lưu"));
  for (const source of [
    "Enter your height before setting a target weight.",
    "A user in the underweight BMI group cannot set a lower target weight.",
    "A user in the high-BMI group cannot set a higher target weight.",
  ]) assert.notEqual(translateUi(source, "vi"), source);
});

test("each error translates at render time in both languages", () => {
  for (const error of ["heightRequired", "heightRange", "weightRequired", "weightRange", "goalRange", "goalNeedsMeasurements", "obesityGain", "underweightLoss", "overweightGain", "goalRequired", "goalBmiRange"]) {
    const en = health.healthErrorText(error, en => en);
    const vi = health.healthErrorText(error, (_en, vi) => vi);
    assert.ok(en.length > 10 && vi.length > 10);
    assert.notEqual(en, vi);
  }
});

test("onboarding prevents invalid API writes, updates dependent errors and preserves input across languages", async () => {
  const slots = [], writes = [];
  let cursor = 0, language = "vi", currentLocation = null;
  const page = load("src/app/onboarding/page.tsx", {
    react: {
      useState: initial => { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = typeof value === "function" ? value(slots[i]) : value; }]; },
      useEffect() {}, useMemo: fn => fn(),
    },
    "react/jsx-runtime": runtime,
    "next/navigation": { useRouter: () => ({ replace() {} }) },
    "lucide-react": {},
    "@/context/LanguageContext": { useLanguage: () => ({ t: (en, vi) => language === "vi" ? vi : en, locale: language === "vi" ? "vi-VN" : "en-US" }) },
    "@/context/CurrentLocationContext": { useCurrentLocation: () => ({ location: currentLocation }) },
    "@/components/profile/CurrentLocationControl": { default: "location-control" },
    "@/lib/health-profile-validation": health,
    "@/types/profile": bmi,
    "@/components/UiText": { default: "ui-text" },
    "@/context/AuthContext": { useAuth: () => ({ user: { fullName: "Test" }, loading: false }) },
    "@/lib/diet-type-display": {},
    "@/lib/profile-api": { updateProfile: async payload => writes.push(payload) },
  });
  const render = () => { cursor = 0; return page.default(); };
  function nodes(value) {
    if (Array.isArray(value)) return value.flatMap(nodes);
    if (!value || typeof value !== "object") return [];
    return [value, ...nodes(value.props?.children)];
  }
  let tree = render();
  const input = field => nodes(tree).find(node => node.type === "input" && node.props["aria-describedby"]?.includes(field));
  const change = (index, value) => {
    nodes(tree).filter(node => node.type === "input")[index].props.onChange({ target: { value } });
    tree = render();
  };
  const submit = async () => { await nodes(tree).find(node => node.type === "form").props.onSubmit({ preventDefault() {} }); tree = render(); };
  change(0, "2000");
  const selects = nodes(tree).filter(node => node.type === "select");
  selects[0].props.onChange({ target: { value: "MALE" } });
  selects[1].props.onChange({ target: { value: "LIGHT" } });
  selects[2].props.onChange({ target: { value: "1" } });
  tree = render();
  change(1, "180"); change(2, "95");
  assert.equal(input("goalWeightKg").props.value, "70.5");
  language = "en"; tree = render();
  assert.equal(input("goalWeightKg").props.value, "70.5");
  change(3, "82"); change(1, "181");
  assert.equal(input("goalWeightKg").props.value, "82");
  language = "vi"; tree = render();
  change(1, "140"); change(2, "100"); change(3, "101");
  await submit(); assert.equal(writes.length, 0);
  assert.equal(input("heightCm").props["aria-invalid"], true);
  assert.ok(!nodes(tree).some(node => node.props?.role === "alert" && String(node.props.children).includes("béo phì")));
  change(1, "170");
  assert.equal(input("goalWeightKg").props.value, "101");
  await submit(); assert.equal(writes.length, 0);
  assert.ok(nodes(tree).some(node => node.props?.role === "alert" && String(node.props.children).includes("béo phì")));
  assert.ok(!nodes(tree).some(node => typeof node.props?.children === "string" && node.props.children.includes("Mục tiêu tăng")));
  language = "en"; tree = render();
  assert.equal(input("goalWeightKg").props.value, "101");
  assert.ok(nodes(tree).some(node => node.props?.role === "alert" && String(node.props.children).includes("obesity")));
  change(2, "50"); change(1, "180"); change(3, "49");
  await submit(); assert.equal(writes.length, 0);
  currentLocation = { address: "Synced GPS address", center: { lat: 10.8, lng: 106.7 } };
  tree = render();
  change(3, "55"); await submit();
  assert.equal(writes.length, 1);
  assert.equal(writes[0].goalWeightKg, 55);
  assert.equal(writes[0].latitude, 10.8);
  assert.equal(writes[0].longitude, 106.7);
  assert.equal(writes[0].livingAddress, "Synced GPS address");
});

 test("suggestions are valid, partial goals accepted, opposite BMI extremes rejected", () => {
  for (const [heightCm, weightKg] of [["180", "95"], ["180", "50"], ["170", "65"], ["209.9", "46"]]) {
    const goalWeightKg = health.suggestGoalWeight(heightCm, weightKg);
    assert.ok(goalWeightKg);
    assert.equal(Object.keys(health.validateHealthProfile({heightCm, weightKg, goalWeightKg}, true)).length, 0);
  }
  assert.equal(health.suggestGoalWeight("", "95"), "");
  assert.equal(health.suggestGoalWeight("140", "95"), "");
  assert.equal(health.suggestGoalWeight("170", "65"), "65");
  assert.equal(validate({heightCm:"180", weightKg:"95", goalWeightKg:"82"}).goalWeightKg, undefined);
  assert.equal(validate({heightCm:"180", weightKg:"95", goalWeightKg:"50"}).goalWeightKg, "goalBmiRange");
  assert.equal(validate({heightCm:"180", weightKg:"50", goalWeightKg:"90"}).goalWeightKg, "goalBmiRange");
  assert.equal(health.validateHealthProfile(valid, true).goalWeightKg, "goalRequired");
 });
