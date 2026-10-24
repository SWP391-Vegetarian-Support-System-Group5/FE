"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { getAdminRecipeBmiTypes, getBmiTypes, setRecipeBmiTypes, type AdminRecipeBmi, type BmiType } from "@/lib/bmi-api";
import BmiTypePicker from "./BmiTypePicker";
import { localizeRecipeTitle } from "@/lib/localized-content";

function RecipeRow({ recipe, catalog, onSaved }: { recipe: AdminRecipeBmi; catalog: BmiType[]; onSaved: (ids: number[]) => void }) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState(recipe.bmiTypes.map(type => type.id));
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<"saved" | "error" | null>(null);
  const lock = useRef(false);
  const changed = selected.length !== recipe.bmiTypes.length || selected.some(id => !recipe.bmiTypes.some(type => type.id === id));
  return <form className="grid min-w-0 gap-4 border-t border-[#E5E7DF] py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] lg:items-center" onSubmit={async event => {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setPending(true); setResult(null);
    try { await setRecipeBmiTypes(recipe.postId, selected); onSaved(selected); setResult("saved"); }
    catch { setResult("error"); }
    finally { lock.current = false; setPending(false); }
  }}>
    <div className="min-w-0"><p className="break-words text-sm font-semibold">{localizeRecipeTitle(recipe.recipeName, "vi")}</p><p className="mt-1 break-words text-xs text-[#727974]">#{recipe.postId} · {localizeRecipeTitle(recipe.title, "vi")}</p></div>
    <BmiTypePicker catalog={catalog} selected={selected} onChange={ids => { setSelected(ids); setResult(null); }} disabled={pending} />
    <div><button disabled={pending || !changed} className="rounded-lg bg-[#254B38] px-4 py-2 text-sm text-white disabled:opacity-40">{pending ? t("Saving...", "Đang lưu...") : t("Save", "Lưu")}</button>
      {result === "saved" && <p role="status" className="mt-2 text-xs text-[#254B38]">{t("Saved", "Đã lưu")}</p>}
      {result === "error" && <p role="alert" className="mt-2 max-w-48 text-xs text-red-700">{t("Could not save. Check your admin session and retry.", "Không lưu được. Kiểm tra phiên admin và thử lại.")}</p>}
    </div>
  </form>;
}

export default function RecipeBmiManager() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [data, setData] = useState<{ recipes: AdminRecipeBmi[]; catalog: BmiType[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    const controller = new AbortController();
    Promise.all([getAdminRecipeBmiTypes(controller.signal), getBmiTypes(controller.signal)])
      .then(([recipes, catalog]) => { if (!controller.signal.aborted) { setData({ recipes, catalog }); setFailed(false); } })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [user?.role, revision]);
  if (user?.role !== "ADMIN") return null;
  const recipes = data?.recipes.filter(recipe => `${recipe.recipeName} ${recipe.title} ${localizeRecipeTitle(recipe.recipeName, "vi")} ${localizeRecipeTitle(recipe.title, "vi")}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())) ?? [];
  return <section className="min-w-0 border-y border-[#E5E7DF] py-6">
    <header className="flex flex-wrap items-center justify-between gap-4"><h2 className="font-serif text-2xl font-semibold">{t("Recipe BMI groups", "Nhóm BMI của công thức")}</h2><Link href="/create-content" className="text-sm font-semibold text-[#254B38] underline">{t("Create recipe", "Tạo công thức")}</Link></header>
    <label className="my-4 block text-sm">{t("Search recipes", "Tìm công thức")}<input type="search" value={query} onChange={event => setQuery(event.target.value)} className="mt-2 block w-full max-w-lg rounded-lg border border-[#E5E7DF] bg-white px-3 py-2" /></label>
    {failed ? <p role="alert" className="text-sm text-red-700">{t("Could not load recipes.", "Không tải được công thức.")} <button type="button" onClick={() => setRevision(value => value + 1)} className="underline">{t("Retry", "Thử lại")}</button></p>
      : !data ? <p role="status">{t("Loading recipes...", "Đang tải công thức...")}</p>
        : recipes.length === 0 ? <p className="py-4 text-sm text-[#727974]">{t("No recipes found.", "Không tìm thấy công thức.")}</p>
          : recipes.map(recipe => <RecipeRow key={recipe.postId} recipe={recipe} catalog={data.catalog} onSaved={ids => setData(current => current && ({ ...current, recipes: current.recipes.map(item => item.postId === recipe.postId ? { ...item, bmiTypes: current.catalog.filter(type => ids.includes(type.id)) } : item) }))} />)}
  </section>;
}
