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

export function displayPlaceCategory(value: string | null | undefined, t: (en: string, vi: string) => string) {
  return (value || "Unclassified").split(", ").map(label => {
    switch (label.toUpperCase().replace(/[- ]/g, "_")) {
      case "VEGAN": return t("Vegan", "Thuần chay");
      case "LACTO_VEGETARIAN": return t("Lacto-vegetarian", "Chay có sữa");
      case "OVO_VEGETARIAN": return t("Ovo-vegetarian", "Chay có trứng");
      case "LACTO_OVO_VEGETARIAN": return t("Lacto-ovo vegetarian", "Chay có sữa và trứng");
      case "VEGETARIAN": return t("Vegetarian", "Ăn chay");
      case "UNCLASSIFIED": return t("Unclassified", "Chưa phân loại");
      default: return label;
    }
  }).join(", ");
}

export function useNearbyPlaces() {
  const { t } = useLanguage();
  const [places, setPlaces] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(t("Finding VeggieMate restaurants around your location...", "Đang tìm nhà hàng VeggieMate quanh vị trí của bạn..."));
  const [locationLabel, setLocationLabel] = useState(t("your location", "vị trí của bạn"));

  useEffect(() => {
    let cancelled = false;

    async function loadPlaces() {
      setLoading(true);
      const saved = readLivingLocation();
      const provinceCode = saved?.provinceCode || "hochiminh";
      const areaCode = saved?.areaCode || "all";
      let center: Coordinates | null = null;
      let dietTypeId: number | null = null;
      let label = t("your profile address", "địa chỉ hồ sơ của bạn");

      try {
        const profile = await getProfile();
        dietTypeId = profile.dietTypeId;
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

      const data = nearestSix(await locationApi.restaurants(provinceCode, areaCode, center.lat, center.lng, dietTypeId));
      if (cancelled) return;
      setPlaces(data);
      setLocationLabel(label);
      setMessage(data.length > 0
        ? t(`Showing restaurants added by VeggieMate near ${label}.`, `Đang hiển thị nhà hàng do VeggieMate quản lý gần ${label}.`)
        : t(`No matching restaurants were found within 5 km around ${label}.`, `Không tìm thấy nhà hàng phù hợp trong bán kính 5km quanh ${label}.`));
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

  return { places, loading, message, locationLabel, countLabel };
}
