"use client"; 

import React, { useState } from 'react';
import Link from 'next/link';

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");

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
      deliveries: ["DEL-441 (Feb 10)", "DEL-990 (Mar 22)"]
    },
  ];

  const filteredProducts = products.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          ← Back to Main Menu
        </Link>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold uppercase tracking-tight">Inventory Management</h1>
          {/* Using the brighter blue from your screenshot */}
          <button className="bg-blue-200 text-black px-4 py-2 rounded-md hover:bg-blue-700 transition font-bold shadow-sm">
            + Add New Product
          </button>
        </div>

        {/* SEARCH BAR SECTION */}
        <div className="bg-white p-4 rounded-t-lg border-x border-t border-gray-200">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              🔍
            </span>
            <input 
              type="text"
              placeholder="Search by part name or description..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white shadow-md rounded-b-lg overflow-hidden border border-gray-200">
          <table className="w-full text-left border-collapse">
            {/* Header set to the vibrant blue to match your UI */}
            <thead className="bg-blue-200 text-black uppercase text-xs tracking-wider font-bold">
              <tr>
                <th className="p-4 border-b border-blue-700">Product</th>
                <th className="p-4 border-b border-blue-700">Description</th>
                <th className="p-4 border-b border-blue-700 text-center">Quantity</th>
                <th className="p-4 border-b border-blue-700">Status</th>
                <th className="p-4 border-b border-blue-700">Associated Deliveries</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50 transition-colors border-b border-gray-100">
                    <td className="p-4 font-bold">{item.name}</td>
                    <td className="p-4 text-gray-600 italic text-sm">{item.description}</td>
                    <td className="p-4 text-center font-mono">{item.qty}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        item.status === "Low Stock" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <select className="bg-gray-50 border border-gray-300 text-sm rounded-lg block w-full p-2 outline-none focus:border-blue-600">
                        <option>View Deliveries ({item.deliveries.length})</option>
                        {item.deliveries.map((delivery, idx) => (
                          <option key={idx}>{delivery}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-gray-500 italic">
                    No product found "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}