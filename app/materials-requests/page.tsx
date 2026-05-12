import React from "react";
import Link from "next/link";
import { getMaterialRequests } from "@/lib/actions";
import { getUserRole } from "@/lib/actions"; // Assuming this is where your role function lives

// Import your Builder and Blueprint!
import { DataTable } from "@/components/ui/DataTable";
import { materialsRequestColumns } from "@/components/columns/MaterialsRequest";

export default async function MaterialsRequestsList() {
  // 1. Fetch the data and the user role directly on the server
  const requests = await getMaterialRequests();
  const role = await getUserRole();

  return (
    <div className="min-h-screen p-4 sm:p-8 text-black">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block font-medium">
          &larr; Back to Main Menu
        </Link>

        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight">Materials Requests</h1>
            <p className="text-gray-500 mt-1 text-sm">Manage and track all outbound material requests.</p>
          </div>
          <Link
            href="/materials-requests/new"
            className="btn-accent px-4 py-2 shrink-0 text-sm"
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