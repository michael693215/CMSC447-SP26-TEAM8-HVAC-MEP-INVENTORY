"use client"; // Required for the search functionality

import React, { useState } from 'react';
import Link from 'next/link';

export default function ContactsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const allContacts = [
    { id: 1, name: "John Miller", company: "Miller Residential HVAC", email: "john@millerhvac.com", phone: "(555) 123-4567", type: "Contractor" },
    { id: 2, name: "Sarah Chen", company: "City Property Mgmt", email: "schen@citypm.org", phone: "(555) 987-6543", type: "Commercial" },
    { id: 3, name: "Robert Davis", company: "Davis Parts & Supply", email: "orders@davisparts.com", phone: "(555) 444-5566", type: "Vendor" },
  ];

  // Filter logic: Checks if name or company includes the search text
  const filteredContacts = allContacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          ← Back to Dashboard
        </Link>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-black uppercase tracking-tight">Contact List</h1>
          <Link href="/add-userk" className="btn-accent px-4 py-2">
            Add New Contact
          </Link>
        </div>

        {/* --- SEARCH BAR SECTION --- */}
        <div className="bg-white p-4 rounded-t-lg border-x border-t border-gray-200 flex gap-4 items-center">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              🔍
            </span>
            <input 
              type="text"
              placeholder="Search by name or company..."
              className="input-themed block w-full pl-10 pr-3 py-2 leading-5 text-black placeholder-gray-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-secondary">
            Filters
          </button>
        </div>

        {/* Table Section */}
        <div className="bg-white shadow-md rounded-b-lg overflow-hidden border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead className="table-header-accent">
              <tr>
                <th className="p-4 border-b">Contact Name</th>
                <th className="p-4 border-b">Company / Org</th>
                <th className="p-4 border-b">Email Address</th>
                <th className="p-4 border-b">Phone</th>
                <th className="p-4 border-b">Type</th>
                <th className="p-4 border-b text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.length > 0 ? (
                filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-blue-50 text-black transition-colors">
                    <td className="p-4 border-b font-bold">{contact.name}</td>
                    <td className="p-4 border-b text-gray-700">{contact.company}</td>
                    <td className="p-4 border-b text-blue-600 underline">
                      <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    </td>
                    <td className="p-4 border-b font-mono text-sm">{contact.phone}</td>
                    <td className="p-4 border-b">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-gray-200 text-gray-700 uppercase">
                        {contact.type}
                      </span>
                    </td>
                    <td className="p-4 border-b text-center">
                      <button className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded border border-gray-300 transition">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-500 italic">
                    No contacts found matching "{searchTerm}"
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