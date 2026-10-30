"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api";
import ImageFilePicker from "@/components/ImageFilePicker";
import { uploadImage } from "@/lib/image-upload";
import { useLanguage } from "@/context/LanguageContext";
import { CATEGORY_TYPES, categoryName, categoryTypeLabels, getRecipeCategories, type RecipeCategory } from "@/lib/recipe-categories";

const blank = { name: "", slug: "", type: "MEAL_TYPE", description: "", imageUrl: "", isActive: true };
export default function RecipeCategoriesPage() {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<RecipeCategory[]>([]);
  const [form, setForm] = useState(blank);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [type, setType] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  async function load() { try { setItems(await getRecipeCategories(true)); } catch { setError(t("Could not load categories.", "Không thể tải danh mục.")); } finally { setLoading(false); } }
  useEffect(() => {
    let active = true;
    getRecipeCategories(true)
      .then(data => { if (active) setItems(data); })
      .catch(() => { if (active) setError(t("Could not load categories.", "Không thể tải danh mục.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [t]);
  async function save(e: FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const imageUrl = imageFile ? await uploadImage(imageFile, "categories") : form.imageUrl || null;
      if (imageFile) { setForm({ ...form, imageUrl: imageUrl || "" }); setImageFile(null); }
      const response = await apiFetch(`/api/recipe-categories${editing ? `/${editing}` : ""}`, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, imageUrl, description: form.description || null }) });
      if (!response.ok) { const body = await response.json(); throw new Error(body.message); }
      setForm(blank); setImageFile(null); setEditing(null); await load();
    } catch (e) { setError(e instanceof Error ? e.message : t("Could not save category.", "Không thể lưu danh mục.")); } finally { setSaving(false); }
  }
  return <div className="space-y-6">
    <h1 className="font-serif text-3xl">{t("Recipe categories", "Danh mục công thức")}</h1>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <form onSubmit={save} className="grid gap-4 border-b pb-6 sm:grid-cols-2">
      <label>{t("Name", "Tên")}<input required maxLength={150} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="block w-full rounded border p-2" /></label>
      <label>Đường dẫn rút gọn<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={150} value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="block w-full rounded border p-2" /></label>
      <label>{t("Type", "Nhóm")}<select disabled={editing !== null} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="block w-full rounded border p-2">{CATEGORY_TYPES.map(value => <option key={value} value={value}>{t(...categoryTypeLabels[value])}</option>)}</select></label>
      <ImageFilePicker value={form.imageUrl} file={imageFile} onFileChange={setImageFile} onValueChange={url => setForm({ ...form, imageUrl: url || "" })} disabled={saving} />
      <label className="sm:col-span-2">{t("Description", "Mô tả")}<textarea maxLength={1000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="block w-full rounded border p-2" /></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />{t("Active", "Hoạt động")}</label>
      <div className="flex gap-3"><button disabled={saving} type="submit" className="rounded bg-[#1E3A2F] px-4 py-2 text-white">{saving ? t("Saving...", "Đang lưu...") : t("Save", "Lưu")}</button>{editing && <button type="button" onClick={() => { setEditing(null); setImageFile(null); setForm(blank); }}>{t("Cancel", "Hủy")}</button>}</div>
    </form>
    <label>{t("Type", "Nhóm")}<select value={type} onChange={e => setType(e.target.value)} className="ml-3 rounded border p-2"><option value="">{t("All", "Tất cả")}</option>{CATEGORY_TYPES.map(value => <option key={value} value={value}>{t(...categoryTypeLabels[value])}</option>)}</select></label>
    {loading ? <p>{t("Loading...", "Đang tải...")}</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>{t("Name", "Tên")}</th><th>{t("Type", "Nhóm")}</th><th>{t("Status", "Trạng thái")}</th><th /></tr></thead><tbody>{items.filter(c => !type || c.type === type).map(c => <tr key={c.id} className="border-t"><td className="py-3">{categoryName(c, language)}</td><td>{t(...categoryTypeLabels[c.type])}</td><td>{c.isActive ? t("Active", "Hoạt động") : t("Inactive", "Tạm ẩn")}</td><td><button onClick={() => { setEditing(c.id); setImageFile(null); setForm({ name: c.name, slug: c.slug, type: c.type, description: c.description || "", imageUrl: c.imageUrl || "", isActive: c.isActive }); }}>{t("Edit", "Sửa")}</button></td></tr>)}</tbody></table></div>}
  </div>;
}
