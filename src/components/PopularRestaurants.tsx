"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { locationApi } from "@/lib/location-api";
import { readLivingLocation } from "@/lib/living-location";
import { getProfile } from "@/lib/profile-api";
import { getMediaUrl } from "@/lib/api";
import { displayPlaceCategory } from "@/hooks/useNearbyPlaces";
import RestaurantDetailsModal from "@/components/RestaurantDetailsModal";
import CardSkeleton from "@/components/ui/CardSkeleton";
import ContentIcon from "@/components/content/ContentIcon";
import FeedImage from "@/components/ui/FeedImage";
import Reveal from "@/components/ui/Reveal";
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
  const { locale, t } = useLanguage();
  const [places, setPlaces] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Restaurant | null>(null);

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
      setOrigin(center);

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
    <>
    <Reveal><section id="restaurants" className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#E2E7DC] pb-5 sm:pb-6">
          <div>
          <p className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#527244] sm:text-[11px]">
            <ContentIcon name="pin" width="14" height="14" />{t("A little closer to you", "Gần bạn hơn một chút")}
          </p>
          <h2 className="font-serif text-3xl font-medium leading-tight tracking-tight text-[#07241A] sm:text-4xl">
            {t("Popular Restaurants", "Nhà hàng chay gần bạn")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#59635C]">{t("Discover vegetarian restaurants around your saved address.", "Khám phá những quán chay quanh địa chỉ sinh sống của bạn.")}</p>
          </div>
          {!loading && places.length > 0 && <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#DCE6D7] bg-[#F0F5EB] px-3.5 py-2 text-xs text-[#527244]">
            <ContentIcon name="walk" width="15" height="15" />{t("Within 5 km", "Trong bán kính 5 km")}
          </span>}
        </div>

        {loading && <CardSkeleton count={3} />}
        {!loading && places.length === 0 && <p role="status" className="mt-8 rounded-2xl border border-dashed border-[#CCD5C6] bg-white/70 px-6 py-12 text-center text-sm text-[#727974]">{message}</p>}
        {!loading && places.length > 0 && <div className="vm-stagger mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {places.map((place) => (
            <button
              key={place.id}
              type="button"
              onClick={() => setSelectedPlace(place)}
              className="vm-card vm-enter group flex min-w-0 text-left flex-col overflow-hidden rounded-3xl border border-[#E0E5DA] bg-white shadow-[0_3px_12px_#1e3a2f05] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#527244]"
            >
              <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden bg-[#E8EDE4]">
                {place.imageUrl ? <FeedImage key={place.imageUrl} src={getMediaUrl(place.imageUrl)} alt={place.name} compact={false} /> : <div aria-hidden="true">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,#EDF3E9_0%,#F8F4ED_52%,#D9E6DC_100%)]" />
                  <div className="absolute inset-x-0 top-1/2 h-px bg-[#1E3A2F]/10" />
                  <div className="absolute inset-y-0 left-1/2 w-px bg-[#1E3A2F]/10" />
                  <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-[#1E3A2F] shadow-md">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                  </div>
                </div>}
                <span className="absolute left-3 top-3 rounded-full bg-[#1E3A2F] px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
                  {displayPlaceCategory(place.category, t)}
                </span>
                <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-[#1E3A2F] shadow-sm">
                  {place.distanceKm != null ? `${new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(place.distanceKm)} km` : t("Nearby", "Gần bạn")}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="line-clamp-2 font-serif text-xl font-semibold leading-snug text-[#07241A]">{place.name}</h3>
                <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#59635C]">
                  <svg className="mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="line-clamp-2">{place.address}</span>
                </div>
                {place.foods?.length ? <p className="mt-3 line-clamp-2 text-xs leading-5 text-[#727974]">{place.foods.join(" · ")}</p> : null}
                <div className="mt-auto pt-4">
                  <div className="flex items-center justify-between gap-2 border-t border-[#EAEDE5] pt-3 text-xs font-medium text-[#527244]">
                    <span>{t("View restaurant", "Xem chi tiết nhà hàng")}</span>
                    <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F1F5ED] transition-colors duration-200 group-hover:bg-[#254B38] group-hover:text-white group-focus-visible:bg-[#254B38] group-focus-visible:text-white"><ContentIcon name="arrow" width="16" height="16" /></span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>}
      </div>
    </section></Reveal>
    {selectedPlace && origin && <RestaurantDetailsModal restaurant={selectedPlace} origin={origin} onClose={() => setSelectedPlace(null)} />}
    </>
  );
}
