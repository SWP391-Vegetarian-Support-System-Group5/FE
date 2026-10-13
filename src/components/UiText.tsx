"use client";

import { useCallback } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translateUi } from "@/lib/ui-translations";

export function useUiText() {
  const { language } = useLanguage();
  return useCallback((text: string) => translateUi(text, language), [language]);
}

export default function UiText({ text }: { text: string }) {
  const ui = useUiText();
  return <>{ui(text)}</>;
}

export function LanguageSwitch() {
  const { language, setLanguage, t } = useLanguage();
  return <button type="button" onClick={() => setLanguage(language === "en" ? "vi" : "en")} aria-label={t("Switch to Vietnamese", "Chuyển sang tiếng Anh")} className="rounded-full border border-[#E5E7DF] bg-white px-3 py-2 text-xs font-semibold text-[#254B38]">文A {language.toUpperCase()}</button>;
}
