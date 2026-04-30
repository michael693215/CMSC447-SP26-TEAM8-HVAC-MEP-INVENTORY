// File: app/pending-deliveries/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const FAKE_DELIVERIES = [
  {
    id: 1,
    location: "Location 1",
    poNumber: "PO-550192",
    items: [
      { id: 101, name: "Galvanized Steel Pipes", quantity: "150", specifications: "2-inch diameter, 10ft length" },
      { id: 102, name: "Pipe Fittings", quantity: "300", specifications: "Elbow, 90 degree" }
    ]
  },
  {
    id: 2,
    location: "Location 1",
    poNumber: "PO-550198",
    items: [
      { id: 103, name: "Drywall Sheets", quantity: "80", specifications: "1/2 inch thick, 4x8" }
    ]
  },
  {
    id: 3,
    location: "Location 2",
    poNumber: "PO-772004",
    items: [
      { id: 104, name: "Roofing Shingles", quantity: "50", specifications: "Asphalt, Architectural, Weathered Wood" },
      { id: 105, name: "Roofing Nails", quantity: "10000", specifications: "1-1/4 inch, Galvanized" },
      { id: 106, name: "Underlayment", quantity: "10", specifications: "Synthetic, 1000 sq ft roll" }
    ]
  }
];

export default function PendingDeliveries() {
  const router = useRouter();
  const [currentLocation, setCurrentLocation] = useState('Location 1');
  const [locationDeliveries, setLocationDeliveries] = useState(FAKE_DELIVERIES);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const savedLocation = sessionStorage.getItem('deliveryLocation');
    if (savedLocation) {
      setCurrentLocation(savedLocation);
      // Save ONLY the deliveries for this location as our base list
      setLocationDeliveries(FAKE_DELIVERIES.filter(d => d.location === savedLocation));
    }
  }, []);

  const handleSelectDelivery = (delivery: any) => {
    sessionStorage.setItem('selectedDeliveryData', JSON.stringify(delivery));
    router.push('/manual-entry'); 
  };

  // --- NEW: Dynamic Search Filtering ---
  const displayedDeliveries = locationDeliveries.filter((delivery) => {
    if (!searchQuery) return true; // If search is empty, show all

    const query = searchQuery.toLowerCase();

    // 1. Check if the PO matches
    if (delivery.poNumber.toLowerCase().includes(query)) {
      return true;
    }

    // 2. Check if ANY item name or specification matches
    const hasMatchingItem = delivery.items.some(item => 
      item.name.toLowerCase().includes(query) || 
      item.specifications.toLowerCase().includes(query)
    );

    return hasMatchingItem;
  });

  return (
    <div className="min-h-screen p-8 text-black bg-gray-50">
      <div className="max-w-6xl mx-auto">
        
        <button 
          onClick={() => router.back()} 
          className="text-blue-600 hover:underline mb-6 inline-block font-medium"
        >
          ← Back to Scanner
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-bold uppercase tracking-tight">Pending Deliveries</h1>
          <p className="text-gray-500 mt-2 text-lg">
            Expected deliveries for <span className="font-bold text-blue-600">{currentLocation}</span>
          </p>
        </header>

        {/* --- NEW: Search Bar UI --- */}
        <div className="mb-6 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by PO number or item name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-4 border border-gray-300 rounded-xl bg-white font-medium text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-sm uppercase tracking-wider text-gray-600">
                <th className="p-4 font-bold">PO Number</th>
                <th className="p-4 font-bold">Items Expected</th>
                <th className="p-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedDeliveries.map((delivery) => (
                <tr 
                  key={delivery.id} 
                  onClick={() => handleSelectDelivery(delivery)}
                  className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition"
                >
                  <td className="p-4 font-bold text-gray-900">{delivery.poNumber}</td>
                  <td className="p-4">
                    <ul className="text-sm text-gray-600 list-disc list-inside">
                      {delivery.items.map((item: any) => (
                        <li key={item.id}>
                          <span className="font-semibold text-gray-800">{item.quantity}x</span> {item.name} <span className="text-gray-400">({item.specifications})</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="p-4 text-right">
                    <button className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-200 transition active:scale-95">
                      Select →
                    </button>
                  </td>
                </tr>
              ))}
              
              {/* Empty States */}
              {locationDeliveries.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500 italic">
                    No pending deliveries found for this location.
                  </td>
                </tr>
              )}
              {locationDeliveries.length > 0 && displayedDeliveries.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500 italic">
                    No results found for &quot;<span className="font-semibold">{searchQuery}</span>&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}