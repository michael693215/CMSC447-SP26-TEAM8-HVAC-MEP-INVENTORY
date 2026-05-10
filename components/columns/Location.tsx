"use client";

import { ColumnDef } from '@tanstack/react-table';

export interface LocationAddress {
  address_number: string | number;
  street_number: string;
  street_name: string;
  city: string;
  state: string;
  zipcode: string;
}

export interface LocationRow {
  id: string;
  name: string; // Added the new name column
  address_id: number | string;
  location_address: LocationAddress | null;
}

export const getLocationColumns = (
    onDelete: (loc: LocationRow) => void
): ColumnDef<LocationRow>[] => [
    {
        id: 'name',
        header: 'Location Name',
        accessorFn: (row) => row.name || '—',
        cell: ({ getValue }) => <span className="font-black text-black">{getValue() as string}</span>,
    },
    {
        id: 'street',
        header: 'Street',
        accessorFn: (row) => row.location_address ? `${row.location_address.street_number} ${row.location_address.street_name}` : '—',
        cell: ({ getValue }) => <span className="font-bold text-gray-800">{getValue() as string}</span>,
    },
    {
        id: 'city',
        header: 'City',
        accessorFn: (row) => row.location_address?.city ?? '—',
        cell: ({ getValue }) => <span className="text-gray-700">{getValue() as string}</span>,
    },
    {
        id: 'state',
        header: 'State',
        accessorFn: (row) => row.location_address?.state ?? '—',
        cell: ({ getValue }) => <span className="text-gray-700">{getValue() as string}</span>,
    },
    {
        id: 'zipcode',
        header: 'Zipcode',
        accessorFn: (row) => row.location_address?.zipcode ?? '—',
        cell: ({ row, getValue }) => (
            <div className="flex items-center justify-between gap-3 font-mono text-sm">
                <span>{getValue() as string}</span>
                <button
                    onClick={() => onDelete(row.original)}
                    title="Delete location"
                    className="p-1.5 rounded-full bg-red-100 hover:bg-red-600 text-red-500 hover:text-white transition-colors shrink-0"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        ),
    }
];