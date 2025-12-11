// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrgAnalytics from "./pages/AdminOrgAnalytics";

function RequireAdmin() {
  const ok = !!localStorage.getItem("admin_token");
  return ok ? <Outlet /> : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin auth */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin area */}
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
        <Route path="/admin/org/:orgId/analytics" element={<AdminOrgAnalytics />} />
        {/* Defaults */}
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  );
}