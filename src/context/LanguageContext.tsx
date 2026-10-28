"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Language = "en" | "vi";
const storageKey = "veggiemate-language";
const changeEvent = "veggiemate-language-change";
let fallbackLanguage: Language = "vi";

export interface LanguageContextValue {
  language: Language;
  locale: "vi-VN" | "en-US";
  setLanguage: (language: Language) => void;
  t: (english: string, vietnamese: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return fallbackLanguage;
    try {
      const stored = localStorage.getItem(storageKey);
      return stored === "en" ? "en" : "vi";
    } catch {
      return fallbackLanguage;
    }
  });

  const setLanguage = useCallback((next: Language) => {
    fallbackLanguage = next;
    setLanguageState(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      /* Keep the session preference. */
    }
    window.dispatchEvent(new Event(changeEvent));
  }, []);

  useEffect(() => {
    const handleSync = () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored === "vi" || stored === "en") {
          setLanguageState(stored);
        }
      } catch {}
    };
    window.addEventListener(changeEvent, handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener(changeEvent, handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const t = useCallback(
    (english: string, vietnamese: string) => (language === "vi" ? vietnamese : english),
    [language]
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        locale: language === "vi" ? "vi-VN" : "en-US",
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage phải được dùng trong LanguageProvider");
  return context;
}

