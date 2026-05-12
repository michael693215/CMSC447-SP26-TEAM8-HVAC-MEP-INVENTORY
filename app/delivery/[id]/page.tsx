import Link from "next/link";
import { notFound } from "next/navigation";
import { getDeliveryById } from "@/lib/actions";
import  BackButton from './BackButton'

const STATUS_STYLES: Record<string, string> = {
  "Fulfilled": "bg-green-100 text-green-700",
  "completed": "bg-green-100 text-green-700", 
  "In Transit": "bg-blue-100 text-blue-700",
  "Pending": "bg-yellow-100 text-yellow-700",
  "pending": "bg-yellow-100 text-yellow-700",
};

// Helper function to force consistent MM/DD/YYYY formatting 
// This prevents JavaScript timezone bugs from shifting the day backward!
const formatDate = (dateString: string | null) => {
  if (!dateString) return "";
  const datePart = dateString.split('T')[0]; // Strips off the time if it exists
  const [year, month, day] = datePart.split('-');
  return `${month}/${day}/${year}`; 
};

export default async function RequestDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Await the params object to unwrap it
  const { id } = await params;

  // Pass the unwrapped ID to the database fetcher
  const request = await getDeliveryById(id);

  // If someone types in a fake URL ID, show the Next.js 404 page
  if (!request) {
    notFound();
  }
  
  // We use a fallback here just in case the name hasn't been stitched in actions.ts yet
  const employeeName = request.logistician_name || "Unknown Employee";

  return (
    <div className="min-h-screen p-4 sm:p-8 text-black">
      <div className="max-w-4xl mx-auto">
        <BackButton/>
        {/* Header card */}
        <div className="bg-blue-200 border-2 border-black rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 shadow-lg">
          <div className="flex flex-col gap-4 w-full">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-700 mb-1">Delivery</p>
              {/* Full ID restored with break-all to prevent horizontal scrolling issues on mobile */}
              <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tight break-all">{ id }</h1>
            </div>
            
            {/* CLEAN NEW LAYOUT: Unified metadata box */}
            <div className="bg-white/60 border border-blue-300 rounded-lg p-4 shadow-sm flex flex-col gap-3 w-fit min-w-[300px]">
              
              {/* Top row: Employee and Dates */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 flex-wrap">
                <div className="text-sm text-gray-800">
                  <span className="font-bold text-gray-500 uppercase text-xs tracking-wider mr-2">Corroborated By:</span>
                  <span className="font-black text-base">{employeeName}</span>
                </div>
                {request.datetime && (
                  <div className="text-sm text-gray-800">
                    <span className="font-bold text-gray-500 uppercase text-xs tracking-wider mr-2">Fulfilled:</span>
                    <span className="font-medium">{formatDate(request.datetime)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Items table */}
        <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight mb-4">Transfer Items</h2>
        <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="table-header-accent">
              <tr>
                <th className="p-3 sm:p-4 border-b sticky left-0 z-20 bg-blue-200">#</th>
                <th className="p-3 sm:p-4 border-b">Material</th>
                <th className="p-3 sm:p-4 border-b text-center">Document</th>
                <th className="p-3 sm:p-4 border-b text-center">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {request.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-gray-500 italic">No items on this request.</td>
                </tr>
              ) : (
                request.items.map((item: any) => (
                  <tr key={item.line_number} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                    <td className="p-3 sm:p-4 text-sm text-gray-500 font-mono sticky left-0 z-10 bg-white shadow-[1px_0_0_#e5e7eb]">
                      {item.line_number}
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="font-bold text-black">{item.name}</div>
                      <div className="text-xs text-gray-500 italic mt-0.5">
                        {item.description} ({item.sku})
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 text-center font-mono text-lg font-bold">{ request.source_label }</td>
                    <td className="p-3 sm:p-4 text-center font-mono text-lg font-bold text-blue-600">
                      {item.remaining ?? item.quantity}
                    </td>
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