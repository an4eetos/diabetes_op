import { apiFetch, USE_MOCK_API } from "./client";
import { mockApi } from "./mock";
import type { Patient, Screening } from "../types";
import type { PatientFormData } from "../schemas/patient";

function normalizePatientPayload(payload: Partial<PatientFormData>): Partial<PatientFormData> {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [key, value === "" ? null : value])
  ) as Partial<PatientFormData>;
}

export function listPatients(query = ""): Promise<Patient[]> {
  if (USE_MOCK_API) {
    return mockApi.listPatients(query);
  }
  const params = new URLSearchParams();
  if (query) {
    params.set("q", query);
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<Patient[]>(`/patients${suffix}`);
}

export function getPatient(patientId: string): Promise<Patient> {
  if (USE_MOCK_API) {
    return mockApi.getPatient(patientId);
  }
  return apiFetch<Patient>(`/patients/${patientId}`);
}

export function createPatient(payload: PatientFormData): Promise<Patient> {
  if (USE_MOCK_API) {
    return mockApi.createPatient(normalizePatientPayload(payload));
  }
  return apiFetch<Patient>("/patients", {
    method: "POST",
    body: JSON.stringify(normalizePatientPayload(payload))
  });
}

export function updatePatient(patientId: string, payload: Partial<PatientFormData>): Promise<Patient> {
  if (USE_MOCK_API) {
    return mockApi.updatePatient(patientId, normalizePatientPayload(payload));
  }
  return apiFetch<Patient>(`/patients/${patientId}`, {
    method: "PATCH",
    body: JSON.stringify(normalizePatientPayload(payload))
  });
}

export function listPatientScreenings(patientId: string): Promise<Screening[]> {
  if (USE_MOCK_API) {
    return mockApi.listPatientScreenings(patientId);
  }
  return apiFetch<Screening[]>(`/patients/${patientId}/screenings`);
}
