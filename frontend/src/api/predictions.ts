import { apiFetch } from "./client";
import type { ModelStatus, OsteoRiskScreeningData, PredictionResponse, SupportedLanguage } from "../types";

export interface PredictionPayload {
  patient_id: string;
  screening_data: OsteoRiskScreeningData;
  derived_features?: Record<string, string | number | boolean | null>;
  language: SupportedLanguage;
}

export function createPrediction(payload: PredictionPayload): Promise<PredictionResponse> {
  return apiFetch<PredictionResponse>("/predictions", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getModelStatus(): Promise<ModelStatus> {
  return apiFetch<ModelStatus>("/model/status");
}
