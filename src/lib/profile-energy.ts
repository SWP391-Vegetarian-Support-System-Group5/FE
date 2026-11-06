export const ACTIVITY_LEVELS = [
  { value: "SEDENTARY", label: "Ít vận động", detail: "Chủ yếu ngồi, ít hoặc không tập luyện", factor: 1.2 },
  { value: "LIGHT", label: "Vận động nhẹ", detail: "Tập nhẹ 1–3 buổi/tuần", factor: 1.375 },
  { value: "MODERATE", label: "Vận động vừa", detail: "Tập vừa 3–5 buổi/tuần", factor: 1.55 },
  { value: "ACTIVE", label: "Vận động nhiều", detail: "Tập nặng 6–7 buổi/tuần", factor: 1.725 },
  { value: "VERY_ACTIVE", label: "Vận động rất nhiều", detail: "Lao động thể lực nặng hoặc tập cường độ cao hai buổi/ngày", factor: 1.9 },
] as const;

export type ActivityLevel = typeof ACTIVITY_LEVELS[number]["value"];

export function isActivityLevel(value: unknown): value is ActivityLevel {
  return ACTIVITY_LEVELS.some(level => level.value === value);
}

export function birthYearFromDate(date: string | null | undefined): string {
  return date?.match(/^(\d{4})-/)?.[1] ?? "";
}

export function validBirthYear(value: string, currentYear: number): boolean {
  return /^\d{4}$/.test(value) && Number(value) >= currentYear - 120 && Number(value) <= currentYear;
}

export function birthDateForYear(year: string, previousDate: string | null): string | null {
  if (!year) return null;
  // Preserve an existing exact date. The current API accepts birthDate, not birthYear;
  // use January 1 as the year-only representation when the user changes the year.
  return birthYearFromDate(previousDate) === year ? previousDate : `${year}-01-01`;
}

export function estimateProfileEnergy(input: {
  sex: "MALE" | "FEMALE" | null;
  birthYear: string;
  heightCm: string;
  weightKg: string;
  activityLevel: ActivityLevel | null;
}, currentYear: number): { restingEnergy: number; tdee: number; factor: number; age: number } | null {
  if (!input.sex || !validBirthYear(input.birthYear, currentYear)) return null;
  const age = currentYear - Number(input.birthYear);
  const height = Number(input.heightCm);
  const weight = Number(input.weightKg);
  const activity = ACTIVITY_LEVELS.find(level => level.value === input.activityLevel);
  if (age < 18 || !activity || !Number.isFinite(height) || height < 1 || height > 300 ||
      !Number.isFinite(weight) || weight < 1 || weight > 1000) return null;
  // Mifflin–St Jeor, simplified resting energy equation: PMID 2305711.
  // Conventional activity multipliers are selected by reported activity, not age/sex.
  const restingEnergy = 10 * weight + 6.25 * height - 5 * age + (input.sex === "MALE" ? 5 : -161);
  if (restingEnergy <= 0) return null;
  return { restingEnergy, tdee: restingEnergy * activity.factor, factor: activity.factor, age };
}
