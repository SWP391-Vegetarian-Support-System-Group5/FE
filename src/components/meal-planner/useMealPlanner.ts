"use client";

import { usePersonalizedRevision } from "@/hooks/usePersonalizedRevision";
import { getPersonalizedRevision } from "@/lib/personalized-data";
import { saveAllergenSelection } from "@/lib/save-allergen-selection";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getStoredToken } from "@/lib/auth";
import { useMealImagePolling, hasPendingImages } from "./useMealImagePolling";
import type { ImageMutationResponse } from "@/lib/image-api";
import { getMediaUrl } from "@/lib/api";
import { deleteMealPlan, generateMealPlan, getMealPlan, getMealPlans, MealPlanRequestError, regenerateMealPlan, replaceMeal, type MealPlanResponse, type MealPlanNutritionGoal } from "@/lib/meal-plan-api";
import { getAllAllergens, getDietTypes, getProfile, getUserAllergens, updateProfile, type BackendUserProfile, type DietTypeItem } from "@/lib/profile-api";
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
  const personalizedRevision = usePersonalizedRevision();
  const scope = `${user?.uid ?? "guest"}:${personalizedRevision}`;
  const [storedPlan, setPlan] = useState<MealPlanResponse | null>(null);
  const [planOwner, setPlanOwner] = useState<string | undefined>(undefined);
  const plan = planOwner === scope && storedPlan && storedPlan.mealPlanId > 0 && storedPlan.meals.length > 0 ? storedPlan : null;
  const [loadedScope, setLoadedScope] = useState("");
  const [storedProfile, setProfile] = useState<BackendUserProfile | null>(null);
  const profile = loadedScope === scope ? storedProfile : null;
  const [needsRebuild, setNeedsRebuild] = useState(false);
  const [emptyPlan, setEmptyPlan] = useState(false);
  const [diets, setDiets] = useState<DietTypeItem[]>([]);
  const [allergenCatalog, setAllergenCatalog] = useState<{ allergenId: number; name: string }[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<{ allergenId: number; name: string }[]>([]);
  const [newAllergen, setNewAllergen] = useState("");
  const [allergenStatus, setAllergenStatus] = useState<"loading" | "ready" | "error">("loading");
  const [allergenError, setAllergenError] = useState<"selection" | "save" | null>(null);
  const [allergenRevision, setAllergenRevision] = useState(0);
  const [allergenOwner, setAllergenOwner] = useState<string | null>(null);
  const allergensReady = !authLoading && allergenOwner === scope && allergenStatus === "ready";
  const [showAddAllergen, setShowAddAllergen] = useState(false);
  const [pantryIngredients, setPantryIngredients] = useState<string[]>([]);
  const [newPantryItem, setNewPantryItem] = useState("");
  const [recipeData, setRecipeData] = useState<Record<number, RecipeResponse>>({});
  const [selectedMealForView, setSelectedMealForView] = useState<MealItem | null>(null);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pendingLoad, setLoading] = useState(true);
  const loading = authLoading || pendingLoad || loadedScope !== scope;
  const [isRegenerating, setWorking] = useState(false);
  const [startDate, setStartDate] = useState(() => initialMealPlanDate());
  const [goalContext, setGoalContext] = useState<PlanningProfile | null>(null);
  const [goalOwner, setGoalOwner] = useState<string | null>(null);
  const [inputProblems, setInputProblems] = useState<string[]>([]);
  const [profileProblems, setProfileProblems] = useState<string[]>([]);
  const lock = useRef(false);

  const invalidatePlan = useCallback(() => {
    setPlan(null); setSelectedMealForView(null); setRecipeData({}); setNeedsRebuild(true); setGoalContext(null);
  }, []);

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
    plan, owner: user?.uid, enabled: !authLoading && !!user && planOwner === scope && !!getStoredToken(), busy: isRegenerating, onUpdate: applyPolledPlan, onInvalidated: invalidatePlan,
  });

  async function hydrateRecipes(value: MealPlanResponse | null, isCurrent = () => true) {
    if (!value || value.mealPlanId <= 0 || !value.meals.length) { setRecipeData({}); return; }
    const ids = [...new Set(value.meals.map(meal => meal.recipeId))];
    const details = await Promise.all(ids.map(id => getRecipeById(id).then(recipe => [id, recipe] as const).catch(() => null)));
    if (!isCurrent()) return;
    setRecipeData(Object.fromEntries(details.filter((item): item is readonly [number, RecipeResponse] => item !== null)));
  }
  useEffect(() => {
    if (authLoading) return;
    let active = true;
    if (!user?.uid || !getStoredToken()) return () => { active = false; };
    const session = getStoredToken();
    const isCurrent = () => active && getStoredToken() === session && getPersonalizedRevision() === personalizedRevision;
    Promise.allSettled([getMealPlans(), getProfile(), getDietTypes(), getBookmarks()])
      .then(async ([plans, profileResult, dietTypes, bookmarks]) => {
        if (!isCurrent()) return;
        setPlan(null); setSelectedMealForView(null); setRecipeData({}); setGoalContext(null);
        setError(""); setNeedsRebuild(false); setEmptyPlan(false); setSavedIds([]);
        if (profileResult.status === "fulfilled") setProfile(profileResult.value);
        if (dietTypes.status === "fulfilled") setDiets(dietTypes.value);
        if (bookmarks.status === "fulfilled") setSavedIds(bookmarks.value.map(post => post.postId));
        setPlanOwner(scope);
        if (plans.status === "rejected" && plans.reason instanceof MealPlanRequestError && plans.reason.status === 409) {
          setNeedsRebuild(true); setPlan(null);
        } else if (plans.status === "rejected" || profileResult.status === "rejected" || dietTypes.status === "rejected") {
          setError("Không thể tải thông tin thực đơn hoặc hồ sơ của bạn.");
        } else {
          const latest = plans.value.find(value => value.mealPlanId > 0 && value.meals.length > 0) ?? null;
          setPlan(latest);
          await hydrateRecipes(latest, isCurrent);
        }
      })
      .finally(() => { if (isCurrent()) { setLoading(false); setLoadedScope(scope); } });
    return () => { active = false; };
  }, [authLoading, user?.uid, scope, personalizedRevision]);
  useEffect(() => {
    if (authLoading) return;
    let active = true;
    Promise.allSettled([getAllAllergens(), getUserAllergens()]).then(([catalog, selected]) => {
      if (!active) return;
      if (catalog.status === "fulfilled") setAllergenCatalog(catalog.value);
      if (selected.status === "fulfilled") setSelectedAllergens(selected.value);
      setAllergenOwner(scope);
      setAllergenStatus(catalog.status === "fulfilled" && selected.status === "fulfilled" ? "ready" : "error");
    });
    return () => { active = false; };
  }, [authLoading, user?.uid, allergenRevision, scope]);
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 6000);
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
      return { dayNumber: day, dayName: date.weekday, theme: `${t("Day", "Ngày")} ${day} - ${date.date}`, totalPrep: `${meals.length} ${t("meals", "bữa")}`, meals };
    });
  }, [plan, recipeData, language, locale, savedIds, t]);

  async function run(action: (isCurrent: () => boolean) => Promise<void>) {
    const session = getStoredToken();
    const isCurrent = () => getStoredToken() === session && getPersonalizedRevision() === personalizedRevision;
    if (lock.current) return false;
    lock.current = true; setWorking(true); setError("");
    try { await action(isCurrent); return true; }
    catch (failure) {
      if (!isCurrent()) return false;
      if (failure instanceof MealPlanRequestError && failure.status === 409) {
        setPlan(null); setSelectedMealForView(null); setRecipeData({}); setNeedsRebuild(true); setGoalContext(null);
      } else setError(failure instanceof Error ? failure.message : "Could not update meal plan.");
      return false;
    }
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
    await run(async isCurrent => {
      const session = getStoredToken();
      if (!user || !session) throw new Error("Vui lòng đăng nhập để tạo thực đơn.");
      const fresh = await getProfile();
      if (!isCurrent()) return;
      if (getStoredToken() !== session) throw new Error("Phiên đăng nhập đã thay đổi. Vui lòng tải lại trang.");
      setProfile(fresh);
      const context = planningProfile(fresh, new Date().getFullYear());
      if (validateGenerationInputs(context)) { setGoalOwner(scope); setGoalContext(context); }
    });
  }
  async function confirmGeneration(goal: NutritionGoal, adjustment: number) {
    if (!goalContext || goalOwner !== scope) return;
    await run(async isCurrent => {
      const session = getStoredToken();
      if (!user || !session) throw new Error("Vui lòng đăng nhập để tạo thực đơn.");
      const fresh = await getProfile();
      if (!isCurrent()) return;
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
      if (getPersonalizedRevision() !== personalizedRevision) return;
      if (next.mealPlanId <= 0 || next.meals.length === 0) {
        setPlan(null); setPlanOwner(scope); setRecipeData({}); setSelectedMealForView(null); setGoalContext(null);
        setEmptyPlan(true); setToastMessage(null); return;
      }
      setEmptyPlan(false); setNeedsRebuild(false);
      setPlan(next); setPlanOwner(scope); setGoalContext(null); setToastMessage(t("Your 7-day meal plan is ready. Choose By day or Whole week to explore your meals.", "Đã tạo thực đơn 7 ngày thành công. Chọn Từng ngày hoặc Cả tuần để xem các món ăn.")); await hydrateRecipes(next, isCurrent);
    });
  }
  async function handleReplaceMeal(_day: number, mealId: string, _slot: MealItem["slot"], recipeId?: number) {
    if (!plan || plan.mealPlanId <= 0 || !plan.meals.length) return;
    const meal = plan.meals.find(item => item.mealPlanMealId === Number(mealId));
    if (!meal || meal.dayNumber !== _day + 1 || meal.mealType !== _slot) return;
    return run(async isCurrent => {
      const next = await replaceMeal(plan.mealPlanId, Number(mealId), recipeId);
      if (!isCurrent()) return;
      setPlan(next); await hydrateRecipes(next, isCurrent);
    });
  }
  async function handleDeletePlan() {
    if (!plan || plan.mealPlanId <= 0 || !plan.meals.length) return false;
    let deleted = false;
    await run(async isCurrent => {
      await deleteMealPlan(plan.mealPlanId);
      if (!isCurrent()) return;
      setPlan(null);
      setRecipeData({});
      setSelectedMealForView(null);
      setToastMessage(t("Meal plan deleted.", "Đã xóa thực đơn."));
      deleted = true;
    });
    return deleted;
  }
  async function viewMeal(meal: MealItem) {
    if (!meal.recipeId || !plan) return;
    await run(async isCurrent => {
      const recipe = await getRecipeById(meal.recipeId!);
      if (!isCurrent()) return;
      setSelectedMealForView({ ...meal,
        ingredients: recipe.ingredients.map(item => `${localizeAmount(item.amount, language)} ${localizeIngredient(item.ingredientName, language)}`),
        steps: recipe.steps.map(step => localizeText(step.instruction, language)),
      });
    });
  }
  async function savePlannerAllergens(ids: number[]) {
    try {
      const result = await saveAllergenSelection(ids);
      setSelectedAllergens(result.items);
      setNewAllergen(""); setShowAddAllergen(false);
      setToastMessage(result.listsRefreshed
        ? t("Allergens updated and matching food lists refreshed.", "Đã cập nhật dị ứng và tải lại danh sách món phù hợp.")
        : t("Allergens saved. Reload the page to refresh food lists.", "Đã lưu dị ứng. Vui lòng tải lại trang để cập nhật danh sách món."));
    } catch (failure) { setAllergenError("save"); throw failure; }
  }
  async function handleRemoveAllergen(name: string) {
    if (!allergensReady) return;
    await run(() => savePlannerAllergens(selectedAllergens.filter(item => item.name !== name).map(item => item.allergenId)));
  }
  async function handleAddAllergen(event: FormEvent) {
    event.preventDefault();
    if (!allergensReady) return;
    const match = allergenCatalog.find(item => String(item.allergenId) === newAllergen);
    if (!match) { setAllergenError("selection"); return; }
    setAllergenError(null);
    await run(() => savePlannerAllergens([...new Set([...selectedAllergens.map(item => item.allergenId), match.allergenId])]));
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
    if (!plan || plan.mealPlanId <= 0 || !plan.meals.length) return;
    const session = getStoredToken();
    const isCurrent = () => getStoredToken() === session && getPersonalizedRevision() === personalizedRevision;
    let fresh: MealPlanResponse;
    try { fresh = await getMealPlan(plan.mealPlanId); }
    catch (failure) {
      if (isCurrent() && failure instanceof MealPlanRequestError && failure.status === 409) invalidatePlan();
      throw failure;
    }
    if (!isCurrent()) return;
    setPlan(fresh);
    resumeImagePolling();
    const selected = fresh.meals.find(item => item.mealPlanMealId === selectedMealForView?.mealPlanMealId);
    if (!selected) { setSelectedMealForView(null); return; }
    const recipe = await getRecipeById(selected.recipeId);
    if (!isCurrent()) return;
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
      const { fullName, sex, birthYear, heightCm, activityLevel, goalWeightKg, dietTypeId, latitude, longitude, livingAddress } = fresh;
      if (!sex || !birthYear || !heightCm || !activityLevel || !goalWeightKg || !dietTypeId || latitude == null || longitude == null || !livingAddress) throw new Error("Hồ sơ chưa đầy đủ. Hãy cập nhật Hồ sơ của tôi trước khi lưu cân nặng.");
      const updated = await updateProfile({ fullName, sex, birthYear, heightCm, weightKg, activityLevel, goalWeightKg, dietTypeId, latitude, longitude, livingAddress });
      if (session !== getStoredToken()) throw new Error("Phiên đăng nhập đã thay đổi. Vui lòng tải lại trang.");
      setProfile(updated);
      setToastMessage("Đã cập nhật cân nặng. Thông tin mới sẽ được dùng khi tạo thực đơn tiếp theo.");
    } finally { lock.current = false; setWorking(false); }
  }
  return {
    invalidatePlan, needsRebuild: loadedScope === scope && needsRebuild, emptyPlan: loadedScope === scope && emptyPlan,
    profileProblems, saveWeeklyWeight, currentWeightKg: profile?.weightKg, weightOwner: user?.uid,
    goalContext: goalOwner === scope ? goalContext : null,
    inputProblems, confirmGeneration, closeGoalDialog: () => { if (!lock.current) setGoalContext(null); },
    selectedWeekRange: mealPlanWeekRange(parseMealPlanDate(startDate), locale),
    savedWeekRange: mealPlanWeekRange(plan?.startDate ?? null, locale),
    savedStartDate: plan?.startDate ?? null,
    planNutrition: plan?.tdee && plan?.targetCaloriesPerDay && plan?.nutritionGoal
      ? { tdee: plan.tdee, target: plan.targetCaloriesPerDay, goal: plan.nutritionGoal } : null,
    imagePollingNotice, imagesPending: hasPendingImages(plan), reloadMealImages: () => run(refreshMealImages),
    planId: plan?.mealPlanId, applyMealImage, refreshMealImages, setImageBusy,
    days, allergens: allergenOwner === scope ? selectedAllergens.map(item => item.name) : [], newAllergen,
    setNewAllergen: (value: string) => { setNewAllergen(value); setAllergenError(null); }, showAddAllergen, setShowAddAllergen,
    availableAllergens: allergenCatalog.filter(item => !selectedAllergens.some(selected => selected.allergenId === item.allergenId)),
    allergenStatus: authLoading || allergenOwner !== scope ? "loading" : allergenStatus, allergenError,
    retryAllergens: () => { setAllergenStatus("loading"); setAllergenRevision(value => value + 1); },
    pantryIngredients, newPantryItem, setNewPantryItem, selectedMealForView: planOwner === scope ? selectedMealForView : null, setSelectedMealForView,
    toastMessage, isRegenerating, handleRemoveAllergen, handleAddAllergen,
    handleRemovePantry: (name: string) => setPantryIngredients(items => items.filter(item => item !== name)),
    handleAddPantry, handleReplaceMeal, handleDeletePlan, handleRegenerate, viewMeal,
    profileName: profile?.fullName || t("You", "Bạn"),
    bmi: profileBmi?.value ?? plan?.bmi ?? null,
    bmiCategory: localizeText(profileBmi?.category ?? plan?.bmiCategory, language),
    dietName: formatDietTypeName(currentDiet?.name, language), savedCount: loadedScope === scope ? savedIds.length : 0,
    tdee: displayTdee, targetCalories: displayTargetCalories, nutritionGoal: displayGoal, calorieAdjustment: displayAdjustment,
    inferredNutritionGoal, goalWeightKg: profile?.goalWeightKg ?? plan?.goalWeightKg ?? null, estimatedWeeksToGoal: profileHasDirection ? inferredWeeksToGoal : plan?.estimatedWeeksToGoal ?? inferredWeeksToGoal,
    loading, error: loadedScope === scope ? localizeText(error, language) : "", startDate, setStartDate,
  };
}
