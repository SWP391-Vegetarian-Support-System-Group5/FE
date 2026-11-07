"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { locationApi } from "@/lib/location-api";
import { readLivingLocation } from "@/lib/living-location";
import { getProfile } from "@/lib/profile-api";
import { getMediaUrl } from "@/lib/api";
import { displayPlaceCategory } from "@/hooks/useNearbyPlaces";
import type { Coordinates, Restaurant } from "@/types/location";
import CardSkeleton from "@/components/ui/CardSkeleton";
import ContentIcon from "@/components/content/ContentIcon";
import FeedImage from "@/components/ui/FeedImage";
import Reveal from "@/components/ui/Reveal";

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
  const { user, loading } = useAuth();
  const [revision, setRevision] = useState(0);
  return <NearbyRestaurants key={`${loading ? "restoring" : user?.uid || "guest"}:${revision}`}
    signedIn={!!user} authLoading={loading} onRetry={() => setRevision(value => value + 1)} />;
}

type NearbyStatus = "loading" | "needs-address" | "guest-location" | "sign-in" | "empty" | "ready" | "error";

function validCenter(value: Coordinates | null | undefined): value is Coordinates {
  return !!value && Number.isFinite(value.lat) && Number.isFinite(value.lng) &&
    Math.abs(value.lat) <= 90 && Math.abs(value.lng) <= 180;
}

function NearbyNotice({ status, onRetry }: { status: NearbyStatus; onRetry: () => void }) {
  const { t } = useLanguage();
  const needsAddress = status === "needs-address";
  const needsLogin = status === "guest-location" || status === "sign-in";
  const failed = status === "error";
  const title = needsAddress
    ? t("Your next favorite spot starts with an address", "Thêm địa chỉ, tìm quán chay gần bạn")
    : status === "sign-in" ? t("Sign in again to see nearby places", "Đăng nhập lại để xem quán gần bạn")
      : needsLogin ? t("Save your address to explore nearby", "Lưu địa chỉ để khám phá quán chay quanh bạn")
        : failed ? t("We could not load your suggestions yet", "Chưa tải được gợi ý quanh bạn")
          : t("No nearby vegetarian restaurants found yet", "Hiện chưa tìm thấy nhà hàng chay gần đây");
  const description = needsAddress
    ? t("Please update your living address in your profile before using nearby restaurant suggestions.", "Vui lòng cập nhật địa chỉ sinh sống trong hồ sơ trước khi sử dụng tính năng gợi ý nhà hàng gần bạn.")
    : status === "sign-in" ? t("Your session has expired. Sign in again to use the address saved in your profile.", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để dùng địa chỉ đã lưu trong hồ sơ.")
      : needsLogin ? t("Sign in and save your living address in your profile to find vegetarian restaurants around you.", "Đăng nhập và lưu địa chỉ sinh sống trong hồ sơ để tìm những nhà hàng chay quanh bạn.")
        : failed ? t("We could not check your saved address or load restaurant data. Please try again shortly.", "Hiện chưa thể kiểm tra địa chỉ đã lưu hoặc tải dữ liệu nhà hàng. Bạn thử lại sau ít phút nhé.")
          : "";
  const href = needsAddress ? "/profile#living-location" : "/login";
  const action = needsAddress ? t("Update my address", "Cập nhật địa chỉ")
    : t("Sign in", "Đăng nhập");

  return <div role={failed ? "alert" : "status"} className="relative isolate mt-8 overflow-hidden rounded-3xl border border-[#DDE6DA] bg-[linear-gradient(110deg,#EDF3E9_0%,#FBF9F6_65%,#FFFFFF_100%)] p-6 sm:p-8 lg:px-10 lg:py-9">
    <div className="relative grid items-center gap-6 md:grid-cols-[180px_1fr] md:gap-9">
      <div aria-hidden="true" className="relative mx-auto flex h-36 w-44 items-center justify-center md:h-44 md:w-full">
        <div className="absolute h-32 w-32 rounded-full border border-[#CFDFCC] bg-[#DFEADC]/60 md:h-40 md:w-40" />
        <svg viewBox="0 0 200 160" fill="none" className="relative h-full w-full">
          <path d="m18 38 49-13 61 17 54-14v101l-54 14-61-17-49 13V38Z" fill="#FFFFFF" stroke="#C8D9C5" strokeWidth="1.5" />
          <path d="M67 26v99m61-82v99" stroke="#DEE7DA" strokeWidth="1.5" />
          <path d="m22 98 42-23 36 18 46-28 33 12" stroke="#E5ECDD" strokeWidth="9" />
          <path d="m22 98 42-23 36 18 46-28 33 12" stroke="#AEC5AA" strokeWidth="1.5" strokeDasharray="4 5" />
          <ellipse cx="105" cy="118" rx="22" ry="5" fill="#D8E4D3" />
          <path d="M105 111s-27-24-27-46a27 27 0 1 1 54 0c0 22-27 46-27 46Z" fill="#254B38" stroke="#FFFFFF" strokeWidth="3" />
          <circle cx="105" cy="65" r="10" fill="#E3EEDC" />
          <path d="M151 112c0-11 6-17 17-18 0 11-5 18-17 18Zm0 0-6 7" stroke="#658266" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
      <div className="min-w-0 text-center md:text-left">
        {status !== "empty" && <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-[#658266]">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#658266]" />{t("A greener meal, closer to you", "Một bữa chay, gần bạn hơn")}
        </span>}
        <h3 className="mt-3 font-serif text-2xl font-medium leading-tight text-[#07241A] sm:text-3xl">{title}</h3>
        {description && <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#59635C] md:mx-0">{description}</p>}
        {status !== "empty" && <div className="mt-5 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center md:justify-start">
          {failed ? <button type="button" onClick={onRetry} className="vm-button rounded-xl bg-[#254B38] px-5 py-3 text-sm font-medium text-white hover:bg-[#173E2B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#254B38]">{t("Try again", "Thử tải lại")}</button>
            : <Link href={href} className="vm-button inline-flex items-center justify-center gap-3 rounded-xl bg-[#254B38] px-5 py-3 text-sm font-medium text-white hover:bg-[#173E2B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#254B38]">
              {action}<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
            </Link>}
          {needsAddress && <button type="button" onClick={onRetry} className="vm-button rounded-xl px-3 py-2.5 text-sm text-[#254B38] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#254B38]">{t("Refresh suggestions", "Tải lại gợi ý")}</button>}
        </div>}
        {needsAddress && <p className="mt-3 text-xs leading-5 text-[#727974]">{t("Save your address, then return to see suggestions within 5 km.", "Lưu địa chỉ trong hồ sơ rồi quay lại để xem gợi ý trong bán kính 5 km.")}</p>}
      </div>
    </div>
  </div>;
}

function NearbyRestaurants({ signedIn, authLoading, onRetry }: { signedIn: boolean; authLoading: boolean; onRetry: () => void }) {
  const { locale, t } = useLanguage();
  const [places, setPlaces] = useState<Restaurant[]>([]);
  const [status, setStatus] = useState<NearbyStatus>("loading");

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    async function loadRestaurants() {
      const saved = readLivingLocation();
      const provinceCode = saved?.provinceCode || "hochiminh";
      const areaCode = saved?.areaCode || "all";
      let center: Coordinates | null = null;
      let dietTypeId: number | null = null;

      if (signedIn) {
        const profile = await getProfile();
        if (cancelled) return;
        dietTypeId = profile.dietTypeId;
        if (profile.latitude != null && profile.longitude != null) {
          center = { lat: profile.latitude, lng: profile.longitude };
        }
        // A browser-wide cache or GPS reading is not proof that this account
        // has saved an address. Do not search until its own profile is complete.
        if (!validCenter(center)) {
          setStatus("needs-address");
          return;
        }
      } else {
        center = validCenter(saved?.center) ? saved.center : await getBrowserLocation();
        if (cancelled) return;
        if (!validCenter(center)) { setStatus("guest-location"); return; }
      }

      const nextPlaces = nearestThree(await locationApi.restaurants(provinceCode, areaCode, center.lat, center.lng, dietTypeId));
      if (cancelled) return;
      setPlaces(nextPlaces);
      setStatus(nextPlaces.length ? "ready" : "empty");
    }

    void loadRestaurants().catch((failure: unknown) => {
      if (cancelled) return;
      setPlaces([]);
      setStatus(failure instanceof Error && /\b401\b/.test(failure.message) ? "sign-in" : "error");
    });
    return () => { cancelled = true; };
  }, [signedIn, authLoading]);

  return (
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
          {status === "ready" && <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#DCE6D7] bg-[#F0F5EB] px-3.5 py-2 text-xs text-[#527244]">
            <ContentIcon name="walk" width="15" height="15" />{t("Within 5 km", "Trong bán kính 5 km")}
          </span>}
        </div>

        {status === "loading" ? <div className="mt-3"><span role="status" className="sr-only">{t("Loading nearby restaurants…", "Đang tải nhà hàng gần bạn…")}</span><div aria-hidden="true"><CardSkeleton count={3} /></div></div>
          : status !== "ready" && <NearbyNotice status={status} onRetry={onRetry} />}

        {status === "ready" && <div className="vm-stagger mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {places.map((place) => (
            <a
              key={place.id}
              href={`https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=18/${place.latitude}/${place.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="vm-card vm-enter group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-[#E0E5DA] bg-white shadow-[0_3px_12px_#1e3a2f05] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#527244]"
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
                    <span>{t("View on the map", "Xem trên bản đồ")}<span className="sr-only">{t(" (opens in a new tab)", " (mở trong thẻ mới)")}</span></span>
                    <span aria-hidden="true" className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F1F5ED] transition-colors duration-200 group-hover:bg-[#254B38] group-hover:text-white group-focus-visible:bg-[#254B38] group-focus-visible:text-white"><ContentIcon name="arrow" width="16" height="16" /></span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>}
      </div>
    </section></Reveal>
  );
}
