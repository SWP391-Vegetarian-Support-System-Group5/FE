"use client";

import { useAuth } from "@/context/AuthContext";
import { usePersonalizedRevision } from "@/hooks/usePersonalizedRevision";
import Image from "next/image";
import Link from "next/link";


import { useEffect, useState } from "react";
import { listPosts, type PostResponse } from "@/lib/community-api";
import { getMediaUrl } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";



/** Rotating recipe covers, without captions or playback controls. */
export default function HeroRecipeCarousel() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const personalizedRevision = usePersonalizedRevision();
  const scope = `${user?.uid ?? "guest"}:${personalizedRevision}`;
  const [resultScope, setResultScope] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [recipes, setRecipes] = useState<PostResponse[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    void listPosts({ postType: "RECIPE", limit: 200 })
      .then((posts) => {
        if (active) { setRecipes(posts.filter(post => post.status === "PUBLISHED" && Boolean(post.imageUrl || post.thumbnailUrl))); setIndex(0); setFailed(false); }
      })
      .catch(() => {
        if (active) { setRecipes([]); setFailed(true); }
      }).finally(() => { if (active) setResultScope(scope); });

    return () => { active = false; };
  }, [scope, authLoading]);



  useEffect(() => {
    if (recipes.length < 2) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timer = window.setInterval(() => {
      if (!document.hidden && !motion.matches) setIndex(value => (value + 1) % recipes.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [recipes.length]);

  const ready = !authLoading && resultScope === scope;
  const current = ready ? recipes[index % (recipes.length || 1)] : undefined;
  const imageUrl = current ? getMediaUrl(current.imageUrl || current.thumbnailUrl) : null;

  return (
    <div className="vm-hero-gallery relative overflow-hidden rounded-[2rem] bg-[#EFEEEB] shadow-xl">
      <div className="relative aspect-[16/11] w-full">
        {imageUrl && current ? <Image
          key={current.postId}
          src={imageUrl}
          alt={current?.title || t("Vegetarian culinary inspiration", "Cảm hứng ẩm thực chay")}
          fill
          unoptimized
          priority
          className="hero-recipe-slide object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        /> : <div role="status" className={`flex h-full items-center justify-center px-6 text-center text-sm text-[#59635C] ${!ready ? "vm-skeleton" : ""}`}>{!ready ? t("Loading recipes…", "Đang tải công thức…") : failed ? t("Recipes could not be loaded.", "Chưa tải được công thức.") : t("No recipes match your profile and current choices.", "Chưa tìm thấy công thức phù hợp với hồ sơ và lựa chọn hiện tại.")}</div>}
        {current && <Link href={`/view-detail/post-${current.postId}`} aria-label={t(`View recipe: ${current.title}`, `Xem công thức: ${current.title}`)} className="absolute inset-0 rounded-[2rem] focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white" />}
      </div>
    </div>
  );
}
