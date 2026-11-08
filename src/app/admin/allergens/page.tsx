"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Clock3, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import ContentDialog from "@/components/content/ContentDialog";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { apiFetch, apiGet } from "@/lib/api";
import { listAllergens, createAllergen, updateAllergen, deleteAllergen, type AdminAllergen } from "@/lib/admin-catalog-api";

type Request = { id: number; userId: number; submittedName: string; name: string; status: "PENDING" | "APPROVED" | "REJECTED"; message: string; rejectionReason: string | null; createdAt: string };
type Filter = "ALL" | "APPROVED" | "PENDING";
type Member = { userId: number; fullName: string; email: string };

export default function AdminAllergensPage() {
  const { t, locale } = useLanguage();
  const [requests, setRequests] = useState<Request[]>([]);
  const [catalog, setCatalog] = useState<AdminAllergen[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
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
  const load = useCallback(async () => {
    const current = ++version.current;
    setLoading(true); setError("");
    try {
      const [queue, allergens, users] = await Promise.all([
        apiGet<Request[]>("/api/admin/allergen-requests", { cache: "no-store" }),
        listAllergens(), apiGet<Member[]>("/api/admin/users").catch(() => []),
      ]);
      if (current === version.current) { setRequests(queue); setCatalog(allergens); setMembers(users); }
    } catch (failure) {
      if (current === version.current) setError(failure instanceof Error ? failure.message : "LOAD_FAILED");
      throw failure;
    } finally { if (current === version.current) setLoading(false); }
  }, []);
  useEffect(() => {
    let active = true;
    Promise.all([
      apiGet<Request[]>("/api/admin/allergen-requests", { cache: "no-store" }),
      listAllergens(), apiGet<Member[]>("/api/admin/users").catch(() => []),
    ]).then(([queue, allergens, users]) => {
      if (active) { setRequests(queue); setCatalog(allergens); setMembers(users); }
    }).catch(failure => { if (active) setError(failure instanceof Error ? failure.message : "LOAD_FAILED"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setNotice("");
    try {
      await action(); setNotice("saved");
      try { await load(); } catch { setNotice("refresh"); }
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
  const visible = requests.filter(item => (filter === "ALL" || item.status === filter) && `${item.name} ${item.submittedName}`.toLocaleLowerCase(locale).includes(search));
  const counts = { ALL: requests.length, APPROVED: requests.filter(row => row.status === "APPROVED").length, PENDING: requests.filter(row => row.status === "PENDING").length, REJECTED: requests.filter(row => row.status === "REJECTED").length };
  const button = "vm-button rounded-xl border border-[#DFE8DF] bg-white px-4 py-2.5 text-sm disabled:opacity-50";
  return <div className="min-w-0 space-y-6 text-[#07241A]">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div><span className="inline-flex items-center gap-2 rounded-full bg-[#EAF5EE] px-3 py-1 text-xs text-[#21764B]"><ShieldCheck size={15} />{t("Allergen verification", "Xác thực chất gây dị ứng")}</span><h1 className="mt-3 font-serif text-2xl font-semibold sm:text-3xl">{t("Allergens & health management", "Quản lý dị ứng & sức khỏe")}</h1></div>
      <button className={button} onClick={() => { setForm({ name: "" }); setError(""); }} disabled={busy}>{t("Add allergen", "Thêm chất gây dị ứng")}</button>
    </header>
    {notice && <p role="status" className="vm-feedback rounded-xl border border-[#CDE4D5] bg-[#EAF5EE] p-4 text-sm">{notice === "saved" ? t("Changes saved successfully.", "Đã lưu thay đổi thành công.") : t("Saved. Refresh the list to synchronize; do not submit again.", "Đã lưu thành công. Hãy tải lại danh sách để đồng bộ; không cần gửi lại.")}</p>}
    {error && <p role="alert" className="vm-feedback break-words rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error === "LOAD_FAILED" || error === "SAVE_FAILED" ? t("Unable to process this request. Please try again.", "Chưa xử lý được yêu cầu. Vui lòng thử lại.") : error}</p>}
    <div className="grid gap-3 sm:grid-cols-3">{(["PENDING", "APPROVED", "REJECTED"] as const).map(status => <div key={status} className="rounded-2xl border border-[#E5E9E0] bg-white p-5"><p className="text-sm text-[#627369]">{labels[status]}</p><strong className="mt-2 block text-3xl">{loading ? "…" : counts[status]}</strong></div>)}</div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div role="group" aria-label={t("Request status", "Trạng thái yêu cầu")} className="flex flex-wrap gap-2">{(["ALL", "APPROVED", "PENDING"] as const).map(value => <button key={value} disabled={busy} aria-pressed={filter === value} onClick={() => setFilter(value)} className={`vm-button rounded-full px-4 py-2.5 text-sm ${filter === value ? "bg-[#163E2E] text-white" : "border border-[#E5E9E0] bg-white"}`}>{labels[value]} <span className="ml-2 tabular-nums">{counts[value]}</span></button>)}</div>
      <div className="flex w-full items-center gap-2 sm:w-auto"><input aria-label={t("Search allergens", "Tìm chất gây dị ứng")} value={query} onChange={event => setQuery(event.target.value)} placeholder={t("Search allergens…", "Tìm chất gây dị ứng…")} className="min-w-0 flex-1 rounded-xl border border-[#E5E9E0] bg-white p-3 text-sm" /><button disabled={loading || busy} className={button} onClick={() => void load().catch(() => {})} aria-label={t("Refresh", "Tải lại")}><RefreshCw size={17} /></button></div>
    </div>
    <div aria-busy={loading} className="space-y-3">
      {loading ? <p role="status" className="vm-skeleton rounded-2xl p-8">{t("Loading requests…", "Đang tải yêu cầu…")}</p> : visible.length === 0 ? <p className="rounded-2xl border border-dashed border-[#D6E2D6] p-10 text-center text-sm text-[#627369]">{t("No matching requests.", "Không có yêu cầu phù hợp với bộ lọc.")}</p> : visible.map(item => {
        const member = members.find(row => row.userId === item.userId);
        const pending = item.status === "PENDING";
        return <article key={item.id} className="rounded-2xl border border-[#E5E9E0] bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className={`rounded-xl p-3 ${pending ? "bg-amber-50 text-amber-700" : item.status === "APPROVED" ? "bg-[#EAF5EE] text-[#21764B]" : "bg-red-50 text-red-700"}`}>{pending ? <Clock3 size={21} /> : item.status === "APPROVED" ? <CheckCircle2 size={21} /> : <XCircle size={21} />}</span><div className="min-w-0"><h2 className="break-words text-lg font-semibold">{item.name || item.submittedName}</h2><p className="mt-1 text-xs text-[#627369]">{labels[item.status]} · {new Date(item.createdAt).toLocaleDateString(locale)}</p></div></div><p className="max-w-full break-words rounded-xl bg-[#F3F6F0] px-3 py-2 text-sm">{member?.fullName || member?.email || t(`Member #${item.userId}`, `Thành viên #${item.userId}`)}</p></div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF1EB] pt-4"><p className="min-w-0 flex-1 break-words text-sm text-[#627369]">{item.rejectionReason || item.message || labels[item.status]}</p>{pending && <div className="flex flex-wrap gap-2"><button disabled={busy || loading} className={`${button} text-red-700`} onClick={() => { setRejecting(item); setReason(""); setError(""); }}>{t("Reject", "Từ chối")}</button><button disabled={busy || loading} className="vm-button rounded-xl bg-[#163E2E] px-4 py-2.5 text-sm text-white disabled:opacity-50" onClick={() => void review(item, true)}>{busy ? t("Processing…", "Đang xử lý…") : t("Approve request", "Phê duyệt yêu cầu")}</button></div>}</div>
        </article>;
      })}
    </div>
    <details className="rounded-2xl border border-[#E5E9E0] bg-white p-5"><summary className="cursor-pointer font-semibold">{t("System allergen catalog", "Danh mục dị ứng hệ thống")} ({catalog.length})</summary><p className="mt-2 text-sm text-[#627369]">{t("Catalog entries are separate from user review requests.", "Danh mục hệ thống được hiển thị riêng với yêu cầu người dùng gửi duyệt.")}</p><ul className="mt-4 divide-y divide-[#EEF1EB]">{catalog.filter(item => item.name.toLocaleLowerCase(locale).includes(search)).map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><span className="min-w-0 break-words">{item.name}</span><div className="flex gap-3"><button disabled={busy} className="text-sm underline" onClick={() => { setForm({ id: item.id, name: item.name }); setError(""); }}>{t("Edit", "Sửa")}</button><button disabled={busy} className="text-sm text-red-700" onClick={() => setRemoving(item)}>{t("Delete", "Xóa")}</button></div></li>)}</ul></details>
    {rejecting && <ContentDialog title={t("Reject request", "Từ chối yêu cầu")} onClose={() => { if (!busy) setRejecting(null); }}><form className="space-y-4 p-6" onSubmit={event => { event.preventDefault(); void review(rejecting, false); }}><p className="text-sm">{rejecting.submittedName}</p><label className="block text-sm">{t("Reason shown to the user", "Lý do hiển thị cho người dùng")}<textarea required maxLength={1000} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} rows={4} className="mt-2 w-full rounded-xl border p-3" /></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={busy || !reason.trim()} className={button}>{busy ? t("Saving…", "Đang lưu…") : t("Confirm rejection", "Xác nhận từ chối")}</button></form></ContentDialog>}
    {form && <ContentDialog title={form.id ? t("Edit allergen", "Sửa chất gây dị ứng") : t("Add allergen", "Thêm chất gây dị ứng")} onClose={() => { if (!busy) setForm(null); }}><form onSubmit={save} className="space-y-4 p-6"><label className="block text-sm">{t("Allergen name", "Tên chất gây dị ứng")}<input required maxLength={150} disabled={busy} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded-xl border p-3" /></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button disabled={busy || !form.name.trim()} className={button}>{busy ? t("Saving…", "Đang lưu…") : t("Save", "Lưu")}</button></form></ContentDialog>}
    <ConfirmDialog open={!!removing} title={t("Delete allergen?", "Xóa chất gây dị ứng?")} description={removing?.name || ""} confirmLabel={t("Delete", "Xóa")} busy={busy} onClose={() => setRemoving(null)} onConfirm={() => { if (removing) void run(async () => { await deleteAllergen(removing.id); setRemoving(null); }); }} />
  </div>;
}
