import type { Coordinates, Restaurant } from "@/types/location";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
const PHOTON_URL = "https://photon.komoot.io";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

export type AddressSuggestion = {
  id: string;
  label: string;
  lat: number;
  lng: number;
};

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_id?: number;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    state?: string;
    country?: string;
  };
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", "Accept-Language": "vi", ...init?.headers },
  });
  if (!response.ok) throw new Error(`OpenStreetMap request failed (${response.status}).`);
  return response.json() as Promise<T>;
}

export async function getAddressSuggestions(input: string, center?: Coordinates) {
  const params = new URLSearchParams({
    q: input,
    limit: "5",
    lang: "vi",
  });
  if (center) {
    params.set("lat", String(center.lat));
    params.set("lon", String(center.lng));
  }
  // Photon supports type-ahead search; public Nominatim explicitly does not.
  const result = await fetchJson<{ features: PhotonFeature[] }>(`${PHOTON_URL}/api?${params}`);
  return result.features
    .filter((item) => item.properties.country === "Việt Nam" || item.properties.country === "Vietnam")
    .map<AddressSuggestion>((item, index) => {
      const properties = item.properties;
      const label = [
        [properties.housenumber, properties.street ?? properties.name].filter(Boolean).join(" "),
        properties.district,
        properties.city,
        properties.state,
        properties.country,
      ].filter(Boolean).join(", ");
      return {
        id: String(properties.osm_id ?? `${item.geometry.coordinates.join("-")}-${index}`),
        label,
        lat: item.geometry.coordinates[1],
        lng: item.geometry.coordinates[0],
      };
    });
}

export async function geocodeAddress(address: string) {
  const params = new URLSearchParams({
    q: address,
    format: "jsonv2",
    limit: "1",
    countrycodes: "vn",
    addressdetails: "1",
  });
  const results = await fetchJson<NominatimResult[]>(`${NOMINATIM_URL}/search?${params}`);
  const first = results[0];
  if (!first) throw new Error("Không tìm thấy địa chỉ này.");
  return { lat: Number(first.lat), lng: Number(first.lon), formattedAddress: first.display_name };
}

export async function reverseGeocodeLocation(location: Coordinates) {
  const params = new URLSearchParams({
    lat: String(location.lat),
    lon: String(location.lng),
    format: "jsonv2",
    zoom: "18",
  });
  const result = await fetchJson<{ display_name?: string }>(`${NOMINATIM_URL}/reverse?${params}`);
  if (!result.display_name) throw new Error("Không tìm thấy địa chỉ tại vị trí này.");
  return result.display_name;
}

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function distanceKm(from: Coordinates, to: Coordinates) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latDelta = radians(to.lat - from.lat);
  const lngDelta = radians(to.lng - from.lng);
  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(lngDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatOsmAddress(tags: Record<string, string>) {
  return [
    [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "),
    tags["addr:suburb"] ?? tags["addr:ward"],
    tags["addr:city"] ?? tags["addr:province"],
  ].filter(Boolean).join(", ") || "Chưa có địa chỉ trên OpenStreetMap";
}

export async function searchVegetarianPlaces(
  center: Coordinates,
  provinceCode: string,
  areaCode: string,
) {
  // Search only on demand and keep the radius modest to respect the public Overpass service.
  const query = `[out:json][timeout:25];(
    nwr["amenity"~"restaurant|cafe|fast_food"]["diet:vegetarian"="yes"](around:15000,${center.lat},${center.lng});
    nwr["amenity"~"restaurant|cafe|fast_food"]["diet:vegan"="yes"](around:15000,${center.lat},${center.lng});
    nwr["amenity"~"restaurant|cafe|fast_food"]["cuisine"~"vegetarian|vegan",i](around:15000,${center.lat},${center.lng});
  );out center tags;`;
  const body = new URLSearchParams({ data: query });
  const response = await fetchJson<{ elements: OverpassElement[] }>(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body,
  });

  const unique = new Map<string, Restaurant>();
  for (const element of response.elements) {
    const latitude = element.lat ?? element.center?.lat;
    const longitude = element.lon ?? element.center?.lon;
    if (latitude == null || longitude == null) continue;
    const tags = element.tags ?? {};
    const id = `osm-${element.type}-${element.id}`;
    unique.set(id, {
      id,
      name: tags.name ?? tags["name:vi"] ?? "Địa điểm chay",
      category: tags["diet:vegan"] === "yes" ? "Vegan" : "Vegetarian",
      address: formatOsmAddress(tags),
      provinceCode,
      areaCode,
      latitude,
      longitude,
      rating: 0,
      reviewCount: 0,
      distanceKm: Number(distanceKm(center, { lat: latitude, lng: longitude }).toFixed(1)),
    });
  }
  return [...unique.values()].sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}
