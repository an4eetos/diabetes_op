import type { TFunction } from "i18next";
import { z } from "zod";

export const createPatientSchema = (t: TFunction) =>
  z.object({
    medical_record_number: z.string().max(80, t("validation.max")).optional().or(z.literal("")),
    first_name: z.string().min(1, t("validation.required")).max(120, t("validation.max")),
    last_name: z.string().min(1, t("validation.required")).max(120, t("validation.max")),
    middle_name: z.string().max(120, t("validation.max")).optional().or(z.literal("")),
    date_of_birth: z.string().optional().or(z.literal("")),
    sex: z.enum(["female", "male", "other"]),
    phone: z.string().max(60, t("validation.max")).optional().or(z.literal("")),
    notes: z.string().max(2000, t("validation.max")).optional().or(z.literal(""))
  });

export type PatientFormData = z.infer<ReturnType<typeof createPatientSchema>>;
