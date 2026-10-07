"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VeggieAIChat from "@/components/VeggieAIChat";

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
    description: "Authentic Saigon plant-based hotpot & fresh spring rolls made daily with heirloom herbs and house-pressed tofu.",
    specialtyTag: "🌱 Organic & Broth Specials",
    priceLevel: "$$ · Moderate",
    address: "214 Vo Van Tan, Ward 5, District 3, Ho Chi Minh City",
    phone: "(+84) 28 3832 9988",
    openHours: "08:00 - 22:00",
    signatureDishes: ["Heirloom Mushroom Hotpot", "House-Pressed Lemongrass Tofu", "Crispy Herbal Spring Rolls"],
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
    description: "Modern vegan comfort cuisine & organic smoothies crafted without refined sugars or artificial additives.",
    specialtyTag: "🍹 Craft Smoothies & Bowls",
    priceLevel: "$$$ · Premium",
    address: "38 Ben Nghe, District 1, Ho Chi Minh City",
    phone: "(+84) 28 3822 5678",
    openHours: "08:30 - 21:30",
    signatureDishes: ["Spirulina Green Glow Smoothie", "Truffle Avocado Sourdough", "Botanical Harvest Buddha Bowl"],
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
    description: "Cozy family-style dining with seasonal garden produce and savory claypot braised specialties.",
    specialtyTag: "🍲 Family Claypots & Soups",
    priceLevel: "$ · Everyday Warmth",
    address: "88 Nguyen Thi Thap, Tan Phong, District 7, Ho Chi Minh City",
    phone: "(+84) 28 5410 7766",
    openHours: "09:00 - 21:30",
    signatureDishes: ["Caramelized Claypot Tofu & Pepper", "Lotus Root Broth", "Steamed Seasonal Greens with Sesame Dip"],
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
    description: "Traditional Vietnamese Buddhist vegetarian cuisine celebrated for subtle balance, herbal broths, and peace of mind.",
    specialtyTag: "🍵 Heritage Herbal Balance",
    priceLevel: "$$ · Moderate",
    address: "10 Nguyen Tri Phuong, Ward 7, District 5, Ho Chi Minh City",
    phone: "(+84) 28 3855 2244",
    openHours: "07:30 - 21:00",
    signatureDishes: ["Monastery Lotus Seed Soup", "Braised Silken Bean Curd with Star Anise", "Ceremonial Jasmine Tea"],
    distance: "1.8 km",
    walkingTime: "7 mins ride",
  },
];

export default function VeganPlacesPage() {
  const [selectedCity, setSelectedCity] = useState("Ho Chi Minh City");
  const [searchDishQuery, setSearchDishQuery] = useState("");
  const [previewMemberMode, setPreviewMemberMode] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<VeganPlace | null>(null);

  const filteredPlaces = useMemo(() => {
    return VEGAN_PLACES_DATA.filter((place) => {
      const matchSearch =
        place.name.toLowerCase().includes(searchDishQuery.toLowerCase()) ||
        place.description.toLowerCase().includes(searchDishQuery.toLowerCase()) ||
        place.specialtyTag.toLowerCase().includes(searchDishQuery.toLowerCase()) ||
        place.signatureDishes.some((dish) => dish.toLowerCase().includes(searchDishQuery.toLowerCase())) ||
        place.district.toLowerCase().includes(searchDishQuery.toLowerCase());

      return matchSearch;
    });
  }, [searchDishQuery]);

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF9F6] text-[#07241A] font-sans antialiased selection:bg-[#D9E6DC] selection:text-[#07241A]">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-8 sm:py-12 lg:px-12">
          {/* 1. TOP HEADER & DIRECTORY BADGE */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#C5D7CA] bg-[#D9E6DC]/70 px-3.5 py-1 text-[11px] font-semibold tracking-wider text-[#1E3A2F] uppercase">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
              <span>Botanical Dining Directory</span>
            </div>

            <h1 className="font-serif text-3xl font-medium tracking-tight text-[#07241A] sm:text-4xl lg:text-[46px] lg:leading-[52px]">
              Vegan Places
            </h1>

            <p className="text-sm text-[#424844] sm:text-base">
              Discover vegetarian and vegan places in your city.
            </p>
          </div>

          {/* 2. FILTER CONTROLS BAR */}
          <div className="mt-8 rounded-2xl border border-[#EFEEEB] bg-[#FAF8F5] p-4 sm:p-5 shadow-xs">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
              {/* Selected City Dropdown */}
              <div className="md:col-span-4">
                <label className="block text-[11px] font-semibold text-[#727974] mb-1.5 uppercase tracking-wide">
                  Selected City
                </label>
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-[#EFEEEB] bg-white px-4 py-2.5 pr-9 text-xs sm:text-sm font-medium text-[#07241A] shadow-2xs focus:border-[#1E3A2F] focus:outline-none"
                  >
                    <option value="Ho Chi Minh City">Ho Chi Minh City</option>
                    <option value="Ha Noi">Ha Noi</option>
                    <option value="Da Nang">Da Nang</option>
                    <option value="Hue">Hue</option>
                    <option value="Can Tho">Can Tho</option>
                  </select>
                  <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#727974]">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Find Specific Dishes or Places Input */}
              <div className="md:col-span-8">
                <label className="block text-[11px] font-semibold text-[#727974] mb-1.5 uppercase tracking-wide">
                  Find specific dishes or places
                </label>
                <div className="relative flex items-center">
                  <svg
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#727974]"
                    width="16"
                    height="16"
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
                    value={searchDishQuery}
                    onChange={(e) => setSearchDishQuery(e.target.value)}
                    placeholder="Search restaurants or foods (e.g. tofu, spring rolls)..."
                    className="w-full rounded-xl border border-[#EFEEEB] bg-white py-2.5 pl-10 pr-9 text-xs sm:text-sm text-[#07241A] placeholder-[#727974] shadow-2xs focus:border-[#1E3A2F] focus:outline-none"
                  />
                  {searchDishQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchDishQuery("")}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#727974] hover:text-[#07241A]"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. PERSONALIZED NEARBY MAP SECTION */}
          <section className="mt-12 sm:mt-16">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#C25E48]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m16 12-4-4-4 4" />
                  <path d="M12 16V8" />
                </svg>
                <span>Protected Neighborhood Radius</span>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-serif text-2xl font-bold tracking-tight text-[#07241A] sm:text-3xl">
                  Personalized Nearby Map
                </h2>

                <button
                  type="button"
                  onClick={() => setPreviewMemberMode(!previewMemberMode)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#EFEEEB] bg-white px-4 py-1.5 text-xs font-semibold text-[#424844] shadow-2xs transition hover:bg-[#F5F3F0] hover:text-[#07241A]"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span>{previewMemberMode ? "Hide Member View" : "Preview Authorized Member View"}</span>
                </button>
              </div>
            </div>

            {/* Stylized Map Viewport */}
            <div className="relative mt-6 h-[360px] sm:h-[420px] w-full overflow-hidden rounded-3xl border border-[#EFEEEB] bg-[#EBE7DF]/70 shadow-xs">
              {/* Cartographic Vector Graphic Background */}
              <svg className="absolute inset-0 h-full w-full opacity-60 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="city-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#DCD6CA" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#city-grid)" />
                {/* Simulated river curve */}
                <path
                  d="M-50,220 C200,280 450,150 750,260 C1050,370 1300,180 1600,240"
                  fill="none"
                  stroke="#D3E0D8"
                  strokeWidth="42"
                  strokeLinecap="round"
                />
                {/* Main thoroughfares */}
                <path d="M0,110 L1600,140" stroke="#F5F3ED" strokeWidth="9" />
                <path d="M0,310 L1600,290" stroke="#F5F3ED" strokeWidth="7" />
                <path d="M320,0 L360,600" stroke="#F5F3ED" strokeWidth="8" />
                <path d="M850,0 L820,600" stroke="#F5F3ED" strokeWidth="9" />
                <path d="M1250,0 L1280,600" stroke="#F5F3ED" strokeWidth="7" />
              </svg>

              {/* Simulated Ambient Map Pins */}
              <div className="absolute left-[18%] top-[32%] flex items-center gap-1.5 opacity-60 blur-2xs">
                <span className="h-3 w-3 rounded-full bg-[#1E3A2F]/50 ring-4 ring-[#1E3A2F]/20" />
                <span className="text-[10px] font-bold text-[#727974]">District 3</span>
              </div>
              <div className="absolute right-[22%] top-[65%] flex items-center gap-1.5 opacity-60 blur-2xs">
                <span className="h-3 w-3 rounded-full bg-[#1E3A2F]/50 ring-4 ring-[#1E3A2F]/20" />
                <span className="text-[10px] font-bold text-[#727974]">District 7</span>
              </div>
              <div className="absolute left-[26%] bottom-[25%] flex items-center gap-1.5 opacity-60 blur-2xs">
                <span className="h-3 w-3 rounded-full bg-[#1E3A2F]/50 ring-4 ring-[#1E3A2F]/20" />
                <span className="text-[10px] font-bold text-[#727974]">District 5</span>
              </div>

              {/* Center Location Callout or Member Interactive View */}
              {!previewMemberMode ? (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <div className="relative max-w-md rounded-2xl border border-[#EFEEEB] bg-white/95 p-6 sm:p-7 text-center shadow-xl backdrop-blur-md transition">
                    {/* Pin Icon */}
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F6E9E4] text-[#C25E48]">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>

                    <h3 className="mt-3.5 font-serif text-lg font-bold text-[#07241A] sm:text-xl">
                      Discover restaurants near your location
                    </h3>

                    <p className="mt-1.5 text-xs text-[#727974] leading-relaxed">
                      Sign in to unlock nearby recommendations and calculate walking distances.
                    </p>

                    <Link
                      href="/login"
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#07241A] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1E3A2F]"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" y1="12" x2="3" y2="12" />
                      </svg>
                      <span>Sign In</span>
                    </Link>
                  </div>
                </div>
              ) : (
                /* Member View Overlay with Nearby Walking Distances */
                <div className="absolute inset-0 flex flex-col justify-between p-6 animate-in fade-in duration-300">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#1E3A2F] px-3.5 py-1 text-xs font-semibold text-white shadow-md">
                      📍 Your Living Location: Ben Nghe, D1
                    </span>
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[#07241A] shadow-md backdrop-blur-xs">
                      4 places within 3km
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {VEGAN_PLACES_DATA.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPlace(p)}
                        className="rounded-2xl border border-white/80 bg-white/95 p-3 shadow-md backdrop-blur-md cursor-pointer hover:-translate-y-1 transition"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-[#1E3A2F]">
                          <span>{p.distance}</span>
                          <span className="text-[#727974]">{p.walkingTime}</span>
                        </div>
                        <p className="mt-1 font-serif text-xs font-bold text-[#07241A] truncate">{p.name}</p>
                        <p className="text-[10px] text-[#727974] truncate">{p.address}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 4. VEGETARIAN PLACES IN HO CHI MINH CITY (GRID) */}
          <section className="mt-14 sm:mt-18">
            {/* Header Row */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-b border-[#EFEEEB] pb-4">
              <div>
                <h2 className="font-serif text-2xl font-bold tracking-tight text-[#07241A] sm:text-3xl">
                  Vegetarian Places in {selectedCity}
                </h2>
                <p className="mt-1 text-xs text-[#727974] sm:text-sm">
                  Curated serene kitchens celebrated for mindful ingredients and culinary depth.
                </p>
              </div>

              <div className="rounded-full border border-[#EFEEEB] bg-[#F5F3F0] px-3.5 py-1 text-xs font-medium text-[#727974] shrink-0 self-start sm:self-auto">
                {filteredPlaces.length} Curated Tables
              </div>
            </div>

            {/* 4 Cards in 2x2 Grid */}
            {filteredPlaces.length > 0 ? (
              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                {filteredPlaces.map((place) => (
                  <div
                    key={place.id}
                    onClick={() => setSelectedPlace(place)}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-[#EFEEEB] bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
                  >
                    {/* Top Image */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EFEEEB]">
                      <Image
                        src={place.image}
                        alt={place.name}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />

                      {/* Top Left Badges */}
                      <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold shadow-md backdrop-blur-xs ${place.dietTag === "100% Vegan"
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

                      {/* Bottom Right Rating Pill */}
                      <div className="absolute bottom-3.5 right-3.5 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#07241A] shadow-md backdrop-blur-xs">
                        <span className="text-[#F59E0B] text-xs">★</span>
                        <span>{place.rating.toFixed(1)}</span>
                        <span className="text-[#727974] font-normal">({place.reviewsCount})</span>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="font-serif text-xl font-bold text-[#07241A] transition group-hover:text-[#1E3A2F]">
                        {place.name}
                      </h3>

                      <p className="mt-2 text-xs leading-relaxed text-[#5C6460]">
                        {place.description}
                      </p>

                      {/* Card Footer Details */}
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
            ) : (
              <div className="mt-12 rounded-2xl border border-dashed border-[#EFEEEB] bg-[#FAF8F5] p-12 text-center">
                <p className="font-serif text-lg text-[#07241A]">No vegetarian places match your search</p>
                <p className="mt-1 text-xs text-[#727974]">
                  Try clearing or adjusting your search term: &ldquo;{searchDishQuery}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => setSearchDishQuery("")}
                  className="mt-4 rounded-xl bg-[#07241A] px-4 py-2 text-xs font-semibold text-white"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </section>

          {/* 5. EDITORIAL QUOTE BANNER */}
          <section className="mt-20 sm:mt-28 mb-12 text-center">
            {/* Quote Mark Icon */}
            <div className="font-serif text-4xl sm:text-5xl font-bold text-[#C25E48]">
              &rdquo;
            </div>

            {/* Quote Paragraph */}
            <blockquote className="mt-2 mx-auto max-w-3xl font-serif text-2xl sm:text-3xl lg:text-[34px] lg:leading-[44px] italic text-[#07241A]">
              &ldquo;To sit at a plant-forward table is to honor the earth, the seasons, and the gentle pace of life.&rdquo;
            </blockquote>

            {/* Publication Attribution */}
            <p className="mt-4 text-[11px] font-semibold tracking-widest uppercase text-[#727974]">
              VeggieMate City Guide · Saigon Edition
            </p>
          </section>
        </div>
      </main>

      {/* RESTAURANT DETAIL MODAL */}
      {selectedPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#EFEEEB] bg-[#FAF8F5] shadow-2xl">
            {/* Modal Image Header */}
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
                  {placeDiet(selectedPlace.dietTag)}
                </span>
                <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-[#07241A]">
                  ★ {selectedPlace.rating} ({selectedPlace.reviewsCount} reviews)
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-[#8B5A3C] uppercase tracking-wide">
                    {selectedPlace.district} · {selectedPlace.priceLevel}
                  </span>
                  <h2 className="mt-1 font-serif text-2xl font-bold text-[#07241A] sm:text-3xl">
                    {selectedPlace.name}
                  </h2>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-[#424844]">
                {selectedPlace.description}
              </p>

              {/* Meta Grid */}
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

              {/* Signature Dishes */}
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

              {/* Call to action buttons */}
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

      {/* FLOATING VEGGIEAI CHATBOT WIDGET */}
      <VeggieAIChat />

      {/* FOOTER */}
      <Footer />
    </div>
  );
}

function placeDiet(tag: string) {
  return tag;
}
