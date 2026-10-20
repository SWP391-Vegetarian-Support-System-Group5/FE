"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, apiGet, getMediaUrl } from "@/lib/api";
import type { PostResponse } from "@/lib/post-api";

export const BYPASS_ADMIN_ROLE = false;

interface ModerationFlag {
  flagId: number;
  postId: number | null;
  commentId: number | null;
  source: string;
  reason: string | null;
  status: string;
  reportedBy: number | null;
}

interface AdminComment {
  commentId: number;
  postId: number;
  authorName: string;
  content: string;
}

export interface FlaggedItem {
  id: string;
  postId?: number;
  category: "Recipe & Video" | "Post" | "Comment";
  flagTime: string;
  flagTypeTag: string;
  flagTypeColor: string;
  title: string;
  authorName: string;
  authorBadge: string;
  authorAvatar?: string;
  authorInitials?: string;
  image?: string;
  videoDuration?: string;
  location?: string;
  commentQuote?: string;
  commentThread?: string;
  flagReason: string;
  flagSubBadge?: string;
  flagSubText?: string;
}

interface AdminModerationContextType {
  flaggedCount: number;
  contentCount: number;
  commentsCount: number;
  recipesCount: number;
  postsCount: number;
  items: FlaggedItem[];
  loading: boolean;
  error: string;
  dismissFlag: (id: string) => Promise<void>;
  removeContent: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminModerationContext = createContext<AdminModerationContextType | undefined>(undefined);

export function AdminModerationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<FlaggedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (user?.role?.toLowerCase() !== "admin") return;
    setLoading(true);
    setError("");
    try {
      const [flags, posts, comments] = await Promise.all([
        apiGet<ModerationFlag[]>("/api/admin/moderation"),
        apiGet<PostResponse[]>("/api/admin/posts"),
        apiGet<AdminComment[]>("/api/admin/comments"),
      ]);
      const byPost = new Map(posts.map(post => [post.postId, post]));
      const byComment = new Map(comments.map(comment => [comment.commentId, comment]));
      setItems(flags.filter(flag => flag.status.toUpperCase() === "PENDING").map(flag => {
        const comment = flag.commentId ? byComment.get(flag.commentId) : undefined;
        const post = byPost.get(flag.postId ?? comment?.postId ?? -1);
        const category: FlaggedItem["category"] = flag.commentId != null ? "Comment" : post?.postType === "RECIPE" || post?.postType === "VIDEO" ? "Recipe & Video" : "Post";
        const authorName = comment?.authorName || post?.authorName || "Thành viên";
        return {
          id: String(flag.flagId), postId: post?.postId, category, flagTime: `#${flag.flagId}`,
          flagTypeTag: flag.source === "USER_REPORT" ? "Báo cáo cộng đồng" : flag.source,
          flagTypeColor: "bg-[#FEE2E2] text-[#C2410C]",
          title: comment?.content || post?.title || `Nội dung #${flag.postId ?? flag.commentId}`,
          authorName, authorBadge: `#${comment?.commentId ?? post?.postId ?? flag.flagId}`,
          authorInitials: authorName.split(/\s+/).map(part => part[0]).slice(-2).join("").toUpperCase(),
          image: getMediaUrl(post?.thumbnailUrl) || undefined,
          commentQuote: comment?.content, commentThread: post?.title,
          flagReason: flag.reason || "Không có lý do chi tiết.",
          flagSubBadge: flag.reportedBy ? `Người báo cáo #${flag.reportedBy}` : undefined,
        };
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không tải được danh sách báo cáo.");
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      if (user?.role?.toLowerCase() === "admin") return refresh();
      setItems([]);
      setError("");
    });
  }, [user?.role, refresh]);

  const review = useCallback(async (id: string, action: "approve" | "remove") => {
    const response = await apiFetch(`/api/admin/moderation/${encodeURIComponent(id)}/${action}`, { method: "POST" });
    if (!response.ok) throw new Error(`Không xử lý được báo cáo #${id} (${response.status}).`);
    await refresh();
  }, [refresh]);
  const dismissFlag = useCallback((id: string) => review(id, "approve"), [review]);
  const removeContent = useCallback((id: string) => review(id, "remove"), [review]);

  const recipesCount = items.filter(item => item.category === "Recipe & Video").length;
  const postsCount = items.filter(item => item.category === "Post").length;
  const commentsCount = items.filter(item => item.category === "Comment").length;
  const value = useMemo(() => ({
    flaggedCount: items.length, contentCount: recipesCount + postsCount, commentsCount, recipesCount, postsCount,
    items, loading, error, dismissFlag, removeContent, refresh,
  }), [items, loading, error, recipesCount, postsCount, commentsCount, dismissFlag, removeContent, refresh]);

  return <AdminModerationContext.Provider value={value}>{children}</AdminModerationContext.Provider>;
}

export function useAdminModeration() {
  const context = useContext(AdminModerationContext);
  if (!context) throw new Error("useAdminModeration must be used within an AdminModerationProvider");
  return context;
}
