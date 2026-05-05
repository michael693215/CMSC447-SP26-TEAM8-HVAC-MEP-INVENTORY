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
    requestQty: number; 
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

    // Chopped down to 25 characters to survive mobile screens!
    const formatLocationName = (name: string) => {
      if (name.length > 25) {
        return name.substring(0, 25) + "...";
      }
      return name;
    };

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

    const updateCartQty = (sku: string, inputQty: number, maxQty: number) => {
      let finalQty = inputQty;
      if (finalQty > maxQty) finalQty = maxQty;
      if (finalQty < 1 || isNaN(finalQty)) finalQty = 1;

      setCart(cart.map(c => 
        c.sku === sku ? { ...c, requestQty: finalQty } : c
      ));
    };

    const removeFromCart = (sku: string) => {
      setCart(cart.filter(c => c.sku !== sku));
    };

    const handleClear = () => {
      setDate("");
      setFromLocation("");
      setToLocation("");
      setCart([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (cart.length === 0) {
        alert("Please add at least one item to the request.");
        return;
      }

      setIsSubmitting(true);
      
      const result = await createMaterialRequest({
        date,
        fromLocation,
        toLocation,
        items: cart
      });

      if (result.success) {
        alert("Material Request Submitted Successfully!");
        router.push("/materials-requests");
      } else {
        alert("Failed to submit request. Check terminal console.");
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

        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-10">
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
              
              <div className="max-w-[100%] overflow-hidden">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">From (Source) *</label>
                <select
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                  required
                  className="w-full max-w-[100%] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="" disabled>Select Source...</option>
                  {locations.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {formatLocationName(loc.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="max-w-[100%] overflow-hidden">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">To (Destination) *</label>
                <select
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                  required
                  disabled={!fromLocation} 
                  className="w-full max-w-[100%] p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="" disabled>Select Destination...</option>
                  {locations.map(loc => (
                    <option 
                      key={loc.id} 
                      value={loc.id} 
                      disabled={loc.id === fromLocation}
                    >
                      {formatLocationName(loc.name)} {loc.id === fromLocation ? "(Selected)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {fromLocation && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h3 className="text-sm font-bold text-blue-900 uppercase mb-3">Available Inventory at Source</h3>
                
                <div className="max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-inner">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 shadow-sm">
                      <tr>
                        <th className="p-2 font-bold text-gray-600">Material</th>
                        <th className="p-2 font-bold text-gray-600 text-center">In Stock</th>
                        <th className="p-2 font-bold text-gray-600 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableInventory.length === 0 ? (
                        <tr><td colSpan={3} className="p-4 text-center text-gray-500 italic">No inventory available here.</td></tr>
                      ) : (
                        availableInventory.map((item) => (
                          <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                            <td className="p-2 font-medium">{item.materials?.description}</td>
                            <td className="p-2 text-center font-mono">{item.quantity}</td>
                            <td className="p-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleAddToCart(item)}
                                disabled={cart.some(c => c.sku === item.SKU)}
                                className="text-xs bg-black text-white px-3 py-1 rounded font-bold disabled:bg-gray-300 transition"
                              >
                                {cart.some(c => c.sku === item.SKU) ? "Added" : "+ Add"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {cart.length > 0 && (
              <div className="pt-2">
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">Items to Transfer</h3>
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.sku} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      
                      <input
                        type="text"
                        value={item.description}
                        readOnly
                        className="flex-1 p-2 bg-transparent border-none font-bold text-gray-800 focus:ring-0"
                      />
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400">QTY:</span>
                        <input
                          type="number"
                          min="1"
                          max={item.maxQty} 
                          value={item.requestQty}
                          onChange={(e) => updateCartQty(item.sku, parseInt(e.target.value), item.maxQty)}
                          className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-center"
                        />
                        <span className="text-xs text-gray-500 w-12">/ {item.maxQty}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.sku)}
                        className="text-red-500 hover:text-red-700 font-bold text-sm px-2 transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={isSubmitting || !fromLocation || !toLocation || cart.length === 0}
                className="flex-1 bg-black text-white font-bold text-lg py-4 rounded-xl hover:bg-gray-800 active:scale-[0.98] transition shadow-md disabled:bg-gray-300 disabled:active:scale-100"
              >
                {isSubmitting ? "Submitting Request..." : "Submit Material Request"}
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