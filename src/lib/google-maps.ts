import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import type { Coordinates, Restaurant } from "@/types/location";

let configured = false;
let autocompleteSessionToken: google.maps.places.AutocompleteSessionToken | null = null;

export function hasGoogleMapsKey() {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
}

export function configureGoogleMaps() {
  // The official loader must be configured only once, even under React Strict Mode.
  if (!configured) {
    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
      v: "weekly",
      language: "vi",
      region: "VN",
    });
    configured = true;
  }
}

export async function loadMapsLibraries() {
  configureGoogleMaps();
  const [maps, marker] = await Promise.all([
    importLibrary("maps") as Promise<google.maps.MapsLibrary>,
    importLibrary("marker") as Promise<google.maps.MarkerLibrary>,
  ]);
  return { maps, marker };
}

export async function geocodeAddress(address: string) {
  configureGoogleMaps();
  const { Geocoder } = await importLibrary("geocoding") as google.maps.GeocodingLibrary;
  const response = await new Geocoder().geocode({ address, componentRestrictions: { country: "VN" } });
  const location = response.results[0]?.geometry.location;
  if (!location) throw new Error("Không tìm thấy địa chỉ này.");
  return { lat: location.lat(), lng: location.lng(), formattedAddress: response.results[0].formatted_address };
}

export async function reverseGeocodeLocation(location: Coordinates) {
  configureGoogleMaps();
  const { Geocoder } = await importLibrary("geocoding") as google.maps.GeocodingLibrary;
  const response = await new Geocoder().geocode({ location });
  const result = response.results[0];
  if (!result) throw new Error("Không tìm thấy địa chỉ tại vị trí này.");
  return result.formatted_address;
}

export type AddressSuggestion = {
  id: string;
  label: string;
  prediction: google.maps.places.PlacePrediction;
};

export async function getAddressSuggestions(input: string, center: Coordinates) {
  configureGoogleMaps();
  const { AutocompleteSessionToken, AutocompleteSuggestion } = await importLibrary("places") as google.maps.PlacesLibrary;
  // Reuse one token while the user types so Google bills this as one autocomplete session.
  autocompleteSessionToken ??= new AutocompleteSessionToken();
  const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input,
    includedRegionCodes: ["vn"],
    language: "vi",
    region: "VN",
    locationBias: { center, radius: 50_000 },
    sessionToken: autocompleteSessionToken,
  });

  return suggestions.flatMap<AddressSuggestion>((suggestion) => {
    const prediction = suggestion.placePrediction;
    return prediction ? [{ id: prediction.placeId, label: prediction.text.text, prediction }] : [];
  });
}

export async function resolveAddressSuggestion(suggestion: AddressSuggestion) {
  const place = suggestion.prediction.toPlace();
  await place.fetchFields({ fields: ["formattedAddress", "location"] });
  autocompleteSessionToken = null;
  if (!place.location) throw new Error("Địa chỉ chưa có tọa độ.");
  return {
    lat: place.location.lat(),
    lng: place.location.lng(),
    formattedAddress: place.formattedAddress ?? suggestion.label,
  };
}

export async function searchVegetarianPlaces(center: Coordinates, provinceCode: string, areaCode: string) {
  configureGoogleMaps();
  const { Place } = await importLibrary("places") as google.maps.PlacesLibrary;
  const { places } = await Place.searchByText({
    textQuery: "nhà hàng chay vegan vegetarian",
    fields: ["id", "displayName", "formattedAddress", "location", "rating", "userRatingCount", "primaryTypeDisplayName"],
    includedType: "restaurant",
    language: "vi",
    region: "VN",
    locationBias: { center, radius: 15_000 },
    maxResultCount: 20,
  });

  return places.flatMap<Restaurant>((place) => {
    if (!place.location) return [];
    return [{
      id: `google-${place.id}`,
      name: place.displayName ?? "Địa điểm chay",
      category: place.primaryTypeDisplayName ?? "Vegetarian",
      address: place.formattedAddress ?? "Chưa có địa chỉ",
      provinceCode,
      areaCode,
      latitude: place.location.lat(),
      longitude: place.location.lng(),
      rating: place.rating ?? 0,
      reviewCount: place.userRatingCount ?? 0,
    }];
  });
}
