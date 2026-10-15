"use client";

import UiText, { useUiText } from "@/components/UiText";
import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/ui/Reveal";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CommunityFeed from "@/components/content/CommunityFeed";
import VeggieAIWidget from "@/components/VeggieAIWidget";

export default function HomePage() {
  const ui = useUiText();
  return (
    <div className="flex min-h-screen flex-col bg-[#FBF9F6]">
      <Navbar />

      <main className="flex-1">
        {/* 1. HERO SECTION */}
        <Reveal><section className="mx-auto max-w-7xl px-6 py-10 lg:px-12 lg:py-14">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Content */}
            <div className="lg:col-span-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-[#D9E6DC] px-3.5 py-1 text-[11px] font-semibold tracking-wider text-[#1E3A2F] uppercase">
                <span>🌱</span>
                <span><UiText text={"Vegetarian Lifestyle"} /></span>
              </div>

              {/* Main Heading */}
              <h1 className="mt-5 font-serif text-4xl font-medium tracking-tight text-[#07241A] sm:text-5xl lg:text-[56px] lg:leading-[64px]"><UiText text={"Discover Better"} />{" "}<br /><UiText text={"Vegetarian Living"} /></h1>

              {/* Subtitle */}
              <p className="mt-5 text-base leading-relaxed text-[#424844] sm:text-lg"><UiText text={"Find inspiring recipes, cooking videos and restaurant reviews for your everyday vegetarian journey."} /></p>

              {/* Search Bar Input Form */}
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <form
                  action="#"
                  className="flex w-full items-center rounded-2xl bg-[#F5F3F0] p-1.5 shadow-sm border border-[#EFEEEB]"
                >
                  <div className="flex items-center pl-3 text-[#727974]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder={ui("Search recipes, foods, restaurants...")}
                    className="w-full bg-transparent px-3 py-2 text-sm text-[#07241A] placeholder-[#727974] focus:outline-none"
                  />
                  <button
                    type="button"
                    className="rounded-xl bg-[#07241A] px-5 py-2.5 text-xs font-semibold tracking-wide text-white transition hover:bg-[#1E3A2F] shrink-0"
                  ><UiText text={"Search"} /></button>
                </form>
              </div>

              {/* Primary CTA Link */}
              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#07241A] px-6 py-3 text-xs font-semibold tracking-wide text-white shadow-md transition hover:bg-[#1E3A2F]"
                >
                  <span><UiText text={"Explore Recipes"} /></span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Right Hero Image Inspiration Card */}
            <div className="lg:col-span-6">
              <div className="relative overflow-hidden rounded-3xl bg-[#EFEEEB] shadow-xl">
                <div className="relative aspect-[16/11] w-full">
                  <Image
                    src="/images/hero_slide.png"
                    alt={ui("Vegetarian culinary inspiration")}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>

                {/* Minimal Loop Indicator Dots */}
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#07241A]/40 px-3 py-1.5 backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-white" />
                  <span className="h-2 w-2 rounded-full bg-white/40" />
                  <span className="h-2 w-2 rounded-full bg-white/40" />
                </div>
              </div>
            </div>
          </div>
        </section></Reveal>

        {/* Community posts from the backend */}
        <Reveal><section id="recipes" className="bg-[#F5F3F0] py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-12"><CommunityFeed compact /></div>
        </section></Reveal>
        {/* 3. POPULAR RESTAURANTS SECTION */}
        <Reveal><section id="restaurants" className="py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            {/* Section Header */}
            <div>
              <h2 className="font-serif text-3xl font-medium tracking-tight text-[#07241A] sm:text-4xl"><UiText text={"Popular Restaurants"} /></h2>
              <p className="mt-2 text-sm text-[#424844]"><UiText text={"Explore vegetarian and vegan places worth discovering."} /></p>
            </div>

            {/* 3 Restaurant Cards Grid */}
            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* Restaurant 1 */}
              <div className="vm-card group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md border border-[#EFEEEB]">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EFEEEB]">
                  <Image
                    src="/images/restaurant_loving_leaf.png"
                    alt="Loving Leaf Vegan"
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-[#1E3A2F] px-3 py-0.5 text-xs font-semibold text-white shadow-sm"><UiText text={"Vegan"} /></span>
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-xl font-semibold text-[#07241A]">
                    Loving Leaf Vegan
                  </h3>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-[#424844]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span><UiText text={"District 1, Ho Chi Minh City"} /></span>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs">
                    <span className="text-[#F59E0B]">★</span>
                    <span className="font-semibold text-[#1B1C1A]">4.9</span>
                    <span className="text-[#727974]"><UiText text={"(98 reviews)"} /></span>
                  </div>
                </div>
              </div>

              {/* Restaurant 2 */}
              <div className="vm-card group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md border border-[#EFEEEB]">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EFEEEB]">
                  <Image
                    src="/images/restaurant_1.png"
                    alt="Om Mani Vegetarian Bistro"
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-[#D9E6DC] px-3 py-0.5 text-xs font-semibold text-[#1E3A2F] shadow-sm"><UiText text={"Vegetarian"} /></span>
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-xl font-semibold text-[#07241A]">
                    Om Mani Vegetarian Bistro
                  </h3>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-[#424844]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span><UiText text={"District 3, Ho Chi Minh City"} /></span>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs">
                    <span className="text-[#F59E0B]">★</span>
                    <span className="font-semibold text-[#1B1C1A]">4.8</span>
                    <span className="text-[#727974]"><UiText text={"(142 reviews)"} /></span>
                  </div>
                </div>
              </div>

              {/* Restaurant 3 */}
              <div className="vm-card group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md border border-[#EFEEEB]">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EFEEEB]">
                  <Image
                    src="/images/restaurant_an_nhien.png"
                    alt="An Nhien Vegetarian House"
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-[#D9E6DC] px-3 py-0.5 text-xs font-semibold text-[#1E3A2F] shadow-sm"><UiText text={"Vegetarian"} /></span>
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-xl font-semibold text-[#07241A]">
                    An Nhien Vegetarian House
                  </h3>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-[#424844]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span><UiText text={"Phu Nhuan, Ho Chi Minh City"} /></span>
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs">
                    <span className="text-[#F59E0B]">★</span>
                    <span className="font-semibold text-[#1B1C1A]">4.7</span>
                    <span className="text-[#727974]"><UiText text={"(215 reviews)"} /></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section></Reveal>

        {/* 4. FINAL CALL TO ACTION CARD */}
        <Reveal><section id="cta" className="mx-auto max-w-7xl px-6 py-12 lg:px-12 lg:pb-20">
          <div className="relative overflow-hidden rounded-3xl bg-[#EFEEEB] px-8 py-14 text-center sm:px-14 lg:py-16 shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D9E6DC] text-[#1E3A2F] mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 1 0 10 10H12V2Z" />
                <path d="M12 12 2.1 12.5" />
                <path d="m16 8 5-5" />
              </svg>
            </div>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-[#07241A] sm:text-4xl max-w-2xl mx-auto"><UiText text={"Start with a dish you already love."} /></h2>
            <p className="mt-3 text-base text-[#424844] max-w-xl mx-auto"><UiText text={"Discover its vegetarian version and explore recipes you can cook."} /></p>
            <div className="mt-8">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-[#07241A] px-8 py-3.5 text-xs font-semibold tracking-wide text-white shadow-md transition hover:bg-[#1E3A2F]"
              >
                <span><UiText text={"Find a Vegetarian Version"} /></span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section></Reveal>
      </main>

      <Footer />
      <VeggieAIWidget />
    </div>
  );
}
