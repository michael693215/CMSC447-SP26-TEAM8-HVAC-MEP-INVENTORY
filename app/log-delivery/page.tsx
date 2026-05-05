"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// Import the action you already made for the materials-request page
import { getLocations } from '../materials-requests/actions';

export default function LogDeliveryHub() {
  const router = useRouter();
  const [location, setLocation] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // State to hold real locations from the DB
  const [dbLocations, setDbLocations] = useState<any[]>([]);

  // Fetch real locations on mount
  useEffect(() => {
    async function load() {
      const data = await getLocations();
      setDbLocations(data);
    }
    load();
  }, []);

  const handlePurchaseOrder = () => {
    sessionStorage.setItem('deliveryLocation', location);
    router.push('/scanner'); 
  };

  const handleMaterialsRequest = () => {
    sessionStorage.setItem('deliveryLocation', location);
    router.push('/pending-requests'); 
  };

  return (
    <div className="min-h-screen p-8 text-black bg-white">
      <div className="max-w-3xl mx-auto">
        
        <button 
          onClick={() => router.push('/')} 
          className="text-blue-600 hover:underline mb-6 inline-block font-medium"
        >
          ← Back to Home
        </button>

        <header className="mb-8">
          <h1 className="text-3xl font-bold uppercase tracking-tight">Log Delivery</h1>
          <p className="text-gray-500 mt-2 text-lg">Select your location and delivery type to continue.</p>
        </header>

        <div className="space-y-8">
          
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              Current Location
            </label>
            <div className="relative w-full">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full p-4 border border-gray-300 rounded-lg bg-white font-medium text-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm flex justify-between items-center"
              >
                <span className={`truncate ${!location ? 'text-gray-400' : 'text-gray-900'}`}>
                  {location 
                    ? dbLocations.find(l => l.id === location)?.name 
                    : 'Select a location...'}
                </span>
                <svg className={`h-5 w-5 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                  {dbLocations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => { setLocation(loc.id); setDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-4 text-lg hover:bg-blue-50 transition ${location === loc.id ? 'bg-blue-100 font-bold text-blue-800' : 'text-gray-700'}`}
                    >
                      {loc.name}
                    </button>
                  ))}
                  {dbLocations.length === 0 && (
                    <div className="p-4 text-gray-400 italic">Loading locations...</div>
                  )}
                </div>
              )}
            </div>
            
            {!location && (
              <p className="mt-3 text-red-500 text-sm font-medium">Please select a location to continue.</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={handlePurchaseOrder}
              disabled={!location}
              className={`text-left group border-2 rounded-xl p-6 transition duration-200 
                ${!location 
                  ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed' 
                  : 'bg-white border-gray-200 hover:border-blue-500 hover:shadow-md cursor-pointer active:scale-[0.98]'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition">
                  Purchase Order
                </h2>
                <span className={`transition transform translate-x-[-10px] ${!location ? 'hidden' : 'text-blue-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`}>
                  →
                </span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Delivery corresponds with a purchase order. Scan or manually enter a packing slip.
              </p>
            </button>

            <button 
              onClick={handleMaterialsRequest}
              disabled={!location}
              className={`text-left group border-2 rounded-xl p-6 transition duration-200 
                ${!location 
                  ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed' 
                  : 'bg-white border-gray-200 hover:border-blue-500 hover:shadow-md cursor-pointer active:scale-[0.98]'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition">
                  Materials Request
                </h2>
                <span className={`transition transform translate-x-[-10px] ${!location ? 'hidden' : 'text-blue-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0'}`}>
                  →
                </span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Confirm materials requested from the warehouse have arrived on site.
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}