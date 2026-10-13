"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getRecipeById, type RecipeResponse } from "@/lib/recipe-api";
import { generateMealPlan, getMealPlans, regenerateMealPlan, replaceMeal, type MealPlanMealResponse, type MealPlanResponse } from "@/lib/meal-plan-api";
import { getDietTypes, getProfile, getUserAllergens, type DietTypeItem } from "@/lib/profile-api";
import { dietTypeAvoidsText, formatDietTypeName } from "@/lib/diet-type-display";
import { useLanguage } from "@/context/LanguageContext";
import { localizeRecipeTitle, localizeText, localizeIngredient, localizeAmount } from "@/lib/localized-content";

const mealLabels: Record<string, { en: string; vi: string }> = {
  BREAKFAST: { en: "Breakfast", vi: "Bữa sáng" },
  LUNCH: { en: "Lunch", vi: "Bữa trưa" },
  DINNER: { en: "Dinner", vi: "Bữa tối" },
};

export default function MealPlannerView() {
  const { language, locale, t } = useLanguage();
  const [plans, setPlans] = useState<MealPlanResponse[]>([]);
  const [activePlan, setActivePlan] = useState<MealPlanResponse | null>(null);
  const [availableIngredients, setAvailableIngredients] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [allergens, setAllergens] = useState<string[]>([]);
  const [dietTypes, setDietTypes] = useState<DietTypeItem[]>([]);
  const [profileDietTypeId, setProfileDietTypeId] = useState<number | null>(null);
  const [profileName, setProfileName] = useState("You");
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeResponse | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<MealPlanMealResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const mealLabel = (mealType: string) => {
    const label = mealLabels[mealType];
    if (!label) return mealType;
    return language === "vi" ? label.vi : label.en;
  };

  async function load() {
    setLoading(true);
    try {
      const [nextPlans, profile, allergyCatalog, dietCatalog] = await Promise.all([
        getMealPlans(),
        getProfile().catch(() => null),
        getUserAllergens().catch(() => []),
        getDietTypes().catch(() => []),
      ]);
      setPlans(nextPlans);
      setActivePlan(nextPlans[0] || null);
      if (profile?.fullName) setProfileName(profile.fullName);
      setProfileDietTypeId(profile?.dietTypeId ?? null);
      setAllergens(allergyCatalog.map((item) => item.name));
      setDietTypes(dietCatalog);
      setMessage(null);
    } catch {
      setMessage("Không thể tải meal planner. Hãy đăng nhập và kiểm tra backend.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const currentDietType = useMemo(
    () => dietTypes.find((item) => item.dietTypeId === profileDietTypeId) ?? null,
    [dietTypes, profileDietTypeId],
  );

  const mealsByDay = useMemo(() => {
    const groups = new Map<number, MealPlanMealResponse[]>();
    for (const meal of activePlan?.meals || []) groups.set(meal.dayNumber, [...(groups.get(meal.dayNumber) || []), meal]);
    return Array.from(groups.entries()).sort(([a], [b]) => a - b);
  }, [activePlan]);

  async function handleGenerate(event: FormEvent) {
    event.preventDefault();
    setWorking(true);
    try {
      const plan = await generateMealPlan({ startDate: startDate || null, availableIngredients: availableIngredients.trim() || null });
      setPlans((current) => [plan, ...current.filter((item) => item.mealPlanId !== plan.mealPlanId)]);
      setActivePlan(plan);
      setMessage(t("Created a 7-day meal plan from backend data.", "Đã tạo meal plan 7 ngày từ dữ liệu backend."));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể tạo meal plan.");
    } finally {
      setWorking(false);
    }
  }

  async function handleRegenerate() {
    if (!activePlan) return;
    setWorking(true);
    try {
      const plan = await regenerateMealPlan(activePlan.mealPlanId, { startDate: startDate || activePlan.startDate, availableIngredients: availableIngredients.trim() || null });
      setPlans((current) => [plan, ...current.filter((item) => item.mealPlanId !== activePlan.mealPlanId && item.mealPlanId !== plan.mealPlanId)]);
      setActivePlan(plan);
      setMessage(t("Regenerated the meal plan.", "Đã tạo lại meal plan."));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể tạo lại meal plan.");
    } finally {
      setWorking(false);
    }
  }

  async function handleReplace(meal: MealPlanMealResponse) {
    if (!activePlan) return;
    setWorking(true);
    try {
      const plan = await replaceMeal(activePlan.mealPlanId, meal.mealPlanMealId);
      setPlans((current) => current.map((item) => item.mealPlanId === plan.mealPlanId ? plan : item));
      setActivePlan(plan);
      setMessage(t(`Replaced ${mealLabel(meal.mealType)}.`, `Đã đổi món ${mealLabel(meal.mealType)}.`));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không thể đổi món.");
    } finally {
      setWorking(false);
    }
  }

  async function openRecipe(meal: MealPlanMealResponse) {
    setSelectedMeal(meal);
    setSelectedRecipe(null);
    try { setSelectedRecipe(await getRecipeById(meal.recipeId)); } catch { setMessage(t("Could not load recipe details.", "Không thể tải chi tiết công thức.")); }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {message && <div className="mb-6 rounded-2xl border border-[#D9E6DC] bg-white px-5 py-3 text-sm text-[#254B38] shadow-sm">{message}</div>}

      <div className="flex flex-col gap-4 border-b border-[#EFEEEB] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#727974]"><span className="h-2 w-2 rounded-full bg-[#16a34a]" /><span className="rounded-full bg-[#EFEEEB] px-3 py-0.5 text-[11px] font-bold text-[#07241A]">{t("Backend meal planner", "Thực đơn từ backend")}</span></div>
          <h1 className="mt-2.5 font-serif text-3xl font-bold tracking-tight text-[#07241A] sm:text-5xl">{t("Plan My Week", "Lên thực đơn tuần")}</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[#424844]">{t("Real API meal plans filtered by vegetarian type, allergies and published recipes.", "Meal plan thật từ API, lọc theo kiểu ăn chay, dị ứng và recipe đang publish trong hệ thống.")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRegenerate} disabled={!activePlan || working} className="rounded-xl border border-[#EFEEEB] bg-white px-4 py-2.5 text-xs font-semibold text-[#07241A] shadow-sm hover:bg-[#F5F3F0] disabled:opacity-40">{working ? t("Working...", "Đang xử lý...") : t("Regenerate Plan", "Tạo lại thực đơn")}</button>
          <button onClick={() => window.print()} className="rounded-xl border border-[#EFEEEB] bg-white px-4 py-2.5 text-xs font-semibold text-[#07241A] shadow-sm hover:bg-[#F5F3F0]">{t("Print", "In")}</button>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <aside className="space-y-6 lg:col-span-4">
          <section className="rounded-3xl border border-[#EFEEEB] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#07241A] font-serif text-lg font-bold text-white">{profileName.slice(0, 1).toUpperCase()}</div><div><h3 className="font-semibold text-sm text-[#07241A]">{profileName}</h3><p className="text-[11px] text-[#727974]">{t("Personalized vegetarian planning", "Lập thực đơn chay cá nhân hóa")}</p></div></div>
            <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-[#EFEEEB] bg-[#FBF9F6] p-3.5"><div><span className="text-[11px] text-[#727974]">BMI</span><p className="font-bold text-[#07241A]">{activePlan?.bmi ?? t("Not available", "Chưa có")}</p></div><div><span className="text-[11px] text-[#727974]">{t("Category", "Phân loại")}</span><p className="font-bold text-[#99462A]">{localizeText(activePlan?.bmiCategory, language) || t("Not available", "Chưa có")}</p></div></div>
            <div className="mt-5 rounded-2xl border border-[#EFEEEB] bg-[#FBF9F6] p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#727974]">{t("Vegetarian type", "Kiểu ăn chay")}</p>
              <p className="mt-1 text-sm font-bold text-[#07241A]">{currentDietType ? formatDietTypeName(currentDietType.name, language) : t("Not selected", "Chưa chọn")}</p>
              <p className="mt-1 text-xs leading-5 text-[#727974]">{dietTypeAvoidsText(currentDietType, language)}</p>
            </div>
            <div className="mt-5"><p className="text-[11px] font-bold uppercase tracking-wider text-[#727974]">{t("Avoiding allergens", "Tránh dị ứng")}</p><div className="mt-2 flex flex-wrap gap-1.5">{allergens.length ? allergens.map((item) => <span key={item} className="rounded-full border border-[#EFEEEB] bg-[#F5F3F0] px-3 py-1 text-xs text-[#424844]">{localizeIngredient(item, language)}</span>) : <span className="text-xs text-[#727974]">{t("No allergen data loaded", "Chưa có dữ liệu dị ứng")}</span>}</div></div>
          </section>

          <form onSubmit={handleGenerate} className="rounded-3xl border border-[#EFEEEB] bg-white p-6 shadow-sm">
            <h3 className="font-serif text-xl font-bold text-[#07241A]">{t("Generate from backend", "Tạo từ backend")}</h3>
            <label className="mt-4 block text-xs font-semibold text-[#424844]">{t("Start date", "Ngày bắt đầu")}<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-2 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 text-sm outline-none" /></label>
            <label className="mt-4 block text-xs font-semibold text-[#424844]">{t("Available ingredients", "Nguyên liệu có sẵn")}<textarea value={availableIngredients} onChange={(e) => setAvailableIngredients(e.target.value)} rows={4} placeholder={t("tofu, mushroom, tomato...", "đậu hũ, nấm, cà chua...")} className="mt-2 w-full resize-y rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 text-sm outline-none" /></label>
            <button disabled={working} className="mt-4 w-full rounded-xl bg-[#07241A] px-4 py-3 text-xs font-semibold text-white hover:bg-[#1E3A2F] disabled:opacity-40">{working ? t("Generating...", "Đang tạo...") : t("Generate My 7-Day Plan", "Tạo thực đơn 7 ngày")}</button>
          </form>
        </aside>

        <section className="space-y-7 lg:col-span-8">
          {loading ? <div className="rounded-3xl bg-white p-10 text-center text-sm text-[#727974]">{t("Loading meal plan...", "Đang tải meal plan...")}</div> : !activePlan ? <div className="rounded-3xl border border-dashed border-[#CCD5C6] bg-white/70 p-10 text-center"><h2 className="font-serif text-3xl text-[#07241A]">{t("No meal plan yet", "Chưa có meal plan")}</h2><p className="mt-3 text-sm text-[#727974]">{t("Enter ingredients on the left and generate a real backend plan.", "Nhập nguyên liệu bên trái rồi bấm generate để lấy plan thật từ backend.")}</p></div> : mealsByDay.map(([day, meals]) => (
            <section key={day} className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-2.5"><div className="flex items-baseline gap-2.5"><h2 className="font-serif text-2xl font-bold text-[#07241A]">{t("Day", "Ngày")} {day}</h2><span className="text-xs text-[#727974]">{new Date(activePlan.startDate).toLocaleDateString(locale)}</span></div><span className="text-xs text-[#727974]">{meals.length} {t("meals", "bữa")}</span></div>
              <div className="space-y-3">{meals.map((meal) => <div key={meal.mealPlanMealId} className="flex flex-col justify-between gap-4 rounded-3xl border border-[#EFEEEB] bg-white p-5 shadow-sm transition hover:border-[#1E3A2F] sm:flex-row sm:items-center"><div><span className="text-[10px] font-bold uppercase tracking-wider text-[#727974]">{mealLabel(meal.mealType)}</span><h3 className="mt-1 font-serif text-xl font-bold text-[#07241A]">{localizeRecipeTitle(meal.recipeName, language)}</h3><p className="mt-1 text-xs text-[#727974]">{t("Recipe", "Công thức")} #{meal.recipeId}</p></div><div className="flex gap-2 self-end sm:self-center"><button onClick={() => openRecipe(meal)} className="rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-1.5 text-xs font-semibold text-[#07241A] hover:bg-white">{t("View Recipe", "Xem công thức")}</button><button onClick={() => handleReplace(meal)} disabled={working} className="rounded-xl border border-[#EFEEEB] bg-white px-3 py-1.5 text-xs font-semibold text-[#727974] hover:bg-[#F5F3F0] hover:text-[#07241A] disabled:opacity-40">{t("Replace", "Đổi món")}</button></div></div>)}</div>
            </section>
          ))}
        </section>
      </div>

      {selectedMeal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => { setSelectedMeal(null); setSelectedRecipe(null); }}><div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><span className="text-[11px] font-bold uppercase tracking-wider text-[#99462A]">{mealLabel(selectedMeal.mealType)}</span><h3 className="mt-1 font-serif text-3xl font-bold text-[#07241A]">{localizeRecipeTitle(selectedRecipe?.recipeName || selectedMeal.recipeName, language)}</h3></div><button onClick={() => { setSelectedMeal(null); setSelectedRecipe(null); }} className="rounded-full bg-[#F5F3F0] px-3 py-1 text-sm">x</button></div>{!selectedRecipe ? <p className="mt-6 text-sm text-[#727974]">{t("Loading recipe...", "Đang tải công thức...")}</p> : <div className="mt-6 max-h-[70vh] overflow-y-auto"><p className="text-sm leading-7 text-[#727974]">{localizeText(selectedRecipe.content, language)}</p><h4 className="mt-5 text-sm font-bold text-[#07241A]">{t("Ingredients", "Nguyên liệu")}</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#424844]">{selectedRecipe.ingredients.map((item, index) => <li key={index}>{localizeAmount(item.amount, language)} {localizeIngredient(item.ingredientName, language)}</li>)}</ul><h4 className="mt-5 text-sm font-bold text-[#07241A]">{t("Steps", "Cách làm")}</h4><ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-[#424844]">{selectedRecipe.steps.map((step) => <li key={step.stepNumber}>{localizeText(step.instruction, language)}</li>)}</ol><div className="mt-6 flex justify-end"><Link href={`/view-detail/${selectedRecipe.postId}`} className="rounded-xl bg-[#07241A] px-5 py-2 text-xs font-semibold text-white">{t("Open post", "Mở bài viết")}</Link></div></div>}</div></div>}
    </div>
  );
}
