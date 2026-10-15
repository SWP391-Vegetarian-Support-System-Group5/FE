"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function UploadProgress({ percent, processing, onCancel }: { percent: number | null; processing: boolean; onCancel: () => void }) {
  const { t } = useLanguage();
  const waiting = processing || percent === 100;
  const label = processing ? t("AI is analyzing your video", "AI đang phân tích video") : waiting ? t("Upload complete. Waiting for the server…", "Đã tải xong. Đang chờ máy chủ…") : t("Uploading your video", "Đang tải video lên");
  return <div className="vm-feedback mt-5 rounded-2xl border border-[#C9DCC4] bg-[#F0F5EB] p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold text-[#254B38]">{label}</p>{!processing && percent !== null && <span className="text-sm font-semibold tabular-nums text-[#254B38]">{percent}%</span>}</div>
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={!waiting && percent !== null ? percent : undefined} aria-valuetext={waiting ? label : undefined} className="mt-3 h-2 overflow-hidden rounded-full bg-[#DDE8D6]">
      {waiting || percent === null ? <div className="vm-upload-indeterminate h-full w-1/3 rounded-full bg-[#658266]" /> : <div className="vm-upload-bar h-full rounded-full bg-[#254B38]" style={{ width: `${percent}%` }} />}
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs leading-6 text-[#65705F]">{processing ? t("Keep this page open. The recipe will appear when analysis finishes.", "Giữ trang này mở. Công thức sẽ xuất hiện khi phân tích xong.") : t("Sending your video to the application server.", "Video đang được gửi đến máy chủ của hệ thống.")}</p>{!waiting && <button type="button" onClick={onCancel} className="vm-button text-xs font-semibold text-[#99462A] underline underline-offset-4">{t("Cancel upload", "Hủy tải lên")}</button>}</div>
  </div>;
}
