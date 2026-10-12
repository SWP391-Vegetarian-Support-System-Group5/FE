"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import ContentIcon from "./ContentIcon";

export default function ContentDialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { t } = useLanguage();
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { dialog?.close(); document.body.style.overflow = previous; };
  }, []);

  return (
    <dialog ref={dialogRef} aria-labelledby="content-dialog-title" onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }} className="m-auto max-h-[88dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl border border-[#E5E7DF] bg-[#FBF9F6] p-0 text-[#07241A] shadow-2xl backdrop:bg-[#07241A]/50 backdrop:backdrop-blur-sm">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#E5E7DF] bg-[#FBF9F6] px-6 py-5">
        <h2 id="content-dialog-title" className="font-serif text-2xl">{title}</h2>
        <button type="button" onClick={onClose} aria-label={t("Close dialog", "Đóng hộp thoại")} className="rounded-full p-2 text-[#727974] transition hover:bg-[#E8ECE4]"><ContentIcon name="close" /></button>
      </div>
      {children}
    </dialog>
  );
}
