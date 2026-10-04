// Profile types for the VeggieMate Profile & Health page

/** Stable enum values for vegetarian diet types — decoupled from display labels. */
export enum VegetarianDietType {
  VEGAN = "VEGAN",
  LACTO_OVO = "LACTO_OVO",
  LACTO = "LACTO",
  OVO = "OVO",
  FLEXITARIAN = "FLEXITARIAN",
}

/** Display labels + descriptions for each diet type */
export const DIET_TYPE_OPTIONS: {
  value: VegetarianDietType;
  label: string;
  description: string;
}[] = [
  {
    value: VegetarianDietType.VEGAN,
    label: "Vegan",
    description: "100% strictly plant-derived, no animal products",
  },
  {
    value: VegetarianDietType.LACTO_OVO,
    label: "Lacto-Ovo Vegetarian",
    description: "Plant-based with dairy and eggs",
  },
  {
    value: VegetarianDietType.LACTO,
    label: "Lacto Vegetarian",
    description: "Plant-based with dairy, no eggs",
  },
  {
    value: VegetarianDietType.OVO,
    label: "Ovo Vegetarian",
    description: "Plant-based with eggs, no dairy",
  },
  {
    value: VegetarianDietType.FLEXITARIAN,
    label: "Flexitarian",
    description: "Primarily plant-based with occasional animal products",
  },
];

/** Stable enum values for health goals — decoupled from display labels. */
export enum HealthGoal {
  WEIGHT_LOSS = "WEIGHT_LOSS",
  MAINTAIN_WEIGHT = "MAINTAIN_WEIGHT",
  WEIGHT_GAIN = "WEIGHT_GAIN",
}

/**
 * Demo health goal options.
 * When a real API/contract is available, replace this with the API response.
 */
export const HEALTH_GOAL_OPTIONS: { value: HealthGoal; label: string }[] = [
  { value: HealthGoal.WEIGHT_LOSS, label: "Weight Loss" },
  { value: HealthGoal.MAINTAIN_WEIGHT, label: "Maintain Weight" },
  { value: HealthGoal.WEIGHT_GAIN, label: "Weight Gain" },
];

/** The full profile data shape */
export interface ProfileData {
  // Personal Information
  fullName: string;
  email: string;
  phone: string;

  // Profile Summary
  bio: string;
  avatarUrl: string | null; // null = use fallback
  memberSince: string;

  // Health Profile
  heightCm: string; // kept as string for controlled input
  weightKg: string;
  healthGoal: HealthGoal;
  dietType: VegetarianDietType;
  allergies: string[];

  // Living Location
  city: string;
  district: string;
  address: string;
}

/** BMI category classification */
export interface BmiCategory {
  label: string;
  color: string;
}

/**
 * Standard WHO BMI classification.
 * NOTE: This is a standard classification only.
 * It does not constitute medical advice.
 */
export function classifyBmi(bmi: number): BmiCategory {
  if (bmi < 18.5) return { label: "Underweight", color: "#99462A" };
  if (bmi < 25) return { label: "Normal range", color: "#1E3A2F" };
  if (bmi < 30) return { label: "Overweight", color: "#99462A" };
  return { label: "Obese", color: "#99462A" };
}

/**
 * Compute BMI from height (cm) and weight (kg).
 * Returns null if inputs are invalid / zero.
 */
export function computeBmi(
  heightCm: string,
  weightKg: string
): number | null {
  const h = parseFloat(heightCm);
  const w = parseFloat(weightKg);
  if (!h || !w || h <= 0 || w <= 0 || isNaN(h) || isNaN(w)) return null;
  const heightM = h / 100;
  return w / (heightM * heightM);
}

/** Demo initial profile data matching the Figma frame */
export const DEMO_PROFILE: ProfileData = {
  fullName: "Minh Tran",
  email: "minh@email.com",
  phone: "+84 908 123 456",
  bio: "\u201CFocusing on soulful Vietnamese plant-based heritage and seasonal broths\u201D",
  avatarUrl: "/images/avatar-demo.png",
  memberSince: "November 2024",
  heightCm: "170",
  weightKg: "65",
  healthGoal: HealthGoal.WEIGHT_LOSS,
  dietType: VegetarianDietType.VEGAN,
  allergies: ["Peanuts", "Dairy"],
  city: "Ho Chi Minh City",
  district: "Thu Duc City",
  address: "42 Vo Van Ngan, Linh Chieu Ward",
};

/** Form validation errors */
export interface ProfileErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  heightCm?: string;
  weightKg?: string;
  allergies?: string;
}
