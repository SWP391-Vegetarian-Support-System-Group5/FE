import { apiFetch } from "@/lib/api";

export interface AdminPost {
  postId: number;
  title: string;
  content: string;
  postType: string;
  authorName: string;
  status: string;
  thumbnailUrl: string | null;
  commentCount: number;
}

export interface AdminComment {
  commentId: number;
  postId: number;
  authorName: string;
  content: string;
  status: string;
  createdAt: string;
}

export interface AdminFlag {
  flagId: number;
  commentId: number | null;
  status: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, { cache: "no-store", ...options });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

export function getAdminContent(signal?: AbortSignal) {
  return Promise.all([
    request<AdminPost[]>("/api/admin/posts", { signal }),
    request<AdminComment[]>("/api/admin/comments", { signal }),
    request<AdminFlag[]>("/api/admin/moderation", { signal }),
  ]);
}

export function deleteAdminPost(id: number) {
  return request<void>(`/api/admin/posts/${id}`, { method: "DELETE" });
}

export function deleteAdminComment(id: number) {
  return request<void>(`/api/admin/comments/${id}`, { method: "DELETE" });
}

export function setAdminCommentVisibility(id: number, hidden: boolean) {
  return request<void>(`/api/admin/comments/${id}/visibility`, {
    method: "PUT",
    body: JSON.stringify({ hidden }),
  });
}
