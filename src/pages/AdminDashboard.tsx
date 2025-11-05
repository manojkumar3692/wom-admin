// src/pages/AdminDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  listOrgs,
  toggleOrg,
  listOrdersForOrg,
  listCorrections,
  aiSpend,
} from "../lib/api";

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
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${map[tone] || map.gray}`}>
      {children}
    </span>
  );
}

function Card({ children, className = "" }: any) {
  return <div className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>;
}

function Topbar({ tab, setTab }: { tab: string; setTab: (v: any) => void }) {
  return (
    <div className="sticky top-0 z-20 -mx-4 mb-4 bg-white/80 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-xs font-semibold text-white">
            ADM
          </div>
          <div className="text-lg font-semibold">KartoSync Admin</div>
        </div>
        <div className="flex items-center gap-2">
          {["orgs", "orders", "learning", "spend"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                tab === t ? "bg-black text-white" : "border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {t === "orgs" && "Orgs"}
              {t === "orders" && "Orders"}
              {t === "learning" && "AI Learning"}
              {t === "spend" && "Spend"}
            </button>
          ))}
          <button
            onClick={() => {
              localStorage.removeItem("admin_token");
              window.location.href = "/admin/login";
            }}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Orgs ----------
function OrgsTab() {
  type Org = {
    id: string;
    name: string;
    phone?: string;
    plan?: string;
    is_disabled?: boolean;
    wa_phone_number_id?: string;
    created_at: string;
  };

  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);

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

  async function onToggle(id: string, v: boolean) {
    await toggleOrg(id, v);
    setOrgs((prev) => prev.map((o) => (o.id === id ? { ...o, is_disabled: v } : o)));
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-lg font-semibold">Organizations</div>
        <button onClick={refresh} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-gray-500">Loading…</div>
      ) : orgs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
          No organizations yet.
        </div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2">Name</th>
                <th>Phone</th>
                <th>Plan</th>
                <th>WA ID</th>
                <th>Status</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orgs.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="py-2 font-medium">{o.name}</td>
                  <td className="text-gray-600">{o.phone || "—"}</td>
                  <td>
                    <Badge tone={o.plan === "pro" ? "green" : "gray"}>{o.plan || "—"}</Badge>
                  </td>
                  <td className="text-gray-600">{o.wa_phone_number_id || "—"}</td>
                  <td>{o.is_disabled ? <Badge tone="red">Disabled</Badge> : <Badge tone="green">Active</Badge>}</td>
                  <td className="text-gray-600">{new Date(o.created_at).toLocaleString()}</td>
                  <td>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!o.is_disabled}
                        onChange={(e) => onToggle(o.id, e.target.checked)}
                      />
                      <span className="text-sm text-gray-700">Disable</span>
                    </label>
                  </td>
                </tr>
              ))}
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
          <button onClick={load} className="rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white">
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
            <div className="mb-2 text-sm text-gray-600">{orders.length} orders</div>
            <div className="grid gap-2">
              {orders.map((o) => (
                <div key={o.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString()}</div>
                    <Badge tone={o.status === "paid" ? "green" : o.status === "shipped" ? "blue" : "amber"}>
                      {o.status}
                    </Badge>
                  </div>
                  <div className="mt-1 font-semibold">{o.customer_name || o.source_phone || "Customer"}</div>
                  <div className="mt-1 text-sm text-gray-700">
                    {(o.items || [])
                      .map((i: any) => `${i.qty || ""} ${i.unit || ""} ${i.canonical || i.name || ""}`.trim())
                      .join(" · ")}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">reason: {o.parse_reason || "—"}</div>
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
    const [orgId, setOrgId] = useState<string>(''); // '' = All orgs
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
  
    // fetch orgs once for the dropdown
    useEffect(() => {
      (async () => {
        try {
          const d = await listOrgs();
          setOrgs(d || []);
        } catch (e) {
          console.error('load orgs failed', e);
        }
      })();
    }, []);
  
    async function load(selectedOrgId?: string) {
      setLoading(true);
      try {
        const d = await listCorrections(selectedOrgId && selectedOrgId.length ? selectedOrgId : undefined);
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
  
    async function doRetrain(scope: 'global' | 'org') {
      const target = scope === 'org' ? orgId : undefined;
      await retrain(target, scope === 'org' ? 'manual org retrain' : 'manual global retrain');
      alert('Retrain job queued.');
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
              onClick={() => doRetrain('global')}
            >
              Retrain (Global)
            </button>
            <button
              className="bg-blue-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
              disabled={!orgId}
              onClick={() => doRetrain('org')}
            >
              Retrain (This Org)
            </button>
          </div>
        </div>
  
        {loading ? (
          <div className="mt-3">Loading…</div>
        ) : (
          <div className="mt-3">
            <div className="text-sm text-gray-600 mb-2">{rows.length} corrections</div>
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
                      .map(
                        (i: any) =>
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
function SpendTab() {
  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("daily");
  const [data, setData] = useState<any>(null);

  async function load() {
    const d = await aiSpend(range);
    setData(d || {});
  }
  useEffect(() => {
    load();
  }, [range]);

  // simple faux sparkline (no libs)
  const dollars = Number(data?.total_usd || 0);
  const pct = Math.min(100, (dollars / Number(data?.caps?.daily_cap || dollars || 1)) * 100);

  return (
    <div className="grid gap-3">
      <Card className="flex items-center justify-between">
        <div className="text-lg font-semibold">AI Spend</div>
        <select
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          value={range}
          onChange={(e) => setRange(e.target.value as any)}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Last 7 days</option>
          <option value="monthly">Last 30 days</option>
        </select>
      </Card>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <div className="text-sm text-gray-500">Total (USD)</div>
          <div className="mt-1 text-2xl font-semibold">${dollars.toFixed(4)}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Daily Cap</div>
          <div className="mt-1 text-2xl font-semibold">${Number(data?.caps?.daily_cap ?? 0).toFixed(2)}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Monthly Cap</div>
          <div className="mt-1 text-2xl font-semibold">${Number(data?.caps?.monthly_cap ?? 0).toFixed(2)}</div>
        </Card>
      </div>

      <Card>
        <div className="mb-2 text-sm text-gray-600">Usage vs. cap</div>
        <div className="h-2 w-full rounded-full bg-gray-100">
          <div className="h-2 rounded-full bg-black" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Model: {data?.caps?.model || "—"} · Since: {data?.since ? new Date(data.since).toLocaleString() : "—"}
        </div>
      </Card>
    </div>
  );
}

// ---------- Page ----------
export default function AdminDashboard() {
  const [tab, setTab] = useState<"orgs" | "orders" | "learning" | "spend">("orgs");
  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar tab={tab} setTab={setTab} />
      <div className="mx-auto max-w-6xl px-4 pb-10">
        {tab === "orgs" && <OrgsTab />}
        {tab === "orders" && <OrdersTab />}
        {tab === "learning" && <LearningTab />}
        {tab === "spend" && <SpendTab />}
      </div>
    </div>
  );
}