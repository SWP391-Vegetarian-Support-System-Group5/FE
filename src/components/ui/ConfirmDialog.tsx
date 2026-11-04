"use client";

import { useEffect } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/** A consistent, accessible replacement for the browser's window.confirm dialog. */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busy, onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07241A]/45 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="w-full max-w-md rounded-3xl border border-[#E5E7DF] bg-[#FBF9F6] p-6 shadow-2xl"
      >
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FEE2E2] text-lg text-[#B91C1C]">!</span>
          <div>
            <h2 id="confirm-dialog-title" className="font-serif text-xl font-bold text-[#07241A]">{title}</h2>
            <p id="confirm-dialog-description" className="mt-2 text-sm leading-6 text-[#59615B]">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" disabled={busy} onClick={onClose} className="rounded-xl border border-[#D8DDD6] bg-white px-4 py-2.5 text-sm font-semibold text-[#424844] transition hover:bg-[#F1F3EE] disabled:opacity-50">
            {cancelLabel}
          </button>
          <button type="button" disabled={busy} onClick={onConfirm} className="rounded-xl bg-[#B42318] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8F1D14] disabled:cursor-wait disabled:opacity-60">
            {busy ? "Đang xử lý…" : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
