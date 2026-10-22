"use client";

import { useEffect, useRef } from "react";

export function useRememberedScroll(scope: string, ready: boolean, enabled = true) {
  const restored = useRef("");
  const key = `veggiemate:scroll:${scope}`;
  useEffect(() => {
    if (!enabled || !ready || restored.current === key) return;
    let position = 0;
    try { position = Number(sessionStorage.getItem(key)) || 0; } catch { /* Storage is optional. */ }
    const frame = requestAnimationFrame(() => {
      restored.current = key;
      if (Number.isFinite(position) && position > 0) window.scrollTo({ top: position, behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [enabled, key, ready]);
  useEffect(() => {
    if (!enabled) return;
    let frame = 0;
    let latest = window.scrollY;
    const save = () => { try { sessionStorage.setItem(key, String(latest)); } catch { /* Storage is optional. */ } };
    const onScroll = () => {
      if (restored.current !== key) return;
      latest = window.scrollY;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(save);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", onScroll); if (restored.current === key) save(); };
  }, [enabled, key]);
}
