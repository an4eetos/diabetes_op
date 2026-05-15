import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export default function Field({ label, required = false, error, hint, children }: FieldProps) {
  const { t } = useTranslation();
  const generatedId = useId();
  const inputId = `field-${generatedId}`;
  const descriptionId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [errorId, descriptionId].filter(Boolean).join(" ") || undefined;
  const control =
    isValidElement(children)
      ? cloneElement(children as ReactElement<Record<string, unknown>>, {
          id: inputId,
          "aria-invalid": Boolean(error),
          "aria-describedby": describedBy
        })
      : children;

  return (
    <label className="block min-w-0" htmlFor={inputId}>
      <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
        <span>{label}</span>
        <span
          className={`rounded px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-normal ${
            required ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-500"
          }`}
        >
          {required ? t("common.required") : t("common.optional")}
        </span>
      </span>
      <div className="mt-1">{control}</div>
      {hint && !error && (
        <p className="mt-1 text-xs leading-5 text-slate-500" id={descriptionId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="mt-1 text-xs font-semibold leading-5 text-red-700" id={errorId}>
          {error}
        </p>
      )}
    </label>
  );
}
