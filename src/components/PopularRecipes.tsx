"use client";

import FeedImage from "@/components/ui/FeedImage";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createCommunityEventSource, listPosts, type CommunityEvent, type PostResponse } from "@/lib/community-api";
import { useLanguage } from "@/context/LanguageContext";
import { localizeRecipeTitle } from "@/lib/localized-content";

const fallbackImage = "/images/recipe_tofu_tomato.png";

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

  return (
    <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {loading && Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-[330px] animate-pulse rounded-2xl bg-white/70 shadow-sm" />
      ))}
      {!loading && posts.length === 0 && (
        <div className="col-span-full rounded-2xl border border-dashed border-[#CCD5C6] bg-white/70 px-6 py-12 text-center text-sm text-[#727974]">
          {t("No recipe posts have been published yet.", "Chưa có bài công thức nào được đăng.")}
        </div>
      )}
      {posts.map((post) => (
        <Link key={post.postId} href={`/view-detail/${post.postId}`} className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#EFEEEB]">
            <FeedImage key={post.thumbnailUrl || fallbackImage} src={post.thumbnailUrl || fallbackImage} alt={post.title} compact />
            {post.videoUrl && (
              <span className="absolute bottom-2.5 right-2.5 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                {t("Video", "Video")}
              </span>
            )}
          </div>
          <div className="p-4">
            <h3 className="line-clamp-2 font-serif text-lg font-semibold leading-snug text-[#07241A]">{localizeRecipeTitle(post.title, language)}</h3>
            <p className="mt-1 text-xs text-[#424844]">{t("by", "bởi")} {post.authorName}</p>
            <div className="mt-3 flex items-center justify-between border-t border-[#EFEEEB] pt-3 text-xs">
              <div className="flex items-center gap-1 text-[#F59E0B]">
                <span>★</span>
                <span className="font-semibold text-[#1B1C1A]">{post.averageRating ? post.averageRating.toFixed(1) : t("New", "Mới")} / 5</span>
                <span className="text-[#727974]">· {post.ratingCount} {t("ratings", "đánh giá")}</span>
              </div>
            </div>
            <div className="mt-1.5 flex items-center gap-1 text-[11px] text-[#727974]">
              <span>💬 {post.commentCount} {t("comments", "bình luận")}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
