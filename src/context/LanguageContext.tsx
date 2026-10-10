"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";

export type Language = "en" | "vi";
const storageKey = "veggiemate-language";
const changeEvent = "veggiemate-language-change";
let fallbackLanguage: Language = "en";

function getLanguage(): Language {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored === "vi" ? "vi" : stored === "en" ? "en" : fallbackLanguage;
  } catch {
    return fallbackLanguage;
  }
}

function subscribe(listener: () => void) {
  window.addEventListener(changeEvent, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(changeEvent, listener);
    window.removeEventListener("storage", listener);
  };
}

interface LanguageContextValue {
  language: Language;
  locale: "en-US" | "vi-VN";
  setLanguage: (language: Language) => void;
  t: (english: string, vietnamese: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore(subscribe, getLanguage, () => "en" as Language);
  const setLanguage = useCallback((next: Language) => {
    fallbackLanguage = next;
    try { localStorage.setItem(storageKey, next); } catch { /* Keep the session preference. */ }
    window.dispatchEvent(new Event(changeEvent));
  }, []);
  const t = useCallback((english: string, vietnamese: string) => language === "vi" ? vietnamese : english, [language]);

  useEffect(() => { document.documentElement.lang = language; }, [language]);

  return (
    <LanguageContext.Provider value={{ language, locale: language === "vi" ? "vi-VN" : "en-US", setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
