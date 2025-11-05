// src/components/OrderCard.tsx
import React, { useState, useMemo } from "react";
import { updateStatus, aiFixOrder } from "../lib/api";
import { timeAgo } from "../lib/timeAgo";

type Item = { qty?: number; unit?: string | null; canonical?: string | null; name?: string | null };

type Order = {
  id: string;
  created_at: string;
  status: "pending" | "shipped" | "paid";
  customer_name?: string | null;
  source_phone?: string | null;
  raw_text?: string | null;
  audio_url?: string | null;
  items?: Item[];
  parse_reason?: string | null;
};

export default function OrderCard({ o, onChange }: { o: Order; onChange: () => void }) {
  const [fixOpen, setFixOpen] = useState(false);
  const [fixText, setFixText] = useState("");
  const [reason, setReason] = useState("");

  const createdAgo = useMemo(() => timeAgo(o.created_at), [o.created_at]);

  const itemsDisplay = useMemo(() => {
    if (!o.items?.length) return "";
    return o.items
      .map((i) => {
        const q = i.qty ?? "";
        const u = i.unit ? ` ${i.unit}` : "";
        const n = i.canonical || i.name || "";
        return `${q}${u} ${n}`.trim();
      })
      .join(" · ");
  }, [o.items]);

  function parseLines(text: string): Item[] {
    return text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const m1 = l.match(/^(\d+(?:\.\d+)?)\s+([a-zA-Z]+)\s+(.+)$/);
        if (m1) return { qty: Number(m1[1]), unit: m1[2], canonical: m1[3] };
        const m2 = l.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
        if (m2) return { qty: Number(m2[1]), canonical: m2[2] };
        return { qty: 1, canonical: l };
      });
  }

  async function submitFix() {
    const items = parseLines(fixText);
    if (!items.length) return;
    await aiFixOrder(o.id, { items, reason: reason || "human_fix" });
    setFixOpen(false);
    onChange();
  }

  async function setStatus(s: Order["status"]) {
    if (s === o.status) return;
    await updateStatus(o.id, s);
    onChange();
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-sm transition-all duration-150">
      {/* Top Row */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
        <span title={o.created_at}>{createdAgo}</span>
        <select
          className="border rounded px-1.5 py-0.5 text-xs"
          value={o.status}
          onChange={(e) => setStatus(e.target.value as any)}
        >
          <option value="pending">⏳ Pending</option>
          <option value="shipped">📦 Shipped</option>
          <option value="paid">✅ Paid</option>
        </select>
      </div>

      {/* Customer Name */}
      <div className="font-medium text-gray-800 text-sm">
        {o.customer_name || o.source_phone || "Customer"}
      </div>

      {/* Items */}
      <div className="text-gray-700 text-sm mt-1">
        {itemsDisplay || o.raw_text || <span className="text-gray-400 italic">No items parsed</span>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3">
        <button
          className="text-[12px] px-2 py-1 border rounded bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
          onClick={() => {
            setFixText(
              (o.items || [])
                .map((i) => {
                  const q = i.qty ?? "";
                  const u = i.unit ? ` ${i.unit}` : "";
                  const n = i.canonical || i.name || "";
                  return `${q}${u} ${n}`.trim();
                })
                .join("\n")
            );
            setFixOpen(true);
          }}
        >
          ✏️ Wrong Parse → Fix
        </button>

        {o.raw_text && (
          <button
            className="text-[12px] px-2 py-1 border rounded border-gray-200 hover:bg-gray-50"
            onClick={() => alert(o.raw_text)}
          >
            📝 View Raw
          </button>
        )}

        {o.audio_url && (
          <button
            className="text-[12px] px-2 py-1 border rounded border-gray-200 hover:bg-gray-50"
            onClick={() => window.open(o.audio_url, "_blank")}
          >
            🎧 Audio
          </button>
        )}
      </div>

      {/* Fix Modal */}
      {fixOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 w-full max-w-md shadow-xl">
            <div className="text-sm font-medium mb-2">Fix Items (one per line)</div>

            <textarea
              className="w-full border rounded p-2 text-sm h-32"
              value={fixText}
              onChange={(e) => setFixText(e.target.value)}
            />

            <input
              className="w-full border rounded p-2 text-sm mt-2"
              placeholder="(Optional) Reason for correction"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            <div className="flex justify-end gap-2 mt-3">
              <button className="px-3 py-1.5 border rounded" onClick={() => setFixOpen(false)}>
                Cancel
              </button>
              <button className="px-3 py-1.5 rounded bg-black text-white" onClick={submitFix}>
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}