"use client";

import { useEffect, useRef, useState } from "react";
import { hasGoogleMapsKey, loadMapsLibraries } from "@/lib/google-maps";
import type { Coordinates, Restaurant } from "@/types/location";

type Props = {
  center: Coordinates;
  restaurants: Restaurant[];
  selectedId?: string;
  onSelect: (restaurant: Restaurant) => void;
  onMapClick: (coordinates: Coordinates) => void;
};

export default function GoogleRestaurantMap({ center, restaurants, selectedId, onSelect, onMapClick }: Props) {
  const elementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasGoogleMapsKey()) return;
    let active = true;

    loadMapsLibraries()
      .then(({ maps }) => {
        if (!active || !elementRef.current || mapRef.current) return;
        mapRef.current = new maps.Map(elementRef.current, {
          center,
          zoom: 13,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "DEMO_MAP_ID",
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        });
        mapRef.current.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (event.latLng) onMapClick({ lat: event.latLng.lat(), lng: event.latLng.lng() });
        });
      })
      .catch(() => active && setError("Không thể tải Google Maps. Hãy kiểm tra API key và các API đã bật."));

    return () => { active = false; };
  }, [center, onMapClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.panTo(center);

    // Replace the previous location pin so choosing a result never leaves stale markers behind.
    loadMapsLibraries().then(({ marker }) => {
      userMarkerRef.current?.setAttribute("aria-hidden", "true");
      if (userMarkerRef.current) userMarkerRef.current.map = null;
      const pin = new marker.PinElement({ background: "#f4efe8", borderColor: "#a34d32", glyphColor: "#a34d32" });
      userMarkerRef.current = new marker.AdvancedMarkerElement({ map, position: center, title: "Vị trí của bạn", content: pin.element });
    }).catch(() => undefined);
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // Advanced markers are detached explicitly before the result set is redrawn.
    markersRef.current.forEach((item) => { item.map = null; });
    markersRef.current = [];

    loadMapsLibraries().then(({ marker }) => {
      markersRef.current = restaurants.map((restaurant) => {
        const pin = new marker.PinElement({
          background: selectedId === restaurant.id ? "#a34d32" : "#0f5132",
          borderColor: "#ffffff",
          glyphColor: "#ffffff",
          glyphText: "●",
          scale: selectedId === restaurant.id ? 1.25 : 1,
        });
        const mapMarker = new marker.AdvancedMarkerElement({
          map,
          position: { lat: restaurant.latitude, lng: restaurant.longitude },
          title: restaurant.name,
          content: pin.element,
        });
        mapMarker.addListener("click", () => onSelect(restaurant));
        return mapMarker;
      });
    }).catch(() => undefined);
  }, [restaurants, selectedId, onSelect]);

  if (!hasGoogleMapsKey()) {
    return (
      <div className="flex min-h-[390px] items-center justify-center bg-[#e8eee9] px-6 text-center">
        <div className="max-w-md rounded-2xl bg-white/90 p-6 shadow-sm">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#d9eee3] text-xl">📍</div>
          <h3 className="mt-3 font-serif text-xl font-semibold text-[#07241A]">Google Maps chưa được cấu hình</h3>
          <p className="mt-2 text-sm leading-6 text-[#5d655f]">
            Thêm <code className="rounded bg-[#f2f0ec] px-1.5 py-0.5">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> vào file <code>.env.local</code> để bật bản đồ tương tác.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[390px]">
      <div ref={elementRef} className="absolute inset-0" aria-label="Bản đồ các nhà hàng chay gần bạn" />
      {error && <div className="absolute inset-x-4 top-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 shadow">{error}</div>}
      <div className="absolute right-4 top-4 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[#234637] shadow-md">
        ● {restaurants.length} địa điểm chay
      </div>
    </div>
  );
}
