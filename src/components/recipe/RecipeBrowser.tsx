"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { RecipeResponse } from "@/lib/recipe-api";
import { CATEGORY_TYPES, categoryName, categoryTypeLabels, getRecipeCategories, type RecipeCategory } from "@/lib/recipe-categories";
import { localizeRecipeTitle } from "@/lib/localized-content";
import { useLanguage } from "@/context/LanguageContext";

export default function RecipeBrowser({ keyword = "" }: { keyword?: string }) {
  const { language, t } = useLanguage();
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [catalogFailed, setCatalogFailed] = useState(false);
  const [result, setResult] = useState<{ key: string; recipes: RecipeResponse[]; failed: boolean } | null>(null);
  const query = new URLSearchParams({ keyword });
  if (type) query.set("categoryType", type);
  if (category) query.set("category", category);
  const queryKey = query.toString();
  const loading = result?.key !== queryKey;
  useEffect(() => { getRecipeCategories().then(setCategories).catch(() => setCatalogFailed(true)); }, []);
  useEffect(() => {
    let cancelled = false;
    apiGet<RecipeResponse[]>(`/api/recipes/search?${queryKey}`)
      .then(recipes => { if (!cancelled) setResult({ key: queryKey, recipes, failed: false }); })
      .catch(() => { if (!cancelled) setResult({ key: queryKey, recipes: [], failed: true }); });
    return () => { cancelled = true; };
  }, [queryKey]);
  return <section className="mt-12 border-t border-[#E5E7DF] pt-6">
    <h2 className="font-serif text-3xl">{t("Community recipes", "Công thức cộng đồng")}</h2>
    <div className="my-5 flex flex-wrap gap-4">
      <label className="text-sm">{t("Category type", "Nhóm danh mục")}<select value={type} onChange={e => { setType(e.target.value); setCategory(""); }} className="ml-2 rounded border p-2"><option value="">{t("All", "Tất cả")}</option>{CATEGORY_TYPES.map(value => <option key={value} value={value}>{t(...categoryTypeLabels[value])}</option>)}</select></label>
      <label className="text-sm">{t("Category", "Danh mục")}<select value={category} onChange={e => setCategory(e.target.value)} className="ml-2 rounded border p-2"><option value="">{t("All", "Tất cả")}</option>{categories.filter(c => !type || c.type === type).map(c => <option key={c.id} value={c.id}>{categoryName(c, language)}</option>)}</select></label>
    </div>
    {catalogFailed && <p role="alert" className="mb-4 text-sm text-red-700">{t("Could not load recipe categories.", "Không thể tải danh mục công thức.")}</p>}
    {loading ? <p>{t("Loading recipes...", "Đang tải công thức...")}</p> : result.failed ? <p role="alert">{t("Could not load recipes. Please try again.", "Không thể tải công thức. Vui lòng thử lại.")}</p> : result.recipes.length === 0 ? <p>{t("No matching recipes.", "Không có công thức phù hợp.")}</p> :
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{result.recipes.map(r => <Link key={r.postId} href={`/view-detail/${r.postId}`} className="overflow-hidden rounded-lg border bg-white">
        <img src={r.thumbnailUrl || "/images/recipe_tofu_tomato.png"} alt={localizeRecipeTitle(r.recipeName, language)} className="aspect-video w-full object-cover" />
        <div className="p-4"><h3 className="font-serif text-xl">{localizeRecipeTitle(r.recipeName, language)}</h3><p className="mt-3 text-xs text-[#727974]">{r.categories?.map(c => categoryName(c, language)).join(" · ")}</p></div>
      </Link>)}</div>}
  </section>;
}
