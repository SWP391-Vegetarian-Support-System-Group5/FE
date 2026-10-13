"use client";

import { LanguageSwitch } from "@/components/UiText";
import UiText, { useUiText } from "@/components/UiText";


import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface Member {
  id: string;
  memberNo: string;
  name: string;
  roleTitle?: string;
  email: string;
  joinedDate: string;
  status: "Active" | "Suspended";
  flaggedDate?: string;
  avatar: string;
  stats: {
    posts: number;
    videos: number;
    reviews: number;
    comments: number;
    helpfulRate: number;
    saved: number;
    lastActive: string;
    trend: string;
  };
}

export default function AdminMembersPage() {
  const ui = useUiText();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Suspended">("All");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("2"); // Default selection: Minh Tran
  const [showProfileDrawer, setShowProfileDrawer] = useState(true);

  const members: Member[] = [
    {
      id: "1",
      memberNo: "#1094",
      name: "Linh Nguyen",
      email: "linh@email.com",
      joinedDate: "12 Mar 2026",
      status: "Active",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
      stats: {
        posts: 14,
        videos: 8,
        reviews: 6,
        comments: 42,
        helpfulRate: 98,
        saved: 24,
        lastActive: "10 mins ago",
        trend: "+24% vs prev",
      },
    },
    {
      id: "2",
      memberNo: "#1092",
      name: "Minh Tran",
      roleTitle: "Contributing Cook",
      email: "minh@email.com",
      joinedDate: "10 Mar 2026",
      status: "Active",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
      stats: {
        posts: 7,
        videos: 4,
        reviews: 3,
        comments: 28,
        helpfulRate: 94,
        saved: 12,
        lastActive: "2 hrs ago",
        trend: "+18% vs prev",
      },
    },
    {
      id: "3",
      memberNo: "#1087",
      name: "An Pham",
      email: "an@email.com",
      joinedDate: "08 Mar 2026",
      status: "Active",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
      stats: {
        posts: 5,
        videos: 2,
        reviews: 3,
        comments: 19,
        helpfulRate: 90,
        saved: 8,
        lastActive: "5 hrs ago",
        trend: "+12% vs prev",
      },
    },
    {
      id: "4",
      memberNo: "#1081",
      name: "Thu Le",
      flaggedDate: "05 Mar",
      email: "thu@email.com",
      joinedDate: "03 Mar 2026",
      status: "Suspended",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=160&q=80",
      stats: {
        posts: 2,
        videos: 0,
        reviews: 2,
        comments: 8,
        helpfulRate: 60,
        saved: 3,
        lastActive: "3 days ago",
        trend: "-10% vs prev",
      },
    },
    {
      id: "5",
      memberNo: "#1072",
      name: "Duc Hoang",
      email: "duc@email.com",
      joinedDate: "28 Feb 2026",
      status: "Active",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
      stats: {
        posts: 11,
        videos: 6,
        reviews: 5,
        comments: 35,
        helpfulRate: 96,
        saved: 19,
        lastActive: "1 day ago",
        trend: "+15% vs prev",
      },
    },
    {
      id: "6",
      memberNo: "#1064",
      name: "Mai Huynh",
      email: "mai@email.com",
      joinedDate: "24 Feb 2026",
      status: "Active",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=160&q=80",
      stats: {
        posts: 9,
        videos: 3,
        reviews: 6,
        comments: 26,
        helpfulRate: 92,
        saved: 15,
        lastActive: "4 hrs ago",
        trend: "+8% vs prev",
      },
    },
  ];

  // Filter members
  const filteredMembers = members.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "All" || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const selectedMember = members.find((m) => m.id === selectedMemberId) || members[0];

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

      {/* Directory & Members Title Section */}
      <div className="pt-2">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#727974]">
          <span><UiText text={"DIRECTORY"} /></span>
          <span>•</span>
          <span><UiText text={"COMMUNITY ROSTER"} /></span>
        </div>
        <h1 className="mt-1 font-serif text-3xl lg:text-4xl font-bold tracking-tight text-[#07241A]"><UiText text={"Members"} /></h1>
        <p className="mt-1 text-xs text-[#727974]"><UiText text={"Manage registered VeggieMate community members, monitor flags, and audit contributions."} /></p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search bar */}
        <div className="relative flex-1 min-w-[280px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={ui("Search members by name or email...")}
            className="w-full rounded-2xl border border-[#EFEEEB] bg-[#F5F3F0] py-2.5 pl-10 pr-4 text-xs text-[#07241A] placeholder-[#727974] shadow-sm focus:border-[#1E3A2F] focus:bg-white focus:outline-none transition"
          />
          <svg
            className="absolute left-3.5 top-3 text-[#727974]"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "All" | "Active" | "Suspended")}
            aria-label={ui("Filter members by status")}
            className="appearance-none rounded-2xl border border-[#EFEEEB] bg-white py-2.5 pl-9 pr-9 text-xs font-semibold text-[#07241A] shadow-sm hover:bg-gray-50 focus:outline-none cursor-pointer"
          >
            <option value="All"><UiText text={"Status: All Statuses"} /></option>
            <option value="Active"><UiText text={"Status: Active"} /></option>
            <option value="Suspended"><UiText text={"Status: Suspended"} /></option>
          </select>
          <svg
            className="absolute left-3 top-3 text-[#727974] pointer-events-none"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="21" x2="3" y1="6" y2="6" />
            <line x1="21" x2="7" y1="12" y2="12" />
            <line x1="21" x2="11" y1="18" y2="18" />
          </svg>
          <svg
            className="absolute right-3 top-3.5 text-[#727974] pointer-events-none"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>

        {/* Sort Filter */}
        <button
          type="button"
          className="flex items-center gap-2 rounded-2xl border border-[#EFEEEB] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#07241A] shadow-sm hover:bg-gray-50 transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m7 15 5 5 5-5" />
            <path d="m7 9 5-5 5 5" />
          </svg>
          <span><UiText text={"Joined Date: Newest"} /></span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {/* Download / Export Button */}
        <button
          type="button"
          title={ui("Export Members")}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#EFEEEB] bg-white text-[#07241A] shadow-sm hover:bg-gray-50 transition"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
          </svg>
        </button>
      </div>

      {/* Main Content Grid: Table (Left) + Member Profile Drawer (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Table Section: 7-8 cols depending on profile open */}
        <div className={`transition-all ${showProfileDrawer ? "lg:col-span-8" : "lg:col-span-12"}`}>
          <div className="rounded-2xl border border-[#EFEEEB] bg-white p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#EFEEEB] text-[10px] font-bold uppercase tracking-wider text-[#727974]">
                    <th className="pb-3 font-bold"><UiText text={"MEMBER"} /></th>
                    <th className="pb-3 font-bold"><UiText text={"EMAIL"} /></th>
                    <th className="pb-3 font-bold"><UiText text={"JOINED"} /></th>
                    <th className="pb-3 font-bold"><UiText text={"STATUS"} /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEEEB]/60 text-xs">
                  {filteredMembers.map((member) => {
                    const isSelected = selectedMember.id === member.id && showProfileDrawer;
                    return (
                      <tr
                        key={member.id}
                        onClick={() => {
                          setSelectedMemberId(member.id);
                          setShowProfileDrawer(true);
                        }}
                        className={`group cursor-pointer transition ${
                          isSelected
                            ? "bg-[#F0F5F2] border-l-4 border-l-[#1E3A2F]"
                            : "hover:bg-[#FBF9F6]"
                        }`}
                      >
                        {/* Member Column */}
                        <td className="py-4 pl-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-[#EFEEEB]">
                              <Image
                                src={member.avatar}
                                alt={member.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#07241A] group-hover:text-[#1E3A2F]">
                                  {member.name}
                                </span>
                                {isSelected && (
                                  <span className="rounded bg-[#1E3A2F] px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider"><UiText text={"VIEWING"} /></span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-[#727974] mt-0.5">
                                <span><UiText text={"Member"} />{" "}{member.memberNo}</span>
                                {member.roleTitle && (
                                  <>
                                    <span>•</span>
                                    <span>{member.roleTitle}</span>
                                  </>
                                )}
                                {member.flaggedDate && (
                                  <span className="font-bold text-[#C2410C]"><UiText text={"• Flagged"} />{" "}{member.flaggedDate}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Email Column */}
                        <td className="py-4 pr-4 text-[#424844] font-medium">
                          {member.email}
                        </td>

                        {/* Joined Column */}
                        <td className="py-4 pr-4 text-[#727974]">
                          {member.joinedDate}
                        </td>

                        {/* Status Column */}
                        <td className="py-4 pr-4">
                          {member.status === "Active" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DCFCE7] px-3 py-1 text-[11px] font-bold text-[#15803D]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#15803D]" />
                              <span><UiText text={"Active"} /></span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEE2E2] px-3 py-1 text-[11px] font-bold text-[#C2410C]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#C2410C]" />
                              <span><UiText text={"Suspended"} /></span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between border-t border-[#EFEEEB] pt-4 text-xs text-[#727974]">
              <p><UiText text={"Showing"} />{" "}<span className="font-bold text-[#07241A]">1–10</span>{" "}<UiText text={"of"} />{" "}
                <span className="font-bold text-[#07241A]">1,248</span>{" "}<UiText text={"members"} /></p>
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
                  125
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
        </div>

        {/* Right Section: Member Profile Card Drawer */}
        {showProfileDrawer && (
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-sm space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-3">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#1E3A2F]">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <circle cx="12" cy="10" r="3" />
                    <path d="M7 21v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
                  </svg>
                  <h2 className="font-serif text-base font-bold text-[#07241A]"><UiText text={"Member Profile"} /></h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfileDrawer(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-[#727974] hover:bg-gray-200 transition"
                >
                  ✕
                </button>
              </div>

              {/* Hero Card */}
              <div className="rounded-2xl bg-[#F7F5F1] p-5 text-center">
                <div className="relative mx-auto h-20 w-20">
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-white shadow-sm">
                    <Image
                      src={selectedMember.avatar}
                      alt={selectedMember.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  {/* Verified badge */}
                  <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-[#1E3A2F] text-[10px] text-white border-2 border-white">
                    ✓
                  </span>
                </div>

                <h3 className="mt-3 font-serif text-lg font-bold text-[#07241A]">
                  {selectedMember.name}
                </h3>
                <p className="text-xs text-[#727974]">{selectedMember.email}</p>

                {/* Status pill */}
                <div className="mt-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                      selectedMember.status === "Active"
                        ? "bg-[#DCFCE7] text-[#15803D]"
                        : "bg-[#FEE2E2] text-[#C2410C]"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${selectedMember.status === "Active" ? "bg-[#15803D]" : "bg-[#C2410C]"}`} />
                    <span><UiText text={"Account Status:"} />{" "}{selectedMember.status}</span>
                  </span>
                </div>

                <p className="mt-2 text-[11px] text-[#727974]"><UiText text={"Joined"} />{" "}{selectedMember.joinedDate}
                </p>
              </div>

              {/* Community Activity */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-2.5">
                  <span className="font-bold tracking-wider text-[#727974] uppercase"><UiText text={"COMMUNITY ACTIVITY"} /></span>
                  <span className="text-[#A0A5A1]"><UiText text={"Last active"} />{" "}{selectedMember.stats.lastActive}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  {/* Posts */}
                  <div className="rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] p-2.5">
                    <p className="text-lg font-bold text-[#07241A]">{selectedMember.stats.posts}</p>
                    <p className="text-[11px] font-semibold text-[#727974]"><UiText text={"Posts"} /></p>
                    <p className="text-[9px] text-[#A0A5A1] mt-1 leading-tight">
                      {selectedMember.stats.videos}{" "}<UiText text={"Videos"} /><br />{selectedMember.stats.reviews}{" "}<UiText text={"Reviews"} /></p>
                  </div>

                  {/* Comments */}
                  <div className="rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] p-2.5">
                    <p className="text-lg font-bold text-[#07241A]">{selectedMember.stats.comments}</p>
                    <p className="text-[11px] font-semibold text-[#727974]"><UiText text={"Comments"} /></p>
                    <p className="text-[9px] text-[#A0A5A1] mt-1 leading-tight flex items-center justify-center gap-0.5">
                      <span>👍</span>
                      <span>{selectedMember.stats.helpfulRate}<UiText text={"% Helpful"} /></span>
                    </p>
                  </div>

                  {/* Saved */}
                  <div className="rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] p-2.5">
                    <p className="text-lg font-bold text-[#07241A]">{selectedMember.stats.saved}</p>
                    <p className="text-[11px] font-semibold text-[#727974]"><UiText text={"Saved"} /></p>
                    <p className="text-[9px] text-[#A0A5A1] mt-1 leading-tight"><UiText text={"In Recipe Box"} /></p>
                  </div>
                </div>
              </div>

              {/* 30-Day Contribution Cadence (Area Chart) */}
              <div className="rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] p-3.5">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-[#07241A]"><UiText text={"30-Day Contribution Cadence"} /></span>
                  <span className="font-bold text-[#15803D]">{selectedMember.stats.trend}</span>
                </div>
                {/* SVG Curve Graphic */}
                <div className="h-14 w-full">
                  <svg viewBox="0 0 300 60" className="h-full w-full overflow-visible">
                    <defs>
                      <linearGradient id="cadenceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1E3A2F" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#1E3A2F" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,45 Q50,48 100,40 T200,35 T300,15 L300,60 L0,60 Z"
                      fill="url(#cadenceGradient)"
                    />
                    <path
                      d="M0,45 Q50,48 100,40 T200,35 T300,15"
                      fill="none"
                      stroke="#1E3A2F"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>

              {/* Privacy Guard Notice */}
              <div className="rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] p-3 text-[11px] text-[#727974]">
                <div className="flex items-center gap-1.5 font-bold text-[#07241A] mb-1">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#1E3A2F]">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  </svg>
                  <span><UiText text={"Member Privacy Guarded"} /></span>
                </div>
                <p className="leading-relaxed text-[10px]"><UiText text={"Admin view strictly omits private biometric data and physical addresses."} /></p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A2F] py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#07241A]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span><UiText text={"Send Notification / Email"} /></span>
                </button>

                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFF1EE] py-2.5 text-xs font-semibold text-[#C2410C] transition hover:bg-[#FEE2E2]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" x2="19.07" y1="4.93" y2="19.07" />
                  </svg>
                  <span><UiText text={"Suspend Member"} /></span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
