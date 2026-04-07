"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { products } from "../lib/data";
import { addDelivery, generateDeliveryId, resolveProduct, formatDeliveryDate } from "../lib/store";

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

// Flexible aliases for each field name
const FIELD_ALIASES: Record<keyof POForm, string[]> = {
  poNumber:      ["ponumber", "po number", "po_number", "po#", "purchase order number", "order number", "order#"],
  supplier:      ["supplier", "vendor", "company", "supplier name", "vendor name"],
  productId:     ["productid", "product id", "product_id", "product", "item", "item id", "item_id"],
  qty:           ["qty", "quantity", "amount", "count", "units", "ordered qty", "order qty"],
  expectedDate:  ["expecteddate", "expected date", "expected_date", "delivery date", "due date", "date", "ship date"],
  notes:         ["notes", "note", "comments", "comment", "remarks"],
  signedBy:      ["signedby", "signed by", "signed_by", "ordered by", "orderedby", "ordered_by", "requested by", "requestedby", "name"],
};

const FIELD_LABELS: Record<keyof POForm, string> = {
  poNumber: "PO Number",
  supplier: "Supplier",
  productId: "Product",
  qty: "Quantity",
  expectedDate: "Expected Date",
  notes: "Notes",
  signedBy: "Ordered By",
};

function normalizeKey(key: string): string {
  return key.toLowerCase().trim().replace(/[\s_\-]+/g, " ");
}

function findFieldForKey(key: string): keyof POForm | null {
  const norm = normalizeKey(key);
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some((a) => normalizeKey(a) === norm)) {
      return field as keyof POForm;
    }
  }
  return null;
}

function normalizeDate(raw: string): string {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  return trimmed;
}

function resolveProductId(value: string): string {
  const norm = value.toLowerCase().trim();
  const byId = products.find((p) => String(p.id) === norm);
  if (byId) return String(byId.id);
  const exact = products.find((p) => p.name.toLowerCase() === norm);
  if (exact) return String(exact.id);
  const partial = products.find(
    (p) => p.name.toLowerCase().includes(norm) || norm.includes(p.name.toLowerCase())
  );
  if (partial) return String(partial.id);
  return value;
}

// ── PDF parsing ──────────────────────────────────────────────────────────────

async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Sort items by descending Y (top→bottom), then ascending X (left→right)
    // so table rows and columns reconstruct in reading order.
    const items = content.items
      .filter((item): item is (typeof item & { str: string; transform: number[]; width: number }) =>
        "str" in item && item.str !== ""
      )
      .sort((a, b) => {
        const yDiff = b.transform[5] - a.transform[5];
        return Math.abs(yDiff) > 3 ? yDiff : a.transform[4] - b.transform[4];
      });

    let pageText = "";
    let lastY: number | null = null;
    let lastEndX: number | null = null;

    for (const item of items) {
      const x = item.transform[4];
      const y = item.transform[5];

      if (lastY !== null && Math.abs(y - lastY) > 3) {
        // New row
        pageText += "\n";
        lastEndX = null;
      } else if (lastEndX !== null) {
        const gap = x - lastEndX;
        // Only add a space if there is a meaningful visual gap between glyphs.
        // Many PDFs render each character as its own text item with gap ≈ 0.
        if (gap > 1.5) pageText += gap > 8 ? "  " : " ";
      }

      pageText += item.str;
      lastY = y;
      lastEndX = x + (item.width ?? 0);
    }

    fullText += pageText + "\n";
  }

  return fullText;
}

function extractFieldsFromText(text: string): Partial<POForm> {
  const result: Partial<POForm> = {};

  const labelPatterns: [keyof POForm, RegExp[]][] = [
    ["poNumber", [
      // "P.O. NUMBER  115502" or "PO Number: PO-007"
      /\bP\.?\s*O\.?\s*(?:NUMBER|Number|#|No\.?|Num\.?)\s*[:\-]?\s*([A-Z0-9\-]+)/i,
      /\bPurchase\s+Order\s*(?:Number|#|No\.?)?\s*[:\-]\s*([A-Z0-9\-]+)/i,
      /\b(PO-\d+)\b/,
    ]],
    ["supplier", [
      // Only fill when there's an unambiguous explicit label with colon
      /\b(?:Supplier|Vendor|Company|Manufacturer)\s*:\s*([^\n\r]{2,60})/i,
    ]],
    ["productId", [
      /\b(?:Product|Item)\s*(?:Name|ID|No\.?)?\s*:\s*([^\n\r,]{2,60})/i,
    ]],
    ["qty", [
      // Require colon — avoids matching table column headers like "QUANTITY  UOM"
      // Also exclude "Amount" entirely (that's a price column, not a count)
      /\b(?:Quantity|Qty)\s*:\s*(\d+)/i,
      // Allow no colon only for very specific "Qty N" short forms
      /\bQty\s+(\d+)\b/i,
    ]],
    ["expectedDate", [
      /\b(?:Expected\s+(?:Delivery\s+)?Date|Delivery\s+Date|Due\s+Date|Ship\s+Date|Req(?:uired)?\s+Date)\s*[:\-]?\s*([^\n\r,]{4,30})/i,
      // "DATE  1/19/2026" on the same line (standard PO table row)
      /\bDATE\b[ \t]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
      // "DATE" label with date on the very next line
      /\bDATE\b[ \t]*\n[ \t]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
    ]],
    ["signedBy", [
      // Inline with explicit colon: "Ordered By: John Smith"
      /\b(?:Ordered\s+By|Signed\s+By|Requested\s+By|Prepared\s+By|Approved\s+By)\s*:\s*([^\n\r,]{2,60})/i,
      // Table: header row then value on the NEXT line — name-only (letters/dots/hyphens, no digits)
      // Uses [ \t]* so it won't cross a second newline.
      /\b(?:ORDERED\s+BY|SIGNED\s+BY|PREPARED\s+BY)\b[^\n]*\n[ \t]*([A-Za-z][A-Za-z\.\-]{1,29})(?:[ \t]|$)/i,
    ]],
    ["notes", [
      /\b(?:Notes?|Comments?|Remarks?|Instructions?)\s*:\s*([^\n\r]{2,200})/i,
    ]],
  ];

  for (const [field, regexes] of labelPatterns) {
    for (const regex of regexes) {
      const match = text.match(regex);
      const value = match?.[1]?.trim();
      if (value) {
        result[field] = value;
        break;
      }
    }
  }

  // Scan for known product names anywhere in text
  if (!result.productId) {
    for (const p of products) {
      if (text.toLowerCase().includes(p.name.toLowerCase())) {
        result.productId = String(p.id);
        break;
      }
    }
  }

  return result;
}

async function parsePDF(file: File): Promise<Partial<POForm>> {
  const text = await extractTextFromPDF(file);
  return extractFieldsFromText(text);
}

// ── CSV / JSON parsing ────────────────────────────────────────────────────────

function parseCSV(text: string): Partial<POForm> {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return {};
  const strip = (s: string) => s.trim().replace(/^["']|["']$/g, "");
  const headers = lines[0].split(",").map(strip);
  const values = lines[1].split(",").map(strip);
  const result: Partial<POForm> = {};
  headers.forEach((header, i) => {
    const field = findFieldForKey(header);
    if (field && values[i] !== undefined && values[i] !== "") {
      result[field] = values[i];
    }
  });
  return result;
}

function parseJSON(text: string): Partial<POForm> {
  const data = JSON.parse(text);
  const obj = Array.isArray(data) ? data[0] : data;
  const result: Partial<POForm> = {};
  for (const [key, value] of Object.entries(obj)) {
    const field = findFieldForKey(key);
    if (field && value !== null && value !== undefined && String(value) !== "") {
      result[field] = String(value);
    }
  }
  return result;
}

export default function PurchaseOrderPage() {
  const [form, setForm] = useState<POForm>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);

  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [filledFields, setFilledFields] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { productId, productName } = resolveProduct(form.productId);
    addDelivery({
      id: generateDeliveryId(),
      date: formatDeliveryDate(form.expectedDate),
      productId,
      productName: productName || form.productId,
      qty: parseInt(form.qty, 10),
      status: "Pending",
      supplier: form.supplier,
      po: form.poNumber,
      signedBy: form.signedBy,
      notes: form.notes,
    });
    setSubmitted(true);
  };

  const handleReset = () => {
    setForm(EMPTY_FORM);
    setSubmitted(false);
    setUploadStatus("idle");
    setUploadMessage("");
    setFilledFields([]);
  };

  const applyParsedData = (parsed: Partial<POForm>) => {
    if (Object.keys(parsed).length === 0) {
      setUploadStatus("error");
      setUploadMessage("No recognizable fields found in the file.");
      return;
    }
    const normalized: Partial<POForm> = { ...parsed };
    if (normalized.expectedDate) {
      normalized.expectedDate = normalizeDate(normalized.expectedDate);
    }
    if (normalized.productId) {
      normalized.productId = resolveProductId(normalized.productId);
    }
    setForm((prev) => ({ ...prev, ...normalized }));
    const filled = Object.keys(normalized) as (keyof POForm)[];
    setFilledFields(filled);
    setUploadStatus("success");
    setUploadMessage(`Autofilled ${filled.length} field${filled.length !== 1 ? "s" : ""} from file.`);
  };

  const processFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "json" && ext !== "pdf") {
      setUploadStatus("error");
      setUploadMessage("Unsupported file type. Please upload a .csv, .json, or .pdf file.");
      return;
    }

    if (ext === "pdf") {
      parsePDF(file)
        .then(applyParsedData)
        .catch(() => {
          setUploadStatus("error");
          setUploadMessage("Failed to parse PDF. Ensure it contains readable text.");
        });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const parsed = ext === "json" ? parseJSON(text) : parseCSV(text);
        applyParsedData(parsed);
      } catch {
        setUploadStatus("error");
        setUploadMessage("Failed to parse file. Check the format and try again.");
      }
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

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
            {form.qty} × {products.find((p) => p.id === Number(form.productId) || p.name === form.productId)?.name ?? (form.productId || "—")} from {form.supplier}
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

        {/* File Upload Section */}
        <div className="mb-6">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
              ${isDragging
                ? "border-blue-500 bg-blue-50"
                : uploadStatus === "success"
                ? "border-green-400 bg-green-50"
                : uploadStatus === "error"
                ? "border-red-400 bg-red-50"
                : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,.pdf"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="text-2xl mb-2">
              {uploadStatus === "success" ? "✅" : uploadStatus === "error" ? "❌" : "📂"}
            </div>
            <p className="font-semibold text-sm text-gray-700">
              {uploadStatus === "idle"
                ? ""
                : uploadMessage}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {uploadStatus === "idle"
                ? "Upload a CSV/JSON/PDF file."
                : "Click to upload a different file"}
            </p>
          </div>

          {/* Filled fields badges */}
          {uploadStatus === "success" && filledFields.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {filledFields.map((f) => (
                <span
                  key={f}
                  className="text-xs bg-green-100 text-green-700 border border-green-300 rounded-full px-2 py-0.5 font-medium"
                >
                  {FIELD_LABELS[f as keyof POForm]}
                </span>
              ))}
            </div>
          )}
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
                <input
                  name="productId"
                  value={form.productId}
                  onChange={handleChange}
                  list="products-datalist"
                  placeholder="Select or type a product..."
                  className="input-themed p-2 text-black w-full"
                  required
                />
                <datalist id="products-datalist">
                  {products.map((p) => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
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
