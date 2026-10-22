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

export const DEFAULT_RECIPE_CATEGORIES: CategoryData[] = [
  {
    id: 1,
    name: "Vietnamese Cuisine",
    nameVi: "Ẩm thực Chay Việt Nam",
    slug: "vietnamese-cuisine",
    type: "Recipe Category",
    description: "Phở chay, bún bò Huế thanh tịnh, bánh xèo giòn, chả giò nấm.",
    itemCount: 520,
    status: "Active",
    badgeType: "flag-vn",
    updatedAt: "Today, 09:20",
  },
  {
    id: 2,
    name: "Japanese Washoku",
    nameVi: "Ẩm thực Chay Nhật Bản",
    slug: "japanese-washoku",
    type: "Recipe Category",
    description: "Shojin Ryori temple style, miso ramen, vegetable tempura, vegan sushi.",
    itemCount: 340,
    status: "Active",
    badgeType: "flag-jp",
    updatedAt: "Yesterday",
  },
  {
    id: 3,
    name: "Mediterranean & European",
    nameVi: "Địa Trung Hải & Châu Âu",
    slug: "mediterranean-cuisine",
    type: "Recipe Category",
    description: "Extra-virgin olive oil mezze, falafel, Greek salads, ratatouille.",
    itemCount: 280,
    status: "Active",
    badgeType: "globe-eu",
    updatedAt: "12 Mar 2026",
  },
  {
    id: 4,
    name: "Thai & Southeast Asian",
    nameVi: "Thái Lan & Đông Nam Á",
    slug: "thai-southeast-asia",
    type: "Recipe Category",
    description: "Vegan Tom Yum, coconut Green Curry, Pad Thai with tofu, lemongrass broths.",
    itemCount: 195,
    status: "Active",
    badgeType: "text-th",
    updatedAt: "10 Mar 2026",
  },
  {
    id: 5,
    name: "Italian Plant-Based",
    nameVi: "Ẩm thực Ý Thuần Chay",
    slug: "italian-european",
    type: "Recipe Category",
    description: "Artisanal hand-rolled pasta, wild mushroom risotto, cashew pomodoro.",
    itemCount: 165,
    status: "Active",
    badgeType: "text-it",
    updatedAt: "08 Mar 2026",
  },
  {
    id: 6,
    name: "Indian & South Asian",
    nameVi: "Ấn Độ & Nam Á",
    slug: "indian-south-asian",
    type: "Recipe Category",
    description: "Fragrant dal tadka, coconut korma, tandoori tofu tikka, garlic naan.",
    itemCount: 142,
    status: "Active",
    badgeType: "text-in",
    updatedAt: "05 Mar 2026",
  },
];

export const DEFAULT_INGREDIENT_CATEGORIES: CategoryData[] = [
  {
    id: 101,
    name: "Plant-Based Proteins (Tofu, Tempeh)",
    nameVi: "Đạm thực vật (Đậu phụ, Tempeh, Seitan)",
    slug: "plant-based-proteins",
    type: "Ingredient Group",
    description: "Firm organic tofu, fermented tempeh, artisanal seitan, and creamy soy milk curd.",
    itemCount: 310,
    status: "Active",
    badgeType: "text-pr",
    updatedAt: "Today, 08:30",
  },
  {
    id: 102,
    name: "Fresh Vegetables & Greens",
    nameVi: "Rau củ hữu cơ tươi & Rau xanh",
    slug: "vegetables-greens",
    type: "Ingredient Group",
    description: "Seasonal organic farm greens, baby bok choy, water spinach, kale, and crisp salad greens.",
    itemCount: 450,
    status: "Active",
    badgeType: "text-vg",
    updatedAt: "Yesterday",
  },
  {
    id: 103,
    name: "Legumes & Pulses",
    nameVi: "Các loại đậu hạt dinh dưỡng & Mầm",
    slug: "legumes-pulses",
    type: "Ingredient Group",
    description: "Chickpeas, red split lentils, black beans, young edamame, and wholesome sprouted beans.",
    itemCount: 215,
    status: "Active",
    badgeType: "text-lg",
    updatedAt: "12 Mar 2026",
  },
  {
    id: 104,
    name: "Grains & Ancient Cereals",
    nameVi: "Ngũ cốc nguyên hạt & Gạo lứt",
    slug: "grains-cereals",
    type: "Ingredient Group",
    description: "Brown jasmine rice, pearl quinoa, rolled oats, buckwheat groats, and wholewheat pastas.",
    itemCount: 180,
    status: "Active",
    badgeType: "text-gr",
    updatedAt: "10 Mar 2026",
  },
  {
    id: 105,
    name: "Forest & Exotic Mushrooms",
    nameVi: "Các loại nấm tươi & Nấm rừng",
    slug: "forest-mushrooms",
    type: "Ingredient Group",
    description: "King oyster, shiitake, wood ear, enoki, and portobello savory umami preparations.",
    itemCount: 160,
    status: "Active",
    badgeType: "text-ms",
    updatedAt: "08 Mar 2026",
  },
  {
    id: 106,
    name: "Herbs, Spices & Aromatics",
    nameVi: "Gia vị thảo mộc thơm lành",
    slug: "herbs-spices",
    type: "Ingredient Group",
    description: "Lemongrass stalks, fresh ginger root, turmeric, fragrant Thai basil, star anise, and cinnamon.",
    itemCount: 125,
    status: "Active",
    badgeType: "text-hb",
    updatedAt: "04 Mar 2026",
  },
];

export const SAMPLE_DISHES: DishItem[] = [
  { id: 1, title: "Phở nấm chay thanh vị", titleVi: "Phở nấm chay thanh vị Hà Nội", recipeCategorySlug: "vietnamese-cuisine", ingredientGroupSlug: "plant-based-proteins", prepTime: "30 mins", difficulty: "Medium", status: "Published", rating: 4.9 },
  { id: 2, title: "Bún bò Huế chay sa tế đậu hũ", titleVi: "Bún bò Huế chay sa tế đậu hũ", recipeCategorySlug: "vietnamese-cuisine", ingredientGroupSlug: "plant-based-proteins", prepTime: "40 mins", difficulty: "Medium", status: "Published", rating: 4.8 },
  { id: 3, title: "Đậu phụ sốt cà chua & nấm rơm", titleVi: "Đậu phụ sốt cà chua & nấm rơm", recipeCategorySlug: "vietnamese-cuisine", ingredientGroupSlug: "plant-based-proteins", prepTime: "20 mins", difficulty: "Easy", status: "Published", rating: 4.9 },
  { id: 4, title: "Bánh xèo giòn nhân nấm đậu hũ", titleVi: "Bánh xèo giòn rụm nhân nấm", recipeCategorySlug: "vietnamese-cuisine", ingredientGroupSlug: "plant-based-proteins", prepTime: "35 mins", difficulty: "Medium", status: "Published", rating: 4.7 },
  { id: 5, title: "Chả giò chay nhân khoai môn nấm", titleVi: "Chả giò chay giòn rụm", recipeCategorySlug: "vietnamese-cuisine", ingredientGroupSlug: "plant-based-proteins", prepTime: "45 mins", difficulty: "Medium", status: "Published", rating: 4.8 },
  { id: 6, title: "Gỏi cuốn đậu hũ bơ sốt tương", titleVi: "Gỏi cuốn đậu hũ bơ sốt tương mè", recipeCategorySlug: "vietnamese-cuisine", ingredientGroupSlug: "plant-based-proteins", prepTime: "25 mins", difficulty: "Easy", status: "Published", rating: 4.9 },
  { id: 7, title: "Cơm chiên trái thơm hạt sen hạt đậu", titleVi: "Cơm chiên trái thơm hạt sen", recipeCategorySlug: "vietnamese-cuisine", ingredientGroupSlug: "plant-based-proteins", prepTime: "25 mins", difficulty: "Easy", status: "Published", rating: 4.6 },
  { id: 8, title: "Canh chua chay đậu phụ bắp non", titleVi: "Canh chua chay Nam Bộ", recipeCategorySlug: "vietnamese-cuisine", ingredientGroupSlug: "plant-based-proteins", prepTime: "30 mins", difficulty: "Easy", status: "Published", rating: 4.8 },
  { id: 9, title: "Đậu hũ kho nấm hương tiêu xanh", titleVi: "Đậu hũ kho nấm hương tiêu xanh", recipeCategorySlug: "vietnamese-cuisine", ingredientGroupSlug: "plant-based-proteins", prepTime: "25 mins", difficulty: "Easy", status: "Published", rating: 4.9 },
  { id: 10, title: "Mì Quảng chay nước dùng thanh", titleVi: "Mì Quảng chay sợi vàng", recipeCategorySlug: "vietnamese-cuisine", ingredientGroupSlug: "plant-based-proteins", prepTime: "35 mins", difficulty: "Medium", status: "Published", rating: 4.7 },
  { id: 11, title: "Bún riêu chay đậu hũ cà chua", titleVi: "Bún riêu chay sữa hạt", recipeCategorySlug: "vietnamese-cuisine", ingredientGroupSlug: "plant-based-proteins", prepTime: "40 mins", difficulty: "Medium", status: "Published", rating: 4.8 },
  { id: 12, title: "Nấm đùi gà áp chảo sốt tiêu đen", titleVi: "Nấm đùi gà áp chảo tempeh", recipeCategorySlug: "vietnamese-cuisine", ingredientGroupSlug: "plant-based-proteins", prepTime: "20 mins", difficulty: "Easy", status: "Published", rating: 4.9 },
  { id: 13, title: "Cà ri chay nước cốt dừa khoai lang", titleVi: "Cà ri chay béo bùi khoai lang", recipeCategorySlug: "vietnamese-cuisine", ingredientGroupSlug: "plant-based-proteins", prepTime: "35 mins", difficulty: "Medium", status: "Published", rating: 4.8 },
  { id: 14, title: "Bánh mì chay pate đậu nành chả nấm", titleVi: "Bánh mì chay giòn pate hạt", recipeCategorySlug: "vietnamese-cuisine", ingredientGroupSlug: "plant-based-proteins", prepTime: "15 mins", difficulty: "Easy", status: "Published", rating: 5.0 },
  { id: 15, title: "Lẩu nấm chay thanh đạm ngũ sắc", titleVi: "Lẩu nấm chay thanh đạm ngũ sắc", recipeCategorySlug: "vietnamese-cuisine", ingredientGroupSlug: "plant-based-proteins", prepTime: "50 mins", difficulty: "Advanced", status: "Published", rating: 4.9 },
  { id: 16, title: "Hủ tiếu Nam Vang chay", titleVi: "Hủ tiếu Nam Vang thanh ngọt", recipeCategorySlug: "vietnamese-cuisine", ingredientGroupSlug: "plant-based-proteins", prepTime: "35 mins", difficulty: "Medium", status: "Published", rating: 4.7 },
  { id: 17, title: "Súp bí đỏ đậu gà cốt dừa bùi béo", titleVi: "Súp bí đỏ đậu gà cốt dừa", recipeCategorySlug: "vietnamese-cuisine", ingredientGroupSlug: "plant-based-proteins", prepTime: "25 mins", difficulty: "Easy", status: "Published", rating: 4.8 },
  { id: 18, title: "Chả lụa chay hấp lá chuối truyền thống", titleVi: "Chả lụa chay hấp lá chuối", recipeCategorySlug: "vietnamese-cuisine", ingredientGroupSlug: "plant-based-proteins", prepTime: "40 mins", difficulty: "Medium", status: "Published", rating: 4.9 },
];
