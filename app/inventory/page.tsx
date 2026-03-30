import Link from 'next/link';

export default function InventoryPage() {
  // 1. Updated data structure to include an array of deliveries for each product
  const products = [
    { 
      id: 1, 
      name: "Filter 16x25x1", 
      description: "Standard pleated air filter",
      qty: 45, 
      status: "In Stock",
      deliveries: ["DEL-102 (Mar 15)", "DEL-205 (Apr 02)"]
    },
    { 
      id: 2, 
      name: "Capacitor 45/5 MFD", 
      description: "Dual run capacitor for AC",
      qty: 12, 
      status: "Low Stock",
      deliveries: ["DEL-882 (Mar 20)"]
    },
    { 
      id: 3, 
      name: "Thermostat T6 Pro", 
      description: "Programmable Wi-Fi thermostat",
      qty: 8, 
      status: "In Stock",
      deliveries: ["DEL-441 (Feb 10)", "DEL-990 (Mar 22)", "DEL-112 (Apr 05)"]
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Back */}
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Main Menu
        </Link>

        <h1 className="text-3xl font-bold mb-6 text-black uppercase tracking-tight">View Inventory</h1>

        {/* Updated Table */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="bg-blue-200 text-black uppercase text-xs tracking-wider">
              <tr>
                <th className="p-4 border-b">Product</th>
                <th className="p-4 border-b">Description</th>
                <th className="p-4 border-b text-center">Quantity</th>
                <th className="p-4 border-b">Status</th>
                <th className="p-4 border-b">Associated Deliveries</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50 text-black transition-colors">
                  <td className="p-4 border-b font-bold">{item.name}</td>
                  <td className="p-4 border-b text-gray-600 italic">{item.description}</td>
                  <td className="p-4 border-b text-center font-mono">{item.qty}</td>
                  <td className="p-4 border-b">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      item.status === "Low Stock" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  {/* Dropdown Menu Column */}
                  <td className="p-4 border-b">
                    <select className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5">
                      <option defaultValue="">View Deliveries ({item.deliveries.length})</option>
                      {item.deliveries.map((delivery, index) => (
                        <option key={index} value={delivery}>
                          {delivery}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}