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
