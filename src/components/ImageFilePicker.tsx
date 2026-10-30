"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview, file]);

  return <div className="space-y-2 text-xs text-[#07241A]">
    <label className="block font-semibold">Ảnh (tải lên Cloudinary)
      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={disabled}
        className="mt-1.5 block w-full rounded-xl border border-[#EFEEEB] bg-[#FBF9F6] p-2"
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
    </label>
    <p className="text-[#727974]">JPEG, PNG, WebP hoặc GIF, tối đa 8 MB. Ảnh được tải lên khi bạn lưu.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {(file ? preview : value) && <div className="flex items-start gap-3">
      <Image src={(file ? preview : value)!} alt="Ảnh đã chọn" width={120} height={80} unoptimized className="h-20 w-30 rounded-lg object-cover" />
      <button type="button" disabled={disabled} onClick={() => { onFileChange(null); onValueChange(null); setPreview(null); }} className="rounded-lg border px-2 py-1">Bỏ ảnh</button>
    </div>}
  </div>;
}
