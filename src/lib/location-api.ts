import { fallbackAreas, fallbackRestaurants, vietnamProvinces } from "@/lib/location-data";
import type { Area, Province, Restaurant } from "@/types/location";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5299/api";

// Keep the page usable while the backend is starting or the persistence layer is not ready.
// Once the real API responds, the exact same UI automatically switches to server data.
async function getJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${apiUrl}${path}`, { signal: AbortSignal.timeout(2500) });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export const locationApi = {
  provinces: () => getJson<Province[]>("/locations/provinces", vietnamProvinces),
  areas: (provinceCode: string) =>
    getJson<Area[]>(`/locations/provinces/${provinceCode}/areas`, fallbackAreas(provinceCode)),
  restaurants: (provinceCode: string, areaCode: string, latitude?: number, longitude?: number) => {
    const params = new URLSearchParams({ provinceCode, areaCode, radiusKm: "15" });
    if (latitude !== undefined && longitude !== undefined) {
      params.set("latitude", String(latitude));
      params.set("longitude", String(longitude));
    }
    const fallback = fallbackRestaurants.filter((restaurant) =>
      restaurant.provinceCode === provinceCode && (areaCode === "all" || restaurant.areaCode === areaCode));
    return getJson<Restaurant[]>(`/restaurants?${params}`, fallback);
  },
};
