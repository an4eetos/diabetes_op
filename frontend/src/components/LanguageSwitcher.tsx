import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { getMe, updateMyPreferences } from "../api/auth";
import { getAccessToken } from "../api/client";
import { languageStorageKey, supportedLanguages, type SupportedLanguage } from "../i18n";

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const queryClient = useQueryClient();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe, enabled: Boolean(getAccessToken()) });
  const mutation = useMutation({
    mutationFn: updateMyPreferences,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] })
  });

  async function changeLanguage(language: SupportedLanguage) {
    localStorage.setItem(languageStorageKey, language);
    if (meQuery.data?.id) {
      localStorage.setItem(`${languageStorageKey}_${meQuery.data.id}`, language);
    }
    await i18n.changeLanguage(language);
    if (getAccessToken()) {
      mutation.mutate(language);
    }
  }

  return (
    <label className="inline-flex min-w-0 items-center gap-2 rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm font-semibold text-slate-700 shadow-sm">
      <Globe2 size={16} aria-hidden className="shrink-0 text-teal-700" />
      <span className="sr-only">{t("language.label")}</span>
      <select
        className="min-w-0 bg-transparent text-sm font-semibold outline-none"
        value={(i18n.resolvedLanguage ?? i18n.language ?? "ru").slice(0, 2)}
        onChange={(event) => changeLanguage(event.target.value as SupportedLanguage)}
      >
        {supportedLanguages.map((language) => (
          <option key={language} value={language}>
            {t(`language.${language}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
