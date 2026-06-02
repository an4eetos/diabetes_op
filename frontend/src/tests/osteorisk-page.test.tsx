import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPrediction, getModelStatus } from "../api/predictions";
import OsteoRiskPage from "../pages/OsteoRiskPage";
import type { PredictionResponse } from "../types";
import { renderWithProviders } from "./test-utils";

vi.mock("../api/predictions", () => ({
  createPrediction: vi.fn(),
  getModelStatus: vi.fn()
}));

const prediction: PredictionResponse = {
  prediction_id: "11111111-1111-1111-1111-111111111111",
  screening_id: "22222222-2222-2222-2222-222222222222",
  probability: 0.6001,
  probability_percent: 60.1,
  risk_category: "high",
  shap_factors: [
    {
      feature_key: "diabetes_duration",
      label: "Длительность СД2",
      value: ">10 years",
      shap_value: 0.18,
      direction: "increases_risk"
    },
    {
      feature_key: "falls_last_12_months",
      label: "Падения за последние 12 месяцев",
      value: true,
      shap_value: 0.12,
      direction: "increases_risk"
    },
    {
      feature_key: "bmi",
      label: "ИМТ",
      value: 18.9,
      shap_value: 0.1,
      direction: "increases_risk"
    }
  ],
  recommendation_code: "high_risk_specialist_referral",
  recommendation_text: "Высокий риск. Направление к эндокринологу, DXA, решение вопроса о начале терапии.",
  model_version: "mock-osteorisk-v1",
  model_type: "mock",
  created_at: "2026-06-02T12:00:00Z"
};

function namedInput<T extends HTMLInputElement | HTMLSelectElement>(name: string): T {
  const element = document.querySelector(`[name="${name}"]`);
  expect(element).toBeInTheDocument();
  return element as T;
}

async function fillPatientId(value = "UNIT-001") {
  const user = userEvent.setup();
  await user.clear(namedInput<HTMLInputElement>("patient_id"));
  await user.type(namedInput<HTMLInputElement>("patient_id"), value);
  return user;
}

async function submitSuccessfulPrediction() {
  vi.mocked(createPrediction).mockResolvedValueOnce(prediction);
  const user = await fillPatientId();
  await user.click(screen.getByRole("button", { name: "Рассчитать риск" }));
  await waitFor(() => expect(screen.getAllByText("Высокий риск").length).toBeGreaterThan(0));
}

describe("OsteoRiskPage", () => {
  beforeEach(() => {
    vi.mocked(createPrediction).mockReset();
    vi.mocked(getModelStatus).mockResolvedValue({
      model_loaded: true,
      model_version: "mock-osteorisk-v1",
      model_type: "mock",
      explanation_available: true,
      development_mode: true
    });
  });

  it("auto-calculates BMI from height and weight", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OsteoRiskPage />);

    expect(screen.getByLabelText(/ИМТ/)).toHaveValue("26.4");

    await user.clear(namedInput<HTMLInputElement>("height_cm"));
    await user.type(namedInput<HTMLInputElement>("height_cm"), "170");
    await user.clear(namedInput<HTMLInputElement>("weight_kg"));
    await user.type(namedInput<HTMLInputElement>("weight_kg"), "68");

    expect(screen.getByLabelText(/ИМТ/)).toHaveValue("23.5");
  });

  it("shows menopause block only for female patients", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OsteoRiskPage />);

    expect(screen.getByTestId("menopause-section")).toBeInTheDocument();

    await user.selectOptions(namedInput<HTMLSelectElement>("sex"), "male");

    expect(screen.queryByTestId("menopause-section")).not.toBeInTheDocument();
  });

  it("shows menopause onset age only for postmenopause", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OsteoRiskPage />);

    expect(screen.queryByLabelText(/Возраст наступления менопаузы/)).not.toBeInTheDocument();

    await user.selectOptions(namedInput<HTMLSelectElement>("menopause_status"), "postmenopause");

    expect(screen.getByLabelText(/Возраст наступления менопаузы/)).toBeInTheDocument();
  });

  it("auto-calculates postmenopause duration", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OsteoRiskPage />);

    await user.selectOptions(namedInput<HTMLSelectElement>("menopause_status"), "postmenopause");
    await user.clear(namedInput<HTMLInputElement>("age"));
    await user.type(namedInput<HTMLInputElement>("age"), "65");
    await user.type(namedInput<HTMLInputElement>("menopause_onset_age"), "50");

    expect(screen.getByTestId("postmenopause-duration")).toHaveValue("15");
  });

  it("clears hidden menopause data when switching female to male", async () => {
    vi.mocked(createPrediction).mockResolvedValueOnce({ ...prediction, risk_category: "borderline" });
    renderWithProviders(<OsteoRiskPage />);

    const user = await fillPatientId("UNIT-MALE");
    await user.selectOptions(namedInput<HTMLSelectElement>("menopause_status"), "postmenopause");
    await user.type(namedInput<HTMLInputElement>("menopause_onset_age"), "50");
    await user.selectOptions(namedInput<HTMLSelectElement>("sex"), "male");
    await user.click(screen.getByRole("button", { name: "Рассчитать риск" }));

    await waitFor(() => expect(createPrediction).toHaveBeenCalledTimes(1));
    const payload = vi.mocked(createPrediction).mock.calls[0][0];
    expect(payload.screening_data.sex).toBe("male");
    expect(payload.screening_data.menopause_status).toBeNull();
    expect(payload.screening_data.menopause_onset_age).toBeNull();
    expect(payload.screening_data.postmenopause_duration).toBeNull();
  });

  it("validates required fields before submission", async () => {
    const user = userEvent.setup();
    renderWithProviders(<OsteoRiskPage />);

    await user.click(screen.getByRole("button", { name: "Рассчитать риск" }));

    expect(await screen.findByText("Заполните поле")).toBeInTheDocument();
    expect(createPrediction).not.toHaveBeenCalled();
  });

  it("renders high risk color and label", async () => {
    renderWithProviders(<OsteoRiskPage />);

    await submitSuccessfulPrediction();

    expect(screen.getByTestId("traffic-risk-high")).toHaveClass("bg-red-50");
    expect(screen.getByTestId("risk-result-card")).toHaveClass("bg-red-50");
    expect(screen.getAllByText("Высокий риск").length).toBeGreaterThan(0);
  });

  it("renders SHAP factors returned by the backend", async () => {
    renderWithProviders(<OsteoRiskPage />);

    await submitSuccessfulPrediction();

    expect(screen.getAllByText("Длительность СД2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Падения за последние 12 месяцев").length).toBeGreaterThan(0);
    expect(screen.getAllByText("ИМТ").length).toBeGreaterThan(0);
  });

  it("renders backend recommendation text", async () => {
    renderWithProviders(<OsteoRiskPage />);

    await submitSuccessfulPrediction();

    expect(screen.getByText(/Направление к эндокринологу/)).toBeInTheDocument();
  });
});
