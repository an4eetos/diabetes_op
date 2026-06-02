import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { getMe } from "./api/auth";
import { clearTokens, getAccessToken } from "./api/client";
import AppLayout from "./components/AppLayout";
import AdminUsers from "./pages/AdminUsers";
import Login from "./pages/Login";
import OsteoRiskPage from "./pages/OsteoRiskPage";
import PatientList from "./pages/PatientList";
import PatientProfile from "./pages/PatientProfile";

import type { UserRole } from "./types";

function RequireAuth() {
  const { t } = useTranslation();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe, enabled: Boolean(getAccessToken()) });

  if (!getAccessToken()) {
    return <Navigate to="/login" replace />;
  }
  if (meQuery.isLoading) {
    return <p className="p-6 text-sm text-slate-500">{t("common.loading")}</p>;
  }
  if (meQuery.isError || !meQuery.data) {
    clearTokens();
    return <Navigate to="/login" replace />;
  }
  return <AppLayout />;
}

function RequireRole({ roles }: { roles: UserRole[] }) {
  const { t } = useTranslation();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });

  if (meQuery.isLoading) {
    return <p className="p-6 text-sm text-slate-500">{t("common.loading")}</p>;
  }

  if (meQuery.isError || !meQuery.data) {
    clearTokens();
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(meQuery.data.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<OsteoRiskPage />} />
        <Route path="/patients" element={<PatientList />} />
        <Route path="/patients/:patientId" element={<PatientProfile />} />
        <Route element={<RequireRole roles={["admin"]} />}>
          <Route path="/admin/users" element={<AdminUsers />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
