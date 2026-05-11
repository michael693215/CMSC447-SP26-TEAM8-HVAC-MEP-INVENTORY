"use client"; // Required for the search functionality

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/DataTable'
import { Employee, employeeColumns } from '@/components/columns/Employee'
import Link from 'next/link';
import { useRouter } from 'next/navigation'
import { getUserRole } from '@/lib/actions'
import { Role } from '@/lib/types'
import { getEmployees } from './actions'

export default function ContactsPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>('unassigned');
  const [data, setData] = useState<Employee[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function getRole() {
      const permissions = await getUserRole();
      const data = await getEmployees();
      setData(data);
      setRole(permissions);
      setIsLoading(false);
    }
    getRole();
  }, [])

  useEffect(() => {
      if (!isLoading && !data)
      {
          router.back();
      }
  }, [isLoading, data, router]);

  if (isLoading) 
  {
    return (
      <div className="flex justify-center min-h-screen items-center">Loading columns...</div>
    )
  }
  if (!data)
  {
    return (
      <div className="flex justify-center min-h-screen items-center">Failed to load columns. Redirecting...</div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block font-medium">
        &larr; Back to Dashboard
      </Link>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black uppercase tracking-tight">Contact List</h1>
        <Link href="/add-user" className="btn-accent px-4 py-2">
          + Add New Contact
        </Link>
      </div>

      {/* Search bar */}
      <div className="bg-white p-3 sm:p-4 rounded-t-lg border-x border-t border-gray-200">
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
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

      {/* Table Section */}
      <div className="bg-white shadow-md rounded-b-lg overflow-hidden border border-gray-200">
        <DataTable columns={ employeeColumns } data={ data } role={ role } /> 
      </div>
    </div>
  );
}