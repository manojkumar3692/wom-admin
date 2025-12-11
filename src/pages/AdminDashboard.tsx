// src/pages/AdminDashboard.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  listOrgs,
  toggleOrg,
  listOrdersForOrg,
  listCorrections,
  aiSpend,
  retrain,
  setOrgParseMode,
  adminMe,
  changeAdminPassword,
} from "../lib/api";
import ProductsTab from "../components/ProductsTab";

// ---------- tiny UI helpers ----------
function Badge({ tone = "gray", children }: any) {
  const map: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
        map[tone] || map.gray
      }`}
    >
      {children}
    </span>
  );
}

function Card({ children, className = "" }: any) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

type AdminUser = {
  username: string;
  role?: string | null;
};

function Topbar({
  tab,
  setTab,
  admin,
  onChangePassword,
}: {
  tab: string;
  setTab: (v: any) => void;
  admin: AdminUser | null;
  onChangePassword: (oldPass: string, newPass: string) => Promise<void>;
}) {
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!oldPass || !newPass) {
      setError("Please fill both fields.");
      return;
    }
    try {
      setBusy(true);
      await onChangePassword(oldPass, newPass);
      alert("Password changed successfully.");
      setShowPwdModal(false);
      setOldPass("");
      setNewPass("");
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.error || "Failed to change password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="sticky top-0 z-20 -mx-4 mb-4 bg-white/80 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          {/* Left: logo + title */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-xs font-semibold text-white">
              ADM
            </div>
            <div className="text-lg font-semibold">KartoSync Admin</div>
          </div>

          {/* Center: tabs (desktop) */}
          <div className="hidden md:flex items-center gap-2">
            {["orgs", "orders", "learning", "spend", "products"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  tab === t
                    ? "bg-black text-white"
                    : "border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {t === "orgs" && "Orgs"}
                {t === "orders" && "Orders"}
                {t === "learning" && "AI Learning"}
                {t === "spend" && "Spend"}
                {t === "products" && "Products"}
              </button>
            ))}
          </div>

          {/* Right: admin info */}
          <div className="flex items-center gap-3">
            {admin && (
              <div className="hidden text-right text-xs sm:block">
                <div className="font-medium">{admin.username}</div>
                {admin.role && (
                  <div className="text-gray-500">{admin.role}</div>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPwdModal(true)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs sm:text-sm hover:bg-gray-50"
              >
                Change password
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("admin_token");
                  window.location.href = "/admin/login";
                }}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs sm:text-sm hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Mobile tab row */}
        <div className="mt-3 flex gap-2 md:hidden overflow-x-auto">
          {["orgs", "orders", "learning", "spend", "products"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs ${
                tab === t
                  ? "bg-black text-white"
                  : "border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {t === "orgs" && "Orgs"}
              {t === "orders" && "Orders"}
              {t === "learning" && "AI Learning"}
              {t === "spend" && "Spend"}
              {t === "products" && "Products"}
            </button>
          ))}
        </div>
      </div>

      {/* Change password modal */}
      {showPwdModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-lg">
            <div className="mb-2 text-base font-semibold">Change password</div>
            {admin && (
              <div className="mb-2 text-xs text-gray-600">
                Username: <span className="font-mono">{admin.username}</span>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-2">
              <div>
                <div className="text-xs text-gray-600 mb-1">
                  Current password
                </div>
                <input
                  type="password"
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                />
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">New password</div>
                <input
                  type="password"
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                />
              </div>
              {error && <div className="text-xs text-rose-600">{error}</div>}
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPwdModal(false)}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-xs hover:bg-gray-50"
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-black px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  disabled={busy}
                >
                  {busy ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

type Org = {
  id: string;
  name: string;
  phone?: string | null;
  wa_phone_number_id?: string | null;
  plan: string;
  is_disabled?: boolean | null;
  created_at: string;
  parse_mode?: string | null;
};

// ---------- Orgs ----------
function OrgsTab() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [busyOrgId, setBusyOrgId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const d = await listOrgs();
      setOrgs(d || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleToggleDisabled(o: Org) {
    setBusyOrgId(o.id);
    try {
      await toggleOrg(o.id, !o.is_disabled);
      setOrgs((prev) =>
        prev.map((x) =>
          x.id === o.id ? { ...x, is_disabled: !o.is_disabled } : x
        )
      );
    } finally {
      setBusyOrgId(null);
    }
  }

  async function handleToggleAi(o: Org) {
    const nextMode = o.parse_mode === "ai" || !o.parse_mode ? "manual" : "ai";
    setBusyOrgId(o.id);
    try {
      await setOrgParseMode(o.id, nextMode);
      setOrgs((prev) =>
        prev.map((x) => (x.id === o.id ? { ...x, parse_mode: nextMode } : x))
      );
    } finally {
      setBusyOrgId(null);
    }
  }

  const filtered = orgs.filter((o) => {
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      o.name.toLowerCase().includes(q) ||
      (o.phone || "").toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    );
  });

  function aiStatus(o: Org) {
    if (o.is_disabled) return "off";
    if (o.parse_mode === "manual") return "paused";
    return "on";
  }

  return (
    <Card>
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-lg font-semibold">Organizations</div>
          <div className="text-xs text-gray-500">
            Control AI & messaging per org. Use <b>Pause AI</b> when they want
            manual mode, and <b>Block</b> if they haven’t paid or must be
            suspended.
          </div>
        </div>
        <div className="flex gap-2">
          <input
            className="w-40 rounded-md border border-gray-300 px-2 py-1.5 text-xs md:text-sm"
            placeholder="Search org / phone / id"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button
            onClick={refresh}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs md:text-sm hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-gray-500">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
          No organizations found.
        </div>
      ) : (
        <div className="overflow-auto">
          <table className="min-w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2 pr-2">Name</th>
                <th className="pr-2">Phone</th>
                <th className="pr-2">Plan</th>
                <th className="pr-2">WA ID</th>
                <th className="pr-2">AI</th>
                <th className="pr-2">Messaging</th>
                <th className="pr-2">Created</th>
                <th className="pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const status = aiStatus(o);
                const isBusy = busyOrgId === o.id;
                return (
                  <tr key={o.id} className="border-t align-middle">
                    <td className="py-2 pr-2 font-medium">
                      <div>{o.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">
                        {o.id}
                      </div>
                    </td>
                    <td className="pr-2 text-gray-600">{o.phone || "—"}</td>
                    <td className="pr-2">
                      <Badge tone={o.plan === "pro" ? "green" : "gray"}>
                        {o.plan || "free"}
                      </Badge>
                    </td>
                    <td className="pr-2 text-gray-600">
                      <span className="text-[11px] font-mono">
                        {o.wa_phone_number_id || "—"}
                      </span>
                    </td>
                    <td className="pr-2">
                      {status === "paused" ? (
                        <Badge tone="amber">AI paused</Badge>
                      ) : status === "off" ? (
                        <Badge tone="red">Off</Badge>
                      ) : (
                        <Badge tone="green">AI on</Badge>
                      )}
                    </td>
                    <td className="pr-2">
                      {o.is_disabled ? (
                        <Badge tone="red">Blocked</Badge>
                      ) : (
                        <Badge tone="green">Allowed</Badge>
                      )}
                    </td>
                    <td className="pr-2 text-gray-600">
                      {new Date(o.created_at).toLocaleString()}
                    </td>
                    <td className="pr-2">
                      <div className="flex justify-end gap-1">
                        {/* 🔍 NEW: Analytics button */}
                        <Link
                          to={`/admin/org/${o.id}/analytics`}
                          className="rounded border border-blue-500 px-2 py-1 text-[11px] text-blue-600 hover:bg-blue-50"
                        >
                          Analytics
                        </Link>

                        <button
                          onClick={() => handleToggleAi(o)}
                          disabled={isBusy || !!o.is_disabled}
                          className="rounded border border-gray-300 px-2 py-1 text-[11px] hover:bg-gray-50 disabled:opacity-40"
                          title={o.is_disabled ? "Org is blocked" : ""}
                        >
                          {status === "paused" ? "Resume AI" : "Pause AI"}
                        </button>
                        <button
                          onClick={() => handleToggleDisabled(o)}
                          disabled={isBusy}
                          className={`rounded px-2 py-1 text-[11px] border ${
                            o.is_disabled
                              ? "border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                              : "border-rose-500 text-rose-700 hover:bg-rose-50"
                          } disabled:opacity-40`}
                        >
                          {o.is_disabled ? "Unblock" : "Block"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ---------- Orders ----------
function OrdersTab() {
  const [orgId, setOrgId] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!orgId) return;
    setLoading(true);
    try {
      const d = await listOrdersForOrg(orgId, 500);
      setOrders(d || []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-3">
      <Card>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <div className="text-sm text-gray-600">Org ID</div>
            <input
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              placeholder="paste org_id"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
            />
          </div>
          <button
            onClick={load}
            className="rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white"
          >
            Load
          </button>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            No orders to show.
          </div>
        ) : (
          <div>
            <div className="mb-2 text-sm text-gray-600">
              {orders.length} orders
            </div>
            <div className="grid gap-2">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-lg border border-gray-200 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {new Date(o.created_at).toLocaleString()}
                    </div>
                    <Badge
                      tone={
                        o.status === "paid"
                          ? "green"
                          : o.status === "shipped"
                          ? "blue"
                          : "amber"
                      }
                    >
                      {o.status}
                    </Badge>
                  </div>
                  <div className="mt-1 font-semibold">
                    {o.customer_name || o.source_phone || "Customer"}
                  </div>
                  <div className="mt-1 text-sm text-gray-700">
                    {(o.items || [])
                      .map((i: any) =>
                        `${i.qty || ""} ${i.unit || ""} ${
                          i.canonical || i.name || ""
                        }`.trim()
                      )
                      .join(" · ")}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    reason: {o.parse_reason || "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---------- Learning ----------
function LearningTab() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgId, setOrgId] = useState<string>(""); // '' = All orgs
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // fetch orgs once for the dropdown
  useEffect(() => {
    (async () => {
      try {
        const d = await listOrgs();
        setOrgs(d || []);
      } catch (e) {
        console.error("load orgs failed", e);
      }
    })();
  }, []);

  async function load(selectedOrgId?: string) {
    setLoading(true);
    try {
      const d = await listCorrections(
        selectedOrgId && selectedOrgId.length ? selectedOrgId : undefined
      );
      setRows(d);
    } finally {
      setLoading(false);
    }
  }

  // reload when org changes
  useEffect(() => {
    load(orgId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  async function doRetrain(scope: "global" | "org") {
    const target = scope === "org" ? orgId : undefined;
    await retrain(
      target,
      scope === "org" ? "manual org retrain" : "manual global retrain"
    );
    alert("Retrain job queued.");
  }

  return (
    <Card>
      <div className="flex flex-col md:flex-row md:items-end gap-2">
        <div className="flex-1">
          <div className="text-sm text-gray-600 mb-1">Organization</div>
          <select
            className="border rounded w-full px-2 py-1 text-sm bg-white"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
          >
            <option value="">All orgs</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name || o.id}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            className="bg-black text-white px-3 py-2 rounded text-sm"
            onClick={() => load(orgId)}
          >
            Refresh
          </button>
          <button
            className="bg-emerald-600 text-white px-3 py-2 rounded text-sm"
            onClick={() => doRetrain("global")}
          >
            Retrain (Global)
          </button>
          <button
            className="bg-blue-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
            disabled={!orgId}
            onClick={() => doRetrain("org")}
          >
            Retrain (This Org)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-3">Loading…</div>
      ) : (
        <div className="mt-3">
          <div className="text-sm text-gray-600 mb-2">
            {rows.length} corrections
          </div>
          <div className="grid gap-2">
            {rows.map((r: any) => (
              <div key={r.id} className="border rounded p-2 text-sm">
                <div className="text-xs text-gray-500">
                  {new Date(r.created_at).toLocaleString()} · Org: {r.org_id}
                </div>
                <div className="text-gray-800">
                  <b>Message:</b> {r.message_text}
                </div>
                <div className="text-gray-700">
                  <b>Model:</b>{" "}
                  {(r.model_output || [])
                    .map((i: any) => i.canonical || i.name)
                    .join(", ")}
                </div>
                <div className="text-emerald-700">
                  <b>Fixed:</b>{" "}
                  {(r.human_fixed?.items || [])
                    .map((i: any) =>
                      `${i.qty || ""} ${i.unit || ""} ${
                        i.canonical || i.name || ""
                      }`.trim()
                    )
                    .join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// ---------- Spend (with chart) ----------
// inside AdminDashboard.tsx

function SpendTab() {
  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("daily");
  const [data, setData] = useState<any>(null);

  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>(""); // "" = all orgs
  const [loading, setLoading] = useState<boolean>(false);

  const DAILY_CAP = 5;      // USD
  const MONTHLY_CAP = 150;  // USD

  // load org list once
  useEffect(() => {
    (async () => {
      try {
        const d = await listOrgs();
        setOrgs(d || []);
      } catch (e) {
        console.error("load orgs failed", e);
      }
    })();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const d = await aiSpend(range, selectedOrgId || undefined);
      setData(d || {});
      // console.log("[DEBUG aiSpend]", range, selectedOrgId, d);
    } finally {
      setLoading(false);
    }
  }

  // reload whenever range or org changes
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, selectedOrgId]);

  const dollars = Number(data?.total_usd || 0);

  // cap based on selected range (simple fixed rules)
  const capForRange =
    range === "daily"
      ? DAILY_CAP
      : range === "weekly"
      ? DAILY_CAP * 7
      : MONTHLY_CAP;

  const remaining = Math.max(capForRange - dollars, 0);
  const pct = Math.min(100, capForRange > 0 ? (dollars / capForRange) * 100 : 0);

  const scopeLabel =
    selectedOrgId && orgs.length
      ? orgs.find((o) => o.id === selectedOrgId)?.name || selectedOrgId
      : "All orgs";

  return (
    <div className="grid gap-3">
      <Card className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-lg font-semibold">AI Spend</div>
          <div className="text-xs text-gray-500">
            OpenAI usage for KartoSync · Scope:{" "}
            <span className="font-medium">{scopeLabel}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <select
            className="rounded-md border border-gray-300 px-2 py-1.5 text-xs md:text-sm"
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
          >
            <option value="">All orgs</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} · {o.phone || o.id.slice(0, 6)}
              </option>
            ))}
          </select>

          <select
            className="rounded-md border border-gray-300 px-2 py-1.5 text-xs md:text-sm"
            value={range}
            onChange={(e) => setRange(e.target.value as any)}
          >
            <option value="daily">Today</option>
            <option value="weekly">Last 7 days</option>
            <option value="monthly">Last 30 days</option>
          </select>
        </div>
      </Card>

      {loading ? (
        <Card>Loading spend…</Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <Card>
              <div className="text-sm text-gray-500">
                Used this period ({range})
              </div>
              <div className="mt-1 text-2xl font-semibold">
                ${dollars.toFixed(4)}
              </div>
            </Card>

            <Card>
              <div className="text-sm text-gray-500">Cap for this period</div>
              <div className="mt-1 text-2xl font-semibold">
                ${capForRange.toFixed(2)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Daily cap: ${DAILY_CAP.toFixed(2)} · Monthly cap: $
                {MONTHLY_CAP.toFixed(2)}
              </div>
            </Card>

            <Card>
              <div className="text-sm text-gray-500">Remaining budget</div>
              <div className="mt-1 text-2xl font-semibold">
                ${remaining.toFixed(4)}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {pct.toFixed(1)}% of this period&apos;s cap used
              </div>
            </Card>
          </div>

          <Card>
            <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
              <span>Usage vs cap for this period</span>
              <span>
                ${dollars.toFixed(4)} / ${capForRange.toFixed(2)} (
                {pct.toFixed(1)}%)
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-black"
                style={{ width: `${pct}%` }}
              />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ---------- Page ----------
export default function AdminDashboard() {
  const [tab, setTab] = useState<
    "orgs" | "orders" | "learning" | "spend" | "products"
  >("orgs");
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    adminMe()
      .then((d) => setAdmin(d))
      .catch((err) => {
        console.error("adminMe failed", err);
      });
  }, []);

  async function handleChangePassword(oldPass: string, newPass: string) {
    await changeAdminPassword(oldPass, newPass);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar
        tab={tab}
        setTab={setTab}
        admin={admin}
        onChangePassword={handleChangePassword}
      />
      <div className="mx-auto max-w-6xl px-4 pb-10">
        {tab === "orgs" && <OrgsTab />}
        {tab === "orders" && <OrdersTab />}
        {tab === "learning" && <LearningTab />}
        {tab === "spend" && <SpendTab />}
        {tab === "products" && <ProductsTab />}
      </div>
    </div>
  );
}