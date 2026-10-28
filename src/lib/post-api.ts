import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";

export type PostType = "BLOG" | "QUESTION" | "RECIPE" | "VIDEO";

export interface CreatePostPayload {
  title: string;
  content: string;
  postType: PostType;
  videoUrl: string | null;
}

export interface PostResponse {
  postId: number;
  userId: number;
  authorName: string;
  title: string;
  content: string;
  postType: PostType;
  videoUrl: string | null;
  status: string;
  moderationReason?: string | null;
  thumbnailUrl: string | null;
  averageRating: number;
  ratingCount: number;
  commentCount: number;
  currentUserRating: number | null;
  createdAt: string;
  updatedAt: string;
  compatibleDietTypes: { id: number; name: string }[];
}

export class PostApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "PostApiError";
  }
}

export function communityError(error: unknown): string {
  if (!(error instanceof PostApiError)) return "Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.";
  const messages: Record<number, string> = {
    400: "Dữ liệu không hợp lệ. Kiểm tra nội dung và thử lại.",
    401: "Bạn cần đăng nhập hoặc phiên đăng nhập đã hết hạn.",
    403: "Bạn không có quyền thực hiện thao tác này.",
    404: "Không tìm thấy nội dung. Nội dung có thể đã bị xóa.",
    409: "Nội dung hoặc thao tác này đã tồn tại.",
  };
  return messages[error.status] ? `${messages[error.status]} ${error.message}`.trim() : error.message || "Máy chủ không xử lý được yêu cầu. Vui lòng thử lại.";
}

async function request<T>(path: string, method = "GET", body?: unknown, signal?: AbortSignal): Promise<T> {
  if ((method !== "GET" || path === "/api/users/me/bookmarks") && !getStoredToken()) {
    throw new PostApiError(401, "");
  }
  const response = await apiFetch(path, { method, signal, cache: "no-store", ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  if (!response.ok) {
    const raw = await response.text();
    let detail = "";
    try {
      const data = JSON.parse(raw);
      detail = [data.message, data.detail, data.title].find(value => typeof value === "string") || "";
      if (data.errors && typeof data.errors === "object") detail = Object.values(data.errors).flat().filter(value => typeof value === "string").join(" ") || detail;
    } catch { /* Status-specific UI handles non-JSON error pages. */ }
    throw new PostApiError(response.status, detail);
  }
  if (response.status === 204) return undefined as T;
  const raw = await response.text();
  return (raw.trim() ? JSON.parse(raw) : undefined) as T;
}

export interface PostFilters { keyword?: string; postType?: string }
export function getPosts(filters: PostFilters = {}, signal?: AbortSignal) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value) query.set(key, value); });
  return request<PostResponse[]>(`/api/posts${query.size ? `?${query}` : ""}`, "GET", undefined, signal);
}
export const getPost = (id: number, signal?: AbortSignal) => request<PostResponse>(`/api/posts/${id}`, "GET", undefined, signal);
export const updatePost = (id: number, payload: CreatePostPayload) => request<void>(`/api/posts/${id}`, "PUT", { ...payload, status: null });
export const deletePost = (id: number) => request<void>(`/api/posts/${id}`, "DELETE");

export interface CommentResponse {
  commentId: number; postId: number; userId: number; authorName: string;
  parentCommentId: number | null; content: string; status: string; replies: CommentResponse[];
}
export const getComments = (id: number, signal?: AbortSignal) => request<CommentResponse[]>(`/api/posts/${id}/comments`, "GET", undefined, signal);
export const addComment = (id: number, content: string) => request<CommentResponse>(`/api/posts/${id}/comments`, "POST", { content });
export const replyToComment = (id: number, content: string) => request<CommentResponse>(`/api/comments/${id}/replies`, "POST", { content });
export const updateComment = (id: number, content: string) => request<void>(`/api/comments/${id}`, "PUT", { content });
export const deleteComment = (id: number) => request<void>(`/api/comments/${id}`, "DELETE");
export const getRating = (id: number, signal?: AbortSignal) => request<{ averageRating: number }>(`/api/posts/${id}/rating`, "GET", undefined, signal);
export const ratePost = (id: number, rating: number, hasExistingRating = false) => request<void>(`/api/posts/${id}/rating`, hasExistingRating ? "PUT" : "POST", { rating });
export const getBookmarks = (signal?: AbortSignal) => request<PostResponse[]>("/api/users/me/bookmarks", "GET", undefined, signal);
export const bookmarkPost = (id: number) => request<void>(`/api/posts/${id}/bookmark`, "POST");
export const removeBookmark = (id: number) => request<void>(`/api/posts/${id}/bookmark`, "DELETE");

export async function createPost(payload: CreatePostPayload): Promise<PostResponse> {
  // Recipes with ingredients/steps use /api/recipes, never a second /api/posts call.
  const post = await request<PostResponse>("/api/posts", "POST", payload);
  if (!post || !Number.isInteger(post.postId) || post.postId <= 0 || !["PUBLISHED", "DRAFT"].includes(post.status) || typeof post.title !== "string") {
    throw new PostApiError(201, "");
  }
  return post;
}
