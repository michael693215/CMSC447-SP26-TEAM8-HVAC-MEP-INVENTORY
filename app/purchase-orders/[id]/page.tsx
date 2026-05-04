"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { findPurchaseOrderById } from "../../lib/store";
import type { PurchaseOrderStatus, PurchaseOrder } from "../../lib/data";

const PO_STATUS_STYLES: Record<PurchaseOrderStatus, string> = {
  Received: "bg-green-100 text-green-700",
  "In Transit": "bg-blue-100 text-blue-700",
  Pending: "bg-yellow-100 text-yellow-700",
};

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const [po, setPo] = useState<PurchaseOrder | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPo(findPurchaseOrderById(String(params.id)));
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-black">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-black px-4">
        <p className="text-2xl font-bold mb-4">Purchase order not found.</p>
        <Link href="/purchase-orders" className="text-blue-600 hover:underline">
          &larr; Back to Purchase Orders
        </Link>
      </div>
    );
  }

  const totalQty = po.items.reduce((sum, item) => sum + item.qty, 0);

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
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight mb-3">{po.id}</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-700">
              <span><span className="font-semibold">Location:</span> {po.location}</span>
              <span><span className="font-semibold">Order Date:</span> {po.date}</span>
            </div>
            {po.notes && (
              <p className="mt-2 text-sm text-gray-600 italic"><span className="font-semibold not-italic">Specifications:</span> {po.notes}</p>
            )}
          </div>
          <span className={`self-start px-3 py-1 rounded text-xs font-bold uppercase whitespace-nowrap ${PO_STATUS_STYLES[po.status]}`}>
            {po.status}
          </span>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Products</p>
            <p className="text-4xl sm:text-5xl font-black">{po.items.length}</p>
            <p className="text-xs text-gray-500 mt-1">line items</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Total Units</p>
            <p className="text-4xl sm:text-5xl font-black text-blue-700">{totalQty}</p>
            <p className="text-xs text-gray-500 mt-1">across all products</p>
          </div>
        </div>

        {/* Products table */}
        <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight mb-4">Products</h2>
        <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="table-header-accent">
              <tr>
                <th className="p-3 sm:p-4 border-b sticky left-0 z-20 bg-blue-200">#</th>
                <th className="p-3 sm:p-4 border-b">Product</th>
                <th className="p-3 sm:p-4 border-b text-center">Quantity</th>
                {po.items.some((item) => item.productId > 0) && (
                  <th className="p-3 sm:p-4 border-b">View</th>
                )}
              </tr>
            </thead>
            <tbody>
              {po.items.map((item, idx) => (
                <React.Fragment key={idx}>
                  <tr className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                    <td className="p-3 sm:p-4 text-sm text-gray-500 font-mono sticky left-0 z-10 bg-white shadow-[1px_0_0_#e5e7eb]">
                      {idx + 1}
                    </td>
                    <td className="p-3 sm:p-4 font-semibold">{item.productName}</td>
                    <td className="p-3 sm:p-4 text-center font-mono text-lg font-bold">{item.qty}</td>
                    {po.items.some((i) => i.productId > 0) && (
                      <td className="p-3 sm:p-4">
                        {item.productId > 0 ? (
                          <Link
                            href={`/inventory/${item.productId}`}
                            className="text-xs bg-blue-200 hover:bg-gray-800 hover:text-white px-3 py-1 rounded border border-black transition font-bold whitespace-nowrap"
                          >
                            View Product
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400 italic">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                  {item.specs && (
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <td />
                      <td colSpan={po.items.some((i) => i.productId > 0) ? 3 : 2} className="px-3 pb-2 pt-0 sm:px-4">
                        <p className="text-xs text-gray-500 whitespace-pre-line leading-relaxed">{item.specs}</p>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
