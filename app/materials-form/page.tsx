"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Item {
  id: number;
  name: string;
  quantity: string;
  specifications: string;
}

export default function MaterialsForm() {
  const router = useRouter();
  const [requestId, setRequestId] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);

  useEffect(() => {
    const tableData = sessionStorage.getItem('selectedRequestData');
    if (tableData) {
      try {
        const parsedData = JSON.parse(tableData);
        if (parsedData.requestId) setRequestId(parsedData.requestId);
        if (parsedData.items && parsedData.items.length > 0) {
          setItems(parsedData.items);
        }
        sessionStorage.removeItem('selectedRequestData'); 
      } catch (error) {
         console.error("Failed to parse table data", error);
      }
    }
  }, []);

  const updateItemQuantity = (id: number, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, quantity: value } : item));
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setIsReviewMode(true);
    window.scrollTo(0, 0); 
  };

  const handleFinalSubmit = () => {
    const formData = { requestId, items };
    console.log("FINAL SUBMISSION TO DB:", formData);
    alert("Materials delivery successfully verified!");
    router.push('/log-delivery'); 
  };

  return (
    <div className="min-h-screen p-8 text-black bg-white">
      <div className="max-w-4xl mx-auto">
        
        <button 
          onClick={() => isReviewMode ? setIsReviewMode(false) : router.back()} 
          className="text-blue-600 hover:underline mb-6 inline-block font-medium"
        >
          {isReviewMode ? "← Back to Edit" : "← Back to Requests"}
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-bold uppercase tracking-tight">
            {isReviewMode ? "Confirm Arrival" : "Verify Materials"}
          </h1>
          <p className="text-gray-500 mt-2">
            {isReviewMode 
              ? "Please review the details below before submitting." 
              : "Verify the quantities of the materials received."}
          </p>
        </header>

        {/* --- VIEW 1: THE FORM --- */}
        {!isReviewMode && (
          <form onSubmit={handleProceedToReview} className="space-y-8">
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <label className="block text-sm font-bold text-gray-700 mb-2">Request ID</label>
              <input 
                type="text" 
                value={requestId}
                readOnly
                className="w-full p-3 bg-gray-100 border border-gray-200 text-gray-500 rounded-lg cursor-not-allowed font-medium transition"
              />
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h2 className="text-xl font-bold mb-4">Items Expected</h2>

              <div className="space-y-6">
                {items.map((item, index) => (
                  <div key={item.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm relative">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Item {index + 1}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-4">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                        <input 
                          type="text" 
                          value={item.name}
                          readOnly
                          className="w-full p-2 bg-gray-50 border border-gray-100 text-gray-500 rounded-md cursor-not-allowed transition"
                        />
                      </div>
                      
                      <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity Received</label>
                        {/* Only the quantity remains editable */}
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.id, Math.max(0, (parseInt(item.quantity) || 0) - 1).toString())}
                            className="px-3 py-2 bg-gray-50 text-gray-600 hover:bg-gray-200 border-r border-gray-300 font-bold transition flex-shrink-0"
                          >
                            −
                          </button>
                          <input 
                            type="number" 
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.id, e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-full p-2 text-center focus:outline-none appearance-none bg-transparent font-bold text-gray-900"
                            style={{ MozAppearance: 'textfield' }}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => updateItemQuantity(item.id, ((parseInt(item.quantity) || 0) + 1).toString())}
                            className="px-3 py-2 bg-gray-50 text-gray-600 hover:bg-gray-200 border-l border-gray-300 font-bold transition flex-shrink-0"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="md:col-span-5">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Specifications</label>
                        <input 
                          type="text" 
                          value={item.specifications}
                          readOnly
                          className="w-full p-2 bg-gray-50 border border-gray-100 text-gray-500 rounded-md cursor-not-allowed transition"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-blue-700 active:scale-[0.99] transition shadow-md"
            >
              Review Delivery
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
                  <p className="text-2xl font-bold text-gray-900">{requestId}</p>
                </div>

              </div>
              
              <div className="p-0">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                      <th className="p-4 font-bold">Qty Rcvd</th>
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
                className="w-full sm:w-2/3 py-4 text-white font-bold bg-green-600 rounded-xl hover:bg-green-700 transition shadow-md active:scale-[0.98]"
              >
                Confirm & Submit Request
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}