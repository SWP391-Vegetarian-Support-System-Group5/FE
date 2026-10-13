"use client";

import { useEffect, useMemo, useState } from "react";
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

function nearestSix<T extends { distanceKm?: number | null }>(items: T[]) {
  return [...items]
    .sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY))
    .slice(0, 6);
}

function displayPlaceCategory(value: string | null | undefined, t: (en: string, vi: string) => string) {
  const normalized = (value || "").toLowerCase();
  if (normalized.includes("vegan") || normalized.includes("plant")) return t("Plant-based", "Thuần thực vật");
  if (normalized.includes("vegetarian")) return t("Vegetarian", "Ăn chay");
  return value || t("Vegetarian", "Ăn chay");
}

export default function CuratedVeganPlaces() {
  const { t } = useLanguage();
  const [places, setPlaces] = useState<Restaurant[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(t("Finding real vegetarian restaurants around your location...", "Đang tìm nhà hàng chay thật quanh vị trí của bạn..."));
  const [locationLabel, setLocationLabel] = useState(t("your location", "vị trí của bạn"));

  useEffect(() => {
    let cancelled = false;

    async function loadPlaces() {
      setLoading(true);
      const saved = readLivingLocation();
      let provinceCode = saved?.provinceCode || "hochiminh";
      let areaCode = saved?.areaCode || "all";
      let center: Coordinates | null = null;
      let label = t("your profile address", "địa chỉ hồ sơ của bạn");

      try {
        const profile = await getProfile();
        if (profile.latitude != null && profile.longitude != null) {
          center = { lat: profile.latitude, lng: profile.longitude };
        }
      } catch {
        // Guest users can still use saved/browser geolocation.
      }

      if (!center && saved?.center) {
        center = saved.center;
        label = saved.address || t("your saved location", "vị trí đã lưu của bạn");
      }

      if (!center) {
        center = await getBrowserLocation();
        label = t("your current browser location", "vị trí hiện tại của trình duyệt");
      }

      if (!center) {
        if (!cancelled) {
          setPlaces([]);
          setLocationLabel(t("no location selected", "chưa chọn vị trí"));
          setMessage(t("No user coordinates yet. Save Living Location in My Profile or allow browser location.", "Chưa có tọa độ người dùng. Hãy lưu Vị trí sinh sống trong Hồ sơ của tôi hoặc cấp quyền định vị cho trình duyệt."));
          setLoading(false);
        }
        return;
      }

      const data = nearestSix(await locationApi.restaurants(provinceCode, areaCode, center.lat, center.lng));
      if (cancelled) return;
      setPlaces(data);
      setSelectedPlace(null);
      setLocationLabel(label);
      setMessage(data.length > 0
        ? t(`Showing the 6 nearest real vegetarian restaurants within 5 km around ${label}.`, `Đang hiển thị 6 nhà hàng chay thật gần nhất trong bán kính 5km quanh ${label}.`)
        : t(`No real vegetarian restaurants were found within 5 km around ${label}.`, `Không tìm thấy nhà hàng chay thật trong bán kính 5km quanh ${label}.`));
      setLoading(false);
    }

    void loadPlaces().catch(() => {
      if (cancelled) return;
      setPlaces([]);
      setLoading(false);
      setMessage(t("Could not load restaurant data. Please try again.", "Không tải được dữ liệu nhà hàng. Vui lòng thử lại."));
    });
    return () => { cancelled = true; };
  }, [t]);

  const countLabel = useMemo(() => loading ? t("Searching...", "Đang tìm...") : `${places.length} ${t("real places", "địa điểm thật")}`, [loading, places.length, t]);

  return (
    <div className="mx-auto max-w-7xl px-5 pb-16 lg:px-12">
      <section className="mt-14 sm:mt-18">
        <div className="flex flex-col gap-2 border-b border-[#EFEEEB] pb-4 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#C25E48]">
              <span>{t("Real nearby vegetarian places", "Địa điểm chay thật gần bạn")}</span>
            </div>
            <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#07241A] sm:text-3xl">
              {t("Vegan Places Near You", "Địa điểm chay gần bạn")}
            </h2>
            <p className="mt-1 text-xs text-[#727974] sm:text-sm">{message}</p>
          </div>

          <div className="shrink-0 self-start rounded-full border border-[#EFEEEB] bg-[#F5F3F0] px-3.5 py-1 text-xs font-medium text-[#727974] sm:self-auto">
            {countLabel}
          </div>
        </div>

        {loading ? (
          <div className="mt-8 rounded-2xl border border-[#EFEEEB] bg-[#FAF8F5] p-10 text-center text-sm text-[#727974]">
            {t("Loading data from OpenStreetMap...", "Đang gọi dữ liệu từ OpenStreetMap...")}
          </div>
        ) : places.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[#EFEEEB] bg-[#FAF8F5] p-10 text-center">
            <p className="font-serif text-xl text-[#07241A]">{t("No real places found", "Chưa tìm thấy địa điểm thật")}</p>
            <p className="mt-2 text-sm text-[#727974]">{message}</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {places.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => setSelectedPlace(place)}
                className="group flex flex-col overflow-hidden rounded-3xl border border-[#EFEEEB] bg-white text-left shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#E8EDE4]">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,#EDF3E9_0%,#F8F4ED_52%,#D9E6DC_100%)]" />
                  <div className="absolute inset-x-0 top-1/2 h-px bg-[#1E3A2F]/10" />
                  <div className="absolute inset-y-0 left-1/2 w-px bg-[#1E3A2F]/10" />
                  <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-[#1E3A2F] shadow-md">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                  </div>
                  <span className="absolute left-3.5 top-3.5 rounded-full bg-[#07241A] px-3 py-1 text-xs font-semibold text-white shadow-md">
                    {displayPlaceCategory(place.category, t)}
                  </span>
                  <span className="absolute bottom-3.5 left-3.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#1E3A2F] shadow-md">
                    {place.distanceKm != null ? `${place.distanceKm.toFixed(1)} km ${t("from", "từ")} ${locationLabel}` : t("Nearby", "Gần đây")}
                  </span>
                  <span className="absolute bottom-3.5 right-3.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-[#1E3A2F] shadow-md">
                    {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-md bg-[#D9E6DC] px-2 py-0.5 text-[11px] font-semibold text-[#1E3A2F]">OSM</span>
                    <span className="text-[#727974]">·</span>
                    <span className="font-medium text-[#424844]">{t("Real listing", "Dữ liệu thật")}</span>
                  </div>
                  <h3 className="mt-2 font-serif text-xl font-bold text-[#07241A] transition group-hover:text-[#1E3A2F]">
                    {place.name}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-[#5C6460]">{place.address}</p>
                  <div className="mt-auto flex items-center justify-between border-t border-[#F2EFE9] pt-5 text-xs">
                    <span className="text-[#727974]">{place.reviewCount > 0 ? `${place.reviewCount} ${t("reviews", "đánh giá")}` : t("No review data from OSM", "OSM chưa có dữ liệu đánh giá")}</span>
                    <span className="font-semibold text-[#8B5A3C]">{t("Details", "Chi tiết")} →</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {selectedPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#EFEEEB] bg-[#FAF8F5] shadow-2xl">
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#E8EDE4]">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#EDF3E9_0%,#F8F4ED_52%,#D9E6DC_100%)]" />
              <button type="button" onClick={() => setSelectedPlace(null)} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#07241A] shadow-lg hover:bg-white" title={t("Close modal", "Đóng cửa sổ")}>x</button>
              <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#07241A]">
                {selectedPlace.latitude.toFixed(5)}, {selectedPlace.longitude.toFixed(5)}
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#8B5A3C]">{displayPlaceCategory(selectedPlace.category, t)} · OpenStreetMap</span>
              <h2 className="mt-1 font-serif text-2xl font-bold text-[#07241A] sm:text-3xl">{selectedPlace.name}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#424844]">{selectedPlace.address}</p>
              <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-[#EFEEEB] bg-white p-4 text-xs sm:grid-cols-2">
                <div><span className="font-semibold text-[#07241A]">{t("Distance:", "Khoảng cách:")}</span> {selectedPlace.distanceKm != null ? `${selectedPlace.distanceKm.toFixed(1)} km` : t("Nearby", "Gần đây")}</div>
                <div><span className="font-semibold text-[#07241A]">{t("Coordinates:", "Tọa độ:")}</span> {selectedPlace.latitude.toFixed(5)}, {selectedPlace.longitude.toFixed(5)}</div>
                <div><span className="font-semibold text-[#07241A]">{t("Rating:", "Đánh giá:")}</span> {selectedPlace.rating > 0 ? selectedPlace.rating : t("No OSM rating", "OSM chưa có điểm đánh giá")}</div>
                <div><span className="font-semibold text-[#07241A]">{t("Reviews:", "Lượt đánh giá:")}</span> {selectedPlace.reviewCount > 0 ? selectedPlace.reviewCount : t("No OSM review data", "OSM chưa có dữ liệu đánh giá")}</div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setSelectedPlace(null)} className="rounded-xl border border-[#EFEEEB] bg-white px-5 py-2.5 text-xs font-semibold text-[#07241A] hover:bg-[#F5F3F0]">{t("Close", "Đóng")}</button>
                <a href={`https://www.openstreetmap.org/?mlat=${selectedPlace.latitude}&mlon=${selectedPlace.longitude}#map=18/${selectedPlace.latitude}/${selectedPlace.longitude}`} target="_blank" rel="noreferrer" className="rounded-xl bg-[#07241A] px-6 py-2.5 text-center text-xs font-semibold text-white hover:bg-[#1E3A2F]">{t("Open in OpenStreetMap", "Mở trong OpenStreetMap")}</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
