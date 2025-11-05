import React, { useEffect, useMemo, useRef, useState } from "react";
import { listOrdersForOrg, me } from "../lib/api";
import OrderCard from "./OrderCard";

type OrderStatus = "pending" | "delivered" | "paid" | "shipped";

function Badge({ tone = "gray", children }: { tone?: "gray" | "amber" | "blue" | "green"; children: React.ReactNode }) {
  const tones: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return <span className={`inline-flex items-center gap-1 text-[12px] px-2 py-0.5 rounded border ${tones[tone]}`}>{children}</span>;
}

function SkeletonRow() {
  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white animate-pulse">
      <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
      <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
      <div className="h-3 w-full bg-gray-200 rounded" />
    </div>
  );
}

export default function Dashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [org, setOrg] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [status, setStatus] = useState<"all" | "pending" | "shipped" | "paid" | "delivered">("all");
  const [query, setQuery] = useState("");
  const [tick, setTick] = useState(0);

  const pollRef = useRef<number | null>(null);

  async function refresh(opts?: { soft?: boolean }) {
    if (!opts?.soft) setLoading(true);
    else setRefreshing(true);
    try {
      const params = status === "all" ? undefined : { status };
      const [data, orgInfo] = await Promise.all([listOrdersForOrg(params as any), org ? Promise.resolve(org) : me()]);
      setOrders(Array.isArray(data) ? data : []);
      if (!org) setOrg(orgInfo);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    refresh();
    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(() => {
      setTick((t) => t + 1); // UI ping
      refresh({ soft: true });
    }, 12000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // client-side search
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => {
      const who = (o.customer_name || o.source_phone || "").toLowerCase();
      const raw = (o.raw_text || "").toLowerCase();
      const items = (o.items || [])
        .map((i: any) => `${i.qty || ""} ${i.unit || ""} ${i.canonical || i.name || ""}`)
        .join(" ")
        .toLowerCase();
      return who.includes(q) || raw.includes(q) || items.includes(q);
    });
  }, [orders, query]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: orders.length, pending: 0, shipped: 0, paid: 0, delivered: 0 };
    for (const o of orders) {
      const s = String(o.status || "").toLowerCase();
      if (map[s] != null) map[s] += 1;
    }
    return map;
  }, [orders]);

  return (
    <div className="space-y-3">
      {/* Header strip */}
      <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-3">
        <div className="flex-1">
          <div className="text-[12px] text-gray-500">Workspace</div>
          <div className="font-semibold text-[16px]">{org?.name || "—"}</div>
          <div className="text-[11px] text-gray-400">WA ID: {org?.wa_phone_number_id || "—"}</div>
        </div>

        {/* search */}
        <div className="flex-1 md:max-w-md">
          <label className="sr-only">Search orders</label>
          <div className="relative">
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-9 bg-white focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="Search by customer, item or message…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="absolute left-2 top-2.5 text-gray-400">🔎</span>
          </div>
        </div>

        {/* refresh */}
        <button
          onClick={() => refresh({ soft: true })}
          className="h-10 px-3 rounded-lg border bg-white hover:bg-gray-50 flex items-center gap-2"
          title="Refresh"
        >
          <span className={refreshing ? "animate-spin inline-block" : ""}>⟲</span>
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {/* status pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStatus("all")}
          className={`px-3 py-1.5 rounded-full border text-sm ${
            status === "all" ? "bg-black text-white" : "bg-white hover:bg-gray-50"
          }`}
        >
          All <span className="ml-1 opacity-70">({counts.all})</span>
        </button>
        <button
          onClick={() => setStatus("pending")}
          className={`px-3 py-1.5 rounded-full border text-sm ${
            status === "pending" ? "bg-amber-500 text-white border-amber-500" : "bg-white hover:bg-gray-50"
          }`}
        >
          ⏳ Pending <span className="ml-1 opacity-70">({counts.pending})</span>
        </button>
        <button
          onClick={() => setStatus("shipped")}
          className={`px-3 py-1.5 rounded-full border text-sm ${
            status === "shipped" ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-gray-50"
          }`}
        >
          📦 Shipped <span className="ml-1 opacity-70">({counts.shipped})</span>
        </button>
        <button
          onClick={() => setStatus("paid")}
          className={`px-3 py-1.5 rounded-full border text-sm ${
            status === "paid" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white hover:bg-gray-50"
          }`}
        >
          ✅ Paid <span className="ml-1 opacity-70">({counts.paid})</span>
        </button>
      </div>

      {/* free plan banner */}
      {org?.plan === "free" && (
        <div className="text-[12px] bg-amber-50 border border-amber-200 rounded-md p-2 text-gray-700">
          <div>
            <b>Free plan limit:</b> 25 orders/day
          </div>
          <div>
            Upgrade to <b>Pro</b> for unlimited orders + PDF invoices.{" "}
            <span className="text-gray-500">
              Contact{" "}
              <a href="mailto:sales@tropicalglow.in" className="text-blue-600 hover:underline">
                sales@tropicalglow.in
              </a>
            </span>
          </div>
        </div>
      )}

      {/* list */}
      {loading ? (
        <div className="grid gap-2">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid gap-2">
          {filtered.map((o:any) => (
            <OrderCard key={o.id} o={o} onChange={() => refresh({ soft: true })} />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-gray-300 rounded-xl p-6 bg-white text-center">
          <div className="text-3xl mb-1">🧾</div>
          <div className="text-gray-700 font-medium">No matching orders</div>
          <div className="text-gray-500 text-sm">Try a different status or clear the search.</div>
        </div>
      )}

      {/* footer meta */}
      <div className="flex items-center justify-between text-[12px] text-gray-500 pt-1">
        <div>
          <Badge tone="gray">Auto-refresh 12s</Badge>
        </div>
        <div className="opacity-70">Last tick: {tick}</div>
      </div>
    </div>
  );
}