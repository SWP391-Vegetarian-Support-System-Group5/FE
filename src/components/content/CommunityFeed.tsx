"use client";

import { useEffect, useRef, useState } from "react";
import CardSkeleton from "@/components/ui/CardSkeleton";
import FeedImage from "@/components/ui/FeedImage";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRememberedFilters } from "@/hooks/useRememberedFilters";
import { useRememberedScroll } from "@/hooks/useRememberedScroll";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { getStoredToken } from "@/lib/auth";
import { getMediaUrl } from "@/lib/api";
import { bookmarkPost, communityError, getBookmarks, getPostCategories, getPosts, getPostTags, PostApiError, removeBookmark, type CommunityLookup, type PostResponse } from "@/lib/post-api";

export default function CommunityFeed({ keyword = "", bookmarksOnly = false, mineOnly = false, compact = false }: { keyword?: string; bookmarksOnly?: boolean; mineOnly?: boolean; compact?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const pathname = usePathname();
  const scope = `${pathname}:${bookmarksOnly ? "bookmarks" : mineOnly ? "mine" : "community"}:${user?.uid || "guest"}`;
  const [{ category, tag, postType, search }, setFilters] = useRememberedFilters(`${scope}:${keyword}`, { category: "", tag: "", postType: "", search: keyword });
  const setCategory = (category: string) => setFilters(previous => ({ ...previous, category }));
  const setTag = (tag: string) => setFilters(previous => ({ ...previous, tag }));
  const setPostType = (postType: string) => setFilters(previous => ({ ...previous, postType }));
  const setSearch = (search: string) => setFilters(previous => ({ ...previous, search }));
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [bookmarks, setBookmarks] = useState<number[] | null>(null);
  const [categories, setCategories] = useState<CommunityLookup[]>([]);
  const [tags, setTags] = useState<CommunityLookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookmarkError, setBookmarkError] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const [pending, setPending] = useState<number[]>([]);
  const locks = useRef(new Set<number>());

  useRememberedScroll(scope, !loading && !authLoading, !compact);
  useEffect(() => {
    let active = true;
    Promise.all([getPostCategories(), getPostTags()]).then(([c, t]) => { if (active) { setCategories(c); setTags(t); setLookupError(""); } }).catch(e => { if (active) setLookupError(communityError(e)); });
    return () => { active = false; };
  }, [revision]);
  useEffect(() => {
    if (authLoading) return;
    const controller = new AbortController();
    setLoading(true); setError(""); setPosts([]);
    if ((bookmarksOnly || mineOnly) && (!user || !getStoredToken())) {
      setError("Bạn cần đăng nhập để xem nội dung này."); setLoading(false);
      return () => controller.abort();
    }
    const timer = setTimeout(() => {
      const request = bookmarksOnly ? getBookmarks(controller.signal) : getPosts({ keyword: search, category, tag, postType }, controller.signal);
      request.then(data => {
        if (controller.signal.aborted) return;
        setPosts(data.filter(p => p.status === "PUBLISHED" && (!mineOnly || p.userId === user?.userId)));
        if (bookmarksOnly) setBookmarks(data.map(p => p.postId));
      }).catch(e => { if (!controller.signal.aborted) setError(communityError(e)); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [authLoading, user, bookmarksOnly, mineOnly, search, category, tag, postType, revision]);
  useEffect(() => {
    const controller = new AbortController();
    setBookmarks(null);
    if (authLoading || !user || !getStoredToken() || bookmarksOnly) return () => controller.abort();
    getBookmarks(controller.signal).then(data => { if (!controller.signal.aborted) setBookmarks(data.map(p => p.postId)); })
      .catch(e => { if (!controller.signal.aborted) setBookmarkError(communityError(e)); });
    return () => controller.abort();
  }, [user, authLoading, bookmarksOnly, revision]);

  async function toggleBookmark(id: number) {
    if (locks.current.has(id)) return;
    setBookmarkError(""); setNotice("");
    if (!user || !getStoredToken()) { setBookmarkError("Bạn cần đăng nhập để lưu bài."); return; }
    if (bookmarks === null) { setRevision(n => n + 1); return; }
    locks.current.add(id); setPending(ids => [...ids, id]);
    try {
      if (bookmarks.includes(id)) await removeBookmark(id); else await bookmarkPost(id);
      setNotice(bookmarks.includes(id) ? "Đã bỏ lưu bài viết." : "Đã lưu bài viết.");
      setRevision(n => n + 1);
    } catch (e) {
      setBookmarkError(communityError(e));
      if (e instanceof PostApiError && e.status === 409) setRevision(n => n + 1);
    } finally { locks.current.delete(id); setPending(ids => ids.filter(value => value !== id)); }
  }
  const visible = posts.filter(p => !bookmarksOnly || ((!postType || p.postType === postType) && (!category || p.categoryName === category) && (!tag || p.tags.includes(tag)) && `${p.title} ${p.content} ${p.authorName}`.toLowerCase().includes(search.toLowerCase())));
  const input = "rounded-xl border border-[#E5E7DF] bg-[#FBF9F6] px-4 py-2.5 text-sm outline-none focus:border-[#254B38]";
  return <section className="text-[#07241A]">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#EFEEEB] pb-4">
      <div><h2 className="font-serif text-3xl font-medium">{bookmarksOnly ? "My Collection · Bài đã lưu" : mineOnly ? "My Content · Bài viết của tôi" : "Community · Cộng đồng"}</h2><p className="mt-2 text-sm text-[#727974]">{bookmarksOnly ? "Các bài viết bạn đã bookmark." : "Chia sẻ, thảo luận và khám phá cùng cộng đồng ăn chay."}</p></div>
      <Link href="/create-content" className="vm-button rounded-xl bg-[#254B38] px-5 py-2.5 text-sm font-semibold text-white">Tạo bài viết</Link>
    </div>
    {!compact && <div className="my-6 flex flex-wrap gap-3">
      <input aria-label="Tìm bài viết" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm bài viết…" className={`${input} min-w-48 flex-1`} />
      <select aria-label="Loại bài" value={postType} onChange={e => setPostType(e.target.value)} className={input}><option value="">Tất cả loại bài</option>{["BLOG", "QUESTION", "RECIPE", "VIDEO"].map(type => <option key={type}>{type}</option>)}</select>
      <select aria-label="Danh mục" value={category} onChange={e => setCategory(e.target.value)} className={input}><option value="">Tất cả danh mục</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
      <select aria-label="Thẻ" value={tag} onChange={e => setTag(e.target.value)} className={input}><option value="">Tất cả thẻ</option>{tags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}</select>
      {(search || category || tag || postType) && <button type="button" onClick={() => setFilters({ search: "", category: "", tag: "", postType: "" })} className="vm-button rounded-full px-3 py-2 text-xs font-semibold text-[#99462A] underline underline-offset-4">{t("Clear filters", "Xóa bộ lọc")}</button>}
    </div>}
    {(error || bookmarkError || lookupError) && <div role="alert" className="my-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error || bookmarkError || lookupError} <Link href="/login" className="underline">Đăng nhập</Link><button onClick={() => { setBookmarkError(""); setRevision(n => n + 1); }} className="ml-4 underline">Thử lại</button></div>}
    {notice && <p role="status" className="vm-feedback mt-4 rounded-xl border border-[#CCDCCB] bg-[#E8F0E5] px-4 py-3 text-sm text-[#254B38]">{notice}</p>}
    {loading ? <CardSkeleton count={compact ? 4 : 3} compact={compact} /> : !error && !visible.length ? <p className="vm-enter rounded-3xl border border-[#EFEEEB] bg-white p-10 text-center text-[#727974]">Chưa có bài viết phù hợp.</p> : <div className={`vm-stagger mt-7 grid gap-6 sm:grid-cols-2 ${compact ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
      {(compact ? visible.slice(0, 4) : visible).map(post => <article key={post.postId} className="vm-card vm-enter group overflow-hidden rounded-3xl border border-[#EFEEEB] bg-white shadow-xs">
        <div className="relative aspect-[16/10] overflow-hidden bg-[#E8EDE4]">
          <Link href={`/view-detail/post-${post.postId}`} className="absolute inset-0 flex items-center justify-center">
            {post.thumbnailUrl ? <FeedImage key={post.thumbnailUrl} src={getMediaUrl(post.thumbnailUrl)} alt={post.title} compact={compact} /> : <span className="font-serif text-xl text-[#658266]">{post.postType}</span>}
          </Link>
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs">★ {post.averageRating.toFixed(1)} / 5</span>
          <button type="button" aria-label={bookmarks?.includes(post.postId) ? "Bỏ lưu bài" : "Lưu bài"} aria-pressed={bookmarks?.includes(post.postId) || false} disabled={pending.includes(post.postId) || authLoading || (!!user && !!getStoredToken() && bookmarks === null)} onClick={() => toggleBookmark(post.postId)} className="vm-button absolute right-3 top-3 rounded-full bg-white/90 px-3 py-2 text-sm disabled:opacity-40">{pending.includes(post.postId) ? "…" : bookmarks?.includes(post.postId) ? "🔖" : "♡"}</button>
        </div>
        <div className="p-5"><p className="text-xs text-[#727974]">{post.categoryName || post.postType}</p><Link href={`/view-detail/post-${post.postId}`}><h3 className="mt-2 line-clamp-2 font-serif text-xl font-semibold">{post.title}</h3></Link><p className="mt-2 line-clamp-2 text-sm text-[#59635C]">{post.content}</p><p className="mt-4 border-t border-[#EFEEEB] pt-3 text-xs">{post.authorName}</p><div className="mt-3 flex flex-wrap gap-2">{post.tags.map(tag => <span key={tag} className="rounded-full bg-[#F1F4EC] px-2 py-1 text-xs">#{tag}</span>)}</div></div>
      </article>)}
    </div>}
  </section>;
}
