"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getProductById, getDeliveriesForProduct } from "../../lib/data";
import type { DeliveryStatus } from "../../lib/data";

const STATUS_STYLES: Record<DeliveryStatus, string> = {
  Delivered: "bg-green-100 text-green-700",
  "In Transit": "bg-blue-100 text-blue-700",
  Pending: "bg-yellow-100 text-yellow-700",
};

export default function ProductDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const product = getProductById(id);
  const productDeliveries = getDeliveriesForProduct(id);

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

  const totalReceived = productDeliveries
    .filter((d) => d.status === "Delivered")
    .reduce((sum, d) => sum + d.qty, 0);

  const totalPending = productDeliveries
    .filter((d) => d.status !== "Delivered")
    .reduce((sum, d) => sum + d.qty, 0);

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
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Current Stock</p>
            <p className="text-5xl font-black">{product.qty}</p>
            <p className="text-xs text-gray-500 mt-1">units</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Total Received</p>
            <p className="text-5xl font-black text-green-700">{totalReceived}</p>
            <p className="text-xs text-gray-500 mt-1">units delivered</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Incoming</p>
            <p className="text-5xl font-black text-yellow-600">{totalPending}</p>
            <p className="text-xs text-gray-500 mt-1">units pending / in transit</p>
          </div>
        </div>

        {/* Deliveries table */}
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-bold uppercase tracking-tight">Associated Deliveries</h2>
          <Link href="/purchase-order" className="btn-accent px-4 py-2 text-sm">
            + New Purchase Order
          </Link>
        </div>

        {productDeliveries.length > 0 ? (
          <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-200">
            <table className="w-full min-w-[600px] text-left border-collapse">
              <thead className="table-header-accent">
                <tr>
                  <th className="p-3 sm:p-4 border-b sticky left-0 z-20 bg-blue-200">Delivery ID</th>
                  <th className="p-3 sm:p-4 border-b">Date</th>
                  <th className="p-3 sm:p-4 border-b text-center">Qty</th>
                  <th className="p-3 sm:p-4 border-b">PO #</th>
                  <th className="p-3 sm:p-4 border-b">Supplier</th>
                  <th className="p-3 sm:p-4 border-b">Signed By</th>
                  <th className="p-3 sm:p-4 border-b text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {productDeliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                    <td className="p-3 sm:p-4 font-mono font-bold text-sm sticky left-0 z-10 bg-white shadow-[1px_0_0_#e5e7eb]">{d.id}</td>
                    <td className="p-3 sm:p-4 text-sm whitespace-nowrap">{d.date}</td>
                    <td className="p-3 sm:p-4 text-center font-mono">{d.qty}</td>
                    <td className="p-3 sm:p-4 font-mono text-sm">{d.po}</td>
                    <td className="p-3 sm:p-4 text-sm text-gray-700">{d.supplier}</td>
                    <td className="p-3 sm:p-4 text-sm text-gray-600">
                      {d.signedBy || <span className="italic text-gray-400">—</span>}
                    </td>
                    <td className="p-3 sm:p-4 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase whitespace-nowrap ${STATUS_STYLES[d.status]}`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {productDeliveries.some((d) => d.notes) && (
              <div className="p-4 border-t border-gray-200">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Notes</p>
                {productDeliveries
                  .filter((d) => d.notes)
                  .map((d) => (
                    <p key={d.id} className="text-sm text-gray-700">
                      <span className="font-mono font-bold">{d.id}</span>: {d.notes}
                    </p>
                  ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-gray-500 italic">
            No deliveries recorded for this product.
          </div>
        )}
      </div>
    </div>
  );
}
