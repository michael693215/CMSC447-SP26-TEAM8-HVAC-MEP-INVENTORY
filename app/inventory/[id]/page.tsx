"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { LocationMaterial } from "@/components/columns/LocationMaterials";
import { locationMaterialsColumns } from "@/components/columns/LocationMaterials";
import { getInventoryByLocation, getUserRole } from "@/lib/actions";
import { Role } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function InventoryPage() {
  const router = useRouter();
  const params = useParams();
  const [products, setProducts] = useState<any[]>([]);
  const [role, setRole] = useState<Role>('unassigned');
  const [isLoading, setIsLoading] = useState(true);
  const locationId = params.id as string;

  // Load live database inventory on mount
  useEffect(() => {
    async function loadData() {
      const userRole = await getUserRole();
      const data = await getInventoryByLocation(locationId);
      setProducts(data);
      setRole(userRole);
      setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading) 
  {
      return (<div className="flex justify-center min-h-screen items-center">Loading data...</div>);
  }


  return (
    <div className="min-h-screen p-4 sm:p-8 text-black">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => router.back() } className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          &larr; Back to Locations
        </button>

        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight">Inventory for { products[0].location_name }</h1>
        </div>

        {/* Search + filters */}
        <div className="bg-white p-3 sm:p-4 rounded-t-lg border-x border-t border-gray-200 flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[180px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by part name, SKU, or description..."
              className="input-themed block w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow-md rounded-b-lg overflow-hidden border border-gray-200">
          <DataTable columns={ locationMaterialsColumns } data={ products } role={ role } /> 
        </div>
      </div>
    </div>
  );
}