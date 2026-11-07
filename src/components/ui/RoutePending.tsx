"use client";

import { useEffect } from "react";

// A signal only: NavigationLoading is the sole owner of the visible indicator.
let pending = 0;
export function isRoutePending() { return pending > 0; }
export default function RoutePending() {
  useEffect(() => {
    pending += 1;
    window.dispatchEvent(new Event("vm-route-pending"));
    return () => {
      pending = Math.max(0, pending - 1);
      window.dispatchEvent(new Event("vm-route-pending"));
    };
  }, []);
  return null;
}
