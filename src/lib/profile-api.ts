/**
 * Profile API service — centralizes all backend calls used by the Profile page.
 *
 * Uses the shared apiFetch / apiGet / apiPut helpers from @/lib/api so the
 * base URL and JWT token are handled automatically.
 */

import { apiFetch, apiGet, apiPut } from "@/lib/api";
import type { ActivityLevel } from "@/lib/profile-energy";

// ─── Response types ─────────────────────────────────────────────────────────

/** Shape returned by GET /api/users/me */
export interface BackendUserProfile {
  avatarUrl?: string | null;
  userId: number;
  email: string;
  fullName: string;
  sex: "MALE" | "FEMALE" | null;
  birthDate?: string | null;
  birthYear?: number | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: ActivityLevel | null;
  goalWeightKg: number | null;
  dietTypeId: number | null;
  latitude: number | null;
  longitude: number | null;
  livingAddress: string | null;
  isActive: boolean;
}

/** Shape sent to PUT /api/users/me/profile */
export interface UpdateProfilePayload {
  fullName: string;
  sex: "MALE" | "FEMALE" | null;
  birthDate?: string | null;
  birthYear?: number | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: ActivityLevel | null;
  goalWeightKg: number | null;
  dietTypeId: number | null;
  latitude: number | null;
  longitude: number | null;
  livingAddress?: string | null;
}

/** Single diet type from GET /api/diet-types */
export interface DietTypeItem {
  dietTypeId: number;
  name: string;
  description?: string;
  allowedIngredientGroups?: string[];
  prohibitedIngredientGroups?: string[];
}

/** Single allergen from GET /api/allergens */
export interface AllergenItem {
  allergenId: number;
  name: string;
}

/** Province from GET /api/locations/provinces */
export interface ProvinceItem {
  code: string;
  name: string;
  type: string;
  latitude: number | null;
  longitude: number | null;
}

/** Area from GET /api/locations/provinces/{code}/areas */
export interface AreaItem {
  code: string;
  name: string;
  type: string;
  latitude: number | null;
  longitude: number | null;
}

/** Address suggestion from GET /api/locations/address-suggestions */
export interface AddressSuggestion {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
}

type BackendCatalogItem = {
  id?: number;
  dietTypeId?: number;
  allergenId?: number;
  name: string;
  description?: string;
};

// ─── API functions ──────────────────────────────────────────────────────────

/** Fetch the authenticated user's profile */
export function getProfile() {
  return apiGet<BackendUserProfile>("/api/users/me", { cache: "no-store" });
}

/** Update the authenticated user's profile */
export async function updateProfile(payload: UpdateProfilePayload) {
  const response = await apiFetch("/api/users/me/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    let message = `Không thể lưu hồ sơ (HTTP ${response.status}).`;
    if (body && typeof body === "object") {
      const error = body as { message?: unknown; errors?: unknown };
      const details = Array.isArray(error.errors)
        ? error.errors
        : error.errors && typeof error.errors === "object" ? Object.values(error.errors).flat() : [];
      const messages = details.filter((item): item is string => typeof item === "string" && !!item.trim());
      if (messages.length) message = [...new Set(messages)].join(" ");
      else if (typeof error.message === "string" && error.message.trim()) message = error.message;
    }
    throw new Error(message);
  }
  return response.json() as Promise<BackendUserProfile>;
}

/** Persists the map location without overwriting the rest of a user's health profile. */
export function updateLivingLocation(latitude: number, longitude: number, livingAddress?: string) {
  return apiPut<BackendUserProfile>("/api/users/me/location", { latitude, longitude, livingAddress });
}

/** Fetch all available diet types */
export async function getDietTypes() {
  const items = await apiGet<BackendCatalogItem[]>("/api/diet-types");
  return items.map((item) => ({
    dietTypeId: item.dietTypeId ?? item.id ?? 0,
    name: item.name,
    description: item.description,
    allowedIngredientGroups: (item as BackendCatalogItem & { allowedIngredientGroups?: string[] }).allowedIngredientGroups ?? [],
    prohibitedIngredientGroups: (item as BackendCatalogItem & { prohibitedIngredientGroups?: string[] }).prohibitedIngredientGroups ?? [],
  })).filter((item) => item.dietTypeId > 0);
}

/** Fetch all available allergens */
export async function getAllAllergens() {
  const items = await apiGet<BackendCatalogItem[]>("/api/allergens", { cache: "no-store" });
  return items.map((item) => ({
    allergenId: item.allergenId ?? item.id ?? 0,
    name: item.name,
  })).filter((item) => item.allergenId > 0);
}

/** Fetch the current user's selected allergens */
export async function getUserAllergens() {
  const response = await apiGet<BackendCatalogItem[] | { allergens?: BackendCatalogItem[] }>(
    "/api/users/me/allergens",
    { cache: "no-store" },
  );
  const items = Array.isArray(response) ? response : response.allergens ?? [];
  return items.map((item) => ({
    allergenId: item.allergenId ?? item.id ?? 0,
    name: item.name,
  })).filter((item) => item.allergenId > 0);
}

/** Update the current user's allergen selections */
export function updateUserAllergens(allergenIds: number[]) {
  return apiFetch("/api/users/me/allergens", { method: "PUT", body: JSON.stringify({ allergenIds }) }).then(async response => {
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(typeof data?.message === "string" ? data.message : "ALLERGEN_SAVE_FAILED");
    return data;
  });
}

export type AllergenSubmission = {
  id: number; userId: number; submittedName: string; name: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  message: string; rejectionReason: string | null; allergenId: number | null;
  createdAt: string; reviewedAt: string | null; reviewedByUserId: number | null;
};

export const getAllergenSubmissions = async () => {
  const response = await apiFetch("/api/users/me/allergen-requests", { cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof data?.message === "string" ? data.message : "ALLERGEN_HISTORY_FAILED");
  if (!Array.isArray(data)) throw new Error("ALLERGEN_RESPONSE_INVALID");
  return data as AllergenSubmission[];
};

/** Submits a proposal for admin review; does not change profile selections. */
export async function createCustomAllergen(name: string): Promise<AllergenSubmission> {
  const response = await apiFetch("/api/users/me/allergens/custom", {
    method: "POST", body: JSON.stringify({ name }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || data?.detail || "ALLERGEN_SUBMIT_FAILED");
  if (!data || !Number.isInteger(data.id) || !["PENDING", "APPROVED", "REJECTED"].includes(data.status)) {
    throw new Error("ALLERGEN_RESPONSE_INVALID");
  }
  return data as AllergenSubmission;
}

/** Fetch all provinces */
export function getProvinces() {
  return apiGet<ProvinceItem[]>("/api/locations/provinces");
}

/** Fetch areas (wards / communes) for a given province */
export function getAreas(provinceCode: string) {
  return apiGet<AreaItem[]>(`/api/locations/provinces/${provinceCode}/areas`);
}

/** Search for address suggestions */
export function getAddressSuggestions(query: string) {
  return apiGet<AddressSuggestion[]>(
    `/api/locations/address-suggestions?query=${encodeURIComponent(query)}`
  );
}

/** Geocode a free-form address into coordinates */
export function geocodeAddress(address: string) {
  return apiGet<{ latitude: number; longitude: number; formattedAddress: string }>(
    `/api/locations/geocode?address=${encodeURIComponent(address)}`
  );
}

/** Reverse-geocode coordinates to an address */
export function reverseGeocode(latitude: number, longitude: number) {
  return apiGet<AddressSuggestion>(
    `/api/locations/reverse-geocode?latitude=${latitude}&longitude=${longitude}`
  );
}

