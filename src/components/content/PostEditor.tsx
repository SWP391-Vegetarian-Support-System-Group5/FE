"use client";

import { useEffect, useRef, useState } from "react";
import { communityError, getPostCategories, getPostTags, updatePost, type CommunityLookup, type PostResponse, type PostType } from "@/lib/post-api";
import ContentDialog from "./ContentDialog";

export default function PostEditor({ post, onSaved, onClose }: { post: PostResponse; onSaved: () => Promise<void>; onClose: () => void }) {
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [postType, setPostType] = useState<PostType>(post.postType);
  const [categoryId, setCategoryId] = useState<number | null>(post.categoryId);
  const [videoUrl, setVideoUrl] = useState(post.videoUrl || "");
  const [categories, setCategories] = useState<CommunityLookup[]>([]);
  const [tags, setTags] = useState<CommunityLookup[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [lookupsReady, setLookupsReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    Promise.all([getPostCategories(), getPostTags()]).then(([categories, tags]) => {
      if (!active) return;
      const matched = post.tags.map(name => tags.find(tag => tag.name === name));
      if (matched.some(tag => !tag)) throw new Error("Một thẻ của bài viết không còn trong danh mục. Tải lại bài viết trước khi sửa.");
      setCategories(categories); setTags(tags); setTagIds(matched.map(tag => tag!.id)); setLookupsReady(true);
    }).catch(e => { if (active) setError(e instanceof Error && !("status" in e) ? e.message : communityError(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [post]);
  const input = "mt-2 w-full rounded-xl border border-[#E5E7DF] bg-white px-4 py-3 text-sm outline-none focus:border-[#254B38]";
  return <ContentDialog title="Sửa bài viết" onClose={() => { if (!lock.current) onClose(); }}><form className="space-y-5 p-6" onSubmit={async e => {
    e.preventDefault(); if (lock.current || !lookupsReady) return;
    if (!title.trim() || title.trim().length > 250 || !content.trim()) { setError("Tiêu đề và nội dung bắt buộc; tiêu đề tối đa 250 ký tự."); return; }
    lock.current = true; setPending(true); setError("");
    try {
      await updatePost(post.postId, { title: title.trim(), content: content.trim(), postType, categoryId, videoUrl: videoUrl.trim() || null, tagIds });
      await onSaved(); onClose();
    } catch (error) { setError(communityError(error)); }
    finally { lock.current = false; setPending(false); }
  }}>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {loading && <p role="status" className="text-sm">Đang tải danh mục và thẻ…</p>}
    <fieldset disabled={!lookupsReady || pending} className="space-y-4 disabled:opacity-60">
      <label className="block text-sm">Tiêu đề<input required maxLength={250} value={title} onChange={e => setTitle(e.target.value)} className={input} /></label>
      <label className="block text-sm">Nội dung<textarea required rows={7} value={content} onChange={e => setContent(e.target.value)} className={input} /></label>
      <label className="block text-sm">Loại bài<select value={postType} onChange={e => setPostType(e.target.value as PostType)} className={input}>{["BLOG", "QUESTION", "RECIPE", "VIDEO"].map(type => <option key={type}>{type}</option>)}</select></label>
      <label className="block text-sm">Danh mục<select value={categoryId ?? ""} onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : null)} className={input}><option value="">Không chọn danh mục</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label className="block text-sm">Video URL<input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className={input} /></label>
      <div className="flex flex-wrap gap-3">{tags.map(tag => <label key={tag.id} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={tagIds.includes(tag.id)} onChange={e => setTagIds(ids => e.target.checked ? [...ids, tag.id] : ids.filter(id => id !== tag.id))} />{tag.name}</label>)}</div>
      <p className="text-xs text-[#727974]">Phần nguyên liệu và bước nấu của công thức được quản lý riêng.</p>
      <button className="w-full rounded-full bg-[#254B38] py-3 text-sm text-white">{pending ? "Đang lưu…" : "Lưu thay đổi"}</button>
    </fieldset>
  </form></ContentDialog>;
}
