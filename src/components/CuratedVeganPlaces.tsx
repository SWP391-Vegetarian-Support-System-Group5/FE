"use client";

import UiText from "@/components/UiText";


import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useNearbyPlaces, displayPlaceCategory } from "@/hooks/useNearbyPlaces";
import Image from "next/image";
import { getMediaUrl } from "@/lib/api";
import RestaurantDetailsModal from "@/components/RestaurantDetailsModal";

interface VeganPlace {
  id: string;
  latitude?: number;
  longitude?: number;
  name: string;
  image: string;
  isPlaceholder: boolean;
  dietTag: string;
  district: string;
  description: string;
  specialtyTag: string;
  address: string;
  signatureDishes: string[];
  distance?: string;
}

export default function CuratedVeganPlaces() {
  const { t } = useLanguage();
  const { places: nearby, loading, message, origin } = useNearbyPlaces();
  const places: VeganPlace[] = nearby.map(place => ({
    id: place.id, name: place.name, latitude: place.latitude, longitude: place.longitude,
    image: place.imageUrl ? getMediaUrl(place.imageUrl) : "/images/hero_slide.png",
    isPlaceholder: !place.imageUrl,
    dietTag: displayPlaceCategory(place.category, t), district: place.areaCode === "all" ? t("Nearby", "Gần đây") : place.areaCode,
    description: place.address, specialtyTag: "VeggieMate",
    address: place.address, signatureDishes: place.foods ?? [],
    distance: place.distanceKm != null ? `${place.distanceKm.toFixed(1)} km` : t("Nearby", "Gần đây"),
  }));
  const [selectedPlace, setSelectedPlace] = useState<VeganPlace | null>(null);
  const selectedRestaurant = selectedPlace ? nearby.find(item => item.id === selectedPlace.id) : undefined;

  return (
    <div className="mx-auto max-w-7xl px-5 pb-16 lg:px-12">
      {/* 1. SECTION HEADER */}
      <section className="mt-14 sm:mt-18">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-b border-[#EFEEEB] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#C25E48]">
              <span><UiText text={"Những căn bếp chay nổi bật"} /></span>
            </div>
            <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#07241A] sm:text-3xl">{t("Vegetarian places near you", "Địa điểm chay gần bạn")}</h2>
            <p className="mt-1 text-xs text-[#727974] sm:text-sm">{message}</p>
          </div>

          <div className="rounded-full border border-[#EFEEEB] bg-[#F5F3F0] px-3.5 py-1 text-xs font-medium text-[#727974] shrink-0 self-start sm:self-auto">
            {places.length}{" "}<UiText text={"Địa điểm chọn lọc"} /></div>
        </div>

        {loading && <p role="status" className="py-6">{t("Loading...", "Đang tải...")}</p>}
        {!loading && places.length === 0 && <p className="py-6">{message}</p>}
        {/* 2. CARDS GRID */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {places.map((place) => (
            <div
              key={place.id}
              onClick={() => setSelectedPlace(place)}
              className="group flex flex-col overflow-hidden rounded-3xl border border-[#EFEEEB] bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EFEEEB]">
                <Image
                  src={place.image}
                  alt={place.name}
                  fill
                  unoptimized
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />

                {place.isPlaceholder && <span className="absolute bottom-3 left-3 rounded bg-white/90 px-2 py-1 text-xs">{t("Illustration", "Ảnh minh họa")}</span>}
                <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold shadow-md backdrop-blur-xs ${
                      place.dietTag === "100% Vegan"
                        ? "bg-[#8E3A2B] text-white"
                        : "bg-[#07241A] text-white"
                    }`}
                  >
                    {place.dietTag}
                  </span>
                  <span className="rounded-full border border-[#EFEEEB] bg-white/90 px-2.5 py-1 text-xs font-semibold text-[#07241A] shadow-md backdrop-blur-xs">
                    {place.district}
                  </span>
                </div>

                <div className="absolute bottom-3.5 right-3.5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#07241A] shadow-md">{place.distance}</div>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-serif text-xl font-bold text-[#07241A] transition group-hover:text-[#1E3A2F]">
                  {place.name}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-[#5C6460]">
                  {place.description}
                </p>

                <div className="mt-auto pt-5 flex items-center justify-between border-t border-[#F2EFE9] text-xs">
                  <div className="text-[#727974] font-medium truncate max-w-[60%]">
                    {place.specialtyTag}
                  </div>

                  <div className="text-xs font-semibold text-[#1E3A2F]">{place.dietTag}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. EDITORIAL QUOTE BANNER */}
      <section className="mt-20 sm:mt-24 mb-8 text-center">
        <div className="font-serif text-4xl sm:text-5xl font-bold text-[#C25E48]">
          &rdquo;
        </div>
        <blockquote className="mt-2 mx-auto max-w-3xl font-serif text-2xl sm:text-3xl lg:text-[34px] lg:leading-[44px] italic text-[#07241A]"><UiText text={"“Một bữa ăn thực vật là cách trân trọng đất trời, mùa vụ và nhịp sống nhẹ nhàng.”"} /></blockquote>
        <p className="mt-4 text-[11px] font-semibold tracking-widest uppercase text-[#727974]"><UiText text={"Cẩm nang VeggieMate · Sài Gòn"} /></p>
      </section>

      {selectedRestaurant && origin && <RestaurantDetailsModal restaurant={selectedRestaurant} origin={origin} onClose={() => setSelectedPlace(null)} />}
    </div>
  );
}
