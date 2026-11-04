"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { IMAGE_ACCEPT, imageError, validateImage } from "@/lib/image-api";

export default function ImageFilePicker({ file, onChange, disabled = false }: { file: File | null; onChange: (file: File | null) => void; disabled?: boolean }) {
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview.url); };
  }, [preview]);
  return <div className="space-y-3 text-sm">
    <label className="block">Chọn ảnh <span className="text-xs text-[#727974]">(JPEG, PNG, WebP; tối đa 5 MB)</span>
      <input type="file" accept={IMAGE_ACCEPT} disabled={disabled} className="mt-2 block w-full text-xs" onChange={event => {
        const selected = event.target.files?.[0]; event.target.value = "";
        if (!selected) return;
        try { validateImage(selected); setError(""); setPreview({ file: selected, url: URL.createObjectURL(selected) }); onChange(selected); }
        catch (failure) { setError(imageError(failure)); }
      }} />
    </label>
    {file && <div className="flex items-center gap-3">
      {preview?.file === file && <Image unoptimized src={preview.url} alt="Xem trước ảnh đã chọn" width={128} height={96} className="h-24 w-32 rounded-xl object-cover" />}
      <div className="min-w-0"><p className="break-all text-xs">{file.name}</p><button type="button" disabled={disabled} onClick={() => { onChange(null); setPreview(null); setError(""); }} className="mt-2 text-xs underline disabled:opacity-50">Bỏ ảnh đã chọn</button></div>
    </div>}
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
  </div>;
}
