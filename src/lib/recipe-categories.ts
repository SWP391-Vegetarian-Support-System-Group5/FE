import { apiGet } from "@/lib/api";

export interface RecipeCategory {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export function getRecipeCategories(includeInactive = false) {
  return apiGet<RecipeCategory[]>(`/api/recipe-categories${includeInactive ? "?includeInactive=true" : ""}`);
}

export function categoryName(category: Pick<RecipeCategory, "name">, _language = "vi") {
  void _language; // Kept for compatibility; category names are backend content.
  return category.name;
}
