"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { locationApi } from "@/lib/location-api";
import { readLivingLocation } from "@/lib/living-location";
import { getProfile } from "@/lib/profile-api";
import type { Coordinates, Restaurant } from "@/types/location";

function getBrowserLocation(): Promise<Coordinates | null> {
  if (!navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ lat: coords.latitude, lng: coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  });
}

function nearestThree(items: Restaurant[]) {
  return [...items]
    .sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY))
    .slice(0, 3);
}

export default function PopularRestaurants() {
  const { t } = useLanguage();
  const [places, setPlaces] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadRestaurants() {
      setLoading(true);
      const saved = readLivingLocation();
      let provinceCode = saved?.provinceCode || "hochiminh";
      let areaCode = saved?.areaCode || "all";
      let center: Coordinates | null = null;
      let dietTypeId: number | null = null;

      try {
        const profile = await getProfile();
        dietTypeId = profile.dietTypeId;
        if (profile.latitude != null && profile.longitude != null) {
          center = { lat: profile.latitude, lng: profile.longitude };
        }
      } catch {
        // Guests can still use saved/browser geolocation.
      }

      if (!center && saved?.center) {
        center = saved.center;
        provinceCode = saved.provinceCode || provinceCode;
        areaCode = saved.areaCode || areaCode;
      }

      if (!center) center = await getBrowserLocation();

      if (!center) {
        if (!cancelled) {
          setPlaces([]);
          setMessage(t(
            "Save your Living Location in My Profile to show nearby VeggieMate restaurants.",
            "Hãy lưu Vị trí sinh sống trong Hồ sơ để hiển thị nhà hàng VeggieMate gần bạn.",
          ));
          setLoading(false);
        }
        return;
      }

      const nextPlaces = nearestThree(await locationApi.restaurants(provinceCode, areaCode, center.lat, center.lng, dietTypeId));
      if (cancelled) return;
      setPlaces(nextPlaces);
      setMessage(nextPlaces.length
        ? t("VeggieMate restaurants within 5 km of your saved location.", "Nhà hàng VeggieMate trong bán kính 5km quanh vị trí đã lưu.")
        : t("No matching restaurants were found within 5 km of your saved location.", "Chưa tìm thấy nhà hàng phù hợp trong bán kính 5km quanh vị trí đã lưu."));
      setLoading(false);
    }

    void loadRestaurants().catch(() => {
      if (cancelled) return;
      setPlaces([]);
      setLoading(false);
      setMessage(t("Could not load restaurant data. Please try again.", "Không tải được dữ liệu nhà hàng. Vui lòng thử lại."));
    });
    return () => { cancelled = true; };
  }, [t]);

  return (
    <section id="restaurants" className="py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-[#07241A] sm:text-4xl">
            {t("Popular Restaurants", "Nhà hàng chay gần bạn")}
          </h2>
          <p className="mt-2 text-sm text-[#424844]">{message || t("Loading real nearby vegetarian places.", "Đang tải địa điểm chay thật gần bạn.")}</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {loading && Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-[350px] animate-pulse rounded-2xl border border-[#EFEEEB] bg-white shadow-sm" />
          ))}

          {!loading && places.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-[#CCD5C6] bg-white/70 px-6 py-12 text-center text-sm text-[#727974]">
              {message}
            </div>
          )}

          {places.map((place) => (
            <a
              key={place.id}
              href={`https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=18/${place.latitude}/${place.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="group overflow-hidden rounded-2xl border border-[#EFEEEB] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#E8EDE4]">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,#EDF3E9_0%,#F8F4ED_52%,#D9E6DC_100%)]" />
                <div className="absolute inset-x-0 top-1/2 h-px bg-[#1E3A2F]/10" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-[#1E3A2F]/10" />
                <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-[#1E3A2F] shadow-md">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                </div>
                <span className="absolute left-3 top-3 rounded-full bg-[#1E3A2F] px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
                  {place.category || "Vegetarian"}
                </span>
                <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-[#1E3A2F] shadow-sm">
                  VeggieMate · {place.distanceKm != null ? `${place.distanceKm.toFixed(1)} km` : t("Nearby", "Gần bạn")}
                </span>
              </div>
              <div className="p-5">
                <h3 className="line-clamp-2 font-serif text-xl font-semibold text-[#07241A]">{place.name}</h3>
                <div className="mt-2 flex items-start gap-1.5 text-xs text-[#424844]">
                  <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="line-clamp-2">{place.address}</span>
                </div>
                {place.foods?.length ? <p className="mt-3 line-clamp-2 text-xs text-[#727974]">{place.foods.join(" · ")}</p> : null}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
