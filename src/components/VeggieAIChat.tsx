"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  time?: string;
}

const DEFAULT_MESSAGES: Message[] = [
  {
    id: "1",
    sender: "ai",
    text: "Hi! How can I help you today?",
  },
  {
    id: "2",
    sender: "user",
    text: "Does tofu contain protein?",
  },
  {
    id: "3",
    sender: "ai",
    text: "Yes, tofu is a useful source of plant-based protein, providing around 8-10g per 100g along with essential amino acids and iron.",
  },
];

export default function VeggieAIChat() {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>(DEFAULT_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText.trim();
    const newMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: userText,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    setIsTyping(true);

    // Realistic smart response based on prompt
    setTimeout(() => {
      let reply = "Please register to access additional features";
      const lower = userText.toLowerCase();

      if (lower.includes("tofu") || lower.includes("protein")) {
        reply = "Tofu, tempeh, lentils, and edamame are incredible high-protein staples. For example, 100g of tempeh offers up to 19g of pure plant protein!";
      } else if (lower.includes("district 1") || lower.includes("quận 1") || lower.includes("restaurant") || lower.includes("quán")) {
        reply = "For District 1, Loving Leaf Vegan Bistro on Ben Nghe and Sen Trang Vegan Lounge near Nguyen Hue are top-rated for tranquil dining and gourmet plant dishes.";
      } else if (lower.includes("recipe") || lower.includes("công thức") || lower.includes("cook")) {
        reply = "Try our signature Claypot Tofu with lemongrass or Hue Spicy Noodle Soup in the Recipes tab for a rich, warming seasonal meal.";
      } else if (lower.includes("calorie") || lower.includes("diet") || lower.includes("giảm cân")) {
        reply = "A balanced vegetarian diet rich in dietary fiber, clean greens, and healthy fats (avocado, pumpkin seeds) keeps you satiated while supporting calorie control.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: reply,
        },
      ]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="flex w-[340px] sm:w-[380px] flex-col overflow-hidden rounded-2xl border border-[#EFEEEB] bg-[#FAF8F5] shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between bg-[#1E3A2F] px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15 text-lg shadow-inner">
                🧁
              </span>
              <div>
                <h4 className="font-sans text-sm font-bold tracking-tight">VeggieAI</h4>
                <p className="text-[11px] text-[#D9E6DC]">Culinary & Nutrition Guide</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-white/80">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition"
                title="Minimize chat"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-white/10 hover:text-white transition"
                title="Close chat"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex max-h-[360px] min-h-[280px] flex-col gap-3 overflow-y-auto p-4 text-xs scrollbar-thin">
            {messages.map((msg) => {
              const isAi = msg.sender === "ai";
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${isAi ? "" : "justify-end"}`}
                >
                  {isAi && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E5EBE6] text-[13px] text-[#1E3A2F]">
                      🧁
                    </span>
                  )}
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${isAi
                        ? "rounded-tl-xs bg-[#EFECE6] text-[#07241A] shadow-xs"
                        : "rounded-tr-xs bg-[#07241A] font-medium text-white shadow-xs max-w-[82%]"
                      }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E5EBE6] text-[13px]">
                  🧁
                </span>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-xs bg-[#EFECE6] px-3.5 py-2 text-[#727974]">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1E3A2F]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1E3A2F] [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#1E3A2F] [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            {/* Personalized AI Feature Promo Card */}
            <div className="mt-1 rounded-xl border border-[#E9E4DC] bg-[#FAF8F5] p-3 shadow-xs">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#C25E48]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Personalized AI</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-[#5C6460]">
                I can create a personalized 7-day vegetarian meal plan based on your BMI, health goals, allergies and saved recipes.
              </p>
            </div>

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 border-t border-[#EFEEEB] bg-white p-3"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask VeggieAI..."
              className="flex-1 rounded-full border border-[#EFEEEB] bg-[#F5F3F0] px-4 py-2 text-xs text-[#07241A] placeholder-[#727974] transition focus:border-[#1E3A2F] focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#07241A] text-white shadow-xs transition hover:bg-[#1E3A2F] disabled:opacity-40"
              title="Send message"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </form>
        </div>
      ) : (
        /* Floating Badge Button when closed */
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 rounded-full bg-[#07241A] px-4 py-2.5 text-xs font-semibold text-white shadow-2xl transition hover:bg-[#1E3A2F] hover:shadow-emerald-950/20"
        >
          <span className="flex h-5 w-5 items-center justify-center text-sm">🧁</span>
          <span>VeggieAI</span>
          <span className="rounded-full bg-[#C25E48] px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
            New
          </span>
        </button>
      )}
    </div>
  );
}
