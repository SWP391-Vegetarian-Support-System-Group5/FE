"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiFetch, apiGet } from "@/lib/api";
import type { RecipeResponse } from "@/lib/recipe-api";
import { getRecipeCategories, type RecipeCategory } from "@/lib/recipe-categories";

export default function RecipeCategoriesPage() {
  const [items, setItems] = useState<RecipeCategory[]>([]);
  const [recipes, setRecipes] = useState<RecipeResponse[]>([]);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<RecipeCategory | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const [nextItems, nextRecipes] = await Promise.all([getRecipeCategories(true), apiGet<RecipeResponse[]>("/api/recipes/search")]);
    setItems(nextItems); setRecipes(nextRecipes);
  }
  useEffect(() => { void load().catch(() => setError("Không thể tải danh mục.")); }, []);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true); setError("");
    try {
      const response = await apiFetch(`/api/recipe-categories${editing ? `/${editing.id}` : ""}`, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({ name: name.trim(), isActive: editing?.isActive ?? true }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || "Không thể lưu danh mục.");
      setName(""); setEditing(null); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể lưu danh mục."); }
    finally { setSaving(false); }
  }
  async function toggle(item: RecipeCategory) {
    setSaving(true); setError("");
    try {
      const response = await apiFetch(`/api/recipe-categories/${item.id}`, { method: "PUT", body: JSON.stringify({ name: item.name, isActive: !item.isActive }) });
      if (!response.ok) throw new Error("Không thể cập nhật trạng thái.");
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể cập nhật trạng thái."); }
    finally { setSaving(false); }
  }
  return <section className="space-y-6">
    <div><p className="text-sm font-semibold text-[#658266]">DANH MỤC CÔNG THỨC</p><h1 className="mt-1 font-serif text-3xl text-[#07241A]">Danh mục công thức</h1><p className="mt-2 text-sm text-[#647068]">Mỗi danh mục chỉ gồm tên, trạng thái và các công thức được gán vào.</p></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <form onSubmit={save} className="flex flex-wrap gap-3 rounded-2xl border border-[#E5E7DF] bg-white p-4">
      <input required maxLength={150} value={name} onChange={event => setName(event.target.value)} placeholder="Tên danh mục" className="min-w-64 flex-1 rounded-xl border border-[#D9E6DC] px-4 py-2.5 outline-none focus:border-[#1E3A2F]" />
      <button disabled={saving} className="rounded-xl bg-[#1E3A2F] px-5 py-2.5 font-semibold text-white disabled:opacity-50">{editing ? "Lưu chỉnh sửa" : "Thêm danh mục"}</button>
      {editing && <button type="button" onClick={() => { setEditing(null); setName(""); }} className="rounded-xl border px-5 py-2.5">Hủy</button>}
    </form>
    <div className="overflow-hidden rounded-2xl border border-[#E5E7DF] bg-white">
      {items.map(item => {
        const mapped = recipes.filter(recipe => recipe.categories.some(category => category.id === item.id));
        return <details key={item.id} className="border-b border-[#EFEEEB] last:border-0"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4"><div><h2 className="font-semibold text-[#07241A]">{item.name}</h2><p className="mt-1 text-sm text-[#647068]">{mapped.length} công thức</p></div><div className="flex items-center gap-3"><button type="button" onClick={event => { event.preventDefault(); setEditing(item); setName(item.name); }} className="rounded-lg border px-3 py-1.5 text-sm">Sửa</button><button type="button" disabled={saving} onClick={event => { event.preventDefault(); void toggle(item); }} className="rounded-lg border px-3 py-1.5 text-sm">{item.isActive ? "Đang hoạt động" : "Tạm ẩn"}</button></div></summary><div className="border-t bg-[#FAFCFA] px-5 py-4"><p className="mb-2 text-sm font-medium">Công thức trong danh mục</p>{mapped.length ? <ul className="grid gap-2 sm:grid-cols-2">{mapped.map(recipe => <li key={recipe.postId} className="rounded-lg bg-white px-3 py-2 text-sm">{recipe.recipeName}</li>)}</ul> : <p className="text-sm text-[#647068]">Chưa có công thức.</p>}</div></details>;
      })}
    </div>
  </section>;
}
