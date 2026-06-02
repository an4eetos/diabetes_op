export type UserRole = "admin" | "doctor" | "nurse_registrar";
export type Sex = "female" | "male" | "other";
export type MenopauseStatus = "premenopause" | "perimenopause" | "postmenopause" | "yes" | "no" | "unknown";
export type DiabetesDuration = "lt_5" | "between_5_10" | "gt_10";
export type RiskCategory = "low" | "medium" | "high";
export type PredictionRiskCategory = "low" | "borderline" | "high";
export type ShapDirection = "increases_risk" | "decreases_risk";
export type SupportedLanguage = "ru" | "kk" | "en";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  preferred_language: SupportedLanguage;
}

export interface Patient {
  id: string;
  patient_external_id?: string | null;
  medical_record_number?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  middle_name?: string | null;
  date_of_birth?: string | null;
  sex?: Sex | null;
  menopause_status?: MenopauseStatus | null;
  phone?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OsteoRiskScreeningData {
  sex: Sex;
  age: number;
  height_cm: number;
  weight_kg: number;
  bmi?: number | null;
  diabetes_duration: DiabetesDuration;
  hba1c: number;
  has_polyneuropathy: boolean;
  has_retinopathy: boolean;
  has_nephropathy: boolean;
  menopause_status?: MenopauseStatus | null;
  menopause_onset_age?: number | null;
  postmenopause_duration?: number | null;
  vitamin_d?: number | null;
  pth?: number | null;
  alkaline_phosphatase?: number | null;
  total_calcium?: number | null;
  egfr?: number | null;
  falls_last_12_months: boolean;
  tug_seconds?: number | null;
  hand_grip_kg?: number | null;
  t_score?: number | null;
}

export interface ShapFactor {
  feature_key: string;
  label: string;
  value: string | number | boolean | null;
  shap_value: number;
  direction: ShapDirection;
}

export interface PredictionResponse {
  prediction_id: string;
  screening_id: string;
  probability: number;
  probability_percent: number;
  risk_category: PredictionRiskCategory;
  shap_factors: ShapFactor[];
  recommendation_code: string;
  recommendation_text: string;
  model_version: string;
  model_type: string;
  created_at: string;
}

export interface ModelStatus {
  model_loaded: boolean;
  model_version: string;
  model_type: string;
  explanation_available: boolean;
  development_mode: boolean;
}

export interface Screening {
  id: string;
  patient_id: string;
  performed_by_id: string;
  age: number;
  sex: Sex;
  menopause_status?: MenopauseStatus | null;
  diabetes_duration_years: number;
  hba1c_percent: number;
  previous_low_energy_fractures: boolean;
  previous_myocardial_infarction: boolean;
  previous_stroke: boolean;
  bmi?: number | null;
  egfr?: number | null;
  creatinine_umol_l?: number | null;
  bone_metabolism_markers?: Record<string, string | number | boolean | null> | null;
  total_risk: number;
  vascular_risk: number;
  skeletal_risk: number;
  risk_category: RiskCategory;
  recommendation_items: string[];
  algorithm_version: string;
  algorithm_disclaimer: string;
  created_at: string;
}

export interface RiskResult {
  total_risk: number;
  vascular_risk: number;
  skeletal_risk: number;
  category: RiskCategory;
  algorithm_version: string;
  algorithm_disclaimer: string;
}
