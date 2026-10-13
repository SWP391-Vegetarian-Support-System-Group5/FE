"use client";

import { LanguageSwitch } from "@/components/UiText";
import UiText, { useUiText } from "@/components/UiText";


import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAdminModeration } from "@/context/AdminModerationContext";

export default function AdminDashboardPage() {
  const ui = useUiText();
  const { user } = useAuth();
  const { flaggedCount, recipesCount, reviewsCount, commentsCount } = useAdminModeration();
  const [searchAdmin, setSearchAdmin] = useState("");

  const recentActivities = [
    {
      id: 1,
      author: "Linh Nguyen",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
      action: "published",
      target: "“Easy Tofu in Tomato Sauce”",
      type: "Recipe",
      typeClass: "bg-[#E8F5E9] text-[#2E7D32]",
      detail: "Vietnamese Comfort Food",
      time: "8 min ago",
    },
    {
      id: 2,
      author: "Minh Tran",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
      action: "added a restaurant review",
      target: "",
      type: "Review",
      typeClass: "bg-[#E0F2F1] text-[#00796B]",
      detail: "An Nhien Garden, District 2",
      time: "21 min ago",
    },
    {
      id: 3,
      author: "An Pham",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
      action: "reported a comment for review",
      target: "",
      type: "Flagged Flag",
      typeClass: "bg-[#FEE2E2] text-[#B91C1C]",
      detail: "Unverified allergen assertion",
      time: "36 min ago",
    },
    {
      id: 4,
      author: "Thu Le",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80",
      action: "joined VeggieMate Community",
      target: "",
      type: "New Member",
      typeClass: "bg-[#F3F4F6] text-[#4B5563]",
      detail: "Hanoi, Vietnam",
      time: "1 hr ago",
    },
  ];

  const recentContents = [
    {
      id: "REC-2026-081",
      title: "Easy Tofu in Tomato Sauce",
      type: "Video & Recipe",
      author: "Linh Nguyen",
      authorInitials: "LN",
      authorBg: "bg-[#E8F5E9] text-[#2E7D32]",
      status: "Published",
      date: "12 Mar 2026",
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=120&q=80",
    },
    {
      id: "REV-2026-039",
      title: "A Calm Vegetarian Dinner in Thủ Đức",
      type: "Restaurant Review",
      author: "Minh Tran",
      authorInitials: "MT",
      authorBg: "bg-[#E0F2F1] text-[#00796B]",
      status: "Published",
      date: "10 Mar 2026",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=120&q=80",
    },
    {
      id: "REC-2026-094",
      title: "Crispy Mushroom Spring Rolls",
      type: "Video & Recipe",
      author: "Anna Le",
      authorInitials: "AL",
      authorBg: "bg-[#F3F4F6] text-[#4B5563]",
      status: "Draft",
      date: "09 Mar 2026",
      image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=120&q=80",
    },
    {
      id: "REC-2026-077",
      title: "Loving Leaf Vegan Masterclass",
      type: "Video & Recipe",
      author: "Bao Pham",
      authorInitials: "BP",
      authorBg: "bg-[#DCFCE7] text-[#15803D]",
      status: "Published",
      date: "07 Mar 2026",
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=120&q=80",
    },
  ];

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
            <span><UiText text={"Admin Area"} /></span>
          </div>
        </div>

        {/* Right Search, Lang & Admin Info */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              value={searchAdmin}
              onChange={(e) => setSearchAdmin(e.target.value)}
              placeholder={ui("Search admin...")}
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

          <LanguageSwitch />

          <div className="flex items-center gap-2 pl-2">
            <div className="text-right">
              <p className="text-xs font-bold text-[#07241A] leading-tight">
                {user?.fullName || "Admin"}
              </p>
              <p className="text-[10px] text-[#727974] leading-tight"><UiText text={"Supervisor"} /></p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A2F] text-xs font-bold text-white shadow-sm">
              AD
            </div>
          </div>
        </div>
      </div>

      {/* Overview & Moderation Title Section */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#2D5A46]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
            <span><UiText text={"OVERVIEW & MODERATION"} /></span>
          </div>
          <h1 className="mt-1 font-serif text-3xl lg:text-4xl font-bold tracking-tight text-[#07241A]"><UiText text={"Administration"} /></h1>
          <p className="mt-1 text-xs text-[#727974]"><UiText text={"Keep the VeggieMate community healthy and organized."} /></p>
        </div>

        {/* Operational Status & Preferences */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-[#EFEEEB] bg-white px-3.5 py-1.5 text-xs text-[#424844] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span><UiText text={"System Operational · Editorial Edition"} /></span>
          </div>

          <button
            type="button"
            className="flex items-center gap-1.5 rounded-xl border border-[#EFEEEB] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#07241A] shadow-sm hover:bg-gray-50 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span><UiText text={"Preferences"} /></span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Members */}
        <div className="rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-[#727974] uppercase"><UiText text={"MEMBERS"} /></span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F5F3F0] text-[#727974]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>
          <p className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#07241A]">1,248</p>
          <p className="mt-1 text-xs text-[#727974]"><UiText text={"Registered members"} /></p>
        </div>

        {/* Card 2: Content */}
        <div className="rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-[#727974] uppercase"><UiText text={"CONTENT"} /></span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F5F3F0] text-[#727974]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
              </svg>
            </div>
          </div>
          <p className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#07241A]">486</p>
          <p className="mt-1 text-xs text-[#727974]"><UiText text={"Published recipes & reviews"} /></p>
        </div>

        {/* Card 3: Needs Review */}
        <div className="rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-[#727974] uppercase"><UiText text={"NEEDS REVIEW"} /></span>
            <span className="flex items-center gap-1 rounded-full bg-[#FFEDD5] px-2 py-0.5 text-[10px] font-bold text-[#C2410C]">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                <line x1="4" x2="4" y1="22" y2="15" />
              </svg>
              <span><UiText text={"Priority"} /></span>
            </span>
          </div>
          <p className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#C2410C]">{flaggedCount}</p>
          <p className="mt-1 text-xs text-[#727974]"><UiText text={"Items needing review"} /></p>
        </div>

        {/* Card 4: Discourse */}
        <div className="rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-[#727974] uppercase"><UiText text={"DISCOURSE"} /></span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F5F3F0] text-[#727974]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
          </div>
          <p className="mt-3 font-serif text-3xl font-bold tracking-tight text-[#07241A]">2,941</p>
          <p className="mt-1 text-xs text-[#727974]"><UiText text={"Total community comments"} /></p>
        </div>
      </div>

      {/* Middle Row: Recent Activity & Moderation Attention */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Recent Activity (Col 7) */}
        <div className="rounded-2xl border border-[#EFEEEB] bg-white p-6 shadow-sm lg:col-span-7">
          <div className="flex items-center justify-between pb-4 border-b border-[#EFEEEB]">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1E3A2F]">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                <path d="M18 14h-8" />
                <path d="M15 18h-5" />
                <path d="M10 6h8v4h-8V6Z" />
              </svg>
              <h2 className="font-bold text-sm text-[#07241A]"><UiText text={"Recent Activity"} /></h2>
            </div>
            <Link href="/admin/content" className="text-xs font-semibold text-[#2D5A46] hover:underline flex items-center gap-1">
              <span><UiText text={"View ledger"} /></span>
              <span>→</span>
            </Link>
          </div>

          <div className="divide-y divide-[#EFEEEB]/60">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex items-start justify-between py-3.5 first:pt-4 last:pb-1">
                <div className="flex items-start gap-3">
                  <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-[#EFEEEB]">
                    <Image
                      src={act.avatar}
                      alt={act.author}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div>
                    <p className="text-xs text-[#07241A]">
                      <span className="font-bold">{act.author}</span>{" "}
                      <span className="text-[#424844]">{act.action}</span>{" "}
                      {act.target && <span className="font-serif italic font-medium">{act.target}</span>}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-[#727974]">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${act.typeClass}`}>
                        {act.type}
                      </span>
                      <span>{act.detail}</span>
                    </div>
                  </div>
                </div>
                <span className="shrink-0 text-[11px] text-[#A0A5A1]">{act.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Moderation Attention (Col 5) */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#EFEEEB] bg-white p-6 shadow-sm lg:col-span-5">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#EFEEEB]">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#C2410C]">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                </svg>
                <h2 className="font-bold text-sm text-[#07241A]"><UiText text={"Moderation Attention"} /></h2>
              </div>
              <span className="rounded-full bg-[#FEE2E2] px-2.5 py-0.5 text-[11px] font-bold text-[#C2410C]">
                {flaggedCount}{" "}<UiText text={"Pending"} /></span>
            </div>

            {/* Alert Banner */}
            <div className="mt-4 rounded-xl border border-[#FFDDD2] bg-[#FFF6F3] p-4">
              <div className="flex items-start gap-2.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[#C2410C] mt-0.5">
                  <path d="M12 3v3" />
                  <path d="m18.36 5.64-2.12 2.12" />
                  <path d="M21 12h-3" />
                  <path d="m18.36 18.36-2.12-2.12" />
                  <path d="M12 21v-3" />
                  <path d="m5.64 18.36 2.12-2.12" />
                  <path d="M3 12h3" />
                  <path d="m5.64 5.64 2.12 2.12" />
                </svg>
                <div>
                  <h3 className="text-xs font-bold text-[#9A3412]">{flaggedCount}{" "}<UiText text={"items need review"} /></h3>
                  <p className="mt-1 text-[11px] text-[#9A3412]/80 leading-relaxed"><UiText text={"VeggieAI has flagged content for administrator review to protect ingredient authenticity and respectful dialogue."} /></p>
                </div>
              </div>
            </div>

            {/* Pending Decision Queue */}
            <div className="mt-4">
              <p className="text-[10px] font-bold tracking-wider text-[#727974] uppercase mb-2"><UiText text={"PENDING DECISION QUEUE"} /></p>
              <div className="space-y-2">
                <Link
                  href="/admin/flagged"
                  className="flex w-full items-center justify-between rounded-xl bg-[#FBF9F6] p-3 text-xs font-semibold text-[#07241A] transition hover:bg-[#F2EFE9]"
                >
                  <div className="flex items-center gap-2.5">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#727974]">
                      <path d="M18 2v8a4 4 0 0 1-4 4H4" />
                      <path d="m6 16 6-6" />
                      <path d="M2 14v8" />
                    </svg>
                    <span><UiText text={"Community Recipes"} /></span>
                  </div>
                  <div className="flex items-center gap-1 text-[#727974]">
                    <span className="font-bold text-[#07241A]">{recipesCount}</span>
                    <span>›</span>
                  </div>
                </Link>

                <Link
                  href="/admin/flagged"
                  className="flex w-full items-center justify-between rounded-xl bg-[#FBF9F6] p-3 text-xs font-semibold text-[#07241A] transition hover:bg-[#F2EFE9]"
                >
                  <div className="flex items-center gap-2.5">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#727974]">
                      <path d="M3 21h18" />
                      <path d="M5 21V7l8-4v18" />
                      <path d="M19 21V11l-6-3" />
                    </svg>
                    <span><UiText text={"Restaurant Reviews"} /></span>
                  </div>
                  <div className="flex items-center gap-1 text-[#727974]">
                    <span className="font-bold text-[#07241A]">{reviewsCount}</span>
                    <span>›</span>
                  </div>
                </Link>

                <Link
                  href="/admin/flagged"
                  className="flex w-full items-center justify-between rounded-xl bg-[#FBF9F6] p-3 text-xs font-semibold text-[#07241A] transition hover:bg-[#F2EFE9]"
                >
                  <div className="flex items-center gap-2.5">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#727974]">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span><UiText text={"Comments & Discussions"} /></span>
                  </div>
                  <div className="flex items-center gap-1 text-[#727974]">
                    <span className="font-bold text-[#07241A]">{commentsCount}</span>
                    <span>›</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Link
            href="/admin/flagged"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A2F] py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#07241A]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            </svg>
            <span><UiText text={"Review Flagged Content"} /></span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">{flaggedCount}{" "}<UiText text={"items"} /></span>
          </Link>
        </div>
      </div>

      {/* Bottom Section: Recent Content Table */}
      <div className="rounded-2xl border border-[#EFEEEB] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between pb-5">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#07241A]"><UiText text={"Recent Content"} /></h2>
            <p className="text-xs text-[#727974]"><UiText text={"Submissions awaiting audit, curation, or seasonal promotion."} /></p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-xl border border-[#EFEEEB] bg-white px-3 py-1.5 text-xs font-semibold text-[#07241A] shadow-sm hover:bg-gray-50"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="21" x2="3" y1="6" y2="6" />
                <line x1="21" x2="7" y1="12" y2="12" />
                <line x1="21" x2="11" y1="18" y2="18" />
              </svg>
              <span><UiText text={"All Formats"} /></span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-xl border border-[#EFEEEB] bg-white px-3 py-1.5 text-xs font-semibold text-[#07241A] shadow-sm hover:bg-gray-50"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              <span><UiText text={"Export Log"} /></span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#EFEEEB] text-[10px] font-bold uppercase tracking-wider text-[#727974]">
                <th className="pb-3 font-bold"><UiText text={"TITLE"} /></th>
                <th className="pb-3 font-bold"><UiText text={"TYPE"} /></th>
                <th className="pb-3 font-bold"><UiText text={"AUTHOR"} /></th>
                <th className="pb-3 font-bold"><UiText text={"STATUS"} /></th>
                <th className="pb-3 font-bold"><UiText text={"DATE"} /></th>
                <th className="pb-3 text-right font-bold"><UiText text={"ACTIONS"} /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFEEEB]/60 text-xs">
              {recentContents.map((item) => (
                <tr key={item.id} className="group hover:bg-[#FBF9F6]/80 transition">
                  {/* Title & Thumbnail */}
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[#EFEEEB]">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div>
                        <p className="font-bold text-[#07241A] group-hover:text-[#1E3A2F] transition">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-[#A0A5A1]">ID: {item.id}</p>
                      </div>
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-3.5 pr-4 text-[#424844]">
                    <div className="flex items-center gap-1.5">
                      {item.type.includes("Video") ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 21h18" />
                          <path d="M5 21V7l8-4v18" />
                          <path d="M19 21V11l-6-3" />
                        </svg>
                      )}
                      <span>{item.type}</span>
                    </div>
                  </td>

                  {/* Author */}
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${item.authorBg}`}>
                        {item.authorInitials}
                      </div>
                      <span className="font-semibold text-[#07241A]">{item.author}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 pr-4">
                    {item.status === "Published" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[11px] font-bold text-[#15803D]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#15803D]" />
                        <span><UiText text={"Published"} /></span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-[11px] font-bold text-[#4B5563]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#9CA3AF]" />
                        <span><UiText text={"Draft"} /></span>
                      </span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="py-3.5 pr-4 text-[#727974]">{item.date}</td>

                  {/* Action */}
                  <td className="py-3.5 text-right">
                    <button
                      type="button"
                      className="rounded-lg border border-[#EFEEEB] bg-white px-3 py-1 text-xs font-semibold text-[#07241A] shadow-sm hover:bg-[#F5F3F0] transition"
                    ><UiText text={"View"} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between border-t border-[#EFEEEB] pt-4 text-xs text-[#727974]">
          <p><UiText text={"Displaying 4 of 486 registered community entries"} /></p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#EFEEEB] text-[#727974] hover:bg-gray-50"
            >
              ‹
            </button>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1E3A2F] font-bold text-white shadow-sm"
            >
              1
            </button>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#07241A] hover:bg-gray-100"
            >
              2
            </button>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#07241A] hover:bg-gray-100"
            >
              3
            </button>
            <span className="px-1 text-[#A0A5A1]">..</span>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#07241A] hover:bg-gray-100"
            >
              41
            </button>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#EFEEEB] text-[#727974] hover:bg-gray-50"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Footer Banner */}
      <div className="flex items-center justify-between rounded-2xl border border-[#EFEEEB] bg-[#F5F3F0] p-4 text-xs text-[#424844]">
        <div className="flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#2D5A46] shrink-0">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
          <span className="italic"><UiText text={"“A mindful culinary collective flourishes when seasonal nourishment meets gracious hospitality.” — Editorial Guidelines, Autumn 2026"} /></span>
        </div>
        <button type="button" className="font-bold text-[#07241A] hover:underline shrink-0"><UiText text={"Read Handbook"} /></button>
      </div>
    </div>
  );
}
