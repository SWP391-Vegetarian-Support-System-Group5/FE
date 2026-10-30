"use client";

import { createContext, useContext } from "react";

// Translation helpers still accept legacy language codes for stored content.
export type Language = "en" | "vi";

export interface LanguageContextValue {
  language: "vi";
  locale: "vi-VN";
  t: (english: string, vietnamese: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const vietnamese: LanguageContextValue = {
  language: "vi",
  locale: "vi-VN",
  t: (_english, vietnameseText) => vietnameseText,
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return <LanguageContext.Provider value={vietnamese}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage phải được dùng trong LanguageProvider");
  return context;
}

