"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Clock3, Pencil, Plus, RefreshCw, Search, ShieldCheck, Trash2, XCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import ContentDialog from "@/components/content/ContentDialog";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { apiFetch, apiGet } from "@/lib/api";
import { listAllergens, createAllergen, updateAllergen, deleteAllergen, type AdminAllergen } from "@/lib/admin-catalog-api";

type Request = { id: number; userId: number; submittedName: string; name: string; status: "PENDING" | "APPROVED" | "REJECTED"; message: string; rejectionReason: string | null; createdAt: string };
type Member = { userId: number; fullName: string; email: string };

const fetchLists = () => Promise.allSettled([
  apiGet<Request[]>("/api/admin/allergen-requests", { cache: "no-store" }),
  listAllergens(), apiGet<Member[]>("/api/admin/users"),
]);

export default function AdminAllergensPage() {
  const { t, locale } = useLanguage();
  const [requests, setRequests] = useState<Request[]>([]);
  const [catalog, setCatalog] = useState<AdminAllergen[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const version = useRef(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<"saved" | "refresh" | "">("");
  const [rejecting, setRejecting] = useState<Request | null>(null);
  const [reason, setReason] = useState("");
  const [form, setForm] = useState<{ id?: number; name: string } | null>(null);
  const [removing, setRemoving] = useState<AdminAllergen | null>(null);
  const [queueFailed, setQueueFailed] = useState(false);
  const [catalogFailed, setCatalogFailed] = useState(false);
  const applyLists = useCallback(([queue, allergens, users]: Awaited<ReturnType<typeof fetchLists>>) => {
    setQueueFailed(queue.status === "rejected");
    setCatalogFailed(allergens.status === "rejected");
    if (queue.status === "fulfilled") setRequests(queue.value);
    if (allergens.status === "fulfilled") setCatalog(allergens.value);
    if (users.status === "fulfilled") setMembers(users.value);
    return queue.status === "fulfilled" && allergens.status === "fulfilled";
  }, []);
  const load = useCallback(async () => {
    const current = ++version.current;
    setLoading(true);
    try {
      const result = await fetchLists();
      if (current !== version.current) return false;
      return applyLists(result);
    } finally { if (current === version.current) setLoading(false); }
  }, [applyLists]);
  useEffect(() => {
    let active = true;
    const current = ++version.current;
    void fetchLists().then(result => { if (active && current === version.current) applyLists(result); })
      .finally(() => { if (active && current === version.current) setLoading(false); });
    return () => { active = false; };
  }, [applyLists]);

  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setNotice("");
    try {
      await action(); setNotice("saved");
      try { if (!await load()) setNotice("refresh"); } catch { setNotice("refresh"); }
    } catch (failure) { setError(failure instanceof Error ? failure.message : "SAVE_FAILED"); }
    finally { lock.current = false; setBusy(false); }
  }
  async function review(item: Request, approve: boolean) {
    if (item.status !== "PENDING" || (!approve && !reason.trim())) return;
    await run(async () => {
      const response = await apiFetch(`/api/admin/allergen-requests/${item.id}/${approve ? "approve" : "reject"}`, {
        method: "POST", ...(approve ? {} : { body: JSON.stringify({ reason: reason.trim() }) }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || data?.detail || t(`Request failed (${response.status}).`, `Xử lý thất bại (${response.status}).`));
      }
      const result = await response.json() as Request;
      setRequests(previous => previous.map(row => row.id === result.id ? result : row));
      setRejecting(null); setReason("");
    });
  }
  function save(event: FormEvent) {
    event.preventDefault();
    if (!form?.name.trim()) return;
    void run(async () => {
      if (form.id) await updateAllergen(form.id, form.name.trim()); else await createAllergen(form.name.trim());
      setForm(null);
    });
  }
  const labels = { ALL: t("All", "Tất cả"), APPROVED: t("Approved", "Đã phê duyệt"), PENDING: t("Pending approval", "Chờ phê duyệt"), REJECTED: t("Rejected", "Đã từ chối") };
  const search = query.trim().toLocaleLowerCase(locale);
  const visible = requests.filter(item => `${item.name} ${item.submittedName}`.toLocaleLowerCase(locale).includes(search));
  const visibleCatalog = catalog.filter(item => item.name.toLocaleLowerCase(locale).includes(search));
  const button = "vm-button rounded-xl border border-[#DFE8DF] bg-white px-4 py-2.5 text-sm disabled:opacity-50";
  return <div className="vm-enter min-w-0 space-y-6 text-[#07241A]">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><span className="inline-flex items-center gap-2 rounded-full bg-[#EAF5EE] px-3 py-1 text-xs text-[#21764B]"><ShieldCheck size={15} />{t("Allergen verification", "Xác thực chất gây dị ứng")}</span><h1 className="mt-3 font-serif text-2xl font-semibold sm:text-3xl">{t("Allergens & health management", "Quản lý dị ứng & sức khỏe")}</h1></div>
      <button className="vm-button inline-flex items-center gap-2 rounded-xl bg-[#163E2E] px-5 py-3 text-sm font-medium text-white disabled:opacity-50" onClick={() => { setForm({ name: "" }); setError(""); }} disabled={busy}><Plus size={18} aria-hidden="true" />{t("Add allergen", "Thêm chất gây dị ứng")}</button>
    </header>
    {notice && <p role="status" className="vm-feedback rounded-xl border border-[#CDE4D5] bg-[#EAF5EE] p-4 text-sm">{notice === "saved" ? t("Changes saved successfully.", "Đã lưu thay đổi thành công.") : t("Saved. Refresh the list to synchronize; do not submit again.", "Đã lưu thành công. Hãy tải lại danh sách để đồng bộ; không cần gửi lại.")}</p>}
    {error && <p role="alert" className="vm-feedback break-words rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error === "LOAD_FAILED" || error === "SAVE_FAILED" ? t("Unable to process this request. Please try again.", "Chưa xử lý được yêu cầu. Vui lòng thử lại.") : error}</p>}
    {queueFailed && <p role="alert" className="vm-feedback rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{t("Unable to load allergen requests. Check the backend /api/admin/allergen-requests endpoint. The allergen catalog is loaded separately.", "Chưa tải được yêu cầu dị ứng. Cần kiểm tra API /api/admin/allergen-requests của BE. Danh mục dị ứng vẫn được tải riêng.")}</p>}
    {catalogFailed && <p role="alert" className="vm-feedback rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{t("Unable to load the allergen catalog. Please refresh.", "Chưa tải được danh mục dị ứng. Vui lòng tải lại.")}</p>}
    <section aria-labelledby="allergen-catalog-title" aria-busy={loading} className="overflow-hidden rounded-2xl border border-[#DFE8DF] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8EEE7] p-4 sm:p-5">
        <div>
          <h2 id="allergen-catalog-title" className="flex items-center gap-2 text-lg font-semibold">
            {t("Allergen catalog", "Danh mục dị ứng")}
            <span className="rounded-full bg-[#EAF5EE] px-2.5 py-1 text-xs font-medium text-[#21764B]">{loading ? "…" : catalogFailed ? "—" : catalog.length.toLocaleString(locale)}</span>
          </h2>
          <p className="mt-1 text-sm text-[#627369]">{t("Manage allergen names used across the system.", "Quản lý các chất gây dị ứng trong hệ thống.")}</p>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#DFE8DF] bg-[#FAFBF8] px-3 focus-within:ring-2 focus-within:ring-[#21764B]/30">
            <Search size={17} className="shrink-0 text-[#627369]" aria-hidden="true" />
            <input aria-label={t("Search allergens", "Tìm chất gây dị ứng")} value={query} onChange={event => setQuery(event.target.value)} placeholder={t("Search allergens…", "Tìm chất gây dị ứng…")} className="w-full min-w-0 bg-transparent py-3 text-sm outline-none sm:w-56" />
          </label>
          <button disabled={loading || busy} className={button} onClick={() => void load().catch(() => {})} aria-label={t("Refresh", "Tải lại")}><RefreshCw size={17} className={loading ? "motion-safe:animate-spin" : ""} /></button>
        </div>
      </div>
      <div className="hidden items-center justify-between border-b border-[#E8EEE7] bg-[#F6F8F3] px-5 py-3 text-xs font-medium uppercase tracking-wide text-[#627369] sm:flex">
        <span>{t("Allergen name", "Tên chất gây dị ứng")}</span><span>{t("Actions", "Thao tác")}</span>
      </div>
      {loading ? <div role="status" className="space-y-3 p-5"><span className="sr-only">{t("Loading allergens…", "Đang tải danh mục dị ứng…")}</span>{[0, 1, 2].map(index => <div key={index} className="vm-skeleton h-16 rounded-xl" />)}</div> : catalogFailed ? null : visibleCatalog.length === 0 ? <p className="p-8 text-center text-sm text-[#627369]">{search ? t("No allergens found for this name.", "Không tìm thấy chất gây dị ứng theo tên này.") : t("No allergens yet. Add one to get started.", "Chưa có chất gây dị ứng. Thêm mới để bắt đầu.")}</p> :
        <ul className="vm-stagger divide-y divide-[#E8EEE7]">
          {visibleCatalog.map(item => <li key={item.id} className="vm-enter flex flex-wrap items-center justify-between gap-3 px-4 py-4 transition-colors duration-200 hover:bg-[#F1F7F1] focus-within:bg-[#F1F7F1] motion-reduce:transition-none sm:px-5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#21764B]"><ShieldCheck size={20} aria-hidden="true" /></span>
              <span className="min-w-0 break-words text-sm font-medium sm:text-base">{item.name}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button disabled={busy} aria-label={t(`Edit ${item.name}`, `Sửa ${item.name}`)} className="vm-button inline-flex items-center gap-2 rounded-xl border border-[#CEE2D3] bg-[#EDF5EE] px-3 py-2 text-sm font-medium text-[#205339] hover:bg-[#DFEEE2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#21764B] disabled:opacity-50" onClick={() => { setForm({ id: item.id, name: item.name }); setError(""); }}><Pencil size={16} aria-hidden="true" />{t("Edit", "Sửa")}</button>
              <button disabled={busy} aria-label={t(`Delete ${item.name}`, `Xóa ${item.name}`)} className="vm-button inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50" onClick={() => setRemoving(item)}><Trash2 size={16} aria-hidden="true" />{t("Delete", "Xóa")}</button>
            </div>
          </li>)}
        </ul>}
    </section>
    {!loading && !queueFailed && visible.length > 0 && <section aria-label={t("User allergen requests", "Yêu cầu dị ứng của người dùng")} className="space-y-3">
      <h2 className="text-lg font-semibold">{t("User allergen requests", "Yêu cầu dị ứng của người dùng")}</h2>
      {visible.map(item => {
        const member = members.find(row => row.userId === item.userId);
        const pending = item.status === "PENDING";
        return <article key={item.id} className="vm-enter rounded-2xl border border-[#E5E9E0] bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className={`rounded-xl p-3 ${pending ? "bg-amber-50 text-amber-700" : item.status === "APPROVED" ? "bg-[#EAF5EE] text-[#21764B]" : "bg-red-50 text-red-700"}`}>{pending ? <Clock3 size={21} /> : item.status === "APPROVED" ? <CheckCircle2 size={21} /> : <XCircle size={21} />}</span><div className="min-w-0"><h2 className="break-words text-lg font-semibold">{item.name || item.submittedName}</h2><p className="mt-1 text-xs text-[#627369]">{t("Status: ", "Trạng thái: ")}{labels[item.status]} · {new Date(item.createdAt).toLocaleDateString(locale)}</p></div></div><p className="max-w-full break-words rounded-xl bg-[#F3F6F0] px-3 py-2 text-sm">{member?.fullName || member?.email || t(`Member #${item.userId}`, `Thành viên #${item.userId}`)}</p></div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF1EB] pt-4"><p className="min-w-0 flex-1 break-words text-sm text-[#627369]">{item.rejectionReason || item.message || labels[item.status]}</p>{pending && <div className="flex flex-wrap gap-2"><button disabled={busy || loading} className={`${button} text-red-700`} onClick={() => { setRejecting(item); setReason(""); setError(""); }}>{t("Reject", "Từ chối")}</button><button disabled={busy || loading} className="vm-button rounded-xl bg-[#163E2E] px-4 py-2.5 text-sm text-white disabled:opacity-50" onClick={() => void review(item, true)}>{busy ? t("Processing…", "Đang xử lý…") : t("Approve request", "Phê duyệt yêu cầu")}</button></div>}</div>
        </article>;
      })}
    </section>}
    {rejecting && <ContentDialog title={t("Reject request", "Từ chối yêu cầu")} onClose={() => { if (!busy) setRejecting(null); }}><form className="space-y-4 p-6" onSubmit={event => { event.preventDefault(); void review(rejecting, false); }}><p className="text-sm">{rejecting.submittedName}</p><label className="block text-sm">{t("Reason shown to the user", "Lý do hiển thị cho người dùng")}<textarea required maxLength={1000} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border p-3" /></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={busy || !reason.trim()} className={button}>{busy ? t("Saving…", "Đang lưu…") : t("Confirm rejection", "Xác nhận từ chối")}</button></form></ContentDialog>}
    {form && <ContentDialog title={form.id ? t("Edit allergen", "Sửa chất gây dị ứng") : t("Add allergen", "Thêm chất gây dị ứng")} onClose={() => { if (!busy) setForm(null); }}><form onSubmit={save} className="space-y-4 p-6"><label className="block text-sm">{t("Allergen name", "Tên chất gây dị ứng")}<input required maxLength={150} disabled={busy} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded-xl border p-3" /></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={busy || !form.name.trim()} className={button}>{busy ? t("Saving…", "Đang lưu…") : t("Save", "Lưu")}</button></form></ContentDialog>}
    <ConfirmDialog open={!!removing} title={t("Delete allergen?", "Xóa chất gây dị ứng?")} description={removing?.name || ""} confirmLabel={t("Delete", "Xóa")} busy={busy} onClose={() => setRemoving(null)} onConfirm={() => { if (removing) void run(async () => { await deleteAllergen(removing.id); setRemoving(null); }); }} />
  </div>;
}
