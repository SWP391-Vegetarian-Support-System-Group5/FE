"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { getStoredToken } from "@/lib/auth";
import { getMediaUrl } from "@/lib/api";
import { getRecipeById, type RecipeResponse } from "@/lib/recipe-api";
import { addComment, bookmarkPost, communityError, deleteComment, deletePost, getBookmarks, getComments, getPost, getPosts, getRating, PostApiError, ratePost, removeBookmark, replyToComment, updateComment, type CommentResponse, type PostResponse } from "@/lib/post-api";
import ContentDialog from "./ContentDialog";
import PostEditor from "./PostEditor";

const panel = "rounded-3xl border border-[#E5E7DF] bg-white p-6 sm:p-8";
const button = "rounded-full bg-[#254B38] px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40";

export default function CommunityPostDetail({ postId }: { postId: number }) {
  const { user, loading } = useAuth();
  return <><Navbar /><PostDetail key={`${postId}:${user?.uid || "guest"}`} postId={postId} authLoading={loading} /><Footer /></>;
}

function PostDetail({ postId, authLoading }: { postId: number; authLoading: boolean }) {
  const { user } = useAuth();
  const [post, setPost] = useState<PostResponse | null>(null);
  const [recipe, setRecipe] = useState<RecipeResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState("");
  const [ratingError, setRatingError] = useState("");
  const [average, setAverage] = useState<number | null>(null);
  const [saved, setSaved] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [removed, setRemoved] = useState(false);
  const [dialog, setDialog] = useState<"edit" | "delete" | "rating" | null>(null);
  const [selection, setSelection] = useState(0);
  const [ratingLocked, setRatingLocked] = useState(false);
  const [comment, setComment] = useState("");
  const [commentAction, setCommentAction] = useState<{ type: "reply" | "edit" | "delete"; comment: CommentResponse } | null>(null);
  const [commentText, setCommentText] = useState("");
  const lock = useRef(false);
  const alive = useRef(true);
  const isAdmin = user?.role?.toUpperCase() === "ADMIN";
  const ratingKey = user ? `community-rating:${user.uid}:${postId}` : null;
  const refreshPost = useCallback(async () => { const data = await getPost(postId); if (alive.current) setPost(data); }, [postId]);
  const refreshComments = async () => {
    setCommentsLoading(true);
    try { const data = await getComments(postId); if (alive.current) { setComments(data); setCommentsError(""); } }
    catch (e) { if (alive.current) setCommentsError(communityError(e)); throw e; }
    finally { if (alive.current) setCommentsLoading(false); }
  };
  const refreshRating = async () => { const data = await getRating(postId); if (alive.current) { setAverage(data.averageRating); setRatingError(""); } await refreshPost(); };
  const refreshBookmarks = async () => { const data = await getBookmarks(); if (alive.current) setSaved(data.some(p => p.postId === postId)); };

  useEffect(() => {
    alive.current = true;
    const controller = new AbortController();
    getPost(postId, controller.signal).then(async data => {
      if (controller.signal.aborted) return;
      setPost(data);
      if (data.postType === "RECIPE") {
        try { const recipe = await getRecipeById(postId); if (!controller.signal.aborted) setRecipe(recipe); }
        catch (e) { if (!controller.signal.aborted) setError(communityError(e)); }
      }
    }).catch(e => { if (!controller.signal.aborted) setError(communityError(e)); }).finally(() => { if (!controller.signal.aborted) setInitialLoading(false); });
    getComments(postId, controller.signal).then(data => { if (!controller.signal.aborted) setComments(data); }).catch(e => { if (!controller.signal.aborted) { setCommentsError(communityError(e)); setError(communityError(e)); } }).finally(() => { if (!controller.signal.aborted) setCommentsLoading(false); });
    getRating(postId, controller.signal).then(data => { if (!controller.signal.aborted) setAverage(data.averageRating); }).catch(e => { if (!controller.signal.aborted) { setRatingError(communityError(e)); setError(communityError(e)); } });
    return () => { alive.current = false; controller.abort(); };
  }, [postId]);
  useEffect(() => {
    if (authLoading) return;
    const controller = new AbortController();
    if (user && getStoredToken()) getBookmarks(controller.signal).then(data => { if (!controller.signal.aborted) setSaved(data.some(p => p.postId === postId)); }).catch(e => { if (!controller.signal.aborted) setError(communityError(e)); });
    if (ratingKey) {
      try { setRatingLocked(localStorage.getItem(ratingKey) !== null); } catch { /* BE still rejects duplicate ratings with 409. */ }
    }
    return () => controller.abort();
  }, [user, authLoading, postId, ratingKey]);

  function requireLogin() {
    if (authLoading || !user || !getStoredToken()) { setError("Bạn cần đăng nhập để thực hiện thao tác này."); return false; }
    return true;
  }
  async function mutate(action: () => Promise<void>, refresh: () => Promise<void>, message: string) {
    if (lock.current || !requireLogin()) return;
    lock.current = true; setBusy(true); setError(""); setNotice("");
    try {
      await action();
      if (!alive.current) return;
      setNotice(message);
      try { await refresh(); } catch (e) { if (alive.current) setError(`Thao tác đã hoàn tất nhưng tải lại dữ liệu thất bại. ${communityError(e)}`); }
    } catch (e) { if (alive.current) setError(communityError(e)); }
    finally { lock.current = false; if (alive.current) setBusy(false); }
  }

  function renderComment(item: CommentResponse): React.ReactNode {
    const canManage = !!user && (isAdmin || item.userId === user.userId);
    return <div key={item.commentId} className="border-t border-[#EFEEEB] pt-5">
      <p className="text-sm font-semibold">{item.authorName}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-[#59635C]">{item.status === "REMOVED" ? "Bình luận đã được xóa." : item.content}</p>
      {item.status !== "REMOVED" && <div className="mt-2 flex gap-4 text-xs text-[#BC4B22]">
        <button disabled={busy} onClick={() => { if (requireLogin()) { setCommentAction({ type: "reply", comment: item }); setCommentText(""); } }}>Trả lời</button>
        {canManage && <><button disabled={busy} onClick={() => { setCommentAction({ type: "edit", comment: item }); setCommentText(item.content); }}>Sửa</button><button disabled={busy} onClick={() => setCommentAction({ type: "delete", comment: item })}>Xóa</button></>}
      </div>}
      {!!item.replies?.length && <div className="mt-4 space-y-4 border-l-2 border-[#E5E7DF] pl-4">{item.replies.map(renderComment)}</div>}
    </div>;
  }

  return <main className="min-h-[60vh] bg-[#FBF9F6] text-[#07241A]"><article className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12">
    <nav className="text-xs text-[#727974]"><Link href="/">Trang chủ</Link> / <Link href="/community">Community</Link></nav>
    {error && <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800">{error} <Link href="/login" className="underline">Đăng nhập</Link><button className="ml-4 underline" onClick={() => window.location.reload()}>Tải lại</button></div>}
    {notice && <p role="status" className="mt-4 text-sm text-[#254B38]">{notice}</p>}
    {initialLoading ? <p role="status" className="py-12">Đang tải bài viết…</p> : removed ? <p className="py-12">Bài viết đã được xóa. <Link href="/community" className="underline">Về cộng đồng</Link></p> : post && <>
      <header className="py-8"><p className="text-xs tracking-widest text-[#BC4B22]">{post.categoryName || post.postType}</p><h1 className="mt-3 break-words font-serif text-4xl sm:text-5xl">{post.title}</h1><p className="mt-5 text-sm text-[#727974]">{post.authorName}</p><div className="mt-3 flex flex-wrap gap-2">{post.tags.map(tag => <span key={tag} className="rounded-full bg-[#E8EDE4] px-3 py-1 text-xs">#{tag}</span>)}</div></header>
      {post.videoUrl ? <video controls preload="metadata" poster={getMediaUrl(post.thumbnailUrl) || undefined} src={getMediaUrl(post.videoUrl)} className="aspect-video w-full rounded-3xl bg-[#193B2E]" /> : post.thumbnailUrl && <div className="relative aspect-video overflow-hidden rounded-3xl"><Image src={getMediaUrl(post.thumbnailUrl)} alt={post.title} fill unoptimized sizes="100vw" className="object-cover" /></div>}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7DF] py-5 text-sm">
        <div className="flex items-center gap-4"><span className="text-[#CB8520]">★ <strong className="text-[#07241A]">{ratingError ? "Chưa tải được điểm" : average === null ? "Đang tải điểm…" : `${average.toFixed(1)} / 5`}</strong></span><button disabled={busy || authLoading || ratingLocked} onClick={() => { if (requireLogin()) { setSelection(0); setDialog("rating"); } }} className="text-[#BC4B22] underline disabled:opacity-50">{ratingLocked ? "Đã đánh giá · không thể sửa" : "Đánh giá bài viết"}</button></div>
        <div className="flex items-center gap-5"><a href="#comments">Bình luận</a><button disabled={busy || authLoading || (!!user && !!getStoredToken() && saved === null)} aria-pressed={saved === true} onClick={() => mutate(async () => {
          try { if (saved) await removeBookmark(postId); else await bookmarkPost(postId); }
          catch (e) { if (e instanceof PostApiError && e.status === 409) await refreshBookmarks(); throw e; }
        }, refreshBookmarks, saved ? "Đã bỏ lưu bài." : "Đã lưu bài.")} className="disabled:opacity-40">{saved ? "🔖 Đã lưu" : "♡ Lưu bài"}</button></div>
      </div>
      {!!user && (isAdmin || user.userId === post.userId) && <div className="mt-5 flex gap-4 text-sm"><button disabled={busy} onClick={() => setDialog("edit")} className="text-[#254B38] underline">Sửa bài</button><button disabled={busy} onClick={() => setDialog("delete")} className="text-red-700 underline">Xóa bài</button></div>}
      <div className="mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"><div className="space-y-7">
        <section className={panel}><h2 className="font-serif text-2xl">Nội dung bài viết</h2><p className="mt-4 whitespace-pre-wrap break-words text-sm leading-8 text-[#59635C]">{post.content}</p></section>
        {recipe && <section className={panel}><h2 className="font-serif text-2xl">Công thức & cách chế biến</h2><p className="mt-3 text-sm text-[#727974]">{recipe.servings != null && `${recipe.servings} phần ăn · `}{recipe.prepMinutes != null && `Chuẩn bị ${recipe.prepMinutes} phút · `}{recipe.cookMinutes != null && `Nấu ${recipe.cookMinutes} phút`}</p><h3 className="mt-6 font-serif text-xl">Nguyên liệu</h3><ul className="mt-4 divide-y divide-[#EFEEEB]">{recipe.ingredients.map((item, index) => <li key={index} className="flex justify-between gap-4 py-3 text-sm"><span>{item.ingredientName}</span><span>{item.amount}</span></li>)}</ul><h3 className="mt-6 font-serif text-xl">Các bước thực hiện</h3><ol className="mt-5 space-y-5">{recipe.steps.map(step => <li key={step.stepNumber} className="flex gap-4 text-sm leading-7"><span className="font-semibold">{step.stepNumber}.</span><p className="whitespace-pre-wrap">{step.instruction}</p></li>)}</ol></section>}
        <section id="comments" className={`${panel} scroll-mt-28`}><h2 className="font-serif text-2xl">Community Thoughts · Góc chia sẻ</h2>
          <form className="mt-6" onSubmit={e => { e.preventDefault(); if (!comment.trim()) return; mutate(async () => { await addComment(postId, comment.trim()); if (alive.current) setComment(""); }, refreshComments, "Đã gửi bình luận."); }}>
            <label htmlFor="post-comment" className="sr-only">Viết bình luận</label><textarea id="post-comment" required disabled={busy} rows={3} value={comment} onChange={e => setComment(e.target.value)} placeholder="Chia sẻ trải nghiệm hoặc đặt câu hỏi…" className="w-full rounded-2xl border border-[#DDE2D7] bg-[#FBF9F6] p-4 text-sm outline-none focus:border-[#43734D]" /><div className="mt-3 flex justify-end"><button disabled={busy || authLoading || !comment.trim()} className={button}>{busy ? "Đang gửi…" : "Gửi bình luận"}</button></div>
          </form><div className="mt-7 space-y-6">{commentsLoading && <p role="status" className="text-sm text-[#727974]">Đang tải bình luận…</p>}{commentsError && <p role="alert" className="text-sm text-red-700">{commentsError}</p>}{comments.map(renderComment)}{!commentsLoading && !commentsError && !comments.length && <p className="text-sm text-[#727974]">Chưa có bình luận.</p>}</div>
        </section>
      </div><aside className="space-y-6"><section className="rounded-3xl bg-[#254B38] p-7 text-white"><h2 className="font-serif text-2xl">Cùng chia sẻ trải nghiệm ăn chay</h2><p className="mt-4 text-sm leading-7 text-white/80">Đánh giá bài viết từ 1 đến 5 sao. Mỗi tài khoản đánh giá một lần và không thể sửa sau khi gửi.</p></section><section className={panel}><h2 className="font-serif text-xl">Bộ sưu tập của bạn</h2><p className="mt-3 text-sm text-[#727974]">Lưu bài để đọc lại và tìm cảm hứng cho bữa ăn hàng ngày.</p><Link href="/bookmarks" className="mt-5 inline-block text-sm underline">Xem bài đã lưu →</Link></section></aside></div>
    </>}
    {post && dialog === "edit" && <PostEditor post={post} onSaved={async () => { setNotice("Đã lưu thay đổi."); try { await refreshPost(); } catch (e) { setError(`Bài đã được lưu nhưng tải lại dữ liệu thất bại. ${communityError(e)}`); } }} onClose={() => setDialog(null)} />}
    {dialog === "delete" && <ContentDialog title="Xóa bài viết?" onClose={() => { if (!busy) setDialog(null); }}><div className="p-6"><p className="text-sm">Bài viết sẽ được gỡ khỏi cộng đồng.</p><button disabled={busy} className={`${button} mt-5`} onClick={() => mutate(async () => { await deletePost(postId); setRemoved(true); setDialog(null); }, async () => { await getPosts(); }, "Đã xóa bài viết.")}>{busy ? "Đang xóa…" : "Xác nhận xóa"}</button>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}</div></ContentDialog>}
    {dialog === "rating" && <ContentDialog title="Bạn thấy bài viết thế nào?" onClose={() => { if (!busy) setDialog(null); }}><form className="p-6" onSubmit={e => { e.preventDefault(); if (!selection || ratingLocked) return; mutate(async () => {
      try { await ratePost(postId, selection); }
      catch (e) {
        if (e instanceof PostApiError && e.status === 409) { setRatingLocked(true); setDialog(null); try { if (ratingKey) localStorage.setItem(ratingKey, "rated"); } catch {} await refreshRating(); throw new PostApiError(409, "Bạn đã đánh giá bài này và không thể sửa."); }
        throw e;
      }
      setRatingLocked(true); setDialog(null);
      try { if (ratingKey) localStorage.setItem(ratingKey, String(selection)); } catch { /* The successful server vote remains authoritative. */ }
    }, refreshRating, "Đã gửi đánh giá."); }}><fieldset disabled={busy}><legend className="text-sm text-[#727974]">Chọn số sao của bạn</legend><div className="mt-5 flex justify-center gap-3">{[1, 2, 3, 4, 5].map(star => <label key={star} className="cursor-pointer"><input type="radio" name="post-rating" checked={selection === star} onChange={() => setSelection(star)} aria-label={`${star} sao`} className="peer sr-only" /><span className={`block rounded-lg text-4xl peer-focus-visible:outline-2 ${star <= selection ? "text-[#CB8520]" : "text-[#D8DCD2]"}`}>★</span></label>)}</div></fieldset><p className="mt-5 text-center text-xs text-[#727974]">Đánh giá một lần. Không thể sửa sau khi gửi.</p><button disabled={busy || !selection} className={`${button} mt-6 w-full`}>{busy ? "Đang gửi…" : "Gửi đánh giá"}</button>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}</form></ContentDialog>}
    {commentAction && <ContentDialog title={commentAction.type === "reply" ? "Trả lời bình luận" : commentAction.type === "edit" ? "Sửa bình luận" : "Xóa bình luận?"} onClose={() => { if (!busy) setCommentAction(null); }}><form className="p-6" onSubmit={e => { e.preventDefault(); const action = commentAction; if (action.type !== "delete" && !commentText.trim()) return; mutate(async () => {
      if (action.type === "reply") await replyToComment(action.comment.commentId, commentText.trim());
      else if (action.type === "edit") await updateComment(action.comment.commentId, commentText.trim());
      else await deleteComment(action.comment.commentId);
      setCommentAction(null); setCommentText("");
    }, refreshComments, "Đã cập nhật bình luận."); }}>
      {commentAction.type === "delete" ? <p className="text-sm">Xác nhận gỡ bình luận này?</p> : <textarea required disabled={busy} rows={4} aria-label="Nội dung bình luận" value={commentText} onChange={e => setCommentText(e.target.value)} className="w-full rounded-xl border border-[#DDE2D7] p-4 text-sm" />}
      <button disabled={busy || (commentAction.type !== "delete" && !commentText.trim())} className={`${button} mt-5`}>{busy ? "Đang gửi…" : "Xác nhận"}</button>{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </form></ContentDialog>}
  </article></main>;

}
