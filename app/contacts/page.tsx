"use client"; // Required for the search functionality

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/DataTable'
import { Employee, employeeColumns } from '@/components/tables/employees/columns'
import Link from 'next/link';
import { useRouter } from 'next/navigation'
import { getUserRole } from '@/lib/actions'
import { Role } from '@/lib/types'

export default function ContactsPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('unassigned');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function getRole() {
      const data = await getUserRole();
      setRole(data);
      setIsLoading(false);
    }
    getRole();
  }, [])
  
  if (isLoading) 
  {
    return (
      <div className="flex justify-center min-h-screen items-center">Loading columns...</div>
    )
  }

  const allContacts : Employee[] = [
    { id: "1", first_name: "John", last_name: "Miller", email: "john@millerhvac.com", role: "administrator", is_active: true },
    { id: "2", first_name: "Sarah", last_name: "Cheng", email: "schen@citypm.org", role: "foreman", is_active: true },
    { id: "3", first_name: "Robert", last_name: "Davis", email: "orders@davisparts.com", role: "logistician", is_active: false },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
          ← Back to Dashboard
        </Link>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-black uppercase tracking-tight">Contact List</h1>
          <Link href="/add-user" className="btn-accent px-4 py-2">
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
          <DataTable columns={ employeeColumns } data={ allContacts } role={ role } /> 
        </div>
      </div>
    </div>
  );
}