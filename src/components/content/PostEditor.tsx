"use client";

import { useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { localizeText } from "@/lib/localized-content";
import { communityError, updatePost, type PostResponse, type PostType } from "@/lib/post-api";
import { validatePostFields } from "@/lib/content-validation";
import ContentDialog from "./ContentDialog";

export default function PostEditor({ post, onSaved, onClose }: { post: PostResponse; onSaved: () => Promise<void>; onClose: () => void }) {
  const { t, language } = useLanguage();
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [postType, setPostType] = useState<PostType>(post.postType);
  const [videoUrl, setVideoUrl] = useState(post.videoUrl || "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const typeLabels: Record<PostType, string> = { BLOG: t("Post", "Bài chia sẻ"), QUESTION: t("Question", "Câu hỏi"), RECIPE: t("Recipe", "Công thức"), VIDEO: t("Video", "Video") };
  const input = "mt-2 w-full rounded-xl border border-[#E5E7DF] bg-white px-4 py-3 text-sm outline-none focus:border-[#254B38]";
  return <ContentDialog title={t("Edit post", "Sửa bài viết")} onClose={() => { if (!lock.current) onClose(); }}><form className="space-y-5 p-6" onSubmit={async event => {
    event.preventDefault(); if (lock.current) return;
    if (Object.keys(validatePostFields({ title, content, videoUrl, includeVideo: true })).length) {
      setError(t("Enter a title (up to 250 characters), content, and a valid video URL if provided.", "Nhập tiêu đề tối đa 250 ký tự, nội dung và đường dẫn video hợp lệ nếu có.")); return;
    }
    lock.current = true; setPending(true); setError("");
    try {
      await updatePost(post.postId, { title: title.trim(), content: content.trim(), postType, videoUrl: videoUrl.trim() || null });
      await onSaved(); onClose();
    } catch (failure) { setError(communityError(failure)); }
    finally { lock.current = false; setPending(false); }
  }}>
    {error && <p role="alert" className="text-sm text-red-700">{localizeText(error, language)}</p>}
    <fieldset disabled={pending} className="space-y-4 disabled:opacity-60">
      <label className="block text-sm">{t("Title", "Tiêu đề")}<input required maxLength={250} value={title} onChange={event => setTitle(event.target.value)} className={input} /></label>
      <label className="block text-sm">{t("Content", "Nội dung")}<textarea required rows={7} value={content} onChange={event => setContent(event.target.value)} className={input} /></label>
      <label className="block text-sm">{t("Post type", "Loại bài")}<select disabled={post.postType === "RECIPE"} value={postType} onChange={event => setPostType(event.target.value as PostType)} className={input}>{(post.postType === "RECIPE" ? ["RECIPE"] as PostType[] : ["BLOG", "QUESTION", "VIDEO"] as PostType[]).map(type => <option key={type} value={type}>{typeLabels[type]}</option>)}</select></label>
      <label className="block text-sm">{t("Video URL", "Đường dẫn video")}<input type="url" value={videoUrl} onChange={event => setVideoUrl(event.target.value)} className={input} /></label>
      <button className="w-full rounded-full bg-[#254B38] py-3 text-sm text-white">{pending ? t("Saving...", "Đang lưu...") : t("Save changes", "Lưu thay đổi")}</button>
    </fieldset>
  </form></ContentDialog>;
}
