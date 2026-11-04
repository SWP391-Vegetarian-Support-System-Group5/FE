import { apiFetch, apiGet } from "@/lib/api";

export class MealPlanRequestError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "MealPlanRequestError";
  }
}

export interface MealPlanMealResponse {
  imageUrl?: string | null;
  imageIsGenerated?: boolean;
  imageGenerationStatus?: string | null;
  imageGenerationError?: string | null;
  mealPlanMealId: number;
  dayNumber: number;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | string;
  recipeId: number;
  recipeName: string;
  caloriesPerServing: number | null;
}

export interface MealPlanResponse {
  mealPlanId: number;
  startDate: string;
  bmi: number | null;
  bmiCategory: string | null;
  meals: MealPlanMealResponse[];
  tdee: number | null;
  targetCaloriesPerDay: number | null;
  nutritionGoal: "MAINTAIN" | "LOSE" | "GAIN" | null;
  calorieAdjustment: number | null;
  goalWeightKg: number | null;
  healthyWeightMinKg: number | null;
  healthyWeightMaxKg: number | null;
  estimatedWeeksToGoal: number | null;
}

export type MealPlanNutritionGoal = "MAINTAIN" | "LOSE" | "GAIN";
export interface GenerateMealPlanPayload { startDate: string | null; availableIngredients: string | null; nutritionGoal?: MealPlanNutritionGoal; calorieAdjustment?: number | null; }

export function getMealPlans() {
  return apiGet<MealPlanResponse[]>("/api/meal-plans", { cache: "no-store" });
}

export async function getMealPlan(planId: number, signal?: AbortSignal): Promise<MealPlanResponse> {
  const response = await apiFetch(`/api/meal-plans/${planId}`, { cache: "no-store", signal });
  if (!response.ok) throw new MealPlanRequestError(await readApiError(response, "Không tải được ảnh thực đơn."), response.status);
  return await response.json() as MealPlanResponse;
}

export async function generateMealPlan(payload: GenerateMealPlanPayload) {
  const res = await apiFetch("/api/meal-plans/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readApiError(res, "Không thể tạo meal plan."));
  return (await res.json()) as MealPlanResponse;
}

export async function regenerateMealPlan(id: number, payload: GenerateMealPlanPayload) {
  const res = await apiFetch(`/api/meal-plans/${id}/regenerate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readApiError(res, "Không thể tạo lại meal plan."));
  return (await res.json()) as MealPlanResponse;
}

export async function replaceMeal(planId: number, mealId: number) {
  const res = await apiFetch(`/api/meal-plans/${planId}/meals/${mealId}/replace`, {
    method: "PUT",
  });
  if (!res.ok) throw new MealPlanRequestError(await readApiError(res, "Không thể đổi món."), res.status);
  return (await res.json()) as MealPlanResponse;
}

async function readApiError(res: Response, fallback: string) {
  try {
    const data = await res.json();
    return data.message || data.title || fallback;
  } catch {
    return fallback;
  }
}
