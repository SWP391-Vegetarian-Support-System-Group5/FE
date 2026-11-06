"use client";

import { useState } from "react";
import ContentDialog from "@/components/content/ContentDialog";
import { useLanguage } from "@/context/LanguageContext";
import { GOAL_LABELS, goalAllowed, goalLimits, suggestedGoal, type NutritionGoal, type PlanningProfile } from "@/lib/meal-plan-goals";

export default function MealGoalDialog({ context, weekRange, busy, error, onClose, onConfirm }: {
  context: PlanningProfile; weekRange: string; busy: boolean; error: string;
  onClose: () => void; onConfirm: (goal: NutritionGoal, adjustment: number) => void;
}) {
  const { locale } = useLanguage();
  const [goal, setGoal] = useState<NutritionGoal>(() => suggestedGoal(context.bmi));
  const [adjustment, setAdjustment] = useState(() => Math.min(500, goalLimits(context, suggestedGoal(context.bmi)).maxAdjustment));
  const limits = goalLimits(context, goal);
  const value = Math.min(adjustment, limits.maxAdjustment);
  // Position zero is maintenance; the remaining positions are the BE-supported
  // values 500, 550, ... up to the personal cap. Never send the unsupported gap.
  const maxPosition = limits.maxAdjustment >= 500 ? 1 + (limits.maxAdjustment - 500) / 50 : 0;
  const sliderPosition = value === 0 ? 0 : 1 + (value - 500) / 50;
  const target = limits.tdee === null ? null : limits.tdee + (goal === "LOSE" ? -value : goal === "GAIN" ? value : 0);
  const targetTooLow = target !== null && target < limits.minimumIntake;
  const number = (n: number) => Math.round(n).toLocaleString(locale);
  const bmi = context.bmi;
  const explanation = bmi !== null && bmi < 18.5
    ? "BMI của bạn đang dưới khoảng tham chiếu. Bạn có thể chọn tăng cân từ từ hoặc duy trì cân nặng."
    : bmi !== null && bmi >= 25
      ? "BMI của bạn đang cao hơn khoảng tham chiếu. Bạn có thể chọn giảm cân từ từ hoặc duy trì cân nặng."
      : "BMI của bạn đang trong khoảng tham chiếu. Duy trì cân nặng là lựa chọn được gợi ý.";
  return <ContentDialog title="Mục tiêu cho tuần mới" onClose={() => { if (!busy) onClose(); }}>
    <div className="space-y-6 p-6">
      <div className="rounded-2xl bg-[#E8F1EC] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#254B38]">
          <span>Thực đơn 7 ngày</span><span>{weekRange}</span>
        </div>
        <div className="mt-3 flex items-baseline gap-2 text-[#07241A]"><span className="text-sm">BMI của bạn</span><strong className="font-serif text-3xl font-medium">{bmi?.toLocaleString(locale, { maximumFractionDigits: 1 })}</strong></div>
        <p className="mt-2 text-sm leading-6 text-[#424844]">{explanation}</p>
      </div>

      <fieldset disabled={busy} className="space-y-3">
        <legend className="mb-3 text-sm font-medium">Bạn muốn hướng đến điều gì?</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {(["MAINTAIN", "LOSE", "GAIN"] as const).map(option => {
            const allowed = goalAllowed(bmi, option);
            return <label key={option} className={`relative flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm transition-colors duration-200 motion-reduce:transition-none ${goal === option ? "border-[#254B38] bg-[#E8F1EC] text-[#07241A]" : "border-[#E5E7DF] bg-white text-[#59635C]"} ${!allowed ? "cursor-not-allowed opacity-40" : ""}`}>
              <input type="radio" name="nutrition-goal" value={option} checked={goal === option} disabled={!allowed || busy}
                onChange={() => { setGoal(option); setAdjustment(Math.min(500, goalLimits(context, option).maxAdjustment)); }} className="accent-[#254B38]" />
              {GOAL_LABELS[option]}
            </label>;
          })}
        </div>
      </fieldset>

      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <label htmlFor="meal-daily-adjustment" className="text-sm font-medium">{goal === "LOSE" ? "Giảm so với TDEE mỗi ngày" : goal === "GAIN" ? "Thêm so với TDEE mỗi ngày" : "Điều chỉnh năng lượng mỗi ngày"}</label>
          <output htmlFor="meal-daily-adjustment" className="text-xl font-medium text-[#254B38]">{number(value)} <span className="text-xs font-normal">kcal</span></output>
        </div>
        <input id="meal-daily-adjustment" type="range" min={0} max={maxPosition || 1} step={1} value={sliderPosition}
          disabled={busy || maxPosition === 0} onChange={event => { const position = Number(event.target.value); setAdjustment(position === 0 ? 0 : 500 + (position - 1) * 50); }}
          aria-valuetext={value === 0 ? "0 kcal, duy trì cân nặng" : `${value} kcal mỗi ngày`} aria-describedby="meal-adjustment-help"
          className="h-2 w-full cursor-pointer accent-[#254B38] disabled:cursor-not-allowed disabled:opacity-40" />
        <div className="flex justify-between text-xs text-[#727974]"><span>0 · Duy trì</span><span>{number(limits.maxAdjustment)} kcal/ngày</span></div>
        <p id="meal-adjustment-help" className="text-xs leading-5 text-[#727974]">{goal === "MAINTAIN"
          ? "Ăn theo mức năng lượng duy trì cân nặng, không cộng hoặc trừ calo."
          : limits.maxAdjustment === 0
            ? "Thông tin hiện tại chưa phù hợp để điều chỉnh từ 500 kcal/ngày. Hãy chọn duy trì cân nặng hoặc cập nhật hồ sơ."
            : `Chọn 0 để duy trì, hoặc 500–${number(limits.maxAdjustment)} kcal/ngày theo từng bước 50 kcal. Mức tối đa được giới hạn theo cân nặng${goal === "LOSE" ? " và năng lượng còn lại sau khi giảm" : ""}; không cần chọn mức cao nhất.`}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[#E5E7DF] bg-white p-4">
        <div><p className="text-xs text-[#727974]">TDEE ước tính</p><p className="mt-1 text-lg font-medium">{limits.tdee === null ? "—" : number(limits.tdee)} <span className="text-xs font-normal">kcal</span></p></div>
        <div className="border-l border-[#E5E7DF] pl-4"><p className="text-xs text-[#727974]">Năng lượng mục tiêu/ngày</p><p className="mt-1 text-lg font-medium text-[#254B38]">{target === null ? "—" : number(target)} <span className="text-xs font-normal">kcal</span></p></div>
      </div>
      {goal !== "MAINTAIN" && <div className="space-y-1 text-xs leading-5 text-[#727974]">
        <p>Theo quy đổi năng lượng: khoảng {(value * 7 / 7700).toLocaleString(locale, { maximumFractionDigits: 2 })} kg/tuần; giới hạn ứng dụng {limits.weeklyCapKg.toLocaleString(locale, { maximumFractionDigits: 2 })} kg/tuần.</p>
        <p>Đây là ước tính, không phải cam kết thay đổi cân nặng. Theo dõi cân trung bình trong 2–3 tuần trước khi điều chỉnh.</p>
        {goal === "LOSE" && <p>Năng lượng mục tiêu được giữ từ {number(limits.minimumIntake)} kcal/ngày trở lên.</p>}
      </div>}
      {error && <p role="alert" className="vm-feedback rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {targetTooLow && <p role="alert" className="vm-feedback rounded-xl bg-[#FFF8F0] p-3 text-sm text-[#754624]">Năng lượng mục tiêu đang dưới mức {number(limits.minimumIntake)} kcal/ngày của chế độ này. Vui lòng chọn lại mục tiêu hoặc kiểm tra thông tin sức khỏe.</p>}
      <div className="flex flex-wrap justify-end gap-3 border-t border-[#E5E7DF] pt-4">
        <button type="button" onClick={onClose} disabled={busy} className="vm-button rounded-xl border border-[#E5E7DF] px-4 py-2.5 text-sm disabled:opacity-50">Để sau</button>
        <button type="button" disabled={busy || target === null || targetTooLow} onClick={() => onConfirm(goal, value)} className="vm-button rounded-xl bg-[#254B38] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">{busy ? "Đang tạo thực đơn…" : "Tạo thực đơn theo mục tiêu"}</button>
      </div>
    </div>
  </ContentDialog>;
}
