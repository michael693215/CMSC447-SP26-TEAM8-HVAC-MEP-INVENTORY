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

export type LocationMaterial = {
    id: string,
    location_id: string,
    available_quantity: number, 
    sku: string,
    name: string,
};

export const locationMaterialsColumns: ColumnDef<LocationMaterial>[] = [
    {
    header: 'Material',
    accessorKey: 'name',
    cell: ({ row }) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 'bold' }}>{row.original.name}</span>
        <span style={{ fontSize: '0.85em', color: '#666' }}>{row.original.sku}</span>
        </div>
    ),
    },
    {
        accessorKey: 'available_quantity',
        header: 'Quantity'
    },
    {
        id: 'action',
        header: 'Action',
        cell: ({ table, row }) => {
            return (
                <div>
                    <Link
                        href={`/materials/${row.original.sku}`}
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