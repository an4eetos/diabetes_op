import { languageStorageKey, type SupportedLanguage } from "../i18n";
import type { Patient, RiskCategory, Screening, User } from "../types";
import type { PatientFormData } from "../schemas/patient";
import type { ScreeningFormData } from "../schemas/screening";
import type { UserCreatePayload } from "./users";

const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();

const currentUser: User = {
  id: "mock-user-1",
  email: "admin@example.com",
  full_name: "Demo Doctor",
  role: "admin",
  is_active: true,
  preferred_language: (localStorage.getItem(languageStorageKey) as SupportedLanguage | null) ?? "ru"
};

let users: User[] = [currentUser];

let patients: Patient[] = [
  {
    id: "mock-patient-1",
    medical_record_number: "MRN-001",
    first_name: "Аида",
    last_name: "Каримова",
    middle_name: null,
    date_of_birth: "1962-04-14",
    sex: "female",
    phone: "+7 700 000 00 00",
    notes: null,
    created_at: now(),
    updated_at: now()
  }
];

let screenings: Screening[] = [];

function category(total: number): RiskCategory {
  if (total <= 33) return "low";
  if (total <= 66) return "medium";
  return "high";
}

function score(payload: ScreeningFormData) {
  let vascular = 0;
  let skeletal = 0;
  if (payload.age >= 65) {
    vascular += 15;
    skeletal += 20;
  }
  if (payload.diabetes_duration_years >= 10) {
    vascular += 15;
    skeletal += 10;
  }
  if (payload.hba1c_percent >= 8) {
    vascular += 15;
    skeletal += 10;
  }
  if (payload.previous_myocardial_infarction_answer === "yes") vascular += 30;
  if (payload.previous_stroke_answer === "yes") vascular += 30;
  if (payload.previous_low_energy_fractures_answer === "yes") skeletal += 35;
  if (payload.egfr !== undefined && payload.egfr < 60) {
    vascular += 10;
    skeletal += 10;
  }
  if (payload.bmi !== undefined && payload.bmi >= 30) vascular += 5;
  if (payload.bmi !== undefined && payload.bmi < 20) skeletal += 10;
  vascular = Math.min(100, vascular);
  skeletal = Math.min(100, skeletal);
  const total = Math.round((vascular + skeletal) / 2);
  return { total, vascular, skeletal };
}

export const mockApi = {
  async login(_email?: string, _password?: string) {
    return undefined;
  },
  async getMe() {
    return currentUser;
  },
  async updateMyPreferences(preferredLanguage: SupportedLanguage) {
    currentUser.preferred_language = preferredLanguage;
    localStorage.setItem(languageStorageKey, preferredLanguage);
    return currentUser;
  },
  async listUsers() {
    return users;
  },
  async createUser(payload: UserCreatePayload) {
    const user: User = {
      id: id(),
      email: payload.email,
      full_name: payload.full_name,
      role: payload.role,
      is_active: payload.is_active,
      preferred_language: payload.preferred_language
    };
    users = [user, ...users];
    return user;
  },
  async listPatients(query = "") {
    const normalized = query.toLowerCase();
    return patients.filter((patient) =>
      `${patient.last_name} ${patient.first_name} ${patient.medical_record_number ?? ""}`
        .toLowerCase()
        .includes(normalized)
    );
  },
  async getPatient(patientId: string) {
    const patient = patients.find((item) => item.id === patientId);
    if (!patient) throw new Error("Patient not found");
    return patient;
  },
  async createPatient(payload: Partial<PatientFormData>) {
    const patient: Patient = {
      id: id(),
      medical_record_number: payload.medical_record_number ?? null,
      first_name: payload.first_name ?? "",
      last_name: payload.last_name ?? "",
      middle_name: payload.middle_name ?? null,
      date_of_birth: payload.date_of_birth ?? null,
      sex: payload.sex ?? "female",
      phone: payload.phone ?? null,
      notes: payload.notes ?? null,
      created_at: now(),
      updated_at: now()
    };
    patients = [patient, ...patients];
    return patient;
  },
  async updatePatient(patientId: string, payload: Partial<PatientFormData>) {
    const patient = await this.getPatient(patientId);
    Object.assign(patient, payload, { updated_at: now() });
    return patient;
  },
  async listPatientScreenings(patientId: string) {
    return screenings.filter((screening) => screening.patient_id === patientId);
  },
  async createScreening(patientId: string, payload: ScreeningFormData) {
    const risk = score(payload);
    const riskCategory = category(risk.total);
    const recommendation_items =
      riskCategory === "low"
        ? ["standard_diabetes_control", "reassess_next_visit", "workflow_disclaimer"]
        : riskCategory === "medium"
          ? ["additional_exams", "optimize_diabetes_management", "workflow_disclaimer"]
          : ["urgent_specialist_referral", "preventive_measures", "workflow_disclaimer"];
    const screening: Screening = {
      id: id(),
      patient_id: patientId,
      performed_by_id: currentUser.id,
      age: payload.age,
      sex: payload.sex,
      diabetes_duration_years: payload.diabetes_duration_years,
      hba1c_percent: payload.hba1c_percent,
      previous_low_energy_fractures: payload.previous_low_energy_fractures_answer === "yes",
      previous_myocardial_infarction: payload.previous_myocardial_infarction_answer === "yes",
      previous_stroke: payload.previous_stroke_answer === "yes",
      bmi: payload.bmi,
      egfr: payload.egfr,
      creatinine_umol_l: payload.creatinine_umol_l,
      bone_metabolism_markers: payload.bone_metabolism_markers ? { notes: payload.bone_metabolism_markers } : null,
      total_risk: risk.total,
      vascular_risk: risk.vascular,
      skeletal_risk: risk.skeletal,
      risk_category: riskCategory,
      recommendation_items,
      algorithm_version: "mock-placeholder-v1",
      algorithm_disclaimer: "app.mvpNotice",
      created_at: now()
    };
    screenings = [screening, ...screenings];
    return screening;
  },
  async getScreening(screeningId: string) {
    const screening = screenings.find((item) => item.id === screeningId);
    if (!screening) throw new Error("Screening not found");
    return screening;
  },
  async exportScreeningPdf(_screeningId?: string) {
    return undefined;
  }
};
