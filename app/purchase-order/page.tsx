"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
// Removed getAllLocations and addLocation since we are using Supabase now
import { addPurchaseOrder, generatePOId, formatDeliveryDate } from "../lib/store";
import { createClient } from "@/lib/supabase/client";
// Import your Supabase location fetcher
import { getLocations } from "../materials-requests/actions";
import { submitPurchaseOrder } from "./actions"; 

interface LineItem {
  productName: string;
  qty: string;
  specs: string;
  showSpecs: boolean;
}

interface POForm {
  poNumber: string;
  date: string;
  location: string;
}

const EMPTY_FORM: POForm = {
  poNumber: "",
  date: "",
  location: "",
};

const EMPTY_ITEM: LineItem = { productName: "", qty: "", specs: "", showSpecs: false };

const SKIP_WORDS = new Set([
  "total", "subtotal", "tax", "shipping", "discount", "page",
  "qty", "quantity", "price", "amount", "unit", "description", "item",
]);

function extractPONumber(text: string): string | null {
  const patterns = [
    /P\.?\s*O\.?\s*(?:NUMBER|Number|No\.?|#|Num\.?)?\s*(?:[:\-]\s*|\s{2,})(?!Box\b)([A-Z]{0,3}[-\s]?\d{3,})/i,
    /Purchase\s+Order\s*(?:Number|No\.?|#)?\s*[:\-]?\s*([A-Z]{0,4}[\-\s]?\d{3,})/i,
    /\b(PO[\-\s]\d{3,})\b/i,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      const val = m[1].trim();
      if (/^box\b/i.test(val)) continue;
      return val;
    }
  }
  return null;
}

function extractDate(text: string): string | null {
  const patterns = [
    /(?:Order\s+Date|PO\s+Date|Issue\s+Date|Date\s+Issued|DATE)\s*(?:[:\-]\s*|\s{2,})(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(?:Order\s+Date|PO\s+Date|Issue\s+Date|Date\s+Issued|DATE)\s*(?:[:\-]\s*|\s{2,})(\w+\.?\s+\d{1,2},?\s+\d{4})/i,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/,
    /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b/i,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) return m[1].trim();
  }
  return null;
}

function dateToISO(dateStr: string): string | null {
  const mdy = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (mdy) {
    const y = mdy[3].length === 2 ? `20${mdy[3]}` : mdy[3];
    return `${y}-${mdy[1].padStart(2, "0")}-${mdy[2].padStart(2, "0")}`;
  }
  const named = dateStr.match(/^(\w{3})\w*\.?\s+(\d{1,2}),?\s+(\d{4})$/i);
  if (named) {
    const months: Record<string, string> = {
      jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",
      jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12",
    };
    const mo = months[named[1].toLowerCase()];
    if (mo) return `${named[3]}-${mo}-${named[2].padStart(2, "0")}`;
  }
  return null;
}

function isValidDesc(s: string): boolean {
  if (!s || s.length < 12) return false;
  const lower = s.toLowerCase();
  if (SKIP_WORDS.has(lower)) return false;
  if (/^[A-Z]{2,}$/.test(s)) return false;
  if (/^(p\.?o\.?|date|terms|job\b|ship|f\.o\.b|change\s+order|bid|uom)\b/i.test(s)) return false;
  if (/^[A-Z][a-z]{2,}\w*\s+[a-z]/.test(s)) return false;
  if (/^[-•*•]/.test(s)) return false;
  if (/^Includes\b/i.test(s)) return false;
  return true;
}

function extractItems(text: string): { product_name: string; qty: number }[] {
  const items: { product_name: string; qty: number }[] = [];
  const seen = new Set<string>();

  function cleanDesc(s: string): string {
    const m = s.match(/^(.{8,}?):\s*\d/);
    return m ? m[1].trim() : s;
  }

  function tryAdd(rawDesc: string, rawQty: number) {
    const desc = cleanDesc(rawDesc.trim().replace(/\s+/g, " ")).substring(0, 120);
    if (!isValidDesc(desc) || rawQty <= 0 || rawQty > 9999 || seen.has(desc)) return;
    seen.add(desc);
    items.push({ product_name: desc, qty: rawQty });
  }

  function findNearbyDesc(linesArr: string[], i: number): string {
    for (const j of [i - 1, i + 1, i - 2, i + 2, i - 3, i + 3]) {
      if (j < 0 || j >= linesArr.length) continue;
      const c = linesArr[j].trim();
      if (isValidDesc(c) && !/^\d/.test(c)) return c.substring(0, 120);
    }
    return "";
  }

  const rightQtyRe = /^(.{5,80}?)\s{2,}(\d+)\s*(?:ea|pc|pcs|units?|each)?\s*$/gim;
  for (const m of text.matchAll(rightQtyRe)) {
    tryAdd(m[1], parseInt(m[2], 10));
  }

  const linesArr = text.split("\n");
  for (let i = 0; i < linesArr.length; i++) {
    const line = linesArr[i];

    const leftMatch = line.match(/^[ \t]*(\d{1,4})[ \t]{2,}([A-Z][^\n]{3,})$/);
    if (leftMatch) {
      const qty = parseInt(leftMatch[1], 10);
      if (qty <= 0 || qty > 9999) continue;
      let desc = leftMatch[2].trim();

      const tagDesc = desc.match(/^([A-Z][a-z]\w+)[ \t]{2,}([A-Z][^\n]{12,})/);
      if (tagDesc) {
        desc = tagDesc[2].trim();
      } else {
        const tagFrag = desc.match(/^[A-Z][a-z]\w+[ \t]+[a-z]/);
        if (tagFrag) {
          const resolved = findNearbyDesc(linesArr, i);
          if (!resolved) continue;
          tryAdd(resolved, qty);
          continue;
        }
      }

      if (!isValidDesc(desc)) {
        const resolved = findNearbyDesc(linesArr, i);
        if (resolved) tryAdd(resolved, qty);
      } else {
        tryAdd(desc, qty);
      }
      continue;
    }

    const soloQty = line.trim().match(/^(\d{1,4})[ \t]*$/);
    if (soloQty) {
      const qty = parseInt(soloQty[1], 10);
      if (qty <= 0 || qty > 9999) continue;
      const resolved = findNearbyDesc(linesArr, i);
      if (resolved) tryAdd(resolved, qty);
    }
  }

  return items;
}

function extractSpecs(text: string, productName: string): string {
  const lines = text.split("\n");
  const searchKey = productName.substring(0, Math.min(productName.length, 30));
  let productLineIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchKey)) {
      productLineIdx = i;
      break;
    }
  }

  if (productLineIdx === -1) return "";

  const specParts: string[] = [];
  for (let i = productLineIdx + 1; i < Math.min(productLineIdx + 10, lines.length); i++) {
    const line = lines[i].trim();
    if (!line) {
      if (specParts.length > 0) break;
      continue;
    }
    if (/^[ \t]*\d{1,4}[ \t]{2,}[A-Z]/.test(lines[i])) break;
    if (/^.{5,80}\s{2,}\d{1,4}\s*$/.test(line)) break;

    if (/^[-•*–]\s/.test(line)) {
      specParts.push(line.replace(/^[-•*–]\s*/, "").trim());
    } else if (/^Includes\b/i.test(line)) {
      specParts.push(line);
    } else if (
      specParts.length > 0 &&
      line.length < 120 &&
      !/^\d{4,}/.test(line)
    ) {
      specParts.push(line);
    }
  }

  return specParts.join("\n");
}

function UploadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="w-8 h-8 mx-auto animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

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
  const [locations, setLocations] = useState<any[]>([]); // Swapped to generic array for Supabase data
  const [submitted, setSubmitted] = useState(false);
  const [submittedPOId, setSubmittedPOId] = useState("");
  const [submittedLocation, setSubmittedLocation] = useState("");
  const [uploadStatus, setUploadStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pdfFileName, setPdfFileName] = useState("");
  const [previewPage, setPreviewPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [previewScale, setPreviewScale] = useState(1.2);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [duplicatePO, setDuplicatePO] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  // NEW: Fetch Supabase locations and set today's date on mount
  useEffect(() => {
    // 1. Set default date
    const today = new Date();
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    setForm(prev => ({ ...prev, date: localDate }));

    // 2. Fetch Supabase locations
    async function loadLocs() {
      const locs = await getLocations();
      setLocations(locs);
    }
    loadLocs();
  }, []);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;
    (async () => {
      const page = await pdfDoc.getPage(previewPage);
      if (cancelled) return;
      const viewport = page.getViewport({ scale: previewScale });
      const canvas = canvasRef.current!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch {}
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      renderTaskRef.current = page.render({ canvasContext: ctx, viewport });
      try {
        await renderTaskRef.current.promise;
      } catch {}
    })();
    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch {}
      }
    };
  }, [pdfDoc, previewPage, previewScale]);

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleItemChange(idx: number, field: "productName" | "qty" | "specs", value: string) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  function toggleSpecs(idx: number) {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, showSpecs: !item.showSpecs } : item));
  }

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    const validItems = items.filter((it) => it.productName.trim() && it.qty.trim());
    if (validItems.length === 0) return;
    if (!form.location) return; // Strict Supabase location check

    const poId = form.poNumber.trim() || generatePOId();
    const { data: existing } = await supabase
      .from("purchase_order")
      .select("PO_number")
      .eq("PO_number", poId)
      .maybeSingle();

    if (existing) {
      setDuplicatePO(poId);
      setShowDuplicate(true);
      return;
    }

    setShowConfirm(true);
  }

async function confirmSubmit() {
    if (submitting) return;
    setSubmitting(true);

    const validItems = items.filter((it) => it.productName.trim() && it.qty.trim());
    const poId = form.poNumber.trim() || generatePOId();
    const isoDate = form.date || new Date().toISOString().split("T")[0];

    // 1. Call the new Server Action to securely update the database
    const result = await submitPurchaseOrder({
      poNumber: poId,
      date: isoDate,
      locationId: form.location, // Safely passing the UUID from the dropdown
      items: validItems.map((it) => ({
        productName: it.productName.trim(),
        qty: parseInt(it.qty, 10),
        specs: it.specs.trim()
      }))
    });

    // 2. Handle Errors
    if (!result.success) {
      alert("Error: " + result.error);
      setSubmitting(false);
      return;
    }

    // 3. Find the pretty name of the location for the Success Screen
    const selectedLocationObj = locations.find((loc) => loc.id === form.location);
    const prettyLocationName = selectedLocationObj ? selectedLocationObj.name : "Unknown Location";

    // 4. Update UI state to show the Success Screen
    setSubmittedPOId(poId);
    setSubmittedLocation(prettyLocationName);
    setShowConfirm(false);
    setSubmitted(true);
    setSubmitting(false);
  }

  function handleReset() {
    // Reset back to today's date so it isn't blank
    const today = new Date();
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    setForm({ ...EMPTY_FORM, date: localDate });
    
    setItems([{ ...EMPTY_ITEM }]);
    setSubmitted(false);
    setSubmittedPOId("");
    setSubmittedLocation("");
    setUploadStatus("idle");
    setUploadMessage("");
    setPdfDoc(null);
    setPdfFileName("");
    setPreviewPage(1);
    setTotalPages(0);
  }

  async function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setUploadStatus("error");
      setUploadMessage("Only PDF files are supported.");
      return;
    }
    setUploadStatus("loading");
    setUploadMessage("");

    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

      type Chunk = { str: string; x: number; y: number; w: number };
      const pageParts: string[] = [];
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();

        const chunks: Chunk[] = [];
        for (const item of content.items) {
          if (!("str" in item)) continue;
          const t = item as { str: string; transform: number[]; width: number };
          if (t.str.trim()) chunks.push({ str: t.str, x: t.transform[4], y: t.transform[5], w: t.width });
        }

        chunks.sort((a, b) => b.y - a.y || a.x - b.x);
        const Y_TOL = 6;
        const lines: Chunk[][] = [];
        for (const chunk of chunks) {
          const last = lines[lines.length - 1];
          if (last && Math.abs(last[0].y - chunk.y) <= Y_TOL) {
            last.push(chunk);
            last.sort((a, b) => a.x - b.x);
          } else {
            lines.push([chunk]);
          }
        }

        const textLines = lines.map((line) => {
          let out = "";
          for (let i = 0; i < line.length; i++) {
            if (i === 0) { out += line[i].str; continue; }
            const gap = line[i].x - (line[i - 1].x + line[i - 1].w);
            out += gap > 15 ? "  " + line[i].str : gap > 2 ? " " + line[i].str : line[i].str;
          }
          return out;
        });
        pageParts.push(textLines.join("\n"));
      }
      const fullText = pageParts.join("\n\n");

      const poNumber = extractPONumber(fullText);
      const dateStr = extractDate(fullText);
      const isoDate = dateStr ? dateToISO(dateStr) : null;
      const extracted = extractItems(fullText);

      setForm((prev) => ({
        ...prev,
        poNumber: poNumber ?? prev.poNumber,
        date: isoDate ?? prev.date,
      }));

      if (extracted.length > 0) {
        setItems(extracted.map((it) => {
          const specs = extractSpecs(fullText, it.product_name);
          return { productName: it.product_name, qty: String(it.qty), specs, showSpecs: specs.length > 0 };
        }));
      }

      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      setPreviewPage(1);
      setPdfFileName(file.name);

      setUploadStatus("success");
      const fieldCount = [poNumber, isoDate].filter(Boolean).length;
      setUploadMessage(
        `Extracted ${fieldCount} field${fieldCount !== 1 ? "s" : ""} and ${extracted.length} line item${extracted.length !== 1 ? "s" : ""}.`
      );
    } catch (err) {
      setUploadStatus("error");
      setUploadMessage(`Parse error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
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
            {items.filter((it) => it.productName.trim()).length} product{items.filter((it) => it.productName.trim()).length !== 1 ? "s" : ""} to {submittedLocation || "—"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={handleReset} className="btn-primary">+ New Order</button>
            <Link href="/purchase-orders" className="btn-secondary py-2 px-4 rounded-md text-center">
              View All Orders
            </Link>
          </div>
          <Link href="/" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">
            &larr; Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen p-4 sm:p-8 text-black">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          &larr; Back to Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight">New Purchase Order</h1>
          <p className="text-gray-500 mt-1 text-sm">Upload a PDF to autofill, or fill in the form manually.</p>
        </div>

        {/* PDF Preview */}
        {pdfDoc && (
          <div className="mb-4 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white">
            <div className="flex flex-col gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs font-medium text-gray-500 truncate" title={pdfFileName}>
                {pdfFileName}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                  disabled={previewPage <= 1}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <span className="text-xs text-gray-600 px-1 tabular-nums select-none">{previewPage} / {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPreviewPage(p => Math.min(totalPages, p + 1))}
                  disabled={previewPage >= totalPages}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <span className="w-px h-4 bg-gray-300 mx-1" />
                <button
                  type="button"
                  onClick={() => setPreviewScale(s => Math.max(0.5, +(s - 0.25).toFixed(2)))}
                  disabled={previewScale <= 0.5}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Zoom out"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M5 8a1 1 0 011-1h4a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <span className="text-xs text-gray-600 w-10 text-center tabular-nums select-none">{Math.round(previewScale * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setPreviewScale(s => Math.min(3, +(s + 0.25).toFixed(2)))}
                  disabled={previewScale >= 3}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Zoom in"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M8 5a1 1 0 011 1v2h2a1 1 0 110 2H9v2a1 1 0 11-2 0V9H5a1 1 0 110-2h2V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="overflow-auto bg-gray-100 p-3" style={{ maxHeight: "480px" }}>
              <canvas ref={canvasRef} className="shadow-md rounded" style={{ display: "block", maxWidth: "none", margin: "0 auto" }} />
            </div>
          </div>
        )}

        {/* PDF Upload */}
        <div className="mb-6">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragging ? "border-blue-500 bg-blue-50"
              : uploadStatus === "success" ? "border-green-400 bg-green-50"
              : uploadStatus === "error" ? "border-red-400 bg-red-50"
              : uploadStatus === "loading" ? "border-blue-300 bg-blue-50"
              : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
            }`}
          >
            <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileInput} className="hidden" />
            <div className="mb-2">
              {uploadStatus === "loading" ? <SpinnerIcon />
                : uploadStatus === "success" ? <CheckCircleIcon />
                : uploadStatus === "error" ? <XCircleIcon />
                : <UploadIcon />}
            </div>
            <p className="font-semibold text-sm text-gray-700">
              {uploadStatus !== "idle" ? uploadMessage : ""}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {uploadStatus === "loading"
                ? "Parsing PDF…"
                : uploadStatus === "idle"
                ? "Tap or drop a PDF to upload — fields will be autofilled"
                : "Click to upload a different PDF"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-5 sm:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">

            {/* PO Number + Date */}
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
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleFormChange}
                  className="input-themed p-2 text-black w-full"
                  required
                />
              </div>
            </div>

            {/* UPDATED: Location Supabase Dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                Location <span className="text-red-500">*</span>
              </label>
              <select
                name="location"
                value={form.location}
                onChange={handleFormChange}
                className="input-themed p-2 text-black w-full bg-white"
                required
              >
                <option value="" disabled>Select a location…</option>
                {/* Dynamically mapped from Supabase */}
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
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

              <div className="flex flex-col gap-3">
                {items.map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    {/* Product row */}
                    <div className="flex gap-2 items-center">
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

                    {/* Specs area */}
                    {item.showSpecs ? (
                      <div className="flex items-start gap-1 pl-1">
                        <div className="flex-1 rounded-md border border-gray-200 bg-gray-50 overflow-hidden">
                          <textarea
                            value={item.specs}
                            onChange={(e) => handleItemChange(idx, "specs", e.target.value)}
                            placeholder="Specifications for this product…"
                            rows={2}
                            className="w-full p-2 text-xs text-gray-700 bg-transparent resize-none outline-none placeholder:text-gray-400"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleSpecs(idx)}
                          className="mt-1 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                          aria-label="Hide specifications"
                          title="Hide specifications"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleSpecs(idx)}
                        className="self-start pl-1 flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        <span>Specifications</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button type="submit" className="btn-primary sm:flex-1">Submit Purchase Order</button>
              <button type="button" onClick={handleReset} className="btn-secondary sm:flex-1">Clear Form</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    {/* Duplicate PO Modal */}
    {showDuplicate && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl border-2 border-black shadow-xl p-6 sm:p-8 max-w-sm w-full">
          <h2 className="text-xl font-black uppercase mb-2 text-red-600">Duplicate Purchase Order</h2>
          <p className="text-sm text-gray-600 mb-6">
            PO <span className="font-mono font-bold text-black">{duplicatePO}</span> is already in the system.
          </p>
          <button
            onClick={() => setShowDuplicate(false)}
            className="btn-primary w-full"
          >
            Back
          </button>
        </div>
      </div>
    )}

    {/* Confirmation Modal */}
    {showConfirm && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl border-2 border-black shadow-xl p-6 sm:p-8 max-w-lg w-full">
          <h2 className="text-xl font-black uppercase mb-1">Confirm Purchase Order</h2>
          <p className="text-sm text-gray-500 mb-5">Please review before submitting.</p>

          <div className="flex flex-col gap-3 text-sm mb-6">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
              <span className="font-bold text-gray-600 sm:w-36 sm:shrink-0">PO Number</span>
              <span className="font-mono text-gray-800">{form.poNumber || "(auto-generated)"}</span>
            </div>
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
              <span className="font-bold text-gray-600 sm:w-36 sm:shrink-0">Date</span>
              <span>{form.date || "—"}</span>
            </div>
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
              <span className="font-bold text-gray-600 sm:w-36 sm:shrink-0">Location</span>
              <span>{form.location || "—"}</span>
            </div>
            <div>
              <span className="font-bold text-gray-600 block mb-1">Products</span>
              <ul className="ml-2 flex flex-col gap-2">
                {items.filter((it) => it.productName.trim()).map((it, idx) => (
                  <li key={idx} className="flex flex-col gap-0.5">
                    <div className="flex gap-2 text-sm">
                      <span className="font-mono font-bold w-8 text-right shrink-0">{it.qty}×</span>
                      <span>{it.productName}</span>
                    </div>
                    {it.specs.trim() && (
                      <p className="ml-10 text-xs text-gray-500 italic whitespace-pre-line">{it.specs.trim()}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={confirmSubmit} className="btn-primary sm:flex-1" disabled={submitting}>
              {submitting ? "Submitting…" : "Confirm & Submit"}
            </button>
            <button onClick={() => setShowConfirm(false)} className="btn-secondary sm:flex-1" disabled={submitting}>Edit</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}