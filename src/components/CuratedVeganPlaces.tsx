"use client";

import { useState } from "react";
import Image from "next/image";

interface VeganPlace {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviewsCount: number;
  dietTag: "Vegetarian" | "100% Vegan";
  district: string;
  description: string;
  specialtyTag: string;
  priceLevel: "$ · Everyday Warmth" | "$$ · Moderate" | "$$$ · Premium";
  address: string;
  phone: string;
  openHours: string;
  signatureDishes: string[];
  distance?: string;
  walkingTime?: string;
}

const VEGAN_PLACES_DATA: VeganPlace[] = [
  {
    id: "green-garden",
    name: "Green Garden Vegetarian",
    image: "/images/vegan_green_garden.jpg",
    rating: 4.8,
    reviewsCount: 142,
    dietTag: "Vegetarian",
    district: "District 3",
    description:
      "Authentic Saigon plant-based hotpot & fresh spring rolls made daily with heirloom herbs and house-pressed tofu.",
    specialtyTag: "🌱 Organic & Broth Specials",
    priceLevel: "$$ · Moderate",
    address: "214 Vo Van Tan, Ward 5, District 3, Ho Chi Minh City",
    phone: "(+84) 28 3832 9988",
    openHours: "08:00 - 22:00",
    signatureDishes: [
      "Heirloom Mushroom Hotpot",
      "House-Pressed Lemongrass Tofu",
      "Crispy Herbal Spring Rolls",
    ],
    distance: "750m",
    walkingTime: "9 mins walk",
  },
  {
    id: "loving-leaf",
    name: "Loving Leaf Vegan",
    image: "/images/vegan_loving_leaf_cafe.jpg",
    rating: 4.9,
    reviewsCount: 98,
    dietTag: "100% Vegan",
    district: "District 1",
    description:
      "Modern vegan comfort cuisine & organic smoothies crafted without refined sugars or artificial additives.",
    specialtyTag: "🍹 Craft Smoothies & Bowls",
    priceLevel: "$$$ · Premium",
    address: "38 Ben Nghe, District 1, Ho Chi Minh City",
    phone: "(+84) 28 3822 5678",
    openHours: "08:30 - 21:30",
    signatureDishes: [
      "Spirulina Green Glow Smoothie",
      "Truffle Avocado Sourdough",
      "Botanical Harvest Buddha Bowl",
    ],
    distance: "450m",
    walkingTime: "6 mins walk",
  },
  {
    id: "veggie-house",
    name: "Veggie House",
    image: "/images/vegan_veggie_house.jpg",
    rating: 4.7,
    reviewsCount: 214,
    dietTag: "Vegetarian",
    district: "District 7",
    description:
      "Cozy family-style dining with seasonal garden produce and savory claypot braised specialties.",
    specialtyTag: "🍲 Family Claypots & Soups",
    priceLevel: "$ · Everyday Warmth",
    address: "88 Nguyen Thi Thap, Tan Phong, District 7, Ho Chi Minh City",
    phone: "(+84) 28 5410 7766",
    openHours: "09:00 - 21:30",
    signatureDishes: [
      "Caramelized Claypot Tofu & Pepper",
      "Lotus Root Broth",
      "Steamed Seasonal Greens with Sesame Dip",
    ],
    distance: "2.3 km",
    walkingTime: "10 mins ride",
  },
  {
    id: "an-duyen-chay",
    name: "An Duyen Chay",
    image: "/images/vegan_an_duyen.jpg",
    rating: 4.9,
    reviewsCount: 180,
    dietTag: "Vegetarian",
    district: "District 5",
    description:
      "Traditional Vietnamese Buddhist vegetarian cuisine celebrated for subtle balance, herbal broths, and peace of mind.",
    specialtyTag: "🍵 Heritage Herbal Balance",
    priceLevel: "$$ · Moderate",
    address: "10 Nguyen Tri Phuong, Ward 7, District 5, Ho Chi Minh City",
    phone: "(+84) 28 3855 2244",
    openHours: "07:30 - 21:00",
    signatureDishes: [
      "Monastery Lotus Seed Soup",
      "Braised Silken Bean Curd with Star Anise",
      "Ceremonial Jasmine Tea",
    ],
    distance: "1.8 km",
    walkingTime: "7 mins ride",
  },
];

export default function CuratedVeganPlaces() {
  const [selectedPlace, setSelectedPlace] = useState<VeganPlace | null>(null);

  return (
    <div className="mx-auto max-w-7xl px-5 pb-16 lg:px-12">
      {/* 1. SECTION HEADER */}
      <section className="mt-14 sm:mt-18">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-b border-[#EFEEEB] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#C25E48]">
              <span>Featured Botanical Kitchens</span>
            </div>
            <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#07241A] sm:text-3xl">
              Curated Vegan Places in Saigon
            </h2>
            <p className="mt-1 text-xs text-[#727974] sm:text-sm">
              Curated serene kitchens celebrated for mindful ingredients and culinary depth.
            </p>
          </div>

          <div className="rounded-full border border-[#EFEEEB] bg-[#F5F3F0] px-3.5 py-1 text-xs font-medium text-[#727974] shrink-0 self-start sm:self-auto">
            {VEGAN_PLACES_DATA.length} Curated Tables
          </div>
        </div>

        {/* 2. CARDS GRID */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {VEGAN_PLACES_DATA.map((place) => (
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
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />

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

                <div className="absolute bottom-3.5 right-3.5 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#07241A] shadow-md backdrop-blur-xs">
                  <span className="text-[#F59E0B] text-xs">★</span>
                  <span>{place.rating.toFixed(1)}</span>
                  <span className="text-[#727974] font-normal">({place.reviewsCount})</span>
                </div>
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

                  <div className="rounded-full bg-[#D9E6DC]/80 px-2.5 py-0.5 text-xs font-semibold text-[#1E3A2F] shrink-0">
                    {place.priceLevel}
                  </div>
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
        <blockquote className="mt-2 mx-auto max-w-3xl font-serif text-2xl sm:text-3xl lg:text-[34px] lg:leading-[44px] italic text-[#07241A]">
          &ldquo;To sit at a plant-forward table is to honor the earth, the seasons, and the gentle pace of life.&rdquo;
        </blockquote>
        <p className="mt-4 text-[11px] font-semibold tracking-widest uppercase text-[#727974]">
          VeggieMate City Guide · Saigon Edition
        </p>
      </section>

      {/* 4. RESTAURANT DETAIL MODAL */}
      {selectedPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#EFEEEB] bg-[#FAF8F5] shadow-2xl">
            <div className="relative aspect-[16/9] w-full bg-[#EFEEEB]">
              <Image
                src={selectedPlace.image}
                alt={selectedPlace.name}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedPlace(null)}
                className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#07241A] shadow-lg backdrop-blur-md hover:bg-white"
                title="Close modal"
              >
                ✕
              </button>
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-semibold text-white">
                  {selectedPlace.dietTag}
                </span>
                <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-[#07241A]">
                  ★ {selectedPlace.rating} ({selectedPlace.reviewsCount} reviews)
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div>
                <span className="text-xs font-semibold text-[#8B5A3C] uppercase tracking-wide">
                  {selectedPlace.district} · {selectedPlace.priceLevel}
                </span>
                <h2 className="mt-1 font-serif text-2xl font-bold text-[#07241A] sm:text-3xl">
                  {selectedPlace.name}
                </h2>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-[#424844]">
                {selectedPlace.description}
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 border border-[#EFEEEB] text-xs sm:grid-cols-2">
                <div className="flex items-center gap-2 text-[#424844]">
                  <span className="font-semibold text-[#07241A]">📍 Address:</span>
                  <span>{selectedPlace.address}</span>
                </div>
                <div className="flex items-center gap-2 text-[#424844]">
                  <span className="font-semibold text-[#07241A]">⏰ Hours:</span>
                  <span>{selectedPlace.openHours}</span>
                </div>
                <div className="flex items-center gap-2 text-[#424844]">
                  <span className="font-semibold text-[#07241A]">📞 Hotline:</span>
                  <span>{selectedPlace.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-[#424844]">
                  <span className="font-semibold text-[#07241A]">🚶 Proximity:</span>
                  <span>{selectedPlace.distance} ({selectedPlace.walkingTime})</span>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#727974]">
                  Signature Dishes & Recommendations
                </h4>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {selectedPlace.signatureDishes.map((dish) => (
                    <span
                      key={dish}
                      className="rounded-full border border-[#D9E6DC] bg-[#E8EFEA] px-3 py-1 text-xs font-medium text-[#1E3A2F]"
                    >
                      🌿 {dish}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedPlace(null)}
                  className="rounded-xl border border-[#EFEEEB] bg-white px-5 py-2.5 text-xs font-semibold text-[#07241A] hover:bg-[#F5F3F0] transition"
                >
                  Close
                </button>
                <a
                  href={`tel:${selectedPlace.phone}`}
                  className="rounded-xl bg-[#07241A] px-6 py-2.5 text-center text-xs font-semibold text-white shadow-xs hover:bg-[#1E3A2F] transition"
                >
                  Reserve Table / Call
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
