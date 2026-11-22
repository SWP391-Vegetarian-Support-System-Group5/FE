import { computeBmi } from "../types/profile";

type HealthFields = { heightCm: string; weightKg: string; goalWeightKg: string };
type HealthError = "heightRequired" | "heightRange" | "weightRequired" | "weightRange" | "goalRange" | "goalNeedsMeasurements" | "obesityGain" | "underweightLoss";
export type HealthErrors = Partial<Record<keyof HealthFields, HealthError>>;

// Product input limits; these do not define whether a person is healthy.
export function validateHealthProfile(form: HealthFields, required = false): HealthErrors {
  const errors: HealthErrors = {};
  const height = Number(form.heightCm);
  const weight = Number(form.weightKg);
  const goal = Number(form.goalWeightKg);
  const measurementsRequired = required || !!form.goalWeightKg.trim();
  if (!form.heightCm.trim()) {
    if (measurementsRequired) errors.heightCm = "heightRequired";
  } else if (!Number.isFinite(height) || height <= 140 || height >= 210) errors.heightCm = "heightRange";
  if (!form.weightKg.trim()) {
    if (measurementsRequired) errors.weightKg = "weightRequired";
  } else if (!Number.isFinite(weight) || weight <= 45 || weight >= 120) errors.weightKg = "weightRange";
  // Finish checking current measurements before validating any target.
  if (errors.heightCm || errors.weightKg) return errors;
  if (form.goalWeightKg.trim()) {
    if (!Number.isFinite(goal) || goal < 1 || goal > 1000) errors.goalWeightKg = "goalRange";
    else {
      const bmi = computeBmi(String(height), String(weight))!;
      if (bmi >= 30 && goal > weight) errors.goalWeightKg = "obesityGain";
      if (bmi < 18.5 && goal < weight) errors.goalWeightKg = "underweightLoss";
    }
  }
  return errors;
}

export function healthErrorText(error: HealthError, t: (en: string, vi: string) => string): string {
  switch (error) {
    case "heightRequired": return t("Please enter your height.", "Vui lòng nhập chiều cao.");
    case "weightRequired": return t("Please enter your current weight.", "Vui lòng nhập cân nặng hiện tại.");
    case "heightRange": return t("Height must be a number greater than 140 cm and less than 210 cm.", "Chiều cao không hợp lệ. Vui lòng nhập số lớn hơn 140 cm và nhỏ hơn 210 cm; không chấp nhận giá trị bằng hai mốc này.");
    case "weightRange": return t("Current weight must be a number greater than 45 kg and less than 120 kg.", "Cân nặng hiện tại không hợp lệ. Vui lòng nhập số lớn hơn 45 kg và nhỏ hơn 120 kg; không chấp nhận giá trị bằng hai mốc này.");
    case "goalRange": return t("Target weight must be a number between 1 and 1,000 kg.", "Cân nặng mục tiêu không hợp lệ. Vui lòng nhập một số từ 1 đến 1.000 kg.");
    case "goalNeedsMeasurements": return t("Enter a valid height and current weight first so the target can be checked against your BMI.", "Vui lòng nhập chiều cao và cân nặng hiện tại hợp lệ trước để kiểm tra mục tiêu theo BMI.");
    case "obesityGain": return t("Your current BMI is in the obesity range. Your target cannot be higher than your current weight. Choose to maintain your weight or a lower target if you want to lose weight.", "BMI hiện tại của bạn thuộc nhóm béo phì. Cân nặng mục tiêu không được cao hơn cân nặng hiện tại. Vui lòng chọn giữ nguyên cân nặng hoặc mục tiêu thấp hơn nếu bạn muốn giảm cân.");
    case "underweightLoss": return t("Your current BMI is in the underweight range. Your target cannot be lower than your current weight. Choose to maintain your weight or a higher target if you want to gain weight.", "BMI hiện tại của bạn thuộc nhóm thiếu cân (gầy). Cân nặng mục tiêu không được thấp hơn cân nặng hiện tại. Vui lòng chọn giữ nguyên cân nặng hoặc mục tiêu cao hơn nếu bạn muốn tăng cân.");
  }
}
