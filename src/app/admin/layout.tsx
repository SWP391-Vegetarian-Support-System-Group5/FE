"use client";

import UiText from "@/components/UiText";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAdminModeration } from "@/context/AdminModerationContext";
import { useLanguage } from "@/context/LanguageContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const { flaggedCount } = useAdminModeration();
  const { t, language, setLanguage } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const langMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (langMenuRef.current && !langMenuRef.current.contains(target)) {
        setLangMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Authorization check: Only allow users with "admin" role
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in -> Redirect to login page
        router.replace("/login");
      } else if (user.role?.toLowerCase() !== "admin") {
        // Logged in but not an admin -> Redirect to home page
        router.replace("/");
      }
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  // Loading screen & unauthorized access block
  if (loading || !user || user.role?.toLowerCase() !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FBF9F6]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1E3A2F] border-t-transparent" />
          <p className="text-sm font-medium text-[#1E3A2F]"><UiText text={"Đang kiểm tra quyền quản trị..."} /></p>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      ),
    },
    {
      label: "Members",
      href: "/admin/members",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "Content",
      href: "/admin/content",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10" />
          <path d="M6 10h10" />
        </svg>
      ),
    },
    {
      label: "Categories",
      href: "/admin/categories",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      ),
    },
    {
      label: "Restaurants",
      href: "/admin/restaurants",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
          <path d="M2 7h20" />
          <path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12V7" />
        </svg>
      ),
    },
    {
      label: "Allergens & Health",
      href: "/admin/allergens",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="2" y1="2" x2="22" y2="22" />
          <path d="M10.4 4.5A2 2 0 0 1 12 4a2 2 0 0 1 2 .5" />
          <path d="M19 13.5A7.5 7.5 0 0 0 12 7c-1.3 0-2.5.3-3.6 1" />
          <path d="M5.3 12.5A7.5 7.5 0 0 0 4.5 15h11" />
          <line x1="3" y1="18" x2="19" y2="18" />
          <path d="M6 18v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1" />
        </svg>
      ),
    },
    {
      label: "AI Flagged",
      href: "/admin/flagged",
      badge: flaggedCount > 0 ? String(flaggedCount) : undefined,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" x2="4" y1="22" y2="15" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBF9F6] text-[#07241A] font-sans antialiased">
      {/* 1. TOP NAVBAR CỐ ĐỊNH - KHÔNG CUỘN THEO TRANG */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-16 border-b border-[#EFEEEB] bg-white">
        {/* Khối bên trái: ADMIN v1.4 (rộng w-60 khớp sidebar) */}
        <div className="flex h-full w-60 shrink-0 items-center justify-between border-r border-[#EFEEEB] bg-[#FBF9F6] px-6">
          <span className="text-xs font-bold tracking-widest text-[#727974]">ADMIN</span>
          <span className="text-[11px] font-medium text-[#A0A5A1]">v1.4</span>
        </div>

        {/* Khối bên phải: Main Admin Navbar (nền trắng) */}
        <div className="flex h-full flex-1 items-center justify-between bg-white px-6 sm:px-8">
          {/* Logo VeggieMate & Huy hiệu Admin Area */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 font-serif text-lg sm:text-xl font-bold tracking-tight text-[#07241A] hover:opacity-85 transition"
            >
              <span className="text-[#0F2F24]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                  <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
              </span>
              <span>VeggieMate</span>
            </Link>
            <span className="rounded-full bg-[#F0EFEB] px-2.5 py-0.5 text-xs font-medium text-[#59635C]">
              Admin Area
            </span>
          </div>

          {/* Các nút hành động bên phải: Ngôn ngữ, Chuông thông báo, Divider, Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Bộ chọn ngôn ngữ (EN / VI) có thể click và chuyển đổi */}
            <div ref={langMenuRef} className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLangMenuOpen((prev) => !prev);
                }}
                title={t("Switch language (EN/VI)", "Chuyển đổi ngôn ngữ (EN/VI)")}
                aria-label={t("Switch language", "Chuyển đổi ngôn ngữ")}
                aria-expanded={langMenuOpen}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#59635C] hover:bg-[#F2EFE9] hover:text-[#07241A] transition active:scale-95 select-none"
              >
                <span className="font-bold tracking-wide">{language.toUpperCase()}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  className={`transition-transform duration-150 ${langMenuOpen ? "rotate-180" : ""}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {/* Menu chọn ngôn ngữ */}
              {langMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-[#EFEEEB] bg-white p-1.5 shadow-xl z-50 animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-2.5 py-1.5 text-[11px] font-semibold text-[#727974] border-b border-[#F5F4F0] mb-1">
                    {t("Select Language", "Chọn ngôn ngữ")}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage("en");
                      setLangMenuOpen(false);
                    }}
                    className={`cursor-pointer flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      language === "en" ? "bg-[#EAF5EE] text-[#1E7E51]" : "text-[#424844] hover:bg-[#F7F6F3]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">🇬🇧</span>
                      <span>English (EN)</span>
                    </span>
                    {language === "en" && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage("vi");
                      setLangMenuOpen(false);
                    }}
                    className={`cursor-pointer flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
                      language === "vi" ? "bg-[#EAF5EE] text-[#1E7E51]" : "text-[#424844] hover:bg-[#F7F6F3]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">🇻🇳</span>
                      <span>Tiếng Việt (VI)</span>
                    </span>
                    {language === "vi" && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Nút Chuông thông báo (kèm chấm thông báo cam) */}
            <Link
              href="/admin/flagged"
              title={t("Flagged moderation reports", "Báo cáo kiểm duyệt")}
              aria-label={t("Flagged moderation reports", "Báo cáo kiểm duyệt")}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[#59635C] hover:bg-[#F7F6F3] hover:text-[#07241A] transition"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#B45309] ring-2 ring-white" />
            </Link>

            {/* Vạch kẻ phân cách đứng */}
            <div className="h-5 w-px bg-[#EFEEEB]" />

            {/* Admin Profile Pill & Dropdown */}
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setUserMenuOpen((prev) => !prev);
                }}
                className="cursor-pointer flex items-center gap-2.5 rounded-xl p-1 hover:bg-[#F7F6F3] transition select-none"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#16382B] text-xs font-bold text-white shadow-2xs">
                  VM
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-[#07241A] leading-tight">
                    Admin Supervisor
                  </p>
                  <p className="text-[11px] font-normal text-[#727974] leading-tight mt-0.5">
                    System Admin
                  </p>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="text-[#727974]">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {/* Menu xổ xuống của User */}
              {userMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-[#EFEEEB] bg-white p-2 shadow-xl z-50 animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="border-b border-[#F5F4F0] px-3 py-2">
                    <p className="text-xs font-bold text-[#07241A]">{user?.fullName || "Admin Supervisor"}</p>
                    <p className="text-[11px] text-[#727974] truncate">{user?.email}</p>
                  </div>
                  <Link
                    href="/admin"
                    onClick={() => setUserMenuOpen(false)}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#424844] hover:bg-[#F7F6F3]"
                  >
                    {t("Dashboard", "Bảng điều khiển")}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="cursor-pointer mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span><UiText text={"Đăng xuất"} /></span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. SIDEBAR CỐ ĐỊNH BÊN TRÁI - DƯỚI THANH TOP BAR */}
      <aside className="fixed top-16 left-0 bottom-0 z-30 flex w-60 flex-col justify-between border-r border-[#EFEEEB] bg-[#FBF9F6] px-4 py-6 overflow-y-auto">
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${isActive
                  ? "bg-[#1E3A2F] text-white shadow-sm"
                  : "text-[#424844] hover:bg-[#F2EFE9] hover:text-[#07241A]"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? "text-white" : "text-[#727974] group-hover:text-[#07241A]"}>
                    {item.icon}
                  </span>
                  <span><UiText text={item.label} /></span>
                </div>
                {item.badge && (
                  <span
                    className="rounded-full bg-[#F97316] px-2 py-0.5 text-[10px] font-bold text-white"
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Nút Đăng xuất ở cuối Sidebar */}
        <div className="border-t border-[#EFEEEB] pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-[#727974] transition hover:bg-red-50 hover:text-red-600"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span><UiText text={"Đăng xuất"} /></span>
          </button>
        </div>
      </aside>

      {/* 3. VÙNG NỘI DUNG CHÍNH - BÙ KHOẢNG TRỐNG CHO FIXED NAVBAR & SIDEBAR */}
      <div className="flex flex-1 flex-col pl-60 pt-16">
        <main className="flex-1 p-8 lg:p-10 min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
}
