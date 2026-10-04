import Link from "next/link";

export default function Navbar() {
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

          {/* Login / Sign Up Action Button */}
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-[#1E3A2F] px-4 py-2 text-xs font-semibold tracking-wide text-white shadow-sm transition hover:bg-[#07241A] hover:shadow-md"
          >
            Login / Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}
