"use client";

import { useLanguage } from "@/context/LanguageContext";

/** Indeterminate feedback: never represents a fabricated completion percentage. */
export default function PillLoader() {
  const { t } = useLanguage();
  return <div className="vm-pill-loader" role="status">
    <span className="vm-pill-label">{t("Loading", "Đang xử lý")}</span>
    <span className="vm-pill-track" aria-hidden="true"><span /></span>
  </div>;
}
