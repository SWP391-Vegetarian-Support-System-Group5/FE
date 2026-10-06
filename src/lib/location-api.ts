import { fallbackAreas, fallbackRestaurants, vietnamProvinces } from "@/lib/location-data";
import type { Area, Province, Restaurant } from "@/types/location";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5299/api";

type BackendRestaurant = {
  restaurantId: number;
  name: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  dietTypeId?: number | null;
  foods: string[];
};

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
    const fallback = fallbackRestaurants.filter((restaurant) =>
      restaurant.provinceCode === provinceCode && (areaCode === "all" || restaurant.areaCode === areaCode));
    if (latitude === undefined || longitude === undefined) return Promise.resolve(fallback);

    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      radius: "15",
    });

    return getJson<BackendRestaurant[] | null>(`/restaurants/nearby?${params}`, null).then((items) => {
      if (items === null) return fallback;
      return items
        .filter((item) => item.latitude != null && item.longitude != null)
        .map<Restaurant>((item) => ({
          id: String(item.restaurantId),
          name: item.name,
          category: item.dietTypeId ? "Vegetarian" : "Plant-based",
          address: item.address,
          provinceCode,
          areaCode,
          latitude: item.latitude!,
          longitude: item.longitude!,
          rating: 0,
          reviewCount: 0,
        }));
    });
  },
};
