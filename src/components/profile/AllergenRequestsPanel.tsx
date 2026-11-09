"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Clock3, RefreshCw, Send } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { createCustomAllergen, getAllergenSubmissions, getAllAllergens, type AllergenSubmission, type AllergenItem } from "@/lib/profile-api";

export default function AllergenRequestsPanel({ onCatalogChange }: { onCatalogChange: (items: AllergenItem[]) => void }) {
  const { t, locale } = useLanguage();
  const [name, setName] = useState("");
  const [requests, setRequests] = useState<AllergenSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [historyReady, setHistoryReady] = useState(false);
  const revision = useRef(0);
  const sending = useRef(false);
  const refreshing = useRef(false);
  const cancelLoads = useCallback(() => { revision.current++; }, []);

  const refresh = useCallback(async (force = false) => {
    if (refreshing.current && !force) return;
    const current = ++revision.current;
    refreshing.current = true;
    try {
      const [history, catalog] = await Promise.all([getAllergenSubmissions(), getAllAllergens()]);
      if (current !== revision.current) return;
      setRequests(history); onCatalogChange(catalog); setRefreshFailed(false); setHistoryReady(true);
    } catch (failure) {
      if (current === revision.current) { setRefreshFailed(true); setRefreshError(failure instanceof Error ? failure.message : ""); }
    } finally {
      if (current === revision.current) { refreshing.current = false; setLoading(false); }
    }
  }, [onCatalogChange]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) return refresh(true); });
    const reload = () => { if (!document.hidden && !sending.current) void refresh(); };
    const timer = window.setInterval(reload, 15000);
    window.addEventListener("focus", reload);
    document.addEventListener("visibilitychange", reload);
    return () => { active = false; cancelLoads(); window.clearInterval(timer); window.removeEventListener("focus", reload); document.removeEventListener("visibilitychange", reload); };
  }, [refresh, cancelLoads]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (sending.current || !name.trim()) return;
    sending.current = true; setBusy(true); setError(""); setSubmitted(false);
    try {
      const result = await createCustomAllergen(name.trim());
      setRequests(previous => [result, ...previous.filter(item => item.id !== result.id)]);
      setHistoryReady(true); setName(""); setSubmitted(true);
      await refresh(true);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "ALLERGEN_SUBMIT_FAILED");
    } finally { sending.current = false; setBusy(false); }
  }
  const labels = {
    PENDING: t("Pending review", "Chờ xét duyệt"),
    APPROVED: t("Approved · available to select", "Đã duyệt · có thể chọn"),
    REJECTED: t("Rejected", "Đã từ chối"),
  };
  return <section aria-labelledby="allergen-requests-title" className="mt-4 space-y-4 rounded-2xl border border-[#DCE8DD] bg-[#FAFCF8] p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 id="allergen-requests-title" className="font-semibold text-[#163E2E]">{t("Suggest a missing allergen", "Đề xuất dị ứng chưa có")}</h3>
        <p className="mt-1 text-sm text-[#627369]">{t("Requests stay separate from your selections until approved. Results update automatically while this page is open.", "Yêu cầu chờ duyệt chưa được dùng trong hồ sơ. Kết quả tự cập nhật khi trang đang mở.")}</p></div>
      <button type="button" disabled={busy || loading} onClick={() => { setLoading(true); void refresh(true); }} className="vm-button inline-flex items-center gap-2 rounded-xl border border-[#DCE8DD] bg-white px-3 py-2 text-sm disabled:opacity-50"><RefreshCw size={15} aria-hidden="true" />{loading ? t("Loading…", "Đang tải…") : t("Refresh", "Tải lại")}</button>
    </div>
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <label className="min-w-0 flex-1 text-sm font-medium">{t("Food allergen name", "Tên nguyên liệu gây dị ứng")}<input required value={name} disabled={busy} onChange={event => { setName(event.target.value); setError(""); setSubmitted(false); }} placeholder={t("For example: chia seeds", "Ví dụ: hạt chia")} className="mt-1.5 w-full rounded-xl border border-[#DCE8DD] bg-white px-3 py-2.5 font-normal outline-none focus:ring-2 focus:ring-[#80AA8D]" /></label>
      <button type="submit" disabled={busy || !name.trim()} className="vm-button inline-flex items-center gap-2 rounded-xl bg-[#163E2E] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"><Send size={15} aria-hidden="true" />{busy ? t("Checking…", "Đang kiểm tra…") : t("Submit request", "Gửi yêu cầu")}</button>
    </form>
    <p className="text-xs leading-5 text-[#627369]">{t("Existing names and duplicate pending requests are rejected immediately. Only food ingredients suitable for this vegetarian system can be submitted.", "Tên đã có hoặc yêu cầu đang chờ bị chặn ngay. Chỉ gửi nguyên liệu thực phẩm phù hợp với hệ thống ăn chay.")}</p>
    {error && <p role="alert" className="vm-feedback rounded-xl bg-red-50 p-3 text-sm text-red-800">{error === "ALLERGEN_SUBMIT_FAILED" || error === "ALLERGEN_RESPONSE_INVALID" ? t("Unable to submit. Refresh the history before trying again.", "Chưa gửi được yêu cầu. Hãy tải lại lịch sử trước khi thử lại.") : error}</p>}
    {submitted && <p role="status" className="vm-feedback rounded-xl bg-[#EAF5EE] p-3 text-sm text-[#163E2E]">{t("Request saved and awaiting review. It has not been added to your selected allergens.", "Đã lưu yêu cầu chờ duyệt. Mục này chưa được thêm vào dị ứng đã chọn.")}</p>}
    {refreshFailed && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{refreshError && !refreshError.startsWith("ALLERGEN_") && <span className="block break-words">{refreshError}</span>}{t("Could not refresh results. Your last loaded data is retained; use Refresh to retry.", "Chưa cập nhật được kết quả. Dữ liệu đã tải được giữ lại; bấm Tải lại để thử lại.")}</p>}
    {loading && !historyReady && <p role="status" className="text-sm text-[#627369]">{t("Loading request history…", "Đang tải lịch sử yêu cầu…")}</p>}
    {historyReady && requests.length === 0 && <p className="text-sm text-[#627369]">{t("You have not submitted any requests.", "Bạn chưa gửi yêu cầu nào.")}</p>}
    {requests.length > 0 && <ul className="space-y-2" aria-label={t("Your allergen requests", "Yêu cầu dị ứng của bạn")}>{requests.map(item => <li key={item.id} className="rounded-xl border border-[#DCE8DD] bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2"><span className="break-words text-sm font-medium">{item.name}</span><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${item.status === "REJECTED" ? "bg-red-50 text-red-800" : item.status === "APPROVED" ? "bg-[#EAF5EE] text-[#163E2E]" : "bg-amber-50 text-amber-900"}`}>{item.status === "PENDING" && <Clock3 size={12} aria-hidden="true" />}{labels[item.status]}</span></div>
      <p className="mt-1 text-xs text-[#627369]">{new Date(item.createdAt).toLocaleString(locale)}</p>
      {item.status === "REJECTED" && <p className="mt-2 break-words text-sm text-red-800">{t("Reason: ", "Lý do: ")}{item.rejectionReason}</p>}
      {item.status === "APPROVED" && <p className="mt-2 text-sm text-[#627369]">{t("Select this allergen in the list above, then save your profile to apply it.", "Chọn dị ứng này trong danh sách phía trên rồi lưu hồ sơ để áp dụng.")}</p>}
    </li>)}</ul>}
  </section>;
}
