"use client";

import { Fragment, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UiText, { useUiText } from "@/components/UiText";
import { getIngredientCategories, getIngredients, saveIngredientCategory, type IngredientItem, type RecipeResponse } from "@/lib/recipe-api";
import { localizeIngredient, localizeIngredientCategory, localizeRecipeTitle } from "@/lib/localized-content";
import { apiFetch, apiGet } from "@/lib/api";
import { CATEGORY_TYPES, categoryName, categoryTypeLabels, getRecipeCategories } from "@/lib/recipe-categories";

import type { CategoryData, DishItem } from "@/lib/admin-category-design";
import CategoryRecipeAssignments from "@/components/recipe/CategoryRecipeAssignments";
import { getAdminRecipeBmiTypes, getBmiTypes, type AdminRecipeBmi, type BmiType } from "@/lib/bmi-api";

function categorySlug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const ui = useUiText();

  // Tab State: "recipes" | "ingredients" | "dual-dishes"
  const [activeTab, setActiveTab] = useState<"recipes" | "ingredients" | "dual-dishes">("recipes");

  // Search input top right of tab row
  const [categorySearchQuery, setCategorySearchQuery] = useState("");

  // Dual Category Filter States
  const [selectedRecipeCategory, setSelectedRecipeCategory] = useState("all");
  const [selectedIngredientCategory, setSelectedIngredientCategory] = useState("all");
  const [dishSearchQuery, setDishSearchQuery] = useState("");

  const [topAdminSearch] = useState("");

  // Category Lists
  const [recipeCategories, setRecipeCategories] = useState<CategoryData[]>([]);
  const [ingredientCategories, setIngredientCategories] = useState<CategoryData[]>([]);
  const [allIngredients, setAllIngredients] = useState<IngredientItem[]>([]);

  const [dishes, setDishes] = useState<DishItem[]>([]);
  const [adminRecipes, setAdminRecipes] = useState<AdminRecipeBmi[]>([]);
  const [bmiTypes, setBmiTypes] = useState<BmiType[]>([]);
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formCategoryType, setFormCategoryType] = useState("CUISINE");
  const [formDietaryGroup, setFormDietaryGroup] = useState("PLANT");
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

  async function loadCatalog() {
    const [categories, groups, ingredients, recipes, allRecipes, types] = await Promise.all([
      getRecipeCategories(true), getIngredientCategories(), getIngredients(),
      apiGet<RecipeResponse[]>("/api/recipes/search"),
      getAdminRecipeBmiTypes(), getBmiTypes(),
    ]);
    setAdminRecipes(allRecipes);
    setAllIngredients(ingredients);
    setBmiTypes(types);
    setRecipeCategories(categories.map(c => ({
      id: c.id, name: c.name, nameVi: categoryName(c, "vi"), slug: c.slug,
      type: "Recipe Category", categoryType: c.type, imageUrl: c.imageUrl,
      description: c.description || "", itemCount: allRecipes.filter(r => r.categoryIds?.includes(c.id)).length,
      status: c.isActive ? "Active" : "Hidden", badgeType: "custom",
      updatedAt: new Date(c.createdAt).toLocaleDateString(),
    })));
    setIngredientCategories(groups.map(g => ({
      id: g.id, name: g.name, nameVi: localizeIngredientCategory(g.code, g.name), slug: g.code, type: "Ingredient Group", categoryType: g.dietaryGroup,
      description: g.dietaryGroup, itemCount: ingredients.filter(i => i.ingredientCategoryId === g.id).length,
      status: "Active", badgeType: "text-vg", updatedAt: "",
    })));
    const groupById = new Map(groups.map(group => [group.id, group.code]));
    setDishes(recipes.map(r => ({
      id: r.postId, title: r.recipeName, titleVi: localizeRecipeTitle(r.recipeName, "vi"),
      recipeCategorySlug: r.categories[0]?.slug || "",
      recipeCategorySlugs: r.categories.map(c => c.slug),
      ingredientGroupSlug: groupById.get(r.ingredients[0]?.ingredientCategoryId ?? -1) || r.ingredients[0]?.dietaryGroup || "",
      ingredientGroupSlugs: [...new Set(r.ingredients.map(i => groupById.get(i.ingredientCategoryId ?? -1) || i.dietaryGroup))],
      prepTime: r.prepMinutes != null ? String(r.prepMinutes) : "",
      difficulty: "—", status: "Published", rating: 0,
    })));
  }
  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      if (!active) return;
      try { await loadCatalog(); }
      catch { if (active) setError(ui("Could not load categories.")); }
      finally { if (active) setLoading(false); }
    });
    return () => { active = false; };
  }, [ui]);

  // Filter Categories based on active tab and categorySearchQuery
  const currentCategoryList = activeTab === "recipes" ? recipeCategories : ingredientCategories;
  const filteredCategories = useMemo(() => {
    if (!categorySearchQuery.trim() && !topAdminSearch.trim()) return currentCategoryList;
    const q = `${categorySearchQuery} ${topAdminSearch}`.trim().toLowerCase();
    return currentCategoryList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.nameVi.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [currentCategoryList, categorySearchQuery, topAdminSearch]);

  // Filter Dishes for Dual Filter
  const filteredDishes = useMemo(() => {
    return dishes.filter((d) => {
      const matchRecipe =
        !selectedRecipeCategory || selectedRecipeCategory === "all" || (d.recipeCategorySlugs || [d.recipeCategorySlug]).includes(selectedRecipeCategory);
      const matchIngredient =
        !selectedIngredientCategory || selectedIngredientCategory === "all" || (d.ingredientGroupSlugs || [d.ingredientGroupSlug]).includes(selectedIngredientCategory);
      const matchQuery =
        !dishSearchQuery.trim() ||
        d.title.toLowerCase().includes(dishSearchQuery.toLowerCase()) ||
        d.titleVi.toLowerCase().includes(dishSearchQuery.toLowerCase());
      return matchRecipe && matchIngredient && matchQuery;
    });
  }, [dishes, selectedRecipeCategory, selectedIngredientCategory, dishSearchQuery]);

  const activeRecipeCount = recipeCategories.filter((c) => c.status === "Active").length;
  const activeIngredientCount = ingredientCategories.filter((c) => c.status === "Active").length;

  const handleOpenAddModal = () => {
    setFormCategoryType("CUISINE");
    setFormDietaryGroup("PLANT");
    setEditingCategory(null);
    setFormName("");
    setFormNameVi("");
    setFormSlug("");
    setFormType(activeTab === "ingredients" ? "Ingredient Group" : "Recipe Category");
    setFormDescription("");
    setFormItemCount(0);
    setFormBadgeType("flag-vn");
    setFormStatus("Active");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: CategoryData) => {
    setFormCategoryType(cat.categoryType || "CUISINE");
    setFormDietaryGroup(cat.categoryType || "PLANT");
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

  async function persistCategory(cat: CategoryData, isActive: boolean) {
    const response = await apiFetch(`/api/recipe-categories/${cat.id}`, {
      method: "PUT", body: JSON.stringify({ name: cat.name, slug: cat.slug, type: cat.categoryType,
        description: cat.description || null, imageUrl: cat.imageUrl || null, isActive }),
    });
    if (!response.ok) throw new Error(ui("Could not save category."));
  }
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !formName.trim()) return;
    setSaving(true); setError("");
    try {
      if (formType === "Ingredient Group") {
        await saveIngredientCategory({ name: formName.trim(), code: formSlug.trim().toUpperCase(), dietaryGroup: formDietaryGroup as "PLANT" | "DAIRY" | "EGG" | "HONEY" | "UNVERIFIED" }, editingCategory?.id);
        await loadCatalog(); setIsModalOpen(false); showToast(ui("Saved successfully."));
        return;
      }
      const response = await apiFetch(`/api/recipe-categories${editingCategory ? `/${editingCategory.id}` : ""}`, {
        method: editingCategory ? "PUT" : "POST", body: JSON.stringify({
          name: formName.trim(), slug: formSlug, type: formCategoryType,
          description: formDescription || null, imageUrl: editingCategory?.imageUrl || null, isActive: formStatus === "Active",
        }),
      });
      if (!response.ok) { const body = await response.json(); throw new Error(body.message || ui("Could not save category.")); }
      await loadCatalog(); setIsModalOpen(false); showToast(ui("Saved successfully."));
    } catch (failure) { setError(failure instanceof Error ? failure.message : ui("Could not save category.")); }
    finally { setSaving(false); }
  };
  const handleToggleStatus = async (cat: CategoryData) => {
    if (saving || cat.type === "Ingredient Group") return;
    setSaving(true); setError("");
    try { await persistCategory(cat, cat.status !== "Active"); await loadCatalog(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : ui("Could not save category.")); }
    finally { setSaving(false); }
  };
  const handleDeleteCategory = async (id: number, _name: string, type: "Recipe Category" | "Ingredient Group") => {
    if (type === "Ingredient Group") { setError(ui("Ingredient groups are fixed. Manage ingredient assignments in Ingredients.")); return; }
    const cat = recipeCategories.find(c => c.id === id);
    if (!cat || saving) return;
    setSaving(true); setError("");
    try { await persistCategory(cat, false); await loadCatalog(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : ui("Could not save category.")); }
    finally { setSaving(false); }
  };

  const handleResetFilters = () => {
    setSelectedRecipeCategory("all");
    setSelectedIngredientCategory("all");
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
            <UiText text="Quản lý danh mục" />
          </h1>
          <p className="mt-1 text-xs text-[#727974] lg:text-sm">
            <UiText text="Quản lý danh mục công thức và nguyên liệu của hệ thống." />
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
          <span><UiText text="Thêm danh mục" /></span>
        </button>
      </div>

      {/* ── TABS & SEARCH CATEGORIES BAR ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left Segmented Pill Tabs */}
        <div className="flex items-center gap-1 rounded-2xl bg-[#EFECE6] p-1.5 shadow-2xs">
          {/* Tab 1: Category Recipes */}
          <button
            type="button"
            onClick={() => { setActiveTab("recipes"); setExpandedCategoryId(null); }}
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
            <span><UiText text="Danh mục công thức" /> ({recipeCategories.length})</span>
          </button>

          {/* Tab 2: Category Ingredients */}
          <button
            type="button"
            onClick={() => { setActiveTab("ingredients"); setExpandedCategoryId(null); }}
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
            <span><UiText text="Nhóm nguyên liệu" /> ({ingredientCategories.length})</span>
          </button>

          {/* Tab 3: Dual Filter & Dishes */}
          <button
            type="button"
            onClick={() => { setActiveTab("dual-dishes"); setExpandedCategoryId(null); }}
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
            <span><UiText text="Lọc kết hợp và món ăn" /> ({filteredDishes.length})</span>
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
                <UiText text="Tra cứu công thức theo danh mục kết hợp" />
              </h3>
              <p className="text-xs text-[#727974]">
                <UiText text="Kết hợp phong cách ẩm thực với nhóm dinh dưỡng và nguyên liệu" />
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
              <span>{filteredDishes.length} <UiText text="Món ăn phù hợp lựa chọn" /></span>
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
              <span><UiText text="Đặt lại bộ lọc" /></span>
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
              <span><UiText text="1. Danh mục công thức (vùng miền/phong cách)" /></span>
            </label>
            <div className="relative">
              <select
                value={selectedRecipeCategory}
                onChange={(e) => setSelectedRecipeCategory(e.target.value)}
                className="w-full appearance-none rounded-xl border border-[#E3E1DB] bg-white px-3.5 py-2.5 pr-8 text-xs font-medium text-[#07241A] shadow-2xs outline-none transition focus:border-[#1E3A2F]"
              >
                {recipeCategories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.nameVi} ({cat.itemCount} món)
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
              <span><UiText text="2. Nhóm nguyên liệu" /></span>
            </label>
            <div className="relative">
              <select
                value={selectedIngredientCategory}
                onChange={(e) => setSelectedIngredientCategory(e.target.value)}
                className="w-full appearance-none rounded-xl border border-[#E3E1DB] bg-white px-3.5 py-2.5 pr-8 text-xs font-medium text-[#07241A] shadow-2xs outline-none transition focus:border-[#1E3A2F]"
              >
                {ingredientCategories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.nameVi}
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
              <span><UiText text="Tìm món ăn hoặc nguyên liệu" /></span>
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
                <UiText text="Món ăn theo bộ lọc kết hợp" />
              </h2>
              <span className="text-xs text-[#727974]">
                — <UiText text="Danh sách công thức từ cộng đồng" />
              </span>
            </div>

            <span className="rounded-full bg-[#DCEDE2] px-3 py-1 text-xs font-bold text-[#1E4D36]">
              {filteredDishes.length} <UiText text="Món ăn tìm thấy" />
            </span>
          </div>

          {/* Dishes Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#F0EFEB] bg-[#FAF9F5] text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                <tr>
                  <th className="py-3.5 pl-6 pr-4"><UiText text="Món ăn / Công thức" /></th>
                  <th className="px-4 py-3.5"><UiText text="Danh mục ẩm thực" /></th>
                  <th className="px-4 py-3.5"><UiText text="Nhóm nguyên liệu" /></th>
                  <th className="px-4 py-3.5"><UiText text="Chuẩn bị và nấu" /></th>
                  <th className="px-4 py-3.5"><UiText text="Đánh giá" /></th>
                  <th className="px-4 py-3.5"><UiText text="Trạng thái" /></th>
                  <th className="py-3.5 pl-4 pr-6 text-right"><UiText text="Thao tác" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEB]">
                {filteredDishes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-[#727974]">
                      <p className="font-semibold text-[#07241A]"><UiText text="Không có món ăn phù hợp với bộ lọc kết hợp." /></p>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-2 text-xs font-semibold text-[#1E3A2F] underline hover:text-[#2A4E40]"
                      >
                        <UiText text="Đặt lại bộ lọc kết hợp" />
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
                          <div className="font-bold text-[#07241A]">{dish.titleVi}</div>
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
                          ★ {dish.rating > 0 ? dish.rating : ui("Not rated")}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F3EC] px-2.5 py-0.5 text-xs font-semibold text-[#1E4D36]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#1E4D36]" />
                            {ui(dish.status)}
                          </span>
                        </td>
                        <td className="py-3.5 pl-4 pr-6 text-right">
                          <button
                            type="button"
                            onClick={() => router.push(`/view-detail/${dish.id}`)}
                            className="rounded-lg p-1.5 text-[#6D7570] transition hover:bg-[#F2EFE9] hover:text-[#07241A]"
                            title={ui("View recipe")}
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
              {activeTab === "recipes" ? activeRecipeCount : activeIngredientCount} <UiText text="Đang hoạt động" />
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#F0EFEB] bg-[#FAF9F5] text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                <tr>
                  <th className="py-3.5 pl-6 pr-4"><UiText text="Tên danh mục" /></th>
                  <th className="px-4 py-3.5"><UiText text="Mô tả và điểm nổi bật" /></th>
                  <th className="px-4 py-3.5"><UiText text="Mục liên quan" /></th>
                  <th className="px-4 py-3.5"><UiText text="Trạng thái" /></th>
                  <th className="py-3.5 pl-4 pr-6 text-right"><UiText text="Thao tác" /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EFEB]">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-xs text-[#727974]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="text-3xl">🏷️</span>
                        <p className="font-semibold text-[#07241A]"><UiText text="Không tìm thấy danh mục phù hợp." /></p>
                        <button
                          type="button"
                          onClick={handleOpenAddModal}
                          className="mt-2 text-xs font-semibold text-[#1E3A2F] underline hover:text-[#2A4E40]"
                        >
                          <UiText text="Tạo danh mục mới" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((cat) => (
                    <Fragment key={cat.id}>
                    <tr className="transition-colors hover:bg-[#FAF9F5]/80">
                      {/* CATEGORY NAME COLUMN */}
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex items-center gap-3.5">
                          {renderBadgeIcon(cat.badgeType, cat.name)}
                          <div>
                            <button type="button" onClick={() => setExpandedCategoryId(current => current === cat.id ? null : cat.id)} aria-expanded={expandedCategoryId === cat.id} className="text-left font-bold text-[#07241A] text-sm leading-snug hover:underline">{cat.nameVi}</button>
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
                        <button type="button" onClick={() => setExpandedCategoryId(current => current === cat.id ? null : cat.id)} aria-expanded={expandedCategoryId === cat.id} className="hover:underline"><span className="font-bold text-sm text-[#07241A]">{cat.itemCount}</span>{" "}<span className="text-xs text-[#727974]">{activeTab === "recipes" ? "công thức" : "nguyên liệu"}</span></button>
                      </td>

                      {/* STATUS COLUMN */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {activeTab === "recipes" ? <button
                          type="button"
                          onClick={() => handleToggleStatus(cat)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                            cat.status === "Active"
                              ? "bg-[#E7F3EC] text-[#1E4D36] hover:bg-[#DCEDE2]"
                              : "bg-[#F1F0EB] text-[#727974] hover:bg-[#E6E4DC]"
                          }`}
                          title={ui("Change status")}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              cat.status === "Active" ? "bg-[#1E4D36]" : "bg-[#8D948F]"
                            }`}
                          />
                          <span>{ui(cat.status)}</span>
                        </button> : <span className="inline-flex rounded-full bg-[#E7F3EC] px-2.5 py-1 text-xs font-semibold text-[#1E4D36]">{ui(cat.status)}</span>}
                      </td>

                      {/* ACTIONS COLUMN */}
                      <td className="py-4 pl-4 pr-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(cat)}
                            className="rounded-lg p-1.5 text-[#6D7570] transition hover:bg-[#F2EFE9] hover:text-[#07241A]"
                            title={ui("Edit Category")}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>

                          {/* Delete button */}
                          {activeTab === "recipes" && <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id, cat.name, cat.type)}
                            className="rounded-lg p-1.5 text-[#6D7570] transition hover:bg-red-50 hover:text-red-600"
                            title={ui("Hide Category")}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>}
                        </div>
                      </td>
                    </tr>
                    {expandedCategoryId === cat.id && activeTab === "recipes" && <tr><td colSpan={5} className="p-0"><CategoryRecipeAssignments categoryId={cat.id} categoryName={cat.nameVi || cat.name} recipes={adminRecipes} types={bmiTypes} onChanged={loadCatalog} onBmiSaved={(recipeId, ids) => setAdminRecipes(current => current.map(recipe => recipe.postId === recipeId ? { ...recipe, bmiTypes: bmiTypes.filter(type => ids.includes(type.id)) } : recipe))} /></td></tr>}
                    {expandedCategoryId === cat.id && activeTab === "ingredients" && <tr><td colSpan={5} className="bg-[#FAF9F5] px-6 py-5"><h3 className="font-serif text-lg font-semibold text-[#07241A]">{cat.nameVi} ({cat.itemCount})</h3><div className="mt-3 max-h-80 overflow-y-auto">{allIngredients.filter(ingredient => ingredient.ingredientCategoryId === cat.id).length === 0 ? <p className="py-3 text-sm text-[#727974]">{ui("No ingredients in this category yet.")}</p> : <div className="grid gap-x-8 sm:grid-cols-2">{allIngredients.filter(ingredient => ingredient.ingredientCategoryId === cat.id).map(ingredient => <div key={ingredient.id} className="flex items-center justify-between border-b border-[#E6E3DA] py-2 text-sm"><span>{localizeIngredient(ingredient.name, "vi")}</span><span className="text-xs text-[#727974]">#{ingredient.id}</span></div>)}</div>}</div><Link href="/admin/ingredients" className="mt-4 inline-block text-sm font-semibold text-[#1E3A2F] underline">{ui("Manage ingredients")}</Link></td></tr>}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && <p role="status">{ui("Loading...")}</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <Link href="/admin/ingredients" className="text-sm underline">{ui("Ingredients")}</Link>
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
              {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
              <fieldset disabled={saving} className="contents">
              {formType === "Recipe Category" ? <label className="block text-xs font-semibold">{ui("Type")}
                <select disabled={editingCategory !== null} value={formCategoryType} onChange={e => setFormCategoryType(e.target.value)} className="mt-2 block w-full rounded-xl border p-2">
                  {CATEGORY_TYPES.map(type => <option key={type} value={type}>{ui(categoryTypeLabels[type][0])}</option>)}
                </select>
              </label> : <label className="block text-xs font-semibold">{ui("Dietary group")}
                <select value={formDietaryGroup} onChange={e => setFormDietaryGroup(e.target.value)} disabled={editingCategory !== null && ["PLANT", "DAIRY", "EGG", "HONEY", "UNVERIFIED"].includes(editingCategory.slug)} className="mt-2 block w-full rounded-xl border p-2">
                  {["PLANT", "DAIRY", "EGG", "HONEY", "UNVERIFIED"].map(group => <option key={group} value={group}><UiText text={group} /></option>)}
                </select>
              </label>}
              {/* Category Group Type */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                  <UiText text="Phân loại danh mục" /> *
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={editingCategory !== null || activeTab !== "recipes"} onClick={() => setFormType("Recipe Category")}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      formType === "Recipe Category"
                        ? "border-[#1E3A2F] bg-[#1E3A2F] text-white"
                        : "border-[#EFEEEB] bg-[#FBF9F6] text-[#424844] hover:bg-white"
                    }`}
                  >
                    <UiText text="Danh mục công thức" />
                  </button>
                  <button
                    type="button"
                    disabled={editingCategory !== null || activeTab !== "ingredients"} onClick={() => setFormType("Ingredient Group")}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      formType === "Ingredient Group"
                        ? "border-[#1E3A2F] bg-[#1E3A2F] text-white"
                        : "border-[#EFEEEB] bg-[#FBF9F6] text-[#424844] hover:bg-white"
                    }`}
                  >
                    <UiText text="Nhóm nguyên liệu" />
                  </button>
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                    Tên danh mục *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Ẩm thực Việt Nam"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (!editingCategory) {
                        setFormNameVi(e.target.value);
                        setFormSlug(formType === "Ingredient Group"
                          ? e.target.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "")
                          : categorySlug(e.target.value));
                      }
                    }}
                    className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 text-xs font-semibold text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white"
                  />
                </div>

                {formType === "Recipe Category" && <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                    Tên hiển thị
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Ẩm thực chay Việt Nam"
                    readOnly value={formNameVi}
                    className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 text-xs font-semibold text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white"
                  />
                </div>}
              </div>

              {/* Slug & Associated Count */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                    {formType === "Ingredient Group" ? ui("Category code") : ui("URL Slug")} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={formType === "Ingredient Group" ? "RAU_CU" : "am-thuc-viet-nam"}
                    value={formSlug}
                    readOnly={formType === "Ingredient Group" && editingCategory !== null && ["PLANT", "DAIRY", "EGG", "HONEY", "UNVERIFIED"].includes(editingCategory.slug)}
                    onChange={(e) => setFormSlug(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 font-mono text-xs text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                    <UiText text="Số lượng" />
                  </label>
                  <input
                    type="number"
                    min={0}
                    readOnly value={formItemCount}
                    onChange={(e) => setFormItemCount(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 text-xs font-semibold outline-none focus:border-[#1E3A2F] focus:bg-white"
                  />
                </div>
              </div>

              {/* Badge Style Selector */}
              {formType === "Recipe Category" && <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                  <UiText text="Kiểu biểu tượng" />
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
                      disabled
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
              </div>}

              {/* Description */}
              {formType === "Recipe Category" && <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                  <UiText text="Mô tả và điểm nổi bật" />
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Phở chay, bún bò Huế thanh tịnh, bánh xèo giòn, chả giò nấm..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 text-xs text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white"
                />
              </div>}

              {/* Status Toggle */}
              {formType === "Recipe Category" && <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="statusToggle"
                  checked={formStatus === "Active"}
                  onChange={(e) => setFormStatus(e.target.checked ? "Active" : "Hidden")}
                  className="h-4 w-4 rounded border-gray-300 text-[#1E3A2F] focus:ring-[#1E3A2F]"
                />
                <label htmlFor="statusToggle" className="text-xs font-semibold text-[#07241A]">
                  <UiText text="Đang hoạt động và hiển thị trong cộng đồng VeggieMate" />
                </label>
              </div>}

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-[#EFEEEB] pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-[#EFEEEB] px-4 py-2 text-xs font-semibold text-[#424844] hover:bg-[#F2EFE9]"
                >
                  <UiText text="Hủy bỏ" />
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#0B1E17] px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#183B2F]"
                >
                  {editingCategory ? ui("Save Changes") : ui("Create Category")}
                </button>
              </div>
              </fieldset>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
