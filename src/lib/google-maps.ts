import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

let configured = false;

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
