"use client";

import Link from "next/link";
import UiText, { useUiText } from "@/components/UiText";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VeggieAIWidget from "@/components/VeggieAIWidget";
import PopularRecipes from "@/components/PopularRecipes";
import PopularRestaurants from "@/components/PopularRestaurants";
import Reveal from "@/components/ui/Reveal";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import HeroRecipeCarousel from "@/components/HeroRecipeCarousel";

export default function HomePage() {
  const { t } = useLanguage();
  const ui = useUiText();
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role?.toLowerCase() === "admin";

  useEffect(() => {
    if (!loading && isAdmin) router.replace("/admin");
  }, [isAdmin, loading, router]);

  if (isAdmin) {
    return <div className="flex min-h-screen items-center justify-center bg-[#FBF9F6] text-sm text-[#59635C]"><UiText text="Đang chuyển đến khu vực quản trị..." /></div>;
  }

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
                <span><UiText text={"Lối sống chay"} /></span>
              </div>

              {/* Main Heading */}
              <h1 className="mt-5 font-serif text-4xl font-medium tracking-tight text-[#07241A] sm:text-5xl lg:text-[56px] lg:leading-[64px]"><UiText text={"Khám phá cuộc sống"} />{" "}<br /><UiText text={"chay tốt đẹp hơn"} /></h1>

              {/* Subtitle */}
              <p className="mt-5 text-base leading-relaxed text-[#424844] sm:text-lg"><UiText text={"Tìm công thức, video nấu ăn và đánh giá nhà hàng cho hành trình ăn chay mỗi ngày."} /></p>

              {/* Search Bar Input Form */}
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <form
                  action="/community"
                  className="flex w-full items-center rounded-2xl bg-[#F5F3F0] p-1.5 shadow-sm border border-[#EFEEEB]"
                >
                  <div className="flex items-center pl-3 text-[#727974]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  </div>
                  <input
                    name="q" type="text"
                    placeholder={ui("Search recipes, foods, restaurants...")}
                    className="w-full bg-transparent px-3 py-2 text-sm text-[#07241A] placeholder-[#727974] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[#07241A] px-5 py-2.5 text-xs font-semibold tracking-wide text-white transition hover:bg-[#1E3A2F] shrink-0"
                  ><UiText text={"Tìm kiếm"} /></button>
                </form>
              </div>

              {/* Primary CTA Link */}
              <div className="mt-6">
                <Link
                  href="/community"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#07241A] px-6 py-3 text-xs font-semibold tracking-wide text-white shadow-md transition hover:bg-[#1E3A2F]"
                >
                  <span><UiText text={"Khám phá công thức"} /></span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Right Hero Image Inspiration Card */}
            <div className="lg:col-span-6">
              <HeroRecipeCarousel />
            </div>
          </div>
        </section></Reveal>

        {/* 2. POPULAR RECIPES SECTION */}
        <Reveal><section id="recipes" className="bg-[#F5F3F0] py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            {/* Section Header */}
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="font-serif text-3xl font-medium tracking-tight text-[#07241A] sm:text-4xl">
                  {t("Popular Recipes", "Công thức phổ biến")}
                </h2>
                <p className="mt-2 text-sm text-[#424844]">
                  {t("Discover recipes the community loves.", "Khám phá công thức được cộng đồng yêu thích.")}
                </p>
              </div>
              <Link
                href="/community"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#99462A] hover:underline"
              >
                <span>{t("View All Recipes", "Xem tất cả công thức")}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>

            <PopularRecipes />
          </div>
        </section></Reveal>

        {/* 3. POPULAR RESTAURANTS SECTION */}
        {user && <PopularRestaurants />}

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
            <h2 className="font-serif text-3xl font-medium tracking-tight text-[#07241A] sm:text-4xl max-w-2xl mx-auto"><UiText text={"Bắt đầu với món ăn bạn yêu thích."} /></h2>
            <p className="mt-3 text-base text-[#424844] max-w-xl mx-auto"><UiText text={"Tìm phiên bản chay và khám phá công thức bạn có thể tự nấu."} /></p>
            <div className="mt-8">
              <Link
                href="/community"
                className="inline-flex items-center gap-2 rounded-xl bg-[#07241A] px-8 py-3.5 text-xs font-semibold tracking-wide text-white shadow-md transition hover:bg-[#1E3A2F]"
              >
                <span><UiText text={"Tìm phiên bản chay"} /></span>
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
