import React from "react";
import Link from "next/link";
import { getMaterialRequests } from "./actions";
import { getUserRole } from "@/lib/actions"; // Assuming this is where your role function lives

// Import your Builder and Blueprint!
import { DataTable } from "@/components/ui/DataTable";
import { materialsRequestColumns } from "@/components/columns/MaterialsRequest";

export default async function MaterialsRequestsList() {
  // 1. Fetch the data and the user role directly on the server
  const requests = await getMaterialRequests();
  const role = await getUserRole();

  return (
    <div className="min-h-screen p-4 sm:p-8 text-black bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block font-medium">
          &larr; Back to Main Menu
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Materials Requests</h1>
            <p className="text-gray-500 mt-1">Manage and track all outbound material requests.</p>
          </div>
          <Link 
            href="/materials-requests/new"
            className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition shadow-md whitespace-nowrap w-full sm:w-auto text-center"
          >
            + Create New Request
          </Link>
        </div>

        {/* 2. Feed the data and the columns to the DataTable */}
        <div className="bg-white shadow-md rounded-xl overflow-hidden border border-gray-200">
            <DataTable 
                columns={materialsRequestColumns} 
                data={requests} 
                role={role} 
            />
        </div>

      </div>
    </div>
  );
}