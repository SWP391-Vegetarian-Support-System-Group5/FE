"use client";

import { categoryName, type RecipeCategory } from "@/lib/recipe-categories";

export default function RecipeCategoryPicker({ categories, selected, onChange, loading = false }: { categories: RecipeCategory[]; selected: number[]; onChange: (ids: number[]) => void; loading?: boolean }) {
  const active = categories.filter(category => category.isActive);
  return <div className="rounded-2xl border border-[#D9E6DC] bg-[#F7FAF7] p-4 sm:p-5">
    <h3 className="text-sm font-bold text-[#07241A]">Danh mục bài viết</h3>
    <p className="mt-1 text-xs text-[#59635C]">Chọn các danh mục phù hợp để mọi người tìm thấy công thức của bạn.</p>
    {active.length === 0 ? <p className="mt-4 text-sm text-[#59635C]">{loading ? "Đang tải danh mục..." : "Chưa có danh mục hoạt động."}</p> :
      <div className="mt-4 flex flex-wrap gap-2">{active.map(category => <label key={category.id} className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${selected.includes(category.id) ? "border-[#1E3A2F] bg-[#E4F0E7] text-[#07241A]" : "border-[#EFEEEB] bg-white text-[#424844] hover:border-[#A8BFAE]"}`}>
        <input type="checkbox" checked={selected.includes(category.id)} onChange={event => onChange(event.target.checked ? [...selected, category.id] : selected.filter(id => id !== category.id))} className="accent-[#1E3A2F]" />
        {categoryName(category)}
      </label>)}</div>}
  </div>;
}
