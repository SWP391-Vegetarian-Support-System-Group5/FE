"use client";

import { useEffect, useRef, useState } from "react";
import {
  locationApi,
  type AddressSuggestion,
} from "@/lib/location-api";
import type { Coordinates } from "@/types/location";

type Props = {
  value: string;
  center: Coordinates;
  onChange: (value: string) => void;
  onSelect: (result: { lat: number; lng: number; formattedAddress: string }) => void;
  onSearch: () => void;
};

export default function AddressAutocomplete({ value, center, onChange, onSelect, onSearch }: Props) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    if (value.trim().length < 3 || !open) return;
    const currentRequest = ++requestId.current;
    const timer = window.setTimeout(() => {
      locationApi.addressSuggestions(value.trim(), center)
        .then((items) => currentRequest === requestId.current && setSuggestions(items))
        .catch(() => currentRequest === requestId.current && setSuggestions([]));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [center, open, value]);

  const choose = async (suggestion: AddressSuggestion) => {
    setOpen(false);
    setSuggestions([]);
    try {
      onSelect({ lat: suggestion.latitude, lng: suggestion.longitude, formattedAddress: suggestion.label });
    } catch {
      onChange(suggestion.label);
      onSearch();
    }
  };

  return (
    <div className="relative min-w-0 flex-1">
      <input
        value={value}
        onChange={(event) => { onChange(event.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={(event) => event.key === "Enter" && (setOpen(false), onSearch())}
        placeholder="Số nhà, tên đường, phường/xã"
        autoComplete="off"
        className="w-full bg-transparent py-3.5 text-sm font-normal text-[#18372a] outline-none"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-[#e2ded7] bg-white py-1 shadow-xl">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => void choose(suggestion)} className="w-full px-4 py-3 text-left text-sm leading-5 text-[#294438] hover:bg-[#eef5f0]">
                {suggestion.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
