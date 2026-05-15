import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldPlus } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { createUser, listUsers, type UserCreatePayload } from "../api/users";
import Field from "../components/ui/Field";
import PageHeader from "../components/ui/PageHeader";
import Panel from "../components/ui/Panel";
import type { SupportedLanguage, UserRole } from "../types";

export default function AdminUsers() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("auth.validation.email")),
        full_name: z.string().min(2, t("validation.required")),
        role: z.enum(["admin", "doctor", "nurse_registrar"]),
        password: z.string().min(10, t("auth.validation.password")),
        is_active: z.boolean(),
        preferred_language: z.enum(["ru", "kk", "en"])
      }),
    [t]
  );
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: listUsers });
  const form = useForm<UserCreatePayload>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      full_name: "",
      role: "doctor",
      password: "",
      is_active: true,
      preferred_language: "ru"
    }
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      form.reset();
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader title={t("admin.title")} subtitle={t("admin.subtitle")} />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Panel title={t("admin.createUser")} actions={<ShieldPlus className="text-teal-700" size={20} aria-hidden />}>
          <form className="space-y-3" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
            <Field label={t("auth.email")} required error={form.formState.errors.email?.message}>
              <input className="form-input" type="email" {...form.register("email")} />
            </Field>
            <Field label={t("admin.fullName")} required error={form.formState.errors.full_name?.message}>
              <input className="form-input" {...form.register("full_name")} />
            </Field>
            <Field label={t("auth.password")} required error={form.formState.errors.password?.message}>
              <input className="form-input" type="password" {...form.register("password")} />
            </Field>
            <Field label={t("admin.role")} required>
              <select className="form-input" {...form.register("role")}>
                {(["admin", "doctor", "nurse_registrar"] as UserRole[]).map((role) => (
                  <option key={role} value={role}>
                    {t(`admin.roles.${role}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("language.label")} required>
              <select className="form-input" {...form.register("preferred_language")}>
                {(["ru", "kk", "en"] as SupportedLanguage[]).map((language) => (
                  <option key={language} value={language}>
                    {t(`language.${language}`)}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
              <input className="h-4 w-4 accent-teal-700" type="checkbox" {...form.register("is_active")} />
              {t("admin.active")}
            </label>
            {createMutation.error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                {createMutation.error.message}
              </p>
            )}
            <button className="primary-button w-full" type="submit" disabled={createMutation.isPending}>
              {t("admin.createUser")}
            </button>
          </form>
        </Panel>

        <Panel title={t("admin.title")}>
          <div className="overflow-hidden rounded-md border border-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">{t("admin.fullName")}</th>
                  <th className="px-4 py-3">{t("auth.email")}</th>
                  <th className="px-4 py-3">{t("admin.role")}</th>
                  <th className="px-4 py-3">{t("language.label")}</th>
                  <th className="px-4 py-3">{t("common.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(usersQuery.data ?? []).map((user) => (
                  <tr className="hover:bg-slate-50" key={user.id}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{user.full_name}</td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3 text-slate-600">{t(`admin.roles.${user.role}`)}</td>
                    <td className="px-4 py-3 text-slate-600">{t(`language.${user.preferred_language}`)}</td>
                    <td className="px-4 py-3 text-slate-600">{user.is_active ? t("admin.active") : t("common.no")}</td>
                  </tr>
                ))}
                {!usersQuery.isLoading && !(usersQuery.data ?? []).length && (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-500" colSpan={5}>
                      {t("admin.empty")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

