"use client";

import { useState, type FormEvent } from "react";
import { useLanguage } from "@/context/LanguageContext";
import BmiTypePicker from "./BmiTypePicker";
import { setRecipeBmiTypes, setRecipeCategories, type AdminRecipeBmi, type BmiType } from "@/lib/bmi-api";

function BmiAssignmentRow({ recipe, types, onSaved, onRemove }: {
  recipe: AdminRecipeBmi;
  types: BmiType[];
  onSaved: (ids: number[]) => void;
  onRemove: () => Promise<void>;
}) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState(recipe.bmiTypes.map(type => type.id));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const changed = selected.length !== recipe.bmiTypes.length || selected.some(id => !recipe.bmiTypes.some(type => type.id === id));

  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy || !changed) return;
    setBusy(true); setMessage("");
    try {
      await setRecipeBmiTypes(recipe.postId, selected);
      onSaved(selected);
      setMessage(t("Saved.", "Đã lưu."));
    } catch {
      setMessage(t("Could not save BMI groups.", "Không lưu được nhóm BMI."));
    } finally { setBusy(false); }
  }

  return <form onSubmit={save} className="grid gap-3 border-t border-[#EFEEEB] py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] lg:items-center">
    <div className="min-w-0"><p className="break-words text-sm font-semibold text-[#07241A]">{recipe.recipeName}</p><p className="break-words text-xs text-[#727974]">#{recipe.postId} · {recipe.title}</p></div>
    <BmiTypePicker catalog={types} selected={selected} onChange={ids => { setSelected(ids); setMessage(""); }} disabled={busy} />
    <div className="flex items-center gap-2 lg:justify-end"><button type="submit" disabled={busy || !changed} className="rounded-lg bg-[#1E3A2F] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">{busy ? t("Saving...", "Đang lưu...") : t("Save", "Lưu")}</button><button type="button" disabled={busy} onClick={() => void onRemove()} className="rounded-lg border border-[#EFEEEB] px-3 py-2 text-xs text-[#727974] disabled:opacity-40">{t("Remove from category", "Bỏ khỏi danh mục")}</button></div>
    {message && <p role="status" className="text-xs text-[#254B38] lg:col-span-3">{message}</p>}
  </form>;
}

export default function CategoryRecipeAssignments({ categoryId, categoryName, recipes, types, onChanged, onBmiSaved }: {
  categoryId: number;
  categoryName: string;
  recipes: AdminRecipeBmi[];
  types: BmiType[];
  onChanged: () => Promise<void>;
  onBmiSaved: (recipeId: number, ids: number[]) => void;
}) {
  const { t } = useLanguage();
  const [addId, setAddId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const assigned = recipes.filter(recipe => recipe.categoryIds?.includes(categoryId));
  const available = recipes.filter(recipe => !recipe.categoryIds?.includes(categoryId));

  async function changeCategory(recipe: AdminRecipeBmi, add: boolean) {
    setBusy(true); setError("");
    try {
      const ids = add ? [...(recipe.categoryIds || []), categoryId] : recipe.categoryIds.filter(id => id !== categoryId);
      await setRecipeCategories(recipe.postId, ids);
      await onChanged();
      setAddId("");
    } catch {
      setError(t("Could not update this recipe category.", "Không cập nhật được danh mục của món."));
    } finally { setBusy(false); }
  }

  return <div className="bg-[#FAF9F5] px-6 py-5">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-serif text-lg font-semibold text-[#07241A]">{t("Recipes in", "Món trong")} {categoryName} ({assigned.length})</h3></div>
    <div className="mt-4 flex flex-wrap gap-2"><label className="sr-only" htmlFor={`add-recipe-${categoryId}`}>{t("Choose recipe", "Chọn món")}</label><select id={`add-recipe-${categoryId}`} value={addId} onChange={event => setAddId(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-[#E6E3DA] bg-white px-3 py-2 text-sm"><option value="">{t("Choose a recipe to add", "Chọn món để thêm")}</option>{available.map(recipe => <option key={recipe.postId} value={recipe.postId}>{recipe.recipeName} (#{recipe.postId})</option>)}</select><button type="button" disabled={!addId || busy} onClick={() => { const recipe = recipes.find(item => item.postId === Number(addId)); if (recipe) void changeCategory(recipe, true); }} className="rounded-lg bg-[#1E3A2F] px-4 py-2 text-sm text-white disabled:opacity-40">{t("Add", "Thêm")}</button></div>
    {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
    <div className="mt-4">{assigned.length === 0 ? <p className="py-4 text-sm text-[#727974]">{t("No recipes in this category yet.", "Danh mục này chưa có món nào.")}</p> : assigned.map(recipe => <BmiAssignmentRow key={recipe.postId} recipe={recipe} types={types} onSaved={ids => onBmiSaved(recipe.postId, ids)} onRemove={() => changeCategory(recipe, false)} />)}</div>
  </div>;
}
