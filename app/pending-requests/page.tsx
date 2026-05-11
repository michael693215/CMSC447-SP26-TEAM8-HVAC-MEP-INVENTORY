"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { getPendingMaterialRequests } from './actions';
import { getLocations } from '../materials-requests/actions';

// Import your Builder and Blueprint!
import { DataTable } from "@/components/ui/DataTable";
import { getPendingRequestColumns, PendingRequestItem } from "@/components/columns/PendingRequest";

export default function PendingRequests() {
  const router = useRouter();
  const [addressName, setAddressName] = useState('Loading address...');
  const [locationRequests, setLocationRequests] = useState<PendingRequestItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // 1. Get the current location UUID from session
      const savedLocationId = sessionStorage.getItem('deliveryLocation');
      
      if (!savedLocationId) {
        router.push('/log-delivery');
        return;
      }

      // 2. Fetch data in parallel
      const [allLocations, rawData] = await Promise.all([
        getLocations(),
        getPendingMaterialRequests()
      ]);

      // 3. Find the pretty address for the header
      const currentLoc = allLocations.find((l: any) => l.id === savedLocationId);
      setAddressName(currentLoc ? currentLoc.name : "Unknown Location");

      // 4. Filter and format the requests for the DataTable
      const formatted: PendingRequestItem[] = rawData
        .filter((req: any) => {
          // Only keep requests that have items for this location that still need to be received
          return req.line_items?.some((item: any) => {
             const remaining = (item.remaining !== undefined && item.remaining !== null) ? item.remaining : item.quantity;
             return item.to_id === savedLocationId && remaining > 0;
          });
        })
        .map((req: any) => ({
          id: req.id,
          displayId: req.id,
          rawRequest: req, // Saving this for handleSelectRequest
          items: req.line_items
            .filter((item: any) => item.to_id === savedLocationId)
            .map((item: any) => {
              // Explicitly prioritize the remaining amount!
              const displayQty = (item.remaining !== undefined && item.remaining !== null) 
                ? item.remaining 
                : item.quantity;

              return {
                id: item.line_number?.toString() || Math.random().toString(), 
                line_number: item.line_number,
                name: item.name,
                quantity: displayQty
              };
            })
            .filter((item: any) => item.quantity > 0) // Hide fully received line items
        }));

      setLocationRequests(formatted);
      setIsLoading(false);
    }
    
    loadData();
  }, [router]);

  const handleSelectRequest = (rawRequest: any) => {
    sessionStorage.setItem('selectedRequestData', JSON.stringify(rawRequest));
    router.push('/materials-form'); 
  };

  const displayedRequests = locationRequests.filter((request) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    if (request.displayId.toLowerCase().includes(query)) return true;
    return request.items.some(item => item.name.toLowerCase().includes(query));
  });

  return (
    <div className="min-h-screen p-8 text-black bg-gray-50">
      <div className="max-w-6xl mx-auto">
        
        <button 
          onClick={() => router.push('/log-delivery')} 
          className="text-blue-600 hover:underline mb-6 inline-block font-medium"
        >
          &larr; Back to Hub
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-bold uppercase tracking-tight">Pending Requests</h1>
          <p className="text-gray-500 mt-2 text-lg">
            Materials requested for <span className="font-bold text-blue-600">{addressName}</span>
          </p>
        </header>

        {/* Search Bar */}
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

        {/* Builder Table! */}
        <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-200">
          {isLoading ? (
            <div className="p-10 text-center text-gray-500 font-medium">Loading pending requests...</div>
          ) : (
            <DataTable 
              columns={getPendingRequestColumns(handleSelectRequest)} 
              data={displayedRequests} 
              // Passing administrator as a default role so the actions render
              role={"administrator" as any} 
              // This gives us the row hover effect from the Builders
              onRowClick={(row) => handleSelectRequest(row.rawRequest)}
            />
          )}
        </div>

      </div>
    </div>
  );
}