"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPendingMaterialRequests } from './actions';
import { getLocations } from '../materials-requests/actions';

export default function PendingRequests() {
  const router = useRouter();
  const [addressName, setAddressName] = useState('Loading address...');
  const [locationRequests, setLocationRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // 1. Get the current location UUID from session
      const savedLocationId = sessionStorage.getItem('deliveryLocation');
      
      if (!savedLocationId) {
        // Fallback in case someone navigates here directly without picking a location
        router.push('/log-delivery');
        return;
      }

      // 2. Fetch data in parallel for speed
      const [allLocations, rawData] = await Promise.all([
        getLocations(),
        getPendingMaterialRequests()
      ]);

      // 3. Find the pretty address for the header
      const currentLoc = allLocations.find(l => l.id === savedLocationId);
      setAddressName(currentLoc ? currentLoc.name : "Unknown Location");

      // 4. Filter and format the requests
      const formatted = rawData
        .filter((req: any) => {
          // Using to_id to determine the destination of the items
          return req.line_items?.some((item: any) => item.to_id === savedLocationId);
        })
        .map((req: any) => ({
          id: req.id,
          // Slice the ID to 8 characters and keep it lowercase to match the other table perfectly
          displayId: req.id.slice(0, 8),
          items: req.line_items
            // Using to_id to determine the destination of the items
            .filter((item: any) => item.to_id === savedLocationId)
            .map((item: any) => ({
              // FIX: We use line_number here because the line item table doesn't have an ID
              id: item.line_number.toString(), 
              line_number: item.line_number,
              name: item.materials?.description || "Unknown Material",
              quantity: item.quantity
            }))
        }));

      setLocationRequests(formatted);
      setIsLoading(false);
    }
    
    loadData();
  }, [router]);

  const handleSelectRequest = (request: any) => {
    sessionStorage.setItem('selectedRequestData', JSON.stringify(request));
    router.push('/materials-form'); 
  };

  const displayedRequests = locationRequests.filter((request) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    if (request.displayId.toLowerCase().includes(query)) return true;
    return request.items.some((item: any) => item.name.toLowerCase().includes(query));
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
            Materials requested for <span className="font-bold text-blue-600">{addressName}</span>
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
                      <td className="p-4 font-bold text-gray-900">{request.displayId}</td>
                      <td className="p-4">
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {request.items.map((item: any) => (
                            <li key={`${request.id}-${item.line_number}`}>
                              <span className="font-semibold text-gray-800">{item.quantity}x</span> {item.name}
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