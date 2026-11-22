import type { Coordinates } from "@/types/location";

export type TrackingStatus = "waiting" | "saving" | "synced" | "denied" | "unavailable" | "timeout" | "error" | "paused";
export type SyncedLocation = { address: string; center: Coordinates };

function distance(a: Coordinates, b: Coordinates) {
  const rad = Math.PI / 180;
  const d = Math.sin((b.lat - a.lat) * rad / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin((b.lng - a.lng) * rad / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(d), Math.sqrt(1 - Math.min(1, d)));
}

/** One watcher and one write at a time. Failed lookups never pair new coordinates with an old address. */
export function startPositionTracking(options: {
  geolocation: Geolocation;
  reverse: (point: Coordinates, signal: AbortSignal) => Promise<string>;
  save: (location: SyncedLocation, signal: AbortSignal) => Promise<SyncedLocation>;
  isCurrentSession: () => boolean;
  onLocation: (location: SyncedLocation) => void;
  onStatus: (status: TrackingStatus) => void;
  onDenied: () => void;
  now?: () => number;
}) {
  let active = true, running = false;
  let pending: Coordinates | null = null;
  let last: Coordinates | null = null;
  let lastAttempt = -Infinity;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const controller = new AbortController();
  const now = options.now ?? Date.now;
  const current = () => active && options.isCurrentSession();
  const flush = async () => {
    if (!current() || running || !pending) return;
    const point = pending;
    pending = null;
    if (last && distance(last, point) < 100) return;
    const delay = 30000 - (now() - lastAttempt);
    if (delay > 0) {
      pending = point;
      clearTimeout(timer);
      timer = setTimeout(() => void flush(), delay);
      return;
    }
    running = true; lastAttempt = now();
    options.onStatus("saving");
    try {
      const address = (await options.reverse(point, controller.signal)).trim();
      if (!current()) return;
      if (!address) throw new Error("ADDRESS_UNAVAILABLE");
      const saved = await options.save({ address, center: point }, controller.signal);
      if (!current()) return;
      last = point;
      options.onLocation(saved);
      options.onStatus("synced");
    } catch {
      if (current()) options.onStatus("error");
    } finally {
      running = false;
      if (current() && pending) void flush();
    }
  };
  options.onStatus("waiting");
  const watchId = options.geolocation.watchPosition(position => {
    if (!current()) return;
    const { latitude: lat, longitude: lng, accuracy } = position.coords;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || accuracy > 500) {
      options.onStatus("unavailable"); return;
    }
    pending = { lat, lng };
    void flush();
  }, error => {
    if (!current()) return;
    if (error.code === 1) {
      active = false; controller.abort(); clearTimeout(timer);
      options.onStatus("denied"); options.onDenied();
    } else options.onStatus(error.code === 3 ? "timeout" : "unavailable");
  }, { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 });
  return () => {
    active = false; controller.abort(); clearTimeout(timer);
    options.geolocation.clearWatch(watchId);
  };
}
