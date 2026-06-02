import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { createPatient, listPatients } from "../api/patients";
import Field from "../components/ui/Field";
import Panel from "../components/ui/Panel";
import { createPatientSchema, type PatientFormData } from "../schemas/patient";
import type { Patient } from "../types";

const patientFormDefaults: PatientFormData = {
  sex: "female",
  medical_record_number: "",
  first_name: "",
  last_name: "",
  middle_name: "",
  date_of_birth: "",
  menopause_status: "unknown",
  phone: "",
  notes: ""
};

function patientDisplayName(patient: Patient): string {
  return [patient.last_name, patient.first_name].filter(Boolean).join(" ") || patient.patient_external_id || patient.id;
}

export default function PatientList() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const patientSchema = useMemo(() => createPatientSchema(t), [t]);
  const patientsQuery = useQuery({
    queryKey: ["patients", search],
    queryFn: () => listPatients(search)
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: patientFormDefaults
  });
  const selectedSex = watch("sex");
  const selectedMenopauseStatus = watch("menopause_status");

  useEffect(() => {
    if (selectedSex !== "female") {
      setValue("menopause_status", null);
    } else if (!selectedMenopauseStatus) {
      setValue("menopause_status", "unknown");
    }
  }, [selectedMenopauseStatus, selectedSex, setValue]);

  const createMutation = useMutation({
    mutationFn: createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      reset(patientFormDefaults);
    }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <Panel
        title={t("patients.create")}
        actions={<Plus className="text-teal-700" size={20} aria-hidden />}
      >
        <form className="space-y-3" onSubmit={handleSubmit((values) => createMutation.mutate(values))}>
          <Field label={t("fields.medicalRecordNumber")}>
            <input className="form-input" {...register("medical_record_number")} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Field label={t("fields.lastName")} required error={errors.last_name?.message}>
              <input className="form-input" {...register("last_name")} />
            </Field>
            <Field label={t("fields.firstName")} required error={errors.first_name?.message}>
              <input className="form-input" {...register("first_name")} />
            </Field>
          </div>
          <Field label={t("fields.middleName")}>
            <input className="form-input" {...register("middle_name")} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Field label={t("fields.dateOfBirth")}>
              <input className="form-input" type="date" {...register("date_of_birth")} />
            </Field>
            <Field label={t("fields.sex")} required>
              <select className="form-input" {...register("sex")}>
                <option value="female">{t("sex.female")}</option>
                <option value="male">{t("sex.male")}</option>
                <option value="other">{t("sex.other")}</option>
              </select>
            </Field>
            {selectedSex === "female" && (
              <Field label={t("fields.menopauseStatus")}>
                <select className="form-input" {...register("menopause_status")}>
                  <option value="unknown">{t("menopauseStatus.unknown")}</option>
                  <option value="yes">{t("menopauseStatus.yes")}</option>
                  <option value="no">{t("menopauseStatus.no")}</option>
                </select>
              </Field>
            )}
          </div>
          <Field label={t("fields.phone")}>
            <input className="form-input" {...register("phone")} />
          </Field>
          <Field label={t("fields.notes")}>
            <textarea className="form-input min-h-20" {...register("notes")} />
          </Field>
          {createMutation.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {t(`errors.${createMutation.error.message}`, { defaultValue: t("errors.request_failed") })}
            </p>
          )}
          <button className="primary-button w-full" type="submit" disabled={createMutation.isPending}>
            {t("patients.create")}
          </button>
        </form>
      </Panel>

      <Panel title={t("patients.registry")} description={t("patients.searchHelp")}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <label className="relative block w-full max-w-sm">
            <Search className="absolute left-3 top-3 text-slate-400" size={16} aria-hidden />
            <input
              className="form-input mt-0 pl-9"
              placeholder={t("common.search")}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        <div className="overflow-hidden rounded-md border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">{t("patients.table.patient")}</th>
                <th className="px-4 py-3">{t("patients.table.mrn")}</th>
                <th className="px-4 py-3">{t("patients.table.sex")}</th>
                <th className="px-4 py-3">{t("common.updated")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(patientsQuery.data ?? []).map((patient) => (
                <tr className="hover:bg-slate-50" key={patient.id}>
                  <td className="px-4 py-3">
                    <Link className="font-semibold text-teal-800 hover:underline" to={`/patients/${patient.id}`}>
                      {patientDisplayName(patient)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{patient.medical_record_number ?? t("common.notProvided")}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {patient.sex ? t(`sex.${patient.sex}`) : t("common.notProvided")}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{new Date(patient.updated_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {!patientsQuery.isLoading && !(patientsQuery.data ?? []).length && (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-500" colSpan={4}>
                    {t("patients.empty")}
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
