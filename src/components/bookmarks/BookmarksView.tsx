"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export interface BookmarkItem {
  id: string;
  type: "recipe" | "review";
  badge: string;
  duration?: string;
  rating?: { score: number; count: number };
  categoryPrep: string;
  title: string;
  description: string;
  author: {
    name: string;
    avatar?: string;
  };
  image: string;
  isBookmarked: boolean;
}

const INITIAL_BOOKMARKS: BookmarkItem[] = [
  {
    id: "bm-1",
    type: "recipe",
    badge: "Video Recipe",
    duration: "05:42",
    categoryPrep: "Plant-forward Traditional · 15 min prep",
    title: "Easy Tofu in Tomato Sauce",
    description:
      "Tender braised tofu bathes in sun-ripened tomatoes, seasoned with vegetarian nuoc mam and fragrant scallion aromatics.",
    author: {
      name: "Minh Tran",
    },
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    isBookmarked: true,
  },
  {
    id: "bm-2",
    type: "recipe",
    badge: "Video Recipe",
    duration: "06:15",
    categoryPrep: "Central Vietnam Heritage · Broth & Aromatics",
    title: "Bún Bò Chay (Spicy Hue Vegetarian Broth)",
    description:
      "Simmered pineapple, lemongrass stalks, and annatto oil craft an intoxicatingly aromatic Hue vegan broth served with thick rice noodles.",
    author: {
      name: "Lan Nguyen",
    },
    image:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80",
    isBookmarked: true,
  },
  {
    id: "bm-3",
    type: "review",
    badge: "Restaurant Review",
    rating: { score: 4.9, count: 142 },
    categoryPrep: "📍 Ben Nghe, District 1, HCMC",
    title: "Loving Leaf Vegan Bistro",
    description:
      "A tranquil oasis hidden down an alleyway. Exceptional mushroom claypots and ceremonial-grade iced lotus tea under green ivy canopies.",
    author: {
      name: "Anna Le",
    },
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    isBookmarked: true,
  },
  {
    id: "bm-4",
    type: "recipe",
    badge: "Video Recipe",
    duration: "04:52",
    categoryPrep: "Crispy Appetizers · Air fryer friendly",
    title: "Crispy Mushroom Spring Rolls with Herbs",
    description:
      "Double-wrapped with artisanal rice paper for an auditory crunch, stuffed with trio mushroom medley, glass vermicelli, and wood-ear aromatics.",
    author: {
      name: "Minh Tran",
    },
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    isBookmarked: true,
  },
  {
    id: "bm-5",
    type: "review",
    badge: "Restaurant Review",
    rating: { score: 4.8, count: 88 },
    categoryPrep: "📍 District 3, HCMC",
    title: "Green Garden Vegetarian",
    description:
      "A serene retreat away from the city hustle. Their lotus leaf fried rice and pandan silken tofu are unparalleled comforting classics.",
    author: {
      name: "Minh Tran",
    },
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    isBookmarked: true,
  },
  {
    id: "bm-6",
    type: "recipe",
    badge: "Video Recipe",
    duration: "08:20",
    categoryPrep: "Comfort Homestyle · Claypot Cooking",
    title: "Claypot Braised Tofu & Eggplant",
    description:
      "Silky purple eggplant slow-braised with fried tofu until tender in a caramelized soy glaze with black pepper and fresh red chilies.",
    author: {
      name: "Bao Pham",
    },
    image:
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    isBookmarked: true,
  },
];

export default function BookmarksView() {
  const [items, setItems] = useState<BookmarkItem[]>(INITIAL_BOOKMARKS);
  const [activeTab, setActiveTab] = useState<"all" | "recipe" | "review">("all");
  const [sortBy, setSortBy] = useState<"recent" | "rating" | "prep">("recent");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleToggleBookmark = (id: string, title: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextState = !item.isBookmarked;
          showToast(
            nextState
              ? `Đã lưu lại "${title}" vào bộ sưu tập.`
              : `Đã xóa "${title}" khỏi danh sách đã lưu.`
          );
          return { ...item, isBookmarked: nextState };
        }
        return item;
      })
    );
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (activeTab === "recipe") return item.type === "recipe";
    if (activeTab === "review") return item.type === "review";
    return true;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "rating") {
      const rateA = a.rating?.score || 0;
      const rateB = b.rating?.score || 0;
      return rateB - rateA;
    }
    if (sortBy === "prep") {
      return a.title.localeCompare(b.title);
    }
    return 0; // Default recent
  });

  const totalBookmarked = items.filter((i) => i.isBookmarked).length;
  const recipeCount = items.filter((i) => i.type === "recipe" && i.isBookmarked).length;
  const reviewCount = items.filter((i) => i.type === "review" && i.isBookmarked).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#07241A] px-5 py-3 text-xs font-semibold text-white shadow-xl transition-all animate-fade-in flex items-center gap-2">
          <span>🔖</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-[#EFEEEB] pb-6">
        <div>
          {/* Breadcrumb / Tag */}
          <div className="flex items-center gap-2 text-xs font-semibold text-[#727974]">
            <span className="h-2 w-2 rounded-full bg-[#99462A]" />
            <span>Personal Sanctuary</span>
            <span>/</span>
            <span className="rounded-full bg-[#EFEEEB] px-2.5 py-0.5 text-[11px] font-bold text-[#07241A]">
              Saved Content · {totalBookmarked} items
            </span>
          </div>

          {/* Heading */}
          <h1 className="mt-2.5 font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#07241A]">
            My Collection
          </h1>
          <p className="mt-1.5 text-sm text-[#424844]">
            Your bookmarked recipes and restaurant reviews in one place.
          </p>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label className="text-xs font-medium text-[#727974] flex items-center gap-1.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="6" x2="16" y2="6" />
              <line x1="4" y1="12" x2="11" y2="12" />
              <line x1="4" y1="18" x2="8" y2="18" />
              <polyline points="15 15 18 18 21 15" />
              <line x1="18" y1="9" x2="18" y2="18" />
            </svg>
            <span>Sort:</span>
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-[#EFEEEB] bg-[#F5F3F0] px-3 py-1.5 text-xs font-semibold text-[#07241A] outline-none transition hover:bg-white focus:border-[#1E3A2F]"
          >
            <option value="recent">Recently Bookmarked</option>
            <option value="rating">Highest Rated</option>
            <option value="prep">Title Alphabetical</option>
          </select>
        </div>
      </div>

      {/* ── Filter Tabs & Helper Note ───────────────────────────────────── */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition cursor-pointer ${
              activeTab === "all"
                ? "bg-[#07241A] text-white shadow-xs"
                : "bg-white text-[#424844] border border-[#EFEEEB] hover:bg-[#F5F3F0]"
            }`}
          >
            All ({items.filter((i) => i.isBookmarked).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("recipe")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition cursor-pointer ${
              activeTab === "recipe"
                ? "bg-[#07241A] text-white shadow-xs"
                : "bg-white text-[#424844] border border-[#EFEEEB] hover:bg-[#F5F3F0]"
            }`}
          >
            Video &amp; Recipes ({recipeCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("review")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition cursor-pointer ${
              activeTab === "review"
                ? "bg-[#07241A] text-white shadow-xs"
                : "bg-white text-[#424844] border border-[#EFEEEB] hover:bg-[#F5F3F0]"
            }`}
          >
            Restaurant Reviews ({reviewCount})
          </button>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#727974]">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[#99462A]"
          >
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <span>Tap bookmark flag on any card to remove from personal box</span>
        </div>
      </div>

      {/* ── Cards Grid ──────────────────────────────────────────────────── */}
      {sortedItems.length === 0 ? (
        <div className="my-16 rounded-3xl bg-white border border-[#EFEEEB] p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F3F0] text-2xl">
            🔖
          </div>
          <h3 className="mt-4 font-serif text-xl font-bold text-[#07241A]">
            Chưa có mục nào được lưu
          </h3>
          <p className="mt-1 text-xs text-[#727974] max-w-sm mx-auto">
            Khám phá các công thức nấu ăn thuần chay hoặc nhà hàng yêu thích và nhấn lưu lại để đưa vào bộ sưu tập cá nhân.
          </p>
          <Link
            href="/explore"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#07241A] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#1E3A2F]"
          >
            Khám phá công thức ngay
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              className={`group flex flex-col overflow-hidden rounded-3xl bg-white border border-[#EFEEEB] shadow-xs transition duration-200 hover:-translate-y-1 hover:shadow-md ${
                !item.isBookmarked ? "opacity-60" : ""
              }`}
            >
              {/* Card Image & Badges */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EFEEEB]">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized
                />

                {/* Top Overlay Badge */}
                <div className="absolute left-3.5 top-3.5">
                  <span className="rounded-full bg-[#07241A]/80 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white shadow-xs">
                    {item.badge}
                  </span>
                </div>

                {/* Bookmark Toggle Button */}
                <button
                  type="button"
                  onClick={() => handleToggleBookmark(item.id, item.title)}
                  title={item.isBookmarked ? "Bỏ lưu bookmark" : "Lưu bookmark"}
                  className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm transition hover:scale-110 cursor-pointer"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill={item.isBookmarked ? "#99462A" : "none"}
                    stroke={item.isBookmarked ? "#99462A" : "#07241A"}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </button>

                {/* Bottom Video Duration / Rating */}
                {item.duration && (
                  <div className="absolute bottom-3 left-3.5 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-medium text-white">
                    <span>▶</span>
                    <span>{item.duration}</span>
                  </div>
                )}

                {item.rating && (
                  <div className="absolute bottom-3 left-3.5 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    <span className="text-amber-300">★</span>
                    <span>{item.rating.score}</span>
                    <span className="text-white/70">({item.rating.count})</span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col justify-between p-5 space-y-3">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#727974]">
                    {item.categoryPrep}
                  </p>
                  <h3 className="font-serif text-lg font-bold text-[#07241A] line-clamp-1 group-hover:text-[#1E3A2F] transition">
                    {item.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-[#424844] line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {/* Card Footer: Author & Bookmark Status */}
                <div className="flex items-center justify-between border-t border-[#EFEEEB] pt-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E3A2F] text-[10px] font-bold text-white">
                      {item.author.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-medium text-[#07241A]">
                      {item.author.name}
                    </span>
                  </div>

                  <span
                    className={`flex items-center gap-1 font-semibold text-[11px] ${
                      item.isBookmarked ? "text-[#99462A]" : "text-[#727974]"
                    }`}
                  >
                    <span>🔖</span>
                    <span>{item.isBookmarked ? "Bookmarked" : "Removed"}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Stats Bar ───────────────────────────────────────────────────── */}
      <div className="mt-12 rounded-3xl bg-white border border-[#EFEEEB] p-6 shadow-xs">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#EFEEEB]">
          {/* Stat 1 */}
          <div className="px-2">
            <span className="text-xs font-semibold text-[#727974]">
              Saved Recipes
            </span>
            <p className="mt-1 font-serif text-2xl font-bold text-[#07241A]">
              {recipeCount} items
            </p>
          </div>

          {/* Stat 2 */}
          <div className="px-2 pt-4 sm:pt-0 sm:pl-6">
            <span className="text-xs font-semibold text-[#727974]">
              Bookmarked Places
            </span>
            <p className="mt-1 font-serif text-2xl font-bold text-[#07241A]">
              {reviewCount} bistros
            </p>
          </div>

          {/* Stat 3 */}
          <div className="px-2 pt-4 sm:pt-0 sm:pl-6">
            <span className="text-xs font-semibold text-[#727974]">
              Primary Cuisine
            </span>
            <p className="mt-1 font-serif text-2xl font-bold text-[#99462A]">
              Vietnamese Chay
            </p>
          </div>

          {/* Stat 4 */}
          <div className="px-2 pt-4 sm:pt-0 sm:pl-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#727974]">
                Pantry Readiness
              </span>
              <span className="text-xs font-bold text-[#07241A]">75%</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#EFEEEB]">
              <div className="h-full w-3/4 rounded-full bg-[#07241A]" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Meal Planner Promo Card ─────────────────────────────────────── */}
      <div className="mt-8 relative overflow-hidden rounded-3xl bg-[#E8F1EC] p-7 sm:p-10 border border-[#D9E6DC] shadow-xs">
        {/* Subtle decorative circles */}
        <div className="pointer-events-none absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-[#D4E4DA]/60" />
        <div className="pointer-events-none absolute top-0 right-1/4 h-32 w-32 rounded-full bg-[#D4E4DA]/30" />

        <div className="relative max-w-2xl space-y-4">
          {/* Tag */}
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#07241A] text-white">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </div>
            <span className="rounded-full bg-[#D9E6DC] px-3 py-1 text-xs font-bold text-[#07241A]">
              VeggieAI Meal Assistant
            </span>
          </div>

          {/* Heading */}
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#07241A] leading-snug">
            Your saved recipes can help VeggieMate build your weekly meal plan.
          </h2>

          <p className="text-xs sm:text-sm leading-relaxed text-[#424844]">
            VeggieAI automatically selects from your favorite bookmarked dishes and seasonal pantry ingredients to generate a balanced 7-day vegetarian menu.
          </p>

          {/* Action button */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
            <Link
              href="/meal-planner"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#07241A] px-6 py-3 text-xs sm:text-sm font-semibold tracking-wide text-white shadow-md transition hover:bg-[#1E3A2F]"
            >
              <span>Plan My Week</span>
              <span>→</span>
            </Link>

            <span className="text-xs text-[#727974] flex items-center gap-1.5">
              <span>⏱</span>
              <span>Takes ~30 seconds · Synchronized with your pantry stock</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
