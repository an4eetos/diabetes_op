import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, FileSearch, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import { exportScreeningPdf, getScreening } from "../api/screenings";
import RiskBadge from "../components/RiskBadge";
import ScoreChart from "../components/ScoreChart";
import TrafficLight from "../components/TrafficLight";
import PageHeader from "../components/ui/PageHeader";
import Panel from "../components/ui/Panel";
import StatTile from "../components/ui/StatTile";

export default function ScreeningResult() {
  const { t } = useTranslation();
  const { screeningId } = useParams<{ screeningId: string }>();
  const screeningQuery = useQuery({
    queryKey: ["screening", screeningId],
    queryFn: () => getScreening(screeningId!),
    enabled: Boolean(screeningId)
  });
  const exportMutation = useMutation({
    mutationFn: () => exportScreeningPdf(screeningId!)
  });

  if (screeningQuery.isLoading) {
    return <p className="text-sm text-slate-500">{t("common.loading")}</p>;
  }

  if (!screeningQuery.data) {
    return <p className="text-sm text-red-700">{t("patients.noHistory")}</p>;
  }

  const screening = screeningQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("result.title")}
        subtitle={new Date(screening.created_at).toLocaleString()}
        actions={
          <>
            <Link className="secondary-button" to={`/screenings/${screening.id}/pdf-preview`}>
              <FileSearch size={17} aria-hidden />
              {t("result.pdfPreview")}
            </Link>
            <button className="primary-button" type="button" onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending}>
              <Download size={17} aria-hidden />
              {t("result.exportPdf")}
            </button>
          </>
        }
      />
      {exportMutation.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {t(`errors.${exportMutation.error.message}`, { defaultValue: t("errors.request_failed") })}
        </p>
      )}

      <Panel>
        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-bold uppercase text-slate-500">{t("result.fiveSecond")}</p>
            <div className="mt-4 flex items-center gap-3">
              <TrafficLight category={screening.risk_category} />
              <RiskBadge category={screening.risk_category} />
            </div>
            <p className="mt-4 text-lg font-bold leading-7 text-slate-950">
              {t(`risk.summary.${screening.risk_category}`)}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <StatTile label={t("risk.total")} value={screening.total_risk} tone="green" />
            <StatTile label={t("risk.vascular")} value={screening.vascular_risk} tone="blue" />
            <StatTile label={t("risk.skeletal")} value={screening.skeletal_risk} tone="violet" />
          </div>
        </div>
        <div className="mt-5">
          <ScoreChart
            total={screening.total_risk}
            vascular={screening.vascular_risk}
            skeletal={screening.skeletal_risk}
          />
        </div>
      </Panel>

      <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <Panel
          title={t("result.recommendations")}
          actions={<FileText className="text-teal-700" size={20} aria-hidden />}
        >
          <ul className="space-y-3 text-sm leading-6 text-slate-700">
            {screening.recommendation_items.map((item) => (
              <li className="rounded-md bg-slate-50 px-3 py-2" key={item}>
                {t(`recommendations.${item}`, { defaultValue: item })}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={t("result.inputSummary")}>
          <dl className="space-y-3 text-sm">
            {[
              [t("fields.age"), screening.age],
              [t("fields.hba1c"), `${screening.hba1c_percent}%`],
              [t("fields.diabetesDuration"), `${screening.diabetes_duration_years} ${t("common.years")}`],
              [t("fields.previousLowEnergyFractures"), screening.previous_low_energy_fractures ? t("common.yes") : t("common.no")],
              [t("fields.previousMi"), screening.previous_myocardial_infarction ? t("common.yes") : t("common.no")],
              [t("fields.previousStroke"), screening.previous_stroke ? t("common.yes") : t("common.no")]
            ].map(([label, value]) => (
              <div className="flex justify-between gap-4" key={label}>
                <dt className="text-slate-500">{label}</dt>
                <dd className="text-right font-semibold text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        {t("app.mvpNotice")}
      </section>
    </div>
  );
}
