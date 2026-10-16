"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import UiText, { useUiText, LanguageSwitch } from "@/components/UiText";
import { useAuth } from "@/context/AuthContext";
import { getCategories, CategoryItem } from "@/lib/recipe-api";

interface ExtendedCategory {
  id: number;
  name: string;
  nameVi: string;
  slug: string;
  type: "Recipe Category" | "Ingredient Group" | "Dietary Style" | "Meal Type";
  description: string;
  itemCount: number;
  status: "Active" | "Hidden";
  icon: string;
  updatedAt: string;
}

const DEFAULT_CATEGORIES: ExtendedCategory[] = [
  {
    id: 1,
    name: "Tofu & Soy",
    nameVi: "Đậu phụ & Đậu nành",
    slug: "tofu-soy",
    type: "Ingredient Group",
    description: "Plant-based protein staples including firm tofu, silken tofu, tempeh, and soy milks.",
    itemCount: 84,
    status: "Active",
    icon: "🥢",
    updatedAt: "Today, 09:20",
  },
  {
    id: 2,
    name: "Vegetables & Greens",
    nameVi: "Rau củ tươi & Rau xanh",
    slug: "vegetables-greens",
    type: "Recipe Category",
    description: "Seasonal organic farm greens, wok stir-fries, and nutrient-dense raw salads.",
    itemCount: 126,
    status: "Active",
    icon: "🥬",
    updatedAt: "Yesterday",
  },
  {
    id: 3,
    name: "Legumes & Pulses",
    nameVi: "Các loại đậu & Hạt",
    slug: "legumes-pulses",
    type: "Ingredient Group",
    description: "Chickpeas, red lentils, black beans, edamame, and wholesome sprouted beans.",
    itemCount: 65,
    status: "Active",
    icon: "🫘",
    updatedAt: "12 Mar 2026",
  },
  {
    id: 4,
    name: "Grains & Ancient Cereals",
    nameVi: "Ngũ cốc & Gạo lứt",
    slug: "grains-cereals",
    type: "Ingredient Group",
    description: "Brown jasmine rice, quinoa, rolled oats, buckwheat, and wholewheat pastas.",
    itemCount: 48,
    status: "Active",
    icon: "🌾",
    updatedAt: "10 Mar 2026",
  },
  {
    id: 5,
    name: "Forest Mushrooms",
    nameVi: "Các loại nấm tươi",
    slug: "mushrooms",
    type: "Recipe Category",
    description: "King oyster, shiitake, wood ear, enoki, and portobello savory umami preparations.",
    itemCount: 72,
    status: "Active",
    icon: "🍄",
    updatedAt: "08 Mar 2026",
  },
  {
    id: 6,
    name: "Vegan Desserts & Sweets",
    nameVi: "Món ngọt & Tráng miệng",
    slug: "vegan-desserts",
    type: "Meal Type",
    description: "Dairy-free sweet soups, chia seed puddings, lotus longan compotes, and fruit tarts.",
    itemCount: 39,
    status: "Active",
    icon: "🧁",
    updatedAt: "05 Mar 2026",
  },
  {
    id: 7,
    name: "Noodles & Broths",
    nameVi: "Bún, Mì & Nước dùng",
    slug: "noodles-broths",
    type: "Recipe Category",
    description: "Slow-simmered herbal phở broths, bún bò huế chay, udon, and glass noodle stir-fries.",
    itemCount: 91,
    status: "Active",
    icon: "🍜",
    updatedAt: "03 Mar 2026",
  },
  {
    id: 8,
    name: "Strict Vegan (All-Plant)",
    nameVi: "Thuần chay tuyệt đối",
    slug: "strict-vegan",
    type: "Dietary Style",
    description: "Zero animal ingredients, dairy, eggs, honey, or animal-derived additives.",
    itemCount: 215,
    status: "Active",
    icon: "🌱",
    updatedAt: "01 Mar 2026",
  },
  {
    id: 9,
    name: "Buddhist Pure (Ngũ Vị Tân Free)",
    nameVi: "Chay truyền thống (Không ngũ vị tân)",
    slug: "buddhist-pure",
    type: "Dietary Style",
    description: "Traditional Vietnamese Buddhist recipes free of onion, garlic, chives, leeks, and scallions.",
    itemCount: 110,
    status: "Active",
    icon: "🪷",
    updatedAt: "28 Feb 2026",
  },
  {
    id: 10,
    name: "Quick & Easy Breakfast",
    nameVi: "Bữa sáng nhanh & tiện",
    slug: "quick-breakfast",
    type: "Meal Type",
    description: "Nutritious plant-based morning meals prepared in under 15 minutes.",
    itemCount: 54,
    status: "Hidden",
    icon: "🥑",
    updatedAt: "25 Feb 2026",
  },
];

export default function AdminCategoriesPage() {
  const ui = useUiText();
  const { user } = useAuth();

  const [categories, setCategories] = useState<ExtendedCategory[]>(DEFAULT_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExtendedCategory | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formNameVi, setFormNameVi] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formType, setFormType] = useState<ExtendedCategory["type"]>("Recipe Category");
  const [formDescription, setFormDescription] = useState("");
  const [formIcon, setFormIcon] = useState("🌱");
  const [formStatus, setFormStatus] = useState<"Active" | "Hidden">("Active");

  // Load from backend API if available
  useEffect(() => {
    let isMounted = true;
    async function fetchApiCategories() {
      try {
        const backendData = await getCategories();
        if (isMounted && backendData && backendData.length > 0) {
          // Merge or supplement backend categories
          const mapped: ExtendedCategory[] = backendData.map((item, idx) => {
            const existing = DEFAULT_CATEGORIES.find((c) => c.name.toLowerCase() === item.name.toLowerCase());
            if (existing) {
              return { ...existing, id: item.id || existing.id };
            }
            return {
              id: item.id || idx + 100,
              name: item.name,
              nameVi: item.name,
              slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              type: (item.type as ExtendedCategory["type"]) || "Recipe Category",
              description: `Classification category for ${item.name}`,
              itemCount: Math.floor(Math.random() * 40) + 10,
              status: "Active",
              icon: "🥗",
              updatedAt: "Recently synced",
            };
          });

          // Ensure our defaults are present if not in backend
          const combined = [...mapped];
          for (const def of DEFAULT_CATEGORIES) {
            if (!combined.some((c) => c.slug === def.slug)) {
              combined.push(def);
            }
          }
          setCategories(combined);
        }
      } catch {
        // Fallback already in place
      }
    }
    fetchApiCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleOpenAddModal = () => {
    setEditingCategory(null);
    setFormName("");
    setFormNameVi("");
    setFormSlug("");
    setFormType("Recipe Category");
    setFormDescription("");
    setFormIcon("🌱");
    setFormStatus("Active");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: ExtendedCategory) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormNameVi(cat.nameVi);
    setFormSlug(cat.slug);
    setFormType(cat.type);
    setFormDescription(cat.description);
    setFormIcon(cat.icon);
    setFormStatus(cat.status);
    setIsModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingCategory) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editingCategory.id
            ? {
                ...c,
                name: formName.trim(),
                nameVi: formNameVi.trim() || formName.trim(),
                slug: formSlug.trim() || formName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                type: formType,
                description: formDescription.trim(),
                icon: formIcon.trim() || "🌱",
                status: formStatus,
                updatedAt: "Just now",
              }
            : c
        )
      );
      showToast(`Updated category "${formName}" successfully`);
    } else {
      const newCat: ExtendedCategory = {
        id: Date.now(),
        name: formName.trim(),
        nameVi: formNameVi.trim() || formName.trim(),
        slug: formSlug.trim() || formName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        type: formType,
        description: formDescription.trim(),
        itemCount: 0,
        status: formStatus,
        icon: formIcon.trim() || "🌱",
        updatedAt: "Just now",
      };
      setCategories((prev) => [newCat, ...prev]);
      showToast(`Created category "${formName}" successfully`);
    }

    setIsModalOpen(false);
  };

  const handleToggleStatus = (id: number) => {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const next = c.status === "Active" ? "Hidden" : "Active";
          showToast(`Category "${c.name}" is now ${next}`);
          return { ...c, status: next, updatedAt: "Just now" };
        }
        return c;
      })
    );
  };

  const handleDeleteCategory = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete category "${name}"?`)) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showToast(`Deleted category "${name}"`);
    }
  };

  // Filtered list
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nameVi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = typeFilter === "All" || c.type === typeFilter;
      const matchStatus = statusFilter === "All" || c.status === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [categories, searchQuery, typeFilter, statusFilter]);

  // Metric stats
  const totalCategories = categories.length;
  const activeCount = categories.filter((c) => c.status === "Active").length;
  const totalTaggedRecipes = categories.reduce((sum, c) => sum + c.itemCount, 0);
  const taxonomyGroupsCount = new Set(categories.map((c) => c.type)).size;

  return (
    <div className="space-y-6">
      {/* Top Bar Header */}
      <div className="flex flex-col gap-4 border-b border-[#EFEEEB] pb-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2">
          <Link href="/" className="font-serif text-xl font-bold tracking-tight text-[#07241A] hover:opacity-80">
            VeggieMate
          </Link>
          <span className="text-[#A0A5A1]">/</span>
          <Link href="/admin" className="text-xs font-semibold text-[#727974] hover:text-[#07241A]">
            <UiText text="Admin Area" />
          </Link>
          <span className="text-[#A0A5A1]">/</span>
          <div className="flex items-center gap-1.5 rounded-full border border-[#EFEEEB] bg-white px-2.5 py-1 text-xs font-medium text-[#1E3A2F] shadow-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            <span><UiText text="Categories" /></span>
          </div>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-3">
          <LanguageSwitch />
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-xl bg-[#1E3A2F] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#2A4E40]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span><UiText text="New Category" /></span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {feedback && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span>{feedback}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="text-emerald-700 hover:text-emerald-900">✕</button>
        </div>
      )}

      {/* Page Title & Subtitle */}
      <div>
        <h1 className="font-serif text-2xl font-bold tracking-tight text-[#07241A] lg:text-3xl">
          <UiText text="Categories & Taxonomy" />
        </h1>
        <p className="mt-1 text-xs text-[#727974] lg:text-sm">
          <UiText text="Manage culinary classifications, ingredient groups, and dietary markers for community recipes." />
        </p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#727974]">
            <UiText text="Total Categories" />
          </span>
          <div className="mt-2 text-2xl font-bold text-[#07241A]">{totalCategories}</div>
          <p className="mt-1 text-[11px] text-[#A0A5A1]"><UiText text="Across all taxonomy levels" /></p>
        </div>

        <div className="rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            <UiText text="Active in App" />
          </span>
          <div className="mt-2 text-2xl font-bold text-emerald-700">{activeCount}</div>
          <p className="mt-1 text-[11px] text-emerald-600/80"><UiText text="Visible to community chefs" /></p>
        </div>

        <div className="rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#727974]">
            <UiText text="Tagged Recipes" />
          </span>
          <div className="mt-2 text-2xl font-bold text-[#07241A]">{totalTaggedRecipes}</div>
          <p className="mt-1 text-[11px] text-[#A0A5A1]"><UiText text="Associated food entries" /></p>
        </div>

        <div className="rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#727974]">
            <UiText text="Taxonomy Groups" />
          </span>
          <div className="mt-2 text-2xl font-bold text-[#07241A]">{taxonomyGroupsCount}</div>
          <p className="mt-1 text-[11px] text-[#A0A5A1]"><UiText text="Distinct culinary classes" /></p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#EFEEEB] bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A0A5A1]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder={ui("Search category name, Vietnamese title, or slug...")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] py-2 pl-9 pr-4 text-xs font-medium text-[#07241A] placeholder-[#A0A5A1] outline-none transition focus:border-[#1E3A2F] focus:bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 text-xs font-semibold text-[#424844] outline-none transition focus:border-[#1E3A2F] focus:bg-white"
          >
            <option value="All">{ui("All Groups")}</option>
            <option value="Recipe Category">{ui("Recipe Category")}</option>
            <option value="Ingredient Group">{ui("Ingredient Group")}</option>
            <option value="Dietary Style">{ui("Dietary Style")}</option>
            <option value="Meal Type">{ui("Meal Type")}</option>
          </select>

          {/* Status dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 text-xs font-semibold text-[#424844] outline-none transition focus:border-[#1E3A2F] focus:bg-white"
          >
            <option value="All">{ui("All Status")}</option>
            <option value="Active">{ui("Active")}</option>
            <option value="Hidden">{ui("Hidden")}</option>
          </select>

          {(searchQuery || typeFilter !== "All" || statusFilter !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setTypeFilter("All");
                setStatusFilter("All");
              }}
              className="rounded-xl px-2.5 py-2 text-xs font-medium text-[#727974] hover:bg-[#F2EFE9] hover:text-[#07241A]"
            >
              <UiText text="Reset Filters" />
            </button>
          )}
        </div>
      </div>

      {/* Categories Table / Card Grid */}
      <div className="overflow-hidden rounded-2xl border border-[#EFEEEB] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#EFEEEB] bg-[#FBF9F6] text-[11px] font-bold uppercase tracking-wider text-[#727974]">
              <tr>
                <th className="py-3.5 pl-6 pr-4"><UiText text="Category & Icon" /></th>
                <th className="px-4 py-3.5"><UiText text="Group Type" /></th>
                <th className="px-4 py-3.5"><UiText text="Slug Key" /></th>
                <th className="px-4 py-3.5"><UiText text="Recipes" /></th>
                <th className="px-4 py-3.5"><UiText text="Status" /></th>
                <th className="px-4 py-3.5"><UiText text="Updated" /></th>
                <th className="py-3.5 pl-4 pr-6 text-right"><UiText text="Actions" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEEEB]">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#727974]">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-3xl">🏷️</span>
                      <p className="font-semibold text-[#07241A]"><UiText text="No categories found matching your filter." /></p>
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
                  <tr key={cat.id} className="transition hover:bg-[#FBF9F6]/80">
                    <td className="py-4 pl-6 pr-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2EFE9] text-xl shadow-xs">
                          {cat.icon}
                        </span>
                        <div>
                          <div className="font-bold text-[#07241A]">{cat.name}</div>
                          <div className="text-[11px] font-medium text-[#727974]">{cat.nameVi}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          cat.type === "Recipe Category"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : cat.type === "Ingredient Group"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : cat.type === "Dietary Style"
                            ? "bg-blue-50 text-blue-800 border border-blue-200"
                            : "bg-purple-50 text-purple-800 border border-purple-200"
                        }`}
                      >
                        {cat.type}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-mono text-[11px] text-[#727974]">
                      {cat.slug}
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-[#07241A]">
                        {cat.itemCount}
                        <span className="text-[11px] font-normal text-[#A0A5A1]">recipes</span>
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(cat.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition ${
                          cat.status === "Active"
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                        title="Click to toggle status"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            cat.status === "Active" ? "bg-emerald-600" : "bg-gray-400"
                          }`}
                        />
                        {cat.status}
                      </button>
                    </td>

                    <td className="px-4 py-4 text-[11px] text-[#A0A5A1]">
                      {cat.updatedAt}
                    </td>

                    <td className="py-4 pl-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(cat)}
                          className="rounded-lg border border-[#EFEEEB] bg-white p-1.5 text-[#424844] shadow-xs transition hover:border-[#1E3A2F] hover:text-[#1E3A2F]"
                          title="Edit Category"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="rounded-lg border border-[#EFEEEB] bg-white p-1.5 text-red-600 shadow-xs transition hover:border-red-300 hover:bg-red-50"
                          title="Delete Category"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

      {/* Modal: Create / Edit Category */}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                    <UiText text="Name (English)" /> *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tofu & Soy"
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
                    placeholder="e.g. Đậu phụ & Đậu nành"
                    value={formNameVi}
                    onChange={(e) => setFormNameVi(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 text-xs font-semibold text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                    <UiText text="Taxonomy Group" />
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ExtendedCategory["type"])}
                    className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 text-xs font-semibold text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white"
                  >
                    <option value="Recipe Category">Recipe Category</option>
                    <option value="Ingredient Group">Ingredient Group</option>
                    <option value="Dietary Style">Dietary Style</option>
                    <option value="Meal Type">Meal Type</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                    <UiText text="Icon Emoji" />
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="🌱"
                    value={formIcon}
                    onChange={(e) => setFormIcon(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 text-center text-sm font-semibold outline-none focus:border-[#1E3A2F] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                  <UiText text="URL Slug" /> *
                </label>
                <input
                  type="text"
                  required
                  placeholder="tofu-soy"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 font-mono text-xs text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                  <UiText text="Description" />
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description for recipe editors and users..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2 text-xs text-[#07241A] outline-none focus:border-[#1E3A2F] focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="statusToggle"
                  checked={formStatus === "Active"}
                  onChange={(e) => setFormStatus(e.target.checked ? "Active" : "Hidden")}
                  className="h-4 w-4 rounded border-gray-300 text-[#1E3A2F] focus:ring-[#1E3A2F]"
                />
                <label htmlFor="statusToggle" className="text-xs font-semibold text-[#07241A]">
                  <UiText text="Active and visible across the VeggieMate application" />
                </label>
              </div>

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
                  className="rounded-xl bg-[#1E3A2F] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#2A4E40]"
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
