"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import ContentIcon from "@/components/content/ContentIcon";
import { LanguageSwitch } from "@/components/UiText";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { createAllergen, deleteAllergen, listAllergens, updateAllergen, type AdminAllergen } from "@/lib/admin-catalog-api";

export default function AdminAllergensPage() {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const [items, setItems] = useState<AdminAllergen[]>([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<"saved" | "deleted" | "">("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<AdminAllergen | null>(null);
  const [name, setName] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await listAllergens());
      setLoaded(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    listAllergens()
      .then(allergens => { if (active) { setItems(allergens); setLoaded(true); } })
      .catch(failure => { if (active) setError(failure instanceof Error ? failure.message : "Load failed"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const visible = useMemo(() => items.filter(item => item.name.toLocaleLowerCase(locale).includes(query.trim().toLocaleLowerCase(locale))), [items, query, locale]);

  function openForm(item?: AdminAllergen) {
    setEditing(item ?? null);
    setName(item?.name ?? "");
    setError("");
    setNotice("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name === null || busy) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t("Enter an allergen name.", "Nhập tên chất gây dị ứng."));
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (editing) await updateAllergen(editing.id, trimmed);
      else await createAllergen(trimmed);
      await load();
      setName(null);
      setNotice("saved");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t("Could not save allergen.", "Không thể lưu chất gây dị ứng."));
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: AdminAllergen) {
    if (busy || !window.confirm(t(`Delete "${item.name}"?`, `Xóa "${item.name}"?`))) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await deleteAllergen(item.id);
      await load();
      setNotice("deleted");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t("Could not delete allergen.", "Không thể xóa chất gây dị ứng."));
    } finally {
      setBusy(false);
    }
  }

  return <div className="space-y-6 text-[#07241A]">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFEEEB] pb-4">
      <span className="font-serif text-lg font-bold">VeggieMate <span className="font-sans text-xs font-normal text-[#727974]">/ {t("Admin Area", "Khu vực quản trị")}</span></span>
      <div className="flex items-center gap-3"><LanguageSwitch /><span className="text-xs font-semibold">{user?.fullName ?? t("Admin", "Quản trị viên")}</span></div>
    </div>

    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><span className="inline-flex rounded-full border border-[#D5EBDC] bg-[#EAF5EE] px-3 py-1 text-xs font-semibold text-[#1E7E51]">{t("Allergen Catalog", "Danh mục chất gây dị ứng")}</span>
        <h1 className="mt-2 font-serif text-3xl font-bold">{t("Allergens & Health Management", "Quản lý dị ứng và sức khỏe")}</h1>
        <p className="mt-2 text-sm text-[#727974]">{t("Manage the allergen names available to users and ingredients.", "Quản lý tên chất gây dị ứng dùng cho người dùng và nguyên liệu.")}</p></div>
      <button type="button" disabled={loading} onClick={() => openForm()} className="inline-flex items-center gap-2 rounded-lg bg-[#0F2F24] px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-50"><ContentIcon name="plus" />{t("Add Allergen", "Thêm chất gây dị ứng")}</button>
    </div>

    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error} <button type="button" onClick={() => void load()} className="ml-2 underline">{t("Retry", "Thử lại")}</button></div>}
    {notice && <p role="status" className="rounded-lg border border-[#D5EBDC] bg-[#EAF5EE] px-4 py-3 text-sm text-[#1E7E51]">{notice === "saved" ? t("Allergen saved.", "Đã lưu chất gây dị ứng.") : t("Allergen deleted.", "Đã xóa chất gây dị ứng.")}</p>}

    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-[#EFEEEB] bg-white p-5"><p className="text-xs font-bold uppercase text-[#727974]">{t("Catalog Entries", "Mục trong danh mục")}</p><p className="mt-3 text-3xl font-bold">{loading ? "…" : loaded ? items.length.toLocaleString(locale) : "—"}</p></div>
      <div className="rounded-lg border border-[#EFEEEB] bg-white p-5"><p className="text-xs font-bold uppercase text-[#727974]">{t("Search Results", "Kết quả tìm kiếm")}</p><p className="mt-3 text-3xl font-bold">{loading ? "…" : loaded ? visible.length.toLocaleString(locale) : "—"}</p></div>
    </div>

    <label className="block max-w-sm text-xs font-semibold">{t("Search Allergens", "Tìm chất gây dị ứng")}<div className="relative mt-1.5"><ContentIcon name="search" className="absolute left-3 top-2.5 text-[#727974]" /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t("Search by name", "Tìm theo tên")} className="w-full rounded-lg border border-[#EFEEEB] bg-white py-2 pl-10 pr-3 text-sm outline-none focus:border-[#1E3A2F]" /></div></label>

    <div className="overflow-hidden rounded-lg border border-[#EFEEEB] bg-white">
      <div className="flex justify-between border-b border-[#EFEEEB] px-5 py-4 text-sm font-semibold"><span>{t("Allergen Catalog", "Danh mục chất gây dị ứng")}</span><span className="text-[#727974]">{visible.length.toLocaleString(locale)}</span></div>
      {loading ? <p role="status" className="p-6 text-sm text-[#727974]">{t("Loading allergens...", "Đang tải chất gây dị ứng...")}</p> : !loaded ? <p className="p-6 text-sm text-[#727974]">{t("Allergens could not be loaded.", "Không thể tải chất gây dị ứng.")}</p> : visible.length === 0 ? <p className="p-6 text-sm text-[#727974]">{t("No allergens found.", "Không tìm thấy chất gây dị ứng.")}</p> : <div className="divide-y divide-[#EFEEEB]">
        {visible.map(item => <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[#FBF9F6]"><div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF5EE] text-[#1E7E51]"><ContentIcon name="leaf" /></div><div className="min-w-0"><strong className="break-words text-sm">{item.name}</strong><p className="text-xs text-[#727974]">#{item.id}</p></div></div>
          <div className="flex shrink-0 gap-1"><button type="button" disabled={busy} onClick={() => openForm(item)} title={t("Edit allergen", "Sửa chất gây dị ứng")} aria-label={t("Edit allergen", "Sửa chất gây dị ứng")} className="rounded-lg p-2 hover:bg-[#EAF5EE] disabled:opacity-50"><ContentIcon name="edit" /></button><button type="button" disabled={busy} onClick={() => void remove(item)} title={t("Delete allergen", "Xóa chất gây dị ứng")} aria-label={t("Delete allergen", "Xóa chất gây dị ứng")} className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"><ContentIcon name="trash" /></button></div>
        </div>)}
      </div>}
    </div>

    {name !== null && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onMouseDown={event => { if (event.target === event.currentTarget && !busy) setName(null); }}><div role="dialog" aria-modal="true" aria-labelledby="allergen-dialog-title" className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-4"><h2 id="allergen-dialog-title" className="font-serif text-xl font-bold">{editing ? t("Edit Allergen", "Sửa chất gây dị ứng") : t("Add Allergen", "Thêm chất gây dị ứng")}</h2><button type="button" disabled={busy} onClick={() => setName(null)} title={t("Close", "Đóng")} aria-label={t("Close", "Đóng")}><ContentIcon name="close" /></button></div>
      <form onSubmit={event => void save(event)} className="mt-4 space-y-4"><fieldset disabled={busy} className="space-y-4"><label className="block text-xs font-semibold">{t("Allergen Name", "Tên chất gây dị ứng")} *<input required maxLength={150} value={name} onChange={event => setName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[#EFEEEB] px-3 py-2 text-sm outline-none focus:border-[#1E3A2F]" /></label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-[#EFEEEB] pt-4"><button type="button" onClick={() => setName(null)} className="rounded-lg border border-[#EFEEEB] px-4 py-2 text-xs font-semibold">{t("Cancel", "Hủy")}</button><button type="submit" className="rounded-lg bg-[#0F2F24] px-5 py-2 text-xs font-semibold text-white">{busy ? t("Saving...", "Đang lưu...") : t("Save", "Lưu")}</button></div>
      </fieldset></form>
    </div></div>}
  </div>;
}
