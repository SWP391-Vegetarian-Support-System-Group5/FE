"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, CalendarDays, CircleAlert, Leaf, Ruler, Scale, Sparkles, Target, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { dietTypeAvoidsText, formatDietTypeName } from "@/lib/diet-type-display";
import { getDietTypes, getProfile, updateProfile, type DietTypeItem } from "@/lib/profile-api";

const activityLevels = [
  ["SEDENTARY", "Ít vận động", "Hầu như không tập luyện"],
  ["LIGHT", "Vận động nhẹ", "1–3 ngày mỗi tuần"],
  ["MODERATE", "Vận động vừa", "3–5 ngày mỗi tuần"],
  ["ACTIVE", "Vận động nhiều", "6–7 ngày mỗi tuần"],
  ["VERY_ACTIVE", "Rất năng động", "Lao động thể chất hoặc tập cường độ cao"],
] as const;

type FormState = {
  birthYear: string;
  sex: "" | "MALE" | "FEMALE";
  heightCm: string;
  weightKg: string;
  activityLevel: "" | (typeof activityLevels)[number][0];
  dietTypeId: string;
  goalWeightKg: string;
};

const emptyForm: FormState = { birthYear: "", sex: "", heightCm: "", weightKg: "", activityLevel: "", dietTypeId: "", goalWeightKg: "" };

function FieldLabel({ children, icon: Icon }: { children: React.ReactNode; icon: typeof UserRound }) {
  return <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#173C2D]"><Icon size={16} strokeWidth={2.25} className="text-[#658266]" />{children}</span>;
}

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [diets, setDiets] = useState<DietTypeItem[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!user) return;
    Promise.all([getProfile(), getDietTypes()]).then(([profile, types]) => {
      setDiets(types);
      setForm({ birthYear: profile.birthYear != null ? String(profile.birthYear) : "", sex: profile.sex || "", heightCm: profile.heightCm?.toString() || "", weightKg: profile.weightKg?.toString() || "", activityLevel: profile.activityLevel || "", dietTypeId: profile.dietTypeId?.toString() || "", goalWeightKg: profile.goalWeightKg?.toString() || "" });
    }).catch(() => setStatus("Không thể tải hồ sơ. Vui lòng thử lại."));
  }, [loading, router, user]);

  const height = Number(form.heightCm);
  const weight = Number(form.weightKg);
  const age = form.birthYear ? currentYear - Number(form.birthYear) : null;
  const bmi = height > 0 && weight > 0 ? weight / ((height / 100) ** 2) : null;
  const bmiLabel = bmi == null ? null : bmi < 18.5 ? "Gầy" : bmi < 25 ? "Bình thường" : "Béo phì";
  const selectedDiet = diets.find((diet) => diet.dietTypeId === Number(form.dietTypeId));
  const activityFactor: Record<string, number> = { SEDENTARY: 1.2, LIGHT: 1.375, MODERATE: 1.55, ACTIVE: 1.725, VERY_ACTIVE: 1.9 };
  const estimatedTdee = age && age >= 18 && age <= 120 && height > 0 && weight > 0 && form.sex && activityFactor[form.activityLevel]
    ? Math.round((10 * weight + 6.25 * height - 5 * age + (form.sex === "MALE" ? 5 : -161)) * activityFactor[form.activityLevel]) : null;
  const goalCopy = useMemo(() => {
    const goal = Number(form.goalWeightKg);
    if (!goal || !weight) return "Bạn có thể thêm cân nặng mục tiêu để VeggieMate ước lượng lộ trình phù hợp.";
    if (goal < weight) return `Mục tiêu giảm ${(weight - goal).toFixed(1)} kg. Khi tạo thực đơn, bạn có thể chọn mức thâm hụt năng lượng.`;
    if (goal > weight) return `Mục tiêu tăng ${(goal - weight).toFixed(1)} kg. Khi tạo thực đơn, bạn có thể chọn mức năng lượng dư.`;
    return "Cân nặng mục tiêu trùng với hiện tại, VeggieMate sẽ ưu tiên thực đơn duy trì.";
  }, [form.goalWeightKg, weight]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) { setForm((current) => ({ ...current, [key]: value })); setStatus(""); }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.birthYear || !form.sex || !height || !weight || !form.activityLevel || !form.dietTypeId) { setStatus("Vui lòng hoàn tất các thông tin bắt buộc để tạo thực đơn phù hợp."); return; }
    if (Number(form.birthYear) < 1900 || Number(form.birthYear) > currentYear - 18) { setStatus(`Năm sinh cần nằm trong khoảng 1900 đến ${currentYear - 18}.`); return; }
    setSaving(true);
    try {
      await updateProfile({ fullName: user!.fullName || user!.displayName || "Người dùng VeggieMate", sex: form.sex, birthYear: Number(form.birthYear), heightCm: height, weightKg: weight, activityLevel: form.activityLevel, dietTypeId: Number(form.dietTypeId), goalWeightKg: form.goalWeightKg ? Number(form.goalWeightKg) : null, latitude: null, longitude: null });
      router.replace("/");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Không lưu được hồ sơ."); } finally { setSaving(false); }
  }

  if (loading || !user) return <main className="grid min-h-screen place-items-center bg-[#FBF9F6] text-sm text-[#5E665F]">Đang chuẩn bị hồ sơ…</main>;
  const inputClass = "w-full rounded-xl border border-[#DFE6DC] bg-[#FCFDFB] px-4 py-3 text-[15px] text-[#07241A] shadow-[0_1px_0_rgba(7,36,26,0.02)] outline-none placeholder:text-[#9CA69F] focus:border-[#658266] focus:ring-4 focus:ring-[#658266]/10";

  return <main className="min-h-screen overflow-hidden bg-[#FBF9F6] px-4 py-7 sm:px-8 sm:py-12">
    <div aria-hidden className="pointer-events-none fixed -left-36 top-20 h-80 w-80 rounded-full bg-[#E3F0E6]/60 blur-3xl" /><div aria-hidden className="pointer-events-none fixed -right-32 bottom-0 h-96 w-96 rounded-full bg-[#F2E8D8]/55 blur-3xl" />
    <form onSubmit={submit} className="relative mx-auto grid max-w-5xl overflow-hidden rounded-[28px] border border-[#E6E9E2] bg-white shadow-[0_22px_60px_rgba(24,61,43,0.10)] lg:grid-cols-[0.78fr_1.22fr]">
      <aside className="relative overflow-hidden bg-[#173C2D] p-7 text-white sm:p-10"><div aria-hidden className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[28px] border-[#6F9B75]/30" /><div aria-hidden className="absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-[#2F654B]" /><div className="relative flex h-full flex-col"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/20"><Leaf size={22} /></div><p className="mt-12 text-xs font-bold tracking-[0.16em] text-[#C3DDC7]">CHÀO MỪNG ĐẾN VEGGIEMATE</p><h1 className="mt-3 font-serif text-4xl font-bold leading-tight">Hoàn thiện hồ sơ sức khỏe</h1><p className="mt-5 max-w-sm text-sm leading-6 text-[#D6E5D8]">Chỉ vài thông tin cơ bản để VeggieMate ước lượng BMI, TDEE và gợi ý thực đơn phù hợp với bạn.</p><div className="mt-auto space-y-3 pt-12 text-sm text-[#E7F0E8]">{["Tính theo dữ liệu bạn cung cấp", "Có thể cập nhật bất cứ lúc nào", "Không thay thế tư vấn y tế"].map((text) => <div key={text} className="flex items-center gap-3"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#75A27B] text-[#123324]"><Sparkles size={13} /></span>{text}</div>)}</div></div></aside>
      <section className="p-6 sm:p-10 lg:p-12"><div className="flex items-start justify-between gap-4 border-b border-[#EDF0EA] pb-6"><div><p className="text-xs font-bold tracking-[0.12em] text-[#658266]">THIẾT LẬP CÁ NHÂN</p><h2 className="mt-2 font-serif text-3xl font-bold text-[#07241A]">Thông tin của bạn</h2></div><span className="rounded-full bg-[#EDF4ED] px-3 py-1.5 text-xs font-semibold text-[#2D5A46]">Bước cuối</span></div>
        <div className="mt-7 grid gap-x-5 gap-y-5 sm:grid-cols-2">
          <label><FieldLabel icon={CalendarDays}>Năm sinh</FieldLabel><input required type="number" inputMode="numeric" min="1900" max={currentYear - 18} value={form.birthYear} onChange={(event) => update("birthYear", event.target.value)} placeholder="Ví dụ: 2004" className={inputClass} /><span className="mt-1.5 block text-xs text-[#727974]">Chỉ cần nhập năm sinh.</span></label>
          <label><FieldLabel icon={UserRound}>Giới tính</FieldLabel><select required value={form.sex} onChange={(event) => update("sex", event.target.value as FormState["sex"])} className={inputClass}><option value="">Chọn giới tính</option><option value="MALE">Nam</option><option value="FEMALE">Nữ</option></select></label>
          <label><FieldLabel icon={Ruler}>Chiều cao</FieldLabel><div className="relative"><input required min="1" type="number" inputMode="decimal" value={form.heightCm} onChange={(event) => update("heightCm", event.target.value)} placeholder="Ví dụ: 165" className={`${inputClass} pr-14`} /><span className="absolute right-4 top-3.5 text-sm font-medium text-[#727974]">cm</span></div></label>
          <label><FieldLabel icon={Scale}>Cân nặng hiện tại</FieldLabel><div className="relative"><input required min="1" type="number" inputMode="decimal" value={form.weightKg} onChange={(event) => update("weightKg", event.target.value)} placeholder="Ví dụ: 58" className={`${inputClass} pr-14`} /><span className="absolute right-4 top-3.5 text-sm font-medium text-[#727974]">kg</span></div></label>
          <label><FieldLabel icon={Activity}>Mức vận động</FieldLabel><select required value={form.activityLevel} onChange={(event) => update("activityLevel", event.target.value as FormState["activityLevel"])} className={inputClass}><option value="">Chọn mức vận động</option>{activityLevels.map(([value, label, detail]) => <option key={value} value={value}>{label} · {detail}</option>)}</select></label>
          <label><FieldLabel icon={Leaf}>Kiểu ăn chay</FieldLabel><select required value={form.dietTypeId} onChange={(event) => update("dietTypeId", event.target.value)} className={inputClass}><option value="">Chọn kiểu ăn chay</option>{diets.map((diet) => <option key={diet.dietTypeId} value={diet.dietTypeId}>{formatDietTypeName(diet.name, "vi")}</option>)}</select></label>
          <label className="sm:col-span-2"><FieldLabel icon={Target}>Cân nặng mục tiêu <span className="font-normal text-[#727974]">(không bắt buộc)</span></FieldLabel><div className="relative"><input min="1" type="number" inputMode="decimal" value={form.goalWeightKg} onChange={(event) => update("goalWeightKg", event.target.value)} placeholder="Ví dụ: 55" className={`${inputClass} pr-14`} /><span className="absolute right-4 top-3.5 text-sm font-medium text-[#727974]">kg</span></div></label>
        </div>
        {selectedDiet && <div className="mt-5 rounded-2xl border border-[#DDEBDD] bg-[#F4F9F3] p-4 text-sm leading-6 text-[#315C43]"><span className="font-semibold">{formatDietTypeName(selectedDiet.name, "vi")}:</span> {dietTypeAvoidsText(selectedDiet, "vi")}</div>}
        {(bmi != null || estimatedTdee != null) && <div className="mt-5 grid gap-3 rounded-2xl border border-[#DDEBDD] bg-[#F8FBF7] p-4 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#6A756D]">Chỉ số cơ thể</p><p className="mt-1 text-lg font-bold text-[#173C2D]">{bmi != null ? `BMI ${bmi.toFixed(1)} · ${bmiLabel}` : "Đang chờ dữ liệu"}</p>{age && <p className="mt-1 text-xs text-[#68726B]">Tuổi ước tính: {age}</p>}</div><div className="border-t border-[#E1EADF] pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0"><p className="text-xs font-semibold uppercase tracking-wide text-[#6A756D]">Năng lượng hằng ngày</p><p className="mt-1 text-lg font-bold text-[#173C2D]">{estimatedTdee ? `~${estimatedTdee.toLocaleString("vi-VN")} kcal` : "Điền đủ thông tin để tính"}</p><p className="mt-1 text-xs text-[#68726B]">{goalCopy}</p></div></div>}
        {status && <p role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-[#F2D6CB] bg-[#FFF7F4] px-4 py-3 text-sm text-[#99462A]"><CircleAlert size={18} className="mt-0.5 shrink-0" />{status}</p>}
        <div className="mt-7 flex justify-end border-t border-[#EDF0EA] pt-6"><button disabled={saving} className="vm-button inline-flex items-center gap-2 rounded-xl bg-[#173C2D] px-5 py-3 text-sm font-bold text-white shadow-[0_7px_16px_rgba(23,60,45,0.18)] hover:bg-[#234A38] disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Đang lưu…" : "Lưu và vào trang chủ"}<ArrowRight size={17} /></button></div>
      </section>
    </form>
  </main>;
}
