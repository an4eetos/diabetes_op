import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Calculator, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { getPatient } from "../api/patients";
import { createScreening } from "../api/screenings";
import Field from "../components/ui/Field";
import PageHeader from "../components/ui/PageHeader";
import Panel from "../components/ui/Panel";
import { createScreeningSchema, type ScreeningFormData } from "../schemas/screening";

const defaultValues = {
  age: 55,
  sex: "female",
  diabetes_duration_years: 5,
  hba1c_percent: 7,
  bmi: undefined,
  egfr: undefined,
  creatinine_umol_l: undefined,
  bone_metabolism_markers: ""
} satisfies Partial<ScreeningFormData>;

function calculateAge(dateOfBirth?: string | null): number | undefined {
  if (!dateOfBirth) return undefined;
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) age -= 1;
  return Number.isFinite(age) ? age : undefined;
}

export default function NewScreening() {
  const { t } = useTranslation();
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [draftStatus, setDraftStatus] = useState<string | null>(null);
  const initialized = useRef(false);
  const screeningSchema = useMemo(() => createScreeningSchema(t), [t]);
  const draftKey = `oas_screening_draft_${patientId ?? "new"}`;

  const patientQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => getPatient(patientId!),
    enabled: Boolean(patientId)
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ScreeningFormData>({
    resolver: zodResolver(screeningSchema),
    defaultValues
  });

  useEffect(() => {
    if (!patientQuery.data || initialized.current) return;
    const savedDraft = localStorage.getItem(draftKey);
    const patientDefaults = {
      ...defaultValues,
      sex: patientQuery.data.sex,
      age: calculateAge(patientQuery.data.date_of_birth) ?? defaultValues.age
    };
    if (savedDraft) {
      reset({ ...patientDefaults, ...JSON.parse(savedDraft) });
      setDraftStatus(t("screening.draftRestored"));
    } else {
      reset(patientDefaults);
    }
    initialized.current = true;
  }, [draftKey, patientQuery.data, reset, t]);

  useEffect(() => {
    const subscription = watch((values) => {
      localStorage.setItem(draftKey, JSON.stringify(values));
      setDraftStatus(t("screening.draftSaved"));
    });
    return () => subscription.unsubscribe();
  }, [draftKey, t, watch]);

  const createMutation = useMutation({
    mutationFn: (values: ScreeningFormData) => createScreening(patientId!, values),
    onSuccess: (screening) => {
      localStorage.removeItem(draftKey);
      navigate(`/screenings/${screening.id}`);
    }
  });

  const hba1c = watch("hba1c_percent");
  const duration = watch("diabetes_duration_years");
  const optionalValues = watch(["bmi", "egfr", "creatinine_umol_l", "bone_metabolism_markers"]);
  const missingOptionalCount = optionalValues.filter((value) => value === undefined || value === "").length;
  const answerOptions = [
    { value: "no", label: t("common.no") },
    { value: "yes", label: t("common.yes") }
  ] as const;

  function historyControl(name: keyof Pick<ScreeningFormData, "previous_myocardial_infarction_answer" | "previous_stroke_answer" | "previous_low_energy_fractures_answer">) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {answerOptions.map((option) => (
          <label
            className="flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:checked]:text-teal-900"
            key={option.value}
          >
            <input className="h-4 w-4 accent-teal-700" type="radio" value={option.value} {...register(name)} />
            {option.label}
          </label>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("screening.newTitle")}
        subtitle={
          patientQuery.data
            ? `${patientQuery.data.last_name} ${patientQuery.data.first_name}`
            : t("screening.patientProfile")
        }
        actions={
          draftStatus ? (
            <span className="inline-flex items-center gap-2 rounded-md bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800">
              <CheckCircle2 size={16} aria-hidden />
              {draftStatus}
            </span>
          ) : null
        }
      />

      <form className="space-y-5" onSubmit={handleSubmit((values) => createMutation.mutate(values))}>
        <Panel title={t("screening.sections.patientBasics")}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t("fields.age")} required error={errors.age?.message}>
              <input className="form-input" type="number" min={18} max={120} {...register("age")} />
            </Field>
            <Field label={t("fields.sex")} required>
              <select className="form-input" {...register("sex")}>
                <option value="female">{t("sex.female")}</option>
                <option value="male">{t("sex.male")}</option>
                <option value="other">{t("sex.other")}</option>
              </select>
            </Field>
          </div>
        </Panel>

        <Panel title={t("screening.sections.diabetesHistory")}>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label={`${t("fields.diabetesDuration")}: ${duration} ${t("common.years")}`} required error={errors.diabetes_duration_years?.message}>
              <input
                className="w-full accent-teal-700"
                type="range"
                min={0}
                max={50}
                step={1}
                value={duration}
                onChange={(event) =>
                  setValue("diabetes_duration_years", Number(event.target.value), { shouldValidate: true })
                }
              />
            </Field>
            <Field label={`${t("fields.hba1c")}: ${hba1c}%`} required error={errors.hba1c_percent?.message}>
              <input
                className="w-full accent-teal-700"
                type="range"
                min={3}
                max={18}
                step={0.1}
                value={hba1c}
                onChange={(event) => setValue("hba1c_percent", Number(event.target.value), { shouldValidate: true })}
              />
            </Field>
          </div>
        </Panel>

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel title={t("screening.sections.cardiovascularHistory")}>
            <div className="space-y-3">
              <Field
                label={t("fields.previousMi")}
                required
                error={errors.previous_myocardial_infarction_answer?.message}
                hint={t("screening.historyRequiredHint")}
              >
                {historyControl("previous_myocardial_infarction_answer")}
              </Field>
              <Field
                label={t("fields.previousStroke")}
                required
                error={errors.previous_stroke_answer?.message}
                hint={t("screening.historyRequiredHint")}
              >
                {historyControl("previous_stroke_answer")}
              </Field>
            </div>
          </Panel>

          <Panel title={t("screening.sections.boneHealthHistory")}>
            <div className="space-y-3">
              <Field
                label={t("fields.previousLowEnergyFractures")}
                required
                error={errors.previous_low_energy_fractures_answer?.message}
                hint={t("screening.historyRequiredHint")}
              >
                {historyControl("previous_low_energy_fractures_answer")}
              </Field>
              <Field label={t("fields.boneMarkers")} hint={t("screening.optionalHint")}>
                <input className="form-input" {...register("bone_metabolism_markers")} />
              </Field>
            </div>
          </Panel>
        </div>

        <Panel
          title={t("screening.sections.laboratoryData")}
          description={missingOptionalCount ? t("common.missingOptional") : undefined}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={t("fields.bmi")} error={errors.bmi?.message} hint={t("screening.optionalHint")}>
              <input className="form-input" type="number" min={10} max={80} step={0.1} {...register("bmi")} />
            </Field>
            <Field label={t("fields.egfr")} error={errors.egfr?.message} hint={t("screening.optionalHint")}>
              <input className="form-input" type="number" min={0} max={200} step={0.1} {...register("egfr")} />
            </Field>
            <Field label={t("fields.creatinine")} error={errors.creatinine_umol_l?.message} hint={t("screening.optionalHint")}>
              <input className="form-input" type="number" min={10} max={1500} step={0.1} {...register("creatinine_umol_l")} />
            </Field>
          </div>
        </Panel>

        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          {t("app.mvpNotice")}
        </section>

        {createMutation.error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
            {createMutation.error.message}
          </p>
        )}

        <div className="sticky bottom-0 flex justify-end border-t border-slate-200 bg-slate-100/90 py-3 backdrop-blur">
          <button className="primary-button min-w-44" type="submit" disabled={createMutation.isPending}>
            <Calculator size={17} aria-hidden />
            {t("screening.calculate")}
          </button>
        </div>
      </form>
    </div>
  );
}
