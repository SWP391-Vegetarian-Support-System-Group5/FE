"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { getStoredToken } from "@/lib/auth";
import { createPost, getPostCategories, getPostTags, PostApiError, type PostResponse, type PostType, type CommunityLookup } from "@/lib/post-api";
import { useUiText } from "@/components/UiText";
import { validatePostFields, type PostField, type PostFieldError } from "@/lib/content-validation";
import { focusField } from "@/lib/focus-field";
import { useAuth } from "@/context/AuthContext";
import { useSessionFields } from "@/hooks/useRememberedFilters";

const emptyDraft = { title: "", content: "", videoUrl: "", categoryId: "", tagIds: "" };
const parseTagIds = (text: string) => text.split(",").map(Number).filter(id => Number.isInteger(id) && id > 0);

export default function PostComposer({ postType }: { postType: PostType }) {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const ui = useUiText();
  const [draft, setDraft, draftStorage] = useSessionFields(`post:${user?.uid || "guest"}:${postType}`, emptyDraft, "draft");
  const { title, content, videoUrl } = draft;
  const categoryId = Number(draft.categoryId) || null;
  const tagIds = parseTagIds(draft.tagIds);
  const setTitle = (title: string) => setDraft(previous => ({ ...previous, title }));
  const setContent = (content: string) => setDraft(previous => ({ ...previous, content }));
  const setVideoUrl = (videoUrl: string) => setDraft(previous => ({ ...previous, videoUrl }));
  const setCategoryId = (categoryId: number | null) => setDraft(previous => ({ ...previous, categoryId: categoryId === null ? "" : String(categoryId) }));
  const setTagIds = (update: number[] | ((previous: number[]) => number[])) => setDraft(previous => ({ ...previous, tagIds: (typeof update === "function" ? update(parseTagIds(previous.tagIds)) : update).join(",") }));
  const [categories, setCategories] = useState<CommunityLookup[]>([]);
  const [tags, setTags] = useState<CommunityLookup[]>([]);
  const [lookupLoading, setLookupLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [published, setPublished] = useState<PostResponse | null>(null);
  const [failure, setFailure] = useState<{ status: number; detail: string } | null>(null);
  const requestPending = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [touched, setTouched] = useState<Partial<Record<PostField, boolean>>>({});
  const fieldErrors = validatePostFields({ title, content, videoUrl, includeVideo: postType === "VIDEO" });
  const messages: Record<PostFieldError, string> = {
    titleRequired: t("Enter a post title.", "Vui lòng nhập tiêu đề bài viết."),
    titleTooLong: t("Use no more than 250 characters.", "Tiêu đề tối đa 250 ký tự."),
    contentRequired: t("Write some content before publishing.", "Vui lòng nhập nội dung trước khi đăng."),
    invalidVideoUrl: t("Enter a valid HTTP or HTTPS link.", "Nhập đường dẫn HTTP hoặc HTTPS hợp lệ."),
  };
  const showError = (field: PostField) => touched[field] && fieldErrors[field];
  const touch = (field: PostField) => setTouched(previous => ({ ...previous, [field]: true }));
  const visiblePublished = published?.postType === postType ? published : null;
  useEffect(() => { if (published || failure) resultRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" }); }, [published, failure]);

  useEffect(() => {
    let active = true;
    Promise.all([getPostCategories(), getPostTags()]).then(([categories, tags]) => {
      if (active) { setCategories(categories); setTags(tags); }
    }).catch(error => { if (active) setFailure(error instanceof PostApiError ? { status: error.status, detail: error.message } : { status: 0, detail: "Không thể tải danh mục và thẻ." }); })
      .finally(() => { if (active) setLookupLoading(false); });
    return () => { active = false; };
  }, []);

  const changed = () => { setPublished(null); setFailure(null); };
  const inputClass = "mt-2 w-full rounded-xl border border-[#E5E7DF] bg-[#FBF9F6] px-4 py-3 text-sm font-normal outline-none focus:border-[#254B38]";
  const errorText = failure?.status === 401
    ? t("Your session has expired or you are not signed in. Sign in to publish.", "Bạn chưa đăng nhập hoặc phiên đã hết hạn. Đăng nhập để đăng bài.")
    : failure?.status === 400
    ? t("Check the title and content. The title must not exceed 250 characters.", "Kiểm tra tiêu đề và nội dung. Tiêu đề không được vượt quá 250 ký tự.")
    : failure?.status === 404
    ? t("The selected category or tag no longer exists. Choose another or leave them empty.", "Danh mục hoặc thẻ đã chọn không còn tồn tại. Chọn lại hoặc để trống.")
    : failure?.status === 403
    ? t("Your account does not have permission to publish this post.", "Tài khoản của bạn không có quyền đăng bài này.")
    : failure?.status === 409
    ? t("This post already exists. Check your posts before submitting again.", "Bài viết đã tồn tại. Kiểm tra danh sách bài trước khi gửi lại.")
    : failure?.status === 201
    ? t("The server response could not confirm publication. Check your posts before trying again.", "Phản hồi máy chủ chưa xác nhận được việc đăng bài. Kiểm tra bài đã đăng trước khi thử lại.")
    : t("Could not confirm that the post was created. Check your connection and posts before trying again.", "Chưa xác nhận được bài đã tạo. Kiểm tra kết nối và danh sách bài trước khi thử lại.");

  return <div className="mx-auto max-w-5xl px-4 pb-12 sm:px-6 lg:px-8">
    <header className="border-b border-[#E5E7DF] pb-6">
      <h1 className="font-serif text-3xl font-bold text-[#07241A] sm:text-4xl">{t("Create a post", "Tạo bài viết")}</h1>
      <p className="mt-3 text-sm text-[#727974]">{t("Share your story, ask the community, or share a video. Your post becomes public when you publish it.", "Chia sẻ câu chuyện, hỏi cộng đồng hoặc chia sẻ video. Bài viết sẽ công khai ngay khi đăng.")}</p>
    </header>
    {visiblePublished && <div ref={resultRef} role="status" aria-live="polite" className="mt-6 rounded-2xl border border-[#CAEADA] bg-[#E8F0E4] p-5 text-[#254B38]">
      <p className="font-semibold">✓ {t("Post created successfully!", "Đã tạo bài viết thành công!")}</p>
      <p className="mt-2 break-words text-sm">{visiblePublished.title} · {t("Post ID", "Mã bài viết")}: #{visiblePublished.postId} · {t("Published", "Đã công khai")}</p>
      <Link href={`/view-detail/post-${visiblePublished.postId}`} className="mt-3 mr-5 inline-block text-sm font-semibold underline">{t("View post", "Xem bài viết")}</Link>
      <button type="button" className="mt-3 text-sm font-semibold underline underline-offset-4" onClick={() => { setTitle(""); setContent(""); setVideoUrl(""); setCategoryId(null); setTagIds([]); setTouched({}); changed(); focusField(titleRef.current); }}>{t("Create another post", "Tạo bài viết khác")}</button>
    </div>}
    {failure && <div ref={resultRef} role="alert" className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
      <p>{errorText}</p>
      {failure.detail && <p className="mt-2 break-words">{failure.detail}</p>}
      {failure.status === 401 && <Link className="mt-3 inline-block font-semibold underline" href="/login">{t("Sign in", "Đăng nhập")}</Link>}
    </div>}
    <form noValidate className="mt-7 rounded-3xl border border-[#E5E7DF] bg-white p-6 sm:p-8" onSubmit={async event => {
      event.preventDefault();
      if (requestPending.current || visiblePublished) return;
      setFailure(null);
      setTouched({ title: true, content: true, videoUrl: true });
      if (Object.keys(fieldErrors).length) {
        focusField(fieldErrors.title ? titleRef.current : fieldErrors.content ? contentRef.current : videoRef.current);
        return;
      }
      if (!getStoredToken()) { setFailure({ status: 401, detail: "" }); return; }
      requestPending.current = true;
      setSubmitting(true);
      try {
        const post = await createPost({ title: title.trim(), content: content.trim(), postType, categoryId, videoUrl: videoUrl.trim() || null, tagIds });
        setPublished(post);
        setDraft(emptyDraft);
        setTouched({});
      } catch (error) {
        setFailure(error instanceof PostApiError ? { status: error.status, detail: error.message } : { status: 0, detail: "" });
      } finally { requestPending.current = false; setSubmitting(false); }
    }}>
      {lookupLoading && <p role="status" className="mb-4 text-sm text-[#727974]">{t("Loading categories and tags…", "Đang tải danh mục và thẻ…")}</p>}
      {draftStorage.saved && (title || content || videoUrl) && <p role="status" className="mb-4 text-xs text-[#658266]">{t("Draft saved for this browser session. You can return to this post type to continue.", "Đã giữ bản nháp trong phiên trình duyệt này. Quay lại loại bài này để viết tiếp.")}</p>}
      <fieldset disabled={submitting || lookupLoading || authLoading} className="space-y-5 disabled:opacity-70">
        <label className="block text-sm font-semibold text-[#07241A]">{t("Post title", "Tiêu đề bài viết")} <span className="text-red-600">*</span>
          <input ref={titleRef} required maxLength={250} value={title} onBlur={() => touch("title")} aria-invalid={!!showError("title")} aria-describedby={showError("title") ? "post-title-error" : undefined} onChange={event => { setTitle(event.target.value); changed(); }} className={`${inputClass} vm-field`} placeholder={t("What would you like to share?", "Bạn muốn chia sẻ điều gì?")} />
          {showError("title") && <span id="post-title-error" className="vm-feedback mt-2 block text-xs font-normal text-red-700">{messages[fieldErrors.title!]}</span>}
          <span className="mt-1 block text-right text-xs font-normal text-[#727974]">{title.length}/250</span>
        </label>
        <label className="block text-sm font-semibold text-[#07241A]">{t("Content", "Nội dung")} <span className="text-red-600">*</span>
          <textarea ref={contentRef} required rows={8} value={content} onBlur={() => touch("content")} aria-invalid={!!showError("content")} aria-describedby={showError("content") ? "post-content-error" : undefined} onChange={event => { setContent(event.target.value); changed(); }} className={`${inputClass} vm-field resize-y`} placeholder={t("Write your post here…", "Viết nội dung bài ở đây…")} />
          {showError("content") && <span id="post-content-error" className="vm-feedback mt-2 block text-xs font-normal text-red-700">{messages[fieldErrors.content!]}</span>}
        </label>
        <label className="block text-sm font-semibold text-[#07241A]">{t("Category (optional)", "Danh mục (không bắt buộc)")}
          <select value={categoryId ?? ""} onChange={event => { setCategoryId(event.target.value ? Number(event.target.value) : null); changed(); }} className={inputClass}>
            <option value="">{t("No category", "Không chọn danh mục")}</option>
            {categories.map(category => <option key={category.id} value={category.id}>{ui(category.name)}</option>)}
          </select>
        </label>
        {postType === "VIDEO" && <label className="block text-sm font-semibold text-[#07241A]">{t("Video URL (optional)", "Đường dẫn video (không bắt buộc)")}
          <input ref={videoRef} type="url" value={videoUrl} onBlur={() => touch("videoUrl")} aria-invalid={!!showError("videoUrl")} aria-describedby={showError("videoUrl") ? "post-video-error" : undefined} onChange={event => { setVideoUrl(event.target.value); changed(); }} className={`${inputClass} vm-field`} placeholder="https://…" />
          {showError("videoUrl") && <span id="post-video-error" className="vm-feedback mt-2 block text-xs font-normal text-red-700">{messages[fieldErrors.videoUrl!]}</span>}
          <span className="mt-2 block text-xs font-normal text-[#727974]">{t("Paste an HTTP or HTTPS video link. This form does not upload a video file.", "Dán đường dẫn video HTTP hoặc HTTPS. Form này không tải tệp video lên.")}</span>
        </label>}
        {tags.length > 0 && <fieldset><legend className="text-sm font-semibold text-[#07241A]">{t("Tags (optional)", "Thẻ (không bắt buộc)")}</legend><div className="mt-3 flex flex-wrap gap-3">{tags.map(tag => <label key={tag.id} className="flex items-center gap-2 rounded-full border border-[#E5E7DF] px-3 py-2 text-xs"><input type="checkbox" checked={tagIds.includes(tag.id)} onChange={event => { setTagIds(ids => event.target.checked ? [...ids, tag.id] : ids.filter(id => id !== tag.id)); changed(); }} className="accent-[#254B38]" />{ui(tag.name)}</label>)}</div></fieldset>}
        <div className="flex justify-end border-t border-[#E5E7DF] pt-5"><button type="submit" disabled={submitting || !!visiblePublished} className="rounded-full bg-[#254B38] px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{submitting ? t("Publishing…", "Đang đăng…") : visiblePublished ? t("Published", "Đã đăng") : t("Publish post", "Đăng bài viết")}</button></div>
      </fieldset>
    </form>
  </div>;
}
