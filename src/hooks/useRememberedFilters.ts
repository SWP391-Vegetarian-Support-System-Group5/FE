"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const changeEvent = "veggiemate-session-filters";
const fallback = new Map<string, string>();
function subscribe(listener: () => void) {
  window.addEventListener(changeEvent, listener);
  window.addEventListener("storage", listener);
  return () => { window.removeEventListener(changeEvent, listener); window.removeEventListener("storage", listener); };
}

/** Session-only string fields. Account-scope drafts; never store authentication tokens. */
export function useSessionFields<T extends Record<string, string>>(scope: string, defaults: T, namespace: "filters" | "draft" = "filters") {
  const key = `veggiemate:${namespace}:${scope}`;
  const initial = JSON.stringify(defaults);
  const getSnapshot = useCallback(() => {
    try { return sessionStorage.getItem(key) || initial; } catch { return fallback.get(key) || initial; }
  }, [key, initial]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => initial);
  const parse = useCallback((text: string): T => {
    const base: T = JSON.parse(initial);
    try {
      const saved = JSON.parse(text);
      for (const field of Object.keys(base) as (keyof T)[]) {
        if (saved && typeof saved[field] === "string") base[field] = saved[field] as T[keyof T];
      }
    } catch { /* Ignore outdated or malformed browser preferences. */ }
    return base;
  }, [initial]);
  const value = useMemo(() => parse(snapshot), [parse, snapshot]);
  const update = useCallback((next: T | ((previous: T) => T)) => {
    const value = typeof next === "function" ? next(parse(getSnapshot())) : next;
    const text = JSON.stringify(value);
    try { sessionStorage.setItem(key, text); fallback.delete(key); } catch { fallback.set(key, text); }
    window.dispatchEvent(new Event(changeEvent));
  }, [getSnapshot, key, parse]);
  return [value, update, { saved: snapshot !== initial && !fallback.has(key) }] as const;
}

export function useRememberedFilters<T extends Record<string, string>>(scope: string, defaults: T) {
  return useSessionFields(scope, defaults);
}
