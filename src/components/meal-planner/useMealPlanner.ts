"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getStoredToken } from "@/lib/auth";
import { useMealImagePolling, hasPendingImages } from "./useMealImagePolling";
import type { ImageMutationResponse } from "@/lib/image-api";
import { getMediaUrl } from "@/lib/api";
import { deleteMealPlan, generateMealPlan, getMealPlan, getMealPlans, regenerateMealPlan, replaceMeal, type MealPlanResponse, type MealPlanNutritionGoal } from "@/lib/meal-plan-api";
import { getAllAllergens, getDietTypes, getProfile, getUserAllergens, updateUserAllergens, updateProfile, type BackendUserProfile, type DietTypeItem } from "@/lib/profile-api";
import { getBookmarks } from "@/lib/post-api";
import { getRecipeById, type RecipeResponse } from "@/lib/recipe-api";
import { formatDietTypeName } from "@/lib/diet-type-display";
import { localizeAmount, localizeIngredient, localizeRecipeTitle, localizeText } from "@/lib/localized-content";
import type { DayPlan, MealItem } from "./MealPlannerView";
import { initialMealPlanDate, mealPlanDay, parseMealPlanDate, mealPlanWeekRange } from "@/lib/meal-plan-dates";
import { planningProfile, goalAllowed, goalLimits, normalizeGoal, type PlanningProfile, type NutritionGoal } from "@/lib/meal-plan-goals";

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
  const [goalContext, setGoalContext] = useState<PlanningProfile | null>(null);
  const [goalOwner, setGoalOwner] = useState<string | null>(null);
  const [inputProblems, setInputProblems] = useState<string[]>([]);
  const [profileProblems, setProfileProblems] = useState<string[]>([]);
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
        if ([plans, profileResult, dietTypes].some(result => result.status === "rejected")) setError("Không thể tải thông tin thực đơn hoặc hồ sơ của bạn.");
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
        durationCalories: [minutes ? `${minutes} ${t("mins", "phút")}` : "", recipe?.caloriesPerServing ? `~ ${Math.round(recipe.caloriesPerServing)} kcal` : meal.caloriesPerServing ? `~ ${Math.round(meal.caloriesPerServing)} kcal` : ""].filter(Boolean).join(" · "),
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
  function validateGenerationInputs(context: PlanningProfile) {
    const healthProblems = [...context.missing];
    if (context.age !== null && (context.age < 18 || context.age > 120)) healthProblems.push("Hồ sơ chưa đủ điều kiện tạo thực đơn theo calo cho độ tuổi này");
    if (!healthProblems.length && !context.energy) healthProblems.push("Thông tin sức khỏe chưa tính được nhu cầu năng lượng");
    setProfileProblems(healthProblems);
    const problems = [...healthProblems];
    if (!pantryIngredients.length) problems.push("Thêm ít nhất một nguyên liệu sẵn có");
    if (!allergensReady) problems.push("Tải lại danh sách dị ứng trước khi tạo thực đơn");
    if (!parseMealPlanDate(startDate)) problems.push("Chọn ngày bắt đầu hợp lệ theo dd/mm/yyyy");
    setInputProblems(problems);
    return problems.length === 0;
  }
  async function handleRegenerate() {
    if (lock.current || loading) return;
    setGoalContext(null);
    setInputProblems([]);
    await run(async () => {
      const session = getStoredToken();
      if (!user || !session) throw new Error("Vui lòng đăng nhập để tạo thực đơn.");
      const fresh = await getProfile();
      if (getStoredToken() !== session) throw new Error("Phiên đăng nhập đã thay đổi. Vui lòng tải lại trang.");
      setProfile(fresh);
      const context = planningProfile(fresh, new Date().getFullYear());
      if (validateGenerationInputs(context)) { setGoalOwner(user.uid); setGoalContext(context); }
    });
  }
  async function confirmGeneration(goal: NutritionGoal, adjustment: number) {
    if (!goalContext || goalOwner !== user?.uid) return;
    await run(async () => {
      const session = getStoredToken();
      if (!user || !session) throw new Error("Vui lòng đăng nhập để tạo thực đơn.");
      const fresh = await getProfile();
      if (getStoredToken() !== session) throw new Error("Phiên đăng nhập đã thay đổi. Vui lòng tải lại trang.");
      setProfile(fresh);
      const context = planningProfile(fresh, new Date().getFullYear());
      if (!validateGenerationInputs(context)) { setGoalContext(null); return; }
      setGoalContext(context);
      const limits = goalLimits(context, goal);
      if (!goalAllowed(context.bmi, goal) || !Number.isInteger(adjustment) || adjustment < 0 || adjustment > limits.maxAdjustment ||
        (adjustment !== 0 && (adjustment < 500 || adjustment % 50 !== 0)))
        throw new Error("Mục tiêu không còn phù hợp với hồ sơ hiện tại. Vui lòng chọn lại mức điều chỉnh.");
      const target = (limits.tdee ?? 0) + (goal === "LOSE" ? -adjustment : goal === "GAIN" ? adjustment : 0);
      if (target < limits.minimumIntake) throw new Error("Mức năng lượng mục tiêu quá thấp cho chế độ tạo thực đơn này. Vui lòng chọn lại mục tiêu hoặc kiểm tra hồ sơ.");
      const parsedDate = parseMealPlanDate(startDate);
      if (!parsedDate) throw new Error(t("Enter a valid start date as dd/mm/yy (2000-2099).", "Nhập ngày bắt đầu hợp lệ theo dd/mm/yy (năm 2000–2099)."));
      const payload = { startDate: parsedDate, availableIngredients: pantryIngredients.join(", "), ...normalizeGoal(goal, adjustment) };
      const next = plan ? await regenerateMealPlan(plan.mealPlanId, payload) : await generateMealPlan(payload);
      if (getStoredToken() !== session) return;
      setPlan(next); setPlanOwner(user?.uid); setGoalContext(null); await hydrateRecipes(next); setToastMessage(t("Meal plan saved.", "Đã lưu thực đơn."));
    });
  }
  async function handleReplaceMeal(_day: number, mealId: string, _slot: MealItem["slot"], recipeId?: number) {
    if (!plan) return;
    const meal = plan.meals.find(item => item.mealPlanMealId === Number(mealId));
    if (!meal || meal.dayNumber !== _day + 1 || meal.mealType !== _slot) return;
    await run(async () => {
      const next = await replaceMeal(plan.mealPlanId, Number(mealId), recipeId);
      setPlan(next); await hydrateRecipes(next);
    });
  }
  async function handleDeletePlan() {
    if (!plan) return false;
    let deleted = false;
    await run(async () => {
      await deleteMealPlan(plan.mealPlanId);
      setPlan(null);
      setRecipeData({});
      setSelectedMealForView(null);
      setToastMessage(t("Meal plan deleted.", "Đã xóa thực đơn."));
      deleted = true;
    });
    return deleted;
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
    if (newPantryItem.trim()) {
      setPantryIngredients(items => [...new Set([...items, newPantryItem.trim()])]);
      setInputProblems(items => items.filter(item => item !== "Thêm ít nhất một nguyên liệu sẵn có"));
    }
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
  // The profile is the source of truth for the card, even before the user creates a meal plan.
  // A saved plan may contain an old/null BMI from before the profile was completed.
  const profileBmi = useMemo(() => {
    if (!profile || !profile.heightCm || !profile.weightKg || profile.heightCm <= 0 || profile.weightKg <= 0) return null;
    const heightInMeters = profile.heightCm / 100;
    const value = Math.round((profile.weightKg / (heightInMeters * heightInMeters)) * 100) / 100;
    const category = value < 18.5 ? "Thiếu cân" : value < 25 ? "Trong khoảng tham chiếu" : value < 30 ? "Thừa cân" : "BMI cao";
    return { value, category };
  }, [profile]);
  const inferredNutritionGoal = useMemo<MealPlanNutritionGoal>(() => {
    if (!profile?.weightKg || !profile.goalWeightKg) return "MAINTAIN";
    if (profile.goalWeightKg < profile.weightKg) return "LOSE";
    if (profile.goalWeightKg > profile.weightKg) return "GAIN";
    return "MAINTAIN";
  }, [profile]);
  const profileTdee = useMemo(() => {
    if (!profile?.weightKg || !profile.heightCm || !profile.sex || !profile.birthYear || !profile.activityLevel) return null;
    const today = new Date();
    const age = today.getFullYear() - profile.birthYear;
    if (age < 18 || age > 120) return null;
    const factor = { SEDENTARY: 1.2, LIGHT: 1.375, MODERATE: 1.55, ACTIVE: 1.725, VERY_ACTIVE: 1.9 }[profile.activityLevel];
    const bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * age + (profile.sex === "MALE" ? 5 : -161);
    return Math.round(bmr * factor);
  }, [profile]);
  // An older plan may have been generated before the user saved a goal weight.
  // The profile goal is therefore the source of truth for the summary card.
  const profileHasDirection = inferredNutritionGoal !== "MAINTAIN";
  const planMatchesProfileDirection = plan?.nutritionGoal === inferredNutritionGoal;
  const displayGoal = profileHasDirection ? inferredNutritionGoal : plan?.nutritionGoal ?? "MAINTAIN";
  const displayAdjustment = profileHasDirection
    ? (planMatchesProfileDirection ? plan?.calorieAdjustment ?? 500 : 500)
    : plan?.calorieAdjustment ?? null;
  const displayTdee = plan?.tdee ?? profileTdee;
  const displayTargetCalories = plan?.targetCaloriesPerDay ?? (displayTdee == null ? null : displayGoal === "LOSE" ? displayTdee - (displayAdjustment ?? 500) : displayGoal === "GAIN" ? displayTdee + (displayAdjustment ?? 500) : displayTdee);
  const inferredWeeksToGoal = useMemo(() => {
    if (!profile?.weightKg || !profile.goalWeightKg || !displayAdjustment || inferredNutritionGoal === "MAINTAIN") return null;
    return Math.round((Math.abs(profile.goalWeightKg - profile.weightKg) * 7700 / (displayAdjustment * 7)) * 10) / 10;
  }, [profile, displayAdjustment, inferredNutritionGoal]);
  async function saveWeeklyWeight(weightKg: number) {
    if (lock.current) throw new Error("Vui lòng chờ thao tác hiện tại hoàn tất.");
    const session = getStoredToken();
    if (!user || !session) throw new Error("Vui lòng đăng nhập lại.");
    lock.current = true; setWorking(true);
    try {
      const fresh = await getProfile();
      if (session !== getStoredToken()) throw new Error("Phiên đăng nhập đã thay đổi.");
      const { fullName, sex, birthYear, birthDate, heightCm, activityLevel, goalWeightKg, dietTypeId, latitude, longitude } = fresh;
      const updated = await updateProfile({ fullName, sex, birthYear, birthDate, heightCm, weightKg, activityLevel, goalWeightKg, dietTypeId, latitude, longitude });
      if (session !== getStoredToken()) throw new Error("Phiên đăng nhập đã thay đổi. Vui lòng tải lại trang.");
      setProfile(updated);
      setToastMessage("Đã cập nhật cân nặng. Thông tin mới sẽ được dùng khi tạo thực đơn tiếp theo.");
    } finally { lock.current = false; setWorking(false); }
  }
  return {
    profileProblems, saveWeeklyWeight, currentWeightKg: profile?.weightKg, weightOwner: user?.uid,
    goalContext: goalOwner === user?.uid ? goalContext : null,
    inputProblems, confirmGeneration, closeGoalDialog: () => { if (!lock.current) setGoalContext(null); },
    selectedWeekRange: mealPlanWeekRange(parseMealPlanDate(startDate), locale),
    savedWeekRange: mealPlanWeekRange(plan?.startDate ?? null, locale),
    savedStartDate: plan?.startDate ?? null,
    planNutrition: plan?.tdee && plan?.targetCaloriesPerDay && plan?.nutritionGoal
      ? { tdee: plan.tdee, target: plan.targetCaloriesPerDay, goal: plan.nutritionGoal } : null,
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
    handleAddPantry, handleReplaceMeal, handleDeletePlan, handleRegenerate, viewMeal,
    profileName: profile?.fullName || t("You", "Bạn"),
    bmi: profileBmi?.value ?? plan?.bmi ?? null,
    bmiCategory: localizeText(profileBmi?.category ?? plan?.bmiCategory, language),
    dietName: formatDietTypeName(currentDiet?.name, language), savedCount: savedIds.length,
    tdee: displayTdee, targetCalories: displayTargetCalories, nutritionGoal: displayGoal, calorieAdjustment: displayAdjustment,
    inferredNutritionGoal, goalWeightKg: profile?.goalWeightKg ?? plan?.goalWeightKg ?? null, estimatedWeeksToGoal: profileHasDirection ? inferredWeeksToGoal : plan?.estimatedWeeksToGoal ?? inferredWeeksToGoal,
    loading, error: localizeText(error, language), startDate, setStartDate,
  };
}
