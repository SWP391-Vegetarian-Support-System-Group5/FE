"use client";

import { createContext, useContext } from "react";

// Keep existing translation helpers compatible while the UI always uses Vietnamese.
export type Language = "en" | "vi";
interface LanguageContextValue {
  language: Language;
  locale: "vi-VN";
  t: (english: string, vietnamese: string) => string;
}
const vietnamese: LanguageContextValue = {
  language: "vi",
  locale: "vi-VN",
  t: (_english, text) => text,
};
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return <LanguageContext.Provider value={vietnamese}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage phải được dùng trong LanguageProvider");
  return context;
}
