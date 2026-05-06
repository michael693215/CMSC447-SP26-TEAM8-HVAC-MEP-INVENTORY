"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Item {
  id: number;
  name: string;
  quantity: string;
  specifications: string;
}

export default function ManualEntry() {
  const router = useRouter();
  const [poNumber, setPoNumber] = useState('');
  
  // NEW: Date state initialized empty to prevent hydration errors
  const [date, setDate] = useState(''); 
  
  const [items, setItems] = useState<Item[]>([
    { id: Date.now(), name: '', quantity: '', specifications: '' }
  ]);
  
  const [isReviewMode, setIsReviewMode] = useState(false);
  
  // State to track where the user came from
  const [isFromPending, setIsFromPending] = useState(false);

  // Use a separate useEffect just for setting today's date
  useEffect(() => {
    const today = new Date();
    // Adjust for local timezone offset so it doesn't accidentally grab "tomorrow" in UTC
    const localDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    setDate(localDate);
  }, []);

  useEffect(() => {
    const scannedData = sessionStorage.getItem('scannedSlipData');
    const tableData = sessionStorage.getItem('selectedDeliveryData');
    
    if (scannedData) {
      try {
        setIsFromPending(false); // Editable mode
        const parsedData = JSON.parse(scannedData);
        if (parsedData.PO) setPoNumber(parsedData.PO);
        if (parsedData.lineItems && parsedData.lineItems.length > 0) {
          const formattedItems = parsedData.lineItems.map((item: any, index: number) => ({
            id: Date.now() + index,
            name: item.description || '',
            quantity: item.quantityShipped?.toString() || '',
            specifications: item.specifications || ''
          }));
          setItems(formattedItems);
        }
        sessionStorage.removeItem('scannedSlipData'); 
      } catch (error) {
        console.error("Failed to parse scanned data", error);
      }
    } 
    else if (tableData) {
      try {
        setIsFromPending(true); // Locked mode
        const parsedData = JSON.parse(tableData);
        if (parsedData.poNumber) setPoNumber(parsedData.poNumber);
        if (parsedData.items && parsedData.items.length > 0) {
          setItems(parsedData.items);
        }
        sessionStorage.removeItem('selectedDeliveryData'); 
      } catch (error) {
         console.error("Failed to parse table data", error);
      }
    }
  }, []);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), name: '', quantity: '', specifications: '' }]);
  };

  const handleRemoveItem = (idToRemove: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== idToRemove));
    }
  };

  const updateItem = (id: number, field: keyof Item, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setIsReviewMode(true);
    window.scrollTo(0, 0); 
  };

  const handleFinalSubmit = () => {
    // You can now include `date` in your submission payload
    const formData = { poNumber, date, items };
    console.log("FINAL SUBMISSION TO DB:", formData);
    alert("Delivery successfully logged!");
    router.push('/log-delivery'); 
  };

  return (
    <div className="min-h-screen p-8 text-black bg-white">
      <div className="max-w-4xl mx-auto">
        
        <button 
          onClick={() => isReviewMode ? setIsReviewMode(false) : router.back()} 
          className="text-blue-600 hover:underline mb-6 inline-block font-medium"
        >
          {isReviewMode ? "← Back to Edit" : "← Back"}
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-bold uppercase tracking-tight">
            {isReviewMode ? "Confirm Delivery" : "Delivery Form"}
          </h1>
          <p className="text-gray-500 mt-2">
            {isReviewMode ? "Please review the details below before submitting." : "Verify the PO number and log the received items."}
          </p>
        </header>

        {/* --- VIEW 1: THE FORM --- */}
        {!isReviewMode && (
          <form onSubmit={handleProceedToReview} className="space-y-8">
            
            {/* NEW: Placed PO Number and Date in a side-by-side grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">PO Number</label>
                <input 
                  type="text" 
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  readOnly={isFromPending}
                  placeholder="e.g. PO-102938"
                  className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition
                    ${isFromPending 
                      ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed font-medium' 
                      : 'bg-white border-gray-300 text-gray-900'}`}
                  required
                />
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">Date Received</label>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-medium"
                  required
                />
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Items Received</h2>
                {!isFromPending && (
                  <button 
                    type="button"
                    onClick={handleAddItem}
                    className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-200 transition active:scale-95"
                  >
                    + Add Item
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {items.map((item, index) => (
                  <div key={item.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm relative">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Item {index + 1}</h3>
                      {!isFromPending && items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 text-sm font-bold transition px-3 py-1.5 rounded-md"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-4">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                        <input 
                          type="text" 
                          value={item.name}
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          readOnly={isFromPending}
                          className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition
                            ${isFromPending ? 'bg-gray-50 border-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white border-gray-300'}`}
                          required
                        />
                      </div>
                      
                      <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity</label>
                        <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                          <button
                            type="button"
                            onClick={() => updateItem(item.id, 'quantity', Math.max(0, (parseInt(item.quantity) || 0) - 1).toString())}
                            className="px-3 py-2 bg-gray-50 text-gray-600 hover:bg-gray-200 border-r border-gray-300 font-bold transition flex-shrink-0"
                          >
                            −
                          </button>
                          <input 
                            type="number" 
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-full p-2 text-center focus:outline-none appearance-none bg-transparent font-bold text-gray-900"
                            style={{ MozAppearance: 'textfield' }}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => updateItem(item.id, 'quantity', ((parseInt(item.quantity) || 0) + 1).toString())}
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
                          onChange={(e) => updateItem(item.id, 'specifications', e.target.value)}
                          readOnly={isFromPending}
                          className={`w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition
                            ${isFromPending ? 'bg-gray-50 border-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white border-gray-300'}`}
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
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Purchase Order</p>
                  <p className="text-2xl font-bold text-gray-900">{poNumber}</p>
                </div>
                
                {/* NEW: Review mode Date display + shifted the Edit button */}
                <div className="text-right flex flex-col items-end gap-2">
                  <div>
                     <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Date</p>
                     <p className="text-xl font-medium text-gray-900">{date}</p>
                  </div>
                  <button 
                    onClick={() => setIsReviewMode(false)}
                    className="text-blue-600 text-sm font-semibold hover:underline"
                  >
                    Edit Details
                  </button>
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
                className="w-full sm:w-2/3 py-4 text-white font-bold bg-green-600 rounded-xl hover:bg-green-700 transition shadow-md active:scale-[0.98]"
              >
                Confirm & Submit Order
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}