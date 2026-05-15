import { useQuery } from "@tanstack/react-query";
import { ClipboardPlus, UsersRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { listPatients } from "../api/patients";
import PageHeader from "../components/ui/PageHeader";
import Panel from "../components/ui/Panel";
import StatTile from "../components/ui/StatTile";

export default function Dashboard() {
  const { t } = useTranslation();
  const patientsQuery = useQuery({ queryKey: ["patients", ""], queryFn: () => listPatients() });
  const patients = patientsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
        actions={
          <Link className="primary-button" to="/patients">
            <UsersRound size={17} aria-hidden />
            {t("dashboard.registry")}
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatTile label={t("dashboard.patients")} value={patients.length} />
        <StatTile label={t("risk.algorithm")} value={t("common.placeholder")} tone="yellow" />
        <StatTile label={t("dashboard.pdfProtocol")} value={t("common.enabled")} tone="green" />
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        {t("app.mvpNotice")}
      </section>

      <Panel
        title={t("dashboard.recentPatients")}
        actions={<ClipboardPlus className="text-teal-700" size={20} aria-hidden />}
      >
        <div className="divide-y divide-slate-100">
          {patients.slice(0, 6).map((patient) => (
            <Link
              className="flex items-center justify-between py-3 text-sm hover:bg-slate-50"
              key={patient.id}
              to={`/patients/${patient.id}`}
            >
              <span className="font-semibold text-slate-900">
                {patient.last_name} {patient.first_name}
              </span>
              <span className="text-slate-500">{patient.medical_record_number ?? t("patients.noMrn")}</span>
            </Link>
          ))}
          {!patients.length && <p className="py-3 text-sm text-slate-500">{t("dashboard.emptyPatients")}</p>}
        </div>
      </Panel>
    </div>
  );
}
