import { apiFetch } from "@/lib/api";

export interface UserNotification {
  id: number;
  type: string;
  message: string;
  postId: number | null;
  isRead: boolean;
  createdAt: string;
}

export async function getNotifications(): Promise<UserNotification[]> {
  const response = await apiFetch("/api/notifications", { cache: "no-store" });
  if (!response.ok) throw new Error("Không tải được thông báo.");
  return response.json();
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await apiFetch("/api/notifications/unread-count", { cache: "no-store" });
  if (!response.ok) throw new Error("Không tải được số thông báo chưa đọc.");
  const body = await response.json() as { count: number };
  return body.count;
}

export async function markNotificationRead(id: number): Promise<void> {
  const response = await apiFetch(`/api/notifications/${id}/read`, { method: "PUT" });
  if (!response.ok) throw new Error("Không đánh dấu được thông báo.");
}
