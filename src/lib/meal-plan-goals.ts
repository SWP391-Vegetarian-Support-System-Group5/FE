import type { BackendUserProfile } from "./profile-api";
import { birthYearFromDate, estimateProfileEnergy, isActivityLevel, validBirthYear } from "./profile-energy";

export type NutritionGoal = "MAINTAIN" | "LOSE" | "GAIN";
export const GOAL_LABELS: Record<NutritionGoal, string> = { MAINTAIN: "Duy trì cân nặng", LOSE: "Giảm cân", GAIN: "Tăng cân" };

export function planningProfile(profile: BackendUserProfile | null, currentYear: number) {
  const missing: string[] = [];
  const birthYear = profile?.birthYear != null ? String(profile.birthYear) : birthYearFromDate(profile?.birthDate);
  if (!profile) missing.push("Hồ sơ sức khỏe chưa tải được");
  if (!profile?.sex || !["MALE", "FEMALE"].includes(profile.sex)) missing.push("Giới tính");
  if (!validBirthYear(birthYear, currentYear)) missing.push("Năm sinh hợp lệ");
  if (!Number.isFinite(profile?.heightCm) || !profile?.heightCm || profile.heightCm < 1 || profile.heightCm > 300) missing.push("Chiều cao hợp lệ");
  if (!Number.isFinite(profile?.weightKg) || !profile?.weightKg || profile.weightKg < 1 || profile.weightKg > 1000) missing.push("Cân nặng hợp lệ");
  if (!profile?.dietTypeId) missing.push("Kiểu ăn chay");
  if (!isActivityLevel(profile?.activityLevel)) missing.push("Mức vận động đã được cập nhật trong hồ sơ");
  const energy = profile ? estimateProfileEnergy({
    sex: profile.sex, birthYear, heightCm: String(profile.heightCm ?? ""), weightKg: String(profile.weightKg ?? ""),
    activityLevel: isActivityLevel(profile.activityLevel) ? profile.activityLevel : null,
  }, currentYear) : null;
  const age = validBirthYear(birthYear, currentYear) ? currentYear - Number(birthYear) : null;
  const bmi = profile?.heightCm && profile.weightKg ? profile.weightKg / (profile.heightCm / 100) ** 2 : null;
  return { missing, energy, age, bmi, profile };
}

export type PlanningProfile = ReturnType<typeof planningProfile>;

export function suggestedGoal(bmi: number | null): NutritionGoal {
  return bmi === null ? "MAINTAIN" : bmi < 18.5 ? "GAIN" : bmi >= 25 ? "LOSE" : "MAINTAIN";
}

export function goalAllowed(bmi: number | null, goal: NutritionGoal): boolean {
  return bmi !== null && Number.isFinite(bmi) && !(bmi < 18.5 && goal === "LOSE") && !(bmi >= 25 && goal === "GAIN");
}

export function goalLimits(context: PlanningProfile, goal: NutritionGoal) {
  const tdee = context.energy ? Math.round(context.energy.tdee) : null;
  const minimumIntake = context.profile?.sex === "MALE" ? 1500 : 1200;
  // Conservative product cap, not a prediction or guarantee of weight change.
  const weight = context.profile?.weightKg ?? 0;
  const meters = (context.profile?.heightCm ?? 0) / 100;
  const distanceToBoundary = goal === "LOSE" ? weight - 18.5 * meters ** 2 : 24.9 * meters ** 2 - weight;
  const weeklyCapKg = Math.max(0, Math.min(1, weight * 0.01, distanceToBoundary));
  const weeklyEnergyCap = weeklyCapKg * 7700 / 7;
  const intakeCap = goal === "LOSE" ? Math.max(0, (tdee ?? 0) - minimumIntake) : 1000;
  const available = Math.floor(Math.min(1000, weeklyEnergyCap, intakeCap) / 50) * 50;
  const maxAdjustment = goal === "MAINTAIN" || !context.energy || !goalAllowed(context.bmi, goal) || available < 500 ? 0 : available;
  return { tdee, minimumIntake, weeklyCapKg, maxAdjustment };
}

export function normalizeGoal(goal: NutritionGoal, adjustment: number) {
  return { nutritionGoal: adjustment === 0 || goal === "MAINTAIN" ? "MAINTAIN" as const : goal,
    calorieAdjustment: adjustment === 0 || goal === "MAINTAIN" ? null : adjustment };
}
