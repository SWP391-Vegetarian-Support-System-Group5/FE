"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getMediaUrl } from "@/lib/api";
import { generateMealPlan, getMealPlans, regenerateMealPlan, replaceMeal, MealPlanRequestError, type MealPlanResponse } from "@/lib/meal-plan-api";
import { getAllAllergens, getDietTypes, getProfile, getUserAllergens, updateUserAllergens, type BackendUserProfile, type DietTypeItem } from "@/lib/profile-api";
import { getBookmarks } from "@/lib/post-api";
import { getRecipeById, type RecipeResponse } from "@/lib/recipe-api";
import { formatDietTypeName } from "@/lib/diet-type-display";
import { localizeAmount, localizeIngredient, localizeRecipeTitle, localizeText } from "@/lib/localized-content";
import type { DayPlan, MealItem } from "./MealPlannerView";
import { initialMealPlanDate, mealPlanDay, parseMealPlanDate } from "@/lib/meal-plan-dates";

export function useMealPlanner() {
  const { t, language, locale } = useLanguage();
  const [plan, setPlan] = useState<MealPlanResponse | null>(null);
  const [profile, setProfile] = useState<BackendUserProfile | null>(null);
  const [diets, setDiets] = useState<DietTypeItem[]>([]);
  const [allergenCatalog, setAllergenCatalog] = useState<{ allergenId: number; name: string }[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<{ allergenId: number; name: string }[]>([]);
  const [newAllergen, setNewAllergen] = useState("");
  const [showAddAllergen, setShowAddAllergen] = useState(false);
  const [pantryIngredients, setPantryIngredients] = useState<string[]>([]);
  const [newPantryItem, setNewPantryItem] = useState("");
  const [recipeData, setRecipeData] = useState<Record<number, RecipeResponse>>({});
  const [selectedMealForView, setSelectedMealForView] = useState<MealItem | null>(null);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isRegenerating, setWorking] = useState(false);
  const [replacementLimitReached, setReplacementLimitReached] = useState(false);
  const [startDate, setStartDate] = useState(() => initialMealPlanDate());
  const lock = useRef(false);

  async function hydrateRecipes(value: MealPlanResponse | null) {
    if (!value) return;
    const ids = [...new Set(value.meals.map(meal => meal.recipeId))];
    const details = await Promise.all(ids.map(id => getRecipeById(id).then(recipe => [id, recipe] as const).catch(() => null)));
    setRecipeData(Object.fromEntries(details.filter((item): item is readonly [number, RecipeResponse] => item !== null)));
  }
  useEffect(() => {
    let active = true;
    Promise.all([getMealPlans(), getProfile(), getDietTypes(), getAllAllergens(), getUserAllergens(), getBookmarks()])
      .then(async ([plans, user, dietTypes, catalog, selected, bookmarks]) => {
        if (!active) return;
        setPlan(plans[0] || null); setProfile(user); setDiets(dietTypes);
        setAllergenCatalog(catalog); setSelectedAllergens(selected); setSavedIds(bookmarks.map(post => post.postId));
        await hydrateRecipes(plans[0] || null);
      }).catch(() => { if (active) setError("Could not load meal planner."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const days = useMemo<DayPlan[]>(() => {
    const grouped = new Map<number, MealItem[]>();
    for (const meal of plan?.meals || []) {
      const recipe = recipeData[meal.recipeId];
      const minutes = recipe ? (recipe.prepMinutes || 0) + (recipe.cookMinutes || 0) : null;
      const item: MealItem = {
        id: String(meal.mealPlanMealId), recipeId: meal.recipeId, mealPlanMealId: meal.mealPlanMealId,
        slot: meal.mealType as MealItem["slot"], timeLabel: meal.mealType,
        durationCalories: minutes ? `${minutes} ${t("mins", "phút")}` : "",
        title: localizeRecipeTitle(recipe?.recipeName || meal.recipeName, language),
        description: localizeText(recipe?.content, language), image: getMediaUrl(recipe?.thumbnailUrl),
        isSavedInCollection: savedIds.includes(meal.recipeId),
        ingredients: recipe?.ingredients.map(ingredient => `${localizeAmount(ingredient.amount, language)} ${localizeIngredient(ingredient.ingredientName, language)}`) || [],
        steps: recipe?.steps.map(step => localizeText(step.instruction, language)) || [],
      };
      grouped.set(meal.dayNumber, [...(grouped.get(meal.dayNumber) || []), item]);
    }
    return [...grouped.entries()].sort(([a], [b]) => a - b).map(([day, meals]) => {
      const date = mealPlanDay(plan!.startDate, day, locale);
      return { dayName: date.weekday, theme: `${t("Day", "Ngày")} ${day} - ${date.date}`, totalPrep: `${meals.length} ${t("meals", "bữa")}`, meals };
    });
  }, [plan, recipeData, language, locale, savedIds, t]);

  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setWorking(true); setError("");
    try { await action(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Could not update meal plan."); }
    finally { lock.current = false; setWorking(false); }
  }
  async function handleRegenerate() {
    await run(async () => {
      const parsedDate = parseMealPlanDate(startDate);
      if (!parsedDate) throw new Error(t("Enter a valid start date as dd/mm/yy (2000-2099).", "Nhập ngày bắt đầu hợp lệ theo dd/mm/yy (năm 2000–2099)."));
      const payload = { startDate: parsedDate, availableIngredients: pantryIngredients.join(", ") || null };
      const next = plan ? await regenerateMealPlan(plan.mealPlanId, payload) : await generateMealPlan(payload);
      setPlan(next); setReplacementLimitReached(false); await hydrateRecipes(next); setToastMessage(t("Meal plan saved.", "Đã lưu thực đơn."));
    });
  }
  async function handleReplaceMeal(_day: number, mealId: string, _slot: MealItem["slot"]) {
    if (!plan || replacementLimitReached) return;
    const meal = plan.meals.find(item => item.mealPlanMealId === Number(mealId));
    if (!meal || meal.dayNumber !== _day + 1 || meal.mealType !== _slot) return;
    await run(async () => {
      try {
        const next = await replaceMeal(plan.mealPlanId, Number(mealId));
        setPlan(next); await hydrateRecipes(next);
      } catch (failure) {
        if (failure instanceof MealPlanRequestError && failure.status === 429) {
          setReplacementLimitReached(true);
          return;
        }
        throw failure;
      }
    });
  }
  async function viewMeal(meal: MealItem) {
    if (!meal.recipeId) return;
    await run(async () => {
      const recipe = await getRecipeById(meal.recipeId!);
      setSelectedMealForView({ ...meal,
        ingredients: recipe.ingredients.map(item => `${localizeAmount(item.amount, language)} ${localizeIngredient(item.ingredientName, language)}`),
        steps: recipe.steps.map(step => localizeText(step.instruction, language)),
      });
    });
  }
  async function handleRemoveAllergen(name: string) {
    await run(async () => {
      const next = selectedAllergens.filter(item => item.name !== name);
      await updateUserAllergens(next.map(item => item.allergenId));
      setSelectedAllergens(next);
      setPlan(null); setSelectedMealForView(null);
      const plans = await getMealPlans();
      setPlan(plans[0] || null);
      await hydrateRecipes(plans[0] || null);
    });
  }
  async function handleAddAllergen(event: FormEvent) {
    event.preventDefault();
    const match = allergenCatalog.find(item => item.name.toLocaleLowerCase() === newAllergen.trim().toLocaleLowerCase());
    if (!match) { setError(t("Choose an allergen from your profile's catalog.", "Hãy chọn dị ứng có trong danh mục hồ sơ.")); return; }
    await run(async () => {
      const next = selectedAllergens.some(item => item.allergenId === match.allergenId) ? selectedAllergens : [...selectedAllergens, match];
      await updateUserAllergens(next.map(item => item.allergenId));
      setSelectedAllergens(next); setNewAllergen(""); setShowAddAllergen(false);
      setPlan(null); setSelectedMealForView(null);
      const plans = await getMealPlans();
      setPlan(plans[0] || null);
      await hydrateRecipes(plans[0] || null);
    });
  }
  function handleAddPantry(event: FormEvent) { event.preventDefault(); if (newPantryItem.trim()) setPantryIngredients(items => [...new Set([...items, newPantryItem.trim()])]); setNewPantryItem(""); }
  const currentDiet = diets.find(diet => diet.dietTypeId === profile?.dietTypeId);
  return {
    days, allergens: selectedAllergens.map(item => item.name), newAllergen, setNewAllergen, showAddAllergen, setShowAddAllergen,
    pantryIngredients, newPantryItem, setNewPantryItem, selectedMealForView, setSelectedMealForView,
    toastMessage, isRegenerating, replacementLimitReached, handleRemoveAllergen, handleAddAllergen,
    handleRemovePantry: (name: string) => setPantryIngredients(items => items.filter(item => item !== name)),
    handleAddPantry, handleReplaceMeal, handleRegenerate, viewMeal,
    profileName: profile?.fullName || t("You", "Bạn"), bmi: plan?.bmi ?? null,
    bmiCategory: localizeText(plan?.bmiCategory, language), dietName: formatDietTypeName(currentDiet?.name, language), savedCount: savedIds.length,
    loading, error: localizeText(error, language), startDate, setStartDate,
  };
}
