"use client";

import ContentIcon from "@/components/content/ContentIcon";

import MealGoalDialog from "./MealGoalDialog";
import MealWeekTimeline from "./MealWeekTimeline";
import WeeklyWeightCheckIn from "./WeeklyWeightCheckIn";
import { GOAL_LABELS } from "@/lib/meal-plan-goals";

import { useLanguage } from "@/context/LanguageContext";
import UiText, { useUiText } from "@/components/UiText";


import MealImageStatus from "./MealImageStatus";
import ImageManager from "@/components/ui/ImageManager";
import { uploadMealImage, deleteMealImage, generateMealImage } from "@/lib/image-api";
import { useMealPlanner } from "./useMealPlanner";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getMealReplacementOptions, type MealPlanRecipeOptionResponse } from "@/lib/meal-plan-api";

export interface MealItem {
  id: string;
  recipeId?: number;
  mealPlanMealId?: number;
  slot: "BREAKFAST" | "LUNCH" | "DINNER";
  timeLabel: string;
  durationCalories: string;
  isSavedInCollection?: boolean;
  title: string;
  description: string;
  image: string;
  imageIsGenerated?: boolean;
  imageGenerationStatus?: string | null;
  imageGenerationError?: string | null;
  ingredients: string[];
  steps: string[];
}

export interface DayPlan {
  dayNumber?: number;
  dayName: string;
  theme: string;
  totalPrep: string;
  meals: MealItem[];
}

export const INITIAL_DAYS: DayPlan[] = [
  {
    dayName: "Monday",
    theme: "Day 1 · Fresh Larder Start",
    totalPrep: "80 min total prep",
    meals: [
      {
        id: "m-mon-1",
        slot: "BREAKFAST",
        timeLabel: "Morning",
        durationCalories: "25 mins · 280 kcal",
        title: "Warm Tofu & Vegetable Congee",
        description:
          "Gentle broken rice infused with shaved fresh ginger, bok choy stems, and silken tofu cubs seasoned with white pepper.",
        image:
          "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80",
        ingredients: [
          "150g Broken jasmine rice",
          "100g Silken tofu",
          "2 stalks Baby bok choy",
          "1 tsp Shaved fresh ginger",
          "Sesame oil & white pepper",
        ],
        steps: [
          "Simmer jasmine rice with vegetable stock until broken and velvety.",
          "Add diced silken tofu and sliced bok choy stems.",
          "Finish with ginger shreds, toasted sesame oil, and cilantro.",
        ],
      },
      {
        id: "m-mon-2",
        slot: "LUNCH",
        timeLabel: "Midday",
        durationCalories: "35 mins",
        isSavedInCollection: true,
        title: "Bún Bò Chay (Spicy Hue Broth)",
        description:
          "Lemongrass simmered root broth with thick round rice noodles, king oyster mushrooms, and crispy tofu puffs.",
        image:
          "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80",
        ingredients: [
          "200g Fresh thick rice noodles",
          "3 stalks Lemongrass",
          "100g King oyster mushrooms",
          "50g Fried tofu puffs",
          "Annatto oil, lime & fresh mint",
        ],
        steps: [
          "Bruise lemongrass stalks and simmer with daikon and pineapple core.",
          "Stir-fry king oyster mushrooms with annatto chili oil.",
          "Pour boiling broth over noodles and garnish with herbs.",
        ],
      },
      {
        id: "m-mon-3",
        slot: "DINNER",
        timeLabel: "Evening",
        durationCalories: "20 mins",
        isSavedInCollection: true,
        title: "Easy Tofu in Rich Tomato Sauce",
        description:
          "Quick pantry pan-fry with crushed vine tomatoes, finely sliced scallions, and warm steamed brown rice.",
        image:
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
        ingredients: [
          "300g Firm organic tofu",
          "3 Ripe vine tomatoes",
          "2 Scallions",
          "1 tbsp Tamari soy sauce",
          "1 tsp Cane sugar",
        ],
        steps: [
          "Pan-fry cubed tofu until light golden edges form.",
          "Simmer diced tomatoes into a velvety reduction with tamari.",
          "Toss tofu in tomato sauce and garnish with scallions.",
        ],
      },
    ],
  },
  {
    dayName: "Tuesday",
    theme: "Day 2 · Earth & Claypot",
    totalPrep: "65 min total prep",
    meals: [
      {
        id: "m-tue-1",
        slot: "BREAKFAST",
        timeLabel: "Morning",
        durationCalories: "15 mins · 310 kcal",
        title: "Avocado & Steamed Rice Paper Rolls",
        description:
          "Crisp mint leaves, julienned cucumber, creamy hass avocado with lightly seasoned peanut dipping sauce.",
        image:
          "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
        ingredients: [
          "6 Sheets Vietnamese rice paper",
          "1 Ripe Hass avocado",
          "1 Persian cucumber",
          "Fresh mint & perilla leaves",
          "Peanut hoisin dip",
        ],
        steps: [
          "Dip rice paper briefly in lukewarm water.",
          "Layer avocado slices, cucumber strips, and fresh herbs.",
          "Roll tightly and serve immediately with peanut sauce.",
        ],
      },
      {
        id: "m-tue-2",
        slot: "LUNCH",
        timeLabel: "Midday",
        durationCalories: "30 mins",
        isSavedInCollection: true,
        title: "Claypot Braised Tofu & Eggplant",
        description:
          "Slow-caramelized Asian eggplant with cracked Kampot black pepper, garlic scallions, and silken claypot glaze.",
        image:
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
        ingredients: [
          "2 Asian purple eggplants",
          "200g Fried firm tofu",
          "2 tbsp Dark mushroom soy sauce",
          "1 tsp Coarse black pepper",
          "1 Red chili",
        ],
        steps: [
          "Sear eggplant slices in claypot until slightly charred.",
          "Add tofu, caramelized mushroom soy sauce, and 1/2 cup water.",
          "Simmer on low heat until sauce thickens and glazes eggplant.",
        ],
      },
      {
        id: "m-tue-3",
        slot: "DINNER",
        timeLabel: "Evening",
        durationCalories: "25 mins",
        isSavedInCollection: true,
        title: "Crispy Mushroom Spring Rolls with Vermicelli",
        description:
          "Shiitake and wood-ear mushroom filling served over chilled vermicelli noodles, fresh garden herbs, and lime dressing.",
        image:
          "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
        ingredients: [
          "10 Crispy spring roll wrappers",
          "100g Fresh shiitake & wood ear mushrooms",
          "150g Rice vermicelli",
          "Fresh lettuce & herbs",
          "Sweet & sour lime dipping dressing",
        ],
        steps: [
          "Roll mushroom filling in wrappers and air fry at 190°C for 12 mins.",
          "Cook rice vermicelli and drain in cold water.",
          "Assemble rolls over vermicelli bed and drizzle dressing.",
        ],
      },
    ],
  },
];

export const ALTERNATIVE_DISHES: Record<string, Partial<MealItem>> = {
  BREAKFAST: {
    title: "Toasted Sourdough with Edamame Herb Mash",
    description: "Lemony crushed green soybeans, extra virgin olive oil, and toasted coriander seeds.",
    durationCalories: "15 mins · 290 kcal",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",
  },
  LUNCH: {
    title: "Garlic Bok Choy & Glass Noodle Tangle",
    description: "Wok-tossed farm greens with ginger, light tamari, and toasted sesame crunch.",
    durationCalories: "20 mins · 340 kcal",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80",
  },
  DINNER: {
    title: "Kabocha Pumpkin & Coconut Gentle Curry",
    description: "Sweet squash simmered with light coconut nectar, turmeric, and crisp long beans.",
    durationCalories: "30 mins · 390 kcal",
    image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80",
  },
};

export default function MealPlannerView() {
  const ui = useUiText();
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [selectedDay, setSelectedDay] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mealPicker, setMealPicker] = useState<{ dayIndex: number; meal: MealItem } | null>(null);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerOptions, setPickerOptions] = useState<MealPlanRecipeOptionResponse[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const {
    profileProblems, saveWeeklyWeight, currentWeightKg, weightOwner,
    goalContext, inputProblems, confirmGeneration, closeGoalDialog, selectedWeekRange, savedWeekRange, savedStartDate, planNutrition,
    imagePollingNotice, imagesPending, reloadMealImages,
    planId, applyMealImage, refreshMealImages, setImageBusy,
    days, allergens, newAllergen, setNewAllergen, showAddAllergen, setShowAddAllergen,
    availableAllergens, allergenStatus, allergenError, retryAllergens,
    pantryIngredients, newPantryItem, setNewPantryItem, selectedMealForView, setSelectedMealForView,
    toastMessage, isRegenerating, handleRemoveAllergen, handleAddAllergen, handleRemovePantry,
    handleAddPantry, handleReplaceMeal, handleDeletePlan, handleRegenerate, viewMeal, profileName, bmi, bmiCategory,
    dietName, savedCount, loading, error, startDate, tdee, targetCalories, nutritionGoal, calorieAdjustment,
    goalWeightKg, estimatedWeeksToGoal,
  } = useMealPlanner();
  const openMealPicker = (dayIndex: number, meal: MealItem) => {
    setPickerQuery("");
    setPickerOptions([]);
    setMealPicker({ dayIndex, meal });
  };
  useEffect(() => {
    if (!mealPicker || !planId) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setPickerLoading(true);
      void getMealReplacementOptions(planId, Number(mealPicker.meal.id), pickerQuery)
        .then(options => { if (active) setPickerOptions(options); })
        .catch(() => { if (active) setPickerOptions([]); })
        .finally(() => { if (active) setPickerLoading(false); });
    }, pickerQuery ? 250 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [mealPicker, planId, pickerQuery]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
      {/* Toast */}
      {toastMessage && (
        <div role="status" aria-live="polite" className="fixed bottom-6 left-4 right-4 z-50 sm:left-auto sm:right-6 sm:max-w-md rounded-2xl bg-[#07241A] px-5 py-3 text-xs font-semibold text-white shadow-xl transition-all animate-fade-in flex items-center gap-2">
          <span><ContentIcon name="leaf" width="1em" height="1em" className="inline-block shrink-0 align-[-0.125em]" /></span>
          <span>{<UiText text={toastMessage} />}</span>
        </div>
      )}

      {(imagesPending || imagePollingNotice) && <div role="status" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E5E7DF] bg-white px-4 py-3 text-xs text-[#59635C]">
        <span>{imagePollingNotice || "Ảnh món ăn đang được xử lý nền. Thực đơn vẫn dùng bình thường; ảnh sẽ tự cập nhật mỗi 5 giây."}</span>
        <button type="button" disabled={isRegenerating} onClick={() => void reloadMealImages()} className="vm-button shrink-0 underline disabled:opacity-40">Tải lại ảnh</button>
      </div>}

      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[#EFEEEB] pb-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#727974]">
            <span className="h-2 w-2 rounded-full bg-[#16a34a]" />
            <span className="rounded-full bg-[#EFEEEB] px-3 py-0.5 text-[11px] font-bold text-[#07241A]">{ui("Weekly meal plan")}</span>
          </div>

          <h1 className="mt-1 font-serif text-2xl sm:text-2xl lg:text-2xl font-bold tracking-tight text-[#07241A]"><UiText text={"Lên thực đơn tuần"} /></h1>
          <p className="mt-1.5 text-sm text-[#424844] max-w-2xl">{t("Meals selected for your vegetarian type, allergies and calorie goal.", "Thực đơn phù hợp với kiểu ăn chay, dị ứng và mục tiêu calories của bạn.")}</p>
        </div>

        {/* Action Buttons Top Right */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => void handleRegenerate()}
            disabled={isRegenerating || loading}
            className="flex items-center gap-2 rounded-xl bg-white border border-[#EFEEEB] px-4 py-2.5 text-xs font-semibold text-[#07241A] shadow-xs hover:bg-[#F5F3F0] transition cursor-pointer"
          >
            <span><ContentIcon name="sparkles" width="1em" height="1em" className="inline-block shrink-0 align-[-0.125em]" /></span>
            <span>{isRegenerating ? t("Generating…", "Đang tạo…") : days.length ? t("Generate a new plan", "Tạo thực đơn mới") : t("Generate My 7-Day Plan", "Tạo thực đơn 7 ngày")}</span>
          </button>

          {planId && <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isRegenerating || loading}
            title="Xóa thực đơn hiện tại"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#F1D9D1] bg-white text-[#A24635] shadow-xs transition hover:bg-[#FFF6F4] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v5M14 11v5" /></svg>
            <span className="sr-only">Xóa thực đơn</span>
          </button>}


        </div>
      </div>

      {loading && <p role="status" className="py-4">{ui("Loading...")}</p>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {!loading && days.length === 0 && <p className="py-4">{ui("No meal plan yet.")}</p>}
      <section className="mt-3 rounded-2xl border border-[#E5E7DF] bg-white p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><p className="text-[11px] font-medium uppercase tracking-wider text-[#727974]">{savedWeekRange ? "Tuần đang xem" : "Tuần dự kiến"}</p>
            <p className="font-serif text-base text-[#07241A]">{savedWeekRange || selectedWeekRange || "Chọn ngày bắt đầu"}</p>
            {planNutrition && <p className="text-xs text-[#254B38]">{GOAL_LABELS[planNutrition.goal]} · {Math.round(planNutrition.target).toLocaleString("vi-VN")} kcal/ngày</p>}
          </div>
        </div>
        {savedWeekRange && selectedWeekRange && savedWeekRange !== selectedWeekRange && <p className="mt-3 text-xs text-[#727974]">Tuần sẽ tạo mới: {selectedWeekRange}</p>}
        {days.length > 0 && <div role="group" aria-label={t("Meal plan view", "Chế độ xem thực đơn")} className="mt-2 inline-flex gap-1 rounded-xl bg-[#F0F3ED] p-1 text-xs">
          {(["week", "day"] as const).map(mode => <button key={mode} type="button" aria-pressed={viewMode === mode}
            onClick={() => setViewMode(mode)} className={`rounded-lg px-4 py-2 font-medium transition focus-visible:outline-2 focus-visible:outline-[#254B38] ${viewMode === mode ? "bg-[#254B38] text-white shadow-sm" : "text-[#526359] hover:bg-white"}`}>
            {mode === "week" ? t("Whole week", "Cả tuần") : t("By day", "Từng ngày")}
          </button>)}
        </div>}
        <MealWeekTimeline savedStartDate={savedStartDate} draftStartDate={startDate}
          selectedDay={viewMode === "day" ? selectedDay : undefined}
          onSelectDay={day => { setSelectedDay(day); setViewMode("day"); }} />
      </section>
      {!loading && <WeeklyWeightCheckIn key={`${weightOwner}:${planId}:${savedStartDate}`} owner={weightOwner} planId={planId} startDate={savedStartDate} weightKg={currentWeightKg} busy={isRegenerating} onSave={saveWeeklyWeight} />}
      {goalContext && selectedWeekRange && <MealGoalDialog context={goalContext} weekRange={selectedWeekRange} busy={isRegenerating}
        error={error} onClose={closeGoalDialog} onConfirm={(goal, adjustment) => void confirmGeneration(goal, adjustment)} />}
      {(tdee || targetCalories || goalWeightKg) && <div className="mt-3 grid gap-2 rounded-xl border border-[#D9E6DC] bg-[#EDF4ED] px-3 py-2 text-xs text-[#07241A] sm:grid-cols-3">
        <p><span className="text-xs text-[#727974]">TDEE ước lượng</span><strong className="block">{tdee ? `~ ${Math.round(tdee)} kcal/ngày` : "Cần hoàn thiện hồ sơ"}</strong></p>
        <p><span className="text-xs text-[#727974]">Mục tiêu thực đơn</span><strong className="block">{targetCalories ? `~ ${Math.round(targetCalories)} kcal/ngày` : "Cần hoàn thiện hồ sơ"}</strong><span className="text-xs">{nutritionGoal === "LOSE" ? `Giảm ${calorieAdjustment} kcal/ngày` : nutritionGoal === "GAIN" ? `Tăng ${calorieAdjustment} kcal/ngày` : "Duy trì cân nặng"}</span></p>
        <p><span className="text-xs text-[#727974]">Mục tiêu cân nặng</span><strong className="block">{goalWeightKg ? `${goalWeightKg} kg` : "Chưa thiết lập"}</strong>{estimatedWeeksToGoal ? <span className="text-xs">~ {estimatedWeeksToGoal} tuần để {nutritionGoal === "LOSE" ? "giảm" : "tăng"} đến mục tiêu (ước lượng)</span> : goalWeightKg ? <span className="text-xs">Cần hoàn thiện hồ sơ để ước tính thời gian</span> : null}</p>
      </div>}
      {/* ── Main Two-Column Layout ─────────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
        {/* =============================================================== */}
        {/* Left Column: Profile & Allergies (4 cols)      */}
        {/* =============================================================== */}
        <div className="space-y-4 lg:col-span-4">
      {inputProblems.length > 0 && <div role="alert" className="vm-feedback rounded-2xl border border-[#E6CFBB] bg-[#FFF8F0] p-3">
        <h2 className="text-sm font-medium text-[#754624]">Cập nhật đầu vào trước khi tạo thực đơn</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#754624]">{inputProblems.map(problem => <li key={problem}>{problem}</li>)}</ul>
        {profileProblems.length > 0 && <Link href="/profile" className="vm-button mt-3 inline-block text-sm font-medium text-[#254B38] underline underline-offset-4">Cập nhật hồ sơ sức khỏe →</Link>}
        {inputProblems.includes("Tải lại danh sách dị ứng trước khi tạo thực đơn") && <button type="button" onClick={retryAllergens} className="vm-button mt-3 text-sm text-[#254B38] underline">Tải lại danh sách dị ứng</button>}
        {inputProblems.includes("Thêm ít nhất một nguyên liệu sẵn có") && <a href="#meal-pantry" className="vm-button ml-4 mt-3 inline-block text-sm font-medium text-[#254B38] underline underline-offset-4">Thêm nguyên liệu →</a>}
      </div>}



          {/* Card 1: User Profile & Goals */}
          <div className="rounded-3xl bg-white p-5 border border-[#EFEEEB] shadow-xs space-y-5">
            {/* User Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#07241A] font-serif text-lg font-bold text-white shadow-xs">
                  {profileName.slice(0, 1)}
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[#07241A]">
                    {profileName}
                  </h3>
                  <p className="text-[11px] text-[#727974]">{dietName}</p>
                </div>
              </div>
              <span className="rounded-full bg-[#FDE8E4] px-2.5 py-0.5 text-[10px] font-bold text-[#99462A]">{bmiCategory}</span>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#FBF9F6] p-3.5 border border-[#EFEEEB]">
              <div>
                <span className="text-[11px] font-medium text-[#727974]"><UiText text={"Nhịp cơ thể"} /></span>
                <p className="mt-0.5 text-xs font-bold text-[#07241A]">
                  {bmi ?? ui("Not available")}
                </p>
              </div>
              <div>
                <span className="text-[11px] font-medium text-[#727974]">BMI</span>
                <p className="mt-0.5 text-xs font-bold text-[#99462A]">{bmiCategory}</p>
              </div>
            </div>

            {/* Avoiding Allergens */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold tracking-wider text-[11px] text-[#727974] uppercase"><UiText text={"TRÁNH CHẤT GÂY DỊ ỨNG"} /></span>
                <button
                  type="button"
                  disabled={isRegenerating || allergenStatus !== "ready"}
                  onClick={() => setShowAddAllergen(!showAddAllergen)}
                  className="font-semibold text-xs text-[#07241A] hover:text-[#1E3A2F] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                ><UiText text={"+ Thêm"} /></button>
              </div>

              {allergenStatus === "loading" && <p role="status" className="text-xs text-[#727974]">{t("Loading allergens…", "Đang tải danh sách dị ứng…")}</p>}
              {allergenStatus === "error" && <div role="alert" className="text-xs text-red-700">
                <p>{t("Could not load the allergen catalog or your saved selections. Please sign in and try again.", "Không thể tải danh mục dị ứng hoặc lựa chọn đã lưu. Vui lòng đăng nhập và thử lại.")}</p>
                <button type="button" onClick={retryAllergens} className="mt-2 underline">{t("Retry", "Thử lại")}</button>
              </div>}
              {showAddAllergen && allergenStatus === "ready" && (
                <form noValidate onSubmit={handleAddAllergen} className="space-y-2 pt-1">
                  <label htmlFor="meal-planner-allergen" className="block text-xs text-[#424844]">{t("Choose an allergen", "Chọn chất gây dị ứng")}</label>
                  <div className="flex flex-wrap gap-2">
                    <select id="meal-planner-allergen" name="allergen" value={newAllergen}
                      onChange={event => setNewAllergen(event.target.value)}
                      disabled={isRegenerating || availableAllergens.length === 0}
                      aria-invalid={allergenError === "selection"}
                      aria-describedby={allergenError ? "meal-planner-allergen-error" : undefined}
                      className="min-w-0 flex-1 rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 text-xs outline-none focus:border-[#254B38] aria-invalid:border-red-600 disabled:opacity-50" autoFocus>
                      <option value="">{t("Select an allergen…", "Chọn chất gây dị ứng…")}</option>
                      {availableAllergens.map(item => <option key={item.allergenId} value={item.allergenId}><UiText text={item.name} /></option>)}
                    </select>
                    <button type="submit" disabled={isRegenerating || availableAllergens.length === 0}
                      className="rounded-xl bg-[#07241A] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">
                      {isRegenerating ? t("Saving…", "Đang lưu…") : t("Save", "Lưu")}
                    </button>
                  </div>
                  {availableAllergens.length === 0 && <p className="text-xs text-[#727974]">{t("No more allergens available to add.", "Không còn chất gây dị ứng nào để thêm.")}</p>}
                </form>
              )}
              {allergenError && <p id="meal-planner-allergen-error" role="alert" className="text-xs text-red-700">
                {allergenError === "selection" ? t("Choose an allergen from the list before saving.", "Hãy chọn một chất gây dị ứng trong danh sách trước khi lưu.") : t("Could not save your allergies. Your saved selections are unchanged; please try again.", "Không thể lưu dị ứng. Lựa chọn đã lưu được giữ nguyên; vui lòng thử lại.")}
              </p>}

              {/* Chips */}
              <div className="flex flex-wrap gap-1.5">
                {allergenStatus === "ready" && allergens.map((alg) => (
                  <span
                    key={alg}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F3F0] px-3 py-1 text-xs text-[#424844] border border-[#EFEEEB]"
                  >
                    <span><UiText text={alg} /></span>
                    <button
                      type="button"
                      disabled={isRegenerating || allergenStatus !== "ready"}
                      onClick={() => handleRemoveAllergen(alg)}
                      className="text-[#727974] hover:text-red-600 transition"
                      aria-label={t(`Remove allergy ${alg}`, `Gỡ dị ứng ${alg}`)}
                      title={ui("Gỡ dị ứng")}
                    >
                      <ContentIcon name="close" width="1em" height="1em" className="inline-block shrink-0 align-[-0.125em]" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Link to Saved Recipes */}
            <Link
              href="/bookmarks"
              className="flex items-center justify-between rounded-2xl bg-[#E8F1EC] p-3 text-xs font-semibold text-[#07241A] transition hover:bg-[#D9E6DC]"
            >
              <div className="flex items-center gap-2">
                <span><ContentIcon name="bookmark" width="1em" height="1em" className="inline-block shrink-0 align-[-0.125em]" /></span>
                <span>{savedCount} {ui("Saved recipes")}</span>
              </div>
              <span>→</span>
            </Link>
          </div>

          <section id="meal-pantry" className="scroll-mt-24 rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-lg font-bold text-[#07241A]">Nguyên liệu sẵn có</h2>
              <span className="text-xs text-[#727974]">{pantryIngredients.length}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#727974]">Bạn đang có gì trong bếp? Chọn gợi ý hoặc nhập nguyên liệu, rồi nhấn Thêm để xác nhận.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {pantryIngredients.map(item => (
                <span key={item} className="inline-flex items-center gap-2 rounded-md border border-[#D9E6DC] bg-[#E8F1EC] px-3 py-1.5 text-xs text-[#07241A]">
                  {item}
                  <button type="button" disabled={isRegenerating} onClick={() => handleRemovePantry(item)} aria-label={`Xóa nguyên liệu ${item}`} title="Xóa nguyên liệu" className="text-[#59635C] hover:text-red-700 disabled:opacity-40">×</button>
                </span>
              ))}
            </div>
            <form onSubmit={handleAddPantry} className="mt-4 flex gap-2">
              <input id="pantry-ingredient-input" type="text" disabled={isRegenerating} value={newPantryItem} onChange={event => setNewPantryItem(event.target.value)} placeholder="Thêm nguyên liệu (ví dụ: sả)" aria-label="Tên nguyên liệu" className="min-w-0 flex-1 rounded-md border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 text-sm outline-none focus:border-[#1E3A2F] disabled:opacity-40" />
              <button type="submit" disabled={isRegenerating || !newPantryItem.trim()} className="rounded-md bg-[#07241A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Thêm</button>
            </form>
            <div className="mt-5 border-t border-[#EFEEEB] pt-4">
              <p className="mb-3 flex items-center gap-2 text-xs font-medium text-[#254B38]"><ContentIcon name="salad" width="18" height="18" />Gợi ý để bạn bắt đầu</p>
              <div className="flex flex-wrap gap-2">
                {["Cà rốt", "Bí đỏ", "Nấm", "Cải thìa", "Khoai lang", "Gạo", "Sả", "Cà chua"].filter(item => !pantryIngredients.some(selected => selected.toLocaleLowerCase("vi") === item.toLocaleLowerCase("vi"))).map(item => (
                  <button key={item} type="button" disabled={isRegenerating} onClick={() => { setNewPantryItem(item); document.getElementById("pantry-ingredient-input")?.focus(); }} className="vm-button rounded-full border border-[#D9E6DC] bg-[#F4F8F2] px-3 py-2 text-xs text-[#254B38] hover:bg-[#E2EEDD] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#254B38] disabled:opacity-40">+ {item}</button>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-[#727974]">Gợi ý chưa được thêm vào danh sách. Chỉ xác nhận nguyên liệu bạn có và phù hợp với dị ứng của mình.</p>
            </div>
          </section>
        </div>

        {/* =============================================================== */}
        {/* Right Column: Daily Plans & Cards (8 cols)                      */}
        {/* =============================================================== */}
        <div className="space-y-6 lg:col-span-8">
          {viewMode === "day" && !days.some((day, index) => (day.dayNumber ?? index + 1) === selectedDay) && <p role="status" className="rounded-xl border border-[#E5E7DF] bg-white p-5 text-sm">{t("No meals for this day.", "Chưa có món ăn cho ngày này.")}</p>}
          {days.map((day, dIdx) => (viewMode === "week" || (day.dayNumber ?? dIdx + 1) === selectedDay) && (
            <section key={day.dayName} id={`meal-day-${day.dayNumber ?? dIdx + 1}`} className="scroll-mt-24 space-y-3">
              {/* Day Header */}
              <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-2.5">
                <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <h2 className="font-serif text-xl font-bold text-[#07241A]">
                    {<UiText text={day.dayName} />}
                  </h2>
                  <span className="text-sm text-[#727974]">
                    {<UiText text={day.theme} />}
                  </span>
                </div>
                <span className="text-xs font-medium text-[#727974] flex items-center gap-1">
                  <span>⏱</span>
                  <span>{<UiText text={day.totalPrep} />}</span>
                </span>
              </div>

              {/* Meals list */}
              <div className="space-y-3">
                {day.meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="vm-meal-card flex min-w-0 flex-col gap-3 rounded-2xl bg-white p-3 sm:p-3.5 xl:flex-row xl:items-center xl:justify-between border border-[#EFEEEB] shadow-xs transition hover:border-[#1E3A2F]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {/* Dish Photo */}
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#EFEEEB]">
                        {meal.image ? <Image
                          src={meal.image}
                          alt={meal.title}
                          fill
                          className="object-cover"
                          unoptimized
                        /> : <span className="flex h-full items-center justify-center text-center text-[10px] text-[#727974]">Chưa có ảnh</span>}
                        <span className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.2 text-[9px] font-semibold text-white">
                          {<UiText text={meal.timeLabel} />}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#727974]">
                            {<UiText text={meal.slot} />}
                          </span>
                          <span className="text-xs text-[#727974]">·</span>
                          <span className="text-[11px] font-medium text-[#727974]">
                            {<UiText text={meal.durationCalories} />}
                          </span>
                          {meal.imageIsGenerated && <span className="text-[10px] text-[#99462A]">Ảnh AI minh họa</span>}
                          {meal.isSavedInCollection && (
                            <span className="rounded-full bg-[#FDE8E4] px-2 py-0.2 text-[10px] font-semibold text-[#99462A]"><UiText text={"Đã lưu vào bộ sưu tập"} /></span>
                          )}
                        </div>

                        <MealImageStatus status={meal.imageGenerationStatus} error={meal.imageGenerationError} compact />
                        <h3 className="line-clamp-2 font-serif text-base font-bold text-[#07241A]">
                          {<UiText text={meal.title} />}
                        </h3>
                        <p className="text-xs text-[#727974] line-clamp-1 max-w-md">
                          {<UiText text={meal.description} />}
                        </p>
                      </div>
                    </div>

                    {/* Meal actions */}
                    <div className="flex shrink-0 flex-wrap items-center gap-2 self-end xl:self-center">
                      {planId && meal.mealPlanMealId && <ImageManager
                        label={meal.image ? t("Change image", "Đổi ảnh") : t("Add image", "Thêm ảnh")}
                        imageUrl={meal.image} disabled={isRegenerating}
                        onUpload={file => uploadMealImage(planId, meal.mealPlanMealId!, file)}
                        onDelete={() => deleteMealImage(planId, meal.mealPlanMealId!)}
                        onGenerate={style => generateMealImage(planId, meal.mealPlanMealId!, style)}
                        onApplied={result => applyMealImage(meal.mealPlanMealId!, result)}
                        onRefresh={refreshMealImages} onBusyChange={setImageBusy} />}
                      <button
                        type="button"
                        onClick={() => viewMeal(meal)}
                        className="rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-1.5 text-xs font-semibold text-[#07241A] hover:bg-white hover:shadow-xs transition cursor-pointer"
                      ><UiText text={"Xem công thức"} /></button>
                      <button
                        type="button"
                        disabled={isRegenerating}
                        onClick={() => openMealPicker((day.dayNumber ?? dIdx + 1) - 1, meal)}
                        className="rounded-xl border border-[#D9E6DC] bg-[#EDF4ED] px-3 py-1.5 text-xs font-semibold text-[#173C2D] transition hover:bg-[#E1EEE1] disabled:cursor-not-allowed disabled:opacity-50"
                      >Chọn món</button>
                      <button
                        type="button"
                        disabled={isRegenerating} onClick={() => handleReplaceMeal((day.dayNumber ?? dIdx + 1) - 1, meal.id, meal.slot)}
                        title={t("Replace meal", "Thay món")}
                        className="flex items-center gap-1 rounded-xl bg-white border border-[#EFEEEB] px-3 py-1.5 text-xs font-semibold text-[#727974] hover:text-[#07241A] hover:bg-[#F5F3F0] transition disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span><ContentIcon name="refresh" width="1em" height="1em" className="inline-block shrink-0 align-[-0.125em]" /></span>
                        <span><UiText text={"Thay món"} /></span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}


        </div>
      </div>

      {mealPicker && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => !isRegenerating && setMealPicker(null)}>
        <div role="dialog" aria-modal="true" aria-labelledby="meal-picker-title" className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
          <div className="border-b border-[#EFEEEB] px-6 py-5">
            <div className="flex items-start justify-between gap-4"><div><h2 id="meal-picker-title" className="font-serif text-xl font-bold text-[#07241A]">Chọn món thay thế</h2><p className="mt-1 text-xs leading-5 text-[#647068]">Chỉ hiển thị món phù hợp với kiểu ăn chay, dị ứng và nguyên liệu hiện có của bạn.</p></div><button type="button" onClick={() => setMealPicker(null)} className="rounded-lg p-2 text-[#727974] hover:bg-[#F5F3F0]" aria-label="Đóng">×</button></div>
            <input autoFocus value={pickerQuery} onChange={(event) => setPickerQuery(event.target.value)} placeholder="Tìm món muốn ăn..." className="mt-4 h-11 w-full rounded-xl border border-[#D9E6DC] bg-[#FBF9F6] px-4 text-sm outline-none transition focus:border-[#1E3A2F] focus:ring-2 focus:ring-[#1E3A2F]/10" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {pickerLoading ? <p className="p-4 text-sm text-[#647068]">Đang tìm món phù hợp...</p> : pickerOptions.length === 0 ? <p className="p-4 text-sm text-[#647068]">Không tìm thấy món phù hợp với từ khóa này.</p> : <div className="space-y-2">{pickerOptions.map(option => <button key={option.recipeId} type="button" disabled={isRegenerating} onClick={() => void handleReplaceMeal(mealPicker.dayIndex, mealPicker.meal.id, mealPicker.meal.slot, option.recipeId).then(success => { if (success) setMealPicker(null); })} className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[#E5E7DF] p-4 text-left transition hover:border-[#9AB59A] hover:bg-[#F6FAF5] disabled:opacity-50"><span><strong className="block text-sm text-[#07241A]">{option.recipeName}</strong><span className="mt-1 block text-xs text-[#727974]">{[option.prepMinutes && option.cookMinutes ? `${option.prepMinutes + option.cookMinutes} phút` : option.prepMinutes ? `${option.prepMinutes} phút` : "", `~ ${Math.round(option.caloriesPerServing)} kcal/khẩu phần`].filter(Boolean).join(" · ")}</span></span><span className="shrink-0 rounded-lg bg-[#173C2D] px-3 py-2 text-xs font-semibold text-white">Chọn</span></button>)}</div>}
          </div>
          <div className="border-t border-[#EFEEEB] px-6 py-4 text-right"><button type="button" onClick={() => setMealPicker(null)} className="rounded-xl px-4 py-2 text-sm font-semibold text-[#424844] hover:bg-[#F5F3F0]">Hủy</button></div>
        </div>
      </div>}

      {showDeleteConfirm && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={() => !isRegenerating && setShowDeleteConfirm(false)}>
        <div role="dialog" aria-modal="true" aria-labelledby="delete-meal-plan-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
          <h2 id="delete-meal-plan-title" className="font-serif text-xl font-bold text-[#07241A]">Xóa thực đơn này?</h2>
          <p className="mt-3 text-sm leading-6 text-[#424844]">Toàn bộ 21 bữa trong thực đơn hiện tại sẽ bị xóa. Thao tác này không ảnh hưởng công thức, hồ sơ, dị ứng hoặc món đã lưu của bạn.</p>
          <div className="mt-6 flex justify-end gap-3 border-t border-[#EFEEEB] pt-5">
            <button type="button" disabled={isRegenerating} onClick={() => setShowDeleteConfirm(false)} className="rounded-xl border border-[#E5E7DF] px-4 py-2.5 text-sm font-semibold text-[#424844] hover:bg-[#F5F3F0] disabled:opacity-50">Giữ lại</button>
            <button type="button" disabled={isRegenerating} onClick={() => void handleDeletePlan().then(() => setShowDeleteConfirm(false))} className="rounded-xl bg-[#A24635] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#883727] disabled:cursor-not-allowed disabled:opacity-50">{isRegenerating ? "Đang xóa…" : "Xóa thực đơn"}</button>
          </div>
        </div>
      </div>}

      {/* ── View Recipe Modal ───────────────────────────────────────────── */}
      {selectedMealForView && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in"
          onClick={() => { if (!isRegenerating) setSelectedMealForView(null); }}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Image Header */}
            <div className="relative aspect-video w-full bg-[#EFEEEB]">
              {selectedMealForView.image ? <Image
                src={selectedMealForView.image}
                alt={selectedMealForView.title}
                fill
                className="object-cover"
                unoptimized
              /> : <div className="flex h-full items-center justify-center text-sm text-[#727974]">Chưa có ảnh</div>}
              <button aria-label={t("Close", "Đóng")}
                type="button"
                onClick={() => { if (!isRegenerating) setSelectedMealForView(null); }}
                className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:bg-white"
              >
                <ContentIcon name="close" width="1em" height="1em" className="inline-block shrink-0 align-[-0.125em]" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#99462A]">
                  {<UiText text={selectedMealForView.slot} />} · {<UiText text={selectedMealForView.durationCalories} />}
                </span>
                <h3 className="mt-1 font-serif text-xl font-bold text-[#07241A]">
                  {<UiText text={selectedMealForView.title} />}
                </h3>
                <p className="mt-1 text-xs text-[#727974] leading-relaxed">
                  {<UiText text={selectedMealForView.description} />}
                </p>
              </div>

              <MealImageStatus status={selectedMealForView.imageGenerationStatus} error={selectedMealForView.imageGenerationError} />
              {selectedMealForView.imageIsGenerated && <p className="text-xs text-[#99462A]">Ảnh AI minh họa</p>}
              {planId && selectedMealForView.mealPlanMealId && <ImageManager key={`${planId}:${selectedMealForView.mealPlanMealId}`} label="Đổi ảnh món ăn" imageUrl={selectedMealForView.image} disabled={isRegenerating}
                onUpload={file => uploadMealImage(planId, selectedMealForView.mealPlanMealId!, file)}
                onDelete={() => deleteMealImage(planId, selectedMealForView.mealPlanMealId!)}
                onGenerate={style => generateMealImage(planId, selectedMealForView.mealPlanMealId!, style)}
                onApplied={result => applyMealImage(selectedMealForView.mealPlanMealId!, result)} onRefresh={refreshMealImages} onBusyChange={setImageBusy} />}

              {/* Ingredients */}
              <div className="space-y-1.5 border-t border-[#EFEEEB] pt-3">
                <h4 className="text-xs font-bold text-[#07241A]"><><ContentIcon name="salad" width="1em" height="1em" className="inline-block shrink-0 align-[-0.125em]" /> <UiText text={"Nguyên liệu cần chuẩn bị:"} /></></h4>
                <ul className="list-disc pl-5 text-xs text-[#424844] space-y-1">
                  {selectedMealForView.ingredients.map((ing, i) => (
                    <li key={i}>{<UiText text={ing} />}</li>
                  ))}
                </ul>
              </div>

              {/* Steps */}
              <div className="space-y-1.5 border-t border-[#EFEEEB] pt-3">
                <h4 className="text-xs font-bold text-[#07241A]"><><ContentIcon name="pot" width="1em" height="1em" className="inline-block shrink-0 align-[-0.125em]" /> <UiText text={"Hướng dẫn chế biến:"} /></></h4>
                <ol className="list-decimal pl-5 text-xs text-[#424844] space-y-1.5">
                  {selectedMealForView.steps.map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ol>
              </div>

              <div className="pt-2 border-t border-[#EFEEEB] flex justify-end">
                <button
                  type="button"
                  onClick={() => { if (!isRegenerating) setSelectedMealForView(null); }}
                  className="rounded-xl bg-[#07241A] px-5 py-2 text-xs font-semibold text-white hover:bg-[#1E3A2F]"
                ><UiText text={"Đóng"} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
