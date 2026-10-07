"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

interface NavbarProps {
  initialSearchQuery?: string;
  onSearch?: (query: string) => void;
}

export default function Navbar({ initialSearchQuery = "", onSearch }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(initialSearchQuery);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [selectedLang, setSelectedLang] = useState("EN");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchValue);
    } else {
      router.push(`/explore?q=${encodeURIComponent(searchValue)}`);
    }
  };

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Explore", href: "/explore" },
    { label: "Vegan Places", href: "/vegan-places" },
    { label: "Meal Planner", href: "/#cta" },
  ];

  const isLinkActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href === "/explore" && pathname.startsWith("/explore")) return true;
    if (href === "/vegan-places" && pathname.startsWith("/vegan-places")) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#EFEEEB] bg-[#FBF9F6]/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5 lg:px-12">
        {/* Brand Logo & Main Nav */}
        <div className="flex items-center gap-6 lg:gap-10">
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
          <nav className="hidden items-center gap-1.5 md:flex">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition ${
                    active
                      ? "bg-[#07241A] text-white shadow-sm"
                      : "text-[#424844] hover:bg-[#D9E6DC]/40 hover:text-[#07241A]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Search, Language, Auth, Avatar */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick Search Field */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative hidden lg:block w-64 xl:w-72"
          >
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search recipes, foods, places"
              className="w-full rounded-full border border-[#EFEEEB] bg-[#F5F3F0] py-2 pl-9 pr-4 text-xs text-[#07241A] placeholder-[#727974] transition focus:border-[#1E3A2F] focus:bg-white focus:outline-none shadow-inner/10"
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

          {/* Language Selector */}
          <div className="relative">
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

          {/* Login / Sign Up Action Button */}
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-[#07241A] px-4 py-2 text-xs font-semibold tracking-wide text-white shadow-sm transition hover:bg-[#1E3A2F]"
          >
            Login / Sign Up
          </Link>

          {/* User Profile Avatar */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-[#D9E6DC] transition hover:ring-[#1E3A2F]"
              title="User Account"
            >
              <Image
                src="/images/user_avatar.jpg"
                alt="User Profile"
                fill
                className="object-cover"
                sizes="32px"
              />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-[#EFEEEB] bg-white p-2 shadow-xl ring-1 ring-black/5 z-50">
                <div className="px-3 py-2 border-b border-[#EFEEEB]">
                  <p className="text-xs font-semibold text-[#07241A]">Linh Nguyen</p>
                  <p className="text-[11px] text-[#727974]">linh@veggiemate.vn</p>
                </div>
                <div className="py-1">
                  <Link
                    href="/#saved"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-[#424844] hover:bg-[#F5F3F0]"
                  >
                    <span>🔖</span> Saved Places
                  </Link>
                  <Link
                    href="/#diet"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-[#424844] hover:bg-[#F5F3F0]"
                  >
                    <span>🥗</span> Meal Plans
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                  >
                    <span>🚪</span> Sign Out
                  </Link>
                </div>
              </div>
            )}
          </div>

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
