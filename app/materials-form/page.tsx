"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logMaterialFulfillment } from './actions';

interface Item {
  sku: string; 
  name: string;
  quantity: string | number; 
  maxQty: number; 
  specifications: string;
}

export default function MaterialsForm() {
  const router = useRouter();
  
  // Header state
  const [requestId, setRequestId] = useState(''); 
  const [dbId, setDbId] = useState('');           
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Form State
  const [items, setItems] = useState<Item[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedData = sessionStorage.getItem('selectedRequestData');
    const savedLocationId = sessionStorage.getItem('deliveryLocation');
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        
        const actualId = parsed?.rawRequest?.id || parsed?.id || '';
        const displayId = parsed?.displayId || parsed?.rawRequest?.id || parsed?.id || '';
        
        setRequestId(displayId);
        setDbId(actualId);

        let sourceItems = parsed?.rawRequest?.line_items || parsed?.line_items || parsed?.items || [];

        if (savedLocationId) {
          sourceItems = sourceItems.filter((item: any) => item.to_id === savedLocationId);
        }

        const formattedItems = sourceItems.map((item: any) => {
          let maxAllowed = 1;
          if (item.remaining !== undefined && item.remaining !== null) {
            maxAllowed = parseInt(item.remaining, 10);
          } else if (item.quantity !== undefined && item.quantity !== null) {
            maxAllowed = parseInt(item.quantity, 10);
          } else if (item.total !== undefined && item.total !== null) {
            maxAllowed = parseInt(item.total, 10);
          }

          return {
            sku: item.sku || item.id, 
            name: item.name || 'Unknown Material',
            quantity: maxAllowed.toString(), 
            maxQty: maxAllowed,              
            specifications: item.specifications || ''
          };
        });

        setItems(formattedItems);
      } catch (error) {
        console.error("Failed to parse request data", error);
      }
    } else {
      router.push('/pending-requests');
    }
  }, [router]);

  const updateItemQty = (sku: string, val: string, maxQty: number) => {
    if (val === "") {
      setItems(items.map(item => item.sku === sku ? { ...item, quantity: "" } : item));
      return;
    }

    let finalQty = parseInt(val, 10);
    if (isNaN(finalQty)) return;
    
    if (finalQty > maxQty) finalQty = maxQty;
    if (finalQty < 0) finalQty = 0; 

    setItems(items.map(item => item.sku === sku ? { ...item, quantity: finalQty.toString() } : item));
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setIsReviewMode(true);
    window.scrollTo(0, 0);
  };

  const handleFinalSubmit = async () => {
    // BULLETPROOF: Synchronous block to completely prevent double-click race conditions!
    if (isSubmitting) return; 
    setIsSubmitting(true);
    
    const itemsToSubmit = items
      .filter(item => parseInt(item.quantity.toString()) > 0)
      .map(item => ({
        sku: item.sku, 
        name: item.name,
        quantity: parseInt(item.quantity.toString()) || 0, 
        specifications: item.specifications
      }));

    const result = await logMaterialFulfillment({
      dbId,
      date, 
      items: itemsToSubmit
    });

    if (result.success) {
      alert("Material request fulfilled successfully!");
      sessionStorage.removeItem('selectedRequestData');
      router.push('/log-delivery');
    } else {
      alert(`Error: ${result.error}`);
      setIsSubmitting(false); // Only re-enable the button if it failed!
    }
  };

  const validItemsCount = items.filter(item => parseInt(item.quantity.toString()) > 0).length;

  return (
    <div className="min-h-screen p-8 text-black bg-white">
      <div className="max-w-4xl mx-auto">

        <button
          onClick={() => isReviewMode ? setIsReviewMode(false) : router.push('/pending-requests')}
          className="text-blue-600 hover:underline mb-6 inline-block font-medium"
        >
          {isReviewMode ? "← Back to Edit" : "← Back to Pending Requests"}
        </button>

        <header className="mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold uppercase tracking-tight">
            {isReviewMode ? "Confirm Fulfillment" : "Materials Form"}
          </h1>
          <p className="text-gray-500 mt-2">
            {isReviewMode
              ? "Review the quantities below before confirming receipt."
              : "Verify received quantities for this material request."}
          </p>
        </header>

        {/* --- VIEW 1: THE FORM --- */}
        {!isReviewMode && (
          <form onSubmit={handleProceedToReview} className="space-y-8">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Request Reference
                </label>
                <input
                  type="text"
                  value={requestId}
                  readOnly
                  className="w-full p-4 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed font-mono font-bold uppercase"
                />
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Fulfillment Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full p-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 font-bold transition"
                />
              </div>

            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h2 className="text-xl font-bold mb-4">Items Expected</h2>

              <div className="space-y-6">
                {items.length === 0 ? (
                  <p className="text-gray-500 italic p-4 text-center border-2 border-dashed rounded-lg">No items found for this location.</p>
                ) : (
                  items.map((item) => (
                    <div key={item.sku} className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        
                        <div className="md:col-span-5">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Material Name</label>
                          <p className="font-bold text-gray-900 truncate">{item.name}</p>
                          {item.maxQty === 0 && (
                            <span className="text-xs font-bold text-green-600 uppercase">Fully Received</span>
                          )}
                        </div>

                        <div className="md:col-span-7 flex items-center justify-end gap-4">
                          <label className="text-[10px] font-black text-gray-400 uppercase">Receiving Now</label>
                          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white w-40">
                            <button
                              type="button"
                              onClick={() => updateItemQty(item.sku, Math.max(0, (parseInt(item.quantity.toString()) || 0) - 1).toString(), item.maxQty)}
                              className="px-4 py-3 bg-gray-50 hover:bg-gray-200 border-r border-gray-300 font-bold transition disabled:opacity-50"
                              disabled={item.maxQty === 0}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="0"
                              max={item.maxQty}
                              value={item.quantity}
                              disabled={item.maxQty === 0}
                              onChange={(e) => updateItemQty(item.sku, e.target.value, item.maxQty)}
                              onBlur={(e) => {
                                const val = parseInt(e.target.value);
                                if (isNaN(val)) {
                                  updateItemQty(item.sku, item.maxQty.toString(), item.maxQty);
                                } else if (val < 0) {
                                  updateItemQty(item.sku, "0", item.maxQty);
                                }
                              }}
                              className="w-full p-2 text-center focus:outline-none font-bold text-lg disabled:bg-gray-100 disabled:text-gray-400"
                            />
                            <button
                              type="button"
                              onClick={() => updateItemQty(item.sku, Math.min(item.maxQty, (parseInt(item.quantity.toString()) || 0) + 1).toString(), item.maxQty)}
                              className="px-4 py-3 bg-gray-50 hover:bg-gray-200 border-l border-gray-300 font-bold transition disabled:opacity-50"
                              disabled={item.maxQty === 0}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={validItemsCount === 0}
              className="w-full bg-blue-600 text-white font-bold text-lg py-5 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition shadow-lg disabled:bg-gray-300"
            >
              {validItemsCount === 0 ? "No items to fulfill" : "Review Request Fulfillment Details"}
            </button>
          </form>
        )}

       {/* --- VIEW 2: THE RECEIPT/CONFIRMATION SCREEN --- */}
        {isReviewMode && (
          <div className="space-y-6">
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Request ID</p>
                  <p className="text-2xl font-bold text-gray-900 truncate uppercase">{requestId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Date</p>
                  <p className="text-lg font-bold text-gray-900">{date}</p>
                </div>
              </div>
              
              <div className="p-0">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                      <th className="p-4 font-bold">Qty Received</th>
                      <th className="p-4 font-bold">Item Name</th>
                      <th className="p-4 font-bold">Specifications</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.filter(item => parseInt(item.quantity.toString()) > 0).map((item) => (
                      <tr key={item.sku} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                        <td className="p-4 font-bold text-gray-900">{item.quantity}</td>
                        <td className="p-4 font-medium text-gray-800">{item.name}</td>
                        <td className="p-4 text-gray-500 text-sm">{item.specifications || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => setIsReviewMode(false)}
                className="w-full sm:w-1/3 py-4 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition active:scale-[0.98]"
              >
                Make Changes
              </button>
              
              <button 
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-2/3 py-4 text-white font-bold bg-green-600 rounded-xl hover:bg-green-700 transition shadow-md active:scale-[0.98] disabled:bg-gray-300"
              >
                {isSubmitting ? "Submitting..." : "Confirm & Fulfill Request"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}