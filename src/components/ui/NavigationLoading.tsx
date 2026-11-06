"use client";

import { useSyncExternalStore } from "react";
import RouteLoader from "./RouteLoader";
import { isRoutePending } from "./RoutePending";

function subscribe(onChange: () => void) {
  window.addEventListener("vm-route-pending", onChange);
  return () => window.removeEventListener("vm-route-pending", onChange);
}
const serverSnapshot = () => false;

/** Match the actual route fallback lifetime; no minimum display timer. */
export default function NavigationLoading() {
  const visible = useSyncExternalStore(subscribe, isRoutePending, serverSnapshot);
  if (!visible) return null;
  return <div className="pointer-events-none fixed left-1/2 top-1/2 z-[10000] -translate-x-1/2 -translate-y-1/2" aria-busy="true"><RouteLoader /></div>;
}
