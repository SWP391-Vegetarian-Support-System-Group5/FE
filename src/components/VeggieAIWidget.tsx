"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getStoredToken } from "@/lib/auth";
import {
  ChatMessageItem,
  createChatSession,
  getChatSessionById,
  getUserChatSessions,
  sendChatMessage,
  getStoredGuestSession,
  saveStoredGuestSession,
} from "@/lib/chat-api";

export default function VeggieAIWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupRequired, setSignupRequired] = useState(false);
  const [remainingGuestMessages, setRemainingGuestMessages] = useState<number | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isThinking]);

  // Load existing session when opened
  const initSession = useCallback(async () => {
    setIsLoadingSession(true);
    setError(null);
    try {
      const token = getStoredToken();
      if (token) {
        // Logged-in user: get most recent session
        const sessions = await getUserChatSessions();
        if (sessions.length > 0) {
          const latest = sessions[0];
          setSessionId(latest.chatSessionId);
          setGuestToken(null);
          const fullSession = await getChatSessionById(latest.chatSessionId);
          setMessages(fullSession.messages || []);
        } else {
          // No sessions yet, create one
          const newSession = await createChatSession();
          setSessionId(newSession.chatSessionId);
          setMessages(newSession.messages || []);
        }
      } else {
        // Guest user: check stored guest session
        const stored = getStoredGuestSession();
        if (stored) {
          setSessionId(stored.chatSessionId);
          setGuestToken(stored.guestAccessToken);
          try {
            const fullSession = await getChatSessionById(
              stored.chatSessionId,
              stored.guestAccessToken
            );
            setMessages(fullSession.messages || []);
          } catch {
            // If stored session invalid/expired, create fresh
            const fresh = await createChatSession();
            setSessionId(fresh.chatSessionId);
            setGuestToken(fresh.guestAccessToken || null);
            setMessages(fresh.messages || []);
          }
        } else {
          // Create guest session
          const fresh = await createChatSession();
          setSessionId(fresh.chatSessionId);
          setGuestToken(fresh.guestAccessToken || null);
          setMessages(fresh.messages || []);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể khởi tạo hội thoại";
      setError(msg);
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && sessionId === null && !isLoadingSession) {
      initSession();
    }
  }, [isOpen, sessionId, isLoadingSession, initSession]);

  const handleStartNewChat = async () => {
    setIsLoadingSession(true);
    setError(null);
    setSignupRequired(false);
    try {
      const newSession = await createChatSession();
      setSessionId(newSession.chatSessionId);
      setGuestToken(newSession.guestAccessToken || null);
      setMessages([]);
      setRemainingGuestMessages(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tạo hội thoại mới";
      setError(msg);
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = inputValue.trim();
    if (!content || isThinking) return;

    if (content.length > 1000) {
      setError("Tin nhắn không được vượt quá 1000 ký tự.");
      return;
    }

    setError(null);
    setInputValue("");

    // Optimistically add USER message
    const userMsg: ChatMessageItem = {
      sender: "USER",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      let activeSessionId = sessionId;
      let activeGuestToken = guestToken;

      if (!activeSessionId) {
        const fresh = await createChatSession();
        activeSessionId = fresh.chatSessionId;
        activeGuestToken = fresh.guestAccessToken || null;
        setSessionId(activeSessionId);
        setGuestToken(activeGuestToken);
      }

      const res = await sendChatMessage(activeSessionId, content, activeGuestToken);

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

  // Do not show the floating widget if user is currently on the dedicated AI Chatbox page
  if (pathname === "/ai-chatbox") {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Expanded panel */}
      {isOpen && (
        <div className="flex w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_12px_32px_-4px_rgba(30,58,47,0.18)] border border-[#EFEEEB]">
          {/* Header bar */}
          <div className="flex items-center justify-between bg-[#1E3A2F] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-[0.01em]">
                  VeggieAI
                </span>
                <span className="text-[11px] text-[#86A496]">
                  Culinary &amp; Nutrition Guide
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Button to open full page */}
              <Link
                href="/ai-chatbox"
                title="Mở toàn màn hình"
                className="rounded p-1.5 text-[#86A496] transition hover:bg-white/10 hover:text-white"
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
                >
                  <path d="M15 3h6v6" />
                  <path d="M9 21H3v-6" />
                  <path d="M21 3l-7 7" />
                  <path d="M3 21l7-7" />
                </svg>
              </Link>
              {/* Button to start New Chat */}
              <button
                type="button"
                onClick={handleStartNewChat}
                title="Cuộc trò chuyện mới"
                disabled={isLoadingSession}
                className="rounded p-1.5 text-[#86A496] transition hover:bg-white/10 hover:text-white"
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
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              {/* Close / minimize */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded p-1.5 text-[#86A496] transition hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Guest message notice if applicable */}
          {remainingGuestMessages !== null && !signupRequired && (
            <div className="bg-[#EFEEEB] px-3 py-1 text-center text-[11px] text-[#727974] border-b border-[#E4E2DF]">
              Còn lại {remainingGuestMessages} câu hỏi cho phiên khách này
            </div>
          )}

          {/* Chat area */}
          <div className="flex h-80 flex-col gap-3 overflow-y-auto bg-[#FBF9F6] p-4">
            {isLoadingSession && messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-xs text-[#727974]">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#1E3A2F] border-t-transparent" />
                  <span>Đang kết nối VeggieAI...</span>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col gap-2 rounded-xl bg-white p-3.5 shadow-sm border border-[#EFEEEB]">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#07241A]">
                  <span>🤖</span>
                  <span>Xin chào!</span>
                </div>
                <p className="text-xs leading-relaxed text-[#424844]">
                  Tôi là VeggieAI, trợ lý dinh dưỡng và ẩm thực chay. Hãy hỏi tôi về dinh dưỡng thực vật, thực đơn lành mạnh hoặc thay thế nguyên liệu nhé!
                </p>
              </div>
            ) : null}

            {messages.map((msg, index) => (
              <div
                key={msg.chatMessageId || `msg-${index}`}
                className={
                  msg.sender === "USER"
                    ? "flex justify-end"
                    : "flex items-start gap-2"
                }
              >
                {msg.sender === "AI" && (
                  <span className="mt-0.5 text-sm shrink-0">🤖</span>
                )}
                <div
                  className={
                    msg.sender === "USER"
                      ? "rounded-[12px_2px_12px_12px] bg-[#07241A] px-3.5 py-2.5 text-[13px] leading-5 text-white max-w-[85%] shadow-sm"
                      : "rounded-[2px_12px_12px_12px] bg-[#F5F3F0] px-3.5 py-2.5 text-[13px] leading-5 text-[#1B1C1A] max-w-[85%] shadow-sm border border-[#EFEEEB]"
                  }
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Related Recipes if present */}
                  {msg.relatedRecipes && msg.relatedRecipes.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-[#EFEEEB] space-y-1">
                      <p className="text-[11px] font-semibold text-[#07241A]">
                        🥗 Gợi ý món liên quan:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {msg.relatedRecipes.map((recipe) => (
                          <Link
                            key={recipe.recipeId}
                            href={`/explore?recipeId=${recipe.recipeId}`}
                            className="inline-block rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-[#1E3A2F] border border-[#D9E6DC] hover:bg-[#D9E6DC]/40"
                          >
                            {recipe.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sources if present */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-1 border-t border-[#EFEEEB] flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-[#727974]">Nguồn:</span>
                      {msg.sources.map((src, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-white/70 px-1.5 py-0.2 rounded text-[#727974]"
                        >
                          {src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Thinking indicator */}
            {isThinking && (
              <div className="flex items-start gap-2">
                <span className="mt-0.5 text-sm shrink-0">🤖</span>
                <div className="rounded-[2px_12px_12px_12px] bg-[#F5F3F0] px-3.5 py-2 text-[12px] text-[#727974] flex items-center gap-1.5 border border-[#EFEEEB]">
                  <span>Thinking</span>
                  <span className="flex gap-0.5">
                    <span className="h-1 w-1 rounded-full bg-[#727974] animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1 w-1 rounded-full bg-[#727974] animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1 w-1 rounded-full bg-[#727974] animate-bounce" />
                  </span>
                </div>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
                {error}
              </div>
            )}

            {/* Signup required card */}
            {signupRequired && (
              <div className="mt-2 rounded-xl bg-[#F5F3F0] p-3 shadow-sm border border-[#E4E2DF]">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🔒</span>
                  <span className="text-xs font-semibold text-[#99462A]">
                    Giới hạn lượt hỏi khách
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[#424844]">
                  Bạn đã dùng hết số câu hỏi cho phiên khách. Vui lòng đăng nhập hoặc tạo tài khoản để trò chuyện không giới hạn và lưu lịch sử nhé!
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <Link
                    href="/login"
                    className="rounded-lg bg-[#07241A] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1E3A2F]"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg bg-[#E4E2DF] px-3 py-1.5 text-xs font-semibold text-[#1B1C1A] transition hover:bg-[#D5D3D0]"
                  >
                    Đăng ký
                  </Link>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Input bar */}
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 bg-white p-3 border-t border-[#EFEEEB]"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isThinking || signupRequired}
              maxLength={1000}
              placeholder={
                signupRequired
                  ? "Vui lòng đăng nhập để tiếp tục..."
                  : "Hỏi VeggieAI về dinh dưỡng, công thức..."
              }
              className="flex-1 rounded-xl bg-[#F5F3F0] px-3 py-2 text-[13px] text-[#1B1C1A] outline-none placeholder:text-[#727974] focus:ring-1 focus:ring-[#1E3A2F] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isThinking || !inputValue.trim() || signupRequired}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#07241A] text-white transition hover:bg-[#1E3A2F] disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Gửi tin nhắn"
            >
              <svg
                width="13"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}

      {/* Launcher button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-[#07241A] px-4 py-3 text-sm font-semibold tracking-[0.01em] text-white shadow-[0_8px_24px_rgba(30,58,47,0.18)] transition hover:bg-[#1E3A2F]"
      >
        <span className="text-base font-bold">🤖</span>
        <span>VeggieAI</span>
        <span className="rounded-full bg-[#99462A] px-1.5 py-0.5 text-[10px] font-semibold text-white">
          New
        </span>
      </button>
    </div>
  );
}
