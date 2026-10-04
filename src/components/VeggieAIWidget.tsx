"use client";

import { useState } from "react";

/**
 * VeggieAI floating widget — launcher button + expandable chat panel.
 * This is a minimal UI shell only. No real chatbot backend is integrated.
 *
 * TODO: Connect to a chatbot API / WebSocket when backend is ready.
 */
export default function VeggieAIWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Expanded panel */}
      {isOpen && (
        <div className="flex w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_12px_32px_-4px_rgba(30,58,47,0.12)]">
          {/* Header bar */}
          <div className="flex items-center justify-between bg-[#1E3A2F] px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <div className="flex flex-col">
                <span className="text-sm font-semibold tracking-[0.01em] text-white">
                  VeggieAI
                </span>
                <span className="text-xs text-[#86A496]">
                  Culinary &amp; Nutrition Guide
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-[#86A496] transition hover:bg-white/10 hover:text-white"
                aria-label="Minimize"
              >
                <svg
                  width="8"
                  height="2"
                  viewBox="0 0 8 2"
                  fill="currentColor"
                >
                  <rect width="8" height="2" rx="1" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-[#86A496] transition hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <path d="M1 1l8 8M9 1l-8 8" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat area */}
          <div className="flex h-80 flex-col gap-2 overflow-y-auto bg-[#FBF9F6] p-5">
            {/* Bot message */}
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-sm">🤖</span>
              <div className="rounded-[0_12px_12px_12px] bg-[#EFEEEB] px-3 py-2.5 text-[13px] leading-5 text-[#1B1C1A]">
                Hi! How can I help you today?
              </div>
            </div>

            {/* User message */}
            <div className="flex justify-end">
              <div className="rounded-[12px_0_12px_12px] bg-[#07241A] px-3 py-2.5 text-[13px] leading-5 text-white">
                Does tofu contain protein?
              </div>
            </div>

            {/* Bot reply */}
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-sm">🤖</span>
              <div className="rounded-[0_12px_12px_12px] bg-[#EFEEEB] px-3 py-2.5 text-[13px] leading-5 text-[#1B1C1A]">
                Yes, tofu is a useful source of plant-based protein, providing
                around 8-10g per 100g along with essential amino acids and iron.
              </div>
            </div>

            {/* Personalized AI card */}
            <div className="mt-2 rounded-xl bg-[#F5F3F0] p-3 shadow-[0_2px_12px_rgba(30,58,47,0.03)]">
              <div className="flex items-center gap-1.5">
                <svg
                  width="9"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#99462A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span className="text-xs font-semibold tracking-[0.02em] text-[#99462A]">
                  Personalized AI
                </span>
              </div>
              <p className="mt-1.5 text-[13px] leading-5 text-[#424844]">
                I can create a personalized 7-day vegetarian meal plan based on
                your BMI, health goals, allergies and saved recipes.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-lg bg-[#07241A] px-3 py-1.5 text-xs font-semibold text-white">
                  Login
                </span>
                <span className="rounded-lg bg-[#E4E2DF] px-3 py-1.5 text-xs font-semibold text-[#1B1C1A]">
                  Create Account
                </span>
              </div>
            </div>
          </div>

          {/* Input bar */}
          <div className="flex items-center gap-2 bg-white p-3">
            <input
              type="text"
              placeholder="Ask VeggieAI..."
              className="flex-1 rounded-xl bg-[#F5F3F0] px-3 py-2.5 text-[13px] text-[#1B1C1A] outline-none placeholder:text-[#727974]"
              readOnly
            />
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#07241A] text-white transition hover:bg-[#1E3A2F]"
              aria-label="Send message"
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
          </div>
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
