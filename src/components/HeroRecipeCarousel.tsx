"use client";

import Image from "next/image";
import Link from "next/link";


import { useEffect, useState } from "react";
import { listPosts, type PostResponse } from "@/lib/community-api";
import { getMediaUrl } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

const fallbackImage = "/images/hero_slide.png";

/** Rotating recipe covers, without captions or playback controls. */
export default function HeroRecipeCarousel() {
  const { t } = useLanguage();
  const [recipes, setRecipes] = useState<PostResponse[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let active = true;
    void listPosts({ postType: "RECIPE", limit: 200 })
      .then((posts) => {
        if (active) setRecipes(posts.filter((post) => Boolean(post.imageUrl || post.thumbnailUrl)));
      })
      .catch(() => {
        if (active) setRecipes([]);
      });

    return () => { active = false; };
  }, []);



  useEffect(() => {
    if (recipes.length < 2) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timer = window.setInterval(() => {
      if (!document.hidden && !motion.matches) setIndex(value => (value + 1) % recipes.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [recipes.length]);

  const current = recipes[index % (recipes.length || 1)];
  const imageUrl = current ? getMediaUrl(current.imageUrl || current.thumbnailUrl) : fallbackImage;

  return (
    <div className="vm-hero-gallery relative overflow-hidden rounded-[2rem] bg-[#EFEEEB] shadow-xl">
      <div className="relative aspect-[16/11] w-full">
        <Image
          key={current?.postId ?? "fallback"}
          src={imageUrl}
          alt={current?.title || t("Vegetarian culinary inspiration", "Cảm hứng ẩm thực chay")}
          fill
          unoptimized
          priority
          className="hero-recipe-slide object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
        {current && <Link href={`/view-detail/post-${current.postId}`} aria-label={t(`View recipe: ${current.title}`, `Xem công thức: ${current.title}`)} className="absolute inset-0 rounded-[2rem] focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white" />}
      </div>
    </div>
  );
}
