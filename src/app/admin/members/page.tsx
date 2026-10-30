"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { apiFetch, apiGet } from "@/lib/api";

interface AdminUser {
  userId: number;
  email: string;
  role: string;
  fullName: string;
  isActive: boolean;
  isEmailVerified?: boolean | null;
  createdAt?: string;
}

interface AdminUserActivity {
  userId: number;
  posts: number;
  videos: number;
  comments: number;
  saved: number;
  recipes: number;
  ratings: number;
  lastActivityAt: string | null;
  dailyContributions: number[];
}

const PAGE_SIZE = 10;

function formatJoinedDate(member: AdminUser, locale: string): string {
  if (member.createdAt) {
    const d = new Date(member.createdAt);
    if (!Number.isNaN(d.getTime())) {
      return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(d);
    }
  }
  return "—";
}

// Avatar color palette for user initials
const AVATAR_PALETTES = [
  { bg: "bg-[#E8F5E9]", text: "text-[#1E3A2F]" },
  { bg: "bg-[#FEF3C7]", text: "text-[#92400E]" },
  { bg: "bg-[#E0E7FF]", text: "text-[#3730A3]" },
  { bg: "bg-[#FCE7F3]", text: "text-[#9D174D]" },
  { bg: "bg-[#CCFBF1]", text: "text-[#115E59]" },
  { bg: "bg-[#F3E8FF]", text: "text-[#6B21A8]" },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdminMembersPage() {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const [members, setMembers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "suspended">("all");
  const [sortNewest, setSortNewest] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activity, setActivity] = useState<AdminUserActivity | null>(null);
  const [activityError, setActivityError] = useState(false);
  const [showProfile, setShowProfile] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Email / notification modal state
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifySubject, setNotifySubject] = useState("");
  const [notifyMessage, setNotifyMessage] = useState("");
  const [sendingNotify, setSendingNotify] = useState(false);
  const [notifySuccessMsg, setNotifySuccessMsg] = useState("");

  useEffect(() => {
    if (user?.role?.toLowerCase() !== "admin") return;
    const controller = new AbortController();
    apiGet<AdminUser[]>("/api/admin/users", { signal: controller.signal })
      .then((data) => {
        setMembers(data);
        setError("");
        if (data.length > 0) setSelectedId(current => current ?? data[0].userId);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("load");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [user?.role]);

  useEffect(() => {
    if (user?.role?.toLowerCase() !== "admin" || selectedId === null) return;
    const controller = new AbortController();
    apiGet<AdminUserActivity>(`/api/admin/users/${selectedId}/activity`, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) { setActivity(data); setActivityError(false); } })
      .catch(() => { if (!controller.signal.aborted) setActivityError(true); });
    return () => controller.abort();
  }, [user?.role, selectedId]);

  const filtered = useMemo(() => {
    return members
      .filter((member) => {
        const text = search.trim().toLowerCase();
        const matchesSearch =
          !text ||
          member.fullName.toLowerCase().includes(text) ||
          member.email.toLowerCase().includes(text) ||
          String(member.userId).includes(text);
        const matchesStatus =
          status === "all" ||
          (status === "active" && member.isActive) ||
          (status === "suspended" && !member.isActive);
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => (sortNewest ? b.userId - a.userId : a.userId - b.userId));
  }, [members, search, status, sortNewest]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Selected member object
  const selected = members.find((member) => member.userId === selectedId) || null;

  // Header metric counts
  const totalCount = members.length;
  const activeCount = members.filter((m) => m.isActive).length;
  const suspendedCount = members.filter((m) => !m.isActive).length;

  async function updateStatus(member: AdminUser) {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const response = await apiFetch(`/api/admin/users/${member.userId}/status`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !member.isActive }),
      });
      if (!response.ok) throw new Error(String(response.status));
      setMembers((current) =>
        current.map((item) =>
          item.userId === member.userId ? { ...item, isActive: !member.isActive } : item
        )
      );
      setSuccess(true);
    } catch {
      setError("save");
    } finally {
      setSaving(false);
    }
  }

  // Export filtered list to CSV
  function handleExportCsv() {
    if (filtered.length === 0) return;
    const csvHeaders = ["ID", "Full Name", "Email", "Role", "Status", "Joined Date"];
    const csvRows = filtered.map((m) => [
      m.userId,
      `"${m.fullName.replace(/"/g, '""')}"`,
      `"${m.email.replace(/"/g, '""')}"`,
      m.role,
      m.isActive ? "Active" : "Suspended",
      `"${formatJoinedDate(m, locale)}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [csvHeaders.join(","), ...csvRows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `veggiemate_members_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Send email / notification handler
  async function handleSendNotification(event: React.FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setSendingNotify(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setSendingNotify(false);
    setShowNotifyModal(false);
    setNotifySubject("");
    setNotifyMessage("");
    setNotifySuccessMsg(
      t(
        `Notification sent to ${selected.fullName} (${selected.email})`,
        `Đã gửi thông báo đến ${selected.fullName} (${selected.email})`
      )
    );
    setTimeout(() => setNotifySuccessMsg(""), 5000);
  }

  // Generate pagination items with ellipses
  const paginationRange = useMemo(() => {
    const range: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else {
      if (currentPage <= 3) {
        range.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        range.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        range.push(1, "...", currentPage, "...", totalPages);
      }
    }
    return range;
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <header className="flex flex-col gap-4 border-b border-[#EFEEEB] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 font-serif text-xl font-bold tracking-tight text-[#07241A]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1E3A2F] text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12A10 10 0 0 1 12 2Z" />
                <path d="M7 14c2-4 5-6 10-6" />
                <path d="M12 8c0 4 2 6 5 6" />
              </svg>
            </span>
            <span>VeggieMate</span>
          </Link>
          <span className="text-sm text-[#A0A5A1]">/</span>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#EFEEEB] bg-white px-3 py-1 text-xs font-semibold text-[#424844] shadow-2xs">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2D5A46" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>{t("Admin Area", "Khu vực quản trị")}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Search Admin input */}
          <div className="relative">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8F948F" strokeWidth="2" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              placeholder={t("Search admin...", "Tìm kiếm quản trị...")}
              aria-label={t("Search admin", "Tìm kiếm quản trị")}
              className="w-44 rounded-full border border-[#EFEEEB] bg-white pl-9 pr-3 py-1.5 text-xs text-[#07241A] placeholder-[#8F948F] focus:border-[#1E3A2F] focus:outline-none sm:w-56"
            />
          </div>

          {/* Language Indicator */}
          <div className="inline-flex items-center gap-1 rounded-full border border-[#EFEEEB] bg-white px-2.5 py-1 text-xs font-medium text-[#424844]">
            <span>{locale.startsWith("vi") ? "VI" : "EN"}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

          {/* Supervisor Profile */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#1E3A2F] text-xs font-bold text-white shadow-xs">
              {user?.fullName ? getInitials(user.fullName) : "AD"}
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white bg-emerald-500" />
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-bold leading-tight text-[#07241A]">
                {user?.fullName || t("Admin", "Quản trị viên")}
              </p>
              <p className="text-[10px] text-[#727974]">{t("Supervisor", "Quản trị viên")}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Page Title & Stats Summary Row */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#727974]">
            {t("DIRECTORY • COMMUNITY ROSTER", "DANH MỤC • DANH SÁCH CỘNG ĐỒNG")}
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#07241A] lg:text-4xl">
            {t("Members", "Thành viên")}
          </h1>
          <p className="mt-1 text-xs text-[#727974]">
            {t(
              "Manage registered VeggieMate members and community contributors.",
              "Quản lý thành viên đã đăng ký và người đóng góp cộng đồng VeggieMate."
            )}
          </p>
        </div>

        {/* Metric Badges Pill */}
        <div className="inline-flex flex-wrap items-center gap-3 rounded-full border border-[#EFEEEB] bg-white px-4 py-2 text-xs font-semibold text-[#424844] shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-gray-400" />
            <span>
              {t("Total", "Tổng")}: {totalCount.toLocaleString(locale)}
            </span>
          </div>
          <span className="text-[#EFEEEB]">|</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
            <span>
              {t("Active", "Hoạt động")}: {activeCount.toLocaleString(locale)}
            </span>
          </div>
          <span className="text-[#EFEEEB]">|</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#DC2626]" />
            <span>
              {t("Suspended", "Đình chỉ")}: {suspendedCount.toLocaleString(locale)}
            </span>
          </div>
        </div>
      </div>

      {/* Search, Filter & Action Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative min-w-[260px] flex-1">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#727974"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={t("Search members by name or email...", "Tìm thành viên theo tên hoặc email...")}
            aria-label={t("Search members", "Tìm thành viên")}
            className="w-full rounded-2xl border border-[#EFEEEB] bg-[#F7F5F0]/80 py-2.5 pl-11 pr-4 text-xs text-[#07241A] placeholder-[#8F948F] transition focus:border-[#1E3A2F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
          />
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as typeof status);
              setPage(1);
            }}
            aria-label={t("Filter members by status", "Lọc thành viên theo trạng thái")}
            className="cursor-pointer appearance-none rounded-2xl border border-[#EFEEEB] bg-white py-2.5 pl-9 pr-8 text-xs font-semibold text-[#07241A] shadow-2xs transition hover:bg-[#FAF9F6] focus:border-[#1E3A2F] focus:outline-none"
          >
            <option value="all">{t("Status: All Statuses", "Trạng thái: Mọi trạng thái")}</option>
            <option value="active">{t("Status: Active", "Trạng thái: Đang hoạt động")}</option>
            <option value="suspended">{t("Status: Suspended", "Trạng thái: Đã đình chỉ")}</option>
          </select>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#727974"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#727974"
            strokeWidth="2.5"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Sort Date Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setSortNewest((val) => !val)}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#EFEEEB] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#07241A] shadow-2xs transition hover:bg-[#FAF9F6]"
            aria-label={t("Sort members by joined date", "Sắp xếp theo ngày tham gia")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#727974" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 16 4 4 4-4" />
              <path d="M7 20V4" />
              <path d="m21 8-4-4-4 4" />
              <path d="M17 4v16" />
            </svg>
            <span>
              {sortNewest
                ? t("Joined Date: Newest", "Ngày tham gia: Mới nhất")
                : t("Joined Date: Oldest", "Ngày tham gia: Cũ nhất")}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#727974" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        {/* Export CSV Button */}
        <button
          type="button"
          onClick={handleExportCsv}
          title={t("Export members", "Xuất danh sách thành viên")}
          aria-label={t("Export members", "Xuất danh sách thành viên")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#EFEEEB] bg-white text-[#07241A] shadow-2xs transition hover:bg-[#FAF9F6] hover:text-[#1E3A2F]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>

      {/* Alerts & Notifications */}
      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-[#C2410C]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            {error === "save"
              ? t("Could not update member status. Please try again.", "Không thể cập nhật trạng thái. Vui lòng thử lại.")
              : t("Could not load members.", "Không thể tải thành viên.")}
          </span>
        </div>
      )}

      {success && (
        <div role="status" className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-[#15803D]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{t("Member status updated.", "Đã cập nhật trạng thái thành viên.")}</span>
        </div>
      )}

      {notifySuccessMsg && (
        <div role="status" className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-[#15803D]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{notifySuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Left Table & Right Profile Panel */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Table Section */}
        <section className={showProfile && selected ? "lg:col-span-8" : "lg:col-span-12"}>
          <div className="overflow-hidden rounded-3xl border border-[#EFEEEB] bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EFEEEB] bg-transparent text-[11px] font-bold uppercase tracking-wider text-[#727974]">
                    <th className="py-4 pl-6 pr-4">{t("MEMBER", "THÀNH VIÊN")}</th>
                    <th className="py-4 px-4">{t("EMAIL", "EMAIL")}</th>
                    <th className="py-4 px-4">{t("JOINED", "NGÀY THAM GIA")}</th>
                    <th className="py-4 pl-4 pr-6">{t("STATUS", "TRẠNG THÁI")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEEEB]/70">
                  {visible.map((member) => {
                    const isSelected = selectedId === member.userId && showProfile;
                    const palette = AVATAR_PALETTES[member.userId % AVATAR_PALETTES.length];
                    const joinedFormatted = formatJoinedDate(member, locale);

                    return (
                      <tr
                        key={member.userId}
                        onClick={() => {
                          setSelectedId(member.userId);
                          setShowProfile(true);
                          setSuccess(false);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedId(member.userId);
                            setShowProfile(true);
                          }
                        }}
                        tabIndex={0}
                        aria-label={t(`View ${member.fullName}`, `Xem ${member.fullName}`)}
                        className={`group relative cursor-pointer transition ${
                          isSelected
                            ? "bg-[#F0F7F4]"
                            : "hover:bg-[#FAF9F6] focus:bg-[#FAF9F6]"
                        }`}
                      >
                        {/* Member Column with Avatar & Subtitle */}
                        <td className="relative py-4 pl-6 pr-4">
                          {/* Active Indicator Bar on the left */}
                          {isSelected && (
                            <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-[#1E3A2F]" />
                          )}

                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold shadow-2xs ${palette.bg} ${palette.text}`}>
                                {getInitials(member.fullName)}
                              </div>
                            </div>

                            {/* Name & Roles */}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#07241A]">
                                  {member.fullName}
                                </span>
                                {isSelected && (
                                  <span className="inline-flex items-center gap-1 rounded bg-[#1E3A2F] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                      <circle cx="12" cy="12" r="3" />
                                    </svg>
                                    <span>{t("VIEWING", "ĐANG XEM")}</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#727974]">
                                {t("Member", "Thành viên")} #{member.userId}
                              </p>
                              {!member.isActive ? (
                                <p className="text-[11px] font-medium text-[#C2410C]">
                                  {t("• Flagged", "• Đã gắn cờ")}
                                </p>
                              ) : member.role?.toLowerCase() === "admin" ? (
                                <p className="text-[11px] font-medium text-[#1E3A2F]">
                                  {t("• Admin", "• Quản trị")}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        {/* Email Column */}
                        <td className="py-4 px-4 text-[#424844]">
                          {member.email}
                        </td>

                        {/* Joined Date Column */}
                        <td className="py-4 px-4 text-[#424844]">
                          {joinedFormatted}
                        </td>

                        {/* Status Column */}
                        <td className="py-4 pl-4 pr-6">
                          {member.isActive ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-[#EAF7EE] px-3 py-1 text-[11px] font-bold text-[#166534]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                              <span>{t("Active", "Đang hoạt động")}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200/60 bg-[#FEECEC] px-3 py-1 text-[11px] font-bold text-[#991B1B]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />
                              <span>{t("Suspended", "Đã đình chỉ")}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {loading && (
                <div className="flex items-center justify-center gap-2 py-12 text-xs text-[#727974]">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#1E3A2F] border-t-transparent" />
                  <span>{t("Loading members...", "Đang tải thành viên...")}</span>
                </div>
              )}

              {!loading && !error && visible.length === 0 && (
                <div className="py-12 text-center text-xs text-[#727974]">
                  {t("No members found.", "Không tìm thấy thành viên.")}
                </div>
              )}
            </div>

            {/* Table Footer: Pagination */}
            <div className="flex flex-col gap-3 border-t border-[#EFEEEB] px-6 py-4 text-xs text-[#727974] sm:flex-row sm:items-center sm:justify-between">
              <p>
                {t("Showing", "Hiển thị")}{" "}
                <span className="font-semibold text-[#07241A]">
                  {filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–
                  {Math.min(currentPage * PAGE_SIZE, filtered.length)}
                </span>{" "}
                {t("of", "trong")}{" "}
                <span className="font-semibold text-[#07241A]">
                  {filtered.length.toLocaleString(locale)}
                </span>{" "}
                {t("members", "thành viên")}
              </p>

              <div className="flex items-center gap-1.5">
                {/* Prev Button */}
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label={t("Previous page", "Trang trước")}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#EFEEEB] text-[#07241A] transition hover:bg-[#FAF9F6] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ‹
                </button>

                {/* Page numbers */}
                {paginationRange.map((pageItem, index) => {
                  if (typeof pageItem === "string") {
                    return (
                      <span key={`ellipsis-${index}`} className="px-1 text-[#A0A5A1]">
                        ...
                      </span>
                    );
                  }
                  const isCurrent = pageItem === currentPage;
                  return (
                    <button
                      key={pageItem}
                      type="button"
                      onClick={() => setPage(pageItem)}
                      aria-label={`${t("Page", "Trang")} ${pageItem}`}
                      className={`flex h-7 min-w-7 items-center justify-center rounded-lg text-xs font-semibold transition ${
                        isCurrent
                          ? "bg-[#1E3A2F] text-white shadow-2xs"
                          : "text-[#424844] hover:bg-[#FAF9F6]"
                      }`}
                    >
                      {pageItem}
                    </button>
                  );
                })}

                {/* Next Button */}
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label={t("Next page", "Trang sau")}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#EFEEEB] text-[#07241A] transition hover:bg-[#FAF9F6] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Right Detail Panel: Member Profile */}
        {showProfile && selected && (
          <aside className="lg:col-span-4">
            <div className="space-y-4 rounded-3xl border border-[#EFEEEB] bg-white p-5 shadow-2xs">
              {/* Profile Card Header */}
              <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#EAF7EE] text-[#1E3A2F]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M7 7h10" />
                      <path d="M7 12h10" />
                      <path d="M7 17h6" />
                    </svg>
                  </span>
                  <h2 className="font-serif text-base font-bold text-[#07241A]">
                    {t("Member Profile", "Hồ sơ thành viên")}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowProfile(false)}
                  aria-label={t("Close profile", "Đóng hồ sơ")}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F4F2EE] text-xs font-bold text-[#727974] transition hover:bg-[#EBE7DF] hover:text-[#07241A]"
                >
                  ✕
                </button>
              </div>

              {/* Profile Hero Box */}
              {(() => {
                const palette = AVATAR_PALETTES[selected.userId % AVATAR_PALETTES.length];
                const memberActivity = activity?.userId === selected.userId ? activity : null;

                return (
                  <>
                    <div className="relative rounded-2xl border border-[#E7EFEA] bg-[#F2F6F4] p-5 text-center">
                      {/* Avatar with Verified checkmark */}
                      <div className="relative mx-auto h-20 w-20">
                        <div className={`flex h-20 w-20 items-center justify-center rounded-full border-2 border-white text-xl font-bold shadow-sm ${palette.bg} ${palette.text}`}>
                          {getInitials(selected.fullName)}
                        </div>
                        {/* Verified Badge */}
                        {selected.isEmailVerified && <span
                          title={t("Verified member", "Thành viên đã xác minh")}
                          className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#16A34A] text-white shadow-xs"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>}
                      </div>

                      <h3 className="mt-3 font-serif text-lg font-bold text-[#07241A]">
                        {selected.fullName}
                      </h3>
                      <p className="break-all text-xs text-[#727974]">{selected.email}</p>

                      <div className="mt-2.5">
                        {selected.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-[#DCFCE7] px-3 py-1 text-[11px] font-semibold text-[#15803D]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                            <span>{t("Account Status: Active", "Trạng thái: Đang hoạt động")}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200/80 bg-[#FEE2E2] px-3 py-1 text-[11px] font-semibold text-[#C2410C]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />
                            <span>{t("Account Status: Suspended", "Trạng thái: Đã đình chỉ")}</span>
                          </span>
                        )}
                      </div>

                      <p className="mt-1.5 text-[11px] text-[#727974]">
                        {t("Joined", "Tham gia")} {formatJoinedDate(selected, locale)}
                      </p>
                    </div>

                    {/* Community Activity Section */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#727974]">
                          {t("COMMUNITY ACTIVITY", "HOẠT ĐỘNG CỘNG ĐỒNG")}
                        </span>
                        <span className="text-[10px] text-[#A0A5A1]">
                          {memberActivity?.lastActivityAt ? `${t("Last contribution", "Đóng góp gần nhất")}: ${new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(memberActivity.lastActivityAt))}` : activityError ? "Không tải được hoạt động" : "Chưa có hoạt động"}
                        </span>
                      </div>

                      {/* 3 Metric Cards */}
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {/* Posts Card */}
                        <div className="rounded-xl border border-[#EFEEEB] bg-[#FAF9F6] p-2.5 text-center">
                          <p className="font-serif text-lg font-bold leading-none text-[#07241A]">
                            {memberActivity?.posts ?? "—"}
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-[#424844]">
                            {t("Posts", "Bài viết")}
                          </p>
                          <p className="mt-1 text-[10px] text-[#727974]">
                            {memberActivity?.videos ?? "—"} {t("Videos", "Video")}
                          </p>
                          <p className="text-[10px] text-[#727974]">
                            {memberActivity?.recipes ?? "—"} {t("Recipes", "Công thức")}
                          </p>
                        </div>

                        {/* Comments Card */}
                        <div className="rounded-xl border border-[#EFEEEB] bg-[#FAF9F6] p-2.5 text-center">
                          <p className="font-serif text-lg font-bold leading-none text-[#07241A]">
                            {memberActivity?.comments ?? "—"}
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-[#424844]">
                            {t("Comments", "Bình luận")}
                          </p>
                          <div className="mt-1 flex items-center justify-center gap-1 text-[10px] text-[#727974]">
                            <span>
                              {memberActivity?.ratings ?? "—"} đánh giá đã gửi
                            </span>
                          </div>
                        </div>

                        {/* Saved Card */}
                        <div className="rounded-xl border border-[#EFEEEB] bg-[#FAF9F6] p-2.5 text-center">
                          <p className="font-serif text-lg font-bold leading-none text-[#07241A]">
                            {memberActivity?.saved ?? "—"}
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-[#424844]">
                            {t("Saved", "Đã lưu")}
                          </p>
                          <p className="mt-1 text-[10px] text-[#727974]">
                            {memberActivity?.recipes ?? "—"} {t("Recipes", "Công thức")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 30-Day Contribution Cadence Area Chart */}
                    <div className="rounded-2xl border border-[#EFEEEB] bg-[#FAF9F6] p-3.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#07241A]">
                          {t("30-Day Contribution Cadence", "Tần suất đóng góp 30 ngày")}
                        </span>
                        <span className="font-semibold text-emerald-600">{memberActivity?.dailyContributions.reduce((total, count) => total + count, 0) ?? "—"} đóng góp</span>
                      </div>

                      <div className="mt-2 flex h-14 items-end gap-1" aria-label="Số bài viết và bình luận mỗi ngày trong 30 ngày">
                        {memberActivity?.dailyContributions.map((count, index) => <div key={index} title={`${count} đóng góp`} className="min-w-0 flex-1 rounded-t bg-[#2D5A46]" style={{ height: `${Math.max(4, count / Math.max(1, ...memberActivity.dailyContributions) * 100)}%` }} />) ?? <p className="text-xs text-[#727974]">Đang tải dữ liệu hoạt động...</p>}
                      </div>
                    </div>

                    {/* Privacy Guard Notice */}
                    <div className="flex items-start gap-2.5 rounded-2xl border border-[#EFEEEB] bg-[#FBF9F6] p-3 text-[11px] text-[#727974]">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#2D5A46"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mt-0.5 shrink-0"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      <div>
                        <p className="text-xs font-bold text-[#07241A]">
                          {t("Member Privacy Guarded", "Bảo vệ quyền riêng tư thành viên")}
                        </p>
                        <p className="mt-0.5 leading-relaxed text-[#727974]">
                          {t(
                            "Admin view strictly omits private biometric data and physical addresses.",
                            "Chế độ quản trị viên loại bỏ nghiêm ngặt dữ liệu sinh trắc học và địa chỉ cá nhân."
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-1">
                      {/* Send Notification / Email Button */}
                      <button
                        type="button"
                        onClick={() => setShowNotifyModal(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A2F] py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#152820]"
                      >
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
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                        <span>{t("Send Notification / Email", "Gửi thông báo / Email")}</span>
                      </button>

                      {/* Suspend / Reactivate Button */}
                      <button
                        type="button"
                        disabled={saving || selected.userId === user?.userId}
                        onClick={() => void updateStatus(selected)}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          selected.isActive
                            ? "border border-red-200 bg-[#FFF1EE] text-[#C2410C] hover:bg-[#FEE2E2]"
                            : "border border-emerald-200 bg-[#EAF7EE] text-[#166534] hover:bg-[#DCFCE7]"
                        }`}
                      >
                        {selected.isActive ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="4.93" x2="19.07" y1="4.93" y2="19.07" />
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        <span>
                          {saving
                            ? t("Updating...", "Đang cập nhật...")
                            : selected.isActive
                            ? t("Suspend Member", "Đình chỉ thành viên")
                            : t("Reactivate Member", "Kích hoạt lại thành viên")}
                        </span>
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </aside>
        )}
      </div>

      {/* Send Notification / Email Modal */}
      {showNotifyModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-[#EFEEEB] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[#07241A]">
                  {t("Send Notification / Email", "Gửi thông báo / Email")}
                </h3>
                <p className="text-xs text-[#727974]">
                  {t("Recipient", "Người nhận")}: {selected.fullName} ({selected.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNotifyModal(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F4F2EE] text-xs font-bold text-[#727974] hover:bg-[#EBE7DF]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#07241A]">
                  {t("Subject", "Tiêu đề")}
                </label>
                <input
                  required
                  value={notifySubject}
                  onChange={(e) => setNotifySubject(e.target.value)}
                  placeholder={t("e.g. Account update or Community Guidelines", "Ví dụ: Cập nhật tài khoản hoặc Quy tắc cộng đồng")}
                  className="mt-1 w-full rounded-xl border border-[#EFEEEB] bg-[#F7F5F0]/70 px-3.5 py-2 text-xs text-[#07241A] focus:border-[#1E3A2F] focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#07241A]">
                  {t("Message", "Nội dung")}
                </label>
                <textarea
                  required
                  rows={4}
                  value={notifyMessage}
                  onChange={(e) => setNotifyMessage(e.target.value)}
                  placeholder={t("Write your message to the member here...", "Nhập nội dung gửi đến thành viên...")}
                  className="mt-1 w-full rounded-xl border border-[#EFEEEB] bg-[#F7F5F0]/70 p-3 text-xs text-[#07241A] focus:border-[#1E3A2F] focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNotifyModal(false)}
                  className="rounded-xl border border-[#EFEEEB] px-4 py-2 text-xs font-semibold text-[#727974] hover:bg-[#FAF9F6]"
                >
                  {t("Cancel", "Hủy")}
                </button>
                <button
                  type="submit"
                  disabled={sendingNotify}
                  className="flex items-center gap-1.5 rounded-xl bg-[#1E3A2F] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#152820] disabled:opacity-50"
                >
                  {sendingNotify ? (
                    <span>{t("Sending...", "Đang gửi...")}</span>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      <span>{t("Send", "Gửi")}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
