import { API_BASE_URL, apiFetch, apiGet } from "@/lib/api";
import type { RecipeResponse } from "@/lib/recipe-api";

export interface PostResponse {
  postId: number;
  userId: number;
  authorName: string;
  title: string;
  content: string;
  postType: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  status: string;
  averageRating: number;
  ratingCount: number;
  commentCount: number;
  currentUserRating: number | null;
  createdAt: string;
  updatedAt: string;
  compatibleDietTypes: { id: number; name: string }[];
}

export interface CommentResponse {
  commentId: number;
  postId: number;
  userId: number;
  authorName: string;
  parentCommentId: number | null;
  content: string;
  status: string;
  replies: CommentResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CommunityEvent {
  type: string;
  postId: number | null;
  post: PostResponse | null;
  comment: CommentResponse | null;
  averageRating: number | null;
  ratingCount: number | null;
  commentCount: number | null;
}

export function listPosts(params: { postType?: string; limit?: number; keyword?: string; category?: number; categoryType?: string } = {}) {
  const query = new URLSearchParams();
  if (params.postType) query.set("postType", params.postType);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.category) query.set("category", String(params.category));
  if (params.categoryType) query.set("categoryType", params.categoryType);
  if (params.keyword) query.set("keyword", params.keyword);
  const suffix = query.toString();
  return apiGet<PostResponse[]>(`/api/posts${suffix ? `?${suffix}` : ""}`);
}

export function getPost(postId: number) {
  return apiGet<PostResponse>(`/api/posts/${postId}`);
}

export function getMyPosts() {
  return apiGet<PostResponse[]>("/api/users/me/posts");
}

export function getPostComments(postId: number) {
  return apiGet<CommentResponse[]>(`/api/posts/${postId}/comments`);
}

export class CommunityApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "CommunityApiError";
  }
}

export async function addPostComment(postId: number, content: string) {
  const res = await apiFetch(`/api/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null) as { message?: string } | null;
    throw new CommunityApiError(res.status, body?.message || `Comment failed: ${res.status}`);
  }
  return (await res.json()) as CommentResponse;
}

export async function setPostRating(postId: number, rating: number, hasExistingRating: boolean) {
  const res = await apiFetch(`/api/posts/${postId}/rating`, {
    method: hasExistingRating ? "PUT" : "POST",
    body: JSON.stringify({ rating }),
  });
  if (!res.ok) throw new CommunityApiError(res.status, `Rating failed: ${res.status}`);
}

export async function deletePostRating(postId: number) {
  const res = await apiFetch(`/api/posts/${postId}/rating`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete rating failed: ${res.status}`);
}

export function createCommunityEventSource() {
  const base = API_BASE_URL.replace(/\/+$/, "");
  return new EventSource(`${base}/api/community/events`);
}

export function postToRecipe(post: PostResponse): RecipeResponse {
  return {
    postId: post.postId,
    title: post.title,
    recipeName: "",
    content: post.content,
    status: post.status,
    servings: null,
    ingredients: [],
    steps: [],
    compatibleDietTypeIds: [],
    videoUrl: post.videoUrl,
    thumbnailUrl: post.thumbnailUrl,
    prepMinutes: null,
    cookMinutes: null,
    categories: [],
  };
}
