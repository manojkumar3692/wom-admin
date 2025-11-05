import React, { useEffect, useMemo, useState } from "react";
import { listProducts, addProductAlias } from "../lib/api";

type Alias = { id: string; term: string };
type ProductRow = {
  id: string;
  canonical: string;
  brand?: string | null;
  variant?: string | null;
  aliases?: Alias[] | null;
};

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 border border-gray-200 text-gray-700 mr-1 mb-1">
      {children}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      className="ml-1 text-[11px] text-gray-400 hover:text-gray-700"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setOk(true);
        setTimeout(() => setOk(false), 1000);
      }}
    >
      {ok ? "✓" : "Copy"}
    </button>
  );
}

export default function ProductsTab() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [aliasText, setAliasText] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const data = await listProducts();
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((p) => {
      const hay = [
        p.canonical,
        p.brand || "",
        p.variant || "",
        ...(p.aliases || []).map((a) => a.term),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  async function saveAlias(productId: string) {
    const alias = aliasText.trim();
    if (!alias) return;
    await addProductAlias(productId, alias);

    // Optimistic UI update
    setRows((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              aliases: [...(p.aliases || []), { id: crypto.randomUUID?.() || alias, term: alias }],
            }
          : p
      )
    );
    setAliasText("");
    setAdding(null);
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-semibold">Products</div>
        <input
          placeholder="Search (canonical / brand / alias)"
          className="border rounded px-3 py-1.5 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Canonical</th>
              <th className="py-2">Brand</th>
              <th className="py-2">Variant</th>
              <th className="py-2">Aliases</th>
              <th className="py-2 w-56">Add Alias</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-t align-top">
                  <td className="py-2">
                    <b>{p.canonical}</b>
                    <div className="text-[11px] text-gray-400">
                      {p.id} <CopyButton text={p.id} />
                    </div>
                  </td>
                  <td className="py-2">{p.brand || "—"}</td>
                  <td className="py-2">{p.variant || "—"}</td>
                  <td className="py-2">
                    {(p.aliases || []).length ? (
                      p.aliases!.map((a) => <Chip key={a.id}>{a.term}</Chip>)
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-2">
                    {adding === p.id ? (
                      <div className="flex gap-1">
                        <input
                          className="border rounded px-2 py-1 flex-1 text-sm"
                          autoFocus
                          placeholder="e.g., almarai full fat"
                          value={aliasText}
                          onChange={(e) => setAliasText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveAlias(p.id)}
                        />
                        <button className="px-2 bg-black text-white rounded text-sm" onClick={() => saveAlias(p.id)}>
                          Add
                        </button>
                        <button className="px-2 border rounded text-sm" onClick={() => setAdding(null)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        className="px-2 py-1 border rounded text-sm hover:bg-gray-50"
                        onClick={() => {
                          setAdding(p.id);
                          setAliasText("");
                        }}
                      >
                        + Add alias
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}