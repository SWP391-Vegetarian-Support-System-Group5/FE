"use client";
import UiText from "@/components/UiText";


import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAdminModeration } from "@/context/AdminModerationContext";
import { useLanguage } from "@/context/LanguageContext";
import { apiGet } from "@/lib/api";

interface AdminPost {
  postId: number; authorName: string; title: string; postType: string; status: string; createdAt: string;
}
interface AdminComment {
  commentId: number; authorName: string; content: string; createdAt: string;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { locale, t } = useLanguage();
  const moderation = useAdminModeration();
  const [users, setUsers] = useState<{ userId: number }[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (user?.role?.toLowerCase() !== "admin") return;
    const controller = new AbortController();
    Promise.all([
      apiGet<{ userId: number }[]>("/api/admin/users", { signal: controller.signal }),
      apiGet<AdminPost[]>("/api/admin/posts", { signal: controller.signal }),
      apiGet<AdminComment[]>("/api/admin/comments", { signal: controller.signal }),
    ]).then(([nextUsers, nextPosts, nextComments]) => {
      setUsers(nextUsers); setPosts(nextPosts); setComments(nextComments); setError(false);
    }).catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [user?.role]);

  const date = (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
  const published = posts.filter(post => post.status.toUpperCase() === "PUBLISHED").length;
  const activities = useMemo(() => [
    ...posts.map(post => ({ id: `p${post.postId}`, author: post.authorName, detail: post.title, kind: post.postType, date: post.createdAt })),
    ...comments.map(comment => ({ id: `c${comment.commentId}`, author: comment.authorName, detail: comment.content, kind: "COMMENT", date: comment.createdAt })),
  ].filter(item => !Number.isNaN(Date.parse(item.date))).sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 4), [posts, comments]);
  const recent = posts.filter(post => `${post.title} ${post.authorName}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 4);

  return <div className="space-y-6">
    <header className="flex items-center justify-between border-b border-[#EFEEEB] pb-4">
      <div className="flex items-center gap-2"><Link href="/" className="font-serif text-xl font-bold text-[#07241A]">VeggieMate</Link><span className="text-[#A0A5A1]">/</span><span className="rounded-full border border-[#EFEEEB] bg-white px-2.5 py-1 text-xs">{t("Admin Area", "Khu vực quản trị")}</span></div>
      <div className="flex items-center gap-4"><input value={search} onChange={event => setSearch(event.target.value)} aria-label={t("Search content", "Tìm nội dung")} placeholder={t("Search admin...", "Tìm kiếm quản trị...")} className="w-60 rounded-full border border-[#EFEEEB] bg-white px-4 py-1.5 text-xs" /><div className="text-right"><p className="text-xs font-bold text-[#07241A]">{user?.fullName || "Quản trị viên"}</p><p className="text-[10px] text-[#727974]">{t("Supervisor", "Quản trị viên")}</p></div><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1E3A2F] text-xs font-bold text-white">AD</div></div>
    </header>
    <div className="pt-2"><p className="text-[11px] font-bold uppercase tracking-wider text-[#2D5A46]">{t("Overview & Moderation", "Tổng quan & Kiểm duyệt")}</p><h1 className="mt-1 font-serif text-3xl font-bold text-[#07241A] lg:text-4xl">{t("Administration", "Quản trị")}</h1><p className="mt-1 text-xs text-[#727974]">{t("Keep the VeggieMate community healthy and organized.", "Giữ cộng đồng VeggieMate lành mạnh và ngăn nắp.")}</p></div>
    {(error || moderation.error) && <p role="alert" className="text-xs text-[#C2410C]">{t("Could not load all dashboard data.", "Không thể tải toàn bộ dữ liệu tổng quan.")}</p>}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        [t("Members", "Thành viên"), users.length, t("Registered members", "Thành viên đã đăng ký")],
        [t("Content", "Nội dung"), published, t("Published posts and recipes", "Bài viết và công thức đã đăng")],
        [t("Needs Review", "Cần duyệt"), moderation.flaggedCount, t("Items needing review", "Nội dung cần duyệt")],
        [t("Discourse", "Thảo luận"), comments.length, t("Total community comments", "Tổng bình luận cộng đồng")],
      ].map(([label, count, description], index) => <div key={label} className="rounded-2xl border border-[#EFEEEB] bg-white p-5 shadow-sm"><span className="text-[11px] font-bold uppercase tracking-wider text-[#727974]">{label}</span><p className="mt-3 font-serif text-3xl font-bold text-[#07241A]">{loading || (index === 2 && moderation.loading) ? "…" : error || (index === 2 && moderation.error) ? "—" : Number(count).toLocaleString(locale)}</p><p className="mt-1 text-xs text-[#727974]">{description}</p></div>)}
    </div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <section className="rounded-2xl border border-[#EFEEEB] bg-white p-6 shadow-sm lg:col-span-7"><div className="flex items-center justify-between border-b border-[#EFEEEB] pb-4"><h2 className="text-sm font-bold text-[#07241A]">{t("Recent Activity", "Hoạt động gần đây")}</h2><Link href="/admin/content" className="text-xs font-semibold text-[#2D5A46] hover:underline">{t("View ledger", "Xem danh sách")} →</Link></div><div className="divide-y divide-[#EFEEEB]/60">{activities.map(item => <div key={item.id} className="flex items-start justify-between gap-3 py-3.5 text-xs"><div><p className="font-bold">{item.author}</p><p className="mt-1 text-[#727974]"><span className="mr-2 rounded-full bg-[#E8F5E9] px-2 py-0.5 text-[10px] font-bold text-[#2E7D32]">{item.kind}</span>{item.detail}</p></div><time className="shrink-0 text-[11px] text-[#A0A5A1]">{date(item.date)}</time></div>)}{!loading && activities.length === 0 && <p className="py-4 text-xs text-[#727974]">{t("No recent activity.", "Chưa có hoạt động gần đây.")}</p>}</div></section>
      <section className="flex flex-col justify-between rounded-2xl border border-[#EFEEEB] bg-white p-6 shadow-sm lg:col-span-5"><div><div className="flex items-center justify-between border-b border-[#EFEEEB] pb-4"><h2 className="text-sm font-bold text-[#07241A]">{t("Moderation Attention", "Nội dung cần kiểm duyệt")}</h2><span className="rounded-full bg-[#FEE2E2] px-2.5 py-0.5 text-[11px] font-bold text-[#C2410C]">{moderation.loading ? "…" : moderation.error ? "—" : moderation.flaggedCount} {t("Pending", "Đang chờ")}</span></div><div className="mt-4 rounded-xl border border-[#FFDDD2] bg-[#FFF6F3] p-4 text-xs text-[#9A3412]"><strong>{moderation.loading ? "…" : moderation.error ? "—" : moderation.flaggedCount} {t("items need review", "nội dung cần duyệt")}</strong></div><p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-wider text-[#727974]">{t("Pending decision queue", "Hàng đợi xử lý")}</p><div className="space-y-2">{[[t("Community Recipes", "Công thức cộng đồng"), moderation.recipesCount], [t("Posts", "Bài viết"), moderation.postsCount], [t("Comments & Discussions", "Bình luận & Thảo luận"), moderation.commentsCount]].map(([label, count]) => <Link key={label} href="/admin/flagged" className="flex items-center justify-between rounded-xl bg-[#FBF9F6] p-3 text-xs font-semibold text-[#07241A]"><span>{label}</span><span>{moderation.loading ? "…" : moderation.error ? "—" : count} ›</span></Link>)}</div></div><Link href="/admin/flagged" className="mt-5 flex justify-center rounded-xl bg-[#1E3A2F] py-3 text-xs font-semibold text-white">{t("Review Flagged Content", "Duyệt nội dung bị báo cáo")}</Link></section>
    </div>
    <section className="rounded-2xl border border-[#EFEEEB] bg-white p-6 shadow-sm"><div className="flex items-center justify-between pb-5"><div><h2 className="font-serif text-lg font-bold text-[#07241A]">{t("Recent Content", "Nội dung gần đây")}</h2><p className="text-xs text-[#727974]">{t("Latest community submissions", "Bài đăng cộng đồng mới nhất")}</p></div><Link href="/admin/content" className="text-xs font-semibold text-[#2D5A46]">{t("View all", "Xem tất cả")}</Link></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr className="border-b border-[#EFEEEB] text-[10px] font-bold uppercase text-[#727974]"><th className="pb-3">{t("Title", "Tiêu đề")}</th><th className="pb-3">{t("Type", "Loại")}</th><th className="pb-3">{t("Author", "Tác giả")}</th><th className="pb-3">{t("Status", "Trạng thái")}</th><th className="pb-3">{t("Date", "Ngày")}</th></tr></thead><tbody className="divide-y divide-[#EFEEEB]/60">{recent.map(item => <tr key={item.postId} className="hover:bg-[#FBF9F6]/80"><td className="py-3.5 font-bold text-[#07241A]">{item.title}<span className="block text-[11px] font-normal text-[#A0A5A1]">ID: {item.postId}</span></td><td><UiText text={item.postType} /></td><td>{item.authorName}</td><td><UiText text={item.status} /></td><td>{date(item.createdAt)}</td></tr>)}</tbody></table>{!loading && recent.length === 0 && <p className="py-4 text-xs text-[#727974]">{t("No content found.", "Không tìm thấy nội dung.")}</p>}</div><p className="mt-4 border-t border-[#EFEEEB] pt-4 text-xs text-[#727974]">{t("Showing", "Hiển thị")} {recent.length} {t("of", "trong")} {posts.length} {t("entries", "mục")}</p></section>
  </div>;
}
