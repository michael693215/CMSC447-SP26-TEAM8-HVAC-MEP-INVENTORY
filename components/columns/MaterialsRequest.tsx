"use client";

import { ColumnDef } from '@tanstack/react-table'
import Link from 'next/link'

// 1. Update your type to expect the names!
export type MaterialsRequestItem = {
    request_id: string,
    from_name: string, // Changed from from_id
    to_name: string,   // Changed from to_id
    status: 'pending' | 'completed'
};

export const materialsRequestColumns: ColumnDef<MaterialsRequestItem>[] = [
    {
        accessorKey: 'request_id',
        header: 'Request ID',
        cell: ({ row }) => <span className="font-bold text-gray-900">{row.original.request_id}</span>
    },
    {
        accessorKey: 'from_name', // Tell the table to look for the new stitched name
        header: 'From',
    },
    {
        accessorKey: 'to_name', // Tell the table to look for the new stitched name
        header: 'To',
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.original.status;
            
            let bgClass = "bg-gray-200 text-gray-600";
            if (status === "completed") bgClass = "bg-green-100 text-green-700";
            if (status === "pending") bgClass = "bg-yellow-100 text-yellow-700";
            
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
            const role = (table.options.meta as any)?.role;  
            
            if (role == 'administrator' || role == 'project_manager'|| role == 'foreman') return (
                <div className="text-center">
                    <Link
                        href={`/materials-requests/${row.original.request_id}`}
                        className="text-xs bg-blue-200 hover:bg-gray-800 hover:text-white px-3 py-1 rounded border border-black transition font-bold whitespace-nowrap"
                    >
                        View Details
                    </Link>
                </div>
            )
            return null;
        }
    }
];