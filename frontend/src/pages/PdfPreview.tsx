import { useMutation, useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { getMe } from "../api/auth";
import { getPatient } from "../api/patients";
import { exportScreeningPdf, getScreening } from "../api/screenings";
import RiskBadge from "../components/RiskBadge";
import PageHeader from "../components/ui/PageHeader";
import Panel from "../components/ui/Panel";

export default function PdfPreview() {
  const { t } = useTranslation();
  const { screeningId } = useParams<{ screeningId: string }>();
  const screeningQuery = useQuery({
    queryKey: ["screening", screeningId],
    queryFn: () => getScreening(screeningId!),
    enabled: Boolean(screeningId)
  });
  const patientQuery = useQuery({
    queryKey: ["patient", screeningQuery.data?.patient_id],
    queryFn: () => getPatient(screeningQuery.data!.patient_id),
    enabled: Boolean(screeningQuery.data?.patient_id)
  });
  const exportMutation = useMutation({ mutationFn: () => exportScreeningPdf(screeningId!) });
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });

  if (screeningQuery.isLoading || patientQuery.isLoading) {
    return <p className="text-sm text-slate-500">{t("common.loading")}</p>;
  }

  const screening = screeningQuery.data;
  const patient = patientQuery.data;

  if (!screening || !patient) {
    return <p className="text-sm text-red-700">{t("patients.noHistory")}</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("pdf.title")}
        subtitle={t("pdf.subtitle")}
        actions={
          <button className="primary-button" type="button" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
            <Download size={17} aria-hidden />
            {t("pdf.download")}
          </button>
        }
      />
      {exportMutation.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {t(`errors.${exportMutation.error.message}`, { defaultValue: t("errors.request_failed") })}
        </p>
      )}

      <Panel>
        <article className="mx-auto max-w-4xl space-y-6 rounded-md bg-white p-4 text-sm leading-6 text-slate-800 md:p-8">
          <header className="border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-bold text-teal-800">{t("app.name")}</h2>
            <p className="mt-1 text-slate-500">
              {t("pdf.generatedAt")}: {new Date(screening.created_at).toLocaleString()}
            </p>
            <p className="text-slate-500">
              {t("pdf.doctor")}: {meQuery.data?.full_name ?? t("common.notProvided")}
            </p>
          </header>

          <section>
            <h3 className="mb-3 text-base font-bold text-slate-950">{t("pdf.patientInfo")}</h3>
            <dl className="grid gap-3 md:grid-cols-2">
              <div><dt className="text-slate-500">{t("fields.lastName")}</dt><dd className="font-semibold">{patient.last_name}</dd></div>
              <div><dt className="text-slate-500">{t("fields.firstName")}</dt><dd className="font-semibold">{patient.first_name}</dd></div>
              <div><dt className="text-slate-500">{t("fields.medicalRecordNumber")}</dt><dd className="font-semibold">{patient.medical_record_number ?? t("common.notProvided")}</dd></div>
              <div><dt className="text-slate-500">{t("fields.sex")}</dt><dd className="font-semibold">{t(`sex.${patient.sex}`)}</dd></div>
            </dl>
          </section>

          <section>
            <h3 className="mb-3 text-base font-bold text-slate-950">{t("pdf.clinicalData")}</h3>
            <dl className="grid gap-3 md:grid-cols-2">
              <div><dt className="text-slate-500">{t("fields.age")}</dt><dd className="font-semibold">{screening.age}</dd></div>
              <div><dt className="text-slate-500">{t("fields.hba1c")}</dt><dd className="font-semibold">{screening.hba1c_percent}%</dd></div>
              <div><dt className="text-slate-500">{t("fields.diabetesDuration")}</dt><dd className="font-semibold">{screening.diabetes_duration_years}</dd></div>
              <div><dt className="text-slate-500">{t("fields.previousLowEnergyFractures")}</dt><dd className="font-semibold">{screening.previous_low_energy_fractures ? t("common.yes") : t("common.no")}</dd></div>
              <div><dt className="text-slate-500">{t("fields.previousMi")}</dt><dd className="font-semibold">{screening.previous_myocardial_infarction ? t("common.yes") : t("common.no")}</dd></div>
              <div><dt className="text-slate-500">{t("fields.previousStroke")}</dt><dd className="font-semibold">{screening.previous_stroke ? t("common.yes") : t("common.no")}</dd></div>
              <div><dt className="text-slate-500">{t("fields.bmi")}</dt><dd className="font-semibold">{screening.bmi ?? t("common.notProvided")}</dd></div>
              <div><dt className="text-slate-500">{t("fields.egfr")}</dt><dd className="font-semibold">{screening.egfr ?? t("common.notProvided")}</dd></div>
              <div><dt className="text-slate-500">{t("fields.creatinine")}</dt><dd className="font-semibold">{screening.creatinine_umol_l ?? t("common.notProvided")}</dd></div>
              <div><dt className="text-slate-500">{t("fields.boneMarkers")}</dt><dd className="font-semibold">{screening.bone_metabolism_markers ? JSON.stringify(screening.bone_metabolism_markers) : t("common.notProvided")}</dd></div>
            </dl>
          </section>

          <section>
            <h3 className="mb-3 text-base font-bold text-slate-950">{t("pdf.riskScores")}</h3>
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-md border border-slate-200 p-3"><p className="text-slate-500">{t("risk.total")}</p><p className="text-2xl font-bold text-teal-800">{screening.total_risk}</p></div>
              <div className="rounded-md border border-slate-200 p-3"><p className="text-slate-500">{t("risk.vascular")}</p><p className="text-2xl font-bold text-blue-700">{screening.vascular_risk}</p></div>
              <div className="rounded-md border border-slate-200 p-3"><p className="text-slate-500">{t("risk.skeletal")}</p><p className="text-2xl font-bold text-violet-700">{screening.skeletal_risk}</p></div>
              <div className="rounded-md border border-slate-200 p-3"><p className="text-slate-500">{t("risk.category")}</p><div className="mt-2"><RiskBadge category={screening.risk_category} /></div></div>
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-base font-bold text-slate-950">{t("pdf.recommendations")}</h3>
            <ul className="list-disc space-y-2 pl-5">
              {screening.recommendation_items.map((item) => (
                <li key={item}>{t(`recommendations.${item}`, { defaultValue: item })}</li>
              ))}
            </ul>
          </section>

          <footer className="rounded-md border border-amber-200 bg-amber-50 p-3 text-amber-900">
            {t("pdf.disclaimer")} {t("app.mvpNotice")}
          </footer>
        </article>
      </Panel>
    </div>
  );
}
