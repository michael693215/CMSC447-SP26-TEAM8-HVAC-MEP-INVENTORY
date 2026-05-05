import React from "react";
import Link from "next/link";
import { getMaterialRequests } from "./actions";

const STATUS_STYLES: Record<string, string> = {
  "Fulfilled": "bg-green-100 text-green-700",
  "In Transit": "bg-blue-100 text-blue-700",
  "Pending": "bg-yellow-100 text-yellow-700",
};

export default async function MaterialsRequestsList() {
  const requests = await getMaterialRequests();

  return (
    <div className="min-h-screen p-4 sm:p-8 text-black bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block font-medium">
          ← Back to Main Menu
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">Materials Requests</h1>
            <p className="text-gray-500 mt-1">Manage and track all outbound material requests.</p>
          </div>
          <Link 
            href="/materials-requests/new"
            className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800 transition shadow-md whitespace-nowrap"
          >
            + Create New Request
          </Link>
        </div>

        <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Request ID</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Items</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req: any) => (
                <tr key={req.id} className="border-b border-gray-100 hover:bg-blue-50 transition">
                  {/* Slicing the UUID so it looks clean! */}
                  <td className="p-4 font-mono font-bold text-gray-900">{req.id.slice(0, 8)}</td>
                  <td className="p-4 text-gray-600">{req.date}</td>
                  
                  <td className="p-4 text-center font-mono font-bold text-gray-700">
                    {/* Looking at the new joined table to count items */}
                    {req.line_items?.length || 0}
                  </td>
                  
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase whitespace-nowrap ${STATUS_STYLES[req.status] || "bg-gray-100 text-gray-600"}`}>
                      {req.status}
                    </span>
                  </td>
                    <td className="p-4 text-right">
                      <Link 
                        href={`/materials-requests/${req.id}`} 
                        className="text-blue-600 font-semibold hover:underline text-sm"
                      >
                        View Details
                      </Link>
                    </td>
                </tr>
              ))} 
              {requests.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 italic">No material requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}