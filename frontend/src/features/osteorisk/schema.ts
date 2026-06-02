import type { TFunction } from "i18next";
import { z } from "zod";

const optionalNumber = (message: string) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
    z.number().min(0, message).optional()
  );

const optionalInteger = (message: string) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
    z.number().int(message).min(0, message).optional()
  );

export const createOsteoRiskSchema = (t: TFunction) =>
  z
    .object({
      patient_id: z.string().min(2, t("validation.required")).max(120, t("validation.max")),
      sex: z.enum(["female", "male"]),
      age: z.coerce.number().int(t("osteorisk.validation.integer")).min(1, t("osteorisk.validation.ageMax")).max(120, t("osteorisk.validation.ageMax")),
      height_cm: z.coerce.number().int(t("osteorisk.validation.integer")).min(140, t("osteorisk.validation.height")).max(220, t("osteorisk.validation.height")),
      weight_kg: z.coerce.number().int(t("osteorisk.validation.integer")).min(40, t("osteorisk.validation.weight")).max(200, t("osteorisk.validation.weight")),
      diabetes_duration: z.enum(["lt_5", "between_5_10", "gt_10"], { required_error: t("validation.required") }),
      hba1c: z.coerce.number().min(4, t("osteorisk.validation.hba1c")).max(15, t("osteorisk.validation.hba1c")),
      has_polyneuropathy: z.boolean().default(false),
      has_retinopathy: z.boolean().default(false),
      has_nephropathy: z.boolean().default(false),
      menopause_status: z.enum(["premenopause", "perimenopause", "postmenopause"]).nullable().optional(),
      menopause_onset_age: z.preprocess(
        (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
        z.number().int(t("osteorisk.validation.integer")).min(30, t("osteorisk.validation.menopauseOnset")).max(70, t("osteorisk.validation.menopauseOnset")).optional()
      ),
      vitamin_d: optionalNumber(t("osteorisk.validation.nonNegative")),
      pth: optionalNumber(t("osteorisk.validation.nonNegative")),
      alkaline_phosphatase: optionalInteger(t("osteorisk.validation.nonNegative")),
      total_calcium: optionalNumber(t("osteorisk.validation.nonNegative")),
      egfr: optionalInteger(t("osteorisk.validation.nonNegative")),
      falls_last_12_months: z.boolean().default(false),
      tug_seconds: optionalNumber(t("osteorisk.validation.nonNegative")),
      hand_grip_kg: optionalNumber(t("osteorisk.validation.nonNegative")),
      t_score: z.preprocess(
        (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
        z.number().optional()
      )
    })
    .superRefine((values, ctx) => {
      if (values.sex === "female" && !values.menopause_status) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["menopause_status"],
          message: t("validation.required")
        });
      }
      if (values.sex === "female" && values.menopause_status === "postmenopause") {
        if (values.menopause_onset_age === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["menopause_onset_age"],
            message: t("validation.required")
          });
        } else if (values.menopause_onset_age > values.age) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["menopause_onset_age"],
            message: t("osteorisk.validation.menopauseAfterAge")
          });
        }
      }
    });

export type OsteoRiskFormData = z.infer<ReturnType<typeof createOsteoRiskSchema>>;
