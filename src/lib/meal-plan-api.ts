import { apiFetch } from "@/lib/api";
import type { NutritionGoal } from "./meal-plan-goals";

export interface GenerateMealPlanPayload {
  startDate: string | null;
  availableIngredients: string | null;
  nutritionGoal: NutritionGoal;
  calorieAdjustment: number | null;
}

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

export interface MealPlanRecipeOptionResponse {
  recipeId: number;
  recipeName: string;
  imageUrl: string | null;
  caloriesPerServing: number;
  prepMinutes: number | null;
  cookMinutes: number | null;
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

function requirePlanId(id: number) {
  if (!Number.isInteger(id) || id <= 0) throw new MealPlanRequestError("INVALID_MEAL_PLAN_ID", 400);
}

export function getMealPlans() {
  return readPlans();
}

async function readPlans(): Promise<MealPlanResponse[]> {
  const response = await apiFetch("/api/meal-plans", { cache: "no-store" });
  if (!response.ok) throw new MealPlanRequestError(await readApiError(response, "Không tải được thực đơn."), response.status);
  return response.json() as Promise<MealPlanResponse[]>;
}

export async function getMealPlan(planId: number, signal?: AbortSignal): Promise<MealPlanResponse> {
  requirePlanId(planId);
  const response = await apiFetch(`/api/meal-plans/${planId}`, { cache: "no-store", signal });
  if (!response.ok) throw new MealPlanRequestError(await readApiError(response, "Không tải được ảnh thực đơn."), response.status);
  return await response.json() as MealPlanResponse;
}

export async function generateMealPlan(payload: GenerateMealPlanPayload) {
  const res = await apiFetch("/api/meal-plans/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new MealPlanRequestError(await readApiError(res, "Không thể tạo thực đơn."), res.status);
  return (await res.json()) as MealPlanResponse;
}

export async function regenerateMealPlan(id: number, payload: GenerateMealPlanPayload) {
  requirePlanId(id);
  const res = await apiFetch(`/api/meal-plans/${id}/regenerate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new MealPlanRequestError(await readApiError(res, "Không thể tạo lại thực đơn."), res.status);
  return (await res.json()) as MealPlanResponse;
}

export async function getMealReplacementOptions(planId: number, mealId: number, query = "") {
  requirePlanId(planId);
  const response = await apiFetch(`/api/meal-plans/${planId}/meals/${mealId}/replacement-options?query=${encodeURIComponent(query)}`, { cache: "no-store" });
  if (!response.ok) throw new MealPlanRequestError(await readApiError(response, "Không tải được món thay thế."), response.status);
  return response.json() as Promise<MealPlanRecipeOptionResponse[]>;
}

export async function replaceMeal(planId: number, mealId: number, recipeId?: number) {
  requirePlanId(planId);
  const res = await apiFetch(`/api/meal-plans/${planId}/meals/${mealId}/replace`, {
    method: "PUT",
    body: JSON.stringify(recipeId ?? null),
  });
  if (!res.ok) throw new MealPlanRequestError(await readApiError(res, "Không thể đổi món."), res.status);
  return (await res.json()) as MealPlanResponse;
}

export async function deleteMealPlan(planId: number) {
  requirePlanId(planId);
  const res = await apiFetch(`/api/meal-plans/${planId}`, { method: "DELETE" });
  if (!res.ok) throw new MealPlanRequestError(await readApiError(res, "Không thể xóa thực đơn."), res.status);
}

async function readApiError(res: Response, fallback: string) {
  try {
    const data = await res.json();
    return data.message || data.title || fallback;
  } catch {
    return fallback;
  }
}
