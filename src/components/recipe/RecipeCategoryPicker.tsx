"use client";

import { useLanguage } from "@/context/LanguageContext";
import { CATEGORY_TYPES, categoryName, categoryTypeLabels, type RecipeCategory } from "@/lib/recipe-categories";

export default function RecipeCategoryPicker({ categories, selected, onChange }: { categories: RecipeCategory[]; selected: number[]; onChange: (ids: number[]) => void }) {
  const { language, t } = useLanguage();
  return <div className="space-y-4">{CATEGORY_TYPES.filter(type => type !== "DIETARY_TYPE").map(type =>
    <fieldset key={type}><legend className="mb-2 text-sm font-semibold">{t(...categoryTypeLabels[type])}</legend>
      <div className="flex flex-wrap gap-x-5 gap-y-2">{categories.filter(c => c.type === type && c.isActive).map(c => <label key={c.id} className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={selected.includes(c.id)} onChange={e => onChange(e.target.checked ? [...selected, c.id] : selected.filter(id => id !== c.id))} />{categoryName(c, language)}
      </label>)}</div></fieldset>)}</div>;
}
