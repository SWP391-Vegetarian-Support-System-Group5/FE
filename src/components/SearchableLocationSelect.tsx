"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type SearchableLocationOption = {
  code: string;
  name: string;
};

type Props = {
  label: string;
  value: string;
  options: SearchableLocationOption[];
  placeholder: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  onSelect: (code: string) => void;
  className?: string;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export default function SearchableLocationSelect({
  label,
  value,
  options,
  placeholder,
  searchPlaceholder = "Search...",
  disabled = false,
  onSelect,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.code === value);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return options;
    return options.filter((option) => normalize(option.name).includes(normalizedQuery));
  }, [options, query]);

  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  return (
    <div ref={rootRef} className={`relative flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-semibold tracking-[0.02em] text-[#424844]">
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
          setQuery("");
        }}
        className="flex w-full items-center justify-between rounded-xl bg-[#F5F3F0] px-4 py-2.5 text-left text-[15px] leading-6 text-[#1B1C1A] outline-none transition focus:ring-2 focus:ring-[#1E3A2F]/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={selected ? "" : "text-[#727974]"}>
          {selected?.name ?? placeholder}
        </span>
        <svg
          width="9"
          height="6"
          viewBox="0 0 9 6"
          fill="none"
          className={`text-[#727974] transition ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M1 1L4.5 4.5L8 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[1000] mt-1 w-full overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-[#EFEEEB]">
          <div className="border-b border-[#EFEEEB] p-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
              placeholder={searchPlaceholder}
              className="w-full rounded-lg bg-[#F5F3F0] px-3 py-2 text-sm text-[#1B1C1A] outline-none placeholder:text-[#727974] focus:ring-2 focus:ring-[#1E3A2F]/20"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-[#727974]">No result</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => {
                    onSelect(option.code);
                    setOpen(false);
                  }}
                  className={`flex w-full px-4 py-2.5 text-left text-sm transition hover:bg-[#F5F3F0] ${
                    value === option.code
                      ? "bg-[#F5F3F0] font-semibold text-[#07241A]"
                      : "text-[#424844]"
                  }`}
                >
                  {option.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
