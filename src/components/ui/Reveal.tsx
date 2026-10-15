"use client";

import { useEffect, useRef } from "react";

/** Content remains visible without JavaScript or IntersectionObserver. */
export default function Reveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!element || reducedMotion.matches || !("IntersectionObserver" in window)) return;
    // Only hide content below the viewport, so hydration never flashes visible content.
    if (element.getBoundingClientRect().top < window.innerHeight) return;
    element.dataset.reveal = "pending";
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        element.dataset.reveal = "visible";
        observer.disconnect();
      }
    }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });
    const show = () => {
      if (reducedMotion.matches) { element.dataset.reveal = "idle"; observer.disconnect(); }
    };
    reducedMotion.addEventListener("change", show);
    observer.observe(element);
    return () => { observer.disconnect(); reducedMotion.removeEventListener("change", show); element.dataset.reveal = "idle"; };
  }, []);
  return <div ref={ref} className="vm-reveal">{children}</div>;
}
