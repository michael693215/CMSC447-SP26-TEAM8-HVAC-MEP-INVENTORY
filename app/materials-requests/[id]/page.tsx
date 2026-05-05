import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMaterialRequestById } from "../actions";

const STATUS_STYLES: Record<string, string> = {
  "Fulfilled": "bg-green-100 text-green-700",
  "In Transit": "bg-blue-100 text-blue-700",
  "Pending": "bg-yellow-100 text-yellow-700",
};

// 1. Update the TypeScript definition so params is a Promise
export default async function RequestDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  
  // 2. Await the params object to unwrap it!
  const { id } = await params;

  // 3. Now you can safely pass the unwrapped ID to the database fetcher
  const request = await getMaterialRequestById(id);

  // If someone types in a fake URL ID, show the Next.js 404 page
  if (!request) {
    notFound();
  }

  // ... (The rest of your return statement stays exactly the same)
  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-50 flex flex-col items-center text-black">
      <div className="w-full max-w-4xl mb-4">
        <Link href="/materials-requests" className="text-blue-600 hover:underline font-medium">
          ← Back to Requests
        </Link>
      </div>

      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* HEADER SECTION */}
        <div className="p-6 sm:p-10 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
              {request.request_id}
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              Requested on: <span className="text-gray-800">{request.date}</span>
            </p>
          </div>
          <div>
            <span className={`px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider ${STATUS_STYLES[request.status] || "bg-gray-200 text-gray-800"}`}>
              {request.status}
            </span>
          </div>
        </div>

        {/* LINE ITEMS SECTION */}
        <div className="p-6 sm:p-10">
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-6">Transfer Items</h2>
          
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-4 font-bold text-gray-500 uppercase tracking-wider">Line</th>
                  <th className="p-4 font-bold text-gray-500 uppercase tracking-wider">Material</th>
                  <th className="p-4 font-bold text-gray-500 uppercase tracking-wider text-center">Qty</th>
                  <th className="p-4 font-bold text-gray-500 uppercase tracking-wider">From (Source)</th>
                  <th className="p-4 font-bold text-gray-500 uppercase tracking-wider">To (Destination)</th>
                </tr>
              </thead>
              <tbody>
                {request.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500 italic">No items found for this request.</td>
                  </tr>
                ) : (
                  request.items.map((item: any) => (
                    <tr key={item.line_number} className="border-b border-gray-100 last:border-0 hover:bg-blue-50 transition">
                      <td className="p-4 font-mono text-gray-500">{item.line_number}</td>
                      <td className="p-4 font-bold text-gray-900">{item.description}</td>
                      <td className="p-4 font-mono font-bold text-center">{item.quantity}</td>
                      <td className="p-4 text-gray-600 text-xs sm:text-sm">{item.from_name}</td>
                      <td className="p-4 text-gray-600 text-xs sm:text-sm">{item.to_name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}