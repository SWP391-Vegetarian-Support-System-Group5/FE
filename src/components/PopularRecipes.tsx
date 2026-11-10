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

export default function PopularRecipes() {
  const { language, locale, t } = useLanguage();
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    let latestRequest = 0;
    const load = async () => {
      const request = ++latestRequest;
      try {
        const posts = await listPosts({ postType: "RECIPE", limit: 4 });
        if (active && request === latestRequest) {
          setPosts(posts);
          setFailed(false);
        }
      } catch {
        if (active && request === latestRequest) setFailed(true);
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
  }, [revision]);

  const retry = () => {
    setLoading(true);
    setRevision(value => value + 1);
  };
  const numbers = new Intl.NumberFormat(locale);
  const ratings = new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  if (loading) return <CardSkeleton count={4} compact />;

  return (
    <div className="mt-8">
      {failed && <div role="status" className="vm-feedback mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#DDDCCF] bg-white px-5 py-4 text-sm text-[#59635C]">
        <span>{t("Recipes could not be refreshed. Please try again.", "Chưa tải được công thức mới. Bạn thử lại nhé.")}</span>
        <button type="button" onClick={retry} className="vm-button inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#EAF1E7] px-4 font-medium text-[#254B38] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#254B38]">
          <ContentIcon name="refresh" width="15" height="15" />{t("Try again", "Thử tải lại")}
        </button>
      </div>}
      <div className="vm-stagger grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {!failed && posts.length === 0 && (
        <div role="status" className="col-span-full flex flex-col items-center rounded-3xl border border-dashed border-[#CCD5C6] bg-white/70 px-6 py-12 text-center">
          <span aria-hidden="true" className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E6EFE2] text-[#527244]"><ContentIcon name="recipe" width="24" height="24" /></span>
          <p className="font-serif text-xl font-medium text-[#1E3A2F]">{t("A new recipe is on its way", "Chờ một công thức mới")}</p>
          <p className="mt-2 text-sm text-[#59635C]">{t("No recipe posts have been published yet.", "Chưa có bài công thức nào được đăng.")}</p>
        </div>
      )}
      {posts.map((post) => {
        const storedImage = post.imageUrl ?? post.thumbnailUrl;
        const imageSource = storedImage ? getMediaUrl(storedImage) : null;
        return <Link key={post.postId} href={`/view-detail/${post.postId}`} className="vm-card vm-enter group flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-[#E0E5DA] bg-white shadow-[0_3px_12px_#1e3a2f05] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#527244]">
          <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden bg-[#EDF1E8]">
            {imageSource ? <FeedImage key={imageSource} src={imageSource} alt={post.title} compact /> : <span role="img" aria-label={t("No recipe image yet", "Công thức chưa có ảnh")} className="flex flex-col items-center gap-3 text-xs text-[#658266]">
              <ContentIcon name="recipe" width="36" height="36" />{t("No image yet", "Chưa có ảnh")}
            </span>}
            {post.videoUrl && (
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-medium text-[#254B38] shadow-sm">
                <ContentIcon name="video" width="12" height="12" />{t("Cooking video", "Video nấu ăn")}
              </span>
            )}
          </div>
          <div className="flex flex-1 flex-col p-4 sm:p-5">
            <h3 className="line-clamp-2 min-h-12 font-serif text-lg font-semibold leading-6 text-[#07241A]">{localizeRecipeTitle(post.title, language)}</h3>
            <p className="mt-2 truncate text-xs text-[#59635C]">{t("by", "bởi")} {post.authorName}</p>
            {post.caloriesPerServing != null && post.caloriesPerServing > 0 && <p className="mt-2 text-xs font-medium text-[#527244]">~ {numbers.format(Math.round(post.caloriesPerServing))} {t("kcal/serving", "kcal/khẩu phần")}</p>}
            <div className="mt-auto pt-4">
              <div className="flex items-center justify-between gap-2 border-t border-[#EAEDE5] pt-3">
                <div className="min-w-0 space-y-1 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5 text-[#BB7A24]">
                    <ContentIcon name="star" width="13" height="13" fill="currentColor" />
                    <span className="font-semibold text-[#1E3A2F]">{post.ratingCount > 0 ? `${ratings.format(post.averageRating)} / 5` : t("New", "Mới")}</span>
                    <span className="text-[#727974]">({numbers.format(post.ratingCount)} {t("ratings", "đánh giá")})</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#727974]">
                    <ContentIcon name="message" width="12" height="12" />{numbers.format(post.commentCount)} {t("comments", "bình luận")}
                  </div>
                </div>
                <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F1F5ED] text-[#527244] transition-colors duration-200 group-hover:bg-[#254B38] group-hover:text-white group-focus-visible:bg-[#254B38] group-focus-visible:text-white">
                  <ContentIcon name="arrow" width="16" height="16" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      })}
      </div>
    </div>
  );
}
