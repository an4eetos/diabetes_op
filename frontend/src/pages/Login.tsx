import { zodResolver } from "@hookform/resolvers/zod";
import { Activity } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { login } from "../api/auth";
import LanguageSwitcher from "../components/LanguageSwitcher";

type LoginForm = {
  email: string;
  password: string;
};

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("auth.validation.email")),
        password: z.string().min(8, t("auth.validation.password"))
      }),
    [t]
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "admin@example.com", password: "ChangeMe123!" }
  });

  async function onSubmit(values: LoginForm) {
    setError(null);
    try {
      await login(values.email, values.password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.loginFailed"));
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-teal-700 text-white">
            <Activity size={22} aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{t("app.name")}</h1>
            <p className="text-sm text-slate-500">{t("app.secureWorkspace")}</p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <label className="block">
            <span className="form-label">{t("auth.email")}</span>
            <input className="form-input" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </label>
          <label className="block">
            <span className="form-label">{t("auth.password")}</span>
            <input className="form-input" type="password" autoComplete="current-password" {...register("password")} />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </label>
          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
          <button className="primary-button w-full" type="submit" disabled={isSubmitting}>
            {t("auth.signIn")}
          </button>
        </form>
      </section>
    </main>
  );
}
