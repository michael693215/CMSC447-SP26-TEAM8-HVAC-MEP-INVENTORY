import React from "react";
import Link from "next/link";
import { getMaterialRequests } from "./actions";

const STATUS_STYLES: Record<string, string> = {
  "completed": "bg-green-100 text-green-700",
  "In Transit": "bg-blue-100 text-blue-700",
  "Pending": "bg-yellow-100 text-yellow-700",
};

export default async function MaterialsRequestsList() {
  const requests = await getMaterialRequests();

  return (
    <div className="min-h-screen p-4 sm:p-8 text-black">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          &larr; Back to Dashboard
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

        <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="table-header-accent">
              <tr>
                <th className="p-3 sm:p-4 border-b sticky left-0 z-20 bg-blue-200">Request ID</th>
                <th className="p-3 sm:p-4 border-b hidden sm:table-cell">Date</th>
                <th className="p-3 sm:p-4 border-b text-center">Materials</th>
                <th className="p-3 sm:p-4 border-b">Status</th>
                <th className="p-3 sm:p-4 border-b text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req: any) => (
                <tr key={req.id} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                  <td className="p-3 sm:p-4 font-mono font-bold text-sm sticky left-0 z-10 bg-white shadow-[1px_0_0_#e5e7eb]">
                    {req.id.slice(0, 8)}
                  </td>
                  <td className="hidden sm:table-cell p-3 sm:p-4 text-sm whitespace-nowrap text-gray-700">{req.date}</td>
                  <td className="p-3 sm:p-4 text-center">
                    <Link
                      href={`/materials-requests/${req.id}`}
                      className="inline-block w-24 text-center text-xs bg-blue-200 hover:bg-gray-800 hover:text-white px-3 py-1 rounded border border-black transition font-bold whitespace-nowrap"
                    >
                      {req.line_items?.length || 0} {(req.line_items?.length || 0) === 1 ? "material" : "materials"}
                    </Link>
                  </td>
                  <td className="p-3 sm:p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase whitespace-nowrap ${STATUS_STYLES[req.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-right whitespace-nowrap">
                    <Link
                      href={`/materials-requests/${req.id}`}
                      className="inline-block text-xs bg-blue-200 hover:bg-gray-800 hover:text-white px-3 py-1 rounded border border-black transition font-bold whitespace-nowrap"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-500 italic">No material requests found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}