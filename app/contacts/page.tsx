"use client";

import React, { useState } from 'react';
import Link from 'next/link';

type SortKey = "name" | "company" | "type";
type SortDir = "asc" | "desc";

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="ml-1 text-gray-400 text-xs">↕</span>;
  return <span className="ml-1 text-xs">{dir === "asc" ? "↑" : "↓"}</span>;
}

const allContacts = [
  { id: 1, name: "John Miller", company: "Miller Residential HVAC", email: "john@millerhvac.com", phone: "(555) 123-4567", type: "Contractor" },
  { id: 2, name: "Sarah Chen", company: "City Property Mgmt", email: "schen@citypm.org", phone: "(555) 987-6543", type: "Commercial" },
  { id: 3, name: "Robert Davis", company: "Davis Parts & Supply", email: "orders@davisparts.com", phone: "(555) 444-5566", type: "Vendor" },
];

export default function ContactsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "name", dir: "asc" });

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  }

  const filtered = allContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const cmp = a[sort.key].localeCompare(b[sort.key]);
    return sort.dir === "asc" ? cmp : -cmp;
  });

  function Th({ col, label, center }: { col: SortKey; label: string; center?: boolean }) {
    return (
      <th
        className={`p-3 sm:p-4 border-b cursor-pointer select-none hover:bg-black/5 whitespace-nowrap ${center ? "text-center" : ""}`}
        onClick={() => toggleSort(col)}
      >
        {label}
        <SortArrow active={sort.key === col} dir={sort.dir} />
      </th>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          ← Back to Dashboard
        </Link>

        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-black uppercase tracking-tight">Contact List</h1>
          <button className="btn-accent px-4 py-2 shrink-0">
            Add New Contact
          </button>
        </div>

        {/* Search bar */}
        <div className="bg-white p-3 sm:p-4 rounded-t-lg border-x border-t border-gray-200">
          <div className="relative w-full">
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
        </div>

        {/* Table — horizontally scrollable on small screens */}
        <div className="bg-white shadow-md rounded-b-lg overflow-x-auto border border-gray-200">
          <table className="w-full min-w-[560px] text-left border-collapse">
            <thead className="table-header-accent">
              <tr>
                <Th col="name" label="Contact Name" />
                <Th col="company" label="Company / Org" />
                <th className="p-3 sm:p-4 border-b">Email</th>
                <th className="p-3 sm:p-4 border-b">Phone</th>
                <Th col="type" label="Type" />
                <th className="p-3 sm:p-4 border-b text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length > 0 ? (
                sorted.map((contact) => (
                  <tr key={contact.id} className="hover:bg-blue-50 text-black transition-colors">
                    <td className="p-3 sm:p-4 border-b font-bold whitespace-nowrap">{contact.name}</td>
                    <td className="p-3 sm:p-4 border-b text-gray-700">{contact.company}</td>
                    <td className="p-3 sm:p-4 border-b text-blue-600 underline">
                      <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    </td>
                    <td className="p-3 sm:p-4 border-b font-mono text-sm whitespace-nowrap">{contact.phone}</td>
                    <td className="p-3 sm:p-4 border-b">
                      <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-gray-200 text-gray-700 uppercase whitespace-nowrap">
                        {contact.type}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 border-b text-center">
                      <button className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded border border-gray-300 transition">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-500 italic">
                    No contacts found matching &ldquo;{searchTerm}&rdquo;
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
