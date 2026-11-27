import { fetchDietTypes, type DietType } from "@/lib/diet-types-api";
import { invalidatePersonalizedData } from "@/lib/personalized-data";
import { apiFetch, apiGet } from "@/lib/api";

export interface AdminRestaurant {
  restaurantId: number;
  name: string;
  address: string;
  imageUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  dietTypeIds: number[];
  foods: string[];
  ingredientIds: number[];
  ingredientNames: string[];
}

export type RestaurantPayload = Pick<AdminRestaurant, "name" | "address" | "imageUrl" | "dietTypeIds" | "foods" | "ingredientIds">;

export type DietTypeOption = DietType;

export interface AdminAllergen {
  id: number;
  name: string;
  type: string | null;
  createdAt?: string;
  createdDate?: string;
  requestedAt?: string;
  userId?: number;
}

async function mutate<T>(path: string, method: "POST" | "PUT" | "DELETE", body?: unknown): Promise<T> {
  const response = await apiFetch(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null);
    const message = data && typeof data === "object" && "message" in data && typeof data.message === "string"
      ? data.message : `${method} ${path} failed (${response.status})`;
    throw new Error(message);
  }
  if (path.startsWith("/api/admin/restaurants")) invalidatePersonalizedData();
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export const listRestaurants = () => apiGet<AdminRestaurant[]>("/api/restaurants", { cache: "no-store" });
export const listDietTypes = fetchDietTypes;
export const createRestaurant = (body: RestaurantPayload) => mutate<AdminRestaurant>("/api/admin/restaurants", "POST", body);
export const updateRestaurant = (id: number, body: RestaurantPayload) => mutate<void>(`/api/admin/restaurants/${id}`, "PUT", body);
export const deleteRestaurant = (id: number) => mutate<void>(`/api/admin/restaurants/${id}`, "DELETE");

export const listAllergens = () => apiGet<AdminAllergen[]>("/api/allergens", { cache: "no-store" });
export const createAllergen = (name: string) => mutate<AdminAllergen>("/api/admin/allergens", "POST", { name });
export const updateAllergen = (id: number, name: string) => mutate<void>(`/api/admin/allergens/${id}`, "PUT", { name });
export const deleteAllergen = (id: number) => mutate<void>(`/api/admin/allergens/${id}`, "DELETE");
