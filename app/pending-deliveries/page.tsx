"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/ui/DataTable';
import { getPendingDeliveryColumns, PendingDeliveryItem } from '@/components/columns/PendingDelivery';
import { getPendingDeliveries, getLocationName } from './actions';

export default function PendingDeliveries() {
  const router = useRouter();
  
  const [currentLocationName, setCurrentLocationName] = useState('Loading...');
  const [locationDeliveries, setLocationDeliveries] = useState<PendingDeliveryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load the selected location and its deliveries on mount
  useEffect(() => {
    async function loadData() {
      const savedLocationId = sessionStorage.getItem('deliveryLocation');
      
      if (!savedLocationId) {
        // If they skipped the hub somehow, send them back
        router.push('/log-delivery');
        return;
      }

      // Fetch the human-readable name and the actual deliveries
      const [locName, deliveries] = await Promise.all([
        getLocationName(savedLocationId),
        getPendingDeliveries(savedLocationId)
      ]);

      setCurrentLocationName(locName);
      setLocationDeliveries(deliveries);
      setIsLoading(false);
    }
    
    loadData();
  }, [router]);

  const handleSelectDelivery = (delivery: any) => {
    sessionStorage.setItem('selectedDeliveryData', JSON.stringify(delivery));
    router.push('/manual-entry'); 
  };

  // --- Dynamic Search Filtering ---
  const displayedDeliveries = locationDeliveries.filter((delivery) => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();

    if (delivery.po_number.toLowerCase().includes(query)) {
      return true;
    }

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
          &larr; Back to Scanner
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-bold uppercase tracking-tight">Pending Deliveries</h1>
          <p className="text-gray-500 mt-2 text-lg">
            Expected deliveries for <span className="font-bold text-blue-600">{currentLocationName}</span>
          </p>
        </header>

        {/* --- Search Bar UI --- */}
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

        {/* --- Builder Table Integration --- */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-gray-500 font-medium">Loading expected deliveries...</div>
          ) : (
            <DataTable 
              columns={getPendingDeliveryColumns(handleSelectDelivery)} 
              data={displayedDeliveries} 
              // Passing a default role just so the action buttons display properly
              role={"project_manager" as any} 
              // Matches our column action handler structure perfectly
              onRowClick={(row) => handleSelectDelivery(row.rawRequest)}
            />
          )}
        </div>

      </div>
    </div>
  );
}