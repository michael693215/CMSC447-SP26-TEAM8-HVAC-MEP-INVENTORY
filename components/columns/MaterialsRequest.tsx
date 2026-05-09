"use client";
import { ColumnDef } from '@tanstack/react-table'
import { MoreVertical } from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// 1. The Type Definition
// This represents the flattened data object after your backend joins the two tables
export type MaterialsRequestItem = {
    request_id: string,
    from_id: string,
    to_id: string,
    status: 'pending' | 'completed'
};

// 2. The Column Definitions
export const materialsRequestColumns: ColumnDef<MaterialsRequestItem>[] = [
    {
        accessorKey: 'request_id',
        header: 'Request ID',
    },
    {
        accessorKey: 'from_id',
        header: 'From',
    },
    {
        accessorKey: 'to_id',
        header: 'To',
    },
    {
        accessorKey: 'status',
        header: 'Status',
        // Optional: Capitalize the status for better UI presentation
        cell: ({ row }) => {
            const status = row.original.status;
            return <span className="capitalize">{status}</span>;
        }
    },
    {
        id: 'action',
        header: ({ table }) => {
            const role = (table.options.meta as any)?.role;
            // You can adjust which roles see the action column here
            return (role == 'administrator' || role == 'project_manager') ? "Action" : null;
        },
        cell: ({ table, row }) => {
            const role = (table.options.meta as any)?.role;  
            
            if (role == 'administrator' || role == 'project_manager') return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                            {/* Update this URL path to match where you want the user to go */}
                            <Link href={`/materials-requests/${row.original.request_id}`}>
                                View Details
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    }
];