"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logMaterialFulfillment } from './actions';

interface Item {
  id: string; 
  name: string;
  quantity: string;
  specifications: string;
  maxQty: number; 
}

export default function MaterialsForm() {
  const router = useRouter();
  
  // Header state
  const [requestId, setRequestId] = useState(''); 
  const [dbId, setDbId] = useState(''); 
  
  // NEW: Date state initialized empty to prevent hydration errors
  const [date, setDate] = useState('');         
  
  const [items, setItems] = useState<Item[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 1. SET TODAY'S DATE
    const today = new Date();
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    setDate(localDate);

    // 2. LOAD SESSION DATA
    const savedData = sessionStorage.getItem('selectedRequestData');
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        
        setRequestId(parsed.requestId || parsed.displayId || '');
        setDbId(parsed.id || '');

        if (parsed.items && parsed.items.length > 0) {
          const formattedItems = parsed.items.map((item: any) => {
            const initialQty = parseInt(item.quantity?.toString() || '0');
            return {
              id: item.id.toString(),
              name: item.name || '',
              quantity: initialQty.toString(),
              specifications: item.specifications || '',
              maxQty: initialQty 
            };
          });
          setItems(formattedItems);
        }
      } catch (error) {
        console.error("Failed to parse request data", error);
      }
    } else {
      router.push('/pending-requests');
    }
  }, [router]);

  const updateItemQty = (id: string, newQtyStr: string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        let val = parseInt(newQtyStr);
        if (isNaN(val)) val = 0; 
        if (val < 0) val = 0;
        if (val > item.maxQty) val = item.maxQty;
        
        return { ...item, quantity: val.toString() };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert("You must include at least one item to fulfill this request.");
      return;
    }
    setIsReviewMode(true);
    window.scrollTo(0, 0);
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    
    const result = await logMaterialFulfillment({
      dbId,
      // You can pass the `date` here if you update your actions.ts to log it!
      items: items.map(item => ({
        id: item.id, 
        name: item.name,
        quantity: parseInt(item.quantity),
        specifications: item.specifications
      }))
    });

    if (result.success) {
      alert("Material fulfillment logged successfully!");
      sessionStorage.removeItem('selectedRequestData');
      router.push('/log-delivery');
    } else {
      alert(`Error: ${result.error}`);
      setIsSubmitting(false);
    }
  };

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

        {!isReviewMode && (
          <form onSubmit={handleProceedToReview} className="space-y-8">
            
            {/* Added a grid to put Request ID and Date side-by-side on larger screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Request Reference
                </label>
                <input
                  type="text"
                  value={requestId}
                  readOnly
                  className="w-full p-4 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed font-mono font-bold"
                />
              </div>

              {/* NEW: Date Input */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Date Received
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full p-4 border border-gray-200 rounded-lg bg-white text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Items Received</h2>
              </div>

              {items.length === 0 ? (
                 <p className="text-red-500 italic font-medium p-4 border border-red-200 bg-red-50 rounded-lg">
                   All items removed. You must reload or select a request to fulfill items.
                 </p>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <div key={item.id} className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        
                        <div className="md:col-span-5">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Material Name</label>
                          <p className="font-bold text-gray-900 truncate">{item.name}</p>
                          {item.specifications && (
                            <p className="text-xs text-gray-400 italic mt-1">{item.specifications}</p>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="mt-3 text-[11px] font-black tracking-wider text-red-500 hover:text-red-700 hover:underline uppercase transition flex items-center gap-1"
                          >
                            <span className="text-sm leading-none">×</span> Remove Item
                          </button>
                        </div>

                        <div className="md:col-span-7 flex items-center justify-end gap-4">
                          <div className="flex flex-col items-end">
                            <label className="text-[10px] font-black text-gray-400 uppercase mb-1">Received Qty</label>
                            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white w-40">
                              <button
                                type="button"
                                onClick={() => updateItemQty(item.id, ((parseInt(item.quantity) || 0) - 1).toString())}
                                className="px-4 py-3 bg-gray-50 hover:bg-gray-200 border-r border-gray-300 font-bold transition"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItemQty(item.id, e.target.value)}
                                onFocus={(e) => e.target.select()}
                                className="w-full p-2 text-center focus:outline-none font-bold text-lg"
                              />
                              <button
                                type="button"
                                onClick={() => updateItemQty(item.id, ((parseInt(item.quantity) || 0) + 1).toString())}
                                className="px-4 py-3 bg-gray-50 hover:bg-gray-200 border-l border-gray-300 font-bold transition"
                              >
                                +
                              </button>
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1 font-bold tracking-wide">
                              MAX: {item.maxQty}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={items.length === 0}
              className="w-full bg-blue-600 text-white font-bold text-lg py-5 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Review Request Fulfillment Details
            </button>
          </form>
        )}

        {isReviewMode && (
          <div className="space-y-6">
            <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-gray-50 p-6 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Request ID</p>
                  <p className="text-2xl font-bold text-gray-900">{requestId}</p>
                </div>
                {/* Review mode Date display */}
                <div className="text-right">
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Date</p>
                  <p className="text-xl font-medium text-gray-900">{date}</p>
                </div>
              </div>
              
              <div className="p-0">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                      <th className="p-4 font-bold">Qty</th>
                      <th className="p-4 font-bold">Item Name</th>
                      <th className="p-4 font-bold">Specifications</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
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