export function formatMealPlanDate(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "UTC",
  }).format(date);
}

export function initialMealPlanDate(now = new Date()): string {
  return formatMealPlanDate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

export function parseMealPlanDate(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/.exec(value.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3]);
  if (year < 2000 || year > 2099) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.toISOString().slice(0, 10);
}

export function mealPlanDay(startDate: string, dayNumber: number, locale: string) {
  const date = new Date(`${startDate.slice(0, 10)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + dayNumber - 1);
  return {
    weekday: date.toLocaleDateString(locale, { weekday: "long", timeZone: "UTC" }),
    date: formatMealPlanDate(date),
  };
}
