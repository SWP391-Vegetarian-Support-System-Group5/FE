"use client";

import UiText from "@/components/UiText";


import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAdminModeration, BYPASS_ADMIN_ROLE } from "@/context/AdminModerationContext";
import ContentIcon from "@/components/content/ContentIcon";
import { useLanguage } from "@/context/LanguageContext";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const { t } = useLanguage();
  const { flaggedCount } = useAdminModeration();
  const router = useRouter();
  const pathname = usePathname();

  // Authorization check: Only allow users with "admin" role (Skipped when bypass is active)
  useEffect(() => {
    if (BYPASS_ADMIN_ROLE) return;

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

  // Loading screen & unauthorized access block (Skipped when bypass is active)
  if (!BYPASS_ADMIN_ROLE && (loading || !user || user.role?.toLowerCase() !== "admin")) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FBF9F6]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1E3A2F] border-t-transparent" />
          <p className="text-sm font-medium text-[#1E3A2F]"><UiText text={"Authenticating Administrator privileges..."} /></p>
        </div>
      </div>
    );
  }

  const navItems = [
    { label: t("Ingredients", "Nguyên liệu"), href: "/admin/ingredients", icon: <ContentIcon name="leaf" />, badge: undefined },
    { label: "Recipe categories", href: "/admin/recipe-categories", icon: null, badge: undefined },
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
    <div className="flex min-h-screen bg-[#FBF9F6] text-[#07241A] font-sans antialiased">
      {/* Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col justify-between border-r border-[#EFEEEB] bg-[#FBF9F6] px-4 py-6">
        <div>
          {/* Header Sidebar: ADMIN v1.4 */}
          <div className="mb-4 flex items-center justify-between px-3">
            <span className="text-[11px] font-bold tracking-widest text-[#727974]"><UiText text={"ADMIN"} /></span>
            <span className="text-[11px] font-medium text-[#A0A5A1]">v1.4</span>
          </div>

          {BYPASS_ADMIN_ROLE && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-1.5 text-[10px] font-semibold text-amber-800 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span><UiText text={"Dev Bypass Active"} /></span>
            </div>
          )}

          {/* Navigation Links */}
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
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive
                        ? "bg-[#F97316] text-white"
                        : "bg-[#F97316] text-white"
                        }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Log Out button at bottom of sidebar */}
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
            <span><UiText text={"Log Out"} /></span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pl-60">
        <main className="flex-1 p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
