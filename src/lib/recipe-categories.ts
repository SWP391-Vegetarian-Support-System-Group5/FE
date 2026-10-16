import { apiGet } from "@/lib/api";

export const CATEGORY_TYPES = ["MEAL_TYPE", "CUISINE", "DISH_TYPE", "LIFESTYLE", "DIETARY_TYPE"] as const;
export interface RecipeCategory {
  id: number; name: string; slug: string; type: string;
  description: string | null; imageUrl: string | null; isActive: boolean; createdAt: string;
}
export function getRecipeCategories(includeInactive = false) {
  return apiGet<RecipeCategory[]>(`/api/recipe-categories${includeInactive ? "?includeInactive=true" : ""}`);
}
export const categoryTypeLabels: Record<string, [string, string]> = {
  MEAL_TYPE: ["Meal type", "Bữa ăn"], CUISINE: ["Cuisine", "Ẩm thực"], DISH_TYPE: ["Dish type", "Loại món"],
  LIFESTYLE: ["Lifestyle", "Phong cách ăn uống"], DIETARY_TYPE: ["Dietary type", "Kiểu ăn chay"]
};
const names: Record<string, string> = {
  "Breakfast": "Bữa sáng", "Lunch": "Bữa trưa", "Dinner": "Bữa tối", "Snack": "Bữa phụ", "Dessert": "Tráng miệng",
  "Vietnamese": "Việt Nam", "Japanese": "Nhật Bản", "Korean": "Hàn Quốc", "Thai": "Thái Lan", "Indian": "Ấn Độ", "Chinese": "Trung Quốc", "Italian": "Ý", "Mediterranean": "Địa Trung Hải", "Mexican": "Mexico", "Western": "Phương Tây",
  "Salad": "Salad", "Soup": "Canh / súp", "Main Course": "Món chính", "Side Dish": "Món ăn kèm", "Pasta & Noodles": "Mì / bún", "Rice & Grain Bowls": "Cơm / ngũ cốc", "Sandwich & Wrap": "Bánh mì / món cuốn", "Smoothies & Drinks": "Sinh tố / đồ uống", "Baked Goods": "Bánh nướng",
  "Quick & Easy": "Nhanh và dễ", "High Protein": "Giàu đạm", "Meal Prep": "Chuẩn bị bữa ăn", "Budget-Friendly": "Tiết kiệm", "Low Carb": "Ít tinh bột", "One-Pot Meals": "Món nấu một nồi", "Weight Management": "Quản lý cân nặng",
  "Vegan": "Thuần chay", "Lacto-Vegetarian": "Chay có sữa", "Ovo-Vegetarian": "Chay có trứng", "Lacto-Ovo Vegetarian": "Chay có trứng và sữa"
};
export function categoryName(category: Pick<RecipeCategory, "name">, language: string) { return language === "vi" ? names[category.name] || category.name : category.name; }
