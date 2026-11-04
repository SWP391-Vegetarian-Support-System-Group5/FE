"use client";

import { useLanguage } from "@/context/LanguageContext";
import { CATEGORY_TYPES, categoryName, categoryTypeLabels, type RecipeCategory } from "@/lib/recipe-categories";

export default function RecipeCategoryPicker({ categories, selected, onChange, loading = false }: { categories: RecipeCategory[]; selected: number[]; onChange: (ids: number[]) => void; loading?: boolean }) {
  const { language, t } = useLanguage();
  const active = categories.filter(category => category.isActive && CATEGORY_TYPES.some(type => type === category.type));
  return <div className="rounded-2xl border border-[#D9E6DC] bg-[#F7FAF7] p-4 sm:p-5">
    <h3 className="text-sm font-bold text-[#07241A]">Danh mục bài viết</h3>
    <p className="mt-1 text-xs text-[#59635C]">Chọn các danh mục phù hợp để mọi người tìm thấy công thức của bạn. Danh mục do quản trị viên tạo sẽ tự xuất hiện ở đây.</p>
    {active.length === 0 ? <p className="mt-4 text-sm text-[#59635C]">{loading ? "Đang tải danh mục..." : "Chưa có danh mục hoạt động."}</p> :
      <div className="mt-4 space-y-4">{CATEGORY_TYPES.map(type => {
        const options = active.filter(category => category.type === type);
        if (options.length === 0) return null;
        return <fieldset key={type}><legend className="mb-2 text-xs font-semibold text-[#424844]">{t(...categoryTypeLabels[type])}</legend>
          <div className="flex flex-wrap gap-2">{options.map(category => <label key={category.id} className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${selected.includes(category.id) ? "border-[#1E3A2F] bg-[#E4F0E7] text-[#07241A]" : "border-[#EFEEEB] bg-white text-[#424844] hover:border-[#A8BFAE]"}`}>
            <input type="checkbox" checked={selected.includes(category.id)} onChange={event => onChange(event.target.checked ? [...selected, category.id] : selected.filter(id => id !== category.id))} className="accent-[#1E3A2F]" />
            {categoryName(category, language)}
          </label>)}</div>
        </fieldset>;
      })}</div>}
  </div>;
}
