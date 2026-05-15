import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import kk from "./locales/kk.json";
import ru from "./locales/ru.json";

export const supportedLanguages = ["ru", "kk", "en"] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const languageStorageKey = "oas_language";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "ru",
    supportedLngs: supportedLanguages,
    resources: {
      ru: { translation: ru },
      kk: { translation: kk },
      en: { translation: en }
    },
    detection: {
      order: ["localStorage"],
      lookupLocalStorage: languageStorageKey,
      caches: ["localStorage"]
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
