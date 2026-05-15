import type { TFunction } from "i18next";
import { z } from "zod";

const optionalNumber = (min: number, max: number, message: string) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
    z.number().min(min, message).max(max, message).optional()
  );

export const createScreeningSchema = (t: TFunction) =>
  z.object({
    age: z.coerce.number().int().min(18, t("validation.age")).max(120, t("validation.age")),
    sex: z.enum(["female", "male", "other"]),
    diabetes_duration_years: z.coerce
      .number()
      .min(0, t("validation.duration"))
      .max(80, t("validation.duration")),
    hba1c_percent: z.coerce.number().min(3, t("validation.hba1c")).max(18, t("validation.hba1c")),
    previous_low_energy_fractures_answer: z.enum(["yes", "no"], { required_error: t("validation.required") }),
    previous_myocardial_infarction_answer: z.enum(["yes", "no"], { required_error: t("validation.required") }),
    previous_stroke_answer: z.enum(["yes", "no"], { required_error: t("validation.required") }),
    bmi: optionalNumber(10, 80, t("validation.bmi")),
    egfr: optionalNumber(0, 200, t("validation.egfr")),
    creatinine_umol_l: optionalNumber(10, 1500, t("validation.creatinine")),
    bone_metabolism_markers: z.string().max(1000, t("validation.max")).optional().or(z.literal(""))
  });

export type ScreeningFormData = z.infer<ReturnType<typeof createScreeningSchema>>;
