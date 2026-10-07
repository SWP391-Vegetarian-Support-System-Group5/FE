import type { Coordinates } from "@/types/location";

const storageKey = "veggiemate.living-location.v1";

export type LivingLocation = {
  provinceCode: string;
  areaCode: string;
  address: string;
  center: Coordinates;
};

export function readLivingLocation(): LivingLocation | null {
  try {
    const value = localStorage.getItem(storageKey);
    return value ? JSON.parse(value) as LivingLocation : null;
  } catch {
    return null;
  }
}

export function saveLivingLocation(location: LivingLocation) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(location));
  } catch {
    // Browsers may disable storage; location search should still remain usable.
  }
}
