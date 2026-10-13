"use client";

import UiText, { useUiText } from "@/components/UiText";


import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getStoredToken } from "@/lib/auth";
import { getMediaUrl } from "@/lib/api";
import { communityError, getBookmarks, removeBookmark, type PostResponse } from "@/lib/post-api";
import Link from "next/link";
import Image from "next/image";

export interface BookmarkItem {
  id: string;
  type: "recipe" | "review";
  badge: string;
  duration?: string;
  rating?: { score: number };
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

function toBookmarkItem(post: PostResponse): BookmarkItem {
  return {
    id: String(post.postId), type: post.postType === "RECIPE" || post.postType === "VIDEO" ? "recipe" : "review",
    badge: post.postType, rating: { score: post.averageRating }, categoryPrep: post.categoryName || "",
    title: post.title, description: post.content, author: { name: post.authorName },
    image: getMediaUrl(post.thumbnailUrl), isBookmarked: true,
  };
}
export default function BookmarksView() {
  const ui = useUiText();
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "recipe" | "review">("all");
  const [sortBy, setSortBy] = useState<"recent" | "rating" | "prep">("recent");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const locks = useRef(new Set<string>());
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    if (authLoading) return;
    const controller = new AbortController();
    setItems([]); setError(""); setLoading(true);
    if (!user || !getStoredToken()) {
      setError("Bạn cần đăng nhập để xem bài đã lưu."); setLoading(false);
      return () => controller.abort();
    }
    getBookmarks(controller.signal).then(posts => {
      if (!controller.signal.aborted) setItems(posts.map(toBookmarkItem));
    }).catch(e => { if (!controller.signal.aborted) setError(communityError(e)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [user, authLoading, revision]);

  const handleToggleBookmark = async (id: string, title: string) => {
    if (locks.current.has(id)) return;
    locks.current.add(id); setPendingIds(ids => [...ids, id]); setError(""); setToastMessage(null);
    try {
      await removeBookmark(Number(id));
      setToastMessage(`Đã bỏ lưu "${title}".`);
      setRevision(n => n + 1);
    } catch (e) { setError(communityError(e)); }
    finally { locks.current.delete(id); setPendingIds(ids => ids.filter(value => value !== id)); }
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
            <span><UiText text={"Personal Sanctuary"} /></span>
            <span>/</span>
            <span className="rounded-full bg-[#EFEEEB] px-2.5 py-0.5 text-[11px] font-bold text-[#07241A]"><UiText text={"Saved Content ·"} />{" "}{totalBookmarked}{" "}<UiText text={"items"} /></span>
          </div>

          {/* Heading */}
          <h1 className="mt-2.5 font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#07241A]"><UiText text={"My Collection"} /></h1>
          <p className="mt-1.5 text-sm text-[#424844]"><UiText text={"Your bookmarked community posts in one place."} /></p>
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
            <span><UiText text={"Sort:"} /></span>
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-[#EFEEEB] bg-[#F5F3F0] px-3 py-1.5 text-xs font-semibold text-[#07241A] outline-none transition hover:bg-white focus:border-[#1E3A2F]"
          >
            <option value="recent"><UiText text={"Recently Bookmarked"} /></option>
            <option value="rating"><UiText text={"Highest Rated"} /></option>
            <option value="prep"><UiText text={"Title Alphabetical"} /></option>
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
          ><UiText text={"All ("} />{items.filter((i) => i.isBookmarked).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("recipe")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition cursor-pointer ${
              activeTab === "recipe"
                ? "bg-[#07241A] text-white shadow-xs"
                : "bg-white text-[#424844] border border-[#EFEEEB] hover:bg-[#F5F3F0]"
            }`}
          ><UiText text={"Video & Recipes ("} />{recipeCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("review")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition cursor-pointer ${
              activeTab === "review"
                ? "bg-[#07241A] text-white shadow-xs"
                : "bg-white text-[#424844] border border-[#EFEEEB] hover:bg-[#F5F3F0]"
            }`}
          ><UiText text={"Blog & Questions ("} />{reviewCount})
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
          <span><UiText text={"Tap bookmark flag on any card to remove from personal box"} /></span>
        </div>
      </div>

      {/* ── Cards Grid ──────────────────────────────────────────────────── */}
      {loading ? <p role="status" className="py-12 text-center text-sm">Đang tải bài đã lưu…</p> : error ? <div role="alert" className="my-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error} <Link href="/login" className="underline">Đăng nhập</Link><button className="ml-4 underline" onClick={() => setRevision(n => n + 1)}>Thử lại</button></div> : sortedItems.length === 0 ? (
        <div className="my-16 rounded-3xl bg-white border border-[#EFEEEB] p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F3F0] text-2xl">
            🔖
          </div>
          <h3 className="mt-4 font-serif text-xl font-bold text-[#07241A]"><UiText text={"Chưa có mục nào được lưu"} /></h3>
          <p className="mt-1 text-xs text-[#727974] max-w-sm mx-auto"><UiText text={"Khám phá các công thức nấu ăn thuần chay hoặc nhà hàng yêu thích và nhấn lưu lại để đưa vào bộ sưu tập cá nhân."} /></p>
          <Link
            href="/explore"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#07241A] px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#1E3A2F]"
          ><UiText text={"Khám phá công thức ngay"} /></Link>
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
                {item.image && <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized
                />}

                {/* Top Overlay Badge */}
                <div className="absolute left-3.5 top-3.5">
                  <span className="rounded-full bg-[#07241A]/80 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white shadow-xs">
                    {item.badge}
                  </span>
                </div>

                {/* Bookmark Toggle Button */}
                <button
                  type="button"
                  disabled={pendingIds.includes(item.id)}
                  onClick={() => handleToggleBookmark(item.id, item.title)}
                  title={item.isBookmarked ? ui("Bỏ lưu bookmark") : ui("Lưu bookmark")}
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
                    <span>{item.rating.score.toFixed(1)} / 5</span>

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
                    <Link href={`/view-detail/post-${item.id}`}>{item.title}</Link>
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
                    <span>{item.isBookmarked ? ui("Bookmarked") : ui("Removed")}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
            <span className="rounded-full bg-[#D9E6DC] px-3 py-1 text-xs font-bold text-[#07241A]"><UiText text={"VeggieAI Meal Assistant"} /></span>
          </div>

          {/* Heading */}
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#07241A] leading-snug"><UiText text={"Your saved recipes can help VeggieMate build your weekly meal plan."} /></h2>

          <p className="text-xs sm:text-sm leading-relaxed text-[#424844]"><UiText text={"VeggieAI automatically selects from your favorite bookmarked dishes and seasonal pantry ingredients to generate a balanced 7-day vegetarian menu."} /></p>

          {/* Action button */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4">
            <Link
              href="/meal-planner"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#07241A] px-6 py-3 text-xs sm:text-sm font-semibold tracking-wide text-white shadow-md transition hover:bg-[#1E3A2F]"
            >
              <span><UiText text={"Plan My Week"} /></span>
              <span>→</span>
            </Link>

            <span className="text-xs text-[#727974] flex items-center gap-1.5">
              <span>⏱</span>
              <span><UiText text={"Takes ~30 seconds · Synchronized with your pantry stock"} /></span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
