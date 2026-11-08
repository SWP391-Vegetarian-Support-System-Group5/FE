"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useState } from "react";
import { initialMealPlanDate, parseMealPlanDate } from "@/lib/meal-plan-dates";

export default function MealWeekTimeline({ savedStartDate, draftStartDate, selectedDay, onSelectDay }: {
  savedStartDate: string | null; draftStartDate: string; selectedDay?: number; onSelectDay?: (day: number) => void;
}) {
  const { t, locale } = useLanguage();
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => {
    const update = () => setToday(parseMealPlanDate(initialMealPlanDate()));
    const timer = window.setInterval(update, 60_000);
    const initial = window.setTimeout(update, 0);
    window.addEventListener("focus", update);
    return () => { window.clearInterval(timer); window.clearTimeout(initial); window.removeEventListener("focus", update); };
  }, []);
  const start = savedStartDate?.slice(0, 10) || parseMealPlanDate(draftStartDate);
  if (!start) return null;
  const first = new Date(`${start}T00:00:00Z`);
  if (!Number.isFinite(first.getTime())) return null;
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(first);
    date.setUTCDate(date.getUTCDate() + index);
    return { date, key: date.toISOString().slice(0, 10) };
  });
  const currentIndex = dates.findIndex(day => day.key === today);
  const status = !savedStartDate ? "7 ngày dự kiến · Chưa tạo thực đơn"
    : currentIndex >= 0 ? `Hôm nay · Ngày ${currentIndex + 1} trong 7 ngày`
    : today && today > dates[6].key ? "Đã kết thúc khoảng thời gian của tuần này"
    : "Tuần thực đơn sắp bắt đầu";
  return (
    <div className="mt-2 min-w-0 border-t border-[#EFEEEB] pt-2">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#647068]">
        <p className="font-medium text-[#254B38]">{status}</p>
        {today && <p>Ngày hiện tại: {new Date(`${today}T00:00:00Z`).toLocaleDateString("vi-VN", { timeZone: "UTC" })}</p>}
      </div>
      <ol aria-label="Lịch thực đơn 7 ngày" className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {dates.map(({ date, key }, index) => {
          const isToday = key === today;
          const isSelected = selectedDay === index + 1;
          const content = <><span className="block text-[10px] leading-4 sm:text-xs">{date.toLocaleDateString(locale, { weekday: "short", timeZone: "UTC" })}</span><span className="block text-lg font-semibold leading-6">{date.getUTCDate()}</span><span className="block text-[9px] leading-4 sm:text-[11px]">{isToday ? "Hôm nay" : `${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`}</span></>;
          const className = `flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-center ${isSelected ? "bg-[#254B38] text-white shadow-sm ring-2 ring-[#254B38] ring-offset-2" : isToday ? "bg-[#E5EFE6] font-semibold text-[#254B38]" : "bg-[#F5F6F1] text-[#59635C]"}`;
          return <li key={key}>{savedStartDate
            ? <button type="button" onClick={() => onSelectDay?.(index + 1)} aria-pressed={isSelected}
                aria-current={isToday ? "date" : undefined} aria-label={t("View meals for", "Xem thực đơn ngày") + " " + date.toLocaleDateString(locale, { timeZone: "UTC" })}
                className={`${className} w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#254B38] hover:ring-1 hover:ring-[#254B38]`}>{content}</button>
            : <div aria-current={isToday ? "date" : undefined} className={className}>{content}</div>}</li>;
        })}
      </ol>
      {savedStartDate && <p className="mt-2 text-[11px] leading-4 text-[#727974]">{t("Choose a date to see its meals, or Whole week to see all seven days.", "Chọn một ngày để xem món ăn, hoặc chọn Cả tuần để xem đủ 7 ngày.")}</p>}
    </div>
  );
}
