"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { getProductDetailBySku } from "./actions"; 
import { routerServerGlobal } from "next/dist/server/lib/router-utils/router-server-context";

const PO_STATUS_STYLES: Record<string, string> = {
  "Received": "bg-green-100 text-green-700",
  "received": "bg-green-100 text-green-700",
  "Completed": "bg-green-100 text-green-700",
  "completed": "bg-green-100 text-green-700",
  "In Transit": "bg-blue-100 text-blue-700",
  "in transit": "bg-blue-100 text-blue-700",
  "Pending": "bg-yellow-100 text-yellow-700",
  "pending": "bg-yellow-100 text-yellow-700",
};

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sku = params.id as string; 
  
  const [product, setProduct] = useState<any>(null);
  const [allPOs, setAllPOs] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Defaulting to "All"
  const [statusFilter, setStatusFilter] = useState<string>("All");

  useEffect(() => {
    async function loadDetail() {
      const data = await getProductDetailBySku(sku);
      if (data) {
        setProduct(data.product);
        setAllPOs(data.allPOs);
        setLocations(data.locations);
      }
      setIsLoading(false);
    }
    loadDetail();
  }, [sku]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-500 px-4 font-medium">
        Loading material details...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-black px-4">
        <p className="text-2xl font-bold mb-4">Product not found in database.</p>
        <Link href="/inventory" className="text-blue-600 hover:underline">
          &larr; Back to Inventory
        </Link>
      </div>
    );
  }

  const inStock = product.qty;
  
  // Calculate how many are actively on their way (ignoring completed/received ones)
  const receiving = allPOs
    .filter((po) => po.status.toLowerCase() === "pending" || po.status.toLowerCase() === "in transit")
    .reduce((sum, po) => {
      const item = po.items.find((i: any) => i.productId === sku);
      return sum + (item?.qty ?? 0);
    }, 0);
    
  const total = inStock + receiving;

  // Case-insensitive filtering for the table
  const filteredPOs = statusFilter === "All"
    ? allPOs
    : allPOs.filter((po) => po.status.toLowerCase() === statusFilter.toLowerCase());

  return (
    <div className="min-h-screen p-4 sm:p-8 text-black">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.back() } className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          &larr; Back to Inventory
        </button>

        {/* Product header card */}
        <div className="bg-blue-200 border-2 border-black rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 shadow-lg">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-1 flex items-center gap-2">
              <span>{product.category}</span>
              <span className="text-gray-400">|</span>
              <span className="text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-300">SKU: {product.sku}</span>
            </p>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight mb-2">{product.name}</h1>
            <p className="text-gray-700 text-base sm:text-lg">{product.description}</p>
          </div>
          <span className={`self-start px-3 py-1 rounded text-xs font-bold uppercase whitespace-nowrap border border-black/10 shadow-sm ${
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
            <p className="text-5xl font-black text-gray-900">{inStock}</p>
            <p className="text-xs text-gray-500 mt-1">units across locations</p>
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

        {/* Stock Locations List */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight mb-4">Stock Locations</h2>
          {locations.length > 0 ? (
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="p-3 sm:p-4 text-xs font-bold uppercase tracking-wider text-gray-500">Location Name</th>
                    <th className="p-3 sm:p-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Quantity Available</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((loc, idx) => (
                    <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="p-3 sm:p-4 font-medium text-gray-900">{loc.name}</td>
                      <td className="p-3 sm:p-4 font-mono font-bold text-blue-700 text-right text-lg">{loc.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500 italic">
              No stock currently available at any location.
            </div>
          )}
        </div>

        {/* Purchase orders table header */}
        <div className="mb-4 flex flex-wrap justify-between items-center gap-3">
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight">Associated Purchase Orders</h2>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-themed text-sm px-2 py-1.5 border border-gray-300 rounded-md"
            >
              <option value="All">All</option>
              <option value="pending">Pending</option>
              <option value="in transit">In Transit</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {allPOs.length > 0 ? (
          <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-200">
            <table className="w-full min-w-[600px] text-left border-collapse">
              <thead className="table-header-accent bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3 sm:p-4 border-b sticky left-0 z-20 bg-blue-200">PO #</th>
                  <th className="p-3 sm:p-4 border-b">Order Date</th>
                  <th className="p-3 sm:p-4 border-b">Dest. Location</th>
                  <th className="p-3 sm:p-4 border-b text-center">Qty Pending</th>
                  <th className="p-3 sm:p-4 border-b text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPOs.length > 0 ? filteredPOs.map((po) => {
                  const itemQty = po.items.find((i: any) => i.productId === sku)?.qty ?? 0;
                  return (
                  <tr key={po.id} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                    <td className="p-3 sm:p-4 font-mono font-bold text-sm sticky left-0 z-10 bg-white shadow-[1px_0_0_#e5e7eb]">
                      {/* FIXED: Changed text-blue-700 to text-black here */}
                      <Link href={`/purchase-orders/${po.id}`} className="hover:underline text-black">{po.id}</Link>
                    </td>
                    <td className="p-3 sm:p-4 text-sm whitespace-nowrap">{po.date || "—"}</td>
                    <td className="p-3 sm:p-4 text-sm text-gray-700">{po.location}</td>
                    <td className="p-3 sm:p-4 text-center font-mono text-lg font-bold">{itemQty}</td>
                    <td className="p-3 sm:p-4 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase whitespace-nowrap ${PO_STATUS_STYLES[po.status] || "bg-gray-100 text-gray-600"}`}>
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
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-gray-500 italic">
            No active purchase orders recorded for this product yet.
          </div>
        )}
      </div>
    </div>
  );
}