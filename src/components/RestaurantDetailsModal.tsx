"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MapPin, Route, X } from "lucide-react";
import { getMediaUrl } from "@/lib/api";
import { locationApi, type RestaurantRoute } from "@/lib/location-api";
import { displayPlaceCategory } from "@/hooks/useNearbyPlaces";
import { useLanguage } from "@/context/LanguageContext";
import type { Coordinates, Restaurant } from "@/types/location";

const RestaurantRouteMap = dynamic(() => import("@/components/RestaurantRouteMap"), {
  ssr: false,
  loading: () => <div className="h-[280px] animate-pulse bg-[#edf2ec]" />,
});

export default function RestaurantDetailsModal({ restaurant, origin, onClose }: { restaurant: Restaurant; origin: Coordinates; onClose: () => void }) {
  const { t } = useLanguage();
  const routeKey = `${restaurant.id}:${origin.lat}:${origin.lng}`;
  const [routeResult, setRouteResult] = useState<{ key: string; route: RestaurantRoute | null; message: string }>({
    key: "",
    route: null,
    message: "",
  });

  useEffect(() => {
    let active = true;
    void locationApi.restaurantRoute(restaurant.id, origin.lat, origin.lng)
      .then(value => {
        if (active) setRouteResult({ key: routeKey, route: value, message: "" });
      })
      .catch(() => {
        if (active) setRouteResult({
          key: routeKey,
          route: null,
          message: t("Could not load driving directions; straight-line distance is shown.", "Chưa tải được chỉ đường; đang hiển thị khoảng cách gần đúng."),
        });
      });
    return () => { active = false; };
  }, [origin.lat, origin.lng, restaurant.id, routeKey, t]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeWithEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeWithEscape);
    };
  }, [onClose]);

  const hasCurrentRoute = routeResult.key === routeKey;
  const route = hasCurrentRoute ? routeResult.route : null;
  const routeMessage = hasCurrentRoute ? routeResult.message : "";
  const distance = route?.distanceKm || restaurant.distanceKm;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex min-h-[100dvh] items-center justify-center overflow-y-auto bg-[#09281d]/45 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={restaurant.name}>
      <div className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-[#fffdfa] shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#eeeae3] bg-[#fffdfa]/95 px-6 py-4 backdrop-blur">
          <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#a34d32]">{displayPlaceCategory(restaurant.category, t)}</p><h2 className="mt-1 font-serif text-2xl font-semibold text-[#09281d]">{restaurant.name}</h2></div>
          <button type="button" aria-label={t("Close", "Đóng")} onClick={onClose} className="rounded-full p-2 text-[#53635a] transition hover:bg-[#edf2ec]"><X size={22} /></button>
        </div>
        {restaurant.imageUrl && <img src={getMediaUrl(restaurant.imageUrl)} alt={restaurant.name} className="h-56 w-full object-cover sm:h-72" />}
        <div className="space-y-5 p-6">
          <div className="flex items-start gap-3 text-sm leading-6 text-[#516057]"><MapPin className="mt-1 shrink-0 text-[#1d6a49]" size={18} /><span>{restaurant.address}</span></div>
          {(restaurant.foods?.length || restaurant.ingredientNames?.length) ? <div className="rounded-2xl bg-[#f1f6f1] p-4 text-sm text-[#294636]">
            {restaurant.foods?.length ? <p><b>{t("Featured dishes:", "Món có tại quán:")}</b> {restaurant.foods.join(" · ")}</p> : null}
            {restaurant.ingredientNames?.length ? <p className="mt-2"><b>{t("Ingredients supported:", "Nguyên liệu có hỗ trợ:")}</b> {restaurant.ingredientNames.join(" · ")}</p> : null}
          </div> : null}
          <div className="overflow-hidden rounded-2xl border border-[#dbe6dc]">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#f6faf6] px-4 py-3 text-sm text-[#234835]"><span className="inline-flex items-center gap-2 font-semibold"><Route size={17} /> {t("Directions from your saved location", "Đường đi từ vị trí đã lưu")}</span><span>{distance != null ? `${distance.toFixed(1)} km` : ""}{route?.durationMinutes ? ` · ~${route.durationMinutes} phút` : ""}</span></div>
            <div className="h-[280px]"><RestaurantRouteMap origin={origin} destination={{ lat: restaurant.latitude, lng: restaurant.longitude }} route={route?.coordinates} /></div>
          </div>
          {routeMessage && <p className="text-xs text-[#9a4a32]">{routeMessage}</p>}
        </div>
      </div>
    </div>,
    document.body,
  );
}
