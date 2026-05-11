"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Import your Builder and Blueprint!
import { DataTable } from "@/components/ui/DataTable";
import { getPurchaseOrderColumns, PurchaseOrderItem } from "@/components/columns/PurchaseOrder";

function ConfirmDeleteModal({
  po,
  onConfirm,
  onClose,
}: {
  po: PurchaseOrderItem;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl border-2 border-black shadow-xl p-6 sm:p-8 w-full max-w-sm">
        <h2 className="text-lg font-black uppercase tracking-tight mb-2">Delete Purchase Order</h2>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete PO{" "}
          <span className="font-mono font-bold text-black">{po.po_number}</span>?{" "}
          This will also remove all associated materials and cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition"
          >
            Delete
          </button>
          <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md transition flex-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const supabase = createClient();

  const [allPOs, setAllPOs] = useState<PurchaseOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrderItem | null>(null);

  useEffect(() => {
    async function loadData() {
      // Pulling from the exact new tables based on your screenshots
      const { data, error } = await supabase
        .from("purchase_order")
        .select(`
          po_number, 
          date, 
          status, 
          location_id,
          location ( name ),
          purchase_order_materials ( id )
        `);

      if (error) {
        setError(error.message);
      } else {
        // Map the database relationships to our flat column structure
        const formattedData: PurchaseOrderItem[] = (data || []).map((po: any) => {
          const locData = Array.isArray(po.location) ? po.location[0] : po.location;
          return {
            po_number: po.po_number,
            date: po.date,
            status: po.status || "Pending",
            location_name: locData?.name || po.location_id || "Unknown Location",
            items_count: po.purchase_order_materials?.length || 0,
          };
        });

        // Sort descending by date by default
        formattedData.sort((a, b) => {
           if (!a.date) return 1;
           if (!b.date) return -1;
           return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        setAllPOs(formattedData);
      }
      setLoading(false);
    }
    
    loadData();
  }, [supabase]);

  async function handleDelete(po: PurchaseOrderItem) {
    // Delete the child items first, then the header
    await supabase.from("purchase_order_materials").delete().eq("po_number", po.po_number);
    await supabase.from("purchase_order").delete().eq("po_number", po.po_number);
    
    // Remove it from the local UI instantly
    setAllPOs((prev) => prev.filter((p) => p.po_number !== po.po_number));
    setDeleteTarget(null);
  }

  // Handle standard searches
  const filtered = allPOs.filter((po) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      po.po_number.toLowerCase().includes(q) ||
      po.location_name.toLowerCase().includes(q);
    const matchStatus = statusFilter === "All" || po.status === statusFilter;
    return matchSearch && matchStatus;
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
          <Link href="/purchase-order"  className="btn-accent px-4 py-2 shrink-0 text-sm">
            + New Purchase Order
          </Link>
        </div>

        {/* Search + filters */}
        <div className="bg-white p-3 sm:p-4 rounded-t-xl border-x border-t border-gray-200 flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[180px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by PO # or location…"
              className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="In Transit">In Transit</option>
              <option value="Received">Received</option>
            </select>
          </div>
        </div>

        {/* Builder Table */}
        <div className="bg-white shadow-md rounded-b-xl overflow-hidden border border-gray-200">
          {loading ? (
             <div className="p-10 text-center text-gray-500 font-medium">Loading purchase orders...</div>
          ) : error ? (
             <div className="p-10 text-center text-red-500 font-bold">{error}</div>
          ) : (
            <DataTable 
              columns={getPurchaseOrderColumns(setDeleteTarget)} 
              data={filtered} 
              // Set default role so action buttons display
              role={"project_manager" as any} 
              // Enable full row click 
              onRowClick={(row) => router.push(`/purchase-orders/${row.po_number}`)}
            />
          )}
        </div>
      </div>
    </div>
  );
}