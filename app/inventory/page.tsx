"use client";

import React, { useState } from "react";
import Link from "next/link";
import { products } from "../lib/data";

type SortKey = "name" | "category" | "qty" | "status" | "deliveries";
type SortDir = "asc" | "desc";

const STATUS_ORDER = { "Out of Stock": 0, "Low Stock": 1, "In Stock": 2 };

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 text-gray-400 text-xs">↕</span>;
  return <span className="ml-1 text-xs">{dir === "asc" ? "↑" : "↓"}</span>;
}

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "name", dir: "asc" });

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  }

  const filtered = products.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sort.key === "qty") {
      cmp = a.qty - b.qty;
    } else if (sort.key === "deliveries") {
      cmp = a.deliveryIds.length - b.deliveryIds.length;
    } else if (sort.key === "status") {
      cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    } else {
      cmp = String(a[sort.key]).localeCompare(String(b[sort.key]));
    }
    return sort.dir === "asc" ? cmp : -cmp;
  });

  function Th({ col, label, center }: { col: SortKey; label: string; center?: boolean }) {
    return (
      <th
        className={`p-4 border-b cursor-pointer select-none hover:bg-black/5 whitespace-nowrap ${center ? "text-center" : ""}`}
        onClick={() => toggleSort(col)}
      >
        {label}
        <SortArrow active={sort.key === col} dir={sort.dir} />
      </th>
    );
  }

  return (
    <div className="min-h-screen p-8 text-black">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          ← Back to Main Menu
        </Link>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold uppercase tracking-tight">Inventory Management</h1>
          <button className="btn-accent px-4 py-2">+ Add New Product</button>
        </div>

        {/* Search bar */}
        <div className="bg-white p-4 rounded-t-lg border-x border-t border-gray-200">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by part name or description..."
              className="input-themed block w-full pl-10 pr-3 py-2 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow-md rounded-b-lg overflow-hidden border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="table-header-accent">
              <tr>
                <Th col="name" label="Product" />
                <th className="p-4 border-b">Description</th>
                <Th col="category" label="Category" />
                <Th col="qty" label="Quantity" center />
                <Th col="status" label="Status" />
                <Th col="deliveries" label="Deliveries" center />
              </tr>
            </thead>
            <tbody>
              {sorted.length > 0 ? (
                sorted.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50 transition-colors border-b border-gray-100 cursor-pointer"
                  >
                    <td className="p-4 font-bold">
                      <Link href={`/inventory/${item.id}`} className="hover:underline text-black">
                        {item.name}
                      </Link>
                    </td>
                    <td className="p-4 text-gray-600 italic text-sm">{item.description}</td>
                    <td className="p-4 text-sm text-gray-700">{item.category}</td>
                    <td className="p-4 text-center font-mono">{item.qty}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                          item.status === "Low Stock"
                            ? "bg-red-100 text-red-700"
                            : item.status === "Out of Stock"
                            ? "bg-gray-200 text-gray-600"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <Link
                        href={`/inventory/${item.id}`}
                        className="text-xs bg-blue-200 hover:bg-gray-800 hover:text-white px-3 py-1 rounded border border-black transition font-bold"
                      >
                        View ({item.deliveryIds.length})
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-500 italic">
                    No product found matching &ldquo;{searchTerm}&rdquo;
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
