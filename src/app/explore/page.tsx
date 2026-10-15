"use client";

import UiText, { useUiText } from "@/components/UiText";


import { useState, useMemo, useTransition } from "react";
import { useRememberedFilters } from "@/hooks/useRememberedFilters";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CommunityFeed from "@/components/content/CommunityFeed";
import VeggieAIWidget from "@/components/VeggieAIWidget";

interface RestaurantItem {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviewsCount: number;
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
}

const RESTAURANTS_DATA: RestaurantItem[] = [
  {
    id: "loving-leaf",
    name: "Loving Leaf Vegan Bistro",
    image: "/images/restaurant_loving_leaf.png",
    rating: 4.9,
    reviewsCount: 148,
    isOpen: true,
    statusText: "Open now",
    categoryBadge: "Place",
    type: "100% Vegan",
    address: "Ben Nghe, District 1",
    district: "District 1",
    priceRange: "$$ (65.000đ - 180.000đ)",
    description: "An airy Scandinavian-inspired sanctuary serving botanical fusion, cold-pressed elixirs, and traditional Vietnamese noodle broths reimagined 100% vegan.",
    signatureDishes: ["Truffle Mushroom Claypot", "Loving Leaf Noodle Broth", "Lotus Seed Salad"],
    phone: "(+84) 28 3822 5678",
    openHours: "08:00 - 22:00",
  },
  {
    id: "om-mani",
    name: "Om Mani Vegetarian Bistro",
    image: "/images/restaurant_1.png",
    rating: 4.8,
    reviewsCount: 142,
    isOpen: true,
    statusText: "Open now",
    categoryBadge: "Place",
    type: "Vegetarian & Vegan",
    address: "Ward 6, District 3",
    district: "District 3",
    priceRange: "$$ (70.000đ - 220.000đ)",
    description: "Serene dining haven enveloped in bamboo greenery, celebrated for artisanal hotpots, savory tofu wraps, and mindful tea ceremonies.",
    signatureDishes: ["Wild Forest Mushroom Hotpot", "Crispy Sesame Tofu", "Lemongrass Steamed Buns"],
    phone: "(+84) 28 3930 1122",
    openHours: "09:00 - 21:30",
  },
  {
    id: "an-nhien",
    name: "An Nhien Vegetarian House",
    image: "/images/restaurant_an_nhien.png",
    rating: 4.7,
    reviewsCount: 215,
    isOpen: true,
    statusText: "Open now",
    categoryBadge: "Place",
    type: "Pure Plant Based",
    address: "Phan Xich Long, Phu Nhuan",
    district: "Phu Nhuan",
    priceRange: "$ (45.000đ - 130.000đ)",
    description: "Warm neighborhood favorite known for hearty hotpot broths simmering with whole herbs, tender abalone mushrooms, and organic mountain greens.",
    signatureDishes: ["Herbal Claypot Broth", "Crispy Rice with Mushroom Pate", "An Nhien Spring Rolls"],
    phone: "(+84) 28 3517 8899",
    openHours: "07:30 - 21:30",
  },
  {
    id: "organic-garden",
    name: "The Organic Garden Eatery",
    image: "/images/restaurant_garden_eatery.jpg",
    rating: 4.9,
    reviewsCount: 112,
    isOpen: true,
    statusText: "Closes 21:30",
    categoryBadge: "Place",
    type: "Farm-to-Table Vegan",
    address: "Thao Dien, District 2",
    district: "District 2",
    priceRange: "$$$ (95.000đ - 280.000đ)",
    description: "Sunlit courtyard restaurant dedicated to zero-waste cooking, vibrant colorful Buddha bowls, sourdough tartines, and freshly brewed kombuchas.",
    signatureDishes: ["Spiced Chickpea Nourish Bowl", "Avocado Tartine on Sourdough", "Berry Hibiscus Elixir"],
    phone: "(+84) 28 3744 3355",
    openHours: "08:30 - 21:30",
  },
  {
    id: "sen-trang",
    name: "Sen Trang Vegan Lounge",
    image: "/images/restaurant_sen_trang.jpg",
    rating: 4.8,
    reviewsCount: 168,
    isOpen: true,
    statusText: "Open now",
    categoryBadge: "Place",
    type: "100% Vegan",
    address: "Nguyen Hue, District 1",
    district: "District 1",
    priceRange: "$$ (80.000đ - 250.000đ)",
    description: "Timeless elegance with lotus wood carvings, serving elevated plant-forward banquet courses and ceremonial lotus seed desserts.",
    signatureDishes: ["Lotus Leaf Steamed Brown Rice", "Silken Tofu in Ginger Syrup", "Crispy Enoki Blossoms"],
    phone: "(+84) 28 3821 7766",
    openHours: "10:00 - 22:30",
  },
  {
    id: "moc-nhien",
    name: "Moc Nhien Garden Restaurant",
    image: "/images/restaurant_moc_nhien.jpg",
    rating: 4.6,
    reviewsCount: 96,
    isOpen: true,
    statusText: "Open now",
    categoryBadge: "Place",
    type: "Vegetarian & Healthy",
    address: "Vo Van Tan, District 3",
    district: "District 3",
    priceRange: "$$ (55.000đ - 165.000đ)",
    description: "Lush botanical retreat with open courtyard ponds and rustic brick walls, ideal for slow weekend brunches and restorative vegetarian meals.",
    signatureDishes: ["Mekong Herbal Noodle Soup", "Fried Lotus Stem with Cashews", "Matcha Chia Pudding"],
    phone: "(+84) 28 3933 4455",
    openHours: "08:00 - 21:00",
  },
];

export default function ExplorePage() {
  const ui = useUiText();
  const [{ searchQuery, activeTab: savedTab }, setExploreFilters] = useRememberedFilters("explore", { searchQuery: "", activeTab: "all" });
  const activeTab = ["all", "recipes", "restaurants"].includes(savedTab) ? savedTab : "all";
  const setSearchQuery = (searchQuery: string) => setExploreFilters(previous => ({ ...previous, searchQuery }));
  const setActiveTab = (activeTab: "all" | "recipes" | "restaurants") => setExploreFilters(previous => ({ ...previous, activeTab }));
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantItem | null>(null);
  const [, startTransition] = useTransition();

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredRestaurants = useMemo(() => {
    return RESTAURANTS_DATA.filter((place) => {
      const matchQuery =
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchQuery;
    });
  }, [searchQuery]);

  const showRestaurants = activeTab === "all" || activeTab === "restaurants";
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
              <span><UiText text={"Culinary Directory"} /></span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-3xl font-medium tracking-tight text-[#07241A] sm:text-4xl lg:text-[46px] lg:leading-[52px]"><UiText text={"Search & Explore"} /></h1>

            {/* Subtitle */}
            <p className="text-sm text-[#424844] sm:text-base"><UiText text={"Find recipes, videos, restaurant reviews and vegetarian places."} /></p>
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
                  placeholder={ui("Search recipes, foods, restaurants...")}
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
                <span><UiText text={"Search"} /></span>
              </button>
            </div>

            {/* Filter Tabs Row */}
            <div className="mt-5 flex items-center">
              <div className="inline-flex rounded-full bg-[#EFECE6]/80 p-1 border border-[#E3DFD7]">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`vm-button rounded-full px-5 py-2 text-xs font-semibold tracking-wide transition ${
                    activeTab === "all"
                      ? "bg-white text-[#07241A] shadow-xs font-bold"
                      : "text-[#5C6460] hover:text-[#07241A]"
                  }`}
                ><UiText text={"All"} /></button>
                <button
                  type="button"
                  onClick={() => setActiveTab("recipes")}
                  className={`vm-button rounded-full px-5 py-2 text-xs font-semibold tracking-wide transition ${
                    activeTab === "recipes"
                      ? "bg-white text-[#07241A] shadow-xs font-bold"
                      : "text-[#5C6460] hover:text-[#07241A]"
                  }`}
                ><UiText text={"Video & Recipes"} /></button>
                <button
                  type="button"
                  onClick={() => setActiveTab("restaurants")}
                  className={`vm-button rounded-full px-5 py-2 text-xs font-semibold tracking-wide transition ${
                    activeTab === "restaurants"
                      ? "bg-white text-[#07241A] shadow-xs font-bold"
                      : "text-[#5C6460] hover:text-[#07241A]"
                  }`}
                ><UiText text={"Restaurant Reviews"} /></button>
              </div>
            </div>
          </div>

          {/* 3. LOCATION DISCOVERY PROMO BANNER */}
          <div className="mt-8 rounded-3xl border border-[#EFEEEB] bg-[#FAF8F5] p-5 sm:p-6 transition hover:shadow-xs">
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
                  <h3 className="font-serif text-lg font-bold text-[#07241A] sm:text-xl"><UiText text={"Want to discover vegetarian places near you?"} /></h3>
                  <p className="mt-0.5 text-xs text-[#5C6460] sm:text-sm"><UiText text={"Sign in and add your living location to get nearby restaurant recommendations."} /></p>
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
                <span><UiText text={"Sign In"} /></span>
              </Link>
            </div>
          </div>

          {/* 4. VEGETARIAN PLACES SECTION */}
          {showRestaurants && (
            <section className="mt-12 sm:mt-16">
              {/* Header Row */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between border-b border-[#EFEEEB] pb-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold tracking-tight text-[#07241A] sm:text-3xl"><UiText text={"Vegetarian Places"} /></h2>
                  <p className="mt-1 text-xs text-[#727974] sm:text-sm"><UiText text={"Showing"} />{" "}{filteredRestaurants.length}{" "}<UiText text={"curated recommendations"} /></p>
                </div>
                <p className="font-serif italic text-xs text-[#727974] sm:text-sm"><UiText text={"Curated for plant nourishment"} /></p>
              </div>

              {/* Cards Grid */}
              {filteredRestaurants.length > 0 ? (
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
                        <div className="relative aspect-[16/11] w-full overflow-hidden bg-[#EFEEEB]">
                          <Image
                            src={place.image}
                            alt={place.name}
                            fill
                            className="object-cover transition duration-500 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />

                          {/* Top Left Rating Badge */}
                          <div className="absolute top-3.5 left-3.5 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-[#07241A] shadow-md backdrop-blur-md">
                            <span className="text-[#F59E0B] text-xs">★</span>
                            <span>{place.rating.toFixed(1)}</span>
                          </div>

                          {/* Top Right Bookmark Button */}
                          <button
                            type="button"
                            onClick={(e) => toggleSave(place.id, e)}
                            className={`absolute top-3.5 right-3.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur-md transition hover:scale-110 ${
                              isSaved ? "text-[#C25E48]" : "text-[#424844] hover:text-[#07241A]"
                            }`}
                            title={isSaved ? ui("Remove from bookmarks") : ui("Save restaurant")}
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
                            <span>{ui(place.statusText)}</span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="flex flex-1 flex-col p-5">
                          {/* Tags */}
                          <div className="flex items-center gap-2 text-xs">
                            <span className="rounded-md bg-[#D9E6DC] px-2 py-0.5 text-[11px] font-semibold text-[#1E3A2F]">
                              {ui(place.categoryBadge)}
                            </span>
                            <span className="text-[#727974]">·</span>
                            <span className="font-medium text-[#424844]">{ui(place.type)}</span>
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
                              <span><UiText text={"Details"} /></span>
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
                  <p className="font-serif text-lg text-[#07241A]"><UiText text={"No vegetarian places found"} /></p>
                  <p className="mt-1 text-xs text-[#727974]"><UiText text={"Try clearing or adjusting your search term: “"} />{searchQuery}&rdquo;
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mt-4 rounded-xl bg-[#07241A] px-4 py-2 text-xs font-semibold text-white"
                  ><UiText text={"Reset Filter"} /></button>
                </div>
              )}
            </section>
          )}

          {/* 5. VIDEO & RECIPES SECTION (Shown when tab is "all" or "recipes") */}
          {showRecipes && <section className="mt-12 sm:mt-16"><CommunityFeed keyword={searchQuery} /></section>}
        </div>
      </main>

      {/* RESTAURANT DETAIL MODAL */}
      {selectedRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#EFEEEB] bg-[#FAF8F5] shadow-2xl">
            {/* Header image */}
            <div className="relative aspect-[16/9] w-full bg-[#EFEEEB]">
              <Image
                src={selectedRestaurant.image}
                alt={selectedRestaurant.name}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedRestaurant(null)}
                className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#07241A] shadow-lg backdrop-blur-md hover:bg-white"
                title={ui("Close modal")}
              >
                ✕
              </button>
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className="rounded-full bg-emerald-700 px-3 py-1 text-xs font-semibold text-white">
                  {<UiText text={selectedRestaurant.type} />}
                </span>
                <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-[#07241A]">
                  ★ {selectedRestaurant.rating} ({selectedRestaurant.reviewsCount}{" "}<UiText text={"reviews)"} /></span>
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
                  <span className="font-semibold text-[#07241A]"><UiText text={"📍 Address:"} /></span>
                  <span>{selectedRestaurant.address}</span>
                </div>
                <div className="flex items-center gap-2 text-[#424844]">
                  <span className="font-semibold text-[#07241A]"><UiText text={"⏰ Hours:"} /></span>
                  <span>{selectedRestaurant.openHours}</span>
                </div>
                <div className="flex items-center gap-2 text-[#424844]">
                  <span className="font-semibold text-[#07241A]"><UiText text={"💰 Price:"} /></span>
                  <span>{selectedRestaurant.priceRange}</span>
                </div>
                <div className="flex items-center gap-2 text-[#424844]">
                  <span className="font-semibold text-[#07241A]"><UiText text={"📞 Hotline:"} /></span>
                  <span>{selectedRestaurant.phone}</span>
                </div>
              </div>

              {/* Signature Dishes */}
              <div className="mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#727974]"><UiText text={"Signature Dishes & Recommendations"} /></h4>
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
              </div>

              {/* Action buttons */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={(e) => toggleSave(selectedRestaurant.id, e)}
                  className="rounded-xl border border-[#EFEEEB] bg-white px-5 py-2.5 text-xs font-semibold text-[#07241A] hover:bg-[#F5F3F0] transition"
                >
                  {savedIds[selectedRestaurant.id] ? ui("Saved in Bookmarks") : ui("Save Place")}
                </button>
                <a
                  href={`tel:${selectedRestaurant.phone}`}
                  className="rounded-xl bg-[#07241A] px-6 py-2.5 text-center text-xs font-semibold text-white shadow-xs hover:bg-[#1E3A2F] transition"
                ><UiText text={"Reserve Table / Call"} /></a>
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
