import { apiFetch, apiGet } from "@/lib/api";

export interface BmiType {
  id: number;
  code: "UNDERWEIGHT" | "NORMAL" | "OBESE";
  name: string;
  description: string | null;
}

export interface AdminRecipeBmi {
  postId: number;
  recipeName: string;
  title: string;
  status: string;
  bmiTypes: BmiType[];
  categoryIds: number[];
}

export const getBmiTypes = (signal?: AbortSignal) => apiGet<BmiType[]>("/api/bmi-types", { signal });
export const getAdminRecipeBmiTypes = (signal?: AbortSignal) => apiGet<AdminRecipeBmi[]>("/api/admin/recipes/bmi-types", { signal });
export async function setRecipeBmiTypes(recipeId: number, bmiTypeIds: number[]) {
  const response = await apiFetch(`/api/admin/recipes/${recipeId}/bmi-types`, { method: "PUT", body: JSON.stringify({ bmiTypeIds }) });
  if (!response.ok) throw new Error(`BMI_UPDATE_${response.status}`);
}

export async function setRecipeCategories(recipeId: number, categoryIds: number[]) {
  const response = await apiFetch(`/api/admin/recipes/${recipeId}/categories`, { method: "PUT", body: JSON.stringify({ categoryIds }) });
  if (!response.ok) throw new Error(`CATEGORY_UPDATE_${response.status}`);
}
