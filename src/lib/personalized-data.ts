// Invalidation only: never persist recipes, profile values or authentication tokens here.
let revision = 0;
const listeners = new Set<() => void>();
const eventKey = "veggiemate:personalization-changed";
export function getPersonalizedRevision() { return revision; }
function notify() { revision++; listeners.forEach(listener => listener()); }
function onStorage(event: StorageEvent) { if (event.key === eventKey) notify(); }
export function subscribePersonalizedData(listener: () => void) {
  if (!listeners.size && typeof window !== "undefined") window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size && typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}
export function invalidatePersonalizedData(broadcast = true) {
  notify();
  if (broadcast && typeof window !== "undefined") {
    try { localStorage.setItem(eventKey, `${Date.now()}:${Math.random()}`); } catch { /* Current-tab invalidation still works. */ }
  }
}
