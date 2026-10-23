"use client";

import { useId, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function StarRatingPicker({ value, onChange, disabled = false, compact = false }: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const { t } = useLanguage();
  const id = useId();
  const [preview, setPreview] = useState<number | null>(null);
  const displayed = preview ?? value;

  return <fieldset disabled={disabled} aria-describedby={`${id}-hint`}>
    <legend className="text-sm text-[#727974]">{t("Choose your star rating", "Chọn số sao đánh giá")}</legend>
    <div className={`${compact ? "mt-1 justify-start" : "mt-5 justify-center"} flex gap-1 sm:gap-2`} onMouseLeave={() => setPreview(null)}>
      {[1, 2, 3, 4, 5].map(star => <label key={star}
        onMouseEnter={() => { if (!disabled) setPreview(star); }}
        className={`rounded-xl ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
        <input type="radio" name={`${id}-rating`} value={star} checked={value === star}
          onChange={() => { setPreview(null); onChange(star); }}
          onClick={() => { if (value === star) { setPreview(null); onChange(star); } }}
          onFocus={() => setPreview(star)} onBlur={() => setPreview(null)}
          aria-label={t(`${star} out of 5 stars`, `${star} trên 5 sao`)} className="peer sr-only" />
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl transition duration-200 motion-reduce:transition-none peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#254B38] ${star <= displayed ? "text-[#CB8520]" : "text-[#D8DCD2]"} ${star === displayed && !disabled ? "scale-110 motion-reduce:transform-none" : ""}`}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-9 w-9" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
            <path d="m12 2.5 2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.52l-5.88 3.09 1.12-6.55L2.48 9.42l6.58-.96Z" />
          </svg>
        </span>
      </label>)}
    </div>
    <p id={`${id}-hint`} aria-live="polite" aria-atomic="true" className={`${compact ? "mt-1 text-left" : "mt-3 text-center"} min-h-6 text-sm font-medium text-[#775C20]`}>
      {displayed ? t(`${displayed} / 5 stars`, `${displayed} / 5 sao`) : t("Hover or select a star", "Rê chuột hoặc chọn một ngôi sao")}
    </p>
  </fieldset>;
}
