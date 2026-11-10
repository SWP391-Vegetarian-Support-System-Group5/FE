"use client";

import { useRef, useState } from "react";
import ContentDialog from "@/components/content/ContentDialog";
import { useLanguage } from "@/context/LanguageContext";
import { saveAllergenSelection } from "@/lib/save-allergen-selection";
import type { AllergenItem } from "@/lib/profile-api";

export default function AllergenSelectionSave({ selectedIds, savedIds, catalog, disabled, onBusyChange, onSaved }: {
  selectedIds: number[]; savedIds: number[]; catalog: AllergenItem[]; disabled: boolean;
  onBusyChange: (busy: boolean) => void; onSaved: (items: AllergenItem[]) => void;
}) {
  const { t } = useLanguage();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "saved" | "refresh" | "synced" | "error"; detail?: string } | null>(null);
  const lock = useRef(false);
  const selected = [...new Set(selectedIds)];
  const hasChanges = selected.length !== savedIds.length || selected.some(id => !savedIds.includes(id));
  const names = selected.map(id => catalog.find(item => item.allergenId === id)?.name ?? String(id));

  async function confirm() {
    if (lock.current || disabled) return;
    lock.current = true; setBusy(true); onBusyChange(true); setFeedback(null);
    try {
      const result = await saveAllergenSelection(selected);
      onSaved(result.items);
      setFeedback({ kind: !result.matchesRequested ? "synced" : result.refreshed ? "saved" : "refresh" });
    } catch (error) {
      setFeedback({ kind: "error", detail: error instanceof Error ? error.message : "ALLERGEN_SAVE_UNCONFIRMED" });
    } finally {
      lock.current = false; setBusy(false); onBusyChange(false); setConfirming(false);
    }
  }
  const knownErrors: Record<string, string> = {
    ALLERGEN_SELECTION_INVALID: t("Choose valid allergens from the catalog.", "Hãy chọn dị ứng hợp lệ từ danh mục."),
    ALLERGEN_SESSION_CHANGED: t("Your session changed. Sign in again and reload your selections.", "Phiên đăng nhập đã thay đổi. Hãy đăng nhập và tải lại lựa chọn."),
    ALLERGEN_SAVE_UNCONFIRMED: t("The save could not be confirmed. Reload your selections before retrying.", "Chưa xác nhận được việc lưu. Hãy tải lại lựa chọn trước khi thử lại."),
    ALLERGEN_SAVE_FAILED: t("Could not save. Your edits are retained for retry.", "Chưa lưu được. Lựa chọn đang chỉnh được giữ lại để thử lại."),
  };
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" disabled={disabled || busy || !hasChanges} onClick={() => { setFeedback(null); setConfirming(true); }} className="vm-button rounded-xl bg-[#163E2E] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? t("Saving allergens…", "Đang lưu dị ứng…") : t("Save allergens", "Lưu dị ứng")}</button>
      <span className="text-xs text-[#627369]">{hasChanges ? t("You have unsaved allergen changes.", "Bạn có thay đổi dị ứng chưa lưu.") : t("Your allergen selections are up to date.", "Lựa chọn dị ứng đã được đồng bộ.")}</span>
    </div>
    {feedback && (feedback.kind === "error" || !hasChanges) && <p role={feedback.kind === "error" ? "alert" : "status"} className={`vm-feedback rounded-xl p-3 text-sm ${feedback.kind === "error" ? "bg-red-50 text-red-800" : feedback.kind === "saved" ? "bg-[#EAF5EE] text-[#163E2E]" : "bg-amber-50 text-amber-900"}`}>
      {feedback.kind === "error" ? knownErrors[feedback.detail ?? ""] ?? feedback.detail : feedback.kind === "saved" ? t("Allergens saved and reloaded from the server.", "Đã lưu dị ứng và đọc lại kết quả từ máy chủ.") : feedback.kind === "refresh" ? t("The server confirmed your save. Reloading failed; refresh the page to verify the latest selection.", "Máy chủ đã xác nhận lưu. Chưa tải lại được; hãy làm mới trang để kiểm tra lựa chọn mới nhất.") : t("Loaded the current server selection; it differs from your request and may have changed in another session.", "Đã tải lựa chọn hiện tại trên máy chủ. Danh sách khác với yêu cầu vừa gửi, có thể đã được đổi ở phiên khác.")}
    </p>}
    {confirming && <ContentDialog title={t("Confirm allergen changes", "Xác nhận thay đổi dị ứng")} onClose={() => { if (!lock.current) setConfirming(false); }}>
      <div className="space-y-4 p-6">
        <p className="break-words text-sm leading-6">{selected.length ? t("Save these selected allergens: ", "Lưu các dị ứng đã chọn: ") + names.join(", ") : t("Remove all allergens from your profile?", "Bỏ chọn toàn bộ dị ứng trong hồ sơ?")}</p>
        <p className="text-xs leading-5 text-[#627369]">{t("These selections are used when filtering meal plans. Other profile fields are saved separately.", "Lựa chọn này được dùng khi lọc thực đơn. Các thông tin hồ sơ khác được lưu riêng.")}</p>
        <div className="flex flex-wrap justify-end gap-3"><button type="button" disabled={busy} onClick={() => setConfirming(false)} className="vm-button rounded-xl border border-[#DCE8DD] px-4 py-2.5 text-sm disabled:opacity-50">{t("Cancel", "Hủy")}</button><button type="button" disabled={busy} onClick={() => void confirm()} className="vm-button rounded-xl bg-[#163E2E] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? t("Saving…", "Đang lưu…") : t("Confirm and save", "Xác nhận và lưu")}</button></div>
      </div>
    </ContentDialog>}
  </div>;
}
