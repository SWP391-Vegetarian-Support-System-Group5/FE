"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { MAX_IMAGE_BYTES } from "@/lib/image-upload";

type Props = {
  value: string | null;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onValueChange: (url: string | null) => void;
  disabled?: boolean;
};

export default function ImageFilePicker({ value, file, onFileChange, onValueChange, disabled = false }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview, file]);

  return <div className="space-y-2 text-xs text-[#07241A]">
    <div className="block font-semibold">Ảnh (tải lên Cloudinary)</div>
    <div className="flex flex-wrap items-center gap-3">
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={disabled}
        className="sr-only"
        onChange={event => {
          const selected = event.target.files?.[0] || null;
          event.target.value = "";
          if (!selected) return;
          if (selected.size === 0 || selected.size > MAX_IMAGE_BYTES) { setError("Ảnh phải có dung lượng từ 1 byte đến 8 MB."); return; }
          if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(selected.type)) { setError("Chỉ hỗ trợ JPEG, PNG, WebP hoặc GIF."); return; }
          setError("");
          setPreview(URL.createObjectURL(selected));
          onFileChange(selected);
        }} />
      <button type="button" disabled={disabled} onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-[#C9D8CD] bg-[#E8F0E5] px-4 py-2.5 text-xs font-semibold text-[#1E3A2F] transition hover:bg-[#D9E6DC] disabled:cursor-not-allowed disabled:opacity-50">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 3v12" /><path d="m7 8 5-5 5 5" /><path d="M5 21h14a2 2 0 0 0 2-2v-5" /><path d="M3 14v5a2 2 0 0 0 2 2" /></svg>
        Chọn ảnh
      </button>
      {file && <span className="max-w-full truncate text-xs font-normal text-[#5D685F]">Đã chọn: {file.name}</span>}
    </div>
    <p className="text-[#727974]">JPEG, PNG, WebP hoặc GIF, tối đa 8 MB. Ảnh được tải lên khi bạn lưu.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {(file ? preview : value) && <div className="flex items-start gap-3">
      <Image src={(file ? preview : value)!} alt="Ảnh đã chọn" width={120} height={80} unoptimized className="h-20 w-30 rounded-lg object-cover" />
      <button type="button" disabled={disabled} onClick={() => { onFileChange(null); onValueChange(null); setPreview(null); }} className="rounded-lg border px-2 py-1">Bỏ ảnh</button>
    </div>}
  </div>;
}
