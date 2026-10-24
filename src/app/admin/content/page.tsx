"use client";

import UiText, { useUiText } from "@/components/UiText";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getMediaUrl } from "@/lib/api";
import { localizeRecipeTitle } from "@/lib/localized-content";
import {
  deleteAdminComment, deleteAdminPost, getAdminContent, setAdminCommentVisibility,
  type AdminComment, type AdminFlag, type AdminPost,
} from "@/lib/admin-content-api";

const PAGE_SIZE = 10;

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase() || "?";
}

export default function AdminContentPage() {
  const ui = useUiText();
  const { locale, t } = useLanguage();
  const { user } = useAuth();
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

  const notify = useCallback((en: string, vi: string, error = false) => setFeedback({ en, vi, error }), []);
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 3500);
    return () => clearTimeout(timer);
  }, [feedback]);

  const loadContent = useCallback(async (signal?: AbortSignal) => {
    try {
      const [nextPosts, nextComments, nextFlags] = await getAdminContent(signal);
      if (signal?.aborted) return;
      setPosts(nextPosts);
      setComments(nextComments);
      setFlags(nextFlags);
      setSelectedContentId(current => nextPosts.some(post => post.postId === current) ? current : nextPosts[0]?.postId ?? null);
    } catch {
      if (!signal?.aborted) notify("Could not load content. Try refreshing.", "Không thể tải nội dung. Hãy thử làm mới.", true);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => { if (!controller.signal.aborted) return loadContent(controller.signal); });
    return () => controller.abort();
  }, [loadContent]);

  const selectedPost = posts.find(post => post.postId === selectedContentId);
  const selectedComments = comments.filter(comment => comment.postId === selectedContentId && comment.status !== "REMOVED");
  const flaggedIds = useMemo(() => new Set(flags.filter(flag => flag.status === "PENDING" && flag.commentId != null).map(flag => flag.commentId)), [flags]);
  const filteredComments = selectedComments.filter(comment =>
    commentFilter === "Hidden" ? comment.status === "HIDDEN" :
    commentFilter === "Flagged" ? flaggedIds.has(comment.commentId) : true
  );
  const filteredPosts = posts.filter(post => {
    const type = post.postType === "RECIPE" || post.postType === "VIDEO" ? "Video & Recipe" : "Post";
    const query = searchContentQuery.toLowerCase().trim();
    return (typeFilter === "All" || type === typeFilter)
      && (statusFilter === "All" || post.status === statusFilter.toUpperCase())
      && (!query || [post.title, post.authorName, post.content].some(value => value.toLowerCase().includes(query)));
  });
  const pageCount = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visiblePosts = filteredPosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const publishedCount = posts.filter(post => post.status === "PUBLISHED").length;
  const recipeCount = posts.filter(post => post.postType === "RECIPE" || post.postType === "VIDEO").length;
  const pendingCount = flags.filter(flag => flag.status === "PENDING").length;

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

  function handleExportCSV() {
    const rows = [["ID", "Title", "Type", "Author", "Status", "Comments"], ...filteredPosts.map(post =>
      [String(post.postId), post.title, post.postType, post.authorName, post.status, String(post.commentCount)]
    )];
    const csv = rows.map(row => row.map(value => `"${value.replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    link.download = `veggiemate_content_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl ${feedback.error ? "bg-red-700" : "bg-[#07241A]"} px-4 py-3 text-xs font-semibold text-white shadow-xl animate-fade-in`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span role="status">{t(feedback.en, feedback.vi)}</span>
        </div>
      )}

      {/* Top Bar Header */}
      <div className="flex items-center justify-between border-b border-[#EFEEEB] pb-4">
        {/* Breadcrumb: VeggieMate / Admin Area */}
        <div className="flex items-center gap-2">
          <Link href="/" className="font-serif text-xl font-bold tracking-tight text-[#07241A] hover:opacity-80">
            VeggieMate
          </Link>
          <span className="text-[#A0A5A1]">/</span>
          <div className="flex items-center gap-1.5 rounded-full border border-[#EFEEEB] bg-white px-2.5 py-1 text-xs font-medium text-[#424844] shadow-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1E3A2F]">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            </svg>
            <span><UiText text={"Admin Area"} /></span>
          </div>
        </div>

        {/* Right Search, Lang & Admin Info */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder={ui("Search content by title or author...")}
              value={searchContentQuery}
              onChange={event => { setSearchContentQuery(event.target.value); setPage(1); }}
              className="w-60 rounded-full border border-[#EFEEEB] bg-white py-1.5 pl-8 pr-4 text-xs text-[#07241A] placeholder-[#A0A5A1] shadow-sm focus:border-[#1E3A2F] focus:outline-none"
            />
            <svg
              className="absolute left-2.5 top-2 text-[#727974]"
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
          </div>


          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[#1E3A2F] text-white flex items-center justify-center text-xs font-bold shadow-sm">
              AD
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <p className="text-xs font-bold text-[#07241A]">{user?.displayName || user?.fullName || "Admin"}</p>
              <p className="text-[10px] text-[#727974]"><UiText text={"Supervisor"} /></p>
            </div>
          </div>
        </div>
      </div>

      {/* Page Title & Stats Badge Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          {/* Label / Section Tag */}
          <div className="flex items-center gap-1.5 text-[#C2410C] mb-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
            <span className="text-[11px] font-bold tracking-wider uppercase"><UiText text={"Editorial Desk"} /></span>
          </div>

          <h1 className="font-serif text-3xl lg:text-4xl font-bold tracking-tight text-[#07241A]">
            {t("Content Management", "Quản lý nội dung")}
          </h1>
          <p className="mt-1 text-xs text-[#727974]">
            {t("Manage recipes, posts, and community discourse.", "Quản lý công thức, bài viết và thảo luận cộng đồng.")}
          </p>
        </div>

        {/* Stat Badges */}
        <div className="flex items-center gap-3">
          {/* Stat 1: Total Library */}
          <div className="flex items-center gap-3 rounded-2xl border border-[#EFEEEB] bg-white px-4 py-3 shadow-sm min-w-[130px]">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-[#727974] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#F97316]" /><UiText text={"Total Library"} /></span>
              <span className="font-serif text-2xl font-bold text-[#07241A]">{posts.length}</span>
            </div>
          </div>

          {/* Stat 2: Pending Moderation */}
          <div className="flex items-center gap-3 rounded-2xl border border-[#EFEEEB] bg-white px-4 py-3 shadow-sm min-w-[130px]">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-[#727974] flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#10B981]" /><UiText text={"Pending Moderation"} /></span>
              <span className="font-serif text-2xl font-bold text-[#07241A]">{pendingCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Header Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Left Badge: Content items count */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-[#1E3A2F] px-4 py-2 text-xs font-semibold text-white shadow-sm">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
            <span><UiText text={"All Published Content"} /></span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
              {publishedCount}
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-xl border border-[#EFEEEB] bg-white px-3.5 py-2 text-xs font-semibold text-[#07241A] shadow-sm hover:bg-gray-50 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" y2="3" />
            </svg>
            <span><UiText text={"Export CSV"} /></span>
          </button>


        </div>
      </div>

      {/* Secondary Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Quick Format Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setTypeFilter("All"); setPage(1); }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              typeFilter === "All"
                ? "bg-[#07241A] text-white shadow-sm"
                : "bg-[#EFEEEB]/70 text-[#424844] hover:bg-[#EFEEEB]"
            }`}
          >{t(`All (${posts.length})`, `Tất cả (${posts.length})`)}</button>
          <button
            onClick={() => { setTypeFilter("Video & Recipe"); setPage(1); }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              typeFilter === "Video & Recipe"
                ? "bg-[#07241A] text-white shadow-sm"
                : "bg-[#EFEEEB]/70 text-[#424844] hover:bg-[#EFEEEB]"
            }`}
          >{t(`Video & Recipes (${recipeCount})`, `Video & công thức (${recipeCount})`)}</button>
          <button
            onClick={() => { setTypeFilter("Post"); setPage(1); }}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
              typeFilter === "Post"
                ? "bg-[#07241A] text-white shadow-sm"
                : "bg-[#EFEEEB]/70 text-[#424844] hover:bg-[#EFEEEB]"
            }`}
          >
            {t(`Posts (${posts.length - recipeCount})`, `Bài viết (${posts.length - recipeCount})`)}
          </button>
        </div>

        {/* Search, Status & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder={ui("Search content by title or author...")}
              value={searchContentQuery}
              onChange={(e) => { setSearchContentQuery(e.target.value); setPage(1); }}
              className="w-64 rounded-full border border-[#EFEEEB] bg-white py-1.5 pl-8 pr-4 text-xs text-[#07241A] placeholder-[#A0A5A1] shadow-sm focus:border-[#1E3A2F] focus:outline-none"
            />
            <svg
              className="absolute left-2.5 top-2 text-[#727974]"
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
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="appearance-none rounded-xl border border-[#EFEEEB] bg-white py-1.5 pl-3 pr-8 text-xs font-semibold text-[#07241A] shadow-sm focus:border-[#1E3A2F] focus:outline-none cursor-pointer"
            >
              <option value="All"><UiText text={"Status: All"} /></option>
              <option value="Published"><UiText text={"Status: Published"} /></option>
              <option value="Draft"><UiText text={"Status: Draft"} /></option>
            </select>
            <svg
              className="pointer-events-none absolute right-2.5 top-2.5 text-[#727974]"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            title={ui("Refresh content list")}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#EFEEEB] bg-white text-[#727974] shadow-sm hover:bg-gray-50 hover:text-[#07241A] transition"
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
      <div className={`grid grid-cols-1 gap-6 transition-all ${showModerationStream ? "lg:grid-cols-12" : "lg:grid-cols-1"}`}>
        {/* Left Column: Published Stories & Guides */}
        <div className={`space-y-4 ${showModerationStream ? "lg:col-span-7 xl:col-span-8" : "lg:col-span-12"}`}>
          <div className="rounded-2xl border border-[#EFEEEB] bg-white p-5 lg:p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFEEEB]">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1E3A2F]">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                <h2 className="font-serif text-base font-bold text-[#07241A]"><UiText text={"Published Stories & Guides"} /></h2>
              </div>
              <span className="text-xs text-[#727974]"><UiText text={"Showing"} />{" "}{filteredPosts.length}{" "}{t(`of ${posts.length} entries`, `trong ${posts.length} mục`)}</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#EFEEEB] text-[10px] font-bold uppercase tracking-wider text-[#727974]">
                    <th className="py-3 font-bold"><UiText text={"TITLE & THUMBNAIL"} /></th>
                    <th className="py-3 font-bold"><UiText text={"TYPE"} /></th>
                    <th className="py-3 font-bold"><UiText text={"AUTHOR"} /></th>
                    <th className="py-3 font-bold"><UiText text={"STATUS"} /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEEEB]/60 text-xs">
                  {visiblePosts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[#727974]">{loading ? t("Loading content...", "Đang tải nội dung...") : t("No matching content.", "Không tìm thấy nội dung phù hợp.")}</td>
                    </tr>
                  ) : (
                    visiblePosts.map((item) => {
                      const isSelected = selectedContentId === item.postId;
                      return (
                        <tr
                          key={item.postId}
                          onClick={() => {
                            setSelectedContentId(item.postId);
                            if (!showModerationStream) setShowModerationStream(true);
                          }}
                          className={`group cursor-pointer transition ${
                            isSelected
                              ? "bg-[#F3F6F4] font-medium"
                              : "hover:bg-[#FBF9F6]/80"
                          }`}
                        >
                          {/* Title & Thumbnail */}
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-[#EFEEEB]">
                                {item.thumbnailUrl ? <Image
                                  src={getMediaUrl(item.thumbnailUrl)}
                                  alt={item.title}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                /> : <span className="flex h-full items-center justify-center text-[#727974]">•</span>}
                              </div>
                              <div>
                                <p className="font-bold text-[#07241A] group-hover:text-[#1E3A2F] transition">
                                  {localizeRecipeTitle(item.title, "vi")}
                                </p>
                                <p className="text-[11px] italic text-[#727974]">
                                  {item.content.slice(0, 70)}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="py-3.5 pr-4">
                            {item.postType === "RECIPE" || item.postType === "VIDEO" ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F5E9] px-2.5 py-1 text-[11px] font-semibold text-[#2E7D32]">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                                <span><UiText text={"Video & Recipe"} /></span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDF2F0] px-2.5 py-1 text-[11px] font-semibold text-[#C2410C]">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                  <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                                <span>Bài viết</span>
                              </span>
                            )}
                          </td>

                          {/* Author */}
                          <td className="py-3.5 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1E3A2F] text-[10px] font-bold text-white shadow-sm">
                                {initials(item.authorName)}
                              </div>
                              <span className="font-medium text-[#07241A]">{item.authorName}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5">
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
                              <span
                                className={`font-medium ${
                                  item.status === "PUBLISHED"
                                    ? "text-[#07241A]"
                                    : "text-[#727974]"
                                }`}
                              >
                                {t(item.status === "PUBLISHED" ? "Published" : item.status === "DRAFT" ? "Draft" : "Removed", item.status === "PUBLISHED" ? "Đã xuất bản" : item.status === "DRAFT" ? "Bản nháp" : "Đã xóa")}
                              </span>
                              {item.status !== "REMOVED" && <button type="button" disabled={busyPostId === item.postId} onClick={event => { event.stopPropagation(); void handleRemovePost(item); }} title={t("Remove post", "Xóa bài viết")} aria-label={t(`Remove ${item.title}`, `Xóa ${item.title}`)} className="ml-2 text-red-600 hover:text-red-700 disabled:opacity-40">✕</button>}
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
            <div className="mt-4 flex items-center justify-between pt-4 border-t border-[#EFEEEB] text-xs text-[#727974]">
              <span>{t(`Page ${currentPage} of ${pageCount}`, `Trang ${currentPage} / ${pageCount}`)}</span>
              <div className="flex items-center gap-1">
                <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label={t("Previous page", "Trang trước")} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#EFEEEB] disabled:opacity-40">‹</button>
                <span className="px-2 font-bold text-[#07241A]">{currentPage}</span>
                <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label={t("Next page", "Trang sau")} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#EFEEEB] disabled:opacity-40">›</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Moderation Stream */}
        {showModerationStream && selectedPost && (
          <div className="space-y-4 lg:col-span-5 xl:col-span-4">
            <div className="rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-sm flex flex-col justify-between h-full">
              <div>
                {/* Header: Label + Close X */}
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-1.5 text-[#C2410C]">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                      <line x1="4" x2="4" y1="22" y2="15" />
                    </svg>
                    <span className="text-[11px] font-bold tracking-wider uppercase"><UiText text={"Moderation Stream"} /></span>
                  </div>

                  <button
                    onClick={() => setShowModerationStream(false)}
                    title={ui("Hide moderation panel")}
                    className="rounded-lg p-1 text-[#727974] hover:bg-gray-100 hover:text-[#07241A] transition"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Subject Heading */}
                <h3 className="font-serif text-lg font-bold text-[#07241A]"><UiText text={"Comments on:"} />{" "}{selectedPost.title}
                </h3>

                {/* Sub-counter and live sync */}
                <div className="mt-1 flex items-center gap-3 text-xs">
                  <span className="rounded-md bg-[#FDF2F0] px-2 py-0.5 font-semibold text-[#C2410C]">
                    {selectedComments.length}{" "}<UiText text={"Total Comments"} /></span>
                </div>

                {/* Filter Pills */}
                <div className="mt-3.5 flex items-center gap-2 border-b border-[#EFEEEB] pb-3 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#727974]"><UiText text={"FILTER"} /></span>
                  <button
                    onClick={() => setCommentFilter("All")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      commentFilter === "All"
                        ? "bg-[#EFEEEB] text-[#07241A]"
                        : "text-[#727974] hover:text-[#07241A]"
                    }`}
                  ><UiText text={"All"} /></button>
                  <button
                    onClick={() => setCommentFilter("Flagged")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      commentFilter === "Flagged"
                        ? "bg-[#FEE2E2] text-[#B91C1C]"
                        : "text-[#727974] hover:text-[#07241A]"
                    }`}
                  >{t(`Flagged (${selectedComments.filter(comment => flaggedIds.has(comment.commentId)).length})`, `Bị báo cáo (${selectedComments.filter(comment => flaggedIds.has(comment.commentId)).length})`)}</button>
                  <button
                    onClick={() => setCommentFilter("Hidden")}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      commentFilter === "Hidden"
                        ? "bg-[#EFEEEB] text-[#07241A]"
                        : "text-[#727974] hover:text-[#07241A]"
                    }`}
                  ><UiText text={"Hidden"} /></button>
                </div>

                {/* Comment Cards List */}
                <div className="mt-3.5 space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {filteredComments.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#727974]"><UiText text={"Không có bình luận nào theo bộ lọc này."} /></div>
                  ) : (
                    filteredComments.map((c) => (
                      <div
                        key={c.commentId}
                        className={`rounded-xl border p-3 text-xs space-y-2 transition ${
                          c.status === "HIDDEN"
                            ? "border-dashed border-gray-300 bg-gray-50/70 opacity-60"
                            : flaggedIds.has(c.commentId)
                            ? "border-amber-200 bg-amber-50/40"
                            : "border-[#EFEEEB] bg-[#FBF9F6]/60"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1E3A2F] text-[10px] font-bold text-white shadow-sm">
                              {initials(c.authorName)}
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-[#07241A]">{c.authorName}</p>
                              <p className="text-[10px] text-[#727974]">
                                {new Date(c.createdAt).toLocaleDateString(locale)}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`h-2 w-2 rounded-full ${
                              flaggedIds.has(c.commentId) ? "bg-[#F97316]" : "bg-[#10B981]"
                            }`}
                          />
                        </div>

                        <p className="text-[11px] leading-relaxed text-[#424844]">
                          &quot;{c.content}&quot;
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#EFEEEB]/60">
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
                            <span>{c.status === "HIDDEN" ? ui("Unhide") : ui("Hide")}</span>
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
                            <span><UiText text={"Remove"} /></span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>


    </div>
  );
}
