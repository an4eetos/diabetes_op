import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  Calculator,
  CheckCircle2,
  Clock,
  FlaskConical,
  Info,
  RefreshCcw,
  ShieldAlert,
  UserRound
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { createPrediction, getModelStatus } from "../api/predictions";
import Field from "../components/ui/Field";
import PageHeader from "../components/ui/PageHeader";
import Panel from "../components/ui/Panel";
import { createOsteoRiskSchema, type OsteoRiskFormData } from "../features/osteorisk/schema";
import {
  buildScreeningPayload,
  calculateBmi,
  calculatePostmenopauseDuration,
  normalizeLanguage,
  riskTone
} from "../features/osteorisk/utils";
import type {
  DiabetesDuration,
  MenopauseStatus,
  PredictionResponse,
  PredictionRiskCategory,
  ShapFactor
} from "../types";

const DRAFT_KEY = "osteorisk_ai_draft_v1";

const defaultValues: OsteoRiskFormData = {
  patient_id: "",
  sex: "female",
  age: 55,
  height_cm: 165,
  weight_kg: 72,
  diabetes_duration: "between_5_10",
  hba1c: 7.2,
  has_polyneuropathy: false,
  has_retinopathy: false,
  has_nephropathy: false,
  menopause_status: "premenopause",
  menopause_onset_age: undefined,
  vitamin_d: undefined,
  pth: undefined,
  alkaline_phosphatase: undefined,
  total_calcium: undefined,
  egfr: undefined,
  falls_last_12_months: false,
  tug_seconds: undefined,
  hand_grip_kg: undefined,
  t_score: undefined
};

const diabetesDurationOptions: DiabetesDuration[] = ["lt_5", "between_5_10", "gt_10"];
const menopauseStatusOptions: Extract<MenopauseStatus, "premenopause" | "perimenopause" | "postmenopause">[] = [
  "premenopause",
  "perimenopause",
  "postmenopause"
];
const riskCategories: PredictionRiskCategory[] = ["low", "borderline", "high"];

function toNumber(value: unknown): number | undefined {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function formStateHash(values: OsteoRiskFormData): string {
  return JSON.stringify({
    patient_id: values.patient_id,
    screening_data: buildScreeningPayload(values)
  });
}

function Section({
  title,
  description,
  icon,
  children
}: {
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Panel
      title={title}
      description={description}
      actions={<div className="rounded-md bg-teal-50 p-2 text-teal-700">{icon}</div>}
    >
      {children}
    </Panel>
  );
}

function CheckboxRow({
  label,
  description,
  input
}: {
  label: string;
  description?: string;
  input: UseFormRegisterReturn;
}) {
  return (
    <label className="flex min-h-[52px] items-start gap-3 rounded-md border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm transition hover:border-teal-200 hover:bg-teal-50/40">
      <input
        className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
        type="checkbox"
        {...input}
      />
      <span className="min-w-0">
        <span className="block font-semibold text-slate-800">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-5 text-slate-500">{description}</span>}
      </span>
    </label>
  );
}

function TrafficLightRisk({ category }: { category: PredictionRiskCategory }) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" aria-label={t("osteorisk.result.trafficLight")}>
      {riskCategories.map((riskCategory) => {
        const active = riskCategory === category;
        const tone = riskTone(riskCategory);
        return (
          <div
            data-testid={`traffic-risk-${riskCategory}`}
            className={`rounded-md border px-3 py-3 text-center transition ${
              active ? `${tone.bg} ${tone.border} shadow-sm` : "border-slate-200 bg-slate-50 text-slate-400"
            }`}
            key={riskCategory}
          >
            <div
              className={`mx-auto mb-2 h-3 w-10 rounded-full ${
                active ? tone.accent : "bg-slate-300"
              }`}
              aria-hidden
            />
            <p className={`text-sm font-bold ${active ? tone.text : "text-slate-500"}`}>
              {t(`osteorisk.riskCategories.${riskCategory}`)}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{t(`osteorisk.thresholds.${riskCategory}`)}</p>
          </div>
        );
      })}
    </div>
  );
}

function ShapFactorsList({ factors }: { factors: ShapFactor[] }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      {factors.map((factor) => (
        <div className="rounded-md border border-slate-200 bg-white px-3 py-3" key={factor.feature_key}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">{factor.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {t("osteorisk.shap.value")}: {String(factor.value)}
              </p>
            </div>
            <span
              className={`rounded px-2 py-1 text-xs font-bold ${
                factor.direction === "increases_risk"
                  ? "bg-red-50 text-red-800"
                  : "bg-emerald-50 text-emerald-800"
              }`}
            >
              {t(`osteorisk.shap.directions.${factor.direction}`)}
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-600">
            {t("osteorisk.shap.impact")}: {factor.shap_value > 0 ? "+" : ""}
            {factor.shap_value.toFixed(2)}
          </p>
        </div>
      ))}
    </div>
  );
}

function ResultPanel({
  prediction,
  outdated,
  isLoading
}: {
  prediction: PredictionResponse | null;
  outdated: boolean;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const modelStatusQuery = useQuery({ queryKey: ["model-status"], queryFn: getModelStatus });

  if (!prediction) {
    return (
      <Panel title={t("osteorisk.result.title")} description={t("osteorisk.result.emptyDescription")} className="sticky top-4">
        <div className="flex min-h-[420px] flex-col justify-between gap-6">
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
            <Calculator className="mx-auto text-slate-400" size={34} aria-hidden />
            <p className="mt-4 text-base font-bold text-slate-800">
              {isLoading ? t("osteorisk.result.loading") : t("osteorisk.result.emptyTitle")}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
              {t("osteorisk.result.emptyText")}
            </p>
          </div>
          <div className="rounded-md bg-white p-4 ring-1 ring-slate-200">
            <p className="text-sm font-bold text-slate-900">{t("osteorisk.model.statusTitle")}</p>
            <dl className="mt-3 grid gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">{t("osteorisk.model.version")}</dt>
                <dd className="text-right font-semibold text-slate-800">
                  {modelStatusQuery.data?.model_version ?? t("common.loading")}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">{t("osteorisk.model.type")}</dt>
                <dd className="text-right font-semibold text-slate-800">
                  {modelStatusQuery.data?.model_type ?? t("common.notProvided")}
                </dd>
              </div>
            </dl>
          </div>
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-600">
            {t("osteorisk.disclaimer")}
          </p>
        </div>
      </Panel>
    );
  }

  const tone = riskTone(prediction.risk_category);

  return (
    <Panel title={t("osteorisk.result.title")} description={t("osteorisk.result.description")} className="sticky top-4">
      <div className="space-y-5">
        {outdated && (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
            <RefreshCcw size={17} aria-hidden className="mt-0.5 shrink-0" />
            <span>{t("osteorisk.result.outdated")}</span>
          </div>
        )}

        <div className={`rounded-lg border ${tone.border} ${tone.bg} p-4`} data-testid="risk-result-card">
          <p className="text-sm font-bold uppercase tracking-normal text-slate-600">
            {t("osteorisk.result.probability")}
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-3">
            <p className={`text-5xl font-black leading-none ${tone.text}`}>
              {Math.round(prediction.probability_percent)}
              <span className="text-2xl">%</span>
            </p>
            <div className="pb-1">
              <p className={`text-lg font-bold ${tone.text}`}>
                {t(`osteorisk.riskCategories.${prediction.risk_category}`)}
              </p>
              <p className="text-xs font-semibold text-slate-600">
                {t("osteorisk.result.exactProbability", { value: prediction.probability.toFixed(3) })}
              </p>
            </div>
          </div>
        </div>

        <TrafficLightRisk category={prediction.risk_category} />

        <div>
          <div className="mb-2 flex items-center gap-2">
            <Activity size={18} className="text-teal-700" aria-hidden />
            <h2 className="text-base font-bold text-slate-950">{t("osteorisk.shap.title")}</h2>
          </div>
          <ShapFactorsList factors={prediction.shap_factors.slice(0, 3)} />
          <p className="mt-2 text-xs leading-5 text-slate-500">{t("osteorisk.shap.mockNotice")}</p>
        </div>

        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 shrink-0 text-teal-700" size={20} aria-hidden />
            <div className="min-w-0">
              <h2 className="text-base font-bold text-teal-950">{t("osteorisk.result.recommendation")}</h2>
              <p className="mt-2 text-sm leading-6 text-teal-950">{prediction.recommendation_text}</p>
            </div>
          </div>
        </div>

        <dl className="grid gap-2 rounded-md border border-slate-200 bg-white px-3 py-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">{t("osteorisk.model.version")}</dt>
            <dd className="text-right font-semibold text-slate-800">{prediction.model_version}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">{t("osteorisk.model.type")}</dt>
            <dd className="text-right font-semibold text-slate-800">{prediction.model_type}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-slate-500">{t("osteorisk.model.createdAt")}</dt>
            <dd className="text-right font-semibold text-slate-800">
              {new Date(prediction.created_at).toLocaleString()}
            </dd>
          </div>
        </dl>

        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-xs leading-5 text-slate-600">
          {t("osteorisk.disclaimer")}
        </p>
      </div>
    </Panel>
  );
}

export default function OsteoRiskPage() {
  const { i18n, t } = useTranslation();
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [submittedHash, setSubmittedHash] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<"restored" | "saved" | null>(null);
  const hasRestoredDraft = useRef(false);
  const schema = useMemo(() => createOsteoRiskSchema(t), [t]);

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setValue,
    watch
  } = useForm<OsteoRiskFormData>({
    defaultValues,
    mode: "onBlur",
    resolver: zodResolver(schema)
  });

  const watchedValues = watch();
  const sex = watchedValues.sex;
  const menopauseStatus = watchedValues.menopause_status;
  const age = toNumber(watchedValues.age);
  const heightCm = toNumber(watchedValues.height_cm);
  const weightKg = toNumber(watchedValues.weight_kg);
  const onsetAge = toNumber(watchedValues.menopause_onset_age);
  const tugSeconds = toNumber(watchedValues.tug_seconds);
  const bmi = calculateBmi(heightCm, weightKg);
  const postmenopauseDuration = sex === "female" && menopauseStatus === "postmenopause"
    ? calculatePostmenopauseDuration(age, onsetAge)
    : null;
  const currentHash = formStateHash(watchedValues);
  const isOutdated = Boolean(prediction && submittedHash && currentHash !== submittedHash);
  const ageWarning = age !== undefined && (age < 40 || age > 70);
  const highFallRisk = tugSeconds !== undefined && tugSeconds >= 20;

  const predictionMutation = useMutation({
    mutationFn: createPrediction
  });

  useEffect(() => {
    const rawDraft = localStorage.getItem(DRAFT_KEY);
    if (!rawDraft) {
      hasRestoredDraft.current = true;
      return;
    }
    try {
      const draft = JSON.parse(rawDraft) as Partial<OsteoRiskFormData>;
      reset({ ...defaultValues, ...draft });
      setDraftStatus("restored");
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    } finally {
      hasRestoredDraft.current = true;
    }
  }, [reset]);

  useEffect(() => {
    const subscription = watch((values) => {
      if (!hasRestoredDraft.current) {
        return;
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
      setDraftStatus("saved");
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    if (sex === "male") {
      if (menopauseStatus !== null) {
        setValue("menopause_status", null, { shouldDirty: true, shouldValidate: true });
      }
      if (onsetAge !== undefined) {
        setValue("menopause_onset_age", undefined, { shouldDirty: true, shouldValidate: true });
      }
      return;
    }

    if (sex === "female" && !menopauseStatus) {
      setValue("menopause_status", "premenopause", { shouldDirty: true, shouldValidate: true });
    }

    if (menopauseStatus !== "postmenopause" && onsetAge !== undefined) {
      setValue("menopause_onset_age", undefined, { shouldDirty: true, shouldValidate: true });
    }
  }, [menopauseStatus, onsetAge, setValue, sex]);

  function fieldError(name: keyof OsteoRiskFormData): string | undefined {
    const error = errors[name];
    return typeof error?.message === "string" ? error.message : undefined;
  }

  function onSubmit(values: OsteoRiskFormData) {
    const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language);
    const payload = buildScreeningPayload(values);
    const formHash = formStateHash(values);
    predictionMutation.mutate(
      {
        patient_id: values.patient_id.trim(),
        screening_data: payload,
        derived_features: {
          bmi: payload.bmi ?? null,
          postmenopause_duration: payload.postmenopause_duration ?? null
        },
        language
      },
      {
        onSuccess: (response) => {
          setPrediction(response);
          setSubmittedHash(formHash);
        }
      }
    );
  }

  const backendError = predictionMutation.error instanceof Error ? predictionMutation.error.message : undefined;
  const errorMessage = backendError
    ? t(`errors.${backendError}`, { defaultValue: t("errors.request_failed") })
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("osteorisk.title")}
        subtitle={t("osteorisk.subtitle")}
        actions={
          draftStatus && (
            <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
              <Clock size={15} aria-hidden className="text-teal-700" />
              {t(`osteorisk.draft.${draftStatus}`)}
            </span>
          )
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)]">
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <Section
            title={t("osteorisk.sections.patientContext")}
            description={t("osteorisk.sections.patientContextDescription")}
            icon={<UserRound size={20} aria-hidden />}
          >
            <Field
              label={t("osteorisk.fields.patientId")}
              required
              error={fieldError("patient_id")}
              hint={t("osteorisk.hints.patientId")}
            >
              <input className="form-input" autoComplete="off" {...register("patient_id")} />
            </Field>
          </Section>

          <Section
            title={t("osteorisk.sections.demography")}
            description={t("osteorisk.sections.demographyDescription")}
            icon={<Info size={20} aria-hidden />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t("osteorisk.fields.sex")} required error={fieldError("sex")}>
                <select className="form-input" {...register("sex")}>
                  <option value="female">{t("sex.female")}</option>
                  <option value="male">{t("sex.male")}</option>
                </select>
              </Field>
              <Field
                label={t("osteorisk.fields.age")}
                required
                error={fieldError("age")}
                hint={ageWarning ? t("osteorisk.warnings.ageRange") : t("osteorisk.hints.age")}
              >
                <input className="form-input" inputMode="numeric" min={1} max={120} type="number" {...register("age")} />
              </Field>
              <Field label={t("osteorisk.fields.height")} required error={fieldError("height_cm")}>
                <input
                  className="form-input"
                  inputMode="numeric"
                  min={140}
                  max={220}
                  type="number"
                  {...register("height_cm")}
                />
              </Field>
              <Field label={t("osteorisk.fields.weight")} required error={fieldError("weight_kg")}>
                <input
                  className="form-input"
                  inputMode="numeric"
                  min={40}
                  max={200}
                  type="number"
                  {...register("weight_kg")}
                />
              </Field>
              <Field label={t("osteorisk.fields.bmi")} hint={t("osteorisk.hints.bmi")}>
                <input
                  className="form-input bg-slate-50 font-semibold text-slate-700"
                  readOnly
                  value={bmi === null ? "" : bmi.toFixed(1)}
                />
              </Field>
            </div>
          </Section>

          <Section
            title={t("osteorisk.sections.diabetes")}
            description={t("osteorisk.sections.diabetesDescription")}
            icon={<Activity size={20} aria-hidden />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label={t("osteorisk.fields.diabetesDuration")}
                required
                error={fieldError("diabetes_duration")}
              >
                <select className="form-input" {...register("diabetes_duration")}>
                  {diabetesDurationOptions.map((option) => (
                    <option key={option} value={option}>
                      {t(`osteorisk.options.diabetesDuration.${option}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("osteorisk.fields.hba1c")} required error={fieldError("hba1c")}>
                <input className="form-input" inputMode="decimal" max={15} min={4} step={0.1} type="number" {...register("hba1c")} />
              </Field>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <CheckboxRow label={t("osteorisk.fields.polyneuropathy")} input={register("has_polyneuropathy")} />
              <CheckboxRow label={t("osteorisk.fields.retinopathy")} input={register("has_retinopathy")} />
              <CheckboxRow label={t("osteorisk.fields.nephropathy")} input={register("has_nephropathy")} />
            </div>
          </Section>

          {sex === "female" && (
            <div data-testid="menopause-section">
            <Section
              title={t("osteorisk.sections.menopause")}
              description={t("osteorisk.sections.menopauseDescription")}
              icon={<ShieldAlert size={20} aria-hidden />}
            >
              <div className="grid gap-4 md:grid-cols-3">
                <Field
                  label={t("osteorisk.fields.menopauseStatus")}
                  required
                  error={fieldError("menopause_status")}
                >
                  <select className="form-input" {...register("menopause_status")}>
                    {menopauseStatusOptions.map((option) => (
                      <option key={option} value={option}>
                        {t(`osteorisk.options.menopauseStatus.${option}`)}
                      </option>
                    ))}
                  </select>
                </Field>
                {menopauseStatus === "postmenopause" && (
                  <>
                    <Field
                      label={t("osteorisk.fields.menopauseOnsetAge")}
                      required
                      error={fieldError("menopause_onset_age")}
                    >
                      <input
                        className="form-input"
                        inputMode="numeric"
                        max={70}
                        min={30}
                        type="number"
                        {...register("menopause_onset_age")}
                      />
                    </Field>
                    <Field label={t("osteorisk.fields.postmenopauseDuration")} hint={t("osteorisk.hints.duration")}>
                      <input
                        className="form-input bg-slate-50 font-semibold text-slate-700"
                        data-testid="postmenopause-duration"
                        readOnly
                        value={postmenopauseDuration === null ? "" : postmenopauseDuration}
                      />
                    </Field>
                  </>
                )}
              </div>
            </Section>
            </div>
          )}

          <Section
            title={t("osteorisk.sections.labs")}
            description={t("osteorisk.sections.labsDescription")}
            icon={<FlaskConical size={20} aria-hidden />}
          >
            <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
              {t("osteorisk.hints.optionalLabs")}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label={t("osteorisk.fields.vitaminD")} error={fieldError("vitamin_d")}>
                <input className="form-input" inputMode="decimal" min={0} step={0.1} type="number" {...register("vitamin_d")} />
              </Field>
              <Field label={t("osteorisk.fields.pth")} error={fieldError("pth")}>
                <input className="form-input" inputMode="decimal" min={0} step={0.1} type="number" {...register("pth")} />
              </Field>
              <Field label={t("osteorisk.fields.alkalinePhosphatase")} error={fieldError("alkaline_phosphatase")}>
                <input className="form-input" inputMode="numeric" min={0} type="number" {...register("alkaline_phosphatase")} />
              </Field>
              <Field label={t("osteorisk.fields.totalCalcium")} error={fieldError("total_calcium")}>
                <input className="form-input" inputMode="decimal" min={0} step={0.01} type="number" {...register("total_calcium")} />
              </Field>
              <Field label={t("osteorisk.fields.egfr")} error={fieldError("egfr")}>
                <input className="form-input" inputMode="numeric" min={0} type="number" {...register("egfr")} />
              </Field>
            </div>
          </Section>

          <Section
            title={t("osteorisk.sections.functional")}
            description={t("osteorisk.sections.functionalDescription")}
            icon={<AlertCircle size={20} aria-hidden />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <CheckboxRow label={t("osteorisk.fields.falls")} input={register("falls_last_12_months")} />
              </div>
              <Field
                label={t("osteorisk.fields.tug")}
                error={fieldError("tug_seconds")}
                hint={highFallRisk ? t("osteorisk.warnings.highFallRisk") : t("osteorisk.tooltips.tug")}
              >
                <input
                  className={`form-input ${highFallRisk ? "border-amber-400 bg-amber-50 focus:border-amber-500 focus:ring-amber-100" : ""}`}
                  inputMode="decimal"
                  min={0}
                  step={0.1}
                  type="number"
                  {...register("tug_seconds")}
                />
              </Field>
              <Field label={t("osteorisk.fields.handGrip")} error={fieldError("hand_grip_kg")}>
                <input className="form-input" inputMode="decimal" min={0} step={0.1} type="number" {...register("hand_grip_kg")} />
              </Field>
            </div>
          </Section>

          <Section
            title={t("osteorisk.sections.densitometry")}
            description={t("osteorisk.sections.densitometryDescription")}
            icon={<CheckCircle2 size={20} aria-hidden />}
          >
            <Field label={t("osteorisk.fields.tScore")} error={fieldError("t_score")} hint={t("osteorisk.hints.tScore")}>
              <input className="form-input" inputMode="decimal" step={0.1} type="number" {...register("t_score")} />
            </Field>
          </Section>

          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800" data-testid="api-error-message">
              {errorMessage}
            </div>
          )}

          <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-200 bg-[#eef2f6]/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-lg sm:border sm:bg-white">
            <button className="primary-button w-full sm:w-auto" disabled={predictionMutation.isPending} type="submit">
              <Calculator size={18} aria-hidden />
              {predictionMutation.isPending ? t("osteorisk.actions.calculating") : t("osteorisk.actions.calculate")}
            </button>
          </div>
        </form>

        <ResultPanel prediction={prediction} outdated={isOutdated} isLoading={predictionMutation.isPending} />
      </div>
    </div>
  );
}
