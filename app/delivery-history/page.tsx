"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { deliveries as seedDeliveries, type Delivery, type DeliveryStatus } from "../lib/data";
import { getAllDeliveries } from "../lib/store";

const STATUS_STYLES: Record<DeliveryStatus, string> = {
  Delivered: "bg-green-100 text-green-700",
  "In Transit": "bg-blue-100 text-blue-700",
  Pending: "bg-yellow-100 text-yellow-700",
};

type SortKey = "id" | "date" | "productName" | "qty" | "supplier" | "po" | "signedBy" | "status";
type SortDir = "asc" | "desc";

function parseDate(str: string): number {
  const d = new Date(str);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

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

export default function DeliveryHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | "All">("All");
  const [deliveries, setDeliveries] = useState<Delivery[]>(seedDeliveries);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "date", dir: "desc" });

  useEffect(() => {
    setDeliveries(getAllDeliveries());
  }, []);

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  }

  const filtered = deliveries.filter((d) => {
    const matchesSearch =
      d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.po.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sort.key === "qty") cmp = a.qty - b.qty;
    else if (sort.key === "date") cmp = parseDate(a.date) - parseDate(b.date);
    else cmp = String(a[sort.key]).localeCompare(String(b[sort.key]));
    return sort.dir === "asc" ? cmp : -cmp;
  });

  function Th({ col, label, center, sticky }: { col: SortKey; label: string; center?: boolean; sticky?: boolean }) {
    return (
      <th
        className={`p-3 sm:p-4 border-b cursor-pointer select-none hover:bg-black/5 whitespace-nowrap ${center ? "text-center" : ""} ${sticky ? "sticky left-0 z-20 bg-blue-200" : ""}`}
        onClick={() => toggleSort(col)}
      >
        {label}
        <SortArrow active={sort.key === col} dir={sort.dir} />
      </th>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 text-black">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          &larr; Back to Dashboard
        </Link>

        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight">Delivery History</h1>
        </div>

        {/* Search + Filter bar */}
        <div className="bg-white p-3 sm:p-4 rounded-t-lg border-x border-t border-gray-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by delivery ID, product, supplier, or PO..."
              className="input-themed block w-full pl-10 pr-3 py-2 text-black placeholder-gray-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input-themed py-2 px-3 text-sm text-black w-full sm:w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DeliveryStatus | "All")}
          >
            <option value="All">All Statuses</option>
            <option value="Delivered">Delivered</option>
            <option value="In Transit">In Transit</option>
            <option value="Pending">Pending</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white shadow-md rounded-b-lg overflow-x-auto border border-gray-200">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead className="table-header-accent">
              <tr>
                <Th col="id" label="Delivery ID" sticky />
                <Th col="date" label="Date" />
                <Th col="productName" label="Product" />
                <Th col="qty" label="Qty" center />
                <Th col="supplier" label="Supplier" />
                <Th col="po" label="PO #" />
                <Th col="signedBy" label="Signed By" />
                <Th col="status" label="Status" center />
              </tr>
            </thead>
            <tbody>
              {sorted.length > 0 ? (
                sorted.map((d) => (
                  <tr key={d.id} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                    <td className="p-3 sm:p-4 font-mono font-bold text-sm sticky left-0 z-10 bg-white shadow-[1px_0_0_#e5e7eb]">{d.id}</td>
                    <td className="p-3 sm:p-4 text-sm whitespace-nowrap">{d.date}</td>
                    <td className="p-3 sm:p-4">
                      <Link href={`/inventory/${d.productId}`} className="font-bold hover:underline text-blue-600">
                        {d.productName}
                      </Link>
                    </td>
                    <td className="p-3 sm:p-4 text-center font-mono">{d.qty}</td>
                    <td className="p-3 sm:p-4 text-sm text-gray-700">{d.supplier}</td>
                    <td className="p-3 sm:p-4 font-mono text-sm">{d.po}</td>
                    <td className="p-3 sm:p-4 text-sm text-gray-600">
                      {d.signedBy || <span className="italic text-gray-400">—</span>}
                    </td>
                    <td className="p-3 sm:p-4 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase whitespace-nowrap ${STATUS_STYLES[d.status]}`}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-gray-500 italic">
                    No deliveries found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary counts */}
        <div className="mt-6 flex flex-wrap gap-3 sm:gap-4">
          {(["Delivered", "In Transit", "Pending"] as DeliveryStatus[]).map((s) => {
            const count = deliveries.filter((d) => d.status === s).length;
            return (
              <div key={s} className="bg-white rounded-lg border border-gray-200 px-4 sm:px-5 py-3 flex items-center gap-3 shadow-sm">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase whitespace-nowrap ${STATUS_STYLES[s]}`}>{s}</span>
                <span className="text-2xl font-black">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
