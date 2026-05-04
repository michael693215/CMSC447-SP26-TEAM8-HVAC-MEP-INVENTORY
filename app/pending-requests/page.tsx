"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPendingMaterialRequests } from './actions';

export default function PendingRequests() {
  const router = useRouter();
  const [currentLocation, setCurrentLocation] = useState('Location 1');
  const [locationRequests, setLocationRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRequests() {
      // 1. Get the location from the user's session
      const savedLocation = sessionStorage.getItem('deliveryLocation') || 'Location 1';
      setCurrentLocation(savedLocation);

      // 2. Fetch the data from Supabase
      const rawData = await getPendingMaterialRequests();

      // 3. Filter by location AND translate the Supabase format into the format your UI expects
      const formattedRequests = rawData
        .filter((r: any) => r.location === savedLocation)
        .map((req: any) => ({
          id: req.id,
          location: req.location,
          requestId: req.request_id, // Map Supabase column name to UI variable
          items: req.products ? req.products.map((p: any, idx: number) => ({
            id: p.id || idx,
            name: p.name || '',
            quantity: p.qty || '', // Translate 'qty' to 'quantity'
            specifications: p.specs || '' // Translate 'specs' to 'specifications'
          })) : []
        }));

      setLocationRequests(formattedRequests);
      setIsLoading(false);
    }
    
    loadRequests();
  }, []);

  const handleSelectRequest = (request: any) => {
    sessionStorage.setItem('selectedRequestData', JSON.stringify(request));
    router.push('/materials-form'); 
  };

  const displayedRequests = locationRequests.filter((request) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    
    if (request.requestId.toLowerCase().includes(query)) return true;
    
    const hasMatchingItem = request.items.some((item: any) => 
      item.name.toLowerCase().includes(query) || 
      (item.specifications && item.specifications.toLowerCase().includes(query))
    );
    return hasMatchingItem;
  });

  return (
    <div className="min-h-screen p-8 text-black bg-gray-50">
      <div className="max-w-6xl mx-auto">
        
        <button 
          onClick={() => router.push('/log-delivery')} 
          className="text-blue-600 hover:underline mb-6 inline-block font-medium"
        >
          ← Back to Hub
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-bold uppercase tracking-tight">Pending Requests</h1>
          <p className="text-gray-500 mt-2 text-lg">
            Materials requested for <span className="font-bold text-blue-600">{currentLocation}</span>
          </p>
        </header>

        <div className="mb-6 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by Request ID or item name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-4 border border-gray-300 rounded-xl bg-white font-medium text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition"
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-sm uppercase tracking-wider text-gray-600">
                <th className="p-4 font-bold">Request ID</th>
                <th className="p-4 font-bold">Items Expected</th>
                <th className="p-4 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500 font-medium">
                    Loading pending requests...
                  </td>
                </tr>
              ) : (
                <>
                  {displayedRequests.map((request) => (
                    <tr 
                      key={request.id} 
                      onClick={() => handleSelectRequest(request)}
                      className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition"
                    >
                      <td className="p-4 font-bold text-gray-900">{request.requestId}</td>
                      <td className="p-4">
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {request.items.map((item: any) => (
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
                  
                  {!isLoading && locationRequests.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-500 italic">
                        No pending requests found for this location.
                      </td>
                    </tr>
                  )}
                  {!isLoading && locationRequests.length > 0 && displayedRequests.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-500 italic">
                        No results found for &quot;<span className="font-semibold">{searchQuery}</span>&quot;
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}