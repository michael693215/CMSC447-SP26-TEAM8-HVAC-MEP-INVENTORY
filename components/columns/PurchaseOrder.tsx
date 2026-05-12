"use client";

import { ColumnDef } from '@tanstack/react-table';
import Link from 'next/link';

export type PurchaseOrderItem = {
    po_number: string;
    date: string | null;
    status: string;
    location_name: string;
    items_count: number;
};

export const getPurchaseOrderColumns = (
    onDelete: (po: PurchaseOrderItem) => void
): ColumnDef<PurchaseOrderItem>[] => [
    {
        accessorKey: 'po_number',
        header: 'PO #',
        cell: ({ row }) => (
            <span className="font-bold text-black">
                {row.original.po_number}
            </span>
        )
    },
    {
        accessorKey: 'date',
        header: 'Order Date',
        cell: ({ row }) => row.original.date || "—"
    },
    {
        accessorKey: 'items_count',
        header: () => <div className="text-center">Materials</div>,
        cell: ({ row }) => (
            <div className="text-center font-mono text-lg font-bold">
                {row.original.items_count}
            </div>
        )
    },
    {
        accessorKey: 'location_name',
        header: 'Location',
        cell: ({ row }) => <span className="text-gray-700">{row.original.location_name}</span>
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.original.status || "Pending";
            
            let bgClass = "bg-gray-100 text-gray-600";
            // FIXED: Added "completed" and "Completed" to the green badge logic
            if (status === "Received" || status === "completed" || status === "Completed") bgClass = "bg-green-100 text-green-700";
            if (status === "In Transit") bgClass = "bg-blue-100 text-blue-700";
            if (status === "Pending" || status === "pending") bgClass = "bg-yellow-100 text-yellow-700";

            return (
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase whitespace-nowrap ${bgClass}`}>
                    {status}
                </span>
            );
        }
    },
    {
        id: 'action',
        header: () => <div className="text-center">Action</div>,
        cell: ({ table, row }) => {
            // Using the role passed through DataTable meta
            const role = (table.options.meta as any)?.role;

            if (role === 'administrator' || role === 'project_manager') {
                return (
                    <div className="flex items-center justify-center gap-3">
                        <Link
                            href={`/purchase-orders/${row.original.po_number}`}
                            className="text-xs bg-blue-200 hover:bg-gray-800 hover:text-white px-3 py-1 rounded border border-black transition font-bold whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()} // Prevent row click from firing
                        >
                            View Details
                        </Link>
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent row click from firing
                                onDelete(row.original);
                            }}
                            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-600 text-red-600 hover:text-white transition"
                            title="Delete purchase order"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                );
            }
            return null;
        }
    }
];