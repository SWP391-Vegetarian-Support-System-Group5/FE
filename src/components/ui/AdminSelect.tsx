"use client";

import React, { useState, useRef, useEffect, useId } from "react";

export interface AdminSelectOption<T extends string | number = string> {
  value: T;
  label: React.ReactNode;
  sublabel?: React.ReactNode;
  icon?: React.ReactNode;
}

export interface AdminSelectProps<T extends string | number = string> {
  value: T;
  onChange: (value: T) => void;
  options: AdminSelectOption<T>[];
  placeholder?: string;
  icon?: React.ReactNode;
  ariaLabel?: string;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  variant?: "pill" | "form";
}

/**
 * AdminSelect - Trình thả tùy biến cao cấp cho giao diện quản trị VeggieMate
 * Thay thế cho thẻ `<select>` mặc định của trình duyệt để có giao diện bo tròn,
 * đổ bóng mềm mại, hiệu ứng chuyển màu xanh đặc trưng và hỗ trợ đầy đủ phím tắt/click ngoài.
 */
export default function AdminSelect<T extends string | number = string>({
  value,
  onChange,
  options,
  placeholder,
  icon,
  ariaLabel,
  className = "",
  buttonClassName = "",
  dropdownClassName = "",
  disabled = false,
  size = "md",
  variant = "pill",
}: AdminSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const baseButtonStyles =
    variant === "pill"
      ? `h-10 inline-flex items-center justify-between gap-2.5 rounded-2xl border border-[#EFEEEB] bg-white px-3.5 text-xs font-semibold text-[#07241A] shadow-2xs transition hover:bg-[#FAF9F6] hover:border-[#DFE8DF] focus:outline-none focus:border-[#1E3A2F] focus:ring-2 focus:ring-[#1E3A2F]/15 select-none ${
          isOpen ? "border-[#1E3A2F] ring-2 ring-[#1E3A2F]/15 bg-white" : ""
        }`
      : `w-full flex items-center justify-between gap-2.5 rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] px-3 py-2.5 text-xs font-semibold text-[#07241A] transition hover:bg-white focus:outline-none focus:border-[#1E3A2F] focus:bg-white select-none ${
          isOpen ? "border-[#1E3A2F] ring-2 ring-[#1E3A2F]/15 bg-white" : ""
        }`;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`cursor-pointer ${baseButtonStyles} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="shrink-0 text-[#727974]">{icon}</span>}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder || ""}
          </span>
        </div>

        {/* Chevron Icon */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 text-[#727974] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel}
          className={`absolute left-0 top-full mt-1.5 z-50 min-w-full sm:min-w-[220px] max-h-64 overflow-y-auto rounded-2xl border border-[#EFEEEB] bg-white p-1.5 shadow-xl animate-fade-in focus:outline-none ${dropdownClassName}`}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                type="button"
                key={String(option.value)}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`group flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition text-left cursor-pointer ${
                  isSelected
                    ? "bg-[#EAF5EE] text-[#1E3A2F]"
                    : "text-[#424844] hover:bg-[#F7F6F3] hover:text-[#07241A]"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {option.icon && (
                    <span
                      className={`shrink-0 ${
                        isSelected ? "text-[#1E3A2F]" : "text-[#727974] group-hover:text-[#07241A]"
                      }`}
                    >
                      {option.icon}
                    </span>
                  )}
                  <span className="truncate">{option.label}</span>
                </div>

                {/* Checkmark icon for active selection */}
                {isSelected && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-[#1E3A2F]"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

