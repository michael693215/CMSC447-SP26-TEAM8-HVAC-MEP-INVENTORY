"use client";

import React, { useState } from "react";
import Link from "next/link";
import { addPurchaseOrder, generatePOId, formatDeliveryDate } from "../lib/store";

interface LineItem {
  productName: string;
  qty: string;
}

interface POForm {
  poNumber: string;
  supplier: string;
  expectedDate: string;
  orderedBy: string;
  notes: string;
}

const EMPTY_FORM: POForm = {
  poNumber: "",
  supplier: "",
  expectedDate: "",
  orderedBy: "",
  notes: "",
};

const EMPTY_ITEM: LineItem = { productName: "", qty: "" };

function SuccessCheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function PurchaseOrderPage() {
  const [form, setForm] = useState<POForm>(EMPTY_FORM);
  const [items, setItems] = useState<LineItem[]>([{ ...EMPTY_ITEM }]);
  const [submitted, setSubmitted] = useState(false);
  const [submittedPOId, setSubmittedPOId] = useState("");

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleItemChange(idx: number, field: keyof LineItem, value: string) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const validItems = items.filter((it) => it.productName.trim() && it.qty.trim());
    if (validItems.length === 0) return;

    const poId = form.poNumber.trim() || generatePOId();
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    addPurchaseOrder({
      id: poId,
      date: today,
      expectedDate: form.expectedDate ? formatDeliveryDate(form.expectedDate) : "TBD",
      items: validItems.map((it) => ({
        productId: 0,
        productName: it.productName.trim(),
        qty: parseInt(it.qty, 10),
      })),
      status: "Pending",
      supplier: form.supplier,
      orderedBy: form.orderedBy,
      notes: form.notes,
    });

    setSubmittedPOId(poId);
    setSubmitted(true);
  }

  function handleReset() {
    setForm(EMPTY_FORM);
    setItems([{ ...EMPTY_ITEM }]);
    setSubmitted(false);
    setSubmittedPOId("");
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 text-black">
        <div className="bg-white rounded-2xl border-2 border-black shadow-lg p-8 sm:p-12 max-w-md w-full text-center mx-4">
          <div className="mb-6"><SuccessCheckIcon /></div>
          <h2 className="text-2xl font-black uppercase mb-2">Order Submitted</h2>
          <p className="text-gray-600 mb-2">
            Purchase Order <span className="font-mono font-bold">{submittedPOId}</span> has been recorded.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            {items.filter((it) => it.productName.trim()).length} product{items.filter((it) => it.productName.trim()).length !== 1 ? "s" : ""} from {form.supplier || "—"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={handleReset} className="btn-primary">+ New Order</button>
            <Link href="/purchase-orders" className="btn-secondary py-2 px-4 rounded-md text-center">
              View All Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 text-black">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          &larr; Back to Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight">New Purchase Order</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-5 sm:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">

            {/* PO Number + Supplier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">PO Number</label>
                <input
                  name="poNumber"
                  value={form.poNumber}
                  onChange={handleFormChange}
                  placeholder="Auto-generated if blank"
                  className="input-themed p-2 text-black w-full font-mono"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Supplier <span className="text-red-500">*</span>
                </label>
                <input
                  name="supplier"
                  value={form.supplier}
                  onChange={handleFormChange}
                  placeholder="Supplier name"
                  className="input-themed p-2 text-black w-full"
                  required
                />
              </div>
            </div>

            {/* Date + Ordered By */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Expected Delivery Date <span className="text-red-500">*</span>
                </label>
                <input
                  name="expectedDate"
                  type="date"
                  value={form.expectedDate}
                  onChange={handleFormChange}
                  className="input-themed p-2 text-black w-full"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Ordered By</label>
                <input
                  name="orderedBy"
                  value={form.orderedBy}
                  onChange={handleFormChange}
                  placeholder="Your name"
                  className="input-themed p-2 text-black w-full"
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  Products <span className="text-red-500">*</span>
                </label>
                <button type="button" onClick={addItem} className="text-xs font-bold text-blue-600 hover:underline">
                  + Add Product
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      value={item.productName}
                      onChange={(e) => handleItemChange(idx, "productName", e.target.value)}
                      placeholder="Product name"
                      className="input-themed p-2 text-black flex-1 text-sm"
                      required={idx === 0}
                    />
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, "qty", e.target.value)}
                      placeholder="Qty"
                      className="input-themed p-2 text-black w-20 font-mono text-sm"
                      required={idx === 0}
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                        aria-label="Remove item"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleFormChange}
                placeholder="Any special instructions or notes..."
                rows={3}
                className="input-themed p-2 text-black w-full resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button type="submit" className="btn-primary sm:flex-1">Submit Purchase Order</button>
              <button type="button" onClick={handleReset} className="btn-secondary sm:flex-1">Clear Form</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
