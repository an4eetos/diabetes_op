import i18n from "../i18n";
import { apiFetch, downloadPdf, USE_MOCK_API } from "./client";
import { mockApi } from "./mock";
import type { Screening } from "../types";
import type { ScreeningFormData } from "../schemas/screening";

function toApiPayload(payload: ScreeningFormData) {
  return {
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
    bone_metabolism_markers: payload.bone_metabolism_markers
      ? { notes: payload.bone_metabolism_markers }
      : null
  };
}

export function createScreening(patientId: string, payload: ScreeningFormData): Promise<Screening> {
  if (USE_MOCK_API) {
    return mockApi.createScreening(patientId, payload);
  }
  return apiFetch<Screening>(`/screenings/patients/${patientId}`, {
    method: "POST",
    body: JSON.stringify(toApiPayload(payload))
  });
}

export function getScreening(screeningId: string): Promise<Screening> {
  if (USE_MOCK_API) {
    return mockApi.getScreening(screeningId);
  }
  return apiFetch<Screening>(`/screenings/${screeningId}`);
}

export function exportScreeningPdf(screeningId: string): Promise<void> {
  if (USE_MOCK_API) {
    return mockApi.exportScreeningPdf(screeningId);
  }
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "ru";
  return downloadPdf(`/pdf/screenings/${screeningId}?lang=${lang}`, `screening-protocol-${screeningId}.pdf`);
}
