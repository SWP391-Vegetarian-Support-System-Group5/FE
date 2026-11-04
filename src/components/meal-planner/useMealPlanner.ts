"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getStoredToken } from "@/lib/auth";
import { useMealImagePolling, hasPendingImages } from "./useMealImagePolling";
import type { ImageMutationResponse } from "@/lib/image-api";
import { getMediaUrl } from "@/lib/api";
import { generateMealPlan, getMealPlans, getMealPlan, regenerateMealPlan, replaceMeal, type MealPlanResponse } from "@/lib/meal-plan-api";
import { getAllAllergens, getDietTypes, getProfile, getUserAllergens, updateUserAllergens, type BackendUserProfile, type DietTypeItem } from "@/lib/profile-api";
import { getBookmarks } from "@/lib/post-api";
import { getRecipeById, type RecipeResponse } from "@/lib/recipe-api";
import { formatDietTypeName } from "@/lib/diet-type-display";
import { localizeAmount, localizeIngredient, localizeRecipeTitle, localizeText } from "@/lib/localized-content";
import type { DayPlan, MealItem } from "./MealPlannerView";
import { initialMealPlanDate, mealPlanDay, parseMealPlanDate } from "@/lib/meal-plan-dates";

export function useMealPlanner() {
  const { t, language, locale } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [plan, setPlan] = useState<MealPlanResponse | null>(null);
  const [planOwner, setPlanOwner] = useState<string | undefined>(undefined);
  const [profile, setProfile] = useState<BackendUserProfile | null>(null);
  const [diets, setDiets] = useState<DietTypeItem[]>([]);
  const [allergenCatalog, setAllergenCatalog] = useState<{ allergenId: number; name: string }[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<{ allergenId: number; name: string }[]>([]);
  const [newAllergen, setNewAllergen] = useState("");
  const [allergenStatus, setAllergenStatus] = useState<"loading" | "ready" | "error">("loading");
  const [allergenError, setAllergenError] = useState<"selection" | "save" | null>(null);
  const [allergenRevision, setAllergenRevision] = useState(0);
  const [allergenOwner, setAllergenOwner] = useState<string | null>(null);
  const allergensReady = !authLoading && allergenOwner === (user?.uid ?? "guest") && allergenStatus === "ready";
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
  const [startDate, setStartDate] = useState(() => initialMealPlanDate());
  const lock = useRef(false);

  const applyPolledPlan = useCallback((fresh: MealPlanResponse) => {
    if (lock.current) return;
    setPlan(current => current?.mealPlanId === fresh.mealPlanId ? fresh : current);
    setSelectedMealForView(current => {
      if (!current) return current;
      const meal = fresh.meals.find(item => item.mealPlanMealId === current.mealPlanMealId);
      if (!meal || meal.recipeId !== current.recipeId) return null;
      const recipe = recipeData[meal.recipeId];
      return { ...current, image: getMediaUrl(meal.imageUrl ?? recipe?.imageUrl ?? recipe?.thumbnailUrl),
        imageIsGenerated: meal.imageIsGenerated ?? false,
        imageGenerationStatus: meal.imageGenerationStatus, imageGenerationError: meal.imageGenerationError };
    });
  }, [recipeData]);
  const { imagePollingNotice, resumeImagePolling } = useMealImagePolling({
    plan, owner: user?.uid, enabled: !authLoading && !!user && planOwner === user.uid && !!getStoredToken(), busy: isRegenerating, onUpdate: applyPolledPlan,
  });

  async function hydrateRecipes(value: MealPlanResponse | null) {
    if (!value) return;
    const ids = [...new Set(value.meals.map(meal => meal.recipeId))];
    const details = await Promise.all(ids.map(id => getRecipeById(id).then(recipe => [id, recipe] as const).catch(() => null)));
    setRecipeData(Object.fromEntries(details.filter((item): item is readonly [number, RecipeResponse] => item !== null)));
  }
  useEffect(() => {
    if (authLoading) return;
    let active = true;
    Promise.allSettled([getMealPlans(), getProfile(), getDietTypes(), getBookmarks()])
      .then(async ([plans, profileResult, dietTypes, bookmarks]) => {
        if (!active) return;
        if (profileResult.status === "fulfilled") setProfile(profileResult.value);
        if (dietTypes.status === "fulfilled") setDiets(dietTypes.value);
        if (bookmarks.status === "fulfilled") setSavedIds(bookmarks.value.map(post => post.postId));
        if ([plans, profileResult, dietTypes, bookmarks].some(result => result.status === "rejected")) setError("Could not load meal planner.");
        if (plans.status === "fulfilled") {
          setPlanOwner(user?.uid);
          setPlan(plans.value[0] || null);
          await hydrateRecipes(plans.value[0] || null);
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [authLoading, user?.uid]);
  useEffect(() => {
    if (authLoading) return;
    let active = true;
    Promise.allSettled([getAllAllergens(), getUserAllergens()]).then(([catalog, selected]) => {
      if (!active) return;
      if (catalog.status === "fulfilled") setAllergenCatalog(catalog.value);
      if (selected.status === "fulfilled") setSelectedAllergens(selected.value);
      setAllergenOwner(user?.uid ?? "guest");
      setAllergenStatus(catalog.status === "fulfilled" && selected.status === "fulfilled" ? "ready" : "error");
    });
    return () => { active = false; };
  }, [authLoading, user?.uid, allergenRevision]);
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
        description: localizeText(recipe?.content, language), image: getMediaUrl(meal.imageUrl ?? recipe?.imageUrl ?? recipe?.thumbnailUrl),
        imageIsGenerated: meal.imageIsGenerated ?? false,
        imageGenerationStatus: meal.imageGenerationStatus, imageGenerationError: meal.imageGenerationError,
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
      setPlan(next); setPlanOwner(user?.uid); await hydrateRecipes(next); setToastMessage(t("Meal plan saved.", "Đã lưu thực đơn."));
    });
  }
  async function handleReplaceMeal(_day: number, mealId: string, _slot: MealItem["slot"]) {
    if (!plan) return;
    const meal = plan.meals.find(item => item.mealPlanMealId === Number(mealId));
    if (!meal || meal.dayNumber !== _day + 1 || meal.mealType !== _slot) return;
    await run(async () => {
      const next = await replaceMeal(plan.mealPlanId, Number(mealId));
      setPlan(next); await hydrateRecipes(next);
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
    if (!allergensReady) return;
    await run(async () => {
      const next = selectedAllergens.filter(item => item.name !== name);
      try { await updateUserAllergens(next.map(item => item.allergenId)); }
      catch (failure) { setAllergenError("save"); throw failure; }
      setSelectedAllergens(next);
      setPlan(null); setSelectedMealForView(null);
      const plans = await getMealPlans();
      setPlan(plans[0] || null);
      await hydrateRecipes(plans[0] || null);
    });
  }
  async function handleAddAllergen(event: FormEvent) {
    event.preventDefault();
    if (!allergensReady) return;
    const match = allergenCatalog.find(item => String(item.allergenId) === newAllergen);
    if (!match) { setAllergenError("selection"); return; }
    setAllergenError(null);
    await run(async () => {
      const next = selectedAllergens.some(item => item.allergenId === match.allergenId) ? selectedAllergens : [...selectedAllergens, match];
      try { await updateUserAllergens(next.map(item => item.allergenId)); }
      catch (failure) { setAllergenError("save"); throw failure; }
      setSelectedAllergens(next); setNewAllergen(""); setShowAddAllergen(false);
      setPlan(null); setSelectedMealForView(null);
      const plans = await getMealPlans();
      setPlan(plans[0] || null);
      await hydrateRecipes(plans[0] || null);
    });
  }
  function handleAddPantry(event: FormEvent) {
    event.preventDefault();
    if (newPantryItem.trim()) setPantryIngredients(items => [...new Set([...items, newPantryItem.trim()])]);
    setNewPantryItem("");
  }
  function setImageBusy(busy: boolean) {
    lock.current = busy;
    setWorking(busy);
  }
  function applyMealImage(mealId: number, result: ImageMutationResponse) {
    const meal = plan?.meals.find(item => item.mealPlanMealId === mealId);
    if (!meal) return;
    const recipe = recipeData[meal.recipeId];
    const image = getMediaUrl(result.imageUrl ?? recipe?.imageUrl ?? recipe?.thumbnailUrl);
    setPlan(current => current ? { ...current, meals: current.meals.map(item => item.mealPlanMealId === mealId ? { ...item, imageUrl: result.imageUrl, imageIsGenerated: result.isGenerated, imageGenerationStatus: result.imageUrl ? "READY" : null, imageGenerationError: null } : item) } : current);
    setSelectedMealForView(current => current?.mealPlanMealId === mealId ? { ...current, image, imageIsGenerated: result.isGenerated, imageGenerationStatus: result.imageUrl ? "READY" : null, imageGenerationError: null } : current);
  }
  async function refreshMealImages() {
    if (!plan) return;
    const fresh = await getMealPlan(plan.mealPlanId);
    setPlan(fresh);
    resumeImagePolling();
    const selected = fresh.meals.find(item => item.mealPlanMealId === selectedMealForView?.mealPlanMealId);
    if (!selected) { setSelectedMealForView(null); return; }
    const recipe = await getRecipeById(selected.recipeId);
    setRecipeData(current => ({ ...current, [selected.recipeId]: recipe }));
    setSelectedMealForView(current => current?.mealPlanMealId === selected.mealPlanMealId ? {
      ...current, recipeId: selected.recipeId,
      title: localizeRecipeTitle(recipe.recipeName || selected.recipeName, language),
      description: localizeText(recipe.content, language),
      ingredients: recipe.ingredients.map(item => `${localizeAmount(item.amount, language)} ${localizeIngredient(item.ingredientName, language)}`),
      steps: recipe.steps.map(item => localizeText(item.instruction, language)),
      image: getMediaUrl(selected.imageUrl ?? recipe.imageUrl ?? recipe.thumbnailUrl),
      imageIsGenerated: selected.imageIsGenerated ?? false,
      imageGenerationStatus: selected.imageGenerationStatus, imageGenerationError: selected.imageGenerationError,
    } : current);
  }

  const currentDiet = diets.find(diet => diet.dietTypeId === profile?.dietTypeId);
  return {
    imagePollingNotice, imagesPending: hasPendingImages(plan), reloadMealImages: () => run(refreshMealImages),
    planId: plan?.mealPlanId, applyMealImage, refreshMealImages, setImageBusy,
    days, allergens: selectedAllergens.map(item => item.name), newAllergen,
    setNewAllergen: (value: string) => { setNewAllergen(value); setAllergenError(null); }, showAddAllergen, setShowAddAllergen,
    availableAllergens: allergenCatalog.filter(item => !selectedAllergens.some(selected => selected.allergenId === item.allergenId)),
    allergenStatus: authLoading || allergenOwner !== (user?.uid ?? "guest") ? "loading" : allergenStatus, allergenError,
    retryAllergens: () => { setAllergenStatus("loading"); setAllergenRevision(value => value + 1); },
    pantryIngredients, newPantryItem, setNewPantryItem, selectedMealForView, setSelectedMealForView,
    toastMessage, isRegenerating, handleRemoveAllergen, handleAddAllergen,
    handleRemovePantry: (name: string) => setPantryIngredients(items => items.filter(item => item !== name)),
    handleAddPantry, handleReplaceMeal, handleRegenerate, viewMeal,
    profileName: profile?.fullName || t("You", "Bạn"), bmi: plan?.bmi ?? null,
    bmiCategory: localizeText(plan?.bmiCategory, language), dietName: formatDietTypeName(currentDiet?.name, language), savedCount: savedIds.length,
    loading, error: localizeText(error, language), startDate, setStartDate,
  };
}
