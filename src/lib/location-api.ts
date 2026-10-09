import { fallbackAreas, vietnamProvinces } from "@/lib/location-data";
import { API_BASE_URL } from "@/lib/api";
import type { Area, Province, Restaurant } from "@/types/location";

const apiUrl = `${API_BASE_URL.replace(/\/+$/, "")}/api`;
const nearbyRadiusKm = 5;

type BackendRestaurant = {
  restaurantId: number;
  name: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  dietTypeId?: number | null;
  foods: string[];
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

type NearbyPlace = {
  id: string;
  name: string;
  category: string;
  address: string;
  provinceCode: string;
  areaCode: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  distanceKm: number;
};

// Keep the page usable while the backend is starting or the persistence layer is not ready.
// Once the real API responds, the exact same UI automatically switches to server data.
async function getJson<T>(path: string, fallback: T, timeoutMs = 2500): Promise<T> {
  try {
    const response = await fetch(`${apiUrl}${path}`, { signal: AbortSignal.timeout(timeoutMs) });
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
  addressSuggestions: (query: string, latitude?: number, longitude?: number) => {
    const params = new URLSearchParams({ query });
    if (latitude != null && longitude != null) {
      params.set("latitude", String(latitude));
      params.set("longitude", String(longitude));
    }
    return getJson<AddressSuggestion[]>(`/locations/address-suggestions?${params}`, []);
  },
  geocode: (address: string) =>
    getJson<GeocodeResult | null>(`/locations/geocode?${new URLSearchParams({ address })}`, null),
  reverseGeocode: (latitude: number, longitude: number) =>
    getJson<ReverseGeocodeResult | null>(
      `/locations/reverse-geocode?${new URLSearchParams({ latitude: String(latitude), longitude: String(longitude) })}`,
      null,
    ),
  restaurants: (provinceCode: string, areaCode: string, latitude?: number, longitude?: number) => {
    if (latitude === undefined || longitude === undefined) return Promise.resolve([]);

    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      radius: String(nearbyRadiusKm),
    });

    const nearbyParams = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      radiusKm: String(nearbyRadiusKm),
      provinceCode,
      areaCode,
    });

    return getJson<NearbyPlace[] | null>(`/locations/nearby-places?${nearbyParams}`, null, 12000).then(async (places) => {
      if (places && places.length > 0) return places;

      const items = await getJson<BackendRestaurant[] | null>(`/restaurants/nearby?${params}`, null, 8000);
      if (items === null) return [];
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
