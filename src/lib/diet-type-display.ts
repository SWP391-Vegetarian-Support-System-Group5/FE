import type { DietTypeItem } from "@/lib/profile-api";
import type { Language } from "@/context/LanguageContext";

type DietCopy = {
  en: string;
  vi: string;
};

const dietCopies: Record<string, DietCopy> = {
  VEGAN: {
    en: "Vegan avoids meat, poultry, fish, seafood, eggs, dairy, honey, animal broth and gelatin. Meal planner only returns plant-based recipes.",
    vi: "Vegan không ăn thịt, gia cầm, cá, hải sản, trứng, sữa, mật ong, nước dùng từ động vật và gelatin. Meal planner chỉ trả món thuần thực vật.",
  },
  VEGETARIAN: {
    en: "Vegetarian is the broad meat-free option in this system: it avoids meat, poultry, fish, seafood, animal broth and gelatin, while allowing dairy, eggs and honey.",
    vi: "Vegetarian là kiểu ăn chay phổ thông trong hệ thống: không ăn thịt, gia cầm, cá, hải sản, nước dùng từ động vật và gelatin; vẫn có thể dùng sữa, trứng và mật ong.",
  },
  LACTO_VEGETARIAN: {
    en: "Lacto vegetarian avoids meat, poultry, fish, seafood, eggs, animal broth and gelatin, but allows dairy products such as milk, yogurt and cheese.",
    vi: "Lacto vegetarian không ăn thịt, gia cầm, cá, hải sản, trứng, nước dùng từ động vật và gelatin; nhưng dùng được sữa và chế phẩm từ sữa như sữa, sữa chua, phô mai.",
  },
  OVO_VEGETARIAN: {
    en: "Ovo vegetarian avoids meat, poultry, fish, seafood, dairy, animal broth and gelatin, but allows eggs.",
    vi: "Ovo vegetarian không ăn thịt, gia cầm, cá, hải sản, sữa và chế phẩm từ sữa, nước dùng từ động vật và gelatin; nhưng dùng được trứng.",
  },
  LACTO_OVO_VEGETARIAN: {
    en: "Lacto-ovo vegetarian avoids meat, poultry, fish, seafood, animal broth and gelatin, but allows both dairy products and eggs.",
    vi: "Lacto-ovo vegetarian không ăn thịt, gia cầm, cá, hải sản, nước dùng từ động vật và gelatin; nhưng dùng được cả sữa/chế phẩm từ sữa và trứng.",
  },
};

export function dietTypeAvoidsText(dietType: DietTypeItem | null | undefined, language: Language) {
  if (!dietType) {
    return language === "vi"
      ? "Chưa chọn kiểu ăn chay nên hệ thống chỉ lọc theo dị ứng đã lưu."
      : "No vegetarian type selected yet, so the system only filters saved allergens.";
  }

  const copy = dietCopies[dietType.name.toUpperCase()];
  if (copy) return copy[language];

  return language === "vi"
    ? `${dietType.name}: Meal planner sẽ lọc món theo cấu hình kiểu ăn chay và dị ứng đã lưu.`
    : `${dietType.name}: Meal planner filters recipes by this vegetarian type and saved allergens.`;
}

export function formatDietTypeName(name: string | null | undefined, language: Language = "en") {
  const vi: Record<string, string> = { VEGAN: "Thuần chay", VEGETARIAN: "Ăn chay", LACTO_VEGETARIAN: "Ăn chay có sữa", OVO_VEGETARIAN: "Ăn chay có trứng", LACTO_OVO_VEGETARIAN: "Ăn chay có sữa và trứng" };
  if (language === "vi" && name) return vi[name.toUpperCase()] ?? name;
  return name ? name.replaceAll("_", " ") : "";
}
