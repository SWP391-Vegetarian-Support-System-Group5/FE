"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Pencil, Plus, RefreshCw, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import ContentDialog from "@/components/content/ContentDialog";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AdminLeafLoading from "@/components/ui/AdminLeafLoading";
import { createAllergen, deleteAllergen, listAllergens, updateAllergen, type AdminAllergen } from "@/lib/admin-catalog-api";

export default function AdminAllergensPage() {
  const { t, locale } = useLanguage();
  const [catalog, setCatalog] = useState<AdminAllergen[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<{ id?: number; name: string } | null>(null);
  const [removing, setRemoving] = useState<AdminAllergen | null>(null);
  const requestVersion = useRef(0);

  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true); setError("");
    try {
      const items = await listAllergens();
      if (version === requestVersion.current) setCatalog(items);
    } catch (cause) {
      if (version === requestVersion.current) setError(cause instanceof Error ? cause.message : "LOAD_FAILED");
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try { await action(); setNotice(t("Changes saved successfully.", "Đã lưu thay đổi thành công.")); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "SAVE_FAILED"); }
    finally { setBusy(false); }
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!form?.name.trim()) return;
    void run(async () => {
      const name = form.name.trim();
      const saved = form.id
        ? (await updateAllergen(form.id, name), { id: form.id, name, type: null } satisfies AdminAllergen)
        : await createAllergen(name);
      setCatalog(current => form.id ? current.map(item => item.id === saved.id ? saved : item) : [...current, saved].sort((a, b) => a.name.localeCompare(b.name, locale)));
      setForm(null);
    });
  };
  const remove = () => {
    if (!removing) return;
    void run(async () => { await deleteAllergen(removing.id); setCatalog(current => current.filter(item => item.id !== removing.id)); setRemoving(null); });
  };
  const visible = catalog.filter(item => item.name.toLocaleLowerCase(locale).includes(query.trim().toLocaleLowerCase(locale)));
  const actionButton = "vm-button inline-flex items-center gap-2 rounded-xl border border-[#DFE8DF] bg-white px-4 py-2.5 text-sm disabled:opacity-50";

  return <div className="vm-enter min-w-0 space-y-6 text-[#07241A]">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><span className="inline-flex items-center gap-2 rounded-full bg-[#EAF5EE] px-3 py-1 text-xs text-[#21764B]"><ShieldCheck size={15} />{t("Allergen catalog", "Danh mục dị ứng")}</span><h1 className="mt-3 font-serif text-2xl font-semibold sm:text-3xl">{t("Allergens & health management", "Quản lý dị ứng & sức khỏe")}</h1><p className="mt-2 text-sm text-[#627369]">{t("Manage allergens that members can select in their profile.", "Quản lý chất gây dị ứng mà thành viên có thể chọn trong hồ sơ.")}</p></div><button className="vm-button inline-flex items-center gap-2 rounded-xl vm-admin-tab-active px-5 py-3 text-sm font-medium text-white disabled:opacity-50" onClick={() => { setForm({ name: "" }); setError(""); }} disabled={busy}><Plus size={18} />{t("Add allergen", "Thêm chất gây dị ứng")}</button></header>
    {notice && <p role="status" className="vm-feedback rounded-xl border border-[#CDE4D5] bg-[#EAF5EE] p-4 text-sm text-[#205339]">{notice}</p>}
    {error && <p role="alert" className="vm-feedback break-words rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error === "LOAD_FAILED" || error === "SAVE_FAILED" ? t("Unable to process this request. Please try again.", "Chưa xử lý được yêu cầu. Vui lòng thử lại.") : error}</p>}
    <section aria-labelledby="allergen-catalog-title" aria-busy={loading} className="overflow-hidden rounded-2xl border border-[#DFE8DF] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8EEE7] p-4 sm:p-5"><div><h2 id="allergen-catalog-title" className="flex items-center gap-2 text-lg font-semibold">{t("Allergen catalog", "Danh mục dị ứng")}<span className="rounded-full bg-[#EAF5EE] px-2.5 py-1 text-xs font-medium text-[#21764B]">{loading ? "…" : catalog.length.toLocaleString(locale)}</span></h2></div><div className="flex w-full items-center gap-2 sm:w-auto"><label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#DFE8DF] bg-[#FAFBF8] px-3"><Search size={17} className="shrink-0 text-[#627369]" /><input aria-label={t("Search allergens", "Tìm chất gây dị ứng")} value={query} onChange={event => setQuery(event.target.value)} placeholder={t("Search allergens…", "Tìm chất gây dị ứng…")} className="w-full min-w-0 bg-transparent py-3 text-sm outline-none sm:w-56" /></label><button disabled={loading || busy} className={actionButton} onClick={() => void load()} aria-label={t("Refresh", "Tải lại")}><RefreshCw size={17} className={loading ? "motion-safe:animate-spin" : ""} /></button></div></div>
      <div className="hidden items-center justify-between border-b border-[#E8EEE7] bg-[#F6F8F3] px-5 py-3 text-xs font-medium uppercase tracking-wide text-[#627369] sm:flex"><span>{t("Allergen name", "Tên chất gây dị ứng")}</span><span>{t("Actions", "Thao tác")}</span></div>
      {loading ? <div role="status" className="py-14 text-center"><AdminLeafLoading text={t("Loading allergens…", "Đang tải danh mục dị ứng…")} /></div> : visible.length === 0 ? <p className="p-8 text-center text-sm text-[#627369]">{query ? t("No allergens found for this name.", "Không tìm thấy chất gây dị ứng theo tên này.") : t("No allergens yet. Add one to get started.", "Chưa có chất gây dị ứng. Thêm mới để bắt đầu.")}</p> : <ul className="vm-stagger divide-y divide-[#E8EEE7]">{visible.map(item => <li key={item.id} className="vm-enter flex flex-wrap items-center justify-between gap-3 px-4 py-4 hover:bg-[#F1F7F1] sm:px-5"><div className="flex min-w-0 flex-1 items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#21764B]"><ShieldCheck size={20} /></span><span className="min-w-0 break-words text-sm font-medium sm:text-base">{item.name}</span></div><div className="flex shrink-0 items-center gap-2"><button disabled={busy} className="vm-button inline-flex items-center gap-2 rounded-xl border border-[#CEE2D3] bg-[#EDF5EE] px-3 py-2 text-sm font-medium text-[#205339] disabled:opacity-50" onClick={() => { setForm({ id: item.id, name: item.name }); setError(""); }}><Pencil size={16} />{t("Edit", "Sửa")}</button><button disabled={busy} className="vm-button inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-50" onClick={() => setRemoving(item)}><Trash2 size={16} />{t("Delete", "Xóa")}</button></div></li>)}</ul>}
    </section>
    {form && <ContentDialog title={form.id ? t("Edit allergen", "Sửa chất gây dị ứng") : t("Add allergen", "Thêm chất gây dị ứng")} onClose={() => { if (!busy) setForm(null); }}><form onSubmit={save} className="space-y-4 p-6"><label className="block text-sm">{t("Allergen name", "Tên chất gây dị ứng")}<input required maxLength={150} disabled={busy} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded-xl border p-3" /></label><button disabled={busy || !form.name.trim()} className={actionButton}>{busy ? t("Saving…", "Đang lưu…") : t("Save", "Lưu")}</button></form></ContentDialog>}
    <ConfirmDialog open={!!removing} title={t("Delete allergen?", "Xóa chất gây dị ứng?")} description={removing?.name || ""} confirmLabel={t("Delete", "Xóa")} busy={busy} onClose={() => setRemoving(null)} onConfirm={remove} />
  </div>;
}
