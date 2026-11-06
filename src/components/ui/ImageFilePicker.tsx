"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import { IMAGE_ACCEPT, imageError, validateImage } from "@/lib/image-api";
import { useLanguage } from "@/context/LanguageContext";

export default function ImageFilePicker({ file, onChange, disabled = false, prominent = false }: { file: File | null; onChange: (file: File | null) => void; disabled?: boolean; prominent?: boolean }) {
  const { t } = useLanguage();
  const inputId = useId();
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview.url); };
  }, [preview]);
  return <div className="space-y-3 text-sm">
    {prominent && <div className="flex items-start gap-3">
      <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#DCEBDF] text-[#254B38]">
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m3 17 5-5 4 4 3-3 6 6" /></svg>
      </span>
      <div><h2 className="text-lg font-semibold text-[#173D2B]">{t("Dish cover image", "Ảnh bìa món ăn")}</h2><p className="mt-1 text-sm leading-relaxed text-[#53675A]">{t("Choose a photo to make your recipe stand out.", "Thêm ảnh món ăn để bài viết của bạn hấp dẫn hơn.")}</p></div>
    </div>}
    <div className={prominent ? "rounded-2xl border-2 border-dashed border-[#9BBAA2] bg-white/80 p-5 focus-within:outline-2 focus-within:outline-offset-4 focus-within:outline-[#254B38]" : ""}>
      {!prominent && <label htmlFor={inputId} className="block">Chọn ảnh <span className="text-xs text-[#727974]">(JPEG, PNG, WebP; tối đa 5 MB)</span></label>}
      <input id={inputId} type="file" accept={IMAGE_ACCEPT} disabled={disabled} className={prominent ? "peer sr-only" : "mt-2 block w-full text-xs"} onChange={event => {
        const selected = event.target.files?.[0]; event.target.value = "";
        if (!selected) return;
        try { validateImage(selected); setError(""); setPreview({ file: selected, url: URL.createObjectURL(selected) }); onChange(selected); }
        catch (failure) { setError(imageError(failure)); }
      }} />
      {prominent && <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="font-medium text-[#254B38]">{file ? t("Image selected — you can choose another", "Đã chọn ảnh — bạn có thể đổi ảnh khác") : t("Add a photo of your finished dish", "Chọn ảnh món ăn đã hoàn thành")}</p><p className="mt-1 text-xs text-[#53675A]">{t("JPEG, PNG, WebP · Up to 5 MB", "JPEG, PNG, WebP · Tối đa 5 MB")}</p></div>
        <label htmlFor={inputId} className={`vm-button inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#254B38] px-5 py-3 text-sm font-semibold text-white shadow-sm ${disabled ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-[#173D2B]"}`}><span aria-hidden="true">＋</span>{file ? t("Change image", "Đổi ảnh") : t("Choose image", "Chọn ảnh từ thiết bị")}</label>
      </div>}
    </div>
    {file && <div className="flex items-center gap-3">
      {preview?.file === file && <Image unoptimized src={preview.url} alt="Xem trước ảnh đã chọn" width={128} height={96} className="h-24 w-32 rounded-xl object-cover" />}
      <div className="min-w-0"><p className="break-all text-xs">{file.name}</p><button type="button" disabled={disabled} onClick={() => { onChange(null); setPreview(null); setError(""); }} className="mt-2 text-xs underline disabled:opacity-50">Bỏ ảnh đã chọn</button></div>
    </div>}
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
  </div>;
}
