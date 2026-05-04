"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createMaterialRequest } from "../actions";

interface ProductRow {
  id: number;
  name: string;
  qty: string;
  specs: string;
}

export default function NewMaterialsRequest() {
  const router = useRouter();
  
  // MOVED: The loading state is now safely inside the component!
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [reqId, setReqId] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [products, setProducts] = useState<ProductRow[]>([
    { id: Date.now(), name: "", qty: "", specs: "" }
  ]);

  const handleAddProduct = () => {
    setProducts([...products, { id: Date.now(), name: "", qty: "", specs: "" }]);
  };

  const handleRemoveProduct = (idToRemove: number) => {
    if (products.length > 1) {
      setProducts(products.filter(p => p.id !== idToRemove));
    }
  };

  const updateProduct = (id: number, field: keyof ProductRow, value: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleClear = () => {
    setReqId("");
    setDate("");
    setLocation("");
    setProducts([{ id: Date.now(), name: "", qty: "", specs: "" }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = { reqId, date, location, products };
    
    // Call the server action we just created
    const result = await createMaterialRequest(formData);

    if (result.success) {
      alert("Materials Request Submitted successfully!");
      router.push("/materials-requests");
    } else {
      alert("Failed to submit request. Check console for details.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 text-black bg-gray-50 flex flex-col items-center">
      <div className="w-full max-w-3xl mb-4">
        <Link href="/materials-requests" className="text-blue-600 hover:underline font-medium">
          ← Back to Requests
        </Link>
      </div>

      {/* Main Form Card - Styled exactly like the uploaded image */}
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-10">
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Top Row: ID & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                Request ID
              </label>
              <input
                type="text"
                value={reqId}
                onChange={(e) => setReqId(e.target.value)}
                placeholder="Auto-generated if blank"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-gray-700 placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              />
            </div>
          </div>

          {/* Location Dropdown */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 appearance-none"
            >
              <option value="" disabled>Select a location...</option>
              <option value="Location 1">Location 1 (Main Warehouse)</option>
              <option value="Location 2">Location 2 (Secondary Site)</option>
            </select>
          </div>

          {/* Dynamic Products Section */}
          <div className="pt-2">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Products <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddProduct}
                className="text-sm font-bold text-blue-600 hover:text-blue-800 transition"
              >
                + Add Product
              </button>
            </div>

            <div className="space-y-4">
              {products.map((product, index) => (
                <div key={product.id} className="relative group">
                  {/* Name and Qty Row */}
                  <div className="flex gap-3 mb-2">
                    <input
                      type="text"
                      placeholder="Product name"
                      value={product.name}
                      onChange={(e) => updateProduct(product.id, "name", e.target.value)}
                      required
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 placeholder-gray-400"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={product.qty}
                      onChange={(e) => updateProduct(product.id, "qty", e.target.value)}
                      required
                      className="w-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 placeholder-gray-400 text-center font-mono"
                    />
                  </div>
                  
                  {/* Specifications Row */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-medium pl-1">+</span>
                    <input
                      type="text"
                      placeholder="Specifications"
                      value={product.specs}
                      onChange={(e) => updateProduct(product.id, "specs", e.target.value)}
                      className="flex-1 p-2 bg-transparent focus:outline-none text-sm text-gray-600 placeholder-gray-400"
                    />
                    
                    {/* Subtle Remove Button (only shows if more than 1 item) */}
                    {products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(product.id)}
                        className="text-red-400 hover:text-red-600 text-xs font-bold px-2 opacity-0 group-hover:opacity-100 transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-4 border-t border-gray-100">
            <button
              type="submit"
              className="flex-1 bg-black text-white font-bold text-lg py-4 rounded-xl hover:bg-gray-800 active:scale-[0.98] transition shadow-md"
            >
              Submit Request
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 bg-gray-200 text-gray-800 font-bold text-lg py-4 rounded-xl hover:bg-gray-300 active:scale-[0.98] transition"
            >
              Clear Form
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}