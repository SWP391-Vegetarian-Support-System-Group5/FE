"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import UiText, { useUiText } from "@/components/UiText";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { getCategories } from "@/lib/recipe-api";

export interface CategoryData {
  id: number;
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
  recipeCategorySlug: string;
  ingredientGroupSlug: string;
  prepTime: string;
  difficulty: "Easy" | "Medium" | "Advanced";
  status: "Published" | "Draft";
  rating: number;
}

const DEFAULT_RECIPE_CATEGORIES: CategoryData[] = [
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

const DEFAULT_INGREDIENT_CATEGORIES: CategoryData[] = [
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

const SAMPLE_DISHES: DishItem[] = [
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

export default function AdminCategoriesPage() {
  const ui = useUiText();
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();

  // Tab State: "recipes" | "ingredients" | "dual-dishes"
  const [activeTab, setActiveTab] = useState<"recipes" | "ingredients" | "dual-dishes">("recipes");

  // Search input top right of tab row
  const [categorySearchQuery, setCategorySearchQuery] = useState("");

  // Dual Category Filter States
  const [selectedRecipeCategory, setSelectedRecipeCategory] = useState("vietnamese-cuisine");
  const [selectedIngredientCategory, setSelectedIngredientCategory] = useState("plant-based-proteins");
  const [dishSearchQuery, setDishSearchQuery] = useState("");

  // Top header admin search
  const [topAdminSearch, setTopAdminSearch] = useState("");

  // Category Lists
  const [recipeCategories, setRecipeCategories] = useState<CategoryData[]>(DEFAULT_RECIPE_CATEGORIES);
  const [ingredientCategories, setIngredientCategories] = useState<CategoryData[]>(DEFAULT_INGREDIENT_CATEGORIES);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formNameVi, setFormNameVi] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formType, setFormType] = useState<"Recipe Category" | "Ingredient Group">("Recipe Category");
  const [formDescription, setFormDescription] = useState("");
  const [formItemCount, setFormItemCount] = useState(0);
  const [formBadgeType, setFormBadgeType] = useState<CategoryData["badgeType"]>("flag-vn");
  const [formStatus, setFormStatus] = useState<"Active" | "Hidden">("Active");

  // Feedback Notification Toast
  const [feedback, setFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Sync with API backend if available
  useEffect(() => {
    let isMounted = true;
    async function loadApi() {
      try {
        const apiData = await getCategories();
        if (isMounted && apiData && apiData.length > 0) {
          // Merge safely without wiping styled defaults
        }
      } catch {
        // Fallback default maintained
      }
    }
    loadApi();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter Categories based on active tab and categorySearchQuery
  const currentCategoryList = activeTab === "recipes" ? recipeCategories : ingredientCategories;
  const filteredCategories = useMemo(() => {
    if (!categorySearchQuery.trim()) return currentCategoryList;
    const q = categorySearchQuery.toLowerCase();
    return currentCategoryList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameVi.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [currentCategoryList, categorySearchQuery]);

  // Filter Dishes for Dual Filter
  const filteredDishes = useMemo(() => {
    return SAMPLE_DISHES.filter((d) => {
      const matchRecipe =
        !selectedRecipeCategory || selectedRecipeCategory === "all" || d.recipeCategorySlug === selectedRecipeCategory;
      const matchIngredient =
        !selectedIngredientCategory || selectedIngredientCategory === "all" || d.ingredientGroupSlug === selectedIngredientCategory;
      const matchQuery =
        !dishSearchQuery.trim() ||
        d.title.toLowerCase().includes(dishSearchQuery.toLowerCase()) ||
        d.titleVi.toLowerCase().includes(dishSearchQuery.toLowerCase());
      return matchRecipe && matchIngredient && matchQuery;
    });
  }, [selectedRecipeCategory, selectedIngredientCategory, dishSearchQuery]);

  const activeRecipeCount = recipeCategories.filter((c) => c.status === "Active").length;
  const activeIngredientCount = ingredientCategories.filter((c) => c.status === "Active").length;

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormName("");
    setFormNameVi("");
    setFormSlug("");
    setFormType(activeTab === "ingredients" ? "Ingredient Group" : "Recipe Category");
    setFormDescription("");
    setFormItemCount(0);
    setFormBadgeType(activeTab === "ingredients" ? "text-pr" : "flag-vn");
    setFormStatus("Active");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: CategoryData) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormNameVi(cat.nameVi);
    setFormSlug(cat.slug);
    setFormType(cat.type);
    setFormDescription(cat.description);
    setFormItemCount(cat.itemCount);
    setFormBadgeType(cat.badgeType);
    setFormStatus(cat.status);
    setIsModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const payload: CategoryData = {
      id: editingCategory ? editingCategory.id : Date.now(),
      name: formName.trim(),
      nameVi: formNameVi.trim() || formName.trim(),
      slug: formSlug.trim() || formName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      type: formType,
      description: formDescription.trim(),
      itemCount: formItemCount,
      status: formStatus,
      badgeType: formBadgeType,
      updatedAt: "Just now",
    };

    if (formType === "Recipe Category") {
      setRecipeCategories((prev) => {
        if (editingCategory) {
          return prev.map((item) => (item.id === editingCategory.id ? payload : item));
        }
        return [payload, ...prev];
      });
    } else {
      setIngredientCategories((prev) => {
        if (editingCategory) {
          return prev.map((item) => (item.id === editingCategory.id ? payload : item));
        }
        return [payload, ...prev];
      });
    }

    showToast(
      editingCategory
        ? `Updated category "${formName}" successfully!`
        : `Created new category "${formName}" successfully!`
    );
    setIsModalOpen(false);
  };

  const handleToggleStatus = (cat: CategoryData) => {
    const nextStatus: CategoryData["status"] = cat.status === "Active" ? "Hidden" : "Active";
    const updateFn = (list: CategoryData[]): CategoryData[] =>
      list.map((c) => (c.id === cat.id ? { ...c, status: nextStatus, updatedAt: "Just now" } : c));

    if (cat.type === "Recipe Category") {
      setRecipeCategories(updateFn);
    } else {
      setIngredientCategories(updateFn);
    }
    showToast(`Category "${cat.name}" is now ${nextStatus}`);
  };

  const handleDeleteCategory = (id: number, name: string, type: "Recipe Category" | "Ingredient Group") => {
    if (confirm(`Are you sure you want to delete category "${name}"?`)) {
      if (type === "Recipe Category") {
        setRecipeCategories((prev) => prev.filter((c) => c.id !== id));
      } else {
        setIngredientCategories((prev) => prev.filter((c) => c.id !== id));
      }
      showToast(`Deleted category "${name}"`);
    }
  };

  const handleResetFilters = () => {
    setSelectedRecipeCategory("vietnamese-cuisine");
    setSelectedIngredientCategory("plant-based-proteins");
    setDishSearchQuery("");
    showToast("Dual filters reset to default");
  };

  // Badge icon renderer matching screenshot accurately
  const renderBadgeIcon = (badgeType: CategoryData["badgeType"], name: string) => {
    switch (badgeType) {
      case "flag-vn":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D8232A] text-yellow-300 shadow-xs">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
            </svg>
          </div>
        );
      case "flag-jp":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E6E3DA] bg-white shadow-xs">
            <span className="h-4 w-4 rounded-full bg-[#D8232A]" />
          </div>
        );
      case "globe-eu":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D3EFE0] text-[#1E744D] shadow-xs">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
        );
      case "text-th":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1A2E72] text-[11px] font-bold tracking-wider text-white shadow-xs">
            TH
          </div>
        );
      case "text-it":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0D7747] text-[11px] font-bold tracking-wider text-white shadow-xs">
            IT
          </div>
        );
      case "text-in":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B] text-[11px] font-bold tracking-wider text-white shadow-xs">
            IN
          </div>
        );
      case "text-pr":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B] text-[11px] font-bold tracking-wider text-white shadow-xs">
            PR
          </div>
        );
      case "text-vg":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#10B981] text-[11px] font-bold tracking-wider text-white shadow-xs">
            VG
          </div>
        );
      case "text-lg":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6] text-[11px] font-bold tracking-wider text-white shadow-xs">
            LG
          </div>
        );
      case "text-gr":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAB308] text-[11px] font-bold tracking-wider text-white shadow-xs">
            GR
          </div>
        );
      case "text-ms":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#78350F] text-[11px] font-bold tracking-wider text-white shadow-xs">
            MS
          </div>
        );
      case "text-hb":
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#14B8A6] text-[11px] font-bold tracking-wider text-white shadow-xs">
            HB
          </div>
        );
      default:
        return (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8E6DF] text-xs font-bold text-[#1E3A2F] shadow-xs">
            {name.substring(0, 2).toUpperCase()}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ── TOP BAR HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 border-b border-[#EFEEEB] pb-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Breadcrumb: VeggieMate Logo & Admin Area Pill */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0B1E17] text-white shadow-xs">
            {/* Botanical sunburst flower emblem */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3.5" />
              <path d="M12 2v2.5" />
              <path d="M12 19.5V22" />
              <path d="m4.93 4.93 1.77 1.77" />
              <path d="m17.3 17.3 1.77 1.77" />
              <path d="M2 12h2.5" />
              <path d="M19.5 12H22" />
              <path d="m6.7 17.3-1.77 1.77" />
              <path d="m19.07 4.93-1.77 1.77" />
            </svg>
          </div>

          <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-[#07241A] transition hover:opacity-85">
            VeggieMate
          </Link>

          <span className="text-[#A0A5A1]">/</span>

          <div className="flex items-center gap-1.5 rounded-full border border-[#E3E1DB] bg-white px-3 py-1 text-xs font-semibold text-[#424844] shadow-xs">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1E3A2F]">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            </svg>
            <span><UiText text="Admin Area" /></span>
          </div>
        </div>

        {/* Right Search, Language & Supervisor Avatar */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Search Admin input */}
          <div className="relative">
            <input
              type="text"
              value={topAdminSearch}
              onChange={(e) => setTopAdminSearch(e.target.value)}
              placeholder={ui("Search admin...")}
              className="w-56 rounded-full border border-[#E3E1DB] bg-white py-1.5 pl-8 pr-4 text-xs font-medium text-[#07241A] placeholder-[#9CA3AF] shadow-2xs outline-none transition focus:border-[#1E3A2F]"
            />
            <svg className="absolute left-2.5 top-2 text-[#727974]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>

          {/* Language Switch Pill */}
          <button
            type="button"
            onClick={() => setLanguage(language === "en" ? "vi" : "en")}
            className="flex items-center gap-1 rounded-full border border-[#E3E1DB] bg-white px-3 py-1.5 text-xs font-semibold text-[#07241A] shadow-2xs transition hover:bg-[#F5F3ED]"
          >
            <span>{language.toUpperCase()}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Supervisor Avatar & Role */}
          <div className="flex items-center gap-2 pl-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#CCE5D6] text-xs font-bold text-[#1E3A2F] shadow-xs">
              VM
            </div>
            <div className="text-left">
              <p className="text-xs font-bold leading-tight text-[#07241A]">
                {user?.fullName || "Admin"}
              </p>
              <p className="text-[11px] leading-tight text-[#727974]">
                <UiText text="Supervisor" />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TOAST FEEDBACK NOTIFICATION ──────────────────────────────────── */}
      {feedback && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span>{feedback}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-900">✕</button>
        </div>
      )}

      {/* ── PAGE TITLE & "+ Add Category" BUTTON ─────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#07241A] lg:text-4xl">
            <UiText text="Category Management" />
          </h1>
          <p className="mt-1 text-xs text-[#727974] lg:text-sm">
            <UiText text="Manage system categories for Recipes and Ingredients." />
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 rounded-xl bg-[#0B1E17] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#183B2F]"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span><UiText text="Add Category" /></span>
        </button>
      </div>

      {/* ── TABS & SEARCH CATEGORIES BAR ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left Segmented Pill Tabs */}
        <div className="flex items-center gap-1 rounded-2xl bg-[#EFECE6] p-1.5 shadow-2xs">
          {/* Tab 1: Category Recipes */}
          <button
            type="button"
            onClick={() => setActiveTab("recipes")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "recipes"
                ? "bg-white text-[#0B1E17] shadow-xs"
                : "text-[#6A736E] hover:text-[#0B1E17]"
            }`}
          >
            {/* Chef Pot / Recipe icon */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
              <line x1="6" y1="17" x2="18" y2="17" />
            </svg>
            <span><UiText text="Category Recipes" /> ({recipeCategories.length})</span>
          </button>

          {/* Tab 2: Category Ingredients */}
          <button
            type="button"
            onClick={() => setActiveTab("ingredients")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "ingredients"
                ? "bg-white text-[#0B1E17] shadow-xs"
                : "text-[#6A736E] hover:text-[#0B1E17]"
            }`}
          >
            {/* Leaf / Sprout icon */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
            <span><UiText text="Category Ingredients" /> ({ingredientCategories.length})</span>
          </button>

          {/* Tab 3: Dual Filter & Dishes */}
          <button
            type="button"
            onClick={() => setActiveTab("dual-dishes")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "dual-dishes"
                ? "bg-white text-[#0B1E17] shadow-xs"
                : "text-[#6A736E] hover:text-[#0B1E17]"
            }`}
          >
            {/* Sliders / Filter icon */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            <span><UiText text="Dual Filter & Dishes" /> ({filteredDishes.length})</span>
          </button>
        </div>

        {/* Right Search Input */}
        <div className="relative">
          <input
            type="text"
            value={categorySearchQuery}
            onChange={(e) => setCategorySearchQuery(e.target.value)}
            placeholder={ui("Search categories...")}
            className="w-full rounded-xl border border-[#E3E0D8] bg-white py-2 pl-9 pr-4 text-xs font-medium text-[#07241A] placeholder-[#9CA3AF] shadow-2xs outline-none transition focus:border-[#1E3A2F] sm:w-64 md:w-72"
          />
          <svg className="absolute left-3 top-2.5 text-[#9CA3AF]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
      </div>

      {/* ── DUAL CATEGORY FILTER & RECIPE EXPLORER CARD ───────────────────── */}
      <div className="rounded-2xl border border-[#E6E3DA] bg-[#FBF9F6] p-5 shadow-xs space-y-4">
        {/* Card Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* Soft Green Funnel Icon Container */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#DCEDE2] text-[#246B49] shadow-2xs">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#07241A]">
                <UiText text="Dual Category Filter & Recipe Explorer" />
              </h3>
              <p className="text-xs text-[#727974]">
                <UiText text="Cross-reference culinary regional styles with nutrition and pantry ingredient classifications" />
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Pill: 18 Dishes Matching Selection */}
            <button
              type="button"
              onClick={() => setActiveTab("dual-dishes")}
              className="flex items-center gap-1.5 rounded-full border border-[#CDE5D8] bg-[#E7F3EC] px-3.5 py-1.5 text-xs font-semibold text-[#1E4D36] transition hover:bg-[#DCEDE2]"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#1E4D36]" />
              <span>{filteredDishes.length} <UiText text="Dishes Matching Selection" /></span>
            </button>

            {/* Reset Filters Button */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-[#636C66] transition hover:bg-[#EFECE6] hover:text-[#07241A]"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span><UiText text="Reset Filters" /></span>
            </button>
          </div>
        </div>

        {/* Card Controls Grid: 3 columns */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Column 1: Category Recipes (Region/Style) */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#525B55]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
                <line x1="6" y1="17" x2="18" y2="17" />
              </svg>
              <span><UiText text="1. Category Recipes (Region/Style)" /></span>
            </label>
            <div className="relative">
              <select
                value={selectedRecipeCategory}
                onChange={(e) => setSelectedRecipeCategory(e.target.value)}
                className="w-full appearance-none rounded-xl border border-[#E3E1DB] bg-white px-3.5 py-2.5 pr-8 text-xs font-medium text-[#07241A] shadow-2xs outline-none transition focus:border-[#1E3A2F]"
              >
                {recipeCategories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name} ({cat.itemCount} recipes)
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#727974]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>

          {/* Column 2: Category Ingredients (Pantry / Group) */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#525B55]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              </svg>
              <span><UiText text="2. Category Ingredients (Pantry / Group)" /></span>
            </label>
            <div className="relative">
              <select
                value={selectedIngredientCategory}
                onChange={(e) => setSelectedIngredientCategory(e.target.value)}
                className="w-full appearance-none rounded-xl border border-[#E3E1DB] bg-white px-3.5 py-2.5 pr-8 text-xs font-medium text-[#07241A] shadow-2xs outline-none transition focus:border-[#1E3A2F]"
              >
                {ingredientCategories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#727974]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>

          {/* Column 3: Search Dishes or Ingredients */}
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#525B55]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <span><UiText text="Search Dishes or Ingredients" /></span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={dishSearchQuery}
                onChange={(e) => {
                  setDishSearchQuery(e.target.value);
                  if (activeTab !== "dual-dishes") {
                    // Stay on current tab, but users can see filtered count
                  }
                }}
                placeholder="e.g. Bún bò chay, Phở nấm, Tofu..."
                className="w-full rounded-xl border border-[#E3E1DB] bg-white py-2.5 pl-9 pr-3.5 text-xs font-medium text-[#07241A] placeholder-[#9CA3AF] shadow-2xs outline-none transition focus:border-[#1E3A2F]"
              />
              <svg className="absolute left-3 top-3 text-[#9CA3AF]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT: TABLE OR DUAL DISHES EXPLORER ──────────────────── */}
      {activeTab === "dual-dishes" ? (
        /* DUAL DISHES EXPLORER VIEW */
        <div className="overflow-hidden rounded-2xl border border-[#E6E3DA] bg-white shadow-xs">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#F0EFEB] px-6 py-4">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#1E3A2F]">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
              <h2 className="text-sm font-bold text-[#07241A]">
                <UiText text="Dual Filtered Dishes Explorer" />
              </h2>
              <span className="text-xs text-[#727974]">
                — <UiText text="Cross-referenced community recipe database" />
              </span>
            </div>

            <span className="rounded-full bg-[#DCEDE2] px-3 py-1 text-xs font-bold text-[#1E4D36]">
              {filteredDishes.length} <UiText text="Dishes Found" />
            </span>
          </div>

          {/* Dishes Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#F0EFEB] bg-[#FAF9F5] text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                <tr>
                  <th className="py-3.5 pl-6 pr-4"><UiText text="Dish / Recipe" /></th>
                  <th className="px-4 py-3.5"><UiText text="Cuisine Category" /></th>
                  <th className="px-4 py-3.5"><UiText text="Pantry Group" /></th>
                  <th className="px-4 py-3.5"><UiText text="Prep & Cook" /></th>
                  <th className="px-4 py-3.5"><UiText text="Rating" /></th>
                  <th className="px-4 py-3.5"><UiText text="Status" /></th>
                  <th className="py-3.5 pl-4 pr-6 text-right"><UiText text="Actions" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEB]">
                {filteredDishes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-[#727974]">
                      <p className="font-semibold text-[#07241A]"><UiText text="No dishes match the selected dual filters." /></p>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-2 text-xs font-semibold text-[#1E3A2F] underline hover:text-[#2A4E40]"
                      >
                        <UiText text="Reset dual filters" />
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredDishes.map((dish) => {
                    const rCat = recipeCategories.find((r) => r.slug === dish.recipeCategorySlug);
                    const iCat = ingredientCategories.find((i) => i.slug === dish.ingredientGroupSlug);
                    return (
                      <tr key={dish.id} className="transition-colors hover:bg-[#FAF9F5]/70">
                        <td className="py-3.5 pl-6 pr-4">
                          <div className="font-bold text-[#07241A]">{dish.title}</div>
                          <div className="text-[11px] text-[#727974]">{dish.titleVi}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-block rounded-md border border-[#CDE5D8] bg-[#E7F3EC] px-2.5 py-0.5 text-[11px] font-semibold text-[#1E4D36]">
                            {rCat?.name || dish.recipeCategorySlug}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-block rounded-md border border-[#F2DEB0] bg-[#FEF7E6] px-2.5 py-0.5 text-[11px] font-semibold text-[#925B08]">
                            {iCat?.name || dish.ingredientGroupSlug}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[#525B55]">
                          {dish.prepTime} • <span className="font-medium text-[#727974]">{dish.difficulty}</span>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-[#07241A]">
                          ★ {dish.rating}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F3EC] px-2.5 py-0.5 text-xs font-semibold text-[#1E4D36]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#1E4D36]" />
                            {dish.status}
                          </span>
                        </td>
                        <td className="py-3.5 pl-4 pr-6 text-right">
                          <button
                            type="button"
                            onClick={() => showToast(`Viewing recipe: ${dish.title}`)}
                            className="rounded-lg p-1.5 text-[#6D7570] transition hover:bg-[#F2EFE9] hover:text-[#07241A]"
                            title="View recipe"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CATEGORIES TABLE VIEW (Tab 1: Category Recipes OR Tab 2: Category Ingredients) */
        <div className="overflow-hidden rounded-2xl border border-[#E6E3DA] bg-white shadow-xs">
          {/* Section Sub-header */}
          <div className="flex items-center justify-between border-b border-[#F0EFEB] px-6 py-4">
            <div className="flex items-center gap-2">
              {activeTab === "recipes" ? (
                /* Pot icon */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#1E3A2F]">
                  <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
                  <line x1="6" y1="17" x2="18" y2="17" />
                </svg>
              ) : (
                /* Leaf icon */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#1E3A2F]">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                </svg>
              )}
              <h2 className="text-sm font-bold text-[#07241A]">
                <UiText text={activeTab === "recipes" ? "Category Recipes" : "Category Ingredients"} />
              </h2>
              <span className="text-xs text-[#727974]">
                —{" "}
                <UiText
                  text={
                    activeTab === "recipes"
                      ? "Organized for culinary discovery"
                      : "Pantry & nutrition classifications"
                  }
                />
              </span>
            </div>

            <span className="rounded-full bg-[#DCEDE2] px-3 py-1 text-xs font-bold text-[#1E4D36]">
              {activeTab === "recipes" ? activeRecipeCount : activeIngredientCount} <UiText text="Active" />
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#F0EFEB] bg-[#FAF9F5] text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                <tr>
                  <th className="py-3.5 pl-6 pr-4"><UiText text="Category Name" /></th>
                  <th className="px-4 py-3.5"><UiText text="Description & Highlights" /></th>
                  <th className="px-4 py-3.5"><UiText text="Associated Items" /></th>
                  <th className="px-4 py-3.5"><UiText text="Status" /></th>
                  <th className="py-3.5 pl-4 pr-6 text-right"><UiText text="Actions" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEB]">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-[#727974]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="text-3xl">🏷️</span>
                        <p className="font-semibold text-[#07241A]"><UiText text="No categories found matching your search." /></p>
                        <button
                          type="button"
                          onClick={handleOpenAddModal}
                          className="mt-2 text-xs font-semibold text-[#1E3A2F] underline hover:text-[#2A4E40]"
                        >
                          <UiText text="Create a new category" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => (
                    <tr key={cat.id} className="transition-colors hover:bg-[#FAF9F5]/80">
                      {/* CATEGORY NAME COLUMN */}
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex items-center gap-3.5">
                          {renderBadgeIcon(cat.badgeType, cat.name)}
                          <div>
                            <div className="font-bold text-[#07241A] text-sm leading-snug">{cat.name}</div>
                            <div className="font-mono text-[11px] text-[#727974] leading-tight">{cat.slug}</div>
                          </div>
                        </div>
                      </td>

                      {/* DESCRIPTION & HIGHLIGHTS COLUMN */}
                      <td className="px-4 py-4 max-w-md">
                        <p className="text-xs text-[#4E5651] leading-relaxed">{cat.description}</p>
                      </td>

                      {/* ASSOCIATED ITEMS COLUMN */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-bold text-sm text-[#07241A]">{cat.itemCount}</span>{" "}
                        <span className="text-xs text-[#727974]">recipes</span>
                      </td>

                      {/* STATUS COLUMN */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(cat)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                            cat.status === "Active"
                              ? "bg-[#E7F3EC] text-[#1E4D36] hover:bg-[#DCEDE2]"
                              : "bg-[#F1F0EB] text-[#727974] hover:bg-[#E6E4DC]"
                          }`}
                          title="Click to toggle status"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              cat.status === "Active" ? "bg-[#1E4D36]" : "bg-[#8D948F]"
                            }`}
                          />
                          <span>{cat.status}</span>
                        </button>
                      </td>

                      {/* ACTIONS COLUMN */}
                      <td className="py-4 pl-4 pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(cat)}
                            className="rounded-lg p-1.5 text-[#6D7570] transition hover:bg-[#F2EFE9] hover:text-[#07241A]"
                            title="Edit Category"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id, cat.name, cat.type)}
                            className="rounded-lg p-1.5 text-[#6D7570] transition hover:bg-red-50 hover:text-red-600"
                            title="Delete Category"
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL: CREATE / EDIT CATEGORY ─────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-[#EFEEEB] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-4">
              <h2 className="font-serif text-lg font-bold text-[#07241A]">
                {editingCategory ? ui("Edit Category") : ui("New Category")}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1.5 text-[#727974] hover:bg-[#F2EFE9] hover:text-[#07241A]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="mt-4 space-y-4">
              {/* Category Group Type */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                  <UiText text="Category Classification" /> *
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType("Recipe Category")}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      formType === "Recipe Category"
                        ? "border-[#1E3A2F] bg-[#1E3A2F] text-white"
                        : "border-[#EFEEEB] bg-[#FBF9F6] text-[#424844] hover:bg-white"
                    }`}
                  >
                    <UiText text="Recipe Category" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType("Ingredient Group")}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      formType === "Ingredient Group"
                        ? "border-[#1E3A2F] bg-[#1E3A2F] text-white"
                        : "border-[#EFEEEB] bg-[#FBF9F6] text-[#424844] hover:bg-white"
                    }`}
                  >
                    <UiText text="Ingredient Group" />
                  </button>
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                    <UiText text="Name (English)" /> *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vietnamese Cuisine"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (!editingCategory) {
                        setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                      }
                    }}
                    className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 text-xs font-semibold text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                    <UiText text="Name (Vietnamese)" />
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ẩm thực Chay Việt Nam"
                    value={formNameVi}
                    onChange={(e) => setFormNameVi(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 text-xs font-semibold text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white"
                  />
                </div>
              </div>

              {/* Slug & Associated Count */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                    <UiText text="URL Slug" /> *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="vietnamese-cuisine"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 font-mono text-xs text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                    <UiText text="Item Count" />
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formItemCount}
                    onChange={(e) => setFormItemCount(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 text-xs font-semibold outline-none focus:border-[#1E3A2F] focus:bg-white"
                  />
                </div>
              </div>

              {/* Badge Style Selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                  <UiText text="Badge Emblem Style" />
                </label>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {[
                    { id: "flag-vn", label: "VN Star" },
                    { id: "flag-jp", label: "JP Circle" },
                    { id: "globe-eu", label: "EU Globe" },
                    { id: "text-th", label: "TH" },
                    { id: "text-it", label: "IT" },
                    { id: "text-in", label: "IN" },
                    { id: "text-pr", label: "PR (Protein)" },
                    { id: "text-vg", label: "VG (Veggie)" },
                    { id: "text-lg", label: "LG (Legume)" },
                    { id: "text-gr", label: "GR (Grain)" },
                    { id: "text-ms", label: "MS (Mushroom)" },
                    { id: "text-hb", label: "HB (Herbs)" },
                  ].map((badge) => (
                    <button
                      key={badge.id}
                      type="button"
                      onClick={() => setFormBadgeType(badge.id as CategoryData["badgeType"])}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                        formBadgeType === badge.id
                          ? "border-[#1E3A2F] bg-[#1E3A2F] text-white"
                          : "border-[#EFEEEB] bg-[#FBF9F6] text-[#525B55] hover:bg-white"
                      }`}
                    >
                      <span>{badge.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                  <UiText text="Description & Highlights" />
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Phở chay, bún bò Huế thanh tịnh, bánh xèo giòn, chả giò nấm..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 text-xs text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white"
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="statusToggle"
                  checked={formStatus === "Active"}
                  onChange={(e) => setFormStatus(e.target.checked ? "Active" : "Hidden")}
                  className="h-4 w-4 rounded border-gray-300 text-[#1E3A2F] focus:ring-[#1E3A2F]"
                />
                <label htmlFor="statusToggle" className="text-xs font-semibold text-[#07241A]">
                  <UiText text="Active and visible across VeggieMate community" />
                </label>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-[#EFEEEB] pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[#EFEEEB] px-4 py-2 text-xs font-semibold text-[#424844] hover:bg-[#F2EFE9]"
                >
                  <UiText text="Cancel" />
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0B1E17] px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#183B2F]"
                >
                  {editingCategory ? ui("Save Changes") : ui("Create Category")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
