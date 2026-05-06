"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getLocations, getInventoryByLocation, createMaterialRequest } from "../actions";

interface InventoryItem {
  id: string; 
  SKU: string;
  quantity: number; 
  materials: { description: string };
}

interface CartItem {
  inventoryId: string;
  sku: string;
  description: string;
  maxQty: number; 
  // Allow string so the user can temporarily clear the box while typing
  requestQty: number | string; 
}

export default function NewMaterialsRequest() {
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [availableInventory, setAvailableInventory] = useState<InventoryItem[]>([]);
  
  const [date, setDate] = useState("");
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);

  useEffect(() => {
    const today = new Date();
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    setDate(localDate);
  }, []);

  useEffect(() => {
    async function load() {
      const locs = await getLocations();
      setLocations(locs);
    }
    load();
  }, []);

  useEffect(() => {
    async function fetchInventory() {
      if (fromLocation && fromLocation === toLocation) {
        setToLocation("");
      }
      if (!fromLocation) {
        setAvailableInventory([]);
        return;
      }
      const inv = await getInventoryByLocation(fromLocation);
      setAvailableInventory(inv as any[]); 
      setCart([]); 
    }
    fetchInventory();
  }, [fromLocation]);

  const handleAddToCart = (item: InventoryItem) => {
    if (cart.find((c) => c.sku === item.SKU)) return;
    setCart([...cart, {
      inventoryId: item.id,
      sku: item.SKU,
      description: item.materials?.description || "Unknown Item",
      maxQty: item.quantity,
      requestQty: 1 
    }]);
  };

  // ONLY updates the state with what the user types (allows empty string)
  const updateCartQty = (sku: string, val: string) => {
    if (val === '') {
      setCart(cart.map(c => c.sku === sku ? { ...c, requestQty: '' } : c));
      return;
    }
    const num = parseInt(val);
    if (!isNaN(num)) {
      setCart(cart.map(c => c.sku === sku ? { ...c, requestQty: num } : c));
    }
  };

  // Runs onBlur (when user clicks away) to correct the value
  const clampCartQty = (sku: string, maxQty: number) => {
    setCart(cart.map(c => {
      if (c.sku === sku) {
        let num = parseInt(c.requestQty.toString());
        if (isNaN(num) || num < 1) num = 1;
        if (num > maxQty) num = maxQty;
        return { ...c, requestQty: num };
      }
      return c;
    }));
  };

  const removeFromCart = (sku: string) => {
    setCart(cart.filter(c => c.sku !== sku));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !fromLocation || !toLocation || !date) {
      alert("Please complete all fields and add items.");
      return;
    }
    setIsSubmitting(true);
    
    // Safety check: Final clamp of values right before sending to database
    // in case the user clicked submit without clicking away from the input first
    const safeCart = cart.map(c => {
      let num = parseInt(c.requestQty.toString());
      if (isNaN(num) || num < 1) num = 1;
      if (num > c.maxQty) num = c.maxQty;
      return { ...c, requestQty: num };
    });

    const result = await createMaterialRequest({
      date,
      fromLocation,
      toLocation,
      items: safeCart
    });

    if (result.success) {
      alert("Material Request Submitted Successfully!");
      router.push("/materials-requests");
    } else {
      alert("Failed to submit request.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-50 flex flex-col items-center text-black">
      <div className="w-full max-w-3xl mb-4">
        <Link href="/materials-requests" className="text-blue-600 hover:underline font-medium">
          ← Back to Requests
        </Link>
      </div>

      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="relative">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">From (Source) *</label>
              <button
                type="button"
                onClick={() => { setFromOpen(!fromOpen); setToOpen(false); }}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-left focus:ring-2 focus:ring-blue-500 flex justify-between items-center"
              >
                <span className={`truncate ${!fromLocation ? 'text-gray-400' : 'text-gray-900'}`}>
                  {fromLocation ? locations.find(l => l.id === fromLocation)?.name : 'Select Source...'}
                </span>
                <svg className={`h-4 w-4 text-gray-500 transition-transform ${fromOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </button>
              {fromOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {locations.map(loc => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => { setFromLocation(loc.id); setFromOpen(false); }}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 border-b last:border-0"
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">To (Destination) *</label>
              <button
                type="button"
                disabled={!fromLocation}
                onClick={() => { setToOpen(!toOpen); setFromOpen(false); }}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-left focus:ring-2 focus:ring-blue-500 flex justify-between items-center disabled:bg-gray-100"
              >
                <span className={`truncate ${!toLocation ? 'text-gray-400' : 'text-gray-900'}`}>
                  {toLocation ? locations.find(l => l.id === toLocation)?.name : 'Select Destination...'}
                </span>
                <svg className={`h-4 w-4 text-gray-500 transition-transform ${toOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </button>
              {toOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                  {locations.map(loc => (
                    <button
                      key={loc.id}
                      type="button"
                      disabled={loc.id === fromLocation}
                      onClick={() => { setToLocation(loc.id); setToOpen(false); }}
                      className={`w-full text-left px-4 py-3 text-sm hover:bg-blue-50 border-b last:border-0 ${loc.id === fromLocation ? 'text-gray-300 cursor-not-allowed' : ''}`}
                    >
                      {loc.name} {loc.id === fromLocation ? "(Source)" : ""}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {fromLocation && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <h3 className="text-xs font-bold text-blue-900 uppercase mb-3">Available at Source</h3>
              <div className="max-h-40 overflow-y-auto bg-white rounded-lg border border-gray-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                    <tr>
                      <th className="p-2 text-gray-600">Material</th>
                      <th className="p-2 text-center text-gray-600">Stock</th>
                      <th className="p-2 text-right text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableInventory.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="p-2 font-medium">{item.materials?.description}</td>
                        <td className="p-2 text-center font-mono">{item.quantity}</td>
                        <td className="p-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleAddToCart(item)}
                            disabled={cart.some(c => c.sku === item.SKU)}
                            className="text-xs bg-black text-white px-3 py-1 rounded font-bold disabled:bg-gray-300"
                          >
                            {cart.some(c => c.sku === item.SKU) ? "Added" : "+ Add"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {cart.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase">Selected Items</h3>
              {cart.map((item) => (
                <div key={item.sku} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex-1 font-bold text-sm">{item.description}</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={item.requestQty}
                      // Fire update during typing
                      onChange={(e) => updateCartQty(item.sku, e.target.value)}
                      // Fire clamp when user clicks outside the input
                      onBlur={() => clampCartQty(item.sku, item.maxQty)}
                      className="w-16 p-1 border border-gray-300 rounded text-center font-mono"
                    />
                    <span className="text-xs text-gray-500">/ {item.maxQty}</span>
                  </div>
                  <button type="button" onClick={() => removeFromCart(item.sku)} className="text-red-500 text-sm font-bold">×</button>
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !fromLocation || !toLocation || cart.length === 0}
            className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 disabled:bg-gray-300 transition shadow-lg"
          >
            {isSubmitting ? "Submitting..." : "Submit Material Request"}
          </button>
        </form>
      </div>
    </div>
  );
}