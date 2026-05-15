import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardPlus, Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import { getPatient, listPatientScreenings, updatePatient } from "../api/patients";
import RiskBadge from "../components/RiskBadge";
import Field from "../components/ui/Field";
import PageHeader from "../components/ui/PageHeader";
import Panel from "../components/ui/Panel";
import { createPatientSchema, type PatientFormData } from "../schemas/patient";

export default function PatientProfile() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const patientSchema = useMemo(() => createPatientSchema(t), [t]);
  const { patientId } = useParams<{ patientId: string }>();
  const patientQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: () => getPatient(patientId!),
    enabled: Boolean(patientId)
  });
  const screeningsQuery = useQuery({
    queryKey: ["patient-screenings", patientId],
    queryFn: () => listPatientScreenings(patientId!),
    enabled: Boolean(patientId)
  });
  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      medical_record_number: "",
      first_name: "",
      last_name: "",
      middle_name: "",
      date_of_birth: "",
      sex: "female",
      phone: "",
      notes: ""
    }
  });
  const updateMutation = useMutation({
    mutationFn: (values: PatientFormData) => updatePatient(patientId!, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      await queryClient.invalidateQueries({ queryKey: ["patients"] });
      setIsEditing(false);
    }
  });

  useEffect(() => {
    const patient = patientQuery.data;
    if (!patient) {
      return;
    }
    form.reset({
      medical_record_number: patient.medical_record_number ?? "",
      first_name: patient.first_name,
      last_name: patient.last_name,
      middle_name: patient.middle_name ?? "",
      date_of_birth: patient.date_of_birth ?? "",
      sex: patient.sex,
      phone: patient.phone ?? "",
      notes: patient.notes ?? ""
    });
  }, [form, patientQuery.data]);

  if (patientQuery.isLoading) {
    return <p className="text-sm text-slate-500">{t("common.loading")}</p>;
  }

  if (!patientQuery.data) {
    return <p className="text-sm text-red-700">{t("patients.empty")}</p>;
  }

  const patient = patientQuery.data;
  const screenings = screeningsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${patient.last_name} ${patient.first_name}`}
        subtitle={patient.medical_record_number ?? t("patients.noMrn")}
        actions={
          <Link className="primary-button" to={`/patients/${patient.id}/screenings/new`}>
            <ClipboardPlus size={17} aria-hidden />
            {t("patients.newScreening")}
          </Link>
        }
      />

      <Panel
        title={t("patients.profile")}
        actions={
          <button className="secondary-button" type="button" onClick={() => setIsEditing((value) => !value)}>
            <Pencil size={16} aria-hidden />
            {t("patients.edit")}
          </button>
        }
      >
        {isEditing ? (
          <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}>
            <Field label={t("fields.medicalRecordNumber")}>
              <input className="form-input" {...form.register("medical_record_number")} />
            </Field>
            <Field label={t("fields.sex")} required>
              <select className="form-input" {...form.register("sex")}>
                <option value="female">{t("sex.female")}</option>
                <option value="male">{t("sex.male")}</option>
                <option value="other">{t("sex.other")}</option>
              </select>
            </Field>
            <Field label={t("fields.lastName")} required error={form.formState.errors.last_name?.message}>
              <input className="form-input" {...form.register("last_name")} />
            </Field>
            <Field label={t("fields.firstName")} required error={form.formState.errors.first_name?.message}>
              <input className="form-input" {...form.register("first_name")} />
            </Field>
            <Field label={t("fields.middleName")}>
              <input className="form-input" {...form.register("middle_name")} />
            </Field>
            <Field label={t("fields.dateOfBirth")}>
              <input className="form-input" type="date" {...form.register("date_of_birth")} />
            </Field>
            <Field label={t("fields.phone")}>
              <input className="form-input" {...form.register("phone")} />
            </Field>
            <Field label={t("fields.notes")}>
              <textarea className="form-input min-h-20" {...form.register("notes")} />
            </Field>
            {updateMutation.error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 md:col-span-2">
                {updateMutation.error.message}
              </p>
            )}
            <div className="flex justify-end gap-2 md:col-span-2">
              <button className="secondary-button" type="button" onClick={() => setIsEditing(false)}>
                {t("common.cancel")}
              </button>
              <button className="primary-button" type="submit" disabled={updateMutation.isPending}>
                {t("patients.update")}
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="font-medium text-slate-500">{t("fields.sex")}</dt>
              <dd className="mt-1 font-semibold text-slate-900">{t(`sex.${patient.sex}`)}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">{t("fields.dateOfBirth")}</dt>
              <dd className="mt-1 font-semibold text-slate-900">{patient.date_of_birth ?? t("common.notProvided")}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">{t("fields.phone")}</dt>
              <dd className="mt-1 font-semibold text-slate-900">{patient.phone ?? t("common.notProvided")}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">{t("common.updated")}</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {new Date(patient.updated_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        )}
      </Panel>

      <Panel title={t("patients.history")}>
        <div className="overflow-hidden rounded-md border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">{t("common.date")}</th>
                <th className="px-4 py-3">{t("common.category")}</th>
                <th className="px-4 py-3">{t("risk.total")}</th>
                <th className="px-4 py-3">{t("risk.vascular")}</th>
                <th className="px-4 py-3">{t("risk.skeletal")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {screenings.map((screening) => (
                <tr className="hover:bg-slate-50" key={screening.id}>
                  <td className="px-4 py-3">
                    <Link className="font-semibold text-teal-800 hover:underline" to={`/screenings/${screening.id}`}>
                      {new Date(screening.created_at).toLocaleString()}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge category={screening.risk_category} />
                  </td>
                  <td className="px-4 py-3">{screening.total_risk}</td>
                  <td className="px-4 py-3">{screening.vascular_risk}</td>
                  <td className="px-4 py-3">{screening.skeletal_risk}</td>
                </tr>
              ))}
              {!screenings.length && (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                    {t("patients.noHistory")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
