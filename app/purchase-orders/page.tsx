"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SortableHead, type SortDir } from "@/components/ui/table";

type SortKey = "po" | "date" | "items" | "location" | "status";

const STATUS_STYLES: Record<string, string> = {
  Received:   "bg-green-100 text-green-700",
  "In Transit": "bg-blue-100 text-blue-700",
  Pending:    "bg-yellow-100 text-yellow-700",
};
const STATUS_ORDER: Record<string, number> = { Pending: 0, "In Transit": 1, Received: 2 };

interface PORow {
  PO_number: string;
  date: string | null;
  status: string | null;
  location: string | null;
  po_materials: { line_number: number }[];
}

function ConfirmDeleteModal({
  po,
  onConfirm,
  onClose,
}: {
  po: PORow;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl border-2 border-black shadow-xl p-6 sm:p-8 w-full max-w-sm">
        <h2 className="text-lg font-black uppercase tracking-tight mb-2">Delete Purchase Order</h2>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete PO{" "}
          <span className="font-mono font-bold text-black">{po.PO_number}</span>?{" "}
          This will also remove all associated materials and cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition"
          >
            Delete
          </button>
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PurchaseOrdersPage() {
  const [allPOs, setAllPOs] = useState<PORow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "po", dir: "asc" });
  const [deleteTarget, setDeleteTarget] = useState<PORow | null>(null);

  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("purchase_order")
        .select("PO_number, date, status, location, po_materials(line_number)");
      if (error) setError(error.message);
      else setAllPOs((data as unknown as PORow[]) ?? []);
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(po: PORow) {
    await supabase.from("po_materials").delete().eq("PO_number", po.PO_number);
    await supabase.from("purchase_order").delete().eq("PO_number", po.PO_number);
    setAllPOs((prev) => prev.filter((p) => p.PO_number !== po.PO_number));
    setDeleteTarget(null);
  }

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  }

  const filtered = allPOs.filter((po) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      po.PO_number.toLowerCase().includes(q) ||
      (po.location ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || po.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sort.key === "items") cmp = a.po_materials.length - b.po_materials.length;
    else if (sort.key === "status") cmp = (STATUS_ORDER[a.status ?? ""] ?? 0) - (STATUS_ORDER[b.status ?? ""] ?? 0);
    else if (sort.key === "po") cmp = a.PO_number.localeCompare(b.PO_number);
    else if (sort.key === "date") cmp = (a.date ?? "").localeCompare(b.date ?? "");
    else if (sort.key === "location") cmp = (a.location ?? "").localeCompare(b.location ?? "");
    return sort.dir === "asc" ? cmp : -cmp;
  });

  return (
    <div className="min-h-screen p-4 sm:p-8 text-black">
      {deleteTarget && (
        <ConfirmDeleteModal
          po={deleteTarget}
          onConfirm={() => handleDelete(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          &larr; Back to Dashboard
        </Link>

        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight">Purchase Orders</h1>
          <Link href="/purchase-order" className="btn-accent px-4 py-2 shrink-0 text-sm">
            + New Purchase Order
          </Link>
        </div>

        {/* Search + filters */}
        <div className="bg-white p-3 sm:p-4 rounded-t-lg border-x border-t border-gray-200 flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[180px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by PO # or location…"
              className="input-themed block w-full pl-10 pr-3 py-2 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-themed text-sm px-2 py-1.5"
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="In Transit">In Transit</option>
              <option value="Received">Received</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow-md rounded-b-lg overflow-x-auto border border-gray-200">
          {loading ? (
            <div className="p-10 text-center text-gray-500 italic">Loading purchase orders…</div>
          ) : error ? (
            <div className="p-10 text-center text-red-500">{error}</div>
          ) : (
            <table className="w-full sm:min-w-[560px] text-left border-collapse">
              <thead className="table-header-accent">
                <tr>
                  <SortableHead
                    active={sort.key === "po"} dir={sort.dir}
                    onToggle={() => toggleSort("po")} sticky
                  >
                    PO #
                  </SortableHead>
                  <SortableHead
                    active={sort.key === "date"} dir={sort.dir}
                    onToggle={() => toggleSort("date")}
                    className="hidden sm:table-cell"
                  >
                    Order Date
                  </SortableHead>
                  <SortableHead
                    active={sort.key === "items"} dir={sort.dir}
                    onToggle={() => toggleSort("items")} center
                  >
                    Materials
                  </SortableHead>
                  <SortableHead
                    active={sort.key === "location"} dir={sort.dir}
                    onToggle={() => toggleSort("location")}
                  >
                    Location
                  </SortableHead>
                  <SortableHead
                    active={sort.key === "status"} dir={sort.dir}
                    onToggle={() => toggleSort("status")}
                  >
                    Status
                  </SortableHead>
                </tr>
              </thead>
              <tbody>
                {sorted.length > 0 ? sorted.map((po) => (
                  <tr key={po.PO_number} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                    <td className="p-3 sm:p-4 font-mono font-bold text-sm sticky left-0 z-10 bg-white shadow-[1px_0_0_#e5e7eb]">
                      <Link href={`/purchase-orders/${po.PO_number}`} className="hover:underline text-blue-700">
                        {po.PO_number}
                      </Link>
                    </td>
                    <td className="hidden sm:table-cell p-3 sm:p-4 text-sm whitespace-nowrap">{po.date ?? "—"}</td>
                    <td className="p-3 sm:p-4 text-center">
                      <Link
                        href={`/purchase-orders/${po.PO_number}`}
                        className="inline-block w-28 text-center text-xs bg-blue-200 hover:bg-gray-800 hover:text-white px-3 py-1 rounded border border-black transition font-bold whitespace-nowrap"
                      >
                        {po.po_materials.length} {po.po_materials.length === 1 ? "material" : "materials"}
                      </Link>
                    </td>
                    <td className="p-3 sm:p-4 text-sm text-gray-700">{po.location ?? "—"}</td>
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase whitespace-nowrap ${STATUS_STYLES[po.status ?? ""] ?? "bg-gray-100 text-gray-600"}`}>
                          {po.status ?? "—"}
                        </span>
                        <button
                          onClick={() => setDeleteTarget(po)}
                          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-600 text-red-600 hover:text-white transition"
                          title="Delete purchase order"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-500 italic">
                      No purchase orders match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
