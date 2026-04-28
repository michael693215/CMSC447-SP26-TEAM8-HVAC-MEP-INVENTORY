// File: app/manual-entry/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Define the shape of our item data
interface Item {
  id: number;
  name: string;
  quantity: string;
  specifications: string;
}

export default function ManualEntry() {
  const router = useRouter();
  const [poNumber, setPoNumber] = useState('');
  // Start with one blank item by default
  const [items, setItems] = useState<Item[]>([
    { id: Date.now(), name: '', quantity: '', specifications: '' }
  ]);

  // --- Runs exactly once when the page loads to catch scanner data ---
  useEffect(() => {
    const savedData = sessionStorage.getItem('scannedSlipData');
    
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        
        // 1. Map the PO number
        if (parsedData.PO) {
          setPoNumber(parsedData.PO);
        }

        // 2. Map the Line Items array
        if (parsedData.lineItems && parsedData.lineItems.length > 0) {
          const formattedItems = parsedData.lineItems.map((item: any, index: number) => ({
            id: Date.now() + index, // Ensure unique IDs for React to render properly
            name: item.description || '',               // Maps to "description"
            quantity: item.quantityShipped?.toString() || '', // Maps to "quantityShipped"
            specifications: item.specifications || ''   // Maps to "specifications"
          }));
          
          setItems(formattedItems);
        }

        // 3. Empty the backpack so it doesn't autofill again on a manual page refresh
        // sessionStorage.removeItem('scannedSlipData');

      } catch (error) {
        console.error("Failed to parse scanned data", error);
      }
    }
  }, []);

  // Function to add a new blank item row
  const handleAddItem = () => {
    setItems([
      ...items, 
      { id: Date.now(), name: '', quantity: '', specifications: '' }
    ]);
  };

  // Function to remove a specific item row
  const handleRemoveItem = (idToRemove: number) => {
    // Only allow removal if there is more than 1 item left
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== idToRemove));
    }
  };

  // Function to update a specific field in a specific item
  const updateItem = (id: number, field: keyof Item, value: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  // Function to handle the final submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here is where you will eventually send the data to Supabase!
    const formData = {
      poNumber,
      items
    };
    
    console.log("Submitting Form Data:", formData);
    alert("Form submitted! Check console for data.");
  };

  return (
    <div className="min-h-screen p-8 text-black bg-white">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigation */}
        <button 
          onClick={() => router.back()} 
          className="text-blue-600 hover:underline mb-6 inline-block font-medium"
        >
          ← Back to Scanner
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-bold">MANUAL ENTRY</h1>
          <p className="text-gray-500 mt-2">Enter the PO number and log the received items.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* PO Number Section */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              PO Number
            </label>
            <input 
              type="text" 
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="e.g. PO-102938"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Items Section */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Items Received</h2>
              <button 
                type="button"
                onClick={handleAddItem}
                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-200 transition active:scale-95"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-6">
              {items.map((item, index) => (
                <div key={item.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm relative">
                  
                  {/* Header for each item row */}
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                      Item {index + 1}
                    </h3>
                    
                    {/* Only show the remove button if there is more than 1 item */}
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-semibold transition px-2 py-1 rounded hover:bg-red-50"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Item Name */}
                    <div className="md:col-span-5">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                      <input 
                        type="text" 
                        value={item.name}
                        onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                        placeholder="Item name"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity</label>
                      <input 
                        type="number" 
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                        placeholder="0"
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Specifications */}
                    <div className="md:col-span-5">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Specifications</label>
                      <input 
                        type="text" 
                        value={item.specifications}
                        onChange={(e) => updateItem(item.id, 'specifications', e.target.value)}
                        placeholder="Size, color, material, etc."
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-blue-700 active:scale-[0.99] transition shadow-md"
          >
            Submit Delivery Log
          </button>

        </form>
      </div>
    </div>
  );
}

