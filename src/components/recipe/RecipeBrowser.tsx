"use client";

import { useEffect, useState } from "react";
import CardSkeleton from "@/components/ui/CardSkeleton";
import FeedImage from "@/components/ui/FeedImage";
import { useAuth } from "@/context/AuthContext";
import { usePersonalizedRevision } from "@/hooks/usePersonalizedRevision";
import { comparePostRatings } from "@/lib/post-ranking";
import Link from "next/link";
import { apiGet, getMediaUrl } from "@/lib/api";
import type { RecipeResponse } from "@/lib/recipe-api";
import { categoryName, getRecipeCategories, type RecipeCategory } from "@/lib/recipe-categories";
import { localizeRecipeTitle } from "@/lib/localized-content";
import { useLanguage } from "@/context/LanguageContext";

export default function RecipeBrowser({ keyword = "" }: { keyword?: string }) {
  const { language, t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const personalizedRevision = usePersonalizedRevision();
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [category, setCategory] = useState("");
  const [catalogFailed, setCatalogFailed] = useState(false);
  const [result, setResult] = useState<{ key: string; recipes: RecipeResponse[]; failed: boolean } | null>(null);
  const query = new URLSearchParams({ keyword });
  if (category) query.set("category", category);
  const queryKey = query.toString();
  const requestKey = JSON.stringify([queryKey, user?.uid, personalizedRevision]);
  const loading = authLoading || result?.key !== requestKey;
  useEffect(() => { getRecipeCategories().then(setCategories).catch(() => setCatalogFailed(true)); }, []);
  useEffect(() => {
    if (authLoading) return;
    const controller = new AbortController();
    apiGet<RecipeResponse[]>(`/api/recipes/search?${queryKey}`, { cache: "no-store", signal: controller.signal })
      .then(recipes => { if (!controller.signal.aborted) setResult({ key: requestKey, recipes, failed: false }); })
      .catch(() => { if (!controller.signal.aborted) setResult({ key: requestKey, recipes: [], failed: true }); });
    return () => controller.abort();
  }, [queryKey, requestKey, authLoading]);
  const recipes = result?.key === requestKey ? result.recipes : [];
  const ranked = [...recipes].sort((a, b) => comparePostRatings(
    { ...a, averageRating: a.averageRating ?? 0, ratingCount: a.ratingCount ?? 0 },
    { ...b, averageRating: b.averageRating ?? 0, ratingCount: b.ratingCount ?? 0 },
  ));
  return <section className="mt-12 border-t border-[#E5E7DF] pt-6">
    <h2 className="font-serif text-3xl">{t("Community recipes", "Công thức cộng đồng")}</h2>
    <div className="my-5 flex flex-wrap gap-4">
      <label className="text-sm">{t("Category", "Danh mục")}<select value={category} onChange={e => setCategory(e.target.value)} className="ml-2 rounded border p-2"><option value="">{t("All", "Tất cả")}</option>{categories.map(c => <option key={c.id} value={c.id}>{categoryName(c, language)}</option>)}</select></label>
    </div>
    {catalogFailed && <p role="alert" className="mb-4 text-sm text-red-700">{t("Could not load recipe categories.", "Không thể tải danh mục công thức.")}</p>}
    {loading ? <CardSkeleton count={4} compact /> : result?.failed ? <p role="alert">{t("Could not load recipes. Please try again.", "Không thể tải công thức. Vui lòng thử lại.")}</p> : recipes.length === 0 ? <p role="status">{t("No recipes match your profile and current search.", "Không có công thức phù hợp với hồ sơ và tìm kiếm hiện tại.")}</p> :
      <div className="vm-stagger grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{ranked.map(r => <Link key={r.postId} href={`/view-detail/${r.postId}`} className="vm-card overflow-hidden rounded-lg border bg-white">
        <div className="aspect-video overflow-hidden bg-[#EDF1E8]">{(r.imageUrl ?? r.thumbnailUrl) ? <FeedImage src={getMediaUrl(r.imageUrl ?? r.thumbnailUrl)} alt={localizeRecipeTitle(r.recipeName, language)} compact /> : <span className="flex h-full items-center justify-center text-sm text-[#59635C]">{t("No image yet", "Chưa có ảnh")}</span>}</div>
        <div className="p-4"><h3 className="font-serif text-xl">{localizeRecipeTitle(r.recipeName, language)}</h3><p className="mt-3 text-xs text-[#727974]">{r.categories?.map(c => categoryName(c, language)).join(" · ")}</p></div>
      </Link>)}</div>}
  </section>;
}
