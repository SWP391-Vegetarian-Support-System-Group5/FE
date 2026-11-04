import { fallbackAreas, vietnamProvinces } from "@/lib/location-data";
import { apiFetch } from "@/lib/api";
import type { Area, Province, Restaurant } from "@/types/location";

const nearbyRadiusKm = 5;

type BackendRestaurant = {
  restaurantId: number;
  name: string;
  imageUrl?: string | null;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  dietTypeIds: number[];
  foods: string[];
  ingredientNames: string[];
};

type AddressSuggestion = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

type GeocodeResult = {
  latitude: number;
  longitude: number;
  formattedAddress: string;
};

type ReverseGeocodeResult = {
  formattedAddress: string;
};

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(lat2 - lat1);
  const dLon = radians(lon2 - lon1);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

// Keep the page usable while the backend is starting or the persistence layer is not ready.
// Once the real API responds, the exact same UI automatically switches to server data.
async function getJson<T>(path: string, fallback: T, timeoutMs = 2500, propagateError = false): Promise<T> {
  try {
    const response = await apiFetch(`/api${path}`, { signal: AbortSignal.timeout(timeoutMs) });
    if (response.status === 401 || response.status === 403) throw new Error("Bạn cần đăng nhập lại để tìm địa điểm.");
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    return (await response.json()) as T;
  } catch (error) {
    if (propagateError) throw error;
    return fallback;
  }
}

export const locationApi = {
  provinces: () => getJson<Province[]>("/locations/provinces", vietnamProvinces),
  areas: (provinceCode: string) =>
    getJson<Area[]>(`/locations/provinces/${provinceCode}/areas`, fallbackAreas(provinceCode)),
  addressSuggestions: (query: string, latitude?: number, longitude?: number) => {
    const params = new URLSearchParams({ query });
    if (latitude != null && longitude != null) {
      params.set("latitude", String(latitude));
      params.set("longitude", String(longitude));
    }
    return getJson<AddressSuggestion[]>(`/locations/address-suggestions?${params}`, []);
  },
  geocode: (address: string) =>
    getJson<GeocodeResult | null>(`/locations/geocode?${new URLSearchParams({ address })}`, null, 60000, true),
  reverseGeocode: (latitude: number, longitude: number) =>
    getJson<ReverseGeocodeResult | null>(
      `/locations/reverse-geocode?${new URLSearchParams({ latitude: String(latitude), longitude: String(longitude) })}`,
      null,
    ),
  restaurants: async (provinceCode: string, areaCode: string, latitude?: number, longitude?: number, dietTypeId?: number | null): Promise<Restaurant[]> => {
    if (latitude === undefined || longitude === undefined) return Promise.resolve([]);

    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      radius: String(nearbyRadiusKm),
    });
    if (dietTypeId != null) params.set("dietTypeId", String(dietTypeId));
    const [items, dietTypes] = await Promise.all([
      getJson<BackendRestaurant[]>(`/restaurants/nearby?${params}`, [], 15000, true),
      getJson<Array<{ id: number; name: string }>>("/diet-types", [], 8000, true),
    ]);
    const names = new Map(dietTypes.map(type => [type.id, type.name]));
    return items.filter(item => item.latitude != null && item.longitude != null).map(item => ({
      id: String(item.restaurantId), name: item.name,
      imageUrl: item.imageUrl,
      category: item.dietTypeIds.length === 0 ? "Unclassified" : item.dietTypeIds.map(id => names.get(id) ?? `#${id}`).join(", "),
      address: item.address, provinceCode, areaCode,
      latitude: item.latitude!, longitude: item.longitude!, rating: 0, reviewCount: 0,
      distanceKm: distanceKm(latitude, longitude, item.latitude!, item.longitude!), foods: item.foods,
      ingredientNames: item.ingredientNames,
    }));
  },
};
