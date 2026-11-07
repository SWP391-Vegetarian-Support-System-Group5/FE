"use client";

import { useEffect, useId, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";

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
  const { t } = useLanguage();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    // Native modal behavior keeps keyboard focus inside and makes the page inert.
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      aria-busy={busy}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto border-0 bg-transparent p-0 text-[#07241A] backdrop:bg-[#07241A]/45 backdrop:backdrop-blur-[2px]"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        className="vm-dialog-surface w-full max-w-md rounded-3xl border border-[#E5E7DF] bg-[#FBF9F6] p-6 shadow-2xl"
      >
        <div className="flex gap-3">
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FEE2E2] text-lg text-[#B91C1C]">!</span>
          <div>
            <h2 id={`${id}-title`} className="font-serif text-xl font-bold text-[#07241A]">{title}</h2>
            <p id={`${id}-description`} className="mt-2 text-sm leading-6 text-[#59615B]">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" disabled={busy} onClick={onClose} className="rounded-xl border border-[#D8DDD6] bg-white px-4 py-2.5 text-sm font-semibold text-[#424844] transition hover:bg-[#F1F3EE] disabled:opacity-50">
            {cancelLabel}
          </button>
          <button type="button" disabled={busy} onClick={onConfirm} className="rounded-xl bg-[#B42318] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8F1D14] disabled:cursor-wait disabled:opacity-60">
            {busy ? t("Processing…", "Đang xử lý…") : confirmLabel}
          </button>
        </div>
      </section>
    </dialog>
  );
}
