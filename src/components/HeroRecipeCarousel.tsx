"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { listPosts, type PostResponse } from "@/lib/community-api";
import { getMediaUrl } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

const fallbackImage = "/images/hero_slide.png";

/** Displays every recipe cover in sequence without hard-coded hero imagery. */
export default function HeroRecipeCarousel() {
  const { t } = useLanguage();
  const [recipes, setRecipes] = useState<PostResponse[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let active = true;
    void listPosts({ postType: "RECIPE", limit: 200 })
      .then((posts) => {
        if (active) setRecipes(posts.filter((post) => Boolean(post.thumbnailUrl)));
      })
      .catch(() => {
        if (active) setRecipes([]);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (recipes.length < 2) return;
    const timer = window.setInterval(() => {
      setCurrentIndex((current) => (current + 1) % recipes.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [recipes.length]);

  const safeIndex = recipes.length > 0 ? currentIndex % recipes.length : 0;
  const current = recipes[safeIndex];
  const imageUrl = current ? getMediaUrl(current.thumbnailUrl) : fallbackImage;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#EFEEEB] shadow-xl">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        {current && (
          <p className="absolute bottom-5 left-5 right-20 line-clamp-1 text-sm font-semibold text-white drop-shadow-sm">
            {current.title}
          </p>
        )}
      </div>

      <div className="absolute bottom-4 right-4 rounded-full bg-[#07241A]/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
        {recipes.length > 0 ? `${safeIndex + 1} / ${recipes.length}` : t("Recipe covers", "Ảnh công thức")}
      </div>
    </div>
  );
}
