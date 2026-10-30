"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CreateContentView from "@/components/recipe/CreateContentView";

export default function CreateContentPageShell() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role?.toLowerCase() === "admin";

  useEffect(() => {
    if (!loading && isAdmin) router.replace("/admin/content/create");
  }, [isAdmin, loading, router]);

  if (loading || isAdmin) {
    return <main className="flex min-h-screen items-center justify-center bg-[#FBF9F6] text-sm text-[#424844]">Đang chuyển đến khu vực quản trị…</main>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF9F6]">
      <Navbar />
      <main className="flex-1"><CreateContentView /></main>
      <Footer />
    </div>
  );
}
