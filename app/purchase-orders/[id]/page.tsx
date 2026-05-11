import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const STATUS_STYLES: Record<string, string> = {
  "Received":   "bg-green-100 text-green-700",
  "received":   "bg-green-100 text-green-700",
  "In Transit": "bg-blue-100 text-blue-700",
  "in transit": "bg-blue-100 text-blue-700",
  "Pending":    "bg-yellow-100 text-yellow-700",
  "pending":    "bg-yellow-100 text-yellow-700",
};

// Helper function to force consistent MM/DD/YYYY formatting 
// This prevents JavaScript timezone bugs from shifting the day backward!
const formatDate = (dateString: string | null) => {
  if (!dateString) return "";
  const datePart = dateString.split('T')[0]; // Strips off the time if it exists
  const [year, month, day] = datePart.split('-');
  return `${month}/${day}/${year}`; 
};

export default async function PurchaseOrderDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  
  // Await the params object to unwrap it
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  // Initialize server-side Supabase client
  const supabase = await createClient();

  // Deep relational fetch matching your exact schema
  const { data: po, error } = await supabase
    .from("purchase_order")
    .select(`
      po_number, 
      date, 
      status, 
      pm_id,
      employee ( first_name, last_name ),
      location ( name ),
      purchase_order_materials (
        total,
        remaining,
        sku,
        materials (
          name,
          description
        )
      )
    `)
    .eq("po_number", decodedId)
    .maybeSingle();

  // If someone types in a fake URL ID, show the Next.js 404 page
  if (error || !po) {
    notFound();
  }

  // Safely unwrap the relational location array
  const locData = Array.isArray(po.location) ? po.location[0] : po.location;
  const destinationName = locData?.name || "Unknown Location";

  // Safely unwrap the relational employee array to get the First and Last Name
  const empData = Array.isArray(po.employee) ? po.employee[0] : po.employee;
  let uploaderName = "Unknown Employee";
  
  if (empData?.first_name || empData?.last_name) {
    uploaderName = `${empData.first_name || ""} ${empData.last_name || ""}`.trim();
  } else if (po.pm_id) {
    uploaderName = `Project Manager (${po.pm_id.substring(0, 8)})`; // Fallback if name is missing
  }

  // Safely map the line items
  const materialsList = (po.purchase_order_materials || []).map((pom: any) => {
    const matData = Array.isArray(pom.materials) ? pom.materials[0] : pom.materials;
    return {
      sku: pom.sku,
      name: matData?.name || "Unknown Material",
      description: matData?.description || "",
      total: pom.total || 0,
      remaining: pom.remaining || 0
    };
  });

  return (
    <div className="min-h-screen p-4 sm:p-8 text-black">
      <div className="max-w-4xl mx-auto">
        <Link href="/purchase-orders" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          &larr; Back to Purchase Orders
        </Link>

        {/* Header card */}
        <div className="bg-blue-200 border-2 border-black rounded-2xl p-5 sm:p-8 mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 shadow-lg">
          <div className="flex flex-col gap-4 w-full">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-700 mb-1">Purchase Order</p>
              {/* Full ID restored with break-all to prevent horizontal scrolling issues on mobile */}
              <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tight break-all">{po.po_number}</h1>
            </div>
            
            {/* CLEAN NEW LAYOUT: Unified metadata box */}
            <div className="bg-white/60 border border-blue-300 rounded-lg p-4 shadow-sm flex flex-col gap-3 w-fit min-w-[300px]">
              
              {/* Top row: Employee and Dates */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 flex-wrap">
                <div className="text-sm text-gray-800">
                  <span className="font-bold text-gray-500 uppercase text-xs tracking-wider mr-2">Uploaded By:</span>
                  <span className="font-black text-base">{uploaderName}</span>
                </div>
                {po.date && (
                  <div className="text-sm text-gray-800">
                    <span className="font-bold text-gray-500 uppercase text-xs tracking-wider mr-2">Order Date:</span>
                    <span className="font-medium">{formatDate(po.date)}</span>
                  </div>
                )}
              </div>

              {/* Bottom row: Clean Destination Route */}
              <div className="pt-3 border-t border-blue-200/60 flex items-center gap-3 text-sm">
                <span className="font-bold text-gray-500 uppercase text-xs tracking-wider">Destination:</span>
                <span className="font-bold text-black">{destinationName}</span>
              </div>

            </div>
          </div>

          {/* Status Badge */}
          {po.status && (
            <span className={`self-start px-3 py-1 rounded text-xs font-bold uppercase whitespace-nowrap border border-black/10 shadow-sm ${STATUS_STYLES[po.status] ?? "bg-gray-100 text-gray-600"}`}>
              {po.status}
            </span>
          )}
        </div>

        {/* Items table */}
        <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight mb-4">Ordered Materials</h2>
        <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="table-header-accent bg-gray-50">
              <tr>
                <th className="p-3 sm:p-4 border-b sticky left-0 z-20 bg-blue-200">#</th>
                <th className="p-3 sm:p-4 border-b">Material</th>
                <th className="p-3 sm:p-4 border-b text-center">Total Qty</th>
                <th className="p-3 sm:p-4 border-b text-center">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {materialsList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-gray-500 italic">No materials found on this order.</td>
                </tr>
              ) : (
                materialsList.map((item, idx) => (
                  <tr key={item.sku} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                    <td className="p-3 sm:p-4 text-sm text-gray-500 font-mono sticky left-0 z-10 bg-white shadow-[1px_0_0_#e5e7eb]">
                      {idx + 1}
                    </td>
                    <td className="p-3 sm:p-4">
                      <div className="font-bold text-black">{item.name}</div>
                      {/* SKU strictly rendered in subdued gray as requested */}
                      <div className="text-xs text-gray-500 font-mono mt-0.5">
                        {item.sku}
                      </div>
                      {item.description && (
                        <div className="text-xs text-gray-500 italic mt-1 line-clamp-2">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="p-3 sm:p-4 text-center font-mono text-lg font-bold text-black">{item.total}</td>
                    <td className="p-3 sm:p-4 text-center font-mono text-lg font-bold text-blue-600">
                      {item.remaining ?? item.total}
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