"use client";

import React, { useState } from "react";
import Link from "next/link";
import { products as seedProducts } from "../lib/data";
import type { Product } from "../lib/data";

type SortKey = "name" | "category" | "qty" | "status" | "deliveries";
type SortDir = "asc" | "desc";

const STATUS_ORDER = { "Out of Stock": 0, "Low Stock": 1, "In Stock": 2 };

function computeStatus(qty: number): Product["status"] {
  if (qty === 0) return "Out of Stock";
  if (qty < 5) return "Low Stock";
  return "In Stock";
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

interface AddProductForm {
  name: string;
  description: string;
  category: string;
  qty: string;
}

const EMPTY_PRODUCT_FORM: AddProductForm = {
  name: "",
  description: "",
  category: "",
  qty: "",
};

function AddProductModal({ onSave, onClose }: {
  onSave: (p: Omit<Product, "id" | "status" | "deliveryIds">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<AddProductForm>(EMPTY_PRODUCT_FORM);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ name: form.name, description: form.description, category: form.category, qty: parseInt(form.qty, 10) });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl border-2 border-black shadow-xl p-6 sm:p-8 w-full max-w-md">
        <h2 className="text-lg font-black uppercase tracking-tight mb-5">Add New Product</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. Filter 16x25x1" className="input-themed p-2 text-black w-full" required />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Description</label>
            <input name="description" value={form.description} onChange={handleChange} placeholder="Brief description..." className="input-themed p-2 text-black w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Category <span className="text-red-500">*</span>
              </label>
              <input name="category" value={form.category} onChange={handleChange} placeholder="e.g. Filters" className="input-themed p-2 text-black w-full" required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input name="qty" type="number" min="0" value={form.qty} onChange={handleChange} placeholder="0" className="input-themed p-2 text-black w-full font-mono" required />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Add Product</button>
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>(seedProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "name", dir: "asc" });
  const [showAddModal, setShowAddModal] = useState(false);

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  }

  function handleAddProduct(data: Omit<Product, "id" | "status" | "deliveryIds">) {
    const newId = Math.max(...products.map((p) => p.id)) + 1;
    setProducts((prev) => [
      ...prev,
      { ...data, id: newId, status: computeStatus(data.qty), deliveryIds: [] },
    ]);
    setShowAddModal(false);
  }

  const filtered = products.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      {showAddModal && (
        <AddProductModal onSave={handleAddProduct} onClose={() => setShowAddModal(false)} />
      )}

      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          &larr; Back to Dashboard
        </Link>

        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight">Inventory Management</h1>
          <button className="btn-accent px-4 py-2 shrink-0" onClick={() => setShowAddModal(true)}>
            + Add New Product
          </button>
        </div>

        {/* Search bar */}
        <div className="bg-white p-3 sm:p-4 rounded-t-lg border-x border-t border-gray-200">
          <div className="relative w-full">
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
