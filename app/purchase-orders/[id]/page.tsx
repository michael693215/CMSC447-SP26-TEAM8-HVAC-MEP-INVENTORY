"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STATUS_STYLES: Record<string, string> = {
  Received:     "bg-green-100 text-green-700",
  "In Transit": "bg-blue-100 text-blue-700",
  Pending:      "bg-yellow-100 text-yellow-700",
};

interface MaterialRow {
  line_number: number;
  product_name: string | null;
  quantity: number | null;
}

interface PODetail {
  PO_number: string;
  date: string | null;
  status: string | null;
  location: string | null;
  po_materials: MaterialRow[];
}

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const [po, setPo] = useState<PODetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("purchase_order")
        .select("PO_number, date, status, location, po_materials(line_number, product_name, quantity)")
        .eq("PO_number", String(params.id))
        .maybeSingle();

      if (error) setError(error.message);
      else if (!data) setError("not_found");
      else setPo(data as unknown as PODetail);
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-black">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (error === "not_found" || !po) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-black px-4">
        <p className="text-2xl font-bold mb-4">Purchase order not found.</p>
        <Link href="/purchase-orders" className="text-blue-600 hover:underline">
          &larr; Back to Purchase Orders
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-black px-4">
        <p className="text-red-500 mb-4">{error}</p>
        <Link href="/purchase-orders" className="text-blue-600 hover:underline">
          &larr; Back to Purchase Orders
        </Link>
      </div>
    );
  }

  const totalQty = po.po_materials.reduce((sum, m) => sum + (m.quantity ?? 0), 0);
  const sorted = [...po.po_materials].sort((a, b) => a.line_number - b.line_number);

  return (
    <div className="min-h-screen p-4 sm:p-8 text-black">
      <div className="max-w-3xl mx-auto">
        <Link href="/purchase-orders" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          &larr; Back to Purchase Orders
        </Link>

        {/* Header card */}
        <div className="bg-blue-200 border-2 border-black rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 shadow-lg">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-1">Purchase Order</p>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight mb-3">{po.PO_number}</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-700">
              {po.location && <span><span className="font-semibold">Location:</span> {po.location}</span>}
              {po.date && <span><span className="font-semibold">Order Date:</span> {po.date}</span>}
            </div>
          </div>
          {po.status && (
            <span className={`self-start px-3 py-1 rounded text-xs font-bold uppercase whitespace-nowrap ${STATUS_STYLES[po.status] ?? "bg-gray-100 text-gray-600"}`}>
              {po.status}
            </span>
          )}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Line Items</p>
            <p className="text-4xl sm:text-5xl font-black">{po.po_materials.length}</p>
            <p className="text-xs text-gray-500 mt-1">materials</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Total Units</p>
            <p className="text-4xl sm:text-5xl font-black text-blue-700">{totalQty}</p>
            <p className="text-xs text-gray-500 mt-1">across all items</p>
          </div>
        </div>

        {/* Materials table */}
        <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight mb-4">Materials</h2>
        <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="table-header-accent">
              <tr>
                <th className="p-3 sm:p-4 border-b sticky left-0 z-20 bg-blue-200">#</th>
                <th className="p-3 sm:p-4 border-b">Product</th>
                <th className="p-3 sm:p-4 border-b text-center">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length > 0 ? sorted.map((item) => (
                <tr key={item.line_number} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                  <td className="p-3 sm:p-4 text-sm text-gray-500 font-mono sticky left-0 z-10 bg-white shadow-[1px_0_0_#e5e7eb]">
                    {item.line_number}
                  </td>
                  <td className="p-3 sm:p-4 font-semibold">{item.product_name ?? "—"}</td>
                  <td className="p-3 sm:p-4 text-center font-mono text-lg font-bold">{item.quantity ?? "—"}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="p-10 text-center text-gray-500 italic">No materials on this order.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
