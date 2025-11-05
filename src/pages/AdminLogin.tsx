// src/pages/Login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin, setAdminToken } from "../lib/api";

export default function AdminLogin() {
  const nav = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("Solid@123$");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setErr(null);
    if (!username || !password) {
      setErr("Enter username and password.");
      return;
    }
    setLoading(true);
    try {
      const { token } = await adminLogin(username, password);
      localStorage.setItem("admin_token", token);
      setAdminToken(token);
      nav("/admin", { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Left panel (brand/marketing) */}
      <div className="hidden lg:flex items-center justify-center p-10">
        <div className="max-w-md text-white/90">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-white text-slate-900 flex items-center justify-center text-xs font-bold tracking-wider shadow">
              ADM
            </div>
            <div className="text-2xl font-semibold">KartoSync Admin</div>
          </div>

          <h1 className="text-3xl font-bold leading-tight">
            Operate with control.
          </h1>
          <p className="mt-4 text-white/70 leading-relaxed">
            Sign in to manage organizations, review AI learning history,
            and monitor spend caps — all from a single command center.
          </p>

          <ul className="mt-6 space-y-2 text-sm text-white/75">
            <li>• Enable/disable orgs instantly</li>
            <li>• Inspect orders and corrections</li>
            <li>• Queue global or org-specific retraining</li>
          </ul>
        </div>
      </div>

      {/* Right panel (card) */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-2xl shadow-xl p-6">
            <div className="mb-4">
              <div className="text-lg font-semibold text-slate-900">Admin Login</div>
              <div className="text-xs text-slate-500 mt-1">Administrator access</div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Username</label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  placeholder="admin"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-600">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  type={showPw ? "text" : "password"}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {err && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg py-2.5 bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 transition"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          </div>

          <div className="text-center text-xs text-white/60 mt-6">
            © {new Date().getFullYear()} KartoSync Admin
          </div>
        </div>
      </div>
    </div>
  );
}