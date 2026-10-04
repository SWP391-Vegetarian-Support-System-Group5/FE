"use client";

import Link from "next/link";
import Image from "next/image";
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

export default function Navbar() {
  const { user, loading, logout } = useAuth();

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
            <Link
              href="/"
              className="rounded-full bg-[#1E3A2F] px-4 py-1.5 text-xs font-semibold tracking-wide text-white shadow-sm transition"
            >
              Home
            </Link>
            <Link
              href="/#recipes"
              className="rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide text-[#424844] transition hover:bg-[#D9E6DC]/40 hover:text-[#07241A]"
            >
              Explore
            </Link>
            <Link
              href="/#restaurants"
              className="rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide text-[#424844] transition hover:bg-[#D9E6DC]/40 hover:text-[#07241A]"
            >
              Vegan Places
            </Link>
            <Link
              href="/#cta"
              className="rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide text-[#424844] transition hover:bg-[#D9E6DC]/40 hover:text-[#07241A]"
            >
              Meal Planner
            </Link>
          </nav>
        </div>

        {/* Right Section: Search, Language, Auth */}
        <div className="flex items-center gap-3">
          {/* Quick Search Field */}
          <div className="relative hidden xl:block w-64">
            <input
              type="text"
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
          </div>

          {/* Language Selector */}
          <button
            type="button"
            className="hidden sm:inline-flex items-center gap-1 rounded-full border border-[#EFEEEB] bg-white px-2.5 py-1 text-xs font-semibold text-[#424844] hover:bg-[#F5F3F0]"
            title="Language"
          >
            <span>🌐</span>
            <span>EN</span>
          </button>

          {/* Auth State Actions */}
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-xl bg-[#EFEEEB]" />
          ) : user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-xl border border-[#EFEEEB] bg-white p-1.5 pr-2.5 sm:pr-3 text-xs font-semibold text-[#07241A] shadow-sm transition hover:bg-[#F5F3F0]"
                title={user.email || user.displayName || "User profile"}
              >
                {user.photoURL ? (
                  <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-[#EFEEEB]">
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1E3A2F] text-[11px] font-bold text-white">
                    {getInitials(user.displayName, user.email)}
                  </div>
                )}
                <div className="hidden flex-col text-left sm:flex">
                  <span className="max-w-[110px] truncate text-[11px] font-semibold leading-tight text-[#07241A]">
                    {user.displayName || user.email?.split("@")[0] || "User"}
                  </span>
                  {user.email && (
                    <span className="max-w-[110px] truncate text-[10px] font-normal text-[#727974]">
                      {user.email}
                    </span>
                  )}
                </div>
              </Link>

              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex items-center justify-center rounded-xl border border-[#EFEEEB] bg-white px-3 py-2 text-xs font-semibold tracking-wide text-[#727974] transition hover:border-[#FFDBD0] hover:bg-[#FFF5F2] hover:text-[#99462A]"
                title="Đăng xuất"
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
                  className="sm:mr-1"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <>
              {/* Login / Sign Up Action Button */}
              <Link
                href="/profile"
                className="hidden sm:inline-flex items-center justify-center rounded-xl border border-[#EFEEEB] bg-white px-3 py-2 text-xs font-semibold tracking-wide text-[#424844] transition hover:bg-[#F5F3F0] hover:text-[#07241A]"
              >
                My Profile
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl bg-[#1E3A2F] px-4 py-2 text-xs font-semibold tracking-wide text-white shadow-sm transition hover:bg-[#07241A] hover:shadow-md"
              >
                Login / Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
