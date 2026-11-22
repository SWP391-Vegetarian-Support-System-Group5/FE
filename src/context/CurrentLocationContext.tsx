"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { readSessionToken, readSessionUser } from "@/lib/auth-session";
import { reverseGeocode, updateLivingLocation } from "@/lib/profile-api";
import { saveLivingLocation } from "@/lib/living-location";
import { startPositionTracking, type TrackingStatus, type SyncedLocation } from "@/lib/position-tracker";

export const PROFILE_LOCATION_EVENT = "vm:profile-location-synced";
const consentKey = (id: number) => `veggiemate.location-consent.${id}`;
type LocationContext = { enabled: boolean; status: TrackingStatus | "off" | "unsupported"; location: SyncedLocation | null; enable: (accountId?: number) => void; disable: () => void };
const Context = createContext<LocationContext | null>(null);

export function CurrentLocationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.userId;
  const [consentedUser, setConsentedUser] = useState<number | null>(null);
  const [state, setState] = useState<{ userId: number; status: LocationContext["status"] } | null>(null);
  const [synced, setSynced] = useState<{ userId: number; location: SyncedLocation } | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const enabled = !!userId && consentedUser === userId;
  const disable = useCallback(() => {
    if (userId) { try { localStorage.removeItem(consentKey(userId)); } catch { /* Consent can remain in memory. */ } }
    setConsentedUser(null);
  }, [userId]);
  const enable = (accountId = userId) => {
    if (!accountId || readSessionUser()?.userId !== accountId) return;
    if (!window.isSecureContext || !navigator.geolocation) { setState({ userId: accountId, status: "unsupported" }); return; }
    try { localStorage.setItem(consentKey(accountId), "yes"); } catch { /* Consent lasts for this page. */ }
    setConsentedUser(accountId);
    setRequestVersion(version => version + 1);
  };
  useEffect(() => {
    if (!userId || !navigator.permissions) return;
    let active = true;
    // Restore only previously granted permission; never prompt on page load.
    void navigator.permissions.query({ name: "geolocation" }).then(permission => {
      if (!active) return;
      try { if (permission.state === "granted" && localStorage.getItem(consentKey(userId)) === "yes") setConsentedUser(userId); } catch { /* Manual opt-in remains available. */ }
    }).catch(() => {});
    return () => { active = false; };
  }, [userId]);
  useEffect(() => {
    if (!userId || !enabled || !navigator.geolocation) return;
    const token = readSessionToken();
    const isCurrentSession = () => readSessionToken() === token && readSessionUser()?.userId === userId;
    let stop: (() => void) | undefined;
    let active = true;
    const status = (value: TrackingStatus) => { if (active) setState({ userId, status: value }); };
    const resume = () => {
      stop?.(); stop = undefined;
      if (document.visibilityState !== "visible") { status("paused"); return; }
      stop = startPositionTracking({
        geolocation: navigator.geolocation, isCurrentSession,
        reverse: async (point, signal) => (await reverseGeocode(point.lat, point.lng, signal)).formattedAddress,
        save: async (location, signal) => {
          const profile = await updateLivingLocation(location.center.lat, location.center.lng, location.address, signal);
          if (profile.userId !== userId || !profile.livingAddress || profile.latitude == null || profile.longitude == null) throw new Error("LOCATION_SAVE_UNCONFIRMED");
          return { address: profile.livingAddress, center: { lat: profile.latitude, lng: profile.longitude } };
        },
        onLocation: location => {
          setSynced({ userId, location });
          saveLivingLocation({ provinceCode: "", areaCode: "all", ...location });
          window.dispatchEvent(new CustomEvent(PROFILE_LOCATION_EVENT, { detail: { userId, ...location } }));
        },
        onStatus: status,
        onDenied: () => { if (active) disable(); },
      });
    };
    resume();
    document.addEventListener("visibilitychange", resume);
    return () => { active = false; stop?.(); document.removeEventListener("visibilitychange", resume); };
  }, [userId, enabled, disable, requestVersion]);
  const status = state && state.userId === userId && (enabled || state.status === "denied" || state.status === "unsupported") ? state.status : "off";
  return <Context.Provider value={{ enabled, status, location: synced && synced.userId === userId ? synced.location : null, enable, disable }}>{children}</Context.Provider>;
}

export function useCurrentLocation() {
  const context = useContext(Context);
  if (!context) throw new Error("CurrentLocationProvider is required");
  return context;
}
