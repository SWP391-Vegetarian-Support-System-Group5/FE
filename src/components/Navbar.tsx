"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

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
  const pathname = usePathname();
  const router = useRouter();

  const [searchValue, setSearchValue] = useState(initialSearchQuery);
  const [selectedLang, setSelectedLang] = useState<"EN" | "VI">("EN");
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
      if (
        languageMenuRef.current &&
        !languageMenuRef.current.contains(event.target as Node)
      ) {
        setShowLanguageDropdown(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowProfileMenu(false);
        setShowLanguageDropdown(false);
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
      router.push(`/explore?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const handleSignOut = async () => {
    setShowProfileMenu(false);
    setIsMobileMenuOpen(false);
    await logout();
    router.push("/");
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Explore", href: "/explore" },
    { label: "Vegan Places", href: "/vegan-places" },
    { label: "Meal Planner", href: "/#cta" },
    { label: "AI Chatbox", href: "/ai-chatbox" },
  ];

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
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-12">
        {/* Brand Logo & Main Nav */}
        <div className="flex items-center gap-8 lg:gap-10">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1E3A2F] text-white shadow-sm transition group-hover:bg-[#07241A]">
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
            <span className="font-serif text-2xl font-bold tracking-tight text-[#07241A]">
              VeggieMate
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition ${
                  isLinkActive(link.href)
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
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick Search Field */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative hidden lg:block w-60 xl:w-72"
          >
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search recipes, foods, places..."
              className="w-full rounded-full border border-[#EFEEEB] bg-[#F5F3F0] py-1.5 pl-9 pr-4 text-xs text-[#07241A] placeholder-[#727974] transition focus:border-[#1E3A2F] focus:bg-white focus:outline-none"
            />
            <svg
              className="absolute left-3 top-2 text-[#727974]"
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

          {/* Language Selector */}
          <div ref={languageMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#EFEEEB] bg-white px-3 py-1.5 text-xs font-semibold text-[#424844] hover:bg-[#F5F3F0] transition"
              title="Select Language"
            >
              <span className="text-[13px]">文A</span>
              <span>{selectedLang}</span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className={`transition-transform ${showLanguageDropdown ? "rotate-180" : ""}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {showLanguageDropdown && (
              <div className="absolute right-0 mt-1.5 w-28 rounded-xl border border-[#EFEEEB] bg-white py-1.5 shadow-lg ring-1 ring-black/5 z-50">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLang("EN");
                    setShowLanguageDropdown(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs transition ${
                    selectedLang === "EN"
                      ? "bg-[#D9E6DC]/40 font-semibold text-[#07241A]"
                      : "text-[#424844] hover:bg-[#F5F3F0]"
                  }`}
                >
                  English (EN)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedLang("VI");
                    setShowLanguageDropdown(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs transition ${
                    selectedLang === "VI"
                      ? "bg-[#D9E6DC]/40 font-semibold text-[#07241A]"
                      : "text-[#424844] hover:bg-[#F5F3F0]"
                  }`}
                >
                  Tiếng Việt (VI)
                </button>
              </div>
            )}
          </div>

          {/* Auth State Actions */}
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-xl bg-[#EFEEEB]" />
          ) : user ? (
            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 rounded-xl border border-[#EFEEEB] bg-white p-1.5 pr-2.5 sm:pr-3 text-xs font-semibold text-[#07241A] shadow-sm transition hover:bg-[#F5F3F0]"
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
                  <span className="max-w-[110px] truncate text-[11px] font-semibold leading-tight text-[#07241A]">
                    {userName}
                  </span>
                  {user.email && (
                    <span className="max-w-[110px] truncate text-[10px] font-normal text-[#727974]">
                      {user.email}
                    </span>
                  )}
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-[#EFEEEB] bg-white p-2 shadow-xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-[#EFEEEB]">
                    <p className="text-xs font-semibold text-[#07241A] truncate">
                      {userName}
                    </p>
                    {user.email && (
                      <p className="text-[11px] text-[#727974] truncate">{user.email}</p>
                    )}
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-[#424844] hover:bg-[#F5F3F0] transition"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="8" r="5" />
                        <path d="M20 21a8 8 0 0 0-16 0" />
                      </svg>
                      <span>My Profile</span>
                    </Link>
                    <Link
                      href="/explore"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-[#424844] hover:bg-[#F5F3F0] transition"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                      </svg>
                      <span>Saved Places</span>
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
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-[#07241A] px-4 py-2 text-xs font-semibold tracking-wide text-white shadow-sm transition hover:bg-[#1E3A2F]"
            >
              Login / Sign Up
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-[#EFEEEB] text-[#07241A]"
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
        <div className="md:hidden border-t border-[#EFEEEB] bg-[#FBF9F6] px-6 py-4 space-y-2">
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
              className={`block rounded-lg px-4 py-2 text-xs font-semibold ${
                isLinkActive(link.href)
                  ? "bg-[#07241A] text-white"
                  : "text-[#424844] hover:bg-[#D9E6DC]/40"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <div className="pt-2 border-t border-[#EFEEEB] space-y-1">
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-2 text-xs font-semibold text-[#424844] hover:bg-[#D9E6DC]/40"
              >
                My Profile
              </Link>
              <Link
                href="/explore"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-2 text-xs font-semibold text-[#424844] hover:bg-[#D9E6DC]/40"
              >
                Saved Places
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full text-left rounded-lg px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-[#EFEEEB]">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-center rounded-xl bg-[#07241A] px-4 py-2.5 text-xs font-semibold text-white shadow-sm"
              >
                Login / Sign Up
              </Link>
            </div>
          )}

          <div className="pt-2">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search recipes, foods, places"
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
