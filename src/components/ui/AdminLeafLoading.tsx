"use client";

import React, { useId } from "react";
import { useLanguage } from "@/context/LanguageContext";

export interface AdminLeafLoadingProps {
  /** Optional loading text, defaults to localized "Loading..." */
  text?: React.ReactNode;
  /** Size of the leaf icon: sm (22px), md (36px), lg (52px) */
  size?: "sm" | "md" | "lg";
  /** Additional container CSS classes */
  className?: string;
  /** If true, renders compact inline layout (e.g. inside small cards/rows) */
  inline?: boolean;
}

/**
 * AdminLeafLoading - Hiệu ứng chiếc lá màu xanh lắc lư đặc trưng cho trang quản trị VeggieMate
 * Thể hiện trạng thái đang tải dữ liệu nhẹ nhàng, tinh tế và mang phong cách thực vật tự nhiên.
 */
export default function AdminLeafLoading({
  text,
  size = "md",
  className = "",
  inline = false,
}: AdminLeafLoadingProps) {
  const { t } = useLanguage();
  const rawId = useId();
  const gradientId = `vm-leaf-grad-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const dimensions = {
    sm: { leaf: 22, shadow: "w-4 h-1", text: "text-xs" },
    md: { leaf: 36, shadow: "w-7 h-1.5", text: "text-xs sm:text-sm" },
    lg: { leaf: 52, shadow: "w-10 h-2", text: "text-sm sm:text-base" },
  }[size];

  const defaultText = t("Loading...", "Đang tải dữ liệu...");
  const displayText = text === undefined ? defaultText : text;

  if (inline) {
    return (
      <span
        role="status"
        aria-live="polite"
        className={`inline-flex items-center gap-2.5 select-none ${className}`}
      >
        <span className="relative inline-flex flex-col items-center justify-center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: dimensions.leaf, height: dimensions.leaf }}
            className="vm-leaf-sway drop-shadow-xs"
            aria-hidden="true"
          >
            {/* Thân lá xanh mượt chuyển sắc VeggieMate */}
            <path
              d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
              fill={`url(#${gradientId})`}
              stroke="#133827"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Cuống và gân chính của lá */}
            <path
              d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"
              stroke="#082317"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Gân phụ điểm xuyết tinh tế */}
            <path
              d="M11 15c2-1 4-1.5 5.2-1"
              stroke="#B3DEC7"
              strokeWidth="1.1"
              strokeLinecap="round"
              opacity="0.85"
            />
            <path
              d="M13 11c2-1.2 3.5-1.5 4.8-1"
              stroke="#B3DEC7"
              strokeWidth="1.1"
              strokeLinecap="round"
              opacity="0.85"
            />
            <defs>
              <linearGradient
                id={gradientId}
                x1="2"
                y1="2"
                x2="22"
                y2="22"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#63B081" />
                <stop offset="45%" stopColor="#2E7D4E" />
                <stop offset="100%" stopColor="#1A4330" />
              </linearGradient>
            </defs>
          </svg>
        </span>
        {displayText && (
          <span className={`font-medium text-[#59635C] ${dimensions.text}`}>
            {displayText}
          </span>
        )}
      </span>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-2.5 select-none ${className}`}
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Chiếc lá xanh lắc lư */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: dimensions.leaf, height: dimensions.leaf }}
          className="vm-leaf-sway drop-shadow-xs"
          aria-hidden="true"
        >
          {/* Thân lá xanh mượt chuyển sắc VeggieMate */}
          <path
            d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"
            fill={`url(#${gradientId})`}
            stroke="#133827"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Cuống và gân chính của lá */}
          <path
            d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"
            stroke="#082317"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Gân phụ điểm xuyết tinh tế */}
          <path
            d="M11 15c2-1 4-1.5 5.2-1"
            stroke="#B3DEC7"
            strokeWidth="1.1"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d="M13 11c2-1.2 3.5-1.5 4.8-1"
            stroke="#B3DEC7"
            strokeWidth="1.1"
            strokeLinecap="round"
            opacity="0.85"
          />
          <defs>
            <linearGradient
              id={gradientId}
              x1="2"
              y1="2"
              x2="22"
              y2="22"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#63B081" />
              <stop offset="45%" stopColor="#2E7D4E" />
              <stop offset="100%" stopColor="#1A4330" />
            </linearGradient>
          </defs>
        </svg>

        {/* Bóng mờ thở nhẹ bên dưới chiếc lá */}
        <div
          className={`vm-leaf-shadow mt-1 rounded-full bg-[#1E3A2F]/20 blur-[1px] ${dimensions.shadow}`}
          aria-hidden="true"
        />
      </div>

      {/* Dòng chữ trạng thái tải */}
      {displayText && (
        <p className={`font-medium text-[#59635C] tracking-wide ${dimensions.text}`}>
          {displayText}
        </p>
      )}
    </div>
  );
}

