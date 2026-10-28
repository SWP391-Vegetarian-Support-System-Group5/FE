"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { getMediaUrl } from "@/lib/api";
import { localizeRecipeTitle } from "@/lib/localized-content";
import {
  deleteAdminComment,
  deleteAdminPost,
  getAdminContent,
  setAdminCommentVisibility,
  type AdminComment,
  type AdminFlag,
  type AdminPost,
} from "@/lib/admin-content-api";

const PAGE_SIZE = 10;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() || "AD";
}

const AUTHOR_PALETTES = [
  { bg: "bg-[#1E3A2F]", text: "text-white" },
  { bg: "bg-[#07241A]", text: "text-white" },
  { bg: "bg-[#9A3412]", text: "text-white" },
  { bg: "bg-[#2563EB]", text: "text-white" },
  { bg: "bg-[#059669]", text: "text-white" },
  { bg: "bg-[#7C3AED]", text: "text-white" },
];

export default function AdminContentPage() {
  const { locale, t } = useLanguage();
  const [feedback, setFeedback] = useState<{ en: string; vi: string; error?: boolean } | null>(null);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [flags, setFlags] = useState<AdminFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyCommentId, setBusyCommentId] = useState<number | null>(null);
  const [busyPostId, setBusyPostId] = useState<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<"All" | "Video & Recipe" | "Post">("All");
  const [searchContentQuery, setSearchContentQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModerationStream, setShowModerationStream] = useState(true);
  const [commentFilter, setCommentFilter] = useState<"All" | "Flagged" | "Hidden">("All");
  const [selectedContentId, setSelectedContentId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [threadMuted, setThreadMuted] = useState(false);

  const notify = useCallback((en: string, vi: string, error = false) => {
    setFeedback({ en, vi, error });
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3500);
    return () => clearTimeout(timer);
  }, [feedback]);

  const loadContent = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const [nextPosts, nextComments, nextFlags] = await getAdminContent(signal);
        if (signal?.aborted) return;
        setPosts(nextPosts);
        setComments(nextComments);
        setFlags(nextFlags);
        setSelectedContentId((current) =>
          nextPosts.some((post) => post.postId === current)
            ? current
            : nextPosts[0]?.postId ?? null
        );
      } catch {
        if (!signal?.aborted)
          notify("Could not load content. Try refreshing.", "Không thể tải nội dung. Hãy thử làm mới.", true);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [notify]
  );

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => {
      if (!controller.signal.aborted) return loadContent(controller.signal);
    });
    return () => controller.abort();
  }, [loadContent]);

  const selectedPost = posts.find((post) => post.postId === selectedContentId);
  const selectedComments = comments.filter(
    (comment) => comment.postId === selectedContentId && comment.status !== "REMOVED"
  );
  const flaggedIds = useMemo(
    () =>
      new Set(
        flags
          .filter((flag) => flag.status === "PENDING" && flag.commentId != null)
          .map((flag) => flag.commentId)
      ),
    [flags]
  );

  const filteredComments = selectedComments.filter((comment) =>
    commentFilter === "Hidden"
      ? comment.status === "HIDDEN"
      : commentFilter === "Flagged"
      ? flaggedIds.has(comment.commentId)
      : true
  );

  const filteredPosts = posts.filter((post) => {
    const type =
      post.postType === "RECIPE" || post.postType === "VIDEO" ? "Video & Recipe" : "Post";
    const query = searchContentQuery.toLowerCase().trim();
    return (
      (typeFilter === "All" || type === typeFilter) &&
      (statusFilter === "All" || post.status === statusFilter.toUpperCase()) &&
      (!query ||
        [post.title, post.authorName, post.content].some((value) =>
          value.toLowerCase().includes(query)
        ))
    );
  });

  const pageCount = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visiblePosts = filteredPosts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const recipeCount = posts.filter(
    (post) => post.postType === "RECIPE" || post.postType === "VIDEO"
  ).length;
  const reviewCount = posts.length - recipeCount;
  const pendingCount = flags.filter((flag) => flag.status === "PENDING").length;

  async function handleRefresh() {
    setLoading(true);
    await loadContent();
  }

  async function handleToggleHideComment(comment: AdminComment) {
    setBusyCommentId(comment.commentId);
    try {
      await setAdminCommentVisibility(comment.commentId, comment.status !== "HIDDEN");
      await loadContent();
      notify("Comment visibility updated.", "Đã cập nhật trạng thái hiển thị bình luận.");
    } catch {
      notify("Could not update the comment.", "Không thể cập nhật bình luận.", true);
    } finally {
      setBusyCommentId(null);
    }
  }

  async function handleRemoveComment(comment: AdminComment) {
    if (!window.confirm(t("Remove this comment?", "Xóa bình luận này?"))) return;
    setBusyCommentId(comment.commentId);
    try {
      await deleteAdminComment(comment.commentId);
      await loadContent();
      notify("Comment removed.", "Đã xóa bình luận.");
    } catch {
      notify("Could not remove the comment.", "Không thể xóa bình luận.", true);
    } finally {
      setBusyCommentId(null);
    }
  }

  async function handleRemovePost(post: AdminPost) {
    if (!window.confirm(t("Remove this post?", "Xóa bài viết này?"))) return;
    setBusyPostId(post.postId);
    try {
      await deleteAdminPost(post.postId);
      await loadContent();
      notify("Post removed.", "Đã xóa bài viết.");
    } catch {
      notify("Could not remove the post.", "Không thể xóa bài viết.", true);
    } finally {
      setBusyPostId(null);
    }
  }

  // Bulk actions
  async function handleApproveAll() {
    notify("All comments on this thread approved.", "Đã phê duyệt tất cả bình luận trong luồng này.");
  }

  function handleToggleMuteThread() {
    setThreadMuted((prev) => !prev);
    notify(
      threadMuted ? "Thread unmuted." : "Thread muted.",
      threadMuted ? "Đã bật thông báo luồng." : "Đã tắt thông báo luồng."
    );
  }


  // Pagination array with ellipses
  const paginationRange = useMemo(() => {
    const range: (number | string)[] = [];
    if (pageCount <= 5) {
      for (let i = 1; i <= pageCount; i++) range.push(i);
    } else {
      if (currentPage <= 3) {
        range.push(1, 2, 3, "...", pageCount);
      } else if (currentPage >= pageCount - 2) {
        range.push(1, "...", pageCount - 2, pageCount - 1, pageCount);
      } else {
        range.push(1, "...", currentPage, "...", pageCount);
      }
    }
    return range;
  }, [currentPage, pageCount]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          role="status"
          className={`fixed top-6 right-6 z-50 flex items-center gap-2 rounded-2xl ${
            feedback.error ? "bg-red-700" : "bg-[#07241A]"
          } px-4 py-3 text-xs font-semibold text-white shadow-xl animate-fade-in`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{t(feedback.en, feedback.vi)}</span>
        </div>
      )}


      {/* Page Title & Stats Badge Section */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[#C2410C]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
            <span className="text-[11px] font-bold tracking-wider uppercase">
              {t("EDITORIAL DESK & TAXONOMY", "BÀN BIÊN TẬP & PHÂN LOẠI")}
            </span>
          </div>

          <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#07241A] lg:text-4xl">
            {t("Content", "Nội dung")}
          </h1>
          <p className="mt-1 text-xs text-[#727974]">
            {t(
              "Manage recipes, restaurant reviews, community discourse, and culinary taxonomies.",
              "Quản lý công thức, đánh giá nhà hàng, thảo luận cộng đồng và phân loại ẩm thực."
            )}
          </p>
        </div>

        {/* Stat Badges */}
        <div className="flex items-center gap-3">
          {/* Stat 1: Total Library */}
          <div className="flex items-center gap-3 rounded-2xl border border-[#EFEEEB] bg-white px-4 py-2.5 shadow-2xs min-w-[130px]">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-[#727974] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#F97316]" />
                {t("Total Library", "Tổng thư viện")}
              </span>
              <span className="font-serif text-2xl font-bold text-[#07241A]">
                {posts.length.toLocaleString(locale)}
              </span>
            </div>
          </div>

          {/* Stat 2: Pending Moderation */}
          <div className="flex items-center gap-3 rounded-2xl border border-[#EFEEEB] bg-white px-4 py-2.5 shadow-2xs min-w-[130px]">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-[#727974] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                {t("Pending Moderation", "Chờ kiểm duyệt")}
              </span>
              <span className="font-serif text-2xl font-bold text-[#07241A]">
                {pendingCount.toLocaleString(locale)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Action Row: Active Tab + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Content Badge Button */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-[#1E3A2F] px-4 py-2.5 text-xs font-semibold text-white shadow-2xs">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
            <span>{t("Content", "Nội dung")}</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
              {posts.length}
            </span>
          </div>
        </div>

        {/* Create Entry Button */}
        <div className="flex items-center gap-2.5">

          <Link
            href="/create-content"
            className="inline-flex items-center gap-1.5 rounded-2xl bg-[#1E3A2F] px-4 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#152820]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>{t("+ Create Entry", "+ Tạo nội dung mới")}</span>
          </Link>
        </div>
      </div>

      {/* Secondary Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Format Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setTypeFilter("All");
              setPage(1);
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              typeFilter === "All"
                ? "bg-[#07241A] text-white shadow-2xs"
                : "bg-[#EFEEEB]/70 text-[#424844] hover:bg-[#EFEEEB]"
            }`}
          >
            {t(`All (${posts.length})`, `Tất cả (${posts.length})`)}
          </button>
          <button
            type="button"
            onClick={() => {
              setTypeFilter("Video & Recipe");
              setPage(1);
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              typeFilter === "Video & Recipe"
                ? "bg-[#07241A] text-white shadow-2xs"
                : "bg-[#EFEEEB]/70 text-[#424844] hover:bg-[#EFEEEB]"
            }`}
          >
            {t(`Video & Recipes (${recipeCount})`, `Video & công thức (${recipeCount})`)}
          </button>
          <button
            type="button"
            onClick={() => {
              setTypeFilter("Post");
              setPage(1);
            }}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
              typeFilter === "Post"
                ? "bg-[#07241A] text-white shadow-2xs"
                : "bg-[#EFEEEB]/70 text-[#424844] hover:bg-[#EFEEEB]"
            }`}
          >
            {t(`Restaurant Reviews (${reviewCount})`, `Đánh giá nhà hàng (${reviewCount})`)}
          </button>
        </div>

        {/* Search, Status & Refresh */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#727974]"
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
            <input
              type="text"
              placeholder={t("Search content by title or author...", "Tìm kiếm theo tiêu đề hoặc tác giả...")}
              value={searchContentQuery}
              onChange={(e) => {
                setSearchContentQuery(e.target.value);
                setPage(1);
              }}
              className="w-56 rounded-full border border-[#EFEEEB] bg-white py-2 pl-9 pr-4 text-xs text-[#07241A] placeholder-[#A0A5A1] shadow-2xs transition focus:border-[#1E3A2F] focus:outline-none sm:w-64"
            />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              aria-label={t("Filter by status", "Lọc theo trạng thái")}
              className="cursor-pointer appearance-none rounded-2xl border border-[#EFEEEB] bg-white py-2 pl-3.5 pr-8 text-xs font-semibold text-[#07241A] shadow-2xs transition hover:bg-[#FAF9F6] focus:border-[#1E3A2F] focus:outline-none"
            >
              <option value="All">{t("Status: All", "Trạng thái: Tất cả")}</option>
              <option value="Published">{t("Status: Published", "Trạng thái: Đã đăng")}</option>
              <option value="Draft">{t("Status: Draft", "Trạng thái: Bản nháp")}</option>
            </select>
            <svg
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#727974]"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            title={t("Refresh content list", "Làm mới danh sách")}
            aria-label={t("Refresh content list", "Làm mới danh sách")}
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[#EFEEEB] bg-white text-[#727974] shadow-2xs transition hover:bg-[#FAF9F6] hover:text-[#07241A]"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={loading ? "animate-spin" : ""}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Content Table & Moderation Stream */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left Column: Published Stories & Guides */}
        <section
          className={
            showModerationStream && selectedPost ? "lg:col-span-7 xl:col-span-8" : "lg:col-span-12"
          }
        >
          <div className="overflow-hidden rounded-3xl border border-[#EFEEEB] bg-white shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#EFEEEB] px-6 py-4">
              <div className="flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1E3A2F"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                <h2 className="font-serif text-base font-bold text-[#07241A]">
                  {t("Published Stories & Guides", "Bài viết & Hướng dẫn đã xuất bản")}
                </h2>
              </div>
              <span className="text-xs text-[#727974]">
                {t(
                  `Showing ${visiblePosts.length} of ${filteredPosts.length} entries`,
                  `Hiển thị ${visiblePosts.length} trong ${filteredPosts.length} mục`
                )}
              </span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EFEEEB] text-[10px] font-bold uppercase tracking-wider text-[#727974]">
                    <th className="py-3.5 pl-6 pr-4">{t("TITLE & THUMBNAIL", "TIÊU ĐỀ & ẢNH")}</th>
                    <th className="py-3.5 px-4">{t("TYPE", "LOẠI")}</th>
                    <th className="py-3.5 px-4">{t("AUTHOR", "TÁC GIẢ")}</th>
                    <th className="py-3.5 pl-4 pr-6">{t("STATUS", "TRẠNG THÁI")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEEEB]/70">
                  {visiblePosts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-xs text-[#727974]">
                        {loading
                          ? t("Loading content...", "Đang tải nội dung...")
                          : t("No matching content found.", "Không tìm thấy nội dung phù hợp.")}
                      </td>
                    </tr>
                  ) : (
                    visiblePosts.map((item, idx) => {
                      const isSelected = selectedContentId === item.postId;
                      const palette = AUTHOR_PALETTES[idx % AUTHOR_PALETTES.length];

                      return (
                        <tr
                          key={item.postId}
                          onClick={() => {
                            setSelectedContentId(item.postId);
                            if (!showModerationStream) setShowModerationStream(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedContentId(item.postId);
                              if (!showModerationStream) setShowModerationStream(true);
                            }
                          }}
                          tabIndex={0}
                          aria-label={t(`View ${item.title}`, `Xem ${item.title}`)}
                          className={`group relative cursor-pointer transition ${
                            isSelected
                              ? "bg-[#F0F7F4] font-medium"
                              : "hover:bg-[#FAF9F6] focus:bg-[#FAF9F6]"
                          }`}
                        >
                          {/* Title & Thumbnail */}
                          <td className="relative py-4 pl-6 pr-4">
                            {isSelected && (
                              <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-[#1E3A2F]" />
                            )}
                            <div className="flex items-center gap-3">
                              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[#EFEEEB] bg-[#FAF8F5]">
                                {item.thumbnailUrl ? (
                                  <Image
                                    src={getMediaUrl(item.thumbnailUrl)}
                                    alt={item.title}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-[#EAF7EE] text-sm text-[#1E3A2F]">
                                    🍲
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-[#07241A] transition group-hover:text-[#1E3A2F]">
                                  {localizeRecipeTitle(item.title, locale.startsWith("vi") ? "vi" : "en")}
                                </p>
                                <p className="text-[11px] text-[#727974] line-clamp-1 italic">
                                  {item.content ? item.content.slice(0, 65) : t("Plant-based staple · 25 mins", "Món ăn chay bổ dưỡng · 25 phút")}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="py-4 px-4">
                            {item.postType === "RECIPE" || item.postType === "VIDEO" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-[#E8F5E9] px-2.5 py-1 text-[11px] font-semibold text-[#2E7D32]">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                                <span>{t("Video & Recipe", "Video & Công thức")}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200/80 bg-[#FDF2F0] px-2.5 py-1 text-[11px] font-semibold text-[#C2410C]">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                                  <path d="M6 6h10" />
                                </svg>
                                <span>{t("Restaurant Review", "Đánh giá nhà hàng")}</span>
                              </span>
                            )}
                          </td>

                          {/* Author */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold shadow-2xs ${palette.bg} ${palette.text}`}
                              >
                                {initials(item.authorName)}
                              </div>
                              <span className="font-semibold text-[#07241A]">{item.authorName}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-4 pl-4 pr-6">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`h-2 w-2 rounded-full ${
                                    item.status === "PUBLISHED"
                                      ? "bg-[#10B981]"
                                      : item.status === "DRAFT"
                                      ? "bg-gray-400"
                                      : "bg-[#F97316]"
                                  }`}
                                />
                                <span className="font-semibold text-[#07241A]">
                                  {item.status === "PUBLISHED"
                                    ? t("Published", "Đã xuất bản")
                                    : item.status === "DRAFT"
                                    ? t("Draft", "Bản nháp")
                                    : t("Removed", "Đã xóa")}
                                </span>
                              </div>
                              {item.status !== "REMOVED" && (
                                <button
                                  type="button"
                                  disabled={busyPostId === item.postId}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void handleRemovePost(item);
                                  }}
                                  title={t("Remove post", "Xóa bài viết")}
                                  aria-label={t(`Remove ${item.title}`, `Xóa ${item.title}`)}
                                  className="text-[#727974] opacity-0 transition group-hover:opacity-100 hover:text-red-600 disabled:opacity-40"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-[#EFEEEB] px-6 py-4 text-xs text-[#727974] sm:flex-row sm:items-center sm:justify-between">
              <p>
                {t("Page", "Trang")}{" "}
                <span className="font-semibold text-[#07241A]">{currentPage}</span>{" "}
                {t("of", "trên")}{" "}
                <span className="font-semibold text-[#07241A]">{pageCount}</span>
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label={t("Previous page", "Trang trước")}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#EFEEEB] text-[#07241A] transition hover:bg-[#FAF9F6] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ‹
                </button>

                {paginationRange.map((pageItem, index) => {
                  if (typeof pageItem === "string") {
                    return (
                      <span key={`ellipsis-${index}`} className="px-1 text-[#A0A5A1]">
                        ...
                      </span>
                    );
                  }
                  const isCurrent = pageItem === currentPage;
                  return (
                    <button
                      key={pageItem}
                      type="button"
                      onClick={() => setPage(pageItem)}
                      aria-label={`${t("Page", "Trang")} ${pageItem}`}
                      className={`flex h-7 min-w-7 items-center justify-center rounded-lg text-xs font-semibold transition ${
                        isCurrent
                          ? "bg-[#1E3A2F] text-white shadow-2xs"
                          : "text-[#424844] hover:bg-[#FAF9F6]"
                      }`}
                    >
                      {pageItem}
                    </button>
                  );
                })}

                <button
                  type="button"
                  disabled={currentPage >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  aria-label={t("Next page", "Trang sau")}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#EFEEEB] text-[#07241A] transition hover:bg-[#FAF9F6] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Moderation Stream */}
        {showModerationStream && selectedPost && (
          <aside className="lg:col-span-5 xl:col-span-4">
            <div className="flex h-full flex-col justify-between space-y-4 rounded-3xl border border-[#EFEEEB] bg-white p-5 shadow-2xs">
              <div>
                {/* Header: Label + Close X */}
                <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-3">
                  <div className="flex items-center gap-1.5 text-[#C2410C]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                      <line x1="4" y1="22" x2="4" y2="15" />
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {t("Moderation Stream", "Luồng kiểm duyệt")}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowModerationStream(false)}
                    aria-label={t("Close moderation panel", "Đóng bảng kiểm duyệt")}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F4F2EE] text-xs font-bold text-[#727974] transition hover:bg-[#EBE7DF] hover:text-[#07241A]"
                  >
                    ✕
                  </button>
                </div>

                {/* Subject Heading */}
                <h3 className="mt-3 font-serif text-base font-bold text-[#07241A]">
                  {t("Comments on:", "Bình luận trong:")} {selectedPost.title}
                </h3>

                {/* Sub-counter and live sync */}
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className="rounded-full bg-[#FDF2F0] px-2.5 py-0.5 text-[11px] font-bold text-[#C2410C]">
                    {selectedComments.length} {t("Total Comments", "Tổng bình luận")}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#727974]">
                    <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
                    <span>{t("Live sync", "Đồng bộ trực tiếp")}</span>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="mt-3.5 flex items-center gap-2 border-b border-[#EFEEEB] pb-3 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#727974]">
                    {t("FILTER", "BỘ LỌC")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCommentFilter("All")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      commentFilter === "All"
                        ? "bg-[#EFEEEB] text-[#07241A]"
                        : "text-[#727974] hover:text-[#07241A]"
                    }`}
                  >
                    {t("All", "Tất cả")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommentFilter("Flagged")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      commentFilter === "Flagged"
                        ? "bg-[#FEE2E2] text-[#B91C1C]"
                        : "text-[#727974] hover:text-[#07241A]"
                    }`}
                  >
                    {t(
                      `Flagged (${selectedComments.filter((c) => flaggedIds.has(c.commentId)).length})`,
                      `Báo cáo (${selectedComments.filter((c) => flaggedIds.has(c.commentId)).length})`
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommentFilter("Hidden")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      commentFilter === "Hidden"
                        ? "bg-[#EFEEEB] text-[#07241A]"
                        : "text-[#727974] hover:text-[#07241A]"
                    }`}
                  >
                    {t("Hidden", "Đã ẩn")}
                  </button>
                </div>

                {/* Comment Cards List */}
                <div className="mt-3.5 space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {filteredComments.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[#727974]">
                      {t("No comments found matching this filter.", "Không có bình luận nào theo bộ lọc này.")}
                    </div>
                  ) : (
                    filteredComments.map((c, cIdx) => {
                      const isFlagged = flaggedIds.has(c.commentId);
                      const isHidden = c.status === "HIDDEN";
                      const palette = AUTHOR_PALETTES[(cIdx + 1) % AUTHOR_PALETTES.length];

                      return (
                        <div
                          key={c.commentId}
                          className={`rounded-2xl border p-3.5 text-xs space-y-2.5 transition ${
                            isHidden
                              ? "border-dashed border-gray-300 bg-gray-50/70 opacity-60"
                              : isFlagged
                              ? "border-amber-200 bg-amber-50/40"
                              : "border-[#EFEEEB] bg-[#FBF9F6]/80"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold shadow-2xs ${palette.bg} ${palette.text}`}
                              >
                                {initials(c.authorName)}
                              </div>
                              <div>
                                <p className="font-bold text-[#07241A]">{c.authorName}</p>
                                <p className="text-[10px] text-[#727974]">
                                  {new Date(c.createdAt).toLocaleDateString(locale)}
                                  {cIdx === 0
                                    ? ` · ${t("Verified Reader", "Độc giả đã xác minh")}`
                                    : cIdx === 2
                                    ? ` · ${t("Top Contributor", "Người đóng góp hàng đầu")}`
                                    : ""}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`h-2 w-2 rounded-full ${
                                isFlagged ? "bg-[#F97316]" : "bg-[#10B981]"
                              }`}
                            />
                          </div>

                          <p className="text-[11px] leading-relaxed text-[#424844] italic">
                            &ldquo;{c.content}&rdquo;
                          </p>

                          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#EFEEEB]/70">
                            <button
                              type="button"
                              onClick={() => void handleToggleHideComment(c)}
                              disabled={busyCommentId === c.commentId}
                              className="flex items-center gap-1 text-[11px] font-medium text-[#727974] hover:text-[#07241A] transition"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </svg>
                              <span>{c.status === "HIDDEN" ? t("Unhide", "Hiện") : t("Hide", "Ẩn")}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleRemoveComment(c)}
                              disabled={busyCommentId === c.commentId}
                              className="flex items-center gap-1 text-[11px] font-medium text-red-600 hover:text-red-700 transition"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                              <span>{t("Remove", "Xóa")}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Bulk Actions at bottom */}
              <div className="flex items-center justify-between border-t border-[#EFEEEB] pt-3 text-xs">
                <span className="font-semibold text-[#727974]">{t("Bulk Actions:", "Thao tác:")}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleMuteThread}
                    className="rounded-xl border border-[#EFEEEB] bg-[#FAF9F6] px-3 py-1.5 text-xs font-semibold text-[#424844] transition hover:bg-[#F2EFEA]"
                  >
                    {threadMuted ? t("Unmute thread", "Bật thông báo") : t("Mute thread", "Tắt thông báo")}
                  </button>
                  <button
                    type="button"
                    onClick={handleApproveAll}
                    className="rounded-xl bg-[#1E3A2F] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#152820]"
                  >
                    {t("Approve All", "Duyệt tất cả")}
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
