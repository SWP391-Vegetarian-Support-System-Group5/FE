"use client";

import Link from "next/link";
import { useId, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import StarRatingPicker from "./StarRatingPicker";

export default function InlinePostRating({ currentRating, signedIn, disabled = false, onRate }: {
  currentRating: number | null;
  signedIn: boolean;
  disabled?: boolean;
  onRate: (rating: number) => Promise<void>;
}) {
  const { t } = useLanguage();
  const id = useId();
  const [draft, setDraft] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<"login" | "permission" | "save" | null>(null);
  const lock = useRef(false);
  const value = draft ?? currentRating ?? 0;
  const busy = disabled || saving;

  async function saveRating(rating: number) {
    if (lock.current || disabled || (rating === currentRating && !error)) return;
    setSaved(false);
    if (!signedIn) { setError("login"); return; }
    lock.current = true;
    setDraft(rating);
    setSaving(true);
    setError(null);
    try {
      await onRate(rating);
      setSaved(true);
    } catch (failure) {
      const status = failure && typeof failure === "object" && "status" in failure ? failure.status : null;
      setError(status === 401 ? "login" : status === 403 ? "permission" : "save");
    } finally {
      lock.current = false;
      setDraft(null);
      setSaving(false);
    }
  }

  return <section aria-label={t("Rate this post", "Đánh giá bài viết")} aria-busy={saving}
    className="my-5 rounded-2xl bg-[#F0F3EB] p-4 sm:px-5">
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <div className="min-w-0" aria-describedby={error ? `${id}-error` : undefined}>
        <StarRatingPicker value={value} onChange={rating => { void saveRating(rating); }} disabled={busy} compact />
      </div>
      {saving && <p role="status" className="text-sm text-[#59635C]">{t("Saving…", "Đang lưu…")}</p>}
    </div>
    <p className="mt-2 text-xs text-[#59635C]">{t("Hover to preview. Select a star to save automatically.", "Rê chuột để xem trước. Nhấn chọn sao để tự động lưu.")}</p>
    {!signedIn && <p className="mt-2 text-xs text-[#59635C]"><Link href="/login" className="font-medium underline underline-offset-2">{t("Sign in", "Đăng nhập")}</Link> {t("to save your rating.", "để lưu đánh giá của bạn.")}</p>}
    {error && <p id={`${id}-error`} role="alert" className="mt-3 text-sm text-red-700">
      {error === "login" ? t("Please sign in again to submit your rating.", "Vui lòng đăng nhập lại để gửi đánh giá.") : error === "permission" ? t("You do not have permission to rate this post.", "Bạn không có quyền đánh giá bài viết này.") : t("Could not save your rating. Your previous rating is kept. Select a star to try again.", "Không thể lưu đánh giá. Điểm cũ được giữ nguyên. Nhấn chọn sao để thử lại.")}
    </p>}
    {saved && <p role="status" className="mt-3 text-sm font-medium text-[#254B38]">{t("Your rating has been saved.", "Đã lưu đánh giá của bạn.")}</p>}
  </section>;
}
