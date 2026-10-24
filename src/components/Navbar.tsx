"use client";

import UiText from "@/components/UiText";




import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAdminModeration, BYPASS_ADMIN_ROLE } from "@/context/AdminModerationContext";
import { useLanguage } from "@/context/LanguageContext";

function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email && email.trim().length > 0) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

interface NavbarProps {
  initialSearchQuery?: string;
  onSearch?: (query: string) => void;
}

export default function Navbar({ initialSearchQuery = "", onSearch }: NavbarProps) {
  const { user, loading, logout } = useAuth();
  const { flaggedCount } = useAdminModeration();
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  const [searchValue, setSearchValue] = useState(initialSearchQuery);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowProfileMenu(false);
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchValue);
    } else if (searchValue.trim()) {
      router.push(`/community?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const handleSignOut = async () => {
    setShowProfileMenu(false);
    setIsMobileMenuOpen(false);
    await logout();
    router.push("/");
  };

  const navLinks = [
    { label: t("Home", "Trang chủ"), href: "/" },
    { label: t("Community", "Cộng đồng"), href: "/community" },
    { label: t("Vegan Places", "Địa điểm chay"), href: "/vegan-places" },
    { label: t("Meal Planner", "Thực đơn"), href: "/meal-planner" },
    { label: t("AI Chatbox", "Trợ lý AI"), href: "/ai-chatbox" },
  ].filter(link => user || !["/vegan-places", "/meal-planner"].includes(link.href));

  const isLinkActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  const userName =
    user?.fullName ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "User";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#EFEEEB] bg-[#FBF9F6]/90 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-2 px-4 py-4 sm:gap-4 sm:px-6 xl:gap-6 xl:px-8">
        {/* Brand Logo & Main Nav */}
        <div className="flex min-w-0 items-center gap-5 xl:gap-7 2xl:gap-9">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5 whitespace-nowrap">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1E3A2F] text-white shadow-sm transition group-hover:bg-[#07241A] sm:h-9 sm:w-9">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </span>
            <span className="hidden font-serif text-xl font-bold tracking-tight text-[#07241A] min-[380px]:inline sm:text-2xl">
              VeggieMate
            </span>
          </Link>

          {/* Navigation Links */}
          <nav aria-label={t("Main navigation", "Điều hướng chính")} className="hidden shrink-0 items-center gap-1 xl:flex 2xl:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                aria-current={isLinkActive(link.href) ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-3 py-2.5 text-sm font-semibold transition 2xl:px-4 2xl:text-[15px] ${isLinkActive(link.href)
                  ? "bg-[#1E3A2F] text-white shadow-sm"
                  : "text-[#424844] hover:bg-[#D9E6DC]/40 hover:text-[#07241A]"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Section: Search, Language, Auth */}
        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          {/* Quick Search Field */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative hidden w-48 min-[1450px]:w-64 min-[1450px]:block"
          >
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={t("Search recipes, foods, places...", "Tìm công thức, món ăn, địa điểm...")}
              aria-label={t("Search VeggieMate", "Tìm kiếm trên VeggieMate")}
              className="w-full rounded-full border border-[#EFEEEB] bg-[#F5F3F0] py-2 pl-9 pr-4 text-sm text-[#07241A] placeholder-[#727974] transition focus:border-[#1E3A2F] focus:bg-white focus:outline-none"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#727974]"
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
          </form>

          {/* Auth State Actions */}
          {loading ? (
            <div className="h-9 w-9 animate-pulse rounded-xl bg-[#EFEEEB] sm:w-24" />
          ) : user ? (
            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                aria-expanded={showProfileMenu}
                aria-label={t("Account menu", "Menu tài khoản")}
                className="vm-button flex items-center gap-2 rounded-xl border border-[#EFEEEB] bg-white p-1.5 pr-2.5 sm:pr-3 text-xs font-semibold text-[#07241A] shadow-sm transition hover:bg-[#F5F3F0]"
                title={user.email || userName}
              >
                {user.photoURL ? (
                  <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-[#EFEEEB]">
                    <Image
                      src={user.photoURL}
                      alt={userName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1E3A2F] text-[11px] font-bold text-white">
                    {getInitials(userName, user.email)}
                  </div>
                )}
                <div className="hidden flex-col text-left sm:flex">
                  <span className="max-w-[110px] truncate text-[13px] font-semibold leading-tight text-[#07241A]">
                    {userName}
                  </span>
                  {user.email && (
                    <span className="max-w-[110px] truncate text-[11px] font-normal text-[#727974]">
                      {user.email}
                    </span>
                  )}
                </div>
              </button>

              {showProfileMenu && (
                <div className="vm-popover absolute right-0 mt-2 w-52 rounded-2xl border border-[#EFEEEB] bg-white p-2 shadow-xl ring-1 ring-black/5 z-50">
                  <div className="px-3 py-2 border-b border-[#EFEEEB]">
                    <p className="text-xs font-semibold text-[#07241A] truncate">
                      {userName}
                    </p>
                    {user.email && (
                      <p className="text-[11px] text-[#727974] truncate">{user.email}</p>
                    )}
                  </div>
                  <div className="py-1">
                    {/* Admin Dashboard & Members: Hiển thị khi role là admin hoặc khi bật bypass */}
                    {(BYPASS_ADMIN_ROLE || user?.role?.toLowerCase() === "admin") && (
                      <>
                        <Link
                          href="/admin"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-[#1E3A2F] font-semibold bg-[#D9E6DC]/60 hover:bg-[#D9E6DC] transition mb-1"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect width="7" height="9" x="3" y="3" rx="1" />
                            <rect width="7" height="5" x="14" y="3" rx="1" />
                            <rect width="7" height="9" x="14" y="12" rx="1" />
                            <rect width="7" height="5" x="3" y="16" rx="1" />
                          </svg>
                          <span><UiText text={"Admin Dashboard"} /></span>
                        </Link>
                        <Link
                          href="/admin/members"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-[#1E3A2F] font-semibold hover:bg-[#D9E6DC]/40 transition mb-1"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          <span><UiText text={"Members"} /></span>
                        </Link>
                        <Link
                          href="/admin/content"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-[#1E3A2F] font-semibold hover:bg-[#D9E6DC]/40 transition mb-1"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                            <path d="M6 6h10" />
                            <path d="M6 10h10" />
                          </svg>
                          <span><UiText text={"Content"} /></span>
                        </Link>
                        <Link
                          href="/admin/categories"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-[#1E3A2F] font-semibold hover:bg-[#D9E6DC]/40 transition mb-1"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                            <line x1="7" y1="7" x2="7.01" y2="7" />
                          </svg>
                          <span><UiText text={"Categories"} /></span>
                        </Link>
                        <Link
                          href="/admin/restaurants"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-[#1E3A2F] font-semibold hover:bg-[#D9E6DC]/40 transition mb-1"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
                            <path d="M2 7h20" />
                          </svg>
                          <span><UiText text={"Restaurants"} /></span>
                        </Link>
                        <Link
                          href="/admin/allergens"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-[#1E3A2F] font-semibold hover:bg-[#D9E6DC]/40 transition mb-1"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="2" y1="2" x2="22" y2="22" />
                            <path d="M10.4 4.5A2 2 0 0 1 12 4a2 2 0 0 1 2 .5" />
                            <path d="M19 13.5A7.5 7.5 0 0 0 12 7c-1.3 0-2.5.3-3.6 1" />
                            <path d="M5.3 12.5A7.5 7.5 0 0 0 4.5 15h11" />
                            <line x1="3" y1="18" x2="19" y2="18" />
                            <path d="M6 18v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1" />
                          </svg>
                          <span><UiText text={"Allergens & Health"} /></span>
                        </Link>
                        <Link
                          href="/admin/flagged"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center justify-between rounded-lg px-3 py-1.5 text-xs text-[#1E3A2F] font-semibold hover:bg-[#D9E6DC]/40 transition mb-1"
                        >
                          <div className="flex items-center gap-2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                              <line x1="4" x2="4" y1="22" y2="15" />
                            </svg>
                            <span><UiText text={"AI Flagged"} /></span>
                          </div>
                          {flaggedCount > 0 && (
                            <span className="rounded-full bg-[#F97316] px-1.5 py-0.2 text-[10px] font-bold text-white">
                              {flaggedCount}
                            </span>
                          )}
                        </Link>
                      </>
                    )}
                    <Link
                      href="/my-content"
                      onClick={() => setShowProfileMenu(false)}
                      aria-current={pathname.startsWith("/my-content") ? "page" : undefined}
                      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-[#424844] hover:bg-[#F5F3F0] transition"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 7h8M8 12h8M8 17h5" /></svg>
                      <span>{t("My Content", "Bài viết của tôi")}</span>
                    </Link>
                    <Link
                      href="/create-content"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-[#07241A] font-semibold hover:bg-[#D9E6DC]/40 transition"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      <span>{t("Create Content", "Tạo bài viết")}</span>
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-[#424844] hover:bg-[#F5F3F0] transition"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="8" r="5" />
                        <path d="M20 21a8 8 0 0 0-16 0" />
                      </svg>
                      <span>{t("My Profile", "Hồ sơ của tôi")}</span>
                    </Link>
                    <Link
                      href="/bookmarks"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-[#424844] hover:bg-[#F5F3F0] transition"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                      </svg>
                      <span>{t("Bookmarks", "Đã lưu")}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 text-left transition"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span>{t("Sign Out", "Đăng xuất")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {BYPASS_ADMIN_ROLE && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 shadow-sm transition hover:bg-amber-100"
                >
                  <span><UiText text={"🛠️ Admin Test"} /></span>
                </Link>
              )}
              <Link
                href="/login"
                aria-label={t("Login / Sign Up", "Đăng nhập / Đăng ký")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#07241A] text-xs font-semibold tracking-wide text-white shadow-sm transition hover:bg-[#1E3A2F] sm:w-auto sm:px-4"
              >
                <svg className="sm:hidden" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></svg>
                <span className="hidden sm:inline">{t("Login / Sign Up", "Đăng nhập / Đăng ký")}</span>
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={t("Toggle navigation", "Mở hoặc đóng điều hướng")}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#EFEEEB] text-[#07241A] xl:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isMobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {isMobileMenuOpen && (
        <div id="mobile-navigation" className="vm-popover space-y-2 border-t border-[#EFEEEB] bg-[#FBF9F6] px-6 py-4 xl:hidden">
          {user && (
            <div className="mb-3 border-b border-[#EFEEEB] pb-3">
              <p className="text-xs font-semibold text-[#07241A]">{userName}</p>
              {user.email && (
                <p className="text-[11px] text-[#727974]">{user.email}</p>
              )}
            </div>
          )}

          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block rounded-lg px-4 py-2 text-xs font-semibold ${isLinkActive(link.href)
                ? "bg-[#07241A] text-white"
                : "text-[#424844] hover:bg-[#D9E6DC]/40"
                }`}
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <div className="pt-2 border-t border-[#EFEEEB] space-y-1">
              {(BYPASS_ADMIN_ROLE || user?.role?.toLowerCase() === "admin") && (
                <div className="mb-2 pb-2 border-b border-[#EFEEEB] space-y-1">
                  <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-[#727974]">Quản trị</div>
                  <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-lg px-4 py-2 text-xs font-semibold text-[#1E3A2F] bg-[#D9E6DC]/40">
                    <UiText text={"Admin Dashboard"} />
                  </Link>
                  <Link href="/admin/members" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-lg px-4 py-2 text-xs font-semibold text-[#424844] hover:bg-[#D9E6DC]/40">
                    <UiText text={"Members"} />
                  </Link>
                  <Link href="/admin/content" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-lg px-4 py-2 text-xs font-semibold text-[#424844] hover:bg-[#D9E6DC]/40">
                    <UiText text={"Content"} />
                  </Link>
                  <Link href="/admin/categories" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-lg px-4 py-2 text-xs font-semibold text-[#424844] hover:bg-[#D9E6DC]/40">
                    <UiText text={"Categories"} />
                  </Link>
                  <Link href="/admin/restaurants" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-lg px-4 py-2 text-xs font-semibold text-[#424844] hover:bg-[#D9E6DC]/40">
                    <UiText text={"Restaurants"} />
                  </Link>
                  <Link href="/admin/allergens" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-lg px-4 py-2 text-xs font-semibold text-[#424844] hover:bg-[#D9E6DC]/40">
                    <UiText text={"Allergens & Health"} />
                  </Link>
                  <Link href="/admin/flagged" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between rounded-lg px-4 py-2 text-xs font-semibold text-[#424844] hover:bg-[#D9E6DC]/40">
                    <span><UiText text={"AI Flagged"} /></span>
                    {flaggedCount > 0 && (
                      <span className="rounded-full bg-[#F97316] px-1.5 py-0.2 text-[10px] font-bold text-white">
                        {flaggedCount}
                      </span>
                    )}
                  </Link>
                </div>
              )}
              <Link href="/my-content" onClick={() => setIsMobileMenuOpen(false)} className="block rounded-lg px-4 py-2 text-xs font-semibold text-[#424844] hover:bg-[#D9E6DC]/40">
                {t("My Content", "Bài viết của tôi")}
              </Link>
              <Link
                href="/create-content"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-2 text-xs font-semibold text-[#07241A] bg-[#D9E6DC]/40"
              >
                {t("Create Content", "Tạo bài viết")}
              </Link>
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-2 text-xs font-semibold text-[#424844] hover:bg-[#D9E6DC]/40"
              >
                {t("My Profile", "Hồ sơ của tôi")}
              </Link>
              <Link
                href="/bookmarks"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-2 text-xs font-semibold text-[#424844] hover:bg-[#D9E6DC]/40"
              >
                {t("Bookmarks", "Đã lưu")}
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full text-left rounded-lg px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                {t("Sign Out", "Đăng xuất")}
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-[#EFEEEB]">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-center rounded-xl bg-[#07241A] px-4 py-2.5 text-xs font-semibold text-white shadow-sm"
              >
                {t("Login / Sign Up", "Đăng nhập / Đăng ký")}
              </Link>
            </div>
          )}

          <div className="pt-2">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={t("Search recipes, foods, places", "Tìm công thức, món ăn, địa điểm")}
                aria-label={t("Search VeggieMate", "Tìm kiếm trên VeggieMate")}
                className="w-full rounded-full border border-[#EFEEEB] bg-[#F5F3F0] py-2 pl-9 pr-4 text-xs text-[#07241A]"
              />
              <svg
                className="absolute left-3.5 top-2.5 text-[#727974]"
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
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
