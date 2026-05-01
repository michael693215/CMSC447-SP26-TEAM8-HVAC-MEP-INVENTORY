"use client";

import { useState } from "react";
import Link from "next/link";
import { products as seedProducts } from "../lib/data";
import type { Product } from "../lib/data";

type SortKey = "name" | "category" | "qty" | "status" | "deliveries";
type SortDir = "asc" | "desc";
type StatusFilter = "All" | "In Stock" | "Low Stock" | "Out of Stock";

const STATUS_ORDER = { "Out of Stock": 0, "Low Stock": 1, "In Stock": 2 };

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

export default function InventoryPage() {
  const [products] = useState<Product[]>(seedProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "name", dir: "asc" });
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category))).sort()];

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  }

  const filtered = products.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sort.key === "qty") cmp = a.qty - b.qty;
    else if (sort.key === "deliveries") cmp = a.deliveryIds.length - b.deliveryIds.length;
    else if (sort.key === "status") cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    else cmp = String(a[sort.key]).localeCompare(String(b[sort.key]));
    return sort.dir === "asc" ? cmp : -cmp;
  });

  function Th({ col, label, center, sticky }: { col: SortKey; label: string; center?: boolean; sticky?: boolean }) {
    return (
      <th
        className={`p-3 sm:p-4 border-b cursor-pointer select-none whitespace-nowrap ${center ? "text-center" : ""} ${sticky ? "sticky left-0 z-20 bg-blue-200 hover:bg-blue-300" : "hover:bg-black/5"}`}
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
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight">Inventory Management</h1>
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
              placeholder="Search by part name or description..."
              className="input-themed block w-full pl-10 pr-3 py-2 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-themed text-sm px-2 py-1.5"
            >
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 whitespace-nowrap">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="input-themed text-sm px-2 py-1.5"
            >
              <option value="All">All</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow-md rounded-b-lg overflow-x-auto border border-gray-200">
          <table className="w-full min-w-[600px] text-left border-collapse">
            <thead className="table-header-accent">
              <tr>
                <Th col="name" label="Product" sticky />
                <th className="p-3 sm:p-4 border-b">Description</th>
                <Th col="category" label="Category" />
                <Th col="qty" label="Qty" center />
                <Th col="status" label="Status" />
                <Th col="deliveries" label="Deliveries" center />
              </tr>
            </thead>
            <tbody>
              {sorted.length > 0 ? (
                sorted.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50 transition-colors border-b border-gray-100 cursor-pointer">
                    <td className="p-3 sm:p-4 border-b border-gray-100 font-bold whitespace-nowrap sticky left-0 z-10 bg-white shadow-[1px_0_0_#e5e7eb]">
                      <Link href={`/inventory/${item.id}`} className="hover:underline text-black">
                        {item.name}
                      </Link>
                    </td>
                    <td className="p-3 sm:p-4 text-gray-600 italic text-sm">{item.description}</td>
                    <td className="p-3 sm:p-4 text-sm text-gray-700">{item.category}</td>
                    <td className="p-3 sm:p-4 text-center font-mono">{item.qty}</td>
                    <td className="p-3 sm:p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase whitespace-nowrap ${
                        item.status === "Low Stock" ? "bg-red-100 text-red-700"
                        : item.status === "Out of Stock" ? "bg-gray-200 text-gray-600"
                        : "bg-green-100 text-green-700"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 text-center">
                      <Link
                        href={`/inventory/${item.id}`}
                        className="text-xs bg-blue-200 hover:bg-gray-800 hover:text-white px-3 py-1 rounded border border-black transition font-bold whitespace-nowrap"
                      >
                        View ({item.deliveryIds.length})
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-500 italic">
                    No products match the current filters.
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
