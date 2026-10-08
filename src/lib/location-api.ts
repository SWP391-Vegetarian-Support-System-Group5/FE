import { fallbackAreas, fallbackRestaurants, vietnamProvinces } from "@/lib/location-data";
import type { Area, Coordinates, Province, Restaurant } from "@/types/location";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

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

async function requestJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, { signal: AbortSignal.timeout(35000) });
  if (!response.ok) throw new Error(`API returned ${response.status}`);
  return (await response.json()) as T;
}

export type AddressSuggestion = {
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

export const locationApi = {
  provinces: () => getJson<Province[]>("/locations/provinces", vietnamProvinces),
  areas: (provinceCode: string) =>
    getJson<Area[]>(`/locations/provinces/${provinceCode}/areas`, fallbackAreas(provinceCode)),
  addressSuggestions: (query: string, center: Coordinates) => {
    const params = new URLSearchParams({
      query,
      latitude: String(center.lat),
      longitude: String(center.lng),
    });
    return requestJson<AddressSuggestion[]>(`/locations/address-suggestions?${params}`);
  },
  geocode: (address: string) =>
    requestJson<GeocodeResult>(`/locations/geocode?${new URLSearchParams({ address })}`),
  reverseGeocode: (coordinates: Coordinates) => {
    const params = new URLSearchParams({
      latitude: String(coordinates.lat),
      longitude: String(coordinates.lng),
    });
    return requestJson<{ formattedAddress: string }>(`/locations/reverse-geocode?${params}`)
      .then((result) => result.formattedAddress);
  },
  nearbyPlaces: (coordinates: Coordinates, provinceCode: string, areaCode: string) => {
    const params = new URLSearchParams({
      latitude: String(coordinates.lat),
      longitude: String(coordinates.lng),
      radiusKm: "15",
      provinceCode,
      areaCode,
    });
    return requestJson<NearbyPlace[]>(`/locations/nearby-places?${params}`) as Promise<Restaurant[]>;
  },
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
