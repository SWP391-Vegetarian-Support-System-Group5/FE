import type { BackendUser } from "./auth";

// Persist only within this tab and frontend run, never in localStorage.
let token: string | null = null;
let user: BackendUser | null = null;
let restored = false;
const listeners = new Set<() => void>();
export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function notifySession() { listeners.forEach(listener => listener()); }
const storageKey = "veggiemate_auth_session";
const epoch = process.env.NEXT_PUBLIC_AUTH_SESSION_EPOCH || "current-build";

function hasValidExpiry(value: string) {
  try {
    const encoded = value.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(encoded));
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch { return false; }
}

function restoreSession() {
  if (typeof window === "undefined" || restored) return;
  restored = true;
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || "null");
    if (saved?.epoch === epoch && typeof saved.token === "string" && saved.user?.userId && hasValidExpiry(saved.token)) {
      token = saved.token;
      user = saved.user;
    } else sessionStorage.removeItem(storageKey);
  } catch { /* Storage unavailable: use memory for this page only. */ }
}

function persistSession() {
  if (typeof window === "undefined") return;
  try { sessionStorage.setItem(storageKey, JSON.stringify({ epoch, token, user })); }
  catch { /* Storage unavailable: use memory for this page only. */ }
}

export function readSessionToken() {
  restoreSession();
  if (token && !hasValidExpiry(token)) clearSession(false);
  return token;
}
export function readSessionUser() { return readSessionToken() ? user : null; }
export function setSession(tokenValue: string, userValue: BackendUser) {
  token = tokenValue;
  user = userValue;
  restored = true;
  persistSession();
  notifySession();
}
export function setSessionUser(value: BackendUser) { user = value; persistSession(); notifySession(); }
export function clearSession(notify = true) {
  token = null;
  user = null;
  restored = true;
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(storageKey);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch { /* Storage may be blocked by browser settings. */ }
  }
  if (notify) notifySession();
}
