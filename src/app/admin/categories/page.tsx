"use client";

import ContentIcon from "@/components/content/ContentIcon";

import { Fragment, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import UiText, { useUiText } from "@/components/UiText";
import { getIngredientCategories, getIngredients, saveIngredientCategory, type IngredientItem, type RecipeResponse } from "@/lib/recipe-api";
import { localizeIngredient, localizeIngredientCategory } from "@/lib/localized-content";
import { apiFetch, apiGet } from "@/lib/api";
import { categoryName, getRecipeCategories } from "@/lib/recipe-categories";
import type { CategoryData } from "@/lib/admin-category-design";
import CategoryRecipeAssignments from "@/components/recipe/CategoryRecipeAssignments";

export default function AdminCategoriesPage() {
  const ui = useUiText();

  // Tab State: "recipes" | "ingredients"
  const [activeTab, setActiveTab] = useState<"recipes" | "ingredients">("recipes");

  // Search input top right of tab row
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [topAdminSearch] = useState("");

  // Category Lists
  const [recipeCategories, setRecipeCategories] = useState<CategoryData[]>([]);
  const [ingredientCategories, setIngredientCategories] = useState<CategoryData[]>([]);
  const [allIngredients, setAllIngredients] = useState<IngredientItem[]>([]);
  const [adminRecipes, setAdminRecipes] = useState<RecipeResponse[]>([]);
  const [expandedCategoryId, setExpandedCategoryId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);

  // Form State
  const [formType, setFormType] = useState<"Recipe Category" | "Ingredient Group">("Recipe Category");
  const [formDietaryGroup, setFormDietaryGroup] = useState("PLANT");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");

  // Feedback Notification Toast
  const [feedback, setFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  async function loadCatalog() {
    const [categories, groups, ingredients, recipes] = await Promise.all([
      getRecipeCategories(true), getIngredientCategories(), getIngredients(),
      apiGet<RecipeResponse[]>("/api/recipes/search"),
    ]);
    setAdminRecipes(recipes);
    setAllIngredients(ingredients);
    setRecipeCategories(categories.map(c => {
      const savedDesc = typeof window !== "undefined"
        ? (localStorage.getItem(`veggiemate_rcat_desc_${c.id}`) || localStorage.getItem(`veggiemate_rcat_desc_${c.name}`) || "")
        : "";
      return {
        id: c.id, name: c.name, nameVi: categoryName(c, "vi"), slug: String(c.id),
        type: "Recipe Category", description: savedDesc || "Danh mục công thức", itemCount: recipes.filter(r => r.categories.some(category => category.id === c.id)).length,
        status: c.isActive ? "Active" : "Hidden", badgeType: "custom",
        updatedAt: new Date(c.createdAt).toLocaleDateString(),
      };
    }));
    setIngredientCategories(groups.map(g => ({
      id: g.id, name: g.name, nameVi: localizeIngredientCategory(g.code, g.name), slug: g.code, type: "Ingredient Group", categoryType: g.dietaryGroup,
      description: g.dietaryGroup, itemCount: ingredients.filter(i => i.ingredientCategoryId === g.id).length,
      status: "Active", badgeType: "text-vg", updatedAt: "",
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

  const activeRecipeCount = recipeCategories.filter((c) => c.status === "Active").length;
  const activeIngredientCount = ingredientCategories.filter((c) => c.status === "Active").length;

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormType("Recipe Category");
    setFormName("");
    setFormDescription("");
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: CategoryData) => {
    setEditingCategory(cat);
    setFormType(cat.type);
    if (cat.type === "Ingredient Group") {
      const dietary = cat.categoryType || cat.slug || "PLANT";
      setFormDietaryGroup(dietary);
      setFormName(cat.nameVi || cat.name);
      setFormDescription(cat.description === "Nhóm nguyên liệu" || cat.description === cat.categoryType ? "" : cat.description);
    } else {
      setFormName(cat.name);
      setFormDescription(cat.description === "Danh mục công thức" ? "" : cat.description);
    }
    setError("");
    setIsModalOpen(true);
  };

  async function persistCategory(cat: CategoryData, isActive: boolean) {
    const response = await apiFetch(`/api/recipe-categories/${cat.id}`, { method: "PUT", body: JSON.stringify({ name: cat.name, isActive }) });
    if (!response.ok) throw new Error(ui("Could not save category."));
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      if (formType === "Ingredient Group") {
        const dietaryGroup = (["PLANT", "DAIRY", "EGG", "HONEY"].includes(formDietaryGroup.toUpperCase())
          ? formDietaryGroup.toUpperCase()
          : "PLANT") as "PLANT" | "DAIRY" | "EGG" | "HONEY";
        const code = editingCategory?.slug || dietaryGroup;
        const nameMap: Record<string, string> = {
          PLANT: "Thực vật",
          DAIRY: "Sữa và chế phẩm từ sữa",
          EGG: "Trứng",
          HONEY: "Mật ong",
        };
        const nameToSave = formName.trim() || nameMap[dietaryGroup] || dietaryGroup;
        await saveIngredientCategory({
          name: nameToSave,
          code,
          dietaryGroup,
        }, editingCategory?.id);
        if (typeof window !== "undefined" && formDescription.trim()) {
          localStorage.setItem(`veggiemate_icat_desc_${code}`, formDescription.trim());
          if (editingCategory?.id) localStorage.setItem(`veggiemate_icat_desc_${editingCategory.id}`, formDescription.trim());
        }
        await loadCatalog();
        setIsModalOpen(false);
        showToast(ui("Saved successfully."));
        return;
      }

      // Recipe Category save
      const trimmedName = formName.trim();
      if (!trimmedName) return;

      const isDuplicate = recipeCategories.some((c) => {
        if (editingCategory && c.id === editingCategory.id) return false;
        return (
          c.name.toLowerCase() === trimmedName.toLowerCase() ||
          c.nameVi.toLowerCase() === trimmedName.toLowerCase()
        );
      });

      if (isDuplicate) {
        setError(ui("Recipe category already exists."));
        return;
      }

      const isEdit = Boolean(editingCategory);
      const catId = editingCategory?.id;
      const response = await apiFetch(`/api/recipe-categories${isEdit ? `/${catId}` : ""}`, {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify({
          name: trimmedName,
          isActive: true,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message || ui("Could not save category."));
      }

      if (typeof window !== "undefined" && formDescription.trim()) {
        localStorage.setItem(`veggiemate_rcat_desc_${trimmedName}`, formDescription.trim());
        if (catId) localStorage.setItem(`veggiemate_rcat_desc_${catId}`, formDescription.trim());
      }

      await loadCatalog();
      setIsModalOpen(false);
      showToast(ui("Saved successfully."));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : ui("Could not save category."));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (cat: CategoryData) => {
    if (saving || cat.type === "Ingredient Group") return;
    setSaving(true);
    setError("");
    try {
      await persistCategory(cat, cat.status !== "Active");
      await loadCatalog();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : ui("Could not save category."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: number, _name: string, type: "Recipe Category" | "Ingredient Group") => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      if (type === "Ingredient Group") {
        setIngredientCategories(current => current.filter(c => c.id !== id));
        showToast(ui("Saved successfully."));
        return;
      }
      const cat = recipeCategories.find((c) => c.id === id);
      if (!cat) return;
      await persistCategory(cat, false);
      await loadCatalog();
      showToast(ui("Saved successfully."));
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : ui("Could not save category."));
    } finally {
      setSaving(false);
    }
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
          <button type="button" onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-900"><ContentIcon name="close" className="inline-block align-text-bottom" /></button>
        </div>
      )}

      {/* ── PAGE TITLE & "+ Add Category" BUTTON (CHỈ HIỂN THỊ Ở DANH MỤC CÔNG THỨC) ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#07241A] lg:text-4xl">
            <UiText text="Quản lý danh mục" />
          </h1>
          <p className="mt-1 text-xs text-[#727974] lg:text-sm">
            <UiText text="Quản lý danh mục công thức và nguyên liệu của hệ thống." />
          </p>
        </div>

        {activeTab === "recipes" && (
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
        )}
      </div>

      {/* ── TABS & SEARCH CATEGORIES BAR ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left Segmented Pill Tabs */}
        <div className="flex items-center gap-1 rounded-2xl bg-[#EFECE6] p-1.5 shadow-2xs">
          {/* Tab 1: Category Recipes */}
          <button
            type="button"
            onClick={() => { setActiveTab("recipes"); setExpandedCategoryId(null); setError(""); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${activeTab === "recipes"
                ? "bg-white text-[#0B1E17] shadow-xs"
                : "text-[#6A736E] hover:text-[#0B1E17]"
              }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
              <line x1="6" y1="17" x2="18" y2="17" />
            </svg>
            <span><UiText text="Danh mục công thức" /> ({recipeCategories.length})</span>
          </button>

          {/* Tab 2: Category Ingredients */}
          <button
            type="button"
            onClick={() => { setActiveTab("ingredients"); setExpandedCategoryId(null); setError(""); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${activeTab === "ingredients"
                ? "bg-white text-[#0B1E17] shadow-xs"
                : "text-[#6A736E] hover:text-[#0B1E17]"
              }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
            <span><UiText text="Nhóm nguyên liệu" /> ({ingredientCategories.length})</span>
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

      {/* ── CATEGORIES TABLE VIEW ──────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-[#E6E3DA] bg-white shadow-xs">
        {/* Section Sub-header */}
        <div className="flex items-center justify-between border-b border-[#F0EFEB] px-6 py-4">
          <div className="flex items-center gap-2">
            {activeTab === "recipes" ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#1E3A2F]">
                <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
                <line x1="6" y1="17" x2="18" y2="17" />
              </svg>
            ) : (
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
                      <span className="text-3xl"><ContentIcon name="tag" width="1em" height="1em" className="inline-block" /></span>
                      <p className="font-semibold text-[#07241A]"><UiText text="Không tìm thấy danh mục phù hợp." /></p>
                      {activeTab === "recipes" && (
                        <button
                          type="button"
                          onClick={handleOpenAddModal}
                          className="mt-2 text-xs font-semibold text-[#1E3A2F] underline hover:text-[#2A4E40]"
                        >
                          <UiText text="Tạo danh mục mới" />
                        </button>
                      )}
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
                            {activeTab === "ingredients" && <div className="font-mono text-[11px] text-[#727974] leading-tight">{cat.slug}</div>}
                          </div>
                        </div>
                      </td>

                      {/* DESCRIPTION & HIGHLIGHTS COLUMN */}
                      <td className="px-4 py-4 max-w-md">
                        <p className="text-xs text-[#4E5651] leading-relaxed">{cat.description || (activeTab === "recipes" ? "Danh mục công thức" : "Nhóm nguyên liệu")}</p>
                      </td>

                      {/* ASSOCIATED ITEMS COLUMN */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button type="button" onClick={() => setExpandedCategoryId(current => current === cat.id ? null : cat.id)} aria-expanded={expandedCategoryId === cat.id} className="hover:underline"><span className="font-bold text-sm text-[#07241A]">{cat.itemCount}</span>{" "}<span className="text-xs text-[#727974]">{activeTab === "recipes" ? "công thức" : "nguyên liệu"}</span></button>
                      </td>

                      {/* STATUS COLUMN */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {activeTab === "recipes" ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(cat)}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${cat.status === "Active"
                                ? "bg-[#E7F3EC] text-[#1E4D36] hover:bg-[#DCEDE2]"
                                : "bg-[#F1F0EB] text-[#727974] hover:bg-[#E6E4DC]"
                              }`}
                            title={ui("Change status")}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${cat.status === "Active" ? "bg-[#1E4D36]" : "bg-[#8D948F]"
                                }`}
                            />
                            <span>{ui(cat.status)}</span>
                          </button>
                        ) : (
                          <span className="inline-flex rounded-full bg-[#E7F3EC] px-2.5 py-1 text-xs font-semibold text-[#1E4D36]">{ui(cat.status)}</span>
                        )}
                      </td>

                      {/* ACTIONS COLUMN (GIỮ LẠI NÚT SỬA VÀ XÓA CHO CẢ 2 BÊN) */}
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

                          {/* Delete button (chỉ hiển thị ở Danh mục công thức) */}
                          {activeTab === "recipes" && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id, cat.name, cat.type)}
                              className="rounded-lg p-1.5 text-[#6D7570] transition hover:bg-red-50 hover:text-red-600"
                              title={ui("Hide Category")}
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedCategoryId === cat.id && activeTab === "recipes" && <tr><td colSpan={5} className="p-0"><CategoryRecipeAssignments categoryId={cat.id} categoryName={cat.nameVi || cat.name} recipes={adminRecipes} onChanged={loadCatalog} /></td></tr>}
                    {expandedCategoryId === cat.id && activeTab === "ingredients" && <tr><td colSpan={5} className="bg-[#FAF9F5] px-6 py-5"><h3 className="font-serif text-lg font-semibold text-[#07241A]">{cat.nameVi} ({cat.itemCount})</h3><div className="mt-3 max-h-80 overflow-y-auto">{allIngredients.filter(ingredient => ingredient.ingredientCategoryId === cat.id).length === 0 ? <p className="py-3 text-sm text-[#727974]">{ui("No ingredients in this category yet.")}</p> : <div className="grid gap-x-8 sm:grid-cols-2">{allIngredients.filter(ingredient => ingredient.ingredientCategoryId === cat.id).map(ingredient => <div key={ingredient.id} className="flex items-center justify-between border-b border-[#E6E3DA] py-2 text-sm"><span>{localizeIngredient(ingredient.name, "vi")}</span><span className="text-xs text-[#727974]">#{ingredient.id}</span></div>)}</div>}</div><Link href="/admin/ingredients" className="mt-4 inline-block text-sm font-semibold text-[#1E3A2F] underline">{ui("Manage ingredients")}</Link></td></tr>}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {loading && <p role="status">{ui("Loading...")}</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <Link href="/admin/ingredients" className="text-sm underline">{ui("Ingredients")}</Link>

      {/* ── MODAL: THÊM / SỬA DANH MỤC CÔNG THỨC (RECIPE CATEGORY) ──────── */}
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
                <ContentIcon name="close" className="inline-block align-text-bottom" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="mt-4 space-y-4">
              {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
              <fieldset disabled={saving} className="contents">
                {formType === "Recipe Category" ? (
                  /* Form cho Recipe Category */
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                      <UiText text="Loại" /> *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={ui("e.g. Vietnamese cuisine")}
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 text-xs font-semibold text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white"
                    />
                  </div>
                ) : (
                  /* Form khi chỉnh sửa Ingredient Group (trình thả chọn 4 loại) */
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                      <UiText text="Nhóm thực phẩm" /> *
                    </label>
                    <select
                      value={formDietaryGroup}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormDietaryGroup(val);
                        const names: Record<string, string> = {
                          PLANT: "Thực vật",
                          DAIRY: "Sữa và chế phẩm từ sữa",
                          EGG: "Trứng",
                          HONEY: "Mật ong",
                        };
                        setFormName(names[val] || val);
                      }}
                      className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 text-xs font-semibold text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white"
                    >
                      <option value="PLANT">{ui("Thực vật")}</option>
                      <option value="DAIRY">{ui("Sữa và chế phẩm từ sữa")}</option>
                      <option value="EGG">{ui("Trứng")}</option>
                      <option value="HONEY">{ui("Mật ong")}</option>
                    </select>
                  </div>
                )}

                {/* Field: Mô tả và đặc điểm nổi bật */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                    <UiText text="Mô tả và đặc điểm nổi bật" />
                  </label>
                  <textarea
                    rows={3}
                    placeholder={
                      formType === "Recipe Category"
                        ? ui("e.g. Vegetarian pho, gentle Hue noodles, crispy pancakes, mushroom spring rolls...")
                        : ui("e.g. Fresh vegetables, root vegetables, fiber-rich leafy greens...")
                    }
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 text-xs text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white"
                  />
                </div>

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
