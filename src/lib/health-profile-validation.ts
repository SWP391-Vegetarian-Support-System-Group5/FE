import { computeBmi } from "../types/profile";

type HealthFields = { heightCm: string; weightKg: string; goalWeightKg: string };
type HealthError = "heightRequired" | "heightRange" | "weightRequired" | "weightRange" | "goalRange" | "goalNeedsMeasurements" | "obesityGain" | "underweightLoss" | "overweightGain" | "goalRequired" | "goalBmiRange";
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
      const targetBmi = computeBmi(String(height), String(goal))!;
      if (bmi >= 25 && goal >= weight) errors.goalWeightKg = bmi >= 30 ? "obesityGain" : "overweightGain";
      else if (bmi < 18.5 && goal <= weight) errors.goalWeightKg = "underweightLoss";
      else if ((bmi >= 18.5 && targetBmi < 18.5) || (bmi < 25 && targetBmi >= 25)) errors.goalWeightKg = "goalBmiRange";
    }
  } else if (required) errors.goalWeightKg = "goalRequired";
  return errors;
}

// Product suggestion: midpoint of the normal BMI band; retain current weight
// when already in that band. This is a reference, not an individual diagnosis.
export function suggestGoalWeight(heightCm: string, weightKg: string): string {
  if (!heightCm.trim() || !weightKg.trim()) return "";
  if (Object.keys(validateHealthProfile({ heightCm, weightKg, goalWeightKg: "" })).length) return "";
  const bmi = computeBmi(heightCm, weightKg)!;
  if (bmi >= 18.5 && bmi < 25) return String(Number(weightKg));
  return (21.75 * (Number(heightCm) / 100) ** 2).toFixed(1);
}

export function healthErrorText(error: HealthError, t: (en: string, vi: string) => string): string {
  switch (error) {
    case "goalRequired": return t("Please enter your target weight.", "Vui lòng nhập cân nặng mục tiêu.");
    case "overweightGain": return t("Your current BMI is in the overweight range. Choose a target below your current weight to move towards a balanced BMI.", "BMI hiện tại của bạn thuộc nhóm thừa cân. Vui lòng chọn cân nặng mục tiêu thấp hơn hiện tại để hướng tới BMI cân bằng.");
    case "goalBmiRange": return t("This target would move your BMI outside the normal range or past it into the opposite category. Choose a target corresponding to a BMI from 18.5 to below 25.", "Mục tiêu này đưa BMI ra ngoài mức bình thường hoặc vượt sang nhóm thiếu cân/thừa cân đối diện. Vui lòng chọn mục tiêu tương ứng với BMI từ 18,5 đến dưới 25.");
    case "heightRequired": return t("Please enter your height.", "Vui lòng nhập chiều cao.");
    case "weightRequired": return t("Please enter your current weight.", "Vui lòng nhập cân nặng hiện tại.");
    case "heightRange": return t("Height must be a number greater than 140 cm and less than 210 cm.", "Chiều cao không hợp lệ. Vui lòng nhập số lớn hơn 140 cm và nhỏ hơn 210 cm; không chấp nhận giá trị bằng hai mốc này.");
    case "weightRange": return t("Current weight must be a number greater than 45 kg and less than 120 kg.", "Cân nặng hiện tại không hợp lệ. Vui lòng nhập số lớn hơn 45 kg và nhỏ hơn 120 kg; không chấp nhận giá trị bằng hai mốc này.");
    case "goalRange": return t("Target weight must be a number between 1 and 1,000 kg.", "Cân nặng mục tiêu không hợp lệ. Vui lòng nhập một số từ 1 đến 1.000 kg.");
    case "goalNeedsMeasurements": return t("Enter a valid height and current weight first so the target can be checked against your BMI.", "Vui lòng nhập chiều cao và cân nặng hiện tại hợp lệ trước để kiểm tra mục tiêu theo BMI.");
    case "obesityGain": return t("Your current BMI is in the obesity range. Choose a target below your current weight to move towards a balanced BMI.", "BMI hiện tại của bạn thuộc nhóm béo phì. Vui lòng chọn cân nặng mục tiêu thấp hơn hiện tại để hướng tới BMI cân bằng.");
    case "underweightLoss": return t("Your current BMI is in the underweight range. Choose a target above your current weight to move towards a balanced BMI.", "BMI hiện tại của bạn thuộc nhóm thiếu cân. Vui lòng chọn cân nặng mục tiêu cao hơn hiện tại để hướng tới BMI cân bằng.");
  }
}
