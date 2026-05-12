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

export type Fulfillment = {
    id: string,
    date: string,
    po_number: string | null, 
    request_id: string | null,
    first_name: string,
    last_name: string
};

export const deliveryHistoryColumns: ColumnDef<Fulfillment>[] = [
    {
    header: 'Date',
    accessorKey: 'date', 
    cell: ({ getValue }) => {
        const rawDate = getValue<string>();
        if (!rawDate) return 'N/A';
        
        // Convert the string to a Date object only for display
        return new Date(rawDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        });
    },
    },
    {
        header: 'Corroborator',
        accessorFn: (row) => `${row.first_name} ${row.last_name || ''}`,
    },
    {
        header: 'Document',
        accessorFn: (row) => `${row.po_number || row.request_id}`
    },
    {
        id: 'action',
        header: 'Action',
        cell: ({ table, row }) => {
            return (
                <div>
                    <Link
                        href={`/delivery/${row.original.id}`}
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