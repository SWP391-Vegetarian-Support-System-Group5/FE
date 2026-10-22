import { apiFetch, apiGet } from "@/lib/api";

export interface MealPlanMealResponse {
  mealPlanMealId: number;
  dayNumber: number;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | string;
  recipeId: number;
  recipeName: string;
}

export interface MealPlanResponse {
  mealPlanId: number;
  startDate: string;
  bmi: number | null;
  bmiCategory: string | null;
  meals: MealPlanMealResponse[];
}

export function getMealPlans() {
  return apiGet<MealPlanResponse[]>("/api/meal-plans");
}

export async function generateMealPlan(payload: { startDate: string | null; availableIngredients: string | null }) {
  const res = await apiFetch("/api/meal-plans/generate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readApiError(res, "Không thể tạo meal plan."));
  return (await res.json()) as MealPlanResponse;
}

export async function regenerateMealPlan(id: number, payload: { startDate: string | null; availableIngredients: string | null }) {
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
  if (!res.ok) throw new Error(await readApiError(res, "Không thể đổi món."));
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
