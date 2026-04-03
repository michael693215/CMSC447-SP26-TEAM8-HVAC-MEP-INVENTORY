"use client";

import React, { useState } from "react";
import Link from "next/link";
import { products } from "../lib/data";

interface POForm {
  poNumber: string;
  supplier: string;
  productId: string;
  qty: string;
  expectedDate: string;
  notes: string;
  signedBy: string;
}

const EMPTY_FORM: POForm = {
  poNumber: "",
  supplier: "",
  productId: "",
  qty: "",
  expectedDate: "",
  notes: "",
  signedBy: "",
};

export default function PurchaseOrderPage() {
  const [form, setForm] = useState<POForm>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app this would POST to an API
    console.log("Purchase Order submitted:", form);
    setSubmitted(true);
  };

  const handleReset = () => {
    setForm(EMPTY_FORM);
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-black">
        <div className="bg-white rounded-2xl border-2 border-black shadow-lg p-12 max-w-md w-full text-center">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-2xl font-black uppercase mb-2">Order Submitted</h2>
          <p className="text-gray-600 mb-2">
            Purchase Order <span className="font-mono font-bold">{form.poNumber}</span> has been recorded.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            {form.qty} × {products.find((p) => p.id === Number(form.productId))?.name ?? "—"} from {form.supplier}
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={handleReset} className="btn-primary">
              + New Order
            </button>
            <Link href="/delivery-history" className="btn-secondary py-2 px-4 rounded-md">
              View Deliveries
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 text-black">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          ← Back to Main Menu
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold uppercase tracking-tight">New Purchase Order</h1>
          <p className="text-gray-500 mt-1 text-sm">Fill out the form below to create a new delivery purchase order.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* PO Number + Supplier */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  PO Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="poNumber"
                  value={form.poNumber}
                  onChange={handleChange}
                  placeholder="e.g. PO-006"
                  className="input-themed p-2 text-black w-full font-mono"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <input
                  name="supplier"
                  value={form.supplier}
                  onChange={handleChange}
                  placeholder="Supplier name"
                  className="input-themed p-2 text-black w-full"
                  required
                />
              </div>
            </div>

            {/* Product + Quantity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Product <span className="text-red-500">*</span>
                </label>
                <select
                  name="productId"
                  value={form.productId}
                  onChange={handleChange}
                  className="input-themed p-2 text-black w-full"
                  required
                >
                  <option value="">Select a product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  name="qty"
                  type="number"
                  min="1"
                  value={form.qty}
                  onChange={handleChange}
                  placeholder="0"
                  className="input-themed p-2 text-black w-full font-mono"
                  required
                />
              </div>
            </div>

            {/* Expected Date + Signed By */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Expected Delivery Date <span className="text-red-500">*</span>
                </label>
                <input
                  name="expectedDate"
                  type="date"
                  value={form.expectedDate}
                  onChange={handleChange}
                  className="input-themed p-2 text-black w-full"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Ordered By
                </label>
                <input
                  name="signedBy"
                  value={form.signedBy}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="input-themed p-2 text-black w-full"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Notes
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Any special instructions or notes..."
                rows={3}
                className="input-themed p-2 text-black w-full resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1">
                Submit Purchase Order
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary flex-1"
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
