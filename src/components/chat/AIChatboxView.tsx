"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getStoredToken } from "@/lib/auth";
import {
  ChatMessageItem,
  ChatSessionSummary,
  GroupedSessions,
  createChatSession,
  getUserChatSessions,
  getChatSessionById,
  sendChatMessage,
  getSessionTitle,
  groupSessionsByDate,
  getStoredGuestSession,
} from "@/lib/chat-api";

function formatMessageTime(dateStr?: string): string {
  if (!dateStr) {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? ""
      : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

const SAMPLE_PROMPTS = [
  "Đậu hũ có đủ đạm cho bữa tối sau tập gym không?",
  "Lên thực đơn ăn chay 7 ngày cân bằng dinh dưỡng",
  "Các món chay giàu canxi và sắt cho người mới bắt đầu",
];

export default function AIChatboxView() {
  const { user } = useAuth();

  // Sessions and active conversation state
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);

  // UI status
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupRequired, setSignupRequired] = useState(false);
  const [remainingGuestMessages, setRemainingGuestMessages] = useState<number | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Load chat history for authenticated user
  const loadUserSessions = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return [];
    setIsLoadingHistory(true);
    try {
      const data = await getUserChatSessions();
      setSessions(data);
      return data;
    } catch {
      // Ignore background refresh errors
      return [];
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Initial setup: load sessions or guest session
  useEffect(() => {
    let isCancelled = false;

    async function init() {
      setIsLoadingSession(true);
      setError(null);
      const token = getStoredToken();

      try {
        if (token) {
          // Logged-in user
          const loadedSessions = await loadUserSessions();
          if (isCancelled) return;

          if (loadedSessions.length > 0) {
            // Select the most recent session
            const latest = loadedSessions[0];
            setActiveSessionId(latest.chatSessionId);
            setGuestToken(null);
            const fullSession = await getChatSessionById(latest.chatSessionId);
            if (!isCancelled) {
              setMessages(fullSession.messages || []);
            }
          } else {
            // No sessions exist yet, create a fresh session
            const newSession = await createChatSession();
            if (!isCancelled) {
              setActiveSessionId(newSession.chatSessionId);
              setSessions([newSession]);
              setMessages(newSession.messages || []);
            }
          }
        } else {
          // Guest user: restore stored guest session if available
          const stored = getStoredGuestSession();
          if (stored) {
            setActiveSessionId(stored.chatSessionId);
            setGuestToken(stored.guestAccessToken);
            try {
              const fullSession = await getChatSessionById(
                stored.chatSessionId,
                stored.guestAccessToken
              );
              if (!isCancelled) {
                setMessages(fullSession.messages || []);
              }
            } catch {
              // Stored guest session expired, create fresh
              const fresh = await createChatSession();
              if (!isCancelled) {
                setActiveSessionId(fresh.chatSessionId);
                setGuestToken(fresh.guestAccessToken || null);
                setMessages(fresh.messages || []);
              }
            }
          } else {
            // Create brand new guest session
            const fresh = await createChatSession();
            if (!isCancelled) {
              setActiveSessionId(fresh.chatSessionId);
              setGuestToken(fresh.guestAccessToken || null);
              setMessages(fresh.messages || []);
            }
          }
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg =
            err instanceof Error ? err.message : "Không thể khởi tạo phiên trò chuyện";
          setError(msg);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingSession(false);
        }
      }
    }

    init();

    return () => {
      isCancelled = true;
    };
  }, [loadUserSessions]);

  // Select a session from the sidebar
  const handleSelectSession = async (sessionId: number) => {
    if (sessionId === activeSessionId) {
      setIsMobileSidebarOpen(false);
      return;
    }

    setIsLoadingSession(true);
    setError(null);
    setSignupRequired(false);
    setIsMobileSidebarOpen(false);

    try {
      const fullSession = await getChatSessionById(sessionId, guestToken);
      setActiveSessionId(sessionId);
      setMessages(fullSession.messages || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tải hội thoại";
      setError(msg);
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Click "New Chat" button
  const handleNewChat = async () => {
    setIsLoadingSession(true);
    setError(null);
    setSignupRequired(false);
    setIsMobileSidebarOpen(false);

    try {
      const newSession = await createChatSession();
      setActiveSessionId(newSession.chatSessionId);
      setGuestToken(newSession.guestAccessToken || null);
      setMessages([]);
      setRemainingGuestMessages(null);

      // Prepend to sessions list if user is logged in
      const token = getStoredToken();
      if (token) {
        setSessions((prev) => [newSession, ...prev]);
      }
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tạo hội thoại mới";
      setError(msg);
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Send message
  const handleSendMessage = async (customContent?: string) => {
    const content = (customContent || inputValue).trim();
    if (!content || isThinking) return;

    if (content.length > 1000) {
      setError("Nội dung tin nhắn tối đa 1000 ký tự.");
      return;
    }

    setError(null);
    if (!customContent) {
      setInputValue("");
    }

    // Add optimistic USER message
    const optimisticMsg: ChatMessageItem = {
      sender: "USER",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setIsThinking(true);

    try {
      let currentSessionId = activeSessionId;
      let currentGuestToken = guestToken;

      // If no active session yet, create one
      if (!currentSessionId) {
        const fresh = await createChatSession();
        currentSessionId = fresh.chatSessionId;
        currentGuestToken = fresh.guestAccessToken || null;
        setActiveSessionId(currentSessionId);
        setGuestToken(currentGuestToken);
      }

      const res = await sendChatMessage(currentSessionId, content, currentGuestToken);

      if (res.signupRequired) {
        setSignupRequired(true);
      }
      if (res.remainingGuestMessages !== undefined) {
        setRemainingGuestMessages(res.remainingGuestMessages);
      }

      const aiMsg: ChatMessageItem = {
        chatMessageId: res.chatMessageId,
        sender: "AI",
        content: res.answer || "Không nhận được phản hồi từ AI.",
        createdAt: new Date().toISOString(),
        relatedRecipes: res.relatedRecipes,
        sources: res.sources,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // If user is logged in and this was the first message in this session, update title in sidebar
      const token = getStoredToken();
      if (token && currentSessionId) {
        setSessions((prev) =>
          prev.map((s) => {
            if (s.chatSessionId === currentSessionId && (!s.messages || s.messages.length === 0)) {
              return {
                ...s,
                messages: [optimisticMsg, aiMsg],
              };
            }
            return s;
          })
        );
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string; signupRequired?: boolean };
      if (errorObj?.signupRequired) {
        setSignupRequired(true);
      }
      setError(errorObj?.message || "Lỗi khi gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setIsThinking(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  // Group user sessions for sidebar
  const groupedSessions: GroupedSessions[] = groupSessionsByDate(sessions);
  const isLoggedIn = isMounted && (!!user || !!getStoredToken());

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="relative flex h-[calc(100vh-140px)] min-h-[640px] max-h-[850px] gap-6">
        {/* ========================================================================= */}
        {/* Left Sidebar: Chat History */}
        {/* ========================================================================= */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-72 transform bg-[#F5F3F0] p-5 shadow-lg transition-transform duration-300 md:static md:z-auto md:w-72 md:translate-x-0 md:rounded-2xl md:border md:border-[#EFEEEB] md:shadow-xs flex flex-col justify-between shrink-0 ${
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Top section: New Chat button & grouped history */}
          <div className="flex flex-col min-h-0 flex-1">
            {/* Mobile close button */}
            <div className="flex items-center justify-between pb-3 md:hidden">
              <span className="font-serif text-lg font-bold text-[#07241A]">
                Lịch sử hội thoại
              </span>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="rounded-lg p-1 text-[#727974] hover:bg-black/5"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* New Chat Button */}
            <button
              type="button"
              onClick={handleNewChat}
              disabled={isLoadingSession}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#07241A] px-4 py-2.5 text-sm font-semibold tracking-wide text-white shadow-xs transition hover:bg-[#1E3A2F] disabled:opacity-60 cursor-pointer"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New Chat</span>
            </button>

            {/* History Groupings List */}
            <div className="mt-5 flex-1 overflow-y-auto pr-1 space-y-4">
              {isLoggedIn ? (
                isLoadingHistory && sessions.length === 0 ? (
                  <div className="space-y-2 pt-2">
                    <div className="h-8 animate-pulse rounded-xl bg-[#E4E2DF]" />
                    <div className="h-8 animate-pulse rounded-xl bg-[#E4E2DF]" />
                    <div className="h-8 animate-pulse rounded-xl bg-[#E4E2DF]" />
                  </div>
                ) : groupedSessions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#727974]">
                    Chưa có cuộc trò chuyện nào. Bấm "New Chat" để bắt đầu!
                  </div>
                ) : (
                  groupedSessions.map((group) => (
                    <div key={group.category} className="space-y-1">
                      <div className="px-2 text-[11px] font-semibold tracking-wider text-[#727974]">
                        {group.category}
                      </div>
                      <div className="space-y-0.5">
                        {group.sessions.map((item) => {
                          const isActive = item.chatSessionId === activeSessionId;
                          return (
                            <button
                              key={item.chatSessionId}
                              type="button"
                              onClick={() => handleSelectSession(item.chatSessionId)}
                              className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition cursor-pointer ${
                                isActive
                                  ? "bg-[#D9E6DC] font-semibold text-[#07241A] shadow-xs"
                                  : "text-[#424844] hover:bg-black/5"
                              }`}
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`shrink-0 ${
                                  isActive ? "text-[#07241A]" : "text-[#727974]"
                                }`}
                              >
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                              </svg>
                              <span className="truncate flex-1">
                                {getSessionTitle(item)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )
              ) : (
                /* Guest view in sidebar */
                <div className="space-y-3 pt-2">
                  <div className="rounded-xl bg-white/70 p-3 text-xs leading-relaxed text-[#424844] border border-[#EFEEEB]">
                    <div className="flex items-center gap-1.5 font-semibold text-[#07241A] mb-1">
                      <span>👤</span>
                      <span>Chế độ khách</span>
                    </div>
                    Bạn đang sử dụng phiên khách (tối đa 5 tin nhắn/phiên). Đăng nhập để lưu trữ toàn bộ lịch sử trò chuyện lâu dài!
                  </div>
                  {activeSessionId && (
                    <div className="rounded-xl bg-[#D9E6DC] px-3 py-2 text-xs font-semibold text-[#07241A] flex items-center gap-2 shadow-xs">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span className="truncate">Hội thoại khách hiện tại</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom section of sidebar */}
          <div className="pt-4 border-t border-[#E4E2DF]">
            {!isLoggedIn ? (
              <div className="space-y-2">
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center rounded-xl bg-[#07241A] py-2 text-xs font-semibold text-white transition hover:bg-[#1E3A2F]"
                >
                  Đăng nhập để lưu lịch sử
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-1 text-xs text-[#727974]">
                <div className="h-2 w-2 rounded-full bg-[#16a34a]" />
                <span className="truncate font-medium text-[#424844]">
                  {user?.displayName || user?.email || "Đã kết nối"}
                </span>
              </div>
            )}
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* ========================================================================= */}
        {/* Right Main Chat Area */}
        {/* ========================================================================= */}
        <section className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white border border-[#EFEEEB] shadow-xs">
          {/* ── Chat Header ─────────────────────────────────────────────── */}
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#EFEEEB] bg-[#F5F3F0] px-5 sm:px-6">
            <div className="flex items-center gap-3">
              {/* Mobile Sidebar toggle button */}
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E4E2DF] bg-white text-[#07241A] md:hidden"
                aria-label="Open chat history"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              {/* Bot Avatar */}
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#07241A] text-white shadow-xs">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 8V4H8" />
                  <rect width="16" height="12" x="4" y="8" rx="2" />
                  <path d="M2 14h2" />
                  <path d="M20 14h2" />
                  <path d="M15 13v2" />
                  <path d="M9 13v2" />
                </svg>
              </div>

              {/* Title & Status */}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-xl font-bold leading-tight text-[#07241A]">
                    VeggieAI
                  </h1>
                  <span className="hidden text-xs text-[#727974] sm:inline">
                    · Culinary &amp; Nutrition Guide
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#424844]">
                  <span className="h-2 w-2 rounded-full bg-[#16a34a]" />
                  <span>Active · Tailored to vegetarian nutrition</span>
                </div>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2">
              {/* Guest remaining messages badge */}
              {remainingGuestMessages !== null && !isLoggedIn && (
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white border border-[#E4E2DF] px-3 py-1 text-xs font-semibold text-[#727974] shadow-xs">
                  <span>Còn {remainingGuestMessages} câu hỏi khách</span>
                </span>
              )}

              {/* Quick New Chat icon */}
              <button
                type="button"
                onClick={handleNewChat}
                title="Tạo hội thoại mới"
                disabled={isLoadingSession}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#E4E2DF] bg-white text-[#07241A] transition hover:bg-[#F5F3F0] cursor-pointer"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </header>

          {/* ── Message Stream Canvas ───────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto bg-[#FBF9F6] p-5 sm:p-6 space-y-6">
            {isLoadingSession && messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-[#727974]">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1E3A2F] border-t-transparent" />
                  <span>Đang kết nối VeggieAI...</span>
                </div>
              </div>
            ) : messages.length === 0 ? (
              /* Welcome screen when empty */
              <div className="flex flex-col items-center justify-center py-10 max-w-xl mx-auto text-center space-y-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#07241A] text-white shadow-md">
                  <span className="text-3xl">🤖</span>
                </div>
                <div className="space-y-2">
                  <h2 className="font-serif text-2xl font-bold text-[#07241A]">
                    Xin chào! Tôi có thể giúp gì cho bữa ăn chay của bạn?
                  </h2>
                  <p className="text-sm leading-relaxed text-[#424844]">
                    Hỏi tôi về thành phần dinh dưỡng, gợi ý thay thế đạm thực vật, hoặc lên kế hoạch bữa ăn phù hợp với mục tiêu sức khỏe của bạn.
                  </p>
                </div>

                {/* Prompt suggestions chips */}
                <div className="w-full space-y-2 pt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#727974]">
                    Gợi ý câu hỏi:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {SAMPLE_PROMPTS.map((prompt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendMessage(prompt)}
                        className="rounded-xl bg-white border border-[#EFEEEB] p-3 text-left text-xs font-medium text-[#07241A] shadow-xs hover:border-[#1E3A2F] hover:bg-[#F5F3F0] transition cursor-pointer"
                      >
                        "{prompt}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Message list */
              messages.map((msg, index) => {
                const isUser = msg.sender === "USER";

                if (isUser) {
                  return (
                    <div key={msg.chatMessageId || `user-${index}`} className="flex justify-end gap-3">
                      <div className="flex flex-col items-end max-w-[85%] sm:max-w-[70%]">
                        <div className="rounded-[16px_2px_16px_16px] bg-[#07241A] px-5 py-3.5 text-sm leading-relaxed text-white shadow-xs">
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <span className="mt-1 px-1 text-[11px] text-[#727974]">
                          {formatMessageTime(msg.createdAt)}
                        </span>
                      </div>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1E3A2F] text-xs font-bold text-white shadow-xs">
                        {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : "ME"}
                      </div>
                    </div>
                  );
                }

                // AI Message
                return (
                  <div key={msg.chatMessageId || `ai-${index}`} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#07241A] text-white text-sm shadow-xs">
                      🤖
                    </div>
                    <div className="flex flex-col items-start max-w-[88%] sm:max-w-[78%] space-y-2">
                      <div className="rounded-[2px_16px_16px_16px] bg-[#F5F3F0] border border-[#EFEEEB] px-5 py-4 text-sm leading-relaxed text-[#1B1C1A] shadow-xs space-y-3">
                        <p className="whitespace-pre-wrap">{msg.content}</p>

                        {/* Related Recipes if present */}
                        {msg.relatedRecipes && msg.relatedRecipes.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-[#E4E2DF] space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#07241A]">
                              <span>🥗</span>
                              <span>Công thức liên quan:</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {msg.relatedRecipes.map((recipe) => (
                                <Link
                                  key={recipe.recipeId}
                                  href={`/explore?recipeId=${recipe.recipeId}`}
                                  className="flex items-center gap-2.5 rounded-xl bg-white p-2.5 border border-[#EFEEEB] hover:border-[#1E3A2F] hover:shadow-xs transition group"
                                >
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#CAEADA] text-xs text-[#07241A]">
                                    🍲
                                  </div>
                                  <span className="text-xs font-medium text-[#07241A] group-hover:text-[#1E3A2F] truncate">
                                    {recipe.title}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sources if present */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-[#E4E2DF] flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-medium text-[#727974]">
                              Nguồn:
                            </span>
                            {msg.sources.map((src, i) => (
                              <span
                                key={i}
                                className="rounded-md bg-white px-2 py-0.5 text-[11px] text-[#424844] border border-[#E4E2DF]"
                              >
                                {src}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <span className="px-1 text-[11px] text-[#727974]">
                        {formatMessageTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Thinking status */}
            {isThinking && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#07241A] text-white text-sm shadow-xs">
                  🤖
                </div>
                <div className="rounded-[2px_16px_16px_16px] bg-[#F5F3F0] border border-[#EFEEEB] px-4 py-3 text-xs text-[#424844] flex items-center gap-2 shadow-xs">
                  <span className="font-medium">VeggieAI đang suy nghĩ</span>
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1E3A2F] animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1E3A2F] animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1E3A2F] animate-bounce" />
                  </span>
                </div>
              </div>
            )}

            {/* Error message card */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700">
                {error}
              </div>
            )}

            {/* Signup required card matching Figma node 2:4570 */}
            {signupRequired && (
              <div className="rounded-2xl bg-[#EFEEEB] border border-[#E4E2DF] p-6 shadow-sm space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#07241A] text-white">
                    🔒
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#07241A]">
                      Mở khóa toàn bộ tính năng với tài khoản VeggieMate
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-[#424844]">
                      Bạn đã đạt giới hạn 5 tin nhắn dành cho khách. Hãy đăng nhập hoặc đăng ký tài khoản miễn phí để tiếp tục trò chuyện không giới hạn, lưu lịch sử và nhận thực đơn cá nhân hóa!
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <Link
                    href="/login"
                    className="rounded-xl bg-[#07241A] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#1E3A2F]"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-[#07241A] border border-[#EFEEEB] shadow-xs transition hover:bg-[#F5F3F0]"
                  >
                    Đăng ký tài khoản
                  </Link>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Footer Sticky Bottom Input Bar & Disclaimer ─────────────── */}
          <footer className="border-t border-[#EFEEEB] bg-[#F5F3F0] p-4 sm:p-5">
            <form onSubmit={handleFormSubmit} className="space-y-2">
              <div className="flex items-center gap-2 rounded-2xl bg-white border border-[#EFEEEB] px-4 py-1.5 shadow-xs transition focus-within:border-[#1E3A2F] focus-within:ring-1 focus-within:ring-[#1E3A2F]">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isThinking || signupRequired}
                  maxLength={1000}
                  placeholder={
                    signupRequired
                      ? "Vui lòng đăng nhập để tiếp tục trò chuyện..."
                      : "Ask VeggieAI about nutrition, substitutions, or recipes..."
                  }
                  className="flex-1 bg-transparent py-2 text-sm text-[#07241A] placeholder-[#727974] outline-none disabled:opacity-60"
                />

                {/* Character Counter if typing much */}
                {inputValue.length > 700 && (
                  <span className="text-[11px] font-medium text-[#727974] shrink-0">
                    {inputValue.length}/1000
                  </span>
                )}

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={isThinking || !inputValue.trim() || signupRequired}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#07241A] text-white shadow-xs transition hover:bg-[#1E3A2F] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Send message"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>

              {/* Disclaimer */}
              <p className="text-center font-serif text-xs text-[#727974]">
                VeggieAI provides culinary and general nutritional guidance based on plant-based dietary recommendations.
              </p>
            </form>
          </footer>
        </section>
      </div>
    </div>
  );
}
