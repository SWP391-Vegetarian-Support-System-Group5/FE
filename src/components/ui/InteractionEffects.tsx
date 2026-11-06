"use client";

import { useEffect } from "react";

/** Decorative click feedback; does not intercept events or delay actions. */
export default function InteractionEffects() {
  useEffect(() => {
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let target: HTMLElement | null = null;
    let decoration: HTMLDivElement | null = null;
    const clear = () => { decoration?.remove(); decoration = null; target = null; };
    const enter = (event: PointerEvent | FocusEvent) => {
      if (!pointer.matches || !(event.target instanceof Element)) return;
      const next = event.target.closest<HTMLElement>('button, a[href], [role="button"], summary, .vm-card, [data-ripple]');
      if (next === target) return;
      clear();
      if (!next || next.closest(':disabled, [aria-disabled="true"], [inert], .leaflet-container')) return;
      const rect = next.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      target = next;
      decoration = document.createElement("div");
      decoration.className = "vm-hover-foliage";
      decoration.setAttribute("aria-hidden", "true");
      Object.assign(decoration.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const width = rect.width + 10;
      const height = rect.height + 10;
      const radius = Math.min(parseFloat(getComputedStyle(next).borderTopLeftRadius) + 3 || 14, rect.height / 2);
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(height));
      const branch = document.createElementNS(svg.namespaceURI, "g");
      const stem = document.createElementNS(svg.namespaceURI, "path");
      const reach = Math.max(radius + 12, Math.min(90, width * .45));
      stem.setAttribute("d", `M ${reach} 5 H ${radius + 5} Q 5 5 5 ${radius + 5} V ${Math.max(radius + 12, height * .65)}`);
      stem.setAttribute("class", "vm-vine-stem");
      branch.append(stem);
      const leaf = "M0 0C-3-8 3-11 9-9 8-3 4 0 0 0Z";
      const leaves: number[][] = [];
      const leafCount = Math.max(3, Math.round((reach - radius) / 12));
      for (let i = 0; i < leafCount; i++) {
        const x = radius + 5 + (reach - radius - 8) * i / Math.max(1, leafCount - 1);
        leaves.push([x, 5, i % 2 === 0 ? -10 : 155]);
      }
      leaves.push([8, radius, -65], [5, radius + 9, -90], [5, Math.max(radius + 14, height * .6), 85]);
      for (const [x, y, angle] of leaves) {
        const path = document.createElementNS(svg.namespaceURI, "path");
        path.setAttribute("d", leaf);
        path.setAttribute("transform", `translate(${x} ${y}) rotate(${angle})`);
        path.setAttribute("class", "vm-vine-leaf");
        branch.append(path);
      }
      const tendril = document.createElementNS(svg.namespaceURI, "path");
      tendril.setAttribute("d", `M ${reach - 8} 5 q 8 -8 13 -3 t -2 6 M 5 ${radius + 10} q -7 5 -4 11 t 5 -2`);
      tendril.setAttribute("class", "vm-vine-stem");
      branch.append(tendril);
      svg.append(branch);
      const opposite = branch.cloneNode(true) as SVGElement;
      opposite.setAttribute("transform", `translate(${width} ${height}) rotate(180)`);
      svg.append(opposite);
      decoration.append(svg);
      document.body.append(decoration);
    };
    const leave = (event: PointerEvent | FocusEvent) => {
      if (target && event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) return;
      clear();
    };
    document.addEventListener("pointerover", enter, { passive: true });
    document.addEventListener("pointerout", leave, { passive: true });
    document.addEventListener("focusin", enter);
    document.addEventListener("focusout", leave);
    window.addEventListener("scroll", clear, true);
    window.addEventListener("resize", clear);
    pointer.addEventListener("change", clear);
    return () => {
      clear();
      document.removeEventListener("pointerover", enter);
      document.removeEventListener("pointerout", leave);
      document.removeEventListener("focusin", enter);
      document.removeEventListener("focusout", leave);
      window.removeEventListener("scroll", clear, true);
      window.removeEventListener("resize", clear);
      pointer.removeEventListener("change", clear);
    };
  }, []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const active = new Set<HTMLDivElement>();
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const clear = () => { active.forEach(node => node.remove()); active.clear(); timers.forEach(clearTimeout); timers.clear(); };
    const click = (event: MouseEvent) => {
      if (motion.matches || !(event.target instanceof Element)) return;
      const control = event.target.closest<HTMLElement>("button, a.vm-button, a.vm-card, [data-ripple]");
      if (!control || control.closest('[aria-disabled="true"], :disabled, [inert]') || control.closest(".leaflet-container")) return;
      const rect = control.getBoundingClientRect();
      if (!rect.width || !rect.height || active.size >= 6) return;
      const layer = document.createElement("div");
      layer.className = "vm-ripple-layer";
      layer.setAttribute("aria-hidden", "true");
      const style = getComputedStyle(control);
      Object.assign(layer.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, borderRadius: style.borderRadius, color: style.color });
      const wave = document.createElement("span");
      const size = Math.hypot(rect.width, rect.height) * 2;
      Object.assign(wave.style, { width: `${size}px`, height: `${size}px`, left: `${event.detail === 0 ? rect.width / 2 : event.clientX - rect.left}px`, top: `${event.detail === 0 ? rect.height / 2 : event.clientY - rect.top}px` });
      layer.append(wave);
      document.body.append(layer);
      active.add(layer);
      const timer = setTimeout(() => { layer.remove(); active.delete(layer); timers.delete(timer); }, 500);
      timers.add(timer);
    };
    document.addEventListener("click", click, { capture: true, passive: true });
    window.addEventListener("scroll", clear, true);
    window.addEventListener("resize", clear);
    motion.addEventListener("change", clear);
    return () => {
      document.removeEventListener("click", click, true);
      window.removeEventListener("scroll", clear, true);
      window.removeEventListener("resize", clear);
      motion.removeEventListener("change", clear);
      clear();
    };
  }, []);
  return null;
}
