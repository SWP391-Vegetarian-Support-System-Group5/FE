"use client";

import ContentIcon from "@/components/content/ContentIcon";

import CardSkeleton from "@/components/ui/CardSkeleton";
import FeedImage from "@/components/ui/FeedImage";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createCommunityEventSource, listPosts, type CommunityEvent, type PostResponse } from "@/lib/community-api";
import { useLanguage } from "@/context/LanguageContext";
import { localizeRecipeTitle } from "@/lib/localized-content";
import { getMediaUrl } from "@/lib/api";

const fallbackImages = [
  "/images/recipe_tofu_tomato.png",
  "/images/recipe_spring_rolls.png",
  "/images/recipe_claypot_tofu.png",
  "/images/recipe_bun_hue.png",
];

export default function PopularRecipes() {
  const { language, t } = useLanguage();
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let latestRequest = 0;
    const load = async () => {
      const request = ++latestRequest;
      try {
        const posts = await listPosts({ postType: "RECIPE", limit: 4 });
        if (active && request === latestRequest) setPosts(posts);
      } catch {
        if (active && request === latestRequest) setPosts([]);
      } finally {
        if (active && request === latestRequest) setLoading(false);
      }
    };
    void load();
    const source = createCommunityEventSource();
    const refresh = () => load();
    source.addEventListener("open", refresh);
    source.addEventListener("postCreated", refresh);
    source.addEventListener("postUpdated", refresh);
    source.addEventListener("postRemoved", refresh);
    source.addEventListener("ratingUpdated", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as CommunityEvent;
      if (!payload.postId) return;
      setPosts((current) => current.map((post) => post.postId === payload.postId
        ? { ...post, averageRating: payload.averageRating ?? post.averageRating, ratingCount: payload.ratingCount ?? post.ratingCount }
        : post));
    });
    source.addEventListener("commentCreated", refresh);
    source.addEventListener("commentRemoved", refresh);
    return () => { active = false; source.close(); };
  }, []);

  if (loading) return <CardSkeleton count={4} compact />;

  return (
    <div className="vm-stagger mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {!loading && posts.length === 0 && (
        <div className="col-span-full rounded-2xl border border-dashed border-[#CCD5C6] bg-white/70 px-6 py-12 text-center text-sm text-[#727974]">
          {t("No recipe posts have been published yet.", "Chưa có bài công thức nào được đăng.")}
        </div>
      )}
      {posts.map((post) => {
        const localFallback = fallbackImages[post.postId % fallbackImages.length];
        const storedImage = post.imageUrl ?? post.thumbnailUrl;
        const imageSource = storedImage ? getMediaUrl(storedImage) : localFallback;
        return <Link key={post.postId} href={`/view-detail/${post.postId}`} className="vm-card vm-enter group overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EFEEEB]">
            <FeedImage key={imageSource} src={imageSource} alt={post.title} compact />
            {post.videoUrl && (
              <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                {t("Video", "Video")}
              </span>
            )}
          </div>
          <div className="p-4">
            <h3 className="line-clamp-2 font-serif text-lg font-semibold leading-snug text-[#07241A]">{localizeRecipeTitle(post.title, language)}</h3>
            <p className="mt-1 text-xs text-[#424844]">{t("by", "bởi")} {post.authorName}</p>
            {post.caloriesPerServing != null && post.caloriesPerServing > 0 && <p className="mt-1 text-xs font-medium text-[#59635C]">~ {Math.round(post.caloriesPerServing)} kcal/khẩu phần</p>}
            <div className="mt-3 flex items-center justify-between border-t border-[#EFEEEB] pt-3 text-xs">
              <div className="flex items-center gap-1 text-[#F59E0B]">
                <span><ContentIcon name="star" width="1em" height="1em" className="inline-block shrink-0 align-[-0.125em]" fill="currentColor" /></span>
                <span className="font-semibold text-[#1B1C1A]">{post.averageRating ? post.averageRating.toFixed(1) : t("New", "Mới")} / 5</span>
                <span className="text-[#727974]">· {post.ratingCount} {t("ratings", "đánh giá")}</span>
              </div>
            </div>
            <div className="mt-1.5 flex items-center gap-1 text-[11px] text-[#727974]">
              <span><ContentIcon name="message" width="1em" height="1em" className="inline-block align-[-0.125em]" /> {post.commentCount} {t("comments", "bình luận")}</span>
            </div>
          </div>
        </Link>
      })}
    </div>
  );
}
