"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const memberRoutes = ["/profile", "/my-content", "/create-content", "/bookmarks", "/bookmark", "/meal-planner", "/vegan-places", "/admin"];
export default function AuthAccessBoundary({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  if (!memberRoutes.some(route => path === route || path.startsWith(route + "/"))) return children;
  if (loading) return <main className="p-12 text-center">{t("Loading...", "Đang tải...")}</main>;
  if (!user) return <main className="mx-auto max-w-xl px-6 py-24 text-center"><h1 className="font-serif text-3xl">{t("Sign in required", "Bạn cần đăng nhập")}</h1><p className="mt-4">{t("Sign in to use this feature.", "Đăng nhập để sử dụng chức năng này.")}</p><Link href="/login" className="mt-6 inline-block rounded-lg bg-[#07241A] px-6 py-3 text-white">{t("Sign in", "Đăng nhập")}</Link><Link href="/" className="ml-4">{t("Home", "Trang chủ")}</Link></main>;
  return children;
}
