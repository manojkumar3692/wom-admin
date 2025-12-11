// src/pages/AdminOrgAnalytics.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrgStats, listOrgs } from "../lib/api";

type OrgStats = {
  org_id: string;
  total_orders: number;
  completed_orders: number;
  open_orders: number;
  total_revenue: number;
  completed_revenue: number;
  // AI / manual fields are OPTIONAL for now (view doesn’t have them yet)
  ai_orders?: number | null;
  ai_completed_orders?: number | null;
  ai_revenue?: number | null;
  manual_orders?: number | null;
  manual_revenue?: number | null;
  first_order_at: string | null;
  last_order_at: string | null;
};

type OrgLite = { id: string; name: string };

function Card({ children, className = "" }: any) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="text-xl font-semibold">{value}</div>
      {hint && <div className="text-xs text-gray-400">{hint}</div>}
    </div>
  );
}

export default function AdminOrgAnalytics() {
  const { orgId } = useParams<{ orgId: string }>();
  const [org, setOrg] = useState<OrgLite | null>(null);
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;

    (async () => {
      try {
        setLoading(true);

        // Load org name (for header)
        const orgs = await listOrgs();
        const found = (orgs || []).find((o: any) => o.id === orgId);
        if (found) {
          setOrg({ id: found.id, name: found.name });
        } else {
          setOrg({ id: orgId, name: orgId });
        }

        const s = await getOrgStats(orgId);
        setStats(s);
      } finally {
        setLoading(false);
      }
    })();
  }, [orgId]);

  if (!orgId) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Card>Missing org id.</Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Card>Loading analytics…</Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Card>No data yet for this org.</Card>
      </div>
    );
  }

  const {
    total_orders,
    completed_orders,
    open_orders,
    total_revenue,
    completed_revenue,
    first_order_at,
    last_order_at,
  } = stats;


  // 🔢 Always coerce to numbers, Postgres numeric may come as string
const totalRevenueNum = Number(total_revenue ?? 0);
const completedRevenueNum = Number(completed_revenue ?? 0);

  // 🔒 Safely coerce AI / manual fields (they may not exist yet)
  const aiOrders = Number(stats.ai_orders ?? 0);
  const aiCompletedOrders = Number(stats.ai_completed_orders ?? 0);
  const aiRevenue = Number(stats.ai_revenue ?? 0);
  const manualOrders = Number(stats.manual_orders ?? 0);
  const manualRevenue = Number(stats.manual_revenue ?? 0);

  const aiShare =
    total_orders > 0 && aiOrders > 0
      ? ((aiOrders / total_orders) * 100).toFixed(1) + "%"
      : "—";

  const completionRate =
    total_orders > 0
      ? ((completed_orders / total_orders) * 100).toFixed(1) + "%"
      : "—";

  const aiRevenueShare =
    completed_revenue > 0 && aiRevenue > 0
      ? ((aiRevenue / completed_revenue) * 100).toFixed(1) + "%"
      : "—";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">
              <Link to="/admin" className="text-blue-600 hover:underline">
                ← Back to Orgs
              </Link>
            </div>
            <h1 className="text-xl font-semibold">
              {org?.name || "Org"} – Analytics
            </h1>
            <div className="text-xs text-gray-500">
              Org ID: <span className="font-mono">{org?.id}</span>
            </div>
          </div>
        </div>

{/* Top: revenue + impact */}
<div className="grid gap-3 md:grid-cols-3">
  <Card>
    <Stat
      label="Total revenue via KartoSync"
      value={`AED ${totalRevenueNum.toFixed(2)}`}
      hint="All orders (any status) recorded in KartoSync"
    />
  </Card>
  <Card>
    <Stat
      label="Realized revenue (completed)"
      value={`AED ${completedRevenueNum.toFixed(2)}`}
      hint="Only orders with status = completed"
    />
  </Card>
  <Card>
    <Stat
      label="Revenue via KartoSync AI"
      value={`AED ${aiRevenue.toFixed(2)}`}
      hint="Completed orders where created_by = 'ai'"
    />
  </Card>
</div>

        {/* Orders breakdown */}
        <div className="grid gap-3 md:grid-cols-3">
          <Card>
            <Stat
              label="Total orders"
              value={String(total_orders)}
              hint={`Completed: ${completed_orders}, Open: ${open_orders}`}
            />
          </Card>
          <Card>
            <Stat
              label="AI-created orders"
              value={String(aiOrders)}
              hint={`Completed via AI: ${aiCompletedOrders}`}
            />
          </Card>
          <Card>
            <Stat
              label="AI order share"
              value={aiShare}
              hint="AI orders / total orders"
            />
          </Card>
        </div>

        {/* Manual vs AI revenue */}
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <Stat
              label="Manual revenue"
              value={`AED ${manualRevenue.toFixed(2)}`}
              hint={`Manual orders: ${manualOrders}`}
            />
          </Card>
          <Card>
            <Stat
              label="Order completion rate"
              value={completionRate}
              hint="Completed / total orders"
            />
          </Card>
        </div>

        {/* Timeline */}
        <Card>
          <div className="text-sm font-semibold mb-2">Timeline</div>
          <div className="grid gap-3 md:grid-cols-2 text-sm">
            <div>
              <div className="text-xs text-gray-500 uppercase">
                First order
              </div>
              <div className="mt-0.5">
                {first_order_at
                  ? new Date(first_order_at).toLocaleString()
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">
                Last order
              </div>
              <div className="mt-0.5">
                {last_order_at
                  ? new Date(last_order_at).toLocaleString()
                  : "—"}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}