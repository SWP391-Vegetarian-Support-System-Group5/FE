"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { getMediaUrl } from "@/lib/api";
import { ImageRequestError, imageError, type ImageMutationResponse } from "@/lib/image-api";
import ContentDialog from "@/components/content/ContentDialog";
import ImageFilePicker from "./ImageFilePicker";

type Props = {
  imageUrl: string | null | undefined;
  onUpload: (file: File) => Promise<ImageMutationResponse>;
  onDelete: () => Promise<ImageMutationResponse>;
  onGenerate?: (style: string) => Promise<ImageMutationResponse>;
  onApplied: (result: ImageMutationResponse) => void;
  onRefresh: () => Promise<void>;
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
  requiresRefresh?: boolean;
  label?: string;
};

export default function ImageManager({ imageUrl, onUpload, onDelete, onGenerate, onApplied, onRefresh, onBusyChange, disabled, requiresRefresh = false, label = "Đổi ảnh" }: Props) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [style, setStyle] = useState("");
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const lock = useRef(false);
  async function run(kind: string, action: () => Promise<ImageMutationResponse>) {
    if (lock.current || disabled) return;
    lock.current = true; setPending(kind); onBusyChange?.(true); setError(""); setErrorStatus(null); setNotice("");
    try {
      const result = await action();
      onApplied(result);
      setFile(null);
      const message = kind === "delete" ? "Đã xóa ảnh riêng." : kind === "generate" ? "Đã tạo ảnh AI minh họa." : "Đã lưu ảnh.";
      setNotice(message + (result.previousImageDeleted === false ? " Máy chủ chưa dọn xong ảnh cũ; không cần gửi lại yêu cầu." : ""));
      try { await onRefresh(); }
      catch { setNotice(message + " Chưa tải lại được dữ liệu. Hãy bấm tải lại dữ liệu; không cần gửi lại ảnh."); }
    } catch (failure) {
      setError(imageError(failure));
      setErrorStatus(failure instanceof ImageRequestError ? failure.status : null);
    } finally { lock.current = false; setPending(""); onBusyChange?.(false); }
  }
  async function refresh() {
    if (lock.current) return;
    lock.current = true; setPending("refresh"); onBusyChange?.(true);
    try { await onRefresh(); setError(""); setErrorStatus(null); setNotice("Đã tải lại dữ liệu ảnh."); }
    catch { setError("Không tải lại được dữ liệu. Vui lòng thử lại."); }
    finally { lock.current = false; setPending(""); onBusyChange?.(false); }
  }
  return <>
    <button type="button" disabled={disabled || !!pending} onClick={() => setOpen(true)} className="vm-button rounded-xl bg-[#F5F3F0] px-3.5 py-2 text-xs font-semibold text-[#1B1C1A] disabled:opacity-50">{label}</button>
    {open && <ContentDialog title={label} onClose={() => { if (!lock.current) { setOpen(false); setFile(null); } }}>
      <div className="space-y-4 p-6">
        {imageUrl && <Image unoptimized src={getMediaUrl(imageUrl)} alt="Ảnh hiện tại" width={320} height={200} className="max-h-48 w-full rounded-xl object-contain" />}
        <ImageFilePicker file={file} onChange={setFile} disabled={!!pending || disabled} />
        {onGenerate && <label className="block text-sm">Mô tả ảnh AI (không bắt buộc)<textarea maxLength={300} value={style} onChange={event => setStyle(event.target.value)} disabled={!!pending || disabled} rows={2} className="mt-2 w-full rounded-xl border border-[#E5E7DF] p-3 text-sm" /><span className="text-xs text-[#727974]">{style.length}/300 ký tự · Tối đa 3 yêu cầu/phút</span></label>}
        {error && <p role="alert" className="text-sm text-red-700">{error} {errorStatus === 401 && <Link href="/login" className="underline">Đăng nhập</Link>}</p>}
        {notice && <p role="status" className="text-sm text-[#254B38]">{notice}</p>}
        {pending && <p role="status" className="text-sm text-[#727974]">{pending === "generate" ? "Đang tạo ảnh AI…" : pending === "delete" ? "Đang xóa ảnh…" : pending === "refresh" ? "Đang tải lại dữ liệu…" : "Đang tải ảnh lên…"}</p>}
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={!file || !!pending || disabled || requiresRefresh || errorStatus === 409} onClick={() => file && void run("upload", () => onUpload(file))} className="vm-button rounded-full bg-[#254B38] px-4 py-2 text-sm text-white disabled:opacity-40">Lưu ảnh đã chọn</button>
          {onGenerate && <button type="button" disabled={!!pending || disabled || requiresRefresh || errorStatus === 409} onClick={() => void run("generate", () => onGenerate(style))} className="vm-button rounded-full border px-4 py-2 text-sm disabled:opacity-40">Tạo / tạo lại ảnh AI</button>}
          {imageUrl && <button type="button" disabled={!!pending || disabled || requiresRefresh || errorStatus === 409} onClick={() => void run("delete", onDelete)} className="vm-button px-3 py-2 text-sm text-red-700 disabled:opacity-40">Xóa ảnh</button>}
          <button type="button" disabled={!!pending} onClick={() => void refresh()} className="vm-button px-3 py-2 text-sm underline disabled:opacity-40">Tải lại dữ liệu</button>
        </div>
      </div>
    </ContentDialog>}
  </>;
}
