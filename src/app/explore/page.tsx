"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import RecipeBrowser from "@/components/recipe/RecipeBrowser";
import CommunityFeed from "@/components/content/CommunityFeed";
import Reveal from "@/components/ui/Reveal";
import { useRememberedFilters } from "@/hooks/useRememberedFilters";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VeggieAIWidget from "@/components/VeggieAIWidget";
import { locationApi } from "@/lib/location-api";
import { readLivingLocation } from "@/lib/living-location";
import { getProfile } from "@/lib/profile-api";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import type { Coordinates, Restaurant } from "@/types/location";

interface RestaurantItem {
  id: string;
  name: string;
  isOpen: boolean;
  statusText: string;
  categoryBadge: string;
  type: string;
  address: string;
  district: string;
  priceRange: string;
  description: string;
  signatureDishes: string[];
  phone: string;
  openHours: string;
  latitude: number;
  longitude: number;
  distanceKm?: number | null;
}



function toRestaurantItem(place: Restaurant): RestaurantItem {
  const distanceText = place.distanceKm != null ? `${place.distanceKm.toFixed(1)} km away` : "Near your location";
  return {
    id: place.id,
    name: place.name,
    isOpen: true,
    statusText: distanceText,
    categoryBadge: "OSM",
    type: place.category || "Vegetarian",
    address: place.address,
    district: place.areaCode === "all" ? "Nearby" : place.areaCode,
    priceRange: "OpenStreetMap data",
    description: "Địa điểm chay thật được tìm quanh tọa độ hiện tại của bạn trong bán kính 5km.",
    signatureDishes: [],
    phone: "",
    openHours: "Check map listing",
    latitude: place.latitude,
    longitude: place.longitude,
    distanceKm: place.distanceKm,
  };
}

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

export default function ExplorePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [{ query: searchQuery, tab: activeTab }, setFilters] = useRememberedFilters(`explore:${user?.uid || "guest"}`, { query: "", tab: "all" });
  const setSearchQuery = (query: string) => setFilters(previous => ({ ...previous, query }));
  const setActiveTab = (tab: string) => setFilters(previous => ({ ...previous, tab }));
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [restaurants, setRestaurants] = useState<RestaurantItem[]>([]);
  const [restaurantLoading, setRestaurantLoading] = useState(true);
  const [restaurantMessage, setRestaurantMessage] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantItem | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("q") || params.has("tab")) setFilters(previous => ({
      query: params.get("q") ?? previous.query,
      tab: ["all", "recipes", "restaurants"].includes(params.get("tab") || "") ? params.get("tab")! : previous.tab,
    }));
  }, [setFilters]);

  useEffect(() => {
    if (!user) { setRestaurants([]); setRestaurantLoading(false); return; }
    let cancelled = false;

    async function loadNearbyRestaurants() {
      setRestaurantLoading(true);
      setRestaurantMessage(t("Searching real vegetarian places near you...", "Đang tìm địa điểm chay thật quanh vị trí của bạn..."));

      const saved = readLivingLocation();
      const provinceCode = saved?.provinceCode || "hochiminh";
      const areaCode = saved?.areaCode || "all";
      let center: Coordinates | null = null;
      let label = t("your profile address", "địa chỉ trong hồ sơ của bạn");

      try {
        const profile = await getProfile();
        if (profile.latitude != null && profile.longitude != null) {
          center = { lat: profile.latitude, lng: profile.longitude };
        }
      } catch {
        // Guest users or expired sessions can still use saved/browser geolocation.
      }

      if (!center && saved?.center) {
        center = saved.center;
        label = saved.address || t("your saved location", "vị trí đã lưu của bạn");
      }

      if (!center) {
        center = await getBrowserLocation();
        label = t("your current browser location", "vị trí trình duyệt hiện tại");
      }

      if (!center) {
        if (!cancelled) {
          setRestaurants([]);
          setLocationLabel(t("no location selected", "chưa chọn vị trí"));
          setRestaurantMessage(t(
            "No user coordinates yet. Save Living Location in My Profile or allow browser location.",
            "Chưa có tọa độ người dùng. Hãy lưu Living Location trong My Profile hoặc cấp quyền định vị cho trình duyệt.",
          ));
          setRestaurantLoading(false);
        }
        return;
      }

      const places = nearestSix(await locationApi.restaurants(provinceCode, areaCode, center.lat, center.lng));
      if (cancelled) return;
      setRestaurants(places.map(toRestaurantItem));
      setSelectedRestaurant((current) => current && places.some((place) => place.id === current.id) ? current : null);
      setLocationLabel(label);
      setRestaurantMessage(places.length > 0
        ? t(`Showing the 6 nearest real OSM places within 5km of ${label}.`, `Đang hiển thị 6 địa điểm OSM thật gần nhất trong bán kính 5km quanh ${label}.`)
        : t(`No real vegetarian restaurants were found within 5km of ${label}.`, `Không tìm thấy nhà hàng chay thật trong bán kính 5km quanh ${label}.`));
      setRestaurantLoading(false);
    }

    void loadNearbyRestaurants().catch(() => {
      if (cancelled) return;
      setRestaurants([]);
      setRestaurantLoading(false);
      setRestaurantMessage(t("Could not load restaurant data. Please try again.", "Không tải được dữ liệu nhà hàng. Vui lòng thử lại."));
    });
    return () => { cancelled = true; };
  }, [t, user]);

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { window.location.assign("/login"); return; }
    setSavedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((place) => {
      const matchQuery =
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchQuery;
    });
  }, [restaurants, searchQuery]);


  const showRestaurants = Boolean(user) && (activeTab === "all" || activeTab === "restaurants");
  const showRecipes = activeTab === "all" || activeTab === "recipes";

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF9F6] text-[#07241A] font-sans antialiased selection:bg-[#D9E6DC] selection:text-[#07241A]">
      <Navbar
        initialSearchQuery={searchQuery}
        onSearch={(query) => {
          startTransition(() => setSearchQuery(query));
        }}
      />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-8 sm:py-12 lg:px-12">
          {/* 1. TOP HEADER & TITLE */}
          <div className="space-y-3">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#C5D7CA] bg-[#D9E6DC]/70 px-3.5 py-1 text-xs font-semibold text-[#1E3A2F]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
              <span>{t("Culinary Directory", "Thư mục ẩm thực")}</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-3xl font-medium tracking-tight text-[#07241A] sm:text-4xl lg:text-[46px] lg:leading-[52px]">
              {t("Search & Explore", "Tìm kiếm & khám phá")}
            </h1>

            {/* Subtitle */}
            <p className="text-sm text-[#424844] sm:text-base">
              {t(
                "Find recipes, videos, posts and vegetarian places.",
                "Tìm công thức, video, đánh giá và địa điểm chay.",
              )}
            </p>
          </div>

          {/* 2. SEARCH & FILTER CARD */}
          <div className="mt-8 rounded-3xl border border-[#EFEEEB] bg-[#FAF8F5] p-5 sm:p-7 shadow-xs">
            {/* Search Input Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex flex-1 items-center rounded-2xl bg-[#EFECE6]/70 px-4 py-2 border border-[#E5E1D8] transition focus-within:border-[#1E3A2F] focus-within:bg-white">
                <svg
                  className="mr-3 text-[#727974] shrink-0"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("Search recipes, foods, restaurants...", "Tìm công thức, món ăn, nhà hàng...")}
                  className="w-full bg-transparent text-sm text-[#07241A] placeholder-[#727974] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="ml-2 text-xs text-[#727974] hover:text-[#07241A]"
                  >
                    ✕
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {}}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#07241A] px-7 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-[#1E3A2F]"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <span>{t("Search", "Tìm kiếm")}</span>
              </button>
            </div>

            {/* Filter Tabs Row */}
            <div className="mt-5 flex items-center">
              <div className="inline-flex rounded-full bg-[#EFECE6]/80 p-1 border border-[#E3DFD7]">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`rounded-full px-5 py-2 text-xs font-semibold tracking-wide transition ${
                    activeTab === "all"
                      ? "bg-white text-[#07241A] shadow-xs font-bold"
                      : "text-[#5C6460] hover:text-[#07241A]"
                  }`}
                >
                  {t("All", "Tất cả")}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("recipes")}
                  className={`rounded-full px-5 py-2 text-xs font-semibold tracking-wide transition ${
                    activeTab === "recipes"
                      ? "bg-white text-[#07241A] shadow-xs font-bold"
                      : "text-[#5C6460] hover:text-[#07241A]"
                  }`}
                >
                  {t("Video & Recipes", "Video & công thức")}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("restaurants")}
                  className={`rounded-full px-5 py-2 text-xs font-semibold tracking-wide transition ${
                    activeTab === "restaurants"
                      ? "bg-white text-[#07241A] shadow-xs font-bold"
                      : "text-[#5C6460] hover:text-[#07241A]"
                  }`}
                >
                  {t("Vegetarian Places", "Địa điểm chay")}
                </button>
              </div>
            </div>
          </div>

          {/* 3. LOCATION DISCOVERY PROMO BANNER */}
          {!user && <div className="mt-8 rounded-3xl border border-[#EFEEEB] bg-[#FAF8F5] p-5 sm:p-6 transition hover:shadow-xs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Left Info with Icon */}
              <div className="flex items-start sm:items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F6E9E4] text-[#C25E48]">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#07241A] sm:text-xl">
                    {t("Want to discover vegetarian places near you?", "Muốn khám phá địa điểm chay gần bạn?")}
                  </h3>
                  <p className="mt-0.5 text-xs text-[#5C6460] sm:text-sm">
                    {t(
                      "Sign in and add your living location to get nearby restaurant recommendations.",
                      "Đăng nhập và thêm vị trí sinh sống để nhận gợi ý nhà hàng gần bạn.",
                    )}
                  </p>
                </div>
              </div>

              {/* Right Sign In Action Button */}
              <Link
                href="/login"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#07241A] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1E3A2F]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>{t("Sign In", "Đăng nhập")}</span>
              </Link>
            </div>
          </div>}

          {/* 4. VEGETARIAN PLACES SECTION */}
          {showRestaurants && (
            <section className="mt-12 sm:mt-16">
              {/* Header Row */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-b border-[#EFEEEB] pb-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold tracking-tight text-[#07241A] sm:text-3xl">
                    {t("Vegetarian Places", "Địa điểm chay")}
                  </h2>
                  <p className="mt-1 text-xs text-[#727974] sm:text-sm">
                    {restaurantLoading
                      ? t("Searching real nearby places...", "Đang tìm địa điểm thật gần bạn...")
                      : t(`Showing ${filteredRestaurants.length} real places near ${locationLabel}`, `Đang hiển thị ${filteredRestaurants.length} địa điểm thật gần ${locationLabel}`)}
                  </p>
                </div>
                <p className="font-serif italic text-xs text-[#727974] sm:text-sm">
                  {t("Real data from OpenStreetMap", "Dữ liệu thật từ OpenStreetMap")}
                </p>
              </div>

              {/* Cards Grid */}
              {restaurantLoading ? (
                <div className="mt-8 rounded-2xl border border-[#EFEEEB] bg-[#FAF8F5] p-10 text-center text-sm text-[#727974]">
                  {restaurantMessage}
                </div>
              ) : filteredRestaurants.length > 0 ? (
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredRestaurants.map((place) => {
                    const isSaved = !!savedIds[place.id];
                    return (
                      <div
                        key={place.id}
                        onClick={() => setSelectedRestaurant(place)}
                        className="group flex flex-col overflow-hidden rounded-3xl border border-[#EFEEEB] bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
                      >
                        {/* Top Image Container */}
                        <div className="relative aspect-[16/11] w-full overflow-hidden bg-[#E8EDE4]">
                          <div className="absolute inset-0 bg-[linear-gradient(135deg,#EDF3E9_0%,#F8F4ED_52%,#D9E6DC_100%)]" />
                          <div className="absolute inset-x-0 top-1/2 h-px bg-[#1E3A2F]/10" />
                          <div className="absolute inset-y-0 left-1/2 w-px bg-[#1E3A2F]/10" />
                          <div className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-[#1E3A2F] shadow-md">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                          </div>

                          {/* Top Right Bookmark Button */}
                          <button
                            type="button"
                            onClick={(e) => toggleSave(place.id, e)}
                            className={`absolute top-3.5 right-3.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur-md transition hover:scale-110 ${
                              isSaved ? "text-[#C25E48]" : "text-[#424844] hover:text-[#07241A]"
                            }`}
                            title={isSaved ? t("Remove from bookmarks", "Bỏ lưu") : t("Save restaurant", "Lưu nhà hàng")}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill={isSaved ? "currentColor" : "none"}
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                            </svg>
                          </button>

                          {/* Bottom Left Status Badge */}
                          <div className="absolute bottom-3.5 left-3.5 flex items-center gap-1.5 rounded-full bg-[#07241A]/85 px-3 py-1 text-[11px] font-medium text-white shadow-md backdrop-blur-md">
                            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{place.statusText}</span>
                          </div>
                          <div className="absolute bottom-3.5 right-3.5 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-[#1E3A2F] shadow-md backdrop-blur-md">
                            {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="flex flex-1 flex-col p-5">
                          {/* Tags */}
                          <div className="flex items-center gap-2 text-xs">
                            <span className="rounded-md bg-[#D9E6DC] px-2 py-0.5 text-[11px] font-semibold text-[#1E3A2F]">
                              {place.categoryBadge}
                            </span>
                            <span className="text-[#727974]">·</span>
                            <span className="font-medium text-[#424844]">{place.type}</span>
                          </div>

                          {/* Name */}
                          <h3 className="mt-2 font-serif text-xl font-bold text-[#07241A] transition group-hover:text-[#1E3A2F]">
                            {place.name}
                          </h3>

                          {/* Short Description */}
                          <p className="mt-2 text-xs leading-relaxed text-[#727974] line-clamp-2">
                            {place.description}
                          </p>

                          {/* Footer with Address & Details Link */}
                          <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#F2EFE9] text-xs">
                            <div className="flex items-center gap-1 text-[#727974]">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                              <span>{place.address}</span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRestaurant(place);
                              }}
                              className="flex items-center gap-1 font-semibold text-[#8B5A3C] transition group-hover:translate-x-0.5 hover:underline"
                            >
                              <span>{t("Details", "Chi tiết")}</span>
                              <span>→</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-12 rounded-2xl border border-dashed border-[#EFEEEB] bg-[#FAF8F5] p-12 text-center">
                  <p className="font-serif text-lg text-[#07241A]">{t("No vegetarian places found", "Không tìm thấy địa điểm chay")}</p>
                  <p className="mt-1 text-xs text-[#727974]">
                    {restaurantMessage || t(`Try clearing or adjusting your search term: "${searchQuery}"`, `Thử xóa hoặc đổi từ khóa tìm kiếm: "${searchQuery}"`)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mt-4 rounded-xl bg-[#07241A] px-4 py-2 text-xs font-semibold text-white"
                  >
                    {t("Reset Filter", "Đặt lại bộ lọc")}
                  </button>
                </div>
              )}
            </section>
          )}

          {/* 5. VIDEO & RECIPES SECTION (Shown when tab is "all" or "recipes") */}
          {showRecipes && <Reveal><RecipeBrowser keyword={searchQuery} /></Reveal>}
          {showRecipes && <Reveal><section className="mt-12 sm:mt-16"><CommunityFeed keyword={searchQuery} /></section></Reveal>}
        </div>
      </main>

      {/* RESTAURANT DETAIL MODAL */}
      {selectedRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#EFEEEB] bg-[#FAF8F5] shadow-2xl">
            {/* Header image */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#E8EDE4]">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#EDF3E9_0%,#F8F4ED_52%,#D9E6DC_100%)]" />
              <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 rounded-2xl bg-white/90 px-5 py-4 text-center text-[#1E3A2F] shadow-md">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                <span className="text-xs font-semibold">{t("Real OSM location", "Vị trí thật từ OSM")}</span>
                <span className="text-[11px] text-[#68766A]">{selectedRestaurant.latitude.toFixed(5)}, {selectedRestaurant.longitude.toFixed(5)}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRestaurant(null)}
                className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#07241A] shadow-lg backdrop-blur-md hover:bg-white"
                title="Close modal"
              >
                ✕
              </button>
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-semibold text-white">
                  {selectedRestaurant.type}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8">
              <h2 className="font-serif text-2xl font-bold text-[#07241A] sm:text-3xl">
                {selectedRestaurant.name}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-[#424844]">
                {selectedRestaurant.description}
              </p>

              {/* Meta details list */}
              <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 border border-[#EFEEEB] text-xs sm:grid-cols-2">
                <div className="flex items-center gap-2 text-[#424844]">
                  <span className="font-semibold text-[#07241A]">📍 {t("Address:", "Địa chỉ:")}</span>
                  <span>{selectedRestaurant.address}</span>
                </div>
                <div className="flex items-center gap-2 text-[#424844]">
                  <span className="font-semibold text-[#07241A]">⌖ {t("Coordinates:", "Tọa độ:")}</span>
                  <span>{selectedRestaurant.latitude.toFixed(5)}, {selectedRestaurant.longitude.toFixed(5)}</span>
                </div>
                <div className="flex items-center gap-2 text-[#424844]">
                  <span className="font-semibold text-[#07241A]">{t("Listing:", "Thông tin:")}</span>
                  <span>{selectedRestaurant.openHours}</span>
                </div>
                <div className="flex items-center gap-2 text-[#424844]">
                  <span className="font-semibold text-[#07241A]">{t("Source:", "Nguồn:")}</span>
                  <span>{selectedRestaurant.priceRange}</span>
                </div>
                <div className="flex items-center gap-2 text-[#424844]">
                  <span className="font-semibold text-[#07241A]">{t("Distance:", "Khoảng cách:")}</span>
                  <span>{selectedRestaurant.distanceKm != null ? `${selectedRestaurant.distanceKm.toFixed(1)} km` : t("Nearby", "Gần bạn")}</span>
                </div>
              </div>

              {/* Signature Dishes */}
              {selectedRestaurant.signatureDishes.length > 0 && <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#727974]">
                  {t("Signature Dishes & Recommendations", "Món nổi bật & gợi ý")}
                </h4>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {selectedRestaurant.signatureDishes.map((dish) => (
                    <span
                      key={dish}
                      className="rounded-full border border-[#D9E6DC] bg-[#E8EFEA] px-3 py-1 text-xs font-medium text-[#1E3A2F]"
                    >
                      🌿 {dish}
                    </span>
                  ))}
                </div>
              </div>}

              {/* Action buttons */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={(e) => toggleSave(selectedRestaurant.id, e)}
                  className="rounded-xl border border-[#EFEEEB] bg-white px-5 py-2.5 text-xs font-semibold text-[#07241A] hover:bg-[#F5F3F0] transition"
                >
                  {savedIds[selectedRestaurant.id] ? t("Saved in Bookmarks", "Đã lưu") : t("Save Place", "Lưu địa điểm")}
                </button>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${selectedRestaurant.latitude}&mlon=${selectedRestaurant.longitude}#map=18/${selectedRestaurant.latitude}/${selectedRestaurant.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-[#07241A] px-6 py-2.5 text-center text-xs font-semibold text-white shadow-xs hover:bg-[#1E3A2F] transition"
                >
                  {t("Open in OpenStreetMap", "Mở trong OpenStreetMap")}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING VEGGIEAI WIDGET */}
      <VeggieAIWidget />

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
