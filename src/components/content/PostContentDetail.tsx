"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { addPostComment, CommunityApiError, createCommunityEventSource, getPost, getPostComments, setPostRating, type CommentResponse, type CommunityEvent, type PostResponse } from "@/lib/community-api";
import { getRecipeById, type RecipeResponse } from "@/lib/recipe-api";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { localizeRecipeTitle, localizeText, localizeIngredient, localizeAmount } from "@/lib/localized-content";
import { categoryName } from "@/lib/recipe-categories";
import InlinePostRating from "./InlinePostRating";
import ContentIcon from "./ContentIcon";

async function fetchPostDetail(postId: number) {
  const [post, comments] = await Promise.all([getPost(postId), getPostComments(postId)]);
  const recipe = post.postType === "RECIPE" ? await getRecipeById(postId).catch(() => null) : null;
  return { post, comments, recipe };
}

export default function PostContentDetail({ postId }: { postId: number }) {
  const { language, t, locale } = useLanguage();
  const { user } = useAuth();
  const [post, setPost] = useState<PostResponse | null>(null);
  const [recipe, setRecipe] = useState<RecipeResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [comment, setComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loadedPostId, setLoadedPostId] = useState<number | null>(null);
  const loading = loadedPostId !== postId;
  const [error, setError] = useState<string | null>(null);

  const applyDetail = useCallback((data: Awaited<ReturnType<typeof fetchPostDetail>>) => {
    setPost(data.post); setComments(data.comments); setRecipe(data.recipe); setError(null);
  }, []);

  const load = useCallback(async () => {
    try {
      applyDetail(await fetchPostDetail(postId));
    } catch {
      setError(t("This post could not be loaded.", "Không thể tải bài viết này."));
    } finally {
      setLoadedPostId(postId);
    }
  }, [postId, t, applyDetail]);

  useEffect(() => {
    let active = true;
    fetchPostDetail(postId).then(data => { if (active) applyDetail(data); })
      .catch(() => { if (active) setError(t("This post could not be loaded.", "Không thể tải bài viết này.")); })
      .finally(() => { if (active) setLoadedPostId(postId); });
    return () => { active = false; };
  }, [postId, t, applyDetail]);

  useEffect(() => {
    const source = createCommunityEventSource();
    const refreshPost = (event: Event) => {
      const payload = JSON.parse((event as MessageEvent).data) as CommunityEvent;
      if (payload.postId === postId) void load();
    };
    source.addEventListener("open", () => void load());
    source.addEventListener("commentCreated", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as CommunityEvent;
      if (payload.postId !== postId || !payload.comment) return;
      if (payload.comment.parentCommentId !== null) {
        void load();
        return;
      }
      setComments((current) => current.some((item) => item.commentId === payload.comment!.commentId) ? current : [...current, payload.comment!]);
      setPost((current) => current ? { ...current, commentCount: payload.commentCount ?? current.commentCount } : current);
    });
    source.addEventListener("commentUpdated", refreshPost);
    source.addEventListener("commentRemoved", refreshPost);
    source.addEventListener("ratingUpdated", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as CommunityEvent;
      if (payload.postId !== postId) return;
      setPost((current) => current ? { ...current, averageRating: payload.averageRating ?? current.averageRating, ratingCount: payload.ratingCount ?? current.ratingCount } : current);
    });
    source.addEventListener("postUpdated", refreshPost);
    source.addEventListener("postRemoved", (event) => {
      const payload = JSON.parse((event as MessageEvent).data) as CommunityEvent;
      if (payload.postId !== postId) return;
      setPost(null);
      setError(t("This post is no longer available.", "Bài viết này không còn khả dụng."));
    });
    return () => source.close();
  }, [postId, load, t]);

  const totalMinutes = (recipe?.prepMinutes || 0) + (recipe?.cookMinutes || 0);
  const publishedDate = useMemo(() => post ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(post.createdAt)) : "", [locale, post]);

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    if (!user) {
      setError(t("You need to sign in to comment on this post.", "Bạn cần đăng nhập để bình luận bài viết này."));
      return;
    }
    if (!comment.trim() || submittingComment) return;
    const text = comment.trim();
    setSubmittingComment(true);
    setError(null);
    try {
      const created = await addPostComment(postId, text);
      setComments((current) => current.some((item) => item.commentId === created.commentId) ? current : [...current, created]);
      setComment("");
      try { setPost(await getPost(postId)); } catch { /* The comment is already saved. */ }
    } catch (failure) {
      setError(failure instanceof CommunityApiError && failure.status === 401
        ? t("Your session has expired. Please sign in again.", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
        : failure instanceof CommunityApiError && failure.status === 403
          ? t("You do not have permission to comment.", "Bạn không có quyền bình luận.")
          : t("Could not send your comment. Please try again.", "Không thể gửi bình luận. Vui lòng thử lại."));
    } finally {
      setSubmittingComment(false);
    }
  }

  async function submitRating(rating: number) {
    if (!post) return;
    await setPostRating(post.postId, rating, Boolean(post.currentUserRating));
    setPost(current => current ? { ...current, currentUserRating: rating } : current);
    await load();
  }

  if (loading) return <main className="bg-[#FBF9F6] px-6 py-24 text-center text-sm text-[#727974]">{t("Loading post...", "Đang tải bài viết...")}</main>;
  if (error && !post) return <main className="bg-[#FBF9F6] px-6 py-24 text-center text-sm text-red-600">{error}</main>;
  if (!post) return null;

  return (
    <main className="bg-[#FBF9F6] text-[#07241A]">
      <article className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-12">
        <nav className="flex flex-wrap items-center gap-2 text-xs text-[#727974]">
          <Link href="/" className="hover:text-[#BC4B22]">{t("Home", "Trang chủ")}</Link><span>/</span><span>{localizeRecipeTitle(post.title, language)}</span>
        </nav>
        <header className="py-7">
          <p className="mb-3 text-[10px] font-semibold tracking-[0.2em] text-[#BC4B22]">{post.postType === "RECIPE" ? t("Recipe & video", "Công thức và video") : t("Post", "Bài viết")}</p>
          <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">{localizeRecipeTitle(post.title, language)}</h1>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-[#727974]">
            <span>{t("by", "bởi")} <strong className="font-medium text-[#07241A]">{post.authorName}</strong></span>
            <span>{publishedDate}</span>
            {totalMinutes > 0 && <span className="flex items-center gap-1.5"><ContentIcon name="clock" />{totalMinutes} {t("mins", "phút")}</span>}
          </div>
        </header>

        {recipe?.categories?.length ? <p className="mb-4 text-sm text-[#727974]">{recipe.categories.map(c => categoryName(c, language)).join(" · ")}</p> : null}

        <div className="relative overflow-hidden rounded-3xl bg-[#E8EDE4]">
          {post.videoUrl ? (
            <video controls preload="metadata" poster={post.thumbnailUrl || undefined} src={post.videoUrl} className="aspect-video w-full bg-black object-contain" />
          ) : (
            <Image unoptimized width={1200} height={675} src={post.thumbnailUrl || "/images/recipe_tofu_tomato.png"} alt={localizeRecipeTitle(post.title, language)} className="aspect-video w-full object-cover" />
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E7DF] py-5">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-[#CB8520]">★ <strong className="text-[#07241A]">{post.averageRating ? post.averageRating.toFixed(1) : t("New", "Mới")} / 5</strong><span className="ml-2 text-[#727974]">· {post.ratingCount} {t("ratings", "đánh giá")}</span></span>
          </div>
          <a href="#comments" className="text-sm hover:text-[#BC4B22]">{post.commentCount} {t("Comments", "bình luận")}</a>
        </div>
        <InlinePostRating key={postId} currentRating={post.currentUserRating} signedIn={!!user} onRate={submitRating} />
        {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-7">
            <section className="rounded-3xl border border-[#E5E7DF] bg-white p-6 sm:p-8">
              <h2 className="font-serif text-2xl sm:text-3xl">{t("About This Recipe", "Về món ăn này")}</h2>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#59635C]">{localizeText(post.content, language)}</p>
            </section>
            {recipe && (
              <section className="rounded-3xl border border-[#E5E7DF] bg-white p-6 sm:p-8">
                <h2 className="font-serif text-2xl sm:text-3xl">{t("Full Recipe & Method", "Công thức & cách chế biến")}</h2>
                <p className="mt-3 text-lg font-semibold">{localizeRecipeTitle(recipe.recipeName, language)}</p>
                <h3 className="mt-7 font-serif text-xl">{t("Ingredients", "Nguyên liệu")}</h3>
                <ul className="mt-4 divide-y divide-[#EFEEEB]">{recipe.ingredients.map((ingredient, index) => <li key={index} className="flex justify-between gap-4 py-3 text-sm"><span>{localizeIngredient(ingredient.ingredientName, language)}</span><span className="text-[#727974]">{localizeAmount(ingredient.amount, language)}</span></li>)}</ul>
                <h3 className="mt-9 border-t border-[#E5E7DF] pt-7 font-serif text-2xl">{t("Step-by-Step", "Các bước thực hiện")}</h3>
                <ol className="mt-6 space-y-5">{recipe.steps.map((step) => <li key={step.stepNumber} className="flex gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8EDE2] font-serif text-lg">{step.stepNumber}</span><p className="text-sm leading-7 text-[#59635C]">{localizeText(step.instruction, language)}</p></li>)}</ol>
              </section>
            )}
            <section id="comments" className="scroll-mt-28 rounded-3xl border border-[#E5E7DF] bg-white p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-serif text-2xl sm:text-3xl">{t("Community Thoughts", "Góc chia sẻ")}</h2><span className="text-xs text-[#727974]">{comments.length} {t("conversations", "bình luận")}</span></div>
              <form className="mt-6" onSubmit={submitComment}>
                {!user && <p role="status" className="mb-4 text-sm text-[#99462A]">{t("You need to sign in to comment on this post.", "Bạn cần đăng nhập để bình luận bài viết này.")} <Link href="/login" className="underline">{t("Sign in", "Đăng nhập")}</Link></p>}
                <textarea disabled={submittingComment} value={comment} onChange={e => setComment(e.target.value)} maxLength={1000} rows={3} placeholder={t("Share your cooking experience or ask a question...", "Chia sẻ trải nghiệm nấu ăn hoặc đặt câu hỏi...")} className="w-full resize-y rounded-2xl border border-[#DDE2D7] bg-[#FBF9F6] p-4 text-sm outline-none focus:border-[#43734D]" />
                <div className="mt-3 flex justify-end"><button disabled={submittingComment || !comment.trim()} className="rounded-full bg-[#254B38] px-6 py-2.5 text-sm font-medium text-white disabled:opacity-40">{submittingComment ? t("Sending...", "Đang gửi...") : t("Post comment", "Gửi bình luận")}</button></div>
              </form>
              <div className="mt-7 space-y-6">{comments.map(item => <div key={item.commentId} className="border-t border-[#EFEEEB] pt-5"><p className="text-sm font-semibold">{item.authorName} <span className="ml-2 text-xs font-normal text-[#727974]">{new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(item.createdAt))}</span></p><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#59635C]">{item.content}</p></div>)}</div>
            </section>
          </div>
          <aside className="space-y-6">
            <section className="rounded-3xl bg-[#254B38] p-7 text-white"><ContentIcon name="leaf" width="28" height="28" className="text-[#DCE8BC]" /><h2 className="mt-5 font-serif text-2xl">{t("Shared by the community", "Chia sẻ từ cộng đồng")}</h2><p className="mt-4 text-sm leading-7 text-white/80">{t("Comments and ratings update in real time while this page is open.", "Bình luận và đánh giá sẽ cập nhật theo thời gian thực khi trang này đang mở.")}</p></section>
            <section className="rounded-3xl border border-[#E5E7DF] bg-white p-6"><h2 className="font-serif text-xl">{t("Make it part of your week", "Thêm món ngon vào tuần mới")}</h2><Link href="/meal-planner" className="mt-5 flex items-center justify-between rounded-full border border-[#254B38] px-4 py-3 text-xs font-semibold">{t("Open Meal Planner", "Mở lịch ăn uống")}<ContentIcon name="arrow" /></Link></section>
          </aside>
        </div>
      </article>

    </main>
  );
}
