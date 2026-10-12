/**
 * Profile API service — centralizes all backend calls used by the Profile page.
 *
 * Uses the shared apiFetch / apiGet / apiPut helpers from @/lib/api so the
 * base URL and JWT token are handled automatically.
 */

import { apiGet, apiPut } from "@/lib/api";

// ─── Response types ─────────────────────────────────────────────────────────

/** Shape returned by GET /api/users/me */
export interface BackendUserProfile {
  userId: number;
  email: string;
  fullName: string;
  sex: "MALE" | "FEMALE" | null;
  heightCm: number | null;
  weightKg: number | null;
  dietTypeId: number | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
}

/** Shape sent to PUT /api/users/me/profile */
export interface UpdateProfilePayload {
  fullName: string;
  sex: "MALE" | "FEMALE" | null;
  heightCm: number | null;
  weightKg: number | null;
  dietTypeId: number | null;
  latitude: number | null;
  longitude: number | null;
}

/** Single diet type from GET /api/diet-types */
export interface DietTypeItem {
  dietTypeId: number;
  name: string;
  description?: string;
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
  return apiGet<BackendUserProfile>("/api/users/me");
}

/** Update the authenticated user's profile */
export function updateProfile(payload: UpdateProfilePayload) {
  return apiPut<BackendUserProfile>("/api/users/me/profile", payload);
}

/** Fetch all available diet types */
export async function getDietTypes() {
  const items = await apiGet<BackendCatalogItem[]>("/api/diet-types");
  return items.map((item) => ({
    dietTypeId: item.dietTypeId ?? item.id ?? 0,
    name: item.name,
    description: item.description,
  })).filter((item) => item.dietTypeId > 0);
}

/** Fetch all available allergens */
export async function getAllAllergens() {
  const items = await apiGet<BackendCatalogItem[]>("/api/allergens");
  return items.map((item) => ({
    allergenId: item.allergenId ?? item.id ?? 0,
    name: item.name,
  })).filter((item) => item.allergenId > 0);
}

/** Fetch the current user's selected allergens */
export async function getUserAllergens() {
  const response = await apiGet<BackendCatalogItem[] | { allergens?: BackendCatalogItem[] }>(
    "/api/users/me/allergens",
  );
  const items = Array.isArray(response) ? response : response.allergens ?? [];
  return items.map((item) => ({
    allergenId: item.allergenId ?? item.id ?? 0,
    name: item.name,
  })).filter((item) => item.allergenId > 0);
}

/** Update the current user's allergen selections */
export function updateUserAllergens(allergenIds: number[]) {
  return apiPut<void>("/api/users/me/allergens", { allergenIds });
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

