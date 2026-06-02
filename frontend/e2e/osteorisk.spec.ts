import { expect, test, type Page, type Route } from "@playwright/test";

type PredictionFixture = {
  probability: number;
  risk_category: "low" | "borderline" | "high";
  recommendation_text: string;
};

const corsHeaders = {
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json"
};

function predictionFixture(overrides: Partial<PredictionFixture> = {}) {
  const probability = overrides.probability ?? 0.53;
  const riskCategory = overrides.risk_category ?? "borderline";
  return {
    prediction_id: "11111111-1111-1111-1111-111111111111",
    screening_id: "22222222-2222-2222-2222-222222222222",
    probability,
    probability_percent: Math.round(probability * 1000) / 10,
    risk_category: riskCategory,
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
        feature_key: "tug_seconds",
        label: "Тест TUG",
        value: 21,
        shap_value: 0.1,
        direction: "increases_risk"
      }
    ],
    recommendation_code:
      riskCategory === "high"
        ? "high_risk_specialist_referral"
        : riskCategory === "low"
          ? "planned_observation"
          : "attention_group_additional_tests",
    recommendation_text:
      overrides.recommendation_text ??
      (riskCategory === "high"
        ? "Высокий риск. Направление к эндокринологу, DXA, решение вопроса о начале терапии."
        : riskCategory === "low"
          ? "Плановое наблюдение. Контроль HbA1c и образа жизни."
          : "Группа внимания. Рекомендуется: DXA, витамин D, кальций, оценка риска падений."),
    model_version: "mock-osteorisk-v1",
    model_type: "mock",
    created_at: "2026-06-02T12:00:00Z"
  };
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    headers: corsHeaders,
    body: JSON.stringify(body)
  });
}

async function mockApi(
  page: Page,
  options: {
    prediction?: ReturnType<typeof predictionFixture>;
    predictionError?: string;
    capturePredictionBody?: (body: unknown) => void;
  } = {}
) {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }

    if (url.pathname.endsWith("/auth/login")) {
      await fulfillJson(route, {
        access_token: "e2e-access",
        refresh_token: "e2e-refresh",
        token_type: "bearer"
      });
      return;
    }

    if (url.pathname.endsWith("/auth/me")) {
      await fulfillJson(route, {
        id: "33333333-3333-3333-3333-333333333333",
        email: "admin@example.com",
        full_name: "System Administrator",
        role: "admin",
        is_active: true,
        preferred_language: "ru"
      });
      return;
    }

    if (url.pathname.endsWith("/auth/me/preferences")) {
      await fulfillJson(route, {
        id: "33333333-3333-3333-3333-333333333333",
        email: "admin@example.com",
        full_name: "System Administrator",
        role: "admin",
        is_active: true,
        preferred_language: "kk"
      });
      return;
    }

    if (url.pathname.endsWith("/model/status")) {
      await fulfillJson(route, {
        model_loaded: true,
        model_version: "mock-osteorisk-v1",
        model_type: "mock",
        explanation_available: true,
        development_mode: true
      });
      return;
    }

    if (url.pathname.endsWith("/predictions")) {
      options.capturePredictionBody?.(JSON.parse(request.postData() ?? "{}"));
      if (options.predictionError) {
        await fulfillJson(route, { detail: options.predictionError }, 500);
        return;
      }
      await fulfillJson(route, options.prediction ?? predictionFixture());
      return;
    }

    await fulfillJson(route, { detail: "not_mocked" }, 404);
  });
}

async function login(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByRole("heading", { name: "OsteoRisk-AI" })).toBeVisible();
}

async function fillRequiredPatientId(page: Page, patientId: string) {
  await page.locator('input[name="patient_id"]').fill(patientId);
}

test("male patient prediction flow excludes menopause data", async ({ page }) => {
  let capturedBody: unknown;
  await mockApi(page, {
    prediction: predictionFixture({ probability: 0.1999, risk_category: "low" }),
    capturePredictionBody: (body) => {
      capturedBody = body;
    }
  });
  await login(page);

  await fillRequiredPatientId(page, "E2E-MALE-001");
  await page.locator('select[name="sex"]').selectOption("male");
  await expect(page.getByTestId("menopause-section")).toBeHidden();
  await page.getByRole("button", { name: "Рассчитать риск" }).click();

  await expect(page.getByTestId("risk-result-card").getByText("Низкий риск")).toBeVisible();
  expect(capturedBody).toMatchObject({
    screening_data: {
      sex: "male",
      menopause_status: null,
      menopause_onset_age: null,
      postmenopause_duration: null
    }
  });
});

test("female postmenopause prediction flow renders SHAP and recommendation", async ({ page }) => {
  let capturedBody: unknown;
  await mockApi(page, {
    prediction: predictionFixture({ probability: 0.6001, risk_category: "high" }),
    capturePredictionBody: (body) => {
      capturedBody = body;
    }
  });
  await login(page);

  await fillRequiredPatientId(page, "E2E-FEMALE-001");
  await page.locator('input[name="age"]').fill("65");
  await page.locator('select[name="menopause_status"]').selectOption("postmenopause");
  await page.locator('input[name="menopause_onset_age"]').fill("50");
  await expect(page.getByTestId("postmenopause-duration")).toHaveValue("15");
  await page.getByRole("button", { name: "Рассчитать риск" }).click();

  await expect(page.getByTestId("risk-result-card").getByText("Высокий риск")).toBeVisible();
  await expect(page.getByText("Тест TUG")).toBeVisible();
  await expect(page.getByText(/Направление к эндокринологу/)).toBeVisible();
  expect(capturedBody).toMatchObject({
    screening_data: {
      sex: "female",
      menopause_status: "postmenopause",
      menopause_onset_age: 50,
      postmenopause_duration: 15
    }
  });
});

test("language switcher changes visible UI text", async ({ page }) => {
  await mockApi(page);
  await login(page);

  await page.getByRole("combobox", { name: "Язык" }).selectOption("kk");

  await expect(page.getByText("Пациент контексті")).toBeVisible();
  await expect(page.getByRole("button", { name: "Қауіпті есептеу" })).toBeVisible();
});

test("prediction API error is displayed as a friendly message", async ({ page }) => {
  await mockApi(page, { predictionError: "request_failed" });
  await login(page);

  await fillRequiredPatientId(page, "E2E-ERROR-001");
  await page.getByRole("button", { name: "Рассчитать риск" }).click();

  await expect(page.getByTestId("api-error-message")).toHaveText("Не удалось выполнить запрос.");
});

for (const scenario of [
  { probability: 0.2, risk_category: "borderline" as const, label: "Пограничный риск" },
  { probability: 0.6, risk_category: "borderline" as const, label: "Пограничный риск" },
  { probability: 0.6001, risk_category: "high" as const, label: "Высокий риск" }
]) {
  test(`boundary risk rendering for probability ${scenario.probability}`, async ({ page }) => {
    await mockApi(page, {
      prediction: predictionFixture({
        probability: scenario.probability,
        risk_category: scenario.risk_category
      })
    });
    await login(page);

    await fillRequiredPatientId(page, `E2E-BOUNDARY-${scenario.probability}`);
    await page.getByRole("button", { name: "Рассчитать риск" }).click();

    await expect(page.getByTestId(`traffic-risk-${scenario.risk_category}`).getByText(scenario.label)).toBeVisible();
    await expect(page.getByTestId(`traffic-risk-${scenario.risk_category}`)).toHaveClass(/bg-(amber|red)-50/);
  });
}
