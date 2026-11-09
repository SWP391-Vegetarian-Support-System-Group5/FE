import { getUserAllergens, updateUserAllergens, type AllergenItem } from "@/lib/profile-api";
import { getStoredToken } from "@/lib/auth";

function selectionFromResponse(value: unknown): AllergenItem[] | null {
  if (!value || typeof value !== "object" || !("allergens" in value) || !Array.isArray(value.allergens)) return null;
  const items: AllergenItem[] = [];
  for (const item of value.allergens) {
    if (!item || typeof item !== "object") return null;
    const id = item.id ?? item.allergenId;
    if (!Number.isInteger(id) || id <= 0 || typeof item.name !== "string") return null;
    items.push({ allergenId: id, name: item.name });
  }
  return items;
}

export async function saveAllergenSelection(ids: number[]) {
  const expected = [...new Set(ids)].sort((a, b) => a - b);
  if (expected.some(id => !Number.isInteger(id) || id <= 0)) throw new Error("ALLERGEN_SELECTION_INVALID");
  const session = getStoredToken();
  if (!session) throw new Error("ALLERGEN_SESSION_CHANGED");
  const response: unknown = await updateUserAllergens(expected);
  if (getStoredToken() !== session) throw new Error("ALLERGEN_SESSION_CHANGED");
  const confirmed = selectionFromResponse(response);
  let items: AllergenItem[];
  let refreshed = true;
  try { items = await getUserAllergens(); }
  catch {
    if (!confirmed) throw new Error("ALLERGEN_SAVE_UNCONFIRMED");
    items = confirmed; refreshed = false;
  }
  if (getStoredToken() !== session) throw new Error("ALLERGEN_SESSION_CHANGED");
  const currentIds = [...new Set(items.map(item => item.allergenId))].sort((a, b) => a - b);
  const matchesRequested = currentIds.length === expected.length && currentIds.every((id, index) => id === expected[index]);
  return { items, refreshed, matchesRequested };
}
