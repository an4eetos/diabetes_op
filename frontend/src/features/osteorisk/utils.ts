import type { OsteoRiskFormData } from "./schema";
import type { OsteoRiskScreeningData, PredictionRiskCategory, SupportedLanguage } from "../../types";

const supportedLanguages: SupportedLanguage[] = ["ru", "kk", "en"];

export function normalizeLanguage(language: string | undefined): SupportedLanguage {
  const code = (language ?? "ru").slice(0, 2) as SupportedLanguage;
  return supportedLanguages.includes(code) ? code : "ru";
}

export function calculateBmi(heightCm?: number, weightKg?: number): number | null {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    return null;
  }
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
}

export function calculatePostmenopauseDuration(age?: number, onsetAge?: number): number | null {
  if (age === undefined || onsetAge === undefined) {
    return null;
  }
  const duration = age - onsetAge;
  return duration >= 0 ? duration : null;
}

function numberValue(value: unknown): number | undefined {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function nullableNumber(value: unknown): number | null {
  return numberValue(value) ?? null;
}

export function buildScreeningPayload(values: OsteoRiskFormData): OsteoRiskScreeningData {
  const age = numberValue(values.age) ?? values.age;
  const heightCm = numberValue(values.height_cm) ?? values.height_cm;
  const weightKg = numberValue(values.weight_kg) ?? values.weight_kg;
  const hba1c = numberValue(values.hba1c) ?? values.hba1c;
  const menopauseOnsetAge = numberValue(values.menopause_onset_age);
  const bmi = calculateBmi(heightCm, weightKg);
  const isFemale = values.sex === "female";
  const isPostmenopause = isFemale && values.menopause_status === "postmenopause";
  const postmenopauseDuration = isPostmenopause
    ? calculatePostmenopauseDuration(age, menopauseOnsetAge)
    : null;

  return {
    sex: values.sex,
    age,
    height_cm: heightCm,
    weight_kg: weightKg,
    bmi,
    diabetes_duration: values.diabetes_duration,
    hba1c,
    has_polyneuropathy: values.has_polyneuropathy,
    has_retinopathy: values.has_retinopathy,
    has_nephropathy: values.has_nephropathy,
    menopause_status: isFemale ? values.menopause_status ?? null : null,
    menopause_onset_age: isPostmenopause ? menopauseOnsetAge ?? null : null,
    postmenopause_duration: isPostmenopause ? postmenopauseDuration : null,
    vitamin_d: nullableNumber(values.vitamin_d),
    pth: nullableNumber(values.pth),
    alkaline_phosphatase: nullableNumber(values.alkaline_phosphatase),
    total_calcium: nullableNumber(values.total_calcium),
    egfr: nullableNumber(values.egfr),
    falls_last_12_months: values.falls_last_12_months,
    tug_seconds: nullableNumber(values.tug_seconds),
    hand_grip_kg: nullableNumber(values.hand_grip_kg),
    t_score: nullableNumber(values.t_score)
  };
}

export function stablePayloadHash(values: OsteoRiskFormData): string {
  return JSON.stringify(buildScreeningPayload(values));
}

export function riskTone(category: PredictionRiskCategory): {
  text: string;
  bg: string;
  border: string;
  accent: string;
} {
  if (category === "high") {
    return { text: "text-red-800", bg: "bg-red-50", border: "border-red-300", accent: "bg-red-600" };
  }
  if (category === "borderline") {
    return { text: "text-amber-900", bg: "bg-amber-50", border: "border-amber-300", accent: "bg-amber-500" };
  }
  return { text: "text-emerald-800", bg: "bg-emerald-50", border: "border-emerald-300", accent: "bg-emerald-600" };
}
