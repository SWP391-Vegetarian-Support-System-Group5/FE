import { apiGet } from "@/lib/api";

export interface DietType {
  id: number;
  name: string;
  compatibleRestaurantDietTypeIds: number[];
  description?: string;
  allowedIngredientGroups?: string[];
  prohibitedIngredientGroups?: string[];
}

// Compatibility is owned by the backend; never infer it from translated names.
export const fetchDietTypes = () => apiGet<DietType[]>("/api/diet-types", { cache: "no-store" });
