"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getAllPurchaseOrders } from "../lib/store";
import type { PurchaseOrderStatus, PurchaseOrder } from "../lib/data";

const PO_STATUS_STYLES: Record<PurchaseOrderStatus, string> = {
  Received: "bg-green-100 text-green-700",
  "In Transit": "bg-blue-100 text-blue-700",
  Pending: "bg-yellow-100 text-yellow-700",
};

type SortKey = "id" | "date" | "items" | "supplier" | "status";
type SortDir = "asc" | "desc";

const STATUS_ORDER: Record<PurchaseOrderStatus, number> = { Pending: 0, "In Transit": 1, Received: 2 };

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return (
    <svg xmlns="http://www.w3.org/2000/svg" className="inline w-3 h-3 ml-1 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
      <path d="M5 12l5-5 5 5H5z" />
    </svg>
  );
  return dir === "asc" ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="inline w-3 h-3 ml-1" viewBox="0 0 20 20" fill="currentColor">
      <path d="M5 12l5-5 5 5H5z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="inline w-3 h-3 ml-1" viewBox="0 0 20 20" fill="currentColor">
      <path d="M15 8l-5 5-5-5h10z" />
    </svg>
  );
}

export default function PurchaseOrdersPage() {
  const [allPOs, setAllPOs] = useState<PurchaseOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | "All">("All");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "id", dir: "asc" });

  useEffect(() => {
    setAllPOs(getAllPurchaseOrders());
  }, []);

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  }

  const filtered = allPOs.filter((po) => {
    const matchesSearch =
      po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.items.some((item) => item.productName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "All" || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sort.key === "items") cmp = a.items.length - b.items.length;
    else if (sort.key === "status") cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    else cmp = String(a[sort.key]).localeCompare(String(b[sort.key]));
    return sort.dir === "asc" ? cmp : -cmp;
  });

  function Th({ col, label, center }: { col: SortKey; label: string; center?: boolean }) {
    return (
      <th
        className={`p-3 sm:p-4 border-b cursor-pointer select-none whitespace-nowrap hover:bg-black/5 ${center ? "text-center" : ""}`}
        onClick={() => toggleSort(col)}
      >
        {label}
        <SortArrow active={sort.key === col} dir={sort.dir} />
      </th>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 text-black">
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
              placeholder="Search by PO #, supplier, or product..."
              className="input-themed block w-full pl-10 pr-3 py-2 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as PurchaseOrderStatus | "All")}
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
          <table className="w-full min-w-[560px] text-left border-collapse">
            <thead className="table-header-accent">
              <tr>
                <th
                  className="p-3 sm:p-4 border-b cursor-pointer select-none whitespace-nowrap sticky left-0 z-20 bg-blue-200 hover:bg-blue-300"
                  onClick={() => toggleSort("id")}
                >
                  PO # <SortArrow active={sort.key === "id"} dir={sort.dir} />
                </th>
                <Th col="date" label="Order Date" />
                <th className="p-3 sm:p-4 border-b whitespace-nowrap">Expected</th>
                <Th col="items" label="Products" center />
                <Th col="supplier" label="Supplier" />
                <Th col="status" label="Status" />
              </tr>
            </thead>
            <tbody>
              {sorted.length > 0 ? sorted.map((po) => (
                <tr key={po.id} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                  <td className="p-3 sm:p-4 font-mono font-bold text-sm sticky left-0 z-10 bg-white shadow-[1px_0_0_#e5e7eb]">
                    <Link href={`/purchase-orders/${po.id}`} className="hover:underline text-blue-700">
                      {po.id}
                    </Link>
                  </td>
                  <td className="p-3 sm:p-4 text-sm whitespace-nowrap">{po.date}</td>
                  <td className="p-3 sm:p-4 text-sm whitespace-nowrap">{po.expectedDate}</td>
                  <td className="p-3 sm:p-4 text-center">
                    <Link
                      href={`/purchase-orders/${po.id}`}
                      className="text-xs bg-blue-200 hover:bg-gray-800 hover:text-white px-3 py-1 rounded border border-black transition font-bold whitespace-nowrap"
                    >
                      {po.items.length} {po.items.length === 1 ? "product" : "products"}
                    </Link>
                  </td>
                  <td className="p-3 sm:p-4 text-sm text-gray-700">{po.supplier}</td>
                  <td className="p-3 sm:p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase whitespace-nowrap ${PO_STATUS_STYLES[po.status]}`}>
                      {po.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-500 italic">
                    No purchase orders match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
