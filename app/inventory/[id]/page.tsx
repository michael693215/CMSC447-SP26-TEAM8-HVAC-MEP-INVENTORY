"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getProductById, getPurchaseOrdersForProduct } from "../../lib/data";
import type { PurchaseOrderStatus } from "../../lib/data";

const PO_STATUS_STYLES: Record<PurchaseOrderStatus, string> = {
  Received: "bg-green-100 text-green-700",
  "In Transit": "bg-blue-100 text-blue-700",
  Pending: "bg-yellow-100 text-yellow-700",
};

export default function ProductDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const product = getProductById(id);
  const allPOs = getPurchaseOrdersForProduct(id);

  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | "All">("All");

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-black px-4">
        <p className="text-2xl font-bold mb-4">Product not found.</p>
        <Link href="/inventory" className="text-blue-600 hover:underline">
          &larr; Back to Inventory
        </Link>
      </div>
    );
  }

  const inStock = product.qty;
  const receiving = allPOs
    .filter((po) => po.status === "Pending" || po.status === "In Transit")
    .reduce((sum, po) => {
      const item = po.items.find((i) => i.productId === id);
      return sum + (item?.qty ?? 0);
    }, 0);
  const total = inStock + receiving;

  const filteredPOs = statusFilter === "All"
    ? allPOs
    : allPOs.filter((po) => po.status === statusFilter);

  return (
    <div className="min-h-screen p-4 sm:p-8 text-black">
      <div className="max-w-4xl mx-auto">
        <Link href="/inventory" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          &larr; Back to Inventory
        </Link>

        {/* Product header card */}
        <div className="bg-blue-200 border-2 border-black rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 shadow-lg">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-1">
              {product.category}
            </p>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight mb-2">{product.name}</h1>
            <p className="text-gray-700 text-base sm:text-lg">{product.description}</p>
          </div>
          <span className={`self-start px-3 py-1 rounded text-xs font-bold uppercase whitespace-nowrap ${
            product.status === "Low Stock" ? "bg-red-100 text-red-700"
            : product.status === "Out of Stock" ? "bg-gray-200 text-gray-600"
            : "bg-green-100 text-green-700"
          }`}>
            {product.status}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">In Stock</p>
            <p className="text-5xl font-black">{inStock}</p>
            <p className="text-xs text-gray-500 mt-1">units</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Receiving</p>
            <p className="text-5xl font-black text-yellow-600">{receiving}</p>
            <p className="text-xs text-gray-500 mt-1">units on order</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Total</p>
            <p className="text-5xl font-black text-blue-700">{total}</p>
            <p className="text-xs text-gray-500 mt-1">in stock + receiving</p>
          </div>
        </div>

        {/* Purchase orders table header */}
        <div className="mb-4 flex flex-wrap justify-between items-center gap-3">
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight">Associated Purchase Orders</h2>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PurchaseOrderStatus | "All")}
              className="input-themed text-sm px-2 py-1"
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="In Transit">In Transit</option>
              <option value="Received">Received</option>
            </select>
          </div>
        </div>

        {allPOs.length > 0 ? (
          <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-200">
            <table className="w-full min-w-[600px] text-left border-collapse">
              <thead className="table-header-accent">
                <tr>
                  <th className="p-3 sm:p-4 border-b sticky left-0 z-20 bg-blue-200">PO #</th>
                  <th className="p-3 sm:p-4 border-b">Order Date</th>
                  <th className="p-3 sm:p-4 border-b">Location</th>
                  <th className="p-3 sm:p-4 border-b text-center">Qty</th>
                  <th className="p-3 sm:p-4 border-b text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPOs.length > 0 ? filteredPOs.map((po) => {
                  const itemQty = po.items.find((i) => i.productId === id)?.qty ?? 0;
                  return (
                  <tr key={po.id} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                    <td className="p-3 sm:p-4 font-mono font-bold text-sm sticky left-0 z-10 bg-white shadow-[1px_0_0_#e5e7eb]">
                      <Link href={`/purchase-orders/${po.id}`} className="hover:underline text-blue-700">{po.id}</Link>
                    </td>
                    <td className="p-3 sm:p-4 text-sm whitespace-nowrap">{po.date}</td>
                    <td className="p-3 sm:p-4 text-sm text-gray-700">{po.location}</td>
                    <td className="p-3 sm:p-4 text-center font-mono">{itemQty}</td>
                    <td className="p-3 sm:p-4 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase whitespace-nowrap ${PO_STATUS_STYLES[po.status]}`}>
                        {po.status}
                      </span>
                    </td>
                  </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500 italic">
                      No purchase orders match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {allPOs.some((po) => po.notes) && (
              <div className="p-4 border-t border-gray-200">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Notes</p>
                {allPOs
                  .filter((po) => po.notes)
                  .map((po) => (
                    <p key={po.id} className="text-sm text-gray-700">
                      <span className="font-mono font-bold">{po.id}</span>: {po.notes}
                    </p>
                  ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-gray-500 italic">
            No purchase orders recorded for this product.
          </div>
        )}
      </div>
    </div>
  );
}
