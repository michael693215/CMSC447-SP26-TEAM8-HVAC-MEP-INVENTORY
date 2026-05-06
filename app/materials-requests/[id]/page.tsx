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
    <div className="min-h-screen p-4 sm:p-8 text-black">
      <div className="max-w-4xl mx-auto">
        <Link href="/materials-requests" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          &larr; Back to Requests
        </Link>

        {/* Header card */}
        <div className="bg-blue-200 border-2 border-black rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 shadow-lg">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-1">Materials Request</p>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tight mb-3">{request.id}</h1>
            {request.date && (
              <div className="text-sm text-gray-700">
                <span className="font-semibold">Requested on:</span> {request.date}
              </div>
            )}
          </div>
          {request.status && (
            <span className={`self-start px-3 py-1 rounded text-xs font-bold uppercase whitespace-nowrap ${STATUS_STYLES[request.status] ?? "bg-gray-100 text-gray-600"}`}>
              {request.status}
            </span>
          )}
        </div>

        {/* Items table */}
        <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight mb-4">Transfer Items</h2>
        <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="table-header-accent">
              <tr>
                <th className="p-3 sm:p-4 border-b sticky left-0 z-20 bg-blue-200">#</th>
                <th className="p-3 sm:p-4 border-b">Material</th>
                <th className="p-3 sm:p-4 border-b text-center">Qty</th>
                <th className="p-3 sm:p-4 border-b">From</th>
                <th className="p-3 sm:p-4 border-b">To</th>
              </tr>
            </thead>
            <tbody>
              {request.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-500 italic">No items on this request.</td>
                </tr>
              ) : (
                request.items.map((item: any) => (
                  <tr key={item.line_number} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                    <td className="p-3 sm:p-4 text-sm text-gray-500 font-mono sticky left-0 z-10 bg-white shadow-[1px_0_0_#e5e7eb]">
                      {item.line_number}
                    </td>
                    <td className="p-3 sm:p-4 font-semibold">{item.description}</td>
                    <td className="p-3 sm:p-4 text-center font-mono text-lg font-bold">{item.quantity}</td>
                    <td className="p-3 sm:p-4 text-sm text-gray-700">{item.from_name}</td>
                    <td className="p-3 sm:p-4 text-sm text-gray-700">{item.to_name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}