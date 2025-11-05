// src/components/Topbar.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Topbar() {
  const loc = useLocation();
  const authed = !!localStorage.getItem("token");

  return (
    <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="mx-auto max-w-5xl px-3 py-3 flex items-center justify-between">
        <Link to="/" className="font-semibold text-lg">KartoSync</Link>
        <div className="flex items-center gap-2">
          {authed && loc.pathname !== "/login" ? (
            <>
              <Link to="/dashboard" className="px-3 py-1.5 rounded border">Dashboard</Link>
              <Link to="/logout" className="px-3 py-1.5 rounded border">Logout</Link>
            </>
          ) : (
            <Link to="/login" className="px-3 py-1.5 rounded border">Login</Link>
          )}
        </div>
      </div>
    </div>
  );
}