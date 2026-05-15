import { useQuery } from "@tanstack/react-query";
import { Activity, LogOut, ShieldCheck, UsersRound } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { getMe } from "../api/auth";
import { clearTokens } from "../api/client";
import { languageStorageKey } from "../i18n";
import LanguageSwitcher from "./LanguageSwitcher";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition",
    isActive ? "bg-teal-700 text-white" : "text-slate-700 hover:bg-white"
  ].join(" ");

export default function AppLayout() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });

  useEffect(() => {
    if (!meQuery.data) {
      return;
    }
    const userLanguageKey = `${languageStorageKey}_${meQuery.data.id}`;
    const language = localStorage.getItem(userLanguageKey) ?? meQuery.data.preferred_language;
    if (language && (i18n.resolvedLanguage ?? i18n.language) !== language) {
      localStorage.setItem(languageStorageKey, language);
      i18n.changeLanguage(language);
    }
  }, [i18n, meQuery.data]);

  function logout() {
    clearTokens();
    navigate("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div>
            <p className="text-lg font-bold text-teal-800">{t("app.name")}</p>
            <p className="text-xs font-medium text-slate-500">{t("app.subtitle")}</p>
          </div>
          <nav className="flex items-center gap-2">
            <NavLink to="/" className={navLinkClass}>
              <Activity size={17} aria-hidden />
              {t("nav.dashboard")}
            </NavLink>
            <NavLink to="/patients" className={navLinkClass}>
              <UsersRound size={17} aria-hidden />
              {t("nav.patients")}
            </NavLink>
            {meQuery.data?.role === "admin" && (
              <NavLink to="/admin/users" className={navLinkClass}>
                <ShieldCheck size={17} aria-hidden />
                {t("nav.admin")}
              </NavLink>
            )}
            <LanguageSwitcher />
            <button className="secondary-button" type="button" onClick={logout}>
              <LogOut size={17} aria-hidden />
              {t("nav.signOut")}
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
