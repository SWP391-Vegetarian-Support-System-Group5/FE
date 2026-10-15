"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function CardSkeleton({ count = 3, compact = false }: { count?: number; compact?: boolean }) {
  const { t } = useLanguage();
  return <div role="status" aria-live="polite" className="py-7">
    <span className="sr-only">{t("Loading posts…", "Đang tải bài viết…")}</span>
    <div aria-hidden="true" className={`grid gap-6 sm:grid-cols-2 ${compact ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
      {Array.from({ length: count }, (_, index) => <div key={index} className="overflow-hidden rounded-3xl border border-[#E5E7DF] bg-white">
        <div className="vm-skeleton aspect-[16/10]" />
        <div className="space-y-4 p-5"><div className="vm-skeleton h-3 w-20 rounded-full" /><div className="vm-skeleton h-5 w-5/6 rounded-lg" /><div className="vm-skeleton h-4 w-2/3 rounded-lg" /><div className="flex items-center gap-2 border-t border-[#EFEEEB] pt-4"><div className="vm-skeleton h-7 w-7 rounded-full" /><div className="vm-skeleton h-3 w-24 rounded-full" /></div></div>
      </div>)}
    </div>
  </div>;
}
