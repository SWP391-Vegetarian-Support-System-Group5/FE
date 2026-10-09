import { apiFetch } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";

export interface RelatedRecipe {
  recipeId: number;
  title: string;
}

export interface ChatMessageItem {
  chatMessageId?: number | null;
  sender: "USER" | "AI";
  content: string;
  createdAt?: string;
  relatedRecipes?: RelatedRecipe[];
  sources?: string[];
}

export interface ChatSessionSummary {
  chatSessionId: number;
  userId: number | null;
  createdAt: string;
  messages: ChatMessageItem[];
  guestAccessToken?: string | null;
}

export interface SendMessageResponse {
  chatMessageId: number | null;
  answer: string | null;
  relatedRecipes?: RelatedRecipe[];
  sources?: string[];
  remainingGuestMessages?: number | null;
  signupRequired?: boolean;
}

export interface GuestChatSession {
  chatSessionId: number;
  guestAccessToken: string;
}

const GUEST_CHAT_SESSION_KEY = "veggie_guest_chat_session";

export function getStoredGuestSession(): GuestChatSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GUEST_CHAT_SESSION_KEY);
    return raw ? (JSON.parse(raw) as GuestChatSession) : null;
  } catch {
    return null;
  }
}

export function saveStoredGuestSession(session: GuestChatSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_CHAT_SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage errors
  }
}

export function clearStoredGuestSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GUEST_CHAT_SESSION_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Creates a new chat session: POST /api/chat/sessions
 * If logged in, Authorization header is automatically attached by apiFetch.
 * If guest, response contains guestAccessToken which is saved.
 */
export async function createChatSession(): Promise<ChatSessionSummary> {
  const res = await apiFetch("/api/chat/sessions", {
    method: "POST",
  });

  if (!res.ok) {
    let errMsg = `Không thể tạo phiên hội thoại (${res.status})`;
    try {
      const errData = await res.json();
      errMsg = errData.message || errData.title || errMsg;
    } catch {
      // Ignore
    }
    throw new Error(errMsg);
  }

  const data = (await res.json()) as ChatSessionSummary;

  // If this is a guest session, store guest token & session id
  if (data.guestAccessToken) {
    saveStoredGuestSession({
      chatSessionId: data.chatSessionId,
      guestAccessToken: data.guestAccessToken,
    });
  }

  return data;
}

/**
 * Get all chat sessions for logged in user: GET /api/chat/sessions
 */
export async function getUserChatSessions(): Promise<ChatSessionSummary[]> {
  const token = getStoredToken();
  if (!token) return [];

  const res = await apiFetch("/api/chat/sessions", {
    method: "GET",
  });

  if (!res.ok) {
    let errMsg = `Không thể tải lịch sử trò chuyện (${res.status})`;
    try {
      const errData = await res.json();
      errMsg = errData.message || errData.title || errMsg;
    } catch {
      // Ignore
    }
    throw new Error(errMsg);
  }

  const data = await res.json();
  if (Array.isArray(data)) {
    return data as ChatSessionSummary[];
  }
  return [];
}

/**
 * Get a specific chat session: GET /api/chat/sessions/{id}
 * Passes X-Guest-Chat-Token if guestToken is provided or stored.
 */
export async function getChatSessionById(
  id: number,
  guestToken?: string | null
): Promise<ChatSessionSummary> {
  const headers: Record<string, string> = {};
  const tokenToUse = guestToken || (!getStoredToken() ? getStoredGuestSession()?.guestAccessToken : null);

  if (tokenToUse) {
    headers["X-Guest-Chat-Token"] = tokenToUse;
  }

  const res = await apiFetch(`/api/chat/sessions/${id}`, {
    method: "GET",
    headers,
  });

  if (!res.ok) {
    let errMsg = `Không thể tải nội dung hội thoại (${res.status})`;
    try {
      const errData = await res.json();
      errMsg = errData.message || errData.title || errMsg;
    } catch {
      // Ignore
    }
    throw new Error(errMsg);
  }

  return (await res.json()) as ChatSessionSummary;
}

/**
 * Send a message in session: POST /api/chat/sessions/{id}/messages
 * Body: { content: string } (max 1000 chars)
 */
export async function sendChatMessage(
  sessionId: number,
  content: string,
  guestToken?: string | null
): Promise<SendMessageResponse> {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("Nội dung tin nhắn không được để trống.");
  }
  if (trimmed.length > 1000) {
    throw new Error("Nội dung tin nhắn tối đa 1000 ký tự.");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const tokenToUse = guestToken || (!getStoredToken() ? getStoredGuestSession()?.guestAccessToken : null);

  if (tokenToUse) {
    headers["X-Guest-Chat-Token"] = tokenToUse;
  }

  const res = await apiFetch(`/api/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({ content: trimmed }),
  });

  if (!res.ok) {
    let errMsg = `Lỗi gửi tin nhắn (${res.status})`;
    let signupRequired = false;
    try {
      const errData = await res.json();
      errMsg = errData.message || errData.title || errMsg;
      if (errData.signupRequired) signupRequired = true;
    } catch {
      // Ignore
    }
    const err = new Error(errMsg) as Error & { signupRequired?: boolean; status?: number };
    err.signupRequired = signupRequired;
    err.status = res.status;
    throw err;
  }

  return (await res.json()) as SendMessageResponse;
}

/**
 * Helper to get a human-friendly title for a chat session.
 * Takes the first USER message content or "Cuộc trò chuyện mới"
 */
export function getSessionTitle(session: ChatSessionSummary): string {
  if (!session.messages || session.messages.length === 0) {
    return "Cuộc trò chuyện mới";
  }
  const firstUserMsg = session.messages.find((m) => m.sender === "USER");
  if (firstUserMsg && firstUserMsg.content?.trim()) {
    const raw = firstUserMsg.content.trim();
    return raw.length > 36 ? raw.slice(0, 36) + "..." : raw;
  }
  return "Cuộc trò chuyện mới";
}

/**
 * Groups sessions by date into:
 * - "Hôm nay" (Today)
 * - "Hôm qua" (Yesterday)
 * - "7 ngày trước" (Previous 7 Days)
 * - "Cũ hơn" (Older)
 */
export interface GroupedSessions {
  category: "HÔM NAY" | "HÔM QUA" | "7 NGÀY TRƯỚC" | "CŨ HƠN";
  sessions: ChatSessionSummary[];
}

export function groupSessionsByDate(sessions: ChatSessionSummary[]): GroupedSessions[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const startOfYesterday = startOfToday - oneDayMs;
  const startOf7Days = startOfToday - 7 * oneDayMs;

  const todayList: ChatSessionSummary[] = [];
  const yesterdayList: ChatSessionSummary[] = [];
  const previous7DaysList: ChatSessionSummary[] = [];
  const olderList: ChatSessionSummary[] = [];

  for (const session of sessions) {
    const createdDate = new Date(session.createdAt).getTime();
    if (isNaN(createdDate) || createdDate >= startOfToday) {
      todayList.push(session);
    } else if (createdDate >= startOfYesterday) {
      yesterdayList.push(session);
    } else if (createdDate >= startOf7Days) {
      previous7DaysList.push(session);
    } else {
      olderList.push(session);
    }
  }

  const result: GroupedSessions[] = [];
  if (todayList.length > 0) result.push({ category: "HÔM NAY", sessions: todayList });
  if (yesterdayList.length > 0) result.push({ category: "HÔM QUA", sessions: yesterdayList });
  if (previous7DaysList.length > 0) result.push({ category: "7 NGÀY TRƯỚC", sessions: previous7DaysList });
  if (olderList.length > 0) result.push({ category: "CŨ HƠN", sessions: olderList });

  return result;
}
