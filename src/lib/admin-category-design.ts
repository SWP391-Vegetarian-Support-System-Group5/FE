// Original main-branch design fixtures, retained for design work; live screens use API data.
export interface CategoryData {
  id: number;
  categoryType?: string;
  imageUrl?: string | null;
  name: string;
  nameVi: string;
  slug: string;
  type: "Recipe Category" | "Ingredient Group";
  description: string;
  itemCount: number;
  status: "Active" | "Hidden";
  badgeType: "flag-vn" | "flag-jp" | "globe-eu" | "text-th" | "text-it" | "text-in" | "text-pr" | "text-vg" | "text-lg" | "text-gr" | "text-ms" | "text-hb" | "custom";
  customIcon?: string;
  updatedAt: string;
}

export interface DishItem {
  id: number;
  title: string;
  titleVi: string;
  recipeCategorySlugs?: string[];
  ingredientGroupSlugs?: string[];
  recipeCategorySlug: string;
  ingredientGroupSlug: string;
  prepTime: string;
  difficulty: "Easy" | "Medium" | "Advanced" | "—";
  status: "Published" | "Draft";
  rating: number;
}
