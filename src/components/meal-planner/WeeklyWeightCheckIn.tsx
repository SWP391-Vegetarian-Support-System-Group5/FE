"use client";

import { useEffect, useRef, useState } from "react";
import ContentIcon from "@/components/content/ContentIcon";
import { initialMealPlanDate, parseMealPlanDate } from "@/lib/meal-plan-dates";

export default function WeeklyWeightCheckIn({ owner, planId, startDate, weightKg, busy, onSave }: {
  owner?: string; planId?: number; startDate: string | null; weightKg?: number | null;
  busy: boolean; onSave: (weight: number) => Promise<void>;
}) {
  const [due, setDue] = useState(false);
  const [saved, setSaved] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);
  const storageKey = `vm:weekly-weight:${owner}:${planId}:${startDate}`;
  useEffect(() => {
    const check = () => {
      if (!owner || !planId || !startDate) return;
      const end = new Date(`${startDate.slice(0, 10)}T00:00:00Z`);
      if (!Number.isFinite(end.getTime())) return;
      end.setUTCDate(end.getUTCDate() + 7);
      let acknowledged = false;
      try { acknowledged = localStorage.getItem(storageKey) === "saved"; } catch { /* Storage is optional. */ }
      const today = parseMealPlanDate(initialMealPlanDate());
      setDue(!!today && today >= end.toISOString().slice(0, 10) && !acknowledged);
    };
    const initial = window.setTimeout(check, 0);
    const timer = window.setInterval(check, 60_000);
    window.addEventListener("focus", check);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); window.removeEventListener("focus", check); };
  }, [owner, planId, startDate, storageKey]);
  if (!due || saved) return null;
  return <section className="vm-card mt-5 rounded-2xl border border-[#D9E6DC] bg-[#F1F7EF] p-5 sm:p-6" aria-labelledby="weekly-weight-title">
    <div className="flex items-start gap-3"><ContentIcon name="refresh" className="mt-1 shrink-0 text-[#254B38]" /><div>
      <h2 id="weekly-weight-title" className="text-lg font-semibold text-[#173C2D]">Một tuần đã qua, cập nhật cân nặng nhé!</h2>
      <p className="mt-1 text-sm leading-6 text-[#647068]">Cân nặng mới giúp tính lại nhu cầu năng lượng cho lần tạo thực đơn tiếp theo. Các bữa ăn đã lưu vẫn được giữ nguyên.</p>
      {weightKg != null && <p className="mt-2 text-xs text-[#647068]">Cân nặng đang lưu: {weightKg.toLocaleString("vi-VN")} kg</p>}
    </div></div>
    <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={async event => {
      event.preventDefault();
      if (lock.current || busy) return;
      const weight = Number(value.replace(",", "."));
      if (!value.trim() || !Number.isFinite(weight) || weight < 1 || weight > 1000) { setError("Nhập cân nặng hợp lệ từ 1 đến 1.000 kg."); return; }
      lock.current = true; setSaving(true); setError("");
      try {
        await onSave(weight);
        setSaved(true);
        try { localStorage.setItem(storageKey, "saved"); } catch { /* Keep the API save successful. */ }
      } catch (failure) { setError(failure instanceof Error ? failure.message : "Chưa lưu được cân nặng. Vui lòng thử lại."); }
      finally { lock.current = false; setSaving(false); }
    }}>
      <label className="text-sm text-[#173C2D]">Cân nặng hiện tại (kg)<input required inputMode="decimal" value={value} onChange={event => setValue(event.target.value)} disabled={busy || saving} placeholder="Ví dụ: 62,5" className="mt-2 block w-full rounded-xl border border-[#C9D9C8] bg-white px-4 py-3 outline-none focus:border-[#254B38] sm:w-56" /></label>
      <button disabled={busy || saving} className="vm-button rounded-xl bg-[#254B38] px-5 py-3 text-sm font-medium text-white disabled:opacity-50">{saving ? "Đang lưu…" : "Xác nhận cân nặng"}</button>
    </form>
    {error && <p role="alert" className="mt-3 text-sm text-[#99462A]">{error}</p>}
  </section>;
}
