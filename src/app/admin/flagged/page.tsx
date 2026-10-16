"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAdminModeration } from "@/context/AdminModerationContext";

type FilterTab = "All" | "Content" | "Comments";

export default function AdminFlaggedPage() {
  const { user } = useAuth();
  const {
    flaggedCount,
    contentCount,
    commentsCount,
    items,
    dismissFlag,
    removeContent,
    resetAll,
  } = useAdminModeration();

  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleDismiss = (id: string, title: string) => {
    dismissFlag(id);
    setFeedback(`Đã giữ lại nội dung & bỏ cắm cờ cho: "${title}"`);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleRemove = (id: string, title: string) => {
    removeContent(id);
    setFeedback(`Đã xóa nội dung vi phạm: "${title}"`);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Filter items by tab & search query
  const filteredItems = items.filter((item) => {
    const matchTab =
      activeTab === "All" ||
      (activeTab === "Content" && (item.category === "Recipe & Video" || item.category === "Post")) ||
      (activeTab === "Comments" && item.category === "Comment");

    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.flagReason.toLowerCase().includes(searchQuery.toLowerCase());

    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Bar Header */}
      <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-4">
        {/* Breadcrumb: VeggieMate / Admin Area */}
        <div className="flex items-center gap-2">
          <Link href="/" className="font-serif text-xl font-bold tracking-tight text-[#07241A] hover:opacity-80">
            VeggieMate
          </Link>
          <span className="text-[#A0A5A1]">/</span>
          <div className="flex items-center gap-1.5 rounded-full border border-[#EFEEEB] bg-white px-2.5 py-1 text-xs font-medium text-[#424844] shadow-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1E3A2F]">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            </svg>
            <span>Admin Area</span>
          </div>
        </div>

        {/* Right Search, Lang & Admin Info */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search admin..."
              className="w-60 rounded-full border border-[#EFEEEB] bg-white py-1.5 pl-8 pr-4 text-xs text-[#07241A] placeholder-[#A0A5A1] shadow-sm focus:border-[#1E3A2F] focus:outline-none"
            />
            <svg
              className="absolute left-2.5 top-2 text-[#727974]"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>

          <button
            type="button"
            className="flex items-center gap-1 rounded-xl border border-[#EFEEEB] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#07241A] shadow-sm hover:bg-gray-50"
          >
            <span>EN</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          <div className="flex items-center gap-2 pl-2">
            <div className="text-right">
              <p className="text-xs font-bold text-[#07241A] leading-tight">
                {user?.fullName || "Admin"}
              </p>
              <p className="text-[10px] text-[#727974] leading-tight">Supervisor</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A2F] text-xs font-bold text-white shadow-sm">
              AD
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Feedback Notification */}
      {feedback && (
        <div className="flex items-center justify-between rounded-xl bg-[#1E3A2F] px-4 py-3 text-xs text-white shadow-md transition-all">
          <div className="flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{feedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-white/70 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Overview & Moderation Title Section */}
      <div className="flex items-start justify-between pt-2">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#727974]">
            <span>EDITORIAL MODERATION</span>
            <span>/</span>
            <span className="rounded-full bg-[#FEE2E2] px-2.5 py-0.5 text-[10px] font-bold text-[#C2410C]">
              {flaggedCount} {flaggedCount === 1 ? "Pending Review" : "Pending Reviews"}
            </span>
          </div>
          <h1 className="mt-1 font-serif text-3xl lg:text-4xl font-bold tracking-tight text-[#07241A]">
            AI Flagged Content
          </h1>
          <p className="mt-1 text-xs text-[#727974] max-w-xl">
            Review content flagged by VeggieAI before moderation. Administrator makes the final decision.
          </p>
        </div>

        {/* Calm Guardian Active Card */}
        <div className="flex items-center gap-3 rounded-2xl border border-[#FFDDD2] bg-[#FFF6F3] p-3 px-4 shadow-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FEE2E2] text-[#C2410C]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-[#9A3412]">Calm Guardian Active</p>
            <p className="text-[10px] text-[#9A3412]/80">Non-intrusive safety stream</p>
          </div>
        </div>
      </div>

      {/* Community Care Note Banner */}
      <div className="flex items-center justify-between rounded-2xl border border-[#EFEEEB] bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9] text-[#2E7D32]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-[#07241A]">Community Care Note</p>
            <p className="text-[11px] text-[#727974] leading-relaxed">
              VeggieAI identifies potential issues such as misleading ingredient claims or reported text. Content remains online until reviewed.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-xs text-[#727974] pl-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>Average decision time: 4m</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Tabs: All (X), Content (Y), Comments (Z) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("All")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "All"
                ? "bg-[#1E3A2F] text-white shadow-sm"
                : "bg-white border border-[#EFEEEB] text-[#424844] hover:bg-gray-50"
            }`}
          >
            All ({flaggedCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("Content")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "Content"
                ? "bg-[#1E3A2F] text-white shadow-sm"
                : "bg-white border border-[#EFEEEB] text-[#424844] hover:bg-gray-50"
            }`}
          >
            Content ({contentCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("Comments")}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "Comments"
                ? "bg-[#1E3A2F] text-white shadow-sm"
                : "bg-white border border-[#EFEEEB] text-[#424844] hover:bg-gray-50"
            }`}
          >
            Comments ({commentsCount})
          </button>
        </div>

        {/* Right Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search flagged content, authors, or reasons..."
              className="w-72 rounded-xl border border-[#EFEEEB] bg-[#F5F3F0] py-2 pl-9 pr-4 text-xs text-[#07241A] placeholder-[#727974] shadow-sm focus:border-[#1E3A2F] focus:bg-white focus:outline-none transition"
            />
            <svg
              className="absolute left-3 top-2.5 text-[#727974]"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>

          <button
            type="button"
            className="flex items-center gap-1.5 rounded-xl border border-[#EFEEEB] bg-white px-3.5 py-2 text-xs font-semibold text-[#07241A] shadow-sm hover:bg-gray-50"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="21" x2="3" y1="6" y2="6" />
              <line x1="21" x2="7" y1="12" y2="12" />
              <line x1="21" x2="11" y1="18" y2="18" />
            </svg>
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Flagged Content Cards List */}
      <div className="space-y-5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-[#EFEEEB] bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
              {/* Left Column: Visual Preview (Thumbnail or Comment Box) */}
              <div className="md:col-span-4">
                {item.category === "Comment" ? (
                  // Quote Box for Comments
                  <div className="flex h-full min-h-[170px] flex-col justify-between rounded-2xl bg-[#F5F3F0] p-4 border border-[#EFEEEB]">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-serif text-2xl font-bold text-[#C2410C] leading-none">
                          “
                        </span>
                        <span className="rounded bg-white px-2 py-0.5 text-[10px] font-bold text-[#727974] border border-[#EFEEEB]">
                          Comment
                        </span>
                      </div>
                      <p className="text-xs italic text-[#07241A] leading-relaxed">
                        {item.commentQuote}
                      </p>
                    </div>
                    <p className="text-[10px] text-[#727974] mt-3">
                      {item.commentThread}
                    </p>
                  </div>
                ) : (
                  // Image Thumbnail for Recipes & Reviews
                  <div className="relative h-44 w-full overflow-hidden rounded-2xl border border-[#EFEEEB]">
                    <Image
                      src={item.image || ""}
                      alt={item.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    {/* Top overlay category tag */}
                    <div className="absolute left-3 top-3 rounded-lg bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                      {item.category}
                    </div>

                    {/* Bottom overlay: Video duration or Location */}
                    {item.videoDuration && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-lg bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        <span>{item.videoDuration}</span>
                      </div>
                    )}
                    {item.location && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-lg bg-black/70 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{item.location}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column: Flag Reason & Details */}
              <div className="flex flex-col justify-between md:col-span-8">
                <div>
                  {/* Category Meta & Flag Type Badge */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-[#727974] text-[11px] font-medium">
                      <span className="uppercase tracking-wider">
                        {item.category === "Comment" ? "FLAGGED ITEM — COMMENT" : `FLAGGED CONTENT — ${item.category.toUpperCase()}`}
                      </span>
                      <span>•</span>
                      <span>⏱ Flagged {item.flagTime}</span>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${item.flagTypeColor}`}>
                      ⚑ {item.flagTypeTag}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="mt-1 font-serif text-xl font-bold tracking-tight text-[#07241A]">
                    {item.title}
                  </h2>

                  {/* Author Row */}
                  <div className="mt-2 flex items-center gap-2 text-xs text-[#727974]">
                    {item.authorAvatar ? (
                      <div className="relative h-5 w-5 overflow-hidden rounded-full border border-[#EFEEEB]">
                        <Image
                          src={item.authorAvatar}
                          alt={item.authorName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1E3A2F] text-[10px] font-bold text-white">
                        {item.authorInitials || "U"}
                      </div>
                    )}
                    <span>
                      {item.category === "Comment" ? "Posted by" : "Submitted by"}{" "}
                      <strong className="text-[#07241A]">{item.authorName}</strong> ({item.authorBadge})
                    </span>
                  </div>

                  {/* Flag Reason Highlight Box */}
                  <div className="mt-3.5 rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] p-4 text-xs">
                    <div className="flex items-start gap-2 text-[#C2410C] font-bold mb-1">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="mt-0.5 shrink-0">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      <span>Flag Reason</span>
                    </div>
                    <p className="text-xs text-[#424844] leading-relaxed">
                      {item.flagReason}
                    </p>

                    {/* Sub Details */}
                    {(item.flagSubBadge || item.flagSubText) && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] pt-2 border-t border-[#EFEEEB]">
                        {item.flagSubBadge && (
                          <span className="rounded bg-white px-2 py-0.5 font-bold text-[#07241A] border border-[#EFEEEB]">
                            {item.flagSubBadge}
                          </span>
                        )}
                        {item.flagSubText && (
                          <span className="text-[#727974]">{item.flagSubText}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Bottom Bar */}
                <div className="mt-4 flex flex-wrap items-center justify-start gap-2 pt-1">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-xl border border-[#EFEEEB] bg-white px-4 py-2 text-xs font-semibold text-[#07241A] shadow-sm hover:bg-[#F5F3F0] transition"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>{item.category === "Comment" ? "View Full Context" : "View Content"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDismiss(item.id, item.title)}
                    className="flex items-center gap-1.5 rounded-xl border border-[#EFEEEB] bg-white px-4 py-2 text-xs font-semibold text-[#07241A] shadow-sm hover:bg-emerald-50 hover:text-emerald-700 transition"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Keep (Dismiss Flag)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemove(item.id, item.title)}
                    className="flex items-center gap-1.5 rounded-xl bg-[#FFF1EE] px-4 py-2 text-xs font-semibold text-[#C2410C] shadow-sm hover:bg-[#FEE2E2] transition"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                    <span>Remove Content</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#EFEEEB] bg-white py-14 px-6 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E8F5E9] text-[#2E7D32] mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="font-serif text-lg font-bold text-[#07241A]">Không có nội dung cắm cờ đang chờ duyệt</h3>
            <p className="mt-1 text-xs text-[#727974] max-w-md">
              Tất cả các cảnh báo hoặc báo cáo từ cộng đồng trong mục này đã được xử lý. Hệ thống VeggieAI đang tiếp tục giám sát theo thời gian thực.
            </p>
            {flaggedCount === 0 && (
              <button
                type="button"
                onClick={resetAll}
                className="mt-4 rounded-xl border border-[#1E3A2F] bg-[#1E3A2F] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#07241A] transition"
              >
                Khôi phục lại dữ liệu mẫu (12 nội dung)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-[#EFEEEB] pt-4 text-xs text-[#727974]">
        <p>
          Displaying <span className="font-bold text-[#07241A]">{filteredItems.length}</span> of{" "}
          <span className="font-bold text-[#07241A]">{flaggedCount}</span> flagged items awaiting administrator review
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-[#EFEEEB] bg-white px-3 py-1.5 text-xs font-medium text-[#727974] hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1E3A2F] text-xs font-bold text-white shadow-sm"
          >
            1
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-xs text-[#07241A] hover:bg-gray-100"
          >
            2
          </button>
          <button
            type="button"
            className="rounded-lg border border-[#EFEEEB] bg-white px-3 py-1.5 text-xs font-medium text-[#07241A] hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
