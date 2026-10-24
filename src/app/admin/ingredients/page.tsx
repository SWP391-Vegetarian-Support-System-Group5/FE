"use client";

import { useEffect, useState, type FormEvent } from "react";
import ContentIcon from "@/components/content/ContentIcon";
import { useLanguage } from "@/context/LanguageContext";
import { localizeIngredient, localizeIngredientCategory } from "@/lib/localized-content";
import { getAllergens, getIngredientCategories, getIngredients, updateIngredient, type AllergenItem, type IngredientCategoryItem, type IngredientItem } from "@/lib/recipe-api";

const labels: Record<string, [string, string]> = {
  PLANT: ["Plant", "Thực vật"], DAIRY: ["Dairy", "Sữa và chế phẩm từ sữa"], EGG: ["Egg", "Trứng"],
  HONEY: ["Honey", "Mật ong"], UNVERIFIED: ["Unverified", "Chưa xác minh"],
};

export default function IngredientsPage() {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<IngredientItem[]>([]);
  const [categories, setCategories] = useState<IngredientCategoryItem[]>([]);
  const [allergens, setAllergens] = useState<AllergenItem[]>([]);
  const [editing, setEditing] = useState<IngredientItem | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([getIngredients(), getIngredientCategories(), getAllergens()])
      .then(([nextItems, nextCategories, nextAllergens]) => {
        if (active) { setItems(nextItems); setCategories(nextCategories); setAllergens(nextAllergens); }
      })
      .catch(() => { if (active) setError(t("Could not load ingredients.", "Không thể tải nguyên liệu.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [t]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editing || saving) return;
    setSaving(true); setError("");
    try {
      const updated = await updateIngredient(editing.id, { name: editing.name, ingredientCategoryId: editing.ingredientCategoryId, allergenId: editing.allergenId });
      setItems(current => current.map(item => item.id === updated.id ? updated : item));
      setEditing(null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t("Could not save ingredient.", "Không thể lưu nguyên liệu."));
    } finally { setSaving(false); }
  }

  const visibleItems = items.filter(item => (!categoryFilter || item.ingredientCategoryId === Number(categoryFilter))
    && `${item.name} ${localizeIngredient(item.name, language)}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  return <div className="space-y-6 text-[#07241A]">
    <h1 className="font-serif text-3xl">{t("Ingredients", "Nguyên liệu")}</h1>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {editing && <form onSubmit={save} className="border-y border-[#D9E6DC] py-5">
      <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm">{t("Name", "Tên")}<input required maxLength={200} value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} className="mt-1 block w-full rounded border border-[#D9E6DC] bg-white p-2" /></label>
        <label className="text-sm">{t("Category", "Nhóm nguyên liệu")}<select value={editing.ingredientCategoryId} onChange={event => setEditing({ ...editing, ingredientCategoryId: Number(event.target.value) })} className="mt-1 block w-full rounded border border-[#D9E6DC] bg-white p-2">{categories.map(category => <option key={category.id} value={category.id}>{labels[category.code] ? t(...labels[category.code]) : category.name}</option>)}</select></label>
        <label className="text-sm">{t("Allergen", "Chất gây dị ứng")}<select value={editing.allergenId ?? ""} onChange={event => setEditing({ ...editing, allergenId: event.target.value ? Number(event.target.value) : null })} className="mt-1 block w-full rounded border border-[#D9E6DC] bg-white p-2"><option value="">{t("None", "Không có")}</option>{allergens.map(allergen => <option key={allergen.id} value={allergen.id}>{localizeIngredient(allergen.name, language)}</option>)}</select></label>
        <div className="flex items-center gap-3 sm:col-span-3">
          <button type="submit" className="inline-flex items-center gap-2 rounded bg-[#1E3A2F] px-4 py-2 text-sm text-white disabled:opacity-60"><ContentIcon name="check" />{saving ? t("Saving...", "Đang lưu...") : t("Save", "Lưu")}</button>
          <button type="button" onClick={() => setEditing(null)} title={t("Cancel", "Hủy")} aria-label={t("Cancel", "Hủy")} className="flex h-9 w-9 items-center justify-center rounded border border-[#D9E6DC]"><ContentIcon name="close" /></button>
        </div>
      </fieldset>
    </form>}
    <div className="flex flex-wrap items-end gap-4">
      <label className="min-w-0 flex-1 text-sm">{t("Search", "Tìm kiếm")}<input type="search" value={query} onChange={event => setQuery(event.target.value)} className="mt-1 block w-full rounded border border-[#D9E6DC] bg-white p-2" /></label>
      <label className="text-sm">{t("Category", "Nhóm nguyên liệu")}<select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} className="mt-1 block max-w-full rounded border border-[#D9E6DC] bg-white p-2"><option value="">{t("All", "Tất cả")}</option>{categories.map(category => <option key={category.id} value={category.id}>{labels[category.code] ? t(...labels[category.code]) : category.name}</option>)}</select></label>
    </div>
    {loading ? <p className="text-sm">{t("Loading...", "Đang tải...")}</p> : <div className="overflow-x-auto">
      <table className="w-full text-left text-sm"><thead><tr className="border-b border-[#D9E6DC]"><th className="py-3">{t("Name", "Tên")}</th><th>{t("Category", "Nhóm nguyên liệu")}</th><th>{t("Allergen", "Chất gây dị ứng")}</th><th><span className="sr-only">{t("Actions", "Thao tác")}</span></th></tr></thead>
        <tbody>{visibleItems.map(item => {
          const category = categories.find(candidate => candidate.id === item.ingredientCategoryId);
          return <tr key={item.id} className="border-b border-[#EFEEEB]">
            <td className="py-3 pr-4">{localizeIngredient(item.name, language)}</td>
            <td className="pr-4">{localizeIngredientCategory(category?.code ?? item.dietaryGroup, category?.name ?? item.dietaryGroup)}</td>
            <td className="pr-4">{item.allergenId ? localizeIngredient(allergens.find(allergen => allergen.id === item.allergenId)?.name || "", language) : t("None", "Không có")}</td>
            <td><button type="button" onClick={() => setEditing({ ...item })} title={t("Edit ingredient", "Sửa nguyên liệu")} aria-label={t("Edit ingredient", "Sửa nguyên liệu")} className="flex h-8 w-8 items-center justify-center rounded hover:bg-[#D9E6DC]"><ContentIcon name="edit" /></button></td>
          </tr>;
        })}</tbody>
      </table>
      {visibleItems.length === 0 && <p className="py-6 text-sm text-[#727974]">{t("No ingredients found.", "Không tìm thấy nguyên liệu.")}</p>}
    </div>}
  </div>;
}
