"use client";

import { useState, type FormEvent } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { PostApiError, reportComment } from "@/lib/post-api";
import ContentDialog from "./ContentDialog";

export default function ReportCommentButton({ commentId, disabled }: { commentId: number; disabled?: boolean }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<"login" | "unavailable" | "failed" | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending || !reason.trim()) return;
    setSending(true);
    setError(null);
    try {
      await reportComment(commentId, reason.trim());
      setSent(true);
      setOpen(false);
    } catch (cause) {
      const status = cause instanceof PostApiError ? cause.status : 0;
      setError(status === 401 ? "login" : status === 404 || status === 409 ? "unavailable" : "failed");
    } finally {
      setSending(false);
    }
  }

  return <>
    {sent ? <span role="status">{t("Report sent", "Đã gửi báo cáo")}</span> : (
      <button type="button" disabled={disabled} onClick={() => { setReason(""); setError(null); setOpen(true); }}>
        {t("Report", "Báo cáo")}
      </button>
    )}
    {open && <ContentDialog title={t("Report comment", "Báo cáo bình luận")} onClose={() => { if (!sending) setOpen(false); }}>
      <form className="space-y-4 p-6" onSubmit={submit}>
        <label className="block text-sm font-medium">
          {t("Reason for reporting", "Lý do báo cáo")}
          <textarea required maxLength={500} rows={4} disabled={sending} value={reason} onChange={event => setReason(event.target.value)} className="mt-2 block w-full rounded-xl border border-[#DDE2D7] p-3" />
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{
          error === "login" ? t("Please sign in again to report this comment.", "Vui lòng đăng nhập lại để báo cáo bình luận.")
            : error === "unavailable" ? t("This comment is no longer available to report.", "Bình luận này không còn có thể báo cáo.")
              : t("Could not send the report. Please try again.", "Không thể gửi báo cáo. Vui lòng thử lại.")
        }</p>}
        <button type="submit" disabled={sending || !reason.trim()} className="rounded-full bg-[#254B38] px-5 py-2 text-sm font-medium text-white disabled:opacity-40">
          {sending ? t("Sending…", "Đang gửi…") : t("Send report", "Gửi báo cáo")}
        </button>
      </form>
    </ContentDialog>}
  </>;
}
