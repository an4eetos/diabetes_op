export type UserRole = "admin" | "doctor" | "nurse_registrar";
export type Sex = "female" | "male" | "other";
export type RiskCategory = "low" | "medium" | "high";
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
  medical_record_number?: string | null;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  date_of_birth?: string | null;
  sex: Sex;
  phone?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Screening {
  id: string;
  patient_id: string;
  performed_by_id: string;
  age: number;
  sex: Sex;
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
